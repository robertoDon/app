-- The Sala, lote 5: convidado só leitura e histórico de quem fez o quê.

-- ---------------------------------------------------------------- papel "leitor"

alter table public.membros drop constraint if exists membros_papel_check;
alter table public.membros add constraint membros_papel_check check (papel in ('dono', 'membro', 'leitor'));

alter table public.salas add column if not exists convite_leitura text unique default replace(gen_random_uuid()::text, '-', '');
update public.salas set convite_leitura = replace(gen_random_uuid()::text, '-', '') where convite_leitura is null;
alter table public.salas alter column convite_leitura set not null;

create or replace function public.pode_escrever(sala uuid, pessoa uuid default auth.uid()) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.sala_id = sala and m.user_id = pessoa and m.papel in ('dono', 'membro'));
$$;
revoke execute on function public.pode_escrever(uuid, uuid) from public, anon;
grant execute on function public.pode_escrever(uuid, uuid) to authenticated;

-- quem só lê não escreve: nem a pessoa, nem os agentes dela (vale para a função decidir e para tarefas concluídas também)
create or replace function public.trava_leitor() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if not public.pode_escrever(new.sala_id, new.user_id) then
    raise exception 'Nesta sala você está como convidado para acompanhar. Peça a quem cuida da sala para poder escrever.';
  end if;
  return new;
end $$;
revoke execute on function public.trava_leitor() from public, anon, authenticated;
drop trigger if exists trava_leitor on public.mensagens;
create trigger trava_leitor before insert on public.mensagens
for each row execute function public.trava_leitor();

create or replace function public.trava_leitor_tarefa() returns trigger
language plpgsql security definer set search_path = '' as $$
declare quem uuid := coalesce(auth.uid(), case when tg_op = 'INSERT' then new.criada_por else new.concluida_por end);
begin
  if quem is not null and not public.pode_escrever(new.sala_id, quem) then
    raise exception 'Nesta sala você está como convidado para acompanhar. Peça a quem cuida da sala para poder mexer nas tarefas.';
  end if;
  return new;
end $$;
revoke execute on function public.trava_leitor_tarefa() from public, anon, authenticated;
drop trigger if exists trava_leitor_tarefa on public.tarefas;
create trigger trava_leitor_tarefa before insert or update on public.tarefas
for each row execute function public.trava_leitor_tarefa();

-- arquivos: só quem escreve sobe
drop policy if exists "subir arquivo na sua sala" on storage.objects;
create policy "subir arquivo na sua sala" on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and public.eh_pessoa() and public.pode_escrever(public.sala_do_caminho(name))
              and split_part(name, '/', 2) = auth.uid()::text);

-- sair ou tirar: membros e leitores (dono sai pela função sair_da_sala)
drop policy if exists "sair ou dono remove" on public.membros;
create policy "sair ou dono remove" on public.membros for delete to authenticated
  using (public.eh_pessoa() and papel in ('membro', 'leitor') and (user_id = auth.uid() or public.eh_dono(sala_id)));

