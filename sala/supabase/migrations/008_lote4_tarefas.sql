-- The Sala, lote 4: tarefas. Qualquer mensagem vira tarefa; proposta aprovada vira tarefa sozinha.
-- Responsável é uma pessoa (responsavel_agente nulo) ou o agente de uma pessoa.

create table if not exists public.tarefas (
  id                 bigint generated always as identity primary key,
  sala_id            uuid not null references public.salas on delete cascade,
  titulo             text not null check (char_length(titulo) between 1 and 200),
  origem             bigint references public.mensagens (id) on delete set null,
  responsavel        uuid references public.perfis (id) on delete set null,
  responsavel_agente text check (responsavel_agente is null or char_length(responsavel_agente) between 1 and 40),
  prazo              timestamptz,
  estado             text not null default 'aberta' check (estado in ('aberta', 'feita', 'cancelada')),
  resultado          text check (resultado is null or char_length(resultado) <= 4000),
  criada_por         uuid references public.perfis (id) on delete set null,
  criada_por_agente  text,
  criada_em          timestamptz not null default now(),
  concluida_em       timestamptz,
  concluida_por      uuid references public.perfis (id) on delete set null,
  concluida_por_agente text
);
create index if not exists tarefas_sala on public.tarefas (sala_id, estado, prazo);
create index if not exists tarefas_responsavel on public.tarefas (responsavel) where estado = 'aberta';

alter table public.tarefas enable row level security;
drop policy if exists "ver tarefas das suas salas" on public.tarefas;
create policy "ver tarefas das suas salas" on public.tarefas for select to authenticated
  using (public.eh_membro(sala_id));
-- escrever só pelas funções abaixo (pessoas) ou pela edge function (agentes)

