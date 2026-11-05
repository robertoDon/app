-- Painel da sala. Tudo sai do que a sala já registra (tarefas, propostas, votos); ninguém digita número.
-- 1. Quem aprova o quê: a proposta pode dizer de quem precisa do sim (aprovadores). Só essas pessoas votam.
-- 2. Frente: etiqueta opcional da tarefa (Módulo 1, Comercial...), para ver o avanço por frente.
-- 3. Plano: proposta com uma lista de tarefas. Aprovada, as tarefas nascem sozinhas com o prazo previsto
--    (linha de base). Mudar o previsto só com um plano novo aprovado; o prazo do dia a dia continua editável.
-- 4. painel_sala: os números do painel, os mesmos para as pessoas (app) e para os agentes (ver_painel).
-- 5. minha_fila: o que espera por você em todas as salas.

-- ---------------------------------------------------------------- colunas

alter table public.mensagens add column if not exists aprovadores uuid[];
alter table public.mensagens add column if not exists plano jsonb;
alter table public.mensagens drop constraint if exists mensagens_aprovadores_check;
alter table public.mensagens add constraint mensagens_aprovadores_check
  check (aprovadores is null or (tipo = 'proposta' and novo_contexto is null and cardinality(aprovadores) between 1 and 20));
alter table public.mensagens drop constraint if exists mensagens_plano_check;
alter table public.mensagens add constraint mensagens_plano_check
  check (plano is null or (tipo = 'proposta' and novo_contexto is null and jsonb_typeof(plano) = 'array' and jsonb_array_length(plano) between 1 and 60));

alter table public.tarefas add column if not exists frente text;
alter table public.tarefas drop constraint if exists tarefas_frente_check;
alter table public.tarefas add constraint tarefas_frente_check check (frente is null or char_length(frente) between 1 and 40);
alter table public.tarefas add column if not exists prazo_previsto timestamptz;
alter table public.tarefas add column if not exists plano bigint references public.mensagens (id) on delete set null;
create index if not exists tarefas_frente on public.tarefas (sala_id, frente);

-- ---------------------------------------------------------------- proposta: confere quem aprova e o plano

create or replace function public.checar_proposta() returns trigger
language plpgsql security definer set search_path = '' as $$
declare
  i jsonb;
  itens jsonb := '[]'::jsonb;
  pz timestamptz;
  tid bigint;
  r uuid;
begin
  if tg_op = 'UPDATE' then
    if new.aprovadores is distinct from old.aprovadores or new.plano is distinct from old.plano then
      raise exception 'Quem aprova e o plano não mudam depois de propor. Faça uma proposta nova.';
    end if;
    return new;
  end if;

  if new.aprovadores is not null then
    new.aprovadores := array(select distinct u from unnest(new.aprovadores) u where u is not null);
    if cardinality(new.aprovadores) = 0 then
      new.aprovadores := null;
    elsif exists (select 1 from unnest(new.aprovadores) u where not exists (
      select 1 from public.membros m where m.sala_id = new.sala_id and m.user_id = u and m.papel in ('dono', 'membro'))) then
      raise exception 'Quem aprova precisa ser uma pessoa da sala que pode escrever.';
    end if;
  end if;

  if new.plano is not null then
    if jsonb_typeof(new.plano) <> 'array' then raise exception 'O plano precisa ser uma lista de tarefas.'; end if;
    for i in select * from jsonb_array_elements(new.plano) loop
      if jsonb_typeof(i) <> 'object' or btrim(coalesce(i->>'titulo', '')) = '' then
        raise exception 'Toda tarefa do plano precisa de título.';
      end if;
      r := nullif(i->>'responsavel', '')::uuid;
      if r is not null and not exists (select 1 from public.membros m where m.sala_id = new.sala_id and m.user_id = r) then
        raise exception 'O responsável de "%" precisa estar na sala.', i->>'titulo';
      end if;
      begin
        pz := nullif(i->>'prazo', '')::timestamptz;
      exception when others then
        raise exception 'Prazo inválido no plano: %', i->>'prazo';
      end;
      tid := nullif(i->>'tarefa', '')::bigint;
      if tid is not null and not exists (select 1 from public.tarefas t where t.id = tid and t.sala_id = new.sala_id and t.estado <> 'cancelada') then
        raise exception 'A tarefa % não está nesta sala.', tid;
      end if;
      itens := itens || jsonb_build_array(jsonb_strip_nulls(jsonb_build_object(
        'titulo', left(btrim(i->>'titulo'), 200),
        'frente', nullif(left(btrim(coalesce(i->>'frente', '')), 40), ''),
        'responsavel', r,
        'responsavel_agente', case when r is null then null else nullif(left(btrim(coalesce(i->>'responsavel_agente', '')), 40), '') end,
        'prazo', pz,
        'tarefa', tid)));
    end loop;
    new.plano := itens;
  end if;
  return new;