-- convite: o link comum entra como membro; o link de convidado entra só para ler
drop function if exists public.ver_convite(text);
create or replace function public.ver_convite(codigo text)
returns table (sala_id uuid, nome text, pessoas bigint, ja_membro boolean, leitura boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome,
         (select count(*) from public.membros m where m.sala_id = s.id),
         exists (select 1 from public.membros m where m.sala_id = s.id and m.user_id = auth.uid()),
         s.convite_leitura = codigo
  from public.salas s where s.convite = codigo or s.convite_leitura = codigo;
$$;
revoke execute on function public.ver_convite(text) from public, anon;
grant execute on function public.ver_convite(text) to authenticated;

create or replace function public.entrar_sala(codigo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid; leitura boolean;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para aceitar o convite.'; end if;
  select id, convite_leitura = codigo into s, leitura from public.salas where convite = codigo or convite_leitura = codigo;
  if s is null then raise exception 'Convite inválido ou trocado.'; end if;
  insert into public.membros (sala_id, user_id, papel) values (s, auth.uid(), case when leitura then 'leitor' else 'membro' end)
  on conflict do nothing;
  return s;
end $$;

create or replace function public.trocar_convite(sala uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare c text := replace(gen_random_uuid()::text, '-', '');
begin
  if not public.eh_dono(sala) or not public.eh_pessoa() then raise exception 'Só quem cuida da sala troca o convite.'; end if;
  update public.salas set convite = c, convite_leitura = replace(gen_random_uuid()::text, '-', '') where id = sala;
  return c;
end $$;

create or replace function public.mudar_papel(sala uuid, pessoa uuid, papel text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_dono(sala) or not public.eh_pessoa() then raise exception 'Só quem cuida da sala faz isso.'; end if;
  if papel not in ('membro', 'leitor') then raise exception 'Papel inválido.'; end if;
  update public.membros m set papel = mudar_papel.papel where m.sala_id = sala and m.user_id = pessoa and m.papel <> 'dono';
end $$;
revoke execute on function public.mudar_papel(uuid, uuid, text) from public, anon;
grant execute on function public.mudar_papel(uuid, uuid, text) to authenticated;

-- ---------------------------------------------------------------- histórico

create table if not exists public.historico (
  id      bigint generated always as identity primary key,
  sala_id uuid not null references public.salas on delete cascade,
  quem    uuid references public.perfis (id) on delete set null,
  agente  text,
  acao    text not null,
  detalhe text,
  em      timestamptz not null default now()
);
create index if not exists historico_sala on public.historico (sala_id, id desc);
alter table public.historico enable row level security;
drop policy if exists "ver histórico das suas salas" on public.historico;
create policy "ver histórico das suas salas" on public.historico for select to authenticated
  using (public.eh_membro(sala_id));

create or replace function public._registrar(sala uuid, quem uuid, agente text, acao text, detalhe text default null) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not exists (select 1 from public.salas where id = sala) then return; end if; -- sala sendo apagada
  insert into public.historico (sala_id, quem, agente, acao, detalhe) values (sala, quem, agente, acao, left(detalhe, 300));
end $$;
revoke execute on function public._registrar(uuid, uuid, text, text, text) from public, anon, authenticated;

create or replace function public.nome_de(pessoa uuid) returns text
language sql stable security definer set search_path = '' as $$ select coalesce((select nome from public.perfis where id = pessoa), 'alguém') $$;
revoke execute on function public.nome_de(uuid) from public, anon, authenticated;

create or replace function public.hist_membros() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public._registrar(new.sala_id, new.user_id, null,
      case new.papel when 'dono' then 'criou a sala' when 'leitor' then 'entrou como convidado (só lê)' else 'entrou' end);
  elsif tg_op = 'DELETE' then
    if auth.uid() is null or auth.uid() = old.user_id then
      perform public._registrar(old.sala_id, old.user_id, null, 'saiu');
    else
      perform public._registrar(old.sala_id, auth.uid(), null, 'tirou da sala', public.nome_de(old.user_id));
    end if;
  elsif new.papel <> old.papel then
    perform public._registrar(new.sala_id, auth.uid(), null,
      case new.papel when 'dono' then 'passou a sala para' when 'leitor' then 'deixou só lendo' else 'liberou para escrever' end,
      public.nome_de(new.user_id));
  end if;
  return null;
end $$;
drop trigger if exists hist_membros on public.membros;
create trigger hist_membros after insert or delete or update of papel on public.membros
for each row execute function public.hist_membros();

create or replace function public.hist_salas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.nome <> old.nome then perform public._registrar(new.id, auth.uid(), null, 'renomeou a sala', old.nome || ' → ' || new.nome); end if;
  if new.contexto <> old.contexto then perform public._registrar(new.id, auth.uid(), null, 'mudou o contexto para os agentes'); end if;
  if new.convite <> old.convite then perform public._registrar(new.id, auth.uid(), null, 'trocou os links de convite'); end if;
  return null;
end $$;
drop trigger if exists hist_salas on public.salas;
create trigger hist_salas after update on public.salas
for each row execute function public.hist_salas();

create or replace function public.hist_mensagens() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' and new.tipo = 'decisao' then
    perform public._registrar(new.sala_id, new.user_id, null, case new.estado when 'aprovada' then 'aprovou a proposta' else 'recusou a proposta' end, '#' || new.responde_a);
  elsif tg_op = 'INSERT' and new.tipo = 'proposta' then
    perform public._registrar(new.sala_id, new.user_id, new.agente, 'fez uma proposta', '#' || new.id);
  elsif tg_op = 'UPDATE' and new.apagada and not old.apagada then
    perform public._registrar(new.sala_id, auth.uid(), null, 'apagou uma mensagem',
      'de ' || coalesce(old.agente || ' de ', '') || public.nome_de(old.user_id) || ' (#' || old.id || ')');
  end if;
  return null;
end $$;
drop trigger if exists hist_mensagens on public.mensagens;
create trigger hist_mensagens after insert or update of apagada on public.mensagens
for each row execute function public.hist_mensagens();

create or replace function public.hist_tarefas() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if tg_op = 'INSERT' then
    perform public._registrar(new.sala_id, coalesce(auth.uid(), new.criada_por), new.criada_por_agente, 'criou a tarefa', new.titulo);
  elsif new.estado <> old.estado then
    if new.estado = 'feita' then
      perform public._registrar(new.sala_id, coalesce(auth.uid(), new.concluida_por), new.concluida_por_agente, 'concluiu a tarefa', new.titulo);
    elsif new.estado = 'cancelada' then
      perform public._registrar(new.sala_id, auth.uid(), null, 'cancelou a tarefa', new.titulo);
    else
      perform public._registrar(new.sala_id, auth.uid(), null, 'reabriu a tarefa', new.titulo);
    end if;
  end if;
  return null;
end $$;
drop trigger if exists hist_tarefas on public.tarefas;
create trigger hist_tarefas after insert or update of estado on public.tarefas
for each row execute function public.hist_tarefas();

revoke execute on function public.hist_membros(), public.hist_salas(), public.hist_mensagens(), public.hist_tarefas()
  from public, anon, authenticated;

-- lista de salas: o link de convidado também (só para quem cuida da sala)
drop function if exists public.minhas_salas();
create or replace function public.minhas_salas()
returns table (id uuid, nome text, convite text, convite_leitura text, contexto text, papel text, nao_lidas bigint, pendentes bigint,
               lido_ate bigint, minhas_tarefas bigint,
               ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text, ultima_em timestamptz, ultima_tipo text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome,
         case when m.papel = 'leitor' then null else s.convite end,
         case when m.papel = 'dono' then s.convite_leitura end,
         s.contexto, m.papel,
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.id > m.lido_ate and x.user_id <> auth.uid()),
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.tipo = 'proposta' and x.estado = 'pendente' and not x.apagada),
         m.lido_ate,
         (select count(*) from public.tarefas t where t.sala_id = s.id and t.estado = 'aberta' and t.responsavel = auth.uid()),
         u.id, left(case when u.texto = '' and jsonb_array_length(u.anexos) > 0 then '📎 ' || (u.anexos->0->>'nome') else u.texto end, 140),
         u.agente, p.nome, u.criada_em, u.tipo
  from public.membros m
  join public.salas s on s.id = m.sala_id
  left join lateral (select * from public.mensagens y where y.sala_id = s.id order by y.id desc limit 1) u on true
  left join public.perfis p on p.id = u.user_id
  where m.user_id = auth.uid()
  order by coalesce(u.criada_em, s.criada_em) desc;
$$;
revoke execute on function public.minhas_salas() from public, anon;
grant execute on function public.minhas_salas() to authenticated;

-- os links de convite só saem pela lista de salas (dono vê os dois; convidado não vê nenhum)
revoke select on public.salas from authenticated;
grant select (id, nome, contexto, criada_por, criada_em) on public.salas to authenticated;