-- responsável precisa estar na sala
create or replace function public._checar_responsavel(sala uuid, pessoa uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if pessoa is not null and not exists (select 1 from public.membros where sala_id = sala and user_id = pessoa) then
    raise exception 'O responsável precisa estar na sala.';
  end if;
end $$;
revoke execute on function public._checar_responsavel(uuid, uuid) from public, anon, authenticated;

create or replace function public.criar_tarefa(sala uuid, titulo text, origem bigint default null,
  responsavel uuid default null, responsavel_agente text default null, prazo timestamptz default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare t bigint;
begin
  if not public.eh_pessoa() or not public.eh_membro(sala) then raise exception 'Você não está nesta sala.'; end if;
  perform public._checar_responsavel(sala, responsavel);
  if origem is not null and not exists (select 1 from public.mensagens m where m.id = origem and m.sala_id = sala) then
    origem := null;
  end if;
  insert into public.tarefas (sala_id, titulo, origem, responsavel, responsavel_agente, prazo, criada_por)
  values (sala, left(btrim(titulo), 200), origem, responsavel, nullif(btrim(coalesce(responsavel_agente, '')), ''), prazo, auth.uid())
  returning id into t;
  return t;
end $$;

-- muda título, responsável ou prazo; reabre ou cancela
create or replace function public.editar_tarefa(tarefa bigint, titulo text, responsavel uuid, responsavel_agente text,
  prazo timestamptz, estado text default 'aberta')
returns void language plpgsql security definer set search_path = '' as $$
declare t public.tarefas;
begin
  select * into t from public.tarefas where id = tarefa for update;
  if not found or not public.eh_pessoa() or not public.eh_membro(t.sala_id) then raise exception 'Tarefa não encontrada.'; end if;
  if estado not in ('aberta', 'cancelada') then raise exception 'Para concluir, use Concluir.'; end if;
  perform public._checar_responsavel(t.sala_id, responsavel);
  update public.tarefas set titulo = left(btrim(editar_tarefa.titulo), 200), responsavel = editar_tarefa.responsavel,
    responsavel_agente = nullif(btrim(coalesce(editar_tarefa.responsavel_agente, '')), ''), prazo = editar_tarefa.prazo,
    estado = editar_tarefa.estado, concluida_em = null, concluida_por = null, concluida_por_agente = null,
    resultado = case when editar_tarefa.estado = 'aberta' then null else resultado end
  where id = tarefa;
end $$;

-- pessoa conclui: registra o resultado e avisa na conversa
create or replace function public.concluir_tarefa(tarefa bigint, resultado text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.tarefas; r text := nullif(btrim(coalesce(resultado, '')), '');
begin
  select * into t from public.tarefas where id = tarefa for update;
  if not found or not public.eh_pessoa() or not public.eh_membro(t.sala_id) then raise exception 'Tarefa não encontrada.'; end if;
  if t.estado <> 'aberta' then raise exception 'Esta tarefa já foi fechada.'; end if;
  update public.tarefas set estado = 'feita', resultado = left(r, 4000), concluida_em = now(), concluida_por = auth.uid()
  where id = tarefa;
  insert into public.mensagens (sala_id, user_id, texto, responde_a)
  values (t.sala_id, auth.uid(), '✓ Concluí a tarefa: **' || t.titulo || '**' || coalesce(E'\n\n' || left(r, 4000), ''), t.origem);
end $$;

-- proposta aprovada vira tarefa de quem propôs
create or replace function public.decidir(proposta bigint, aprovar boolean, nota text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  p public.mensagens;
  e text := case when aprovar then 'aprovada' else 'recusada' end;
  n text := nullif(btrim(coalesce(nota, '')), '');
  nova bigint;
  titulo text;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas decidem propostas.'; end if;
  select * into p from public.mensagens where id = proposta and tipo = 'proposta' for update;
  if not found or not public.eh_membro(p.sala_id) then raise exception 'Proposta não encontrada.'; end if;
  if p.apagada then raise exception 'Esta proposta foi apagada.'; end if;
  if p.estado <> 'pendente' then raise exception 'Esta proposta já foi decidida.'; end if;

  update public.mensagens set estado = e, decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(), coalesce(left(n, 2000), case when aprovar then 'Aprovada.' else 'Recusada.' end), 'decisao', e, proposta)
  returning id into nova;

  if aprovar then
    titulo := btrim(regexp_replace(regexp_replace(split_part(btrim(p.texto), E'\n', 1), '[*_`#>]', '', 'g'), '^(eu\s+)?(proponho|sugiro|posso)\s+', '', 'i'));
    titulo := upper(left(titulo, 1)) || substr(titulo, 2);
    if char_length(titulo) > 120 then titulo := left(titulo, 119) || '…'; end if;
    if titulo = '' then titulo := 'Executar a proposta aprovada'; end if;
    insert into public.tarefas (sala_id, titulo, origem, responsavel, responsavel_agente, criada_por)
    values (p.sala_id, titulo, proposta, p.user_id, p.agente, auth.uid());
  end if;
  return nova;
end $$;

revoke execute on function public.criar_tarefa(uuid, text, bigint, uuid, text, timestamptz),
  public.editar_tarefa(bigint, text, uuid, text, timestamptz, text), public.concluir_tarefa(bigint, text) from public, anon;
grant execute on function public.criar_tarefa(uuid, text, bigint, uuid, text, timestamptz),
  public.editar_tarefa(bigint, text, uuid, text, timestamptz, text), public.concluir_tarefa(bigint, text) to authenticated;

-- aviso para quem ficou responsável (ou cujo agente ficou)
create or replace function public.chamar_avisar_tarefa() returns trigger
language plpgsql security definer set search_path = '' as $$
declare segredo text;
begin
  if new.responsavel is null or new.responsavel = new.criada_por
     or not exists (select 1 from public.inscricoes i join public.perfis p on p.id = i.user_id
                    where i.user_id = new.responsavel and p.avisos <> 'nada') then
    return null;
  end if;
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'aviso_segredo';
  if segredo is null then return null; end if;
  perform net.http_post(
    url := 'https://cokzyrdmtnbsnnboxggp.supabase.co/functions/v1/avisar',
    body := jsonb_build_object('tarefa', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso', segredo)
  );
  return null;
end $$;
revoke execute on function public.chamar_avisar_tarefa() from public, anon, authenticated;
drop trigger if exists chamar_avisar_tarefa on public.tarefas;
create trigger chamar_avisar_tarefa after insert on public.tarefas
for each row execute function public.chamar_avisar_tarefa();

-- lista de salas: quantas tarefas abertas são suas ou dos seus agentes
drop function if exists public.minhas_salas();
create or replace function public.minhas_salas()
returns table (id uuid, nome text, convite text, contexto text, papel text, nao_lidas bigint, pendentes bigint, lido_ate bigint,
               minhas_tarefas bigint,
               ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text, ultima_em timestamptz, ultima_tipo text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome, s.convite, s.contexto, m.papel,
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

do $$ begin
  alter publication supabase_realtime add table public.tarefas;
exception when duplicate_object then null; end $$;