end $$;
revoke execute on function public.checar_proposta() from public, anon, authenticated;
drop trigger if exists checar_proposta on public.mensagens;
create trigger checar_proposta before insert or update of aprovadores, plano on public.mensagens
for each row execute function public.checar_proposta();

-- ---------------------------------------------------------------- quantas aprovações e quem falta

create or replace function public.aprovacoes_da_proposta(proposta bigint) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when p.novo_contexto is not null
      then greatest(1, (select count(*)::int from public.membros m where m.sala_id = p.sala_id and m.papel in ('dono', 'membro')))
    when p.aprovadores is not null then cardinality(p.aprovadores)
    else public.aprovacoes_necessarias(p.sala_id) end
  from public.mensagens p where p.id = proposta;
$$;
grant execute on function public.aprovacoes_da_proposta(bigint) to authenticated, service_role;

-- quem ainda pode aprovar e não aprovou: os aprovadores indicados, senão quem escreve na sala
create or replace function public.faltam_na_proposta(proposta bigint) returns uuid[]
language sql stable security definer set search_path = '' as $$
  select array(
    select u from unnest(coalesce(p.aprovadores,
      array(select m.user_id from public.membros m where m.sala_id = p.sala_id and m.papel in ('dono', 'membro')))) u
    where not exists (select 1 from public.votos v where v.proposta_id = p.id and v.user_id = u))
  from public.mensagens p where p.id = proposta;
$$;
revoke execute on function public.faltam_na_proposta(bigint) from public, anon;
grant execute on function public.faltam_na_proposta(bigint) to authenticated, service_role;

-- ---------------------------------------------------------------- decidir: só quem foi indicado; plano vira tarefas

create or replace function public.decidir(proposta bigint, aprovar boolean, nota text default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  p public.mensagens;
  e text := case when aprovar then 'aprovada' else 'recusada' end;
  n text := nullif(btrim(coalesce(nota, '')), '');
  nova bigint;
  titulo text;
  votos_sim int;
  i jsonb;
  pz timestamptz;
  tid bigint;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas decidem propostas.'; end if;
  select * into p from public.mensagens where id = proposta and tipo = 'proposta' for update;
  if not found or not public.eh_membro(p.sala_id) then raise exception 'Proposta não encontrada.'; end if;
  if p.apagada then raise exception 'Esta proposta foi apagada.'; end if;
  if p.estado <> 'pendente' then raise exception 'Esta proposta já foi decidida.'; end if;
  if not public.pode_escrever(p.sala_id) then raise exception 'Nesta sala você só acompanha.'; end if;
  if p.aprovadores is not null and not (auth.uid() = any(p.aprovadores)) then
    raise exception 'Esta proposta precisa do sim de %.',
      (select string_agg(split_part(pf.nome, ' ', 1), ', ') from public.perfis pf where pf.id = any(p.aprovadores));
  end if;

  if aprovar then
    if exists (select 1 from public.votos v where v.proposta_id = proposta and v.user_id = auth.uid()) then
      raise exception 'Você já aprovou esta proposta. Falta a aprovação de outra pessoa.';
    end if;
    insert into public.votos (proposta_id, sala_id, user_id) values (proposta, p.sala_id, auth.uid());
    select count(*) into votos_sim from public.votos v where v.proposta_id = proposta;
    if votos_sim < public.aprovacoes_da_proposta(proposta) then
      perform public._registrar(p.sala_id, auth.uid(), null, 'aprovou (falta outra aprovação)', left(split_part(btrim(p.texto), E'\n', 1), 200));
      return null;
    end if;
  end if;

  update public.mensagens set estado = e, decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(),
    coalesce(left(n, 2000), case when not aprovar then 'Recusada.'
      when p.novo_contexto is not null then 'Aprovada. O contexto da sala foi trocado pelo texto da proposta.'
      when p.plano is not null then 'Aprovada. O plano virou tarefas, com o prazo previsto de cada uma.'
      else 'Aprovada.' end),
    'decisao', e, proposta)
  returning id into nova;

  if aprovar and p.novo_contexto is not null then
    update public.salas set contexto = btrim(p.novo_contexto) where id = p.sala_id;
  elsif aprovar and p.plano is not null then
    -- cada item vira tarefa (ou atualiza a tarefa que ele cita); o prazo aprovado vira o previsto
    for i in select * from jsonb_array_elements(p.plano) loop
      pz := nullif(i->>'prazo', '')::timestamptz;
      tid := nullif(i->>'tarefa', '')::bigint;
      if tid is not null then
        update public.tarefas t set titulo = i->>'titulo', frente = i->>'frente', responsavel = nullif(i->>'responsavel', '')::uuid,
          responsavel_agente = i->>'responsavel_agente', prazo = pz, prazo_previsto = pz, plano = proposta
        where t.id = tid and t.sala_id = p.sala_id and t.estado <> 'cancelada';
        if found then continue; end if;
      end if;
      insert into public.tarefas (sala_id, titulo, origem, frente, responsavel, responsavel_agente, prazo, prazo_previsto, plano, criada_por, criada_por_agente)
      values (p.sala_id, i->>'titulo', proposta, i->>'frente', nullif(i->>'responsavel', '')::uuid, i->>'responsavel_agente', pz, pz, proposta, p.user_id, p.agente);
    end loop;
  elsif aprovar then
    titulo := btrim(regexp_replace(regexp_replace(split_part(btrim(p.texto), E'\n', 1), '[*_`#>]', '', 'g'), '^(eu\s+)?(proponho|sugiro|posso)\s+', '', 'i'));
    titulo := upper(left(titulo, 1)) || substr(titulo, 2);
    if char_length(titulo) > 120 then titulo := left(titulo, 119) || '…'; end if;
    if titulo = '' then titulo := 'Executar a proposta aprovada'; end if;
    insert into public.tarefas (sala_id, titulo, origem, responsavel, responsavel_agente, criada_por)
    values (p.sala_id, titulo, proposta, p.user_id, p.agente, auth.uid());
  end if;
  return nova;
end $$;
revoke execute on function public.decidir(bigint, boolean, text) from public, anon;
grant execute on function public.decidir(bigint, boolean, text) to authenticated;

-- tarefas de um plano não mandam um aviso cada: a decisão já avisa a sala
drop trigger if exists chamar_avisar_tarefa on public.tarefas;
create trigger chamar_avisar_tarefa after insert on public.tarefas
for each row when (new.plano is null) execute function public.chamar_avisar_tarefa();
drop trigger if exists chamar_avisar_tarefa_troca on public.tarefas;
create trigger chamar_avisar_tarefa_troca after update of responsavel, responsavel_agente on public.tarefas
for each row when (new.estado = 'aberta' and new.plano is not distinct from old.plano and (new.responsavel is distinct from old.responsavel
  or new.responsavel_agente is distinct from old.responsavel_agente))
execute function public.chamar_avisar_tarefa();

-- ---------------------------------------------------------------- tarefas com frente (pessoas, pelo app)

drop function if exists public.criar_tarefa(uuid, text, bigint, uuid, text, timestamptz);
create or replace function public.criar_tarefa(sala uuid, titulo text, origem bigint default null,
  responsavel uuid default null, responsavel_agente text default null, prazo timestamptz default null, frente text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare t bigint;
begin
  if not public.eh_pessoa() or not public.eh_membro(sala) then raise exception 'Você não está nesta sala.'; end if;
  perform public._checar_responsavel(sala, responsavel);
  if origem is not null and not exists (select 1 from public.mensagens m where m.id = origem and m.sala_id = sala) then
    origem := null;
  end if;
  insert into public.tarefas (sala_id, titulo, origem, responsavel, responsavel_agente, prazo, frente, criada_por)
  values (sala, left(btrim(titulo), 200), origem, responsavel, nullif(btrim(coalesce(responsavel_agente, '')), ''), prazo,
    nullif(left(btrim(coalesce(criar_tarefa.frente, '')), 40), ''), auth.uid())
  returning id into t;
  return t;
end $$;
revoke execute on function public.criar_tarefa(uuid, text, bigint, uuid, text, timestamptz, text) from public, anon;
grant execute on function public.criar_tarefa(uuid, text, bigint, uuid, text, timestamptz, text) to authenticated;

-- frente null = mantém; '' = tira
drop function if exists public.editar_tarefa(bigint, text, uuid, text, timestamptz, text, boolean);
create or replace function public.editar_tarefa(tarefa bigint, titulo text, responsavel uuid, responsavel_agente text,
  prazo timestamptz, estado text default 'aberta', reabrir boolean default false, frente text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.tarefas;
begin
  select * into t from public.tarefas where id = tarefa for update;
  if not found or not public.eh_pessoa() or not public.eh_membro(t.sala_id) then raise exception 'Tarefa não encontrada.'; end if;
  if estado not in ('aberta', 'cancelada') then raise exception 'Para concluir, use Concluir.'; end if;
  if t.estado <> 'aberta' and not reabrir then
    raise exception 'Esta tarefa acabou de ser %. Veja a lista atualizada.', case t.estado when 'feita' then 'concluída' else 'cancelada' end;
  end if;
  perform public._checar_responsavel(t.sala_id, responsavel);
  update public.tarefas set titulo = left(btrim(editar_tarefa.titulo), 200), responsavel = editar_tarefa.responsavel,
    responsavel_agente = nullif(btrim(coalesce(editar_tarefa.responsavel_agente, '')), ''), prazo = editar_tarefa.prazo,
    estado = editar_tarefa.estado, concluida_em = null, concluida_por = null, concluida_por_agente = null,
    resultado = case when editar_tarefa.estado = 'aberta' then null else resultado end,
    frente = case when editar_tarefa.frente is null then t.frente else nullif(left(btrim(editar_tarefa.frente), 40), '') end
  where id = tarefa;
end $$;
revoke execute on function public.editar_tarefa(bigint, text, uuid, text, timestamptz, text, boolean, text) from public, anon;
grant execute on function public.editar_tarefa(bigint, text, uuid, text, timestamptz, text, boolean, text) to authenticated;

-- ---------------------------------------------------------------- o painel

create or replace function public.painel_sala(sala uuid) returns jsonb
language plpgsql stable security definer set search_path = '' as $$
declare r jsonb;
begin
  -- pessoas: só das próprias salas; o servidor dos agentes (service role) já confere a sala antes
  if auth.uid() is not null and not public.eh_membro(sala) then raise exception 'Sala não encontrada.'; end if;

  with ts as (
    select * from public.tarefas t where t.sala_id = sala and t.estado <> 'cancelada'
  ), pend as (
    select p.id, p.user_id, p.agente, p.criada_em, p.plano is not null as plano,
      left(btrim(regexp_replace(split_part(btrim(p.texto), E'\n', 1), '[*_`#>]', '', 'g')), 140) as titulo,
      public.aprovacoes_da_proposta(p.id) as precisa,
      (select count(*)::int from public.votos v where v.proposta_id = p.id) as votos,
      public.faltam_na_proposta(p.id) as faltam,
      p.aprovadores is not null as indicados
    from public.mensagens p
    where p.sala_id = sala and p.tipo = 'proposta' and p.estado = 'pendente' and not p.apagada
  ), fila as (
    -- exato: todo mundo que falta precisa aprovar (indicados, troca de contexto, ou a sala pede o sim de todos)
    select pend.*, (indicados or precisa - votos >= cardinality(faltam)) as exato from pend
  ), fr as (
    select coalesce(frente, '') as frente, (frente is null) as sem,
      count(*)::int as total,
      count(*) filter (where estado = 'feita')::int as feitas,
      count(*) filter (where estado = 'aberta' and prazo < now())::int as atrasadas,
      max(prazo_previsto) as previsto,
      max(case when estado = 'feita' then concluida_em when prazo is not null then greatest(prazo, now()) end)
        filter (where prazo_previsto is not null) as projecao
    from ts group by 1, 2
  )
  select jsonb_build_object(
    'agora', now(),
    'nomes', coalesce((select jsonb_object_agg(m.user_id, pf.nome) from public.membros m join public.perfis pf on pf.id = m.user_id where m.sala_id = sala), '{}'),
    'totais', (select jsonb_build_object(
        'abertas', count(*) filter (where estado = 'aberta'),
        'feitas', count(*) filter (where estado = 'feita'),
        'atrasadas', count(*) filter (where estado = 'aberta' and prazo < now()),
        'sem_responsavel', count(*) filter (where estado = 'aberta' and responsavel is null)) from ts),
    'frentes', coalesce((select jsonb_agg(jsonb_build_object(
        'frente', frente, 'total', total, 'feitas', feitas, 'atrasadas', atrasadas, 'previsto', previsto, 'projecao', projecao,
        'desvio_dias', case when previsto is not null and projecao is not null then ceil(extract(epoch from projecao - previsto) / 86400)::int end)
        order by sem, frente) from fr), '[]'),
    'propostas', coalesce((select jsonb_agg(jsonb_build_object(
        'id', id, 'titulo', titulo, 'user_id', user_id, 'agente', agente, 'criada_em', criada_em, 'plano', plano,
        'precisa', precisa, 'votos', votos, 'faltam', to_jsonb(faltam), 'exato', exato) order by criada_em) from fila), '[]'),
    'esperando', coalesce((select jsonb_agg(jsonb_build_object('user_id', e.u, 'propostas', e.n) order by e.n desc)
        from (select u, count(*)::int as n from fila, unnest(fila.faltam) u where fila.exato group by u) e), '[]'),
    'atrasadas', coalesce((select jsonb_agg(to_jsonb(x) order by x.prazo) from (
        select id, titulo, frente, prazo, responsavel, responsavel_agente from ts
        where estado = 'aberta' and prazo < now() order by prazo limit 10) x), '[]'),
    'ritmo', (select jsonb_agg(jsonb_build_object('semana', s::date,
        'feitas', (select count(*) from ts where estado = 'feita' and concluida_em >= s and concluida_em < s + interval '7 days')) order by s)
        from generate_series(date_trunc('week', now()) - interval '7 weeks', date_trunc('week', now()), interval '1 week') s),
    'tarefas', coalesce((select jsonb_agg(to_jsonb(x) order by x.id) from (
        select id, titulo, frente, estado, criada_em, prazo, prazo_previsto, concluida_em from ts
        where prazo is not null or prazo_previsto is not null order by id desc limit 120) x), '[]')
  ) into r;
  return r;
end $$;
revoke execute on function public.painel_sala(uuid) from public, anon;
grant execute on function public.painel_sala(uuid) to authenticated, service_role;

-- ---------------------------------------------------------------- esperando você, em todas as salas

create or replace function public.minha_fila()
returns table (sala_id uuid, sala text, tipo text, ref bigint, titulo text, desde timestamptz, prazo timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome, 'proposta', p.id,
         left(btrim(regexp_replace(split_part(btrim(p.texto), E'\n', 1), '[*_`#>]', '', 'g')), 140), p.criada_em, null::timestamptz
  from public.membros m
  join public.salas s on s.id = m.sala_id
  join public.mensagens p on p.sala_id = s.id and p.tipo = 'proposta' and p.estado = 'pendente' and not p.apagada
  where m.user_id = auth.uid() and m.papel in ('dono', 'membro')
    and not (p.user_id = auth.uid() and p.agente is null)
    and auth.uid() = any(public.faltam_na_proposta(p.id))
  union all
  select s.id, s.nome, 'tarefa', t.id, t.titulo, t.criada_em, t.prazo
  from public.membros m
  join public.salas s on s.id = m.sala_id
  join public.tarefas t on t.sala_id = s.id and t.estado = 'aberta' and t.responsavel = auth.uid() and t.responsavel_agente is null
  where m.user_id = auth.uid() and t.prazo is not null and t.prazo < now() + interval '2 days'
  order by 7 nulls first, 6;
$$;
revoke execute on function public.minha_fila() from public, anon;
grant execute on function public.minha_fila() to authenticated;
