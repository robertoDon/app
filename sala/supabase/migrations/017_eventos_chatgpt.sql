-- The Sala: eventos MCP (MCP Events) para agentes que se inscrevem, como o ChatGPT no modo Work.
-- O agente assina o evento "chamaram você"; quando chamam, a Sala entrega um webhook assinado (Standard Webhooks)
-- e o ChatGPT roda a tarefa: lê a sala e responde. O segredo de assinatura fica no Vault.

create table if not exists public.eventos_inscricoes (
  id            text primary key,                 -- determinístico: pessoa, agente, url, evento, argumentos
  user_id       uuid not null references public.perfis on delete cascade,
  agente        text not null,
  evento        text not null,
  argumentos    jsonb not null default '{}'::jsonb,
  url           text not null check (url ~ '^https://'),
  segredo       uuid not null,
  expira        timestamptz,
  criado_em     timestamptz not null default now(),
  ultimo_envio  timestamptz,
  ultimo_status int,
  ultimo_erro   text
);
create index if not exists eventos_inscricoes_user on public.eventos_inscricoes (user_id);
alter table public.eventos_inscricoes enable row level security;
revoke all on public.eventos_inscricoes from anon, authenticated;

-- usadas só pelo servidor (service role)
create or replace function public.salvar_inscricao_evento(id text, quem uuid, agente text, evento text, argumentos jsonb,
  url text, segredo text, expira timestamptz) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  select e.segredo into s from public.eventos_inscricoes e where e.id = salvar_inscricao_evento.id;
  if s is null then
    delete from vault.secrets where name = 'evento_' || salvar_inscricao_evento.id;
    s := vault.create_secret(segredo, 'evento_' || salvar_inscricao_evento.id);
  else
    perform vault.update_secret(s, segredo);
  end if;
  insert into public.eventos_inscricoes (id, user_id, agente, evento, argumentos, url, segredo, expira)
  values (salvar_inscricao_evento.id, quem, agente, evento, argumentos, url, s, expira)
  on conflict on constraint eventos_inscricoes_pkey do update set url = excluded.url, segredo = excluded.segredo,
    expira = excluded.expira, argumentos = excluded.argumentos, ultimo_erro = null;
  insert into public.agentes (user_id, nome, visto_em, desperta) values (quem, agente, now(), true)
  on conflict on constraint agentes_pkey do update set desperta = true;
end $$;

create or replace function public._recalcular_desperta(quem uuid, agente text) returns void
language sql security definer set search_path = '' as $$
  update public.agentes a set desperta =
    exists (select 1 from public.despertadores d where d.user_id = quem and d.agente = _recalcular_desperta.agente)
    or exists (select 1 from public.eventos_inscricoes e where e.user_id = quem and e.agente = _recalcular_desperta.agente
               and (e.expira is null or e.expira > now()))
  where a.user_id = quem and a.nome = _recalcular_desperta.agente;
$$;

create or replace function public.apagar_inscricao_evento(id text) returns void
language plpgsql security definer set search_path = '' as $$
declare e public.eventos_inscricoes;
begin
  delete from public.eventos_inscricoes x where x.id = apagar_inscricao_evento.id returning * into e;
  if e.id is null then return; end if;
  delete from vault.secrets where vault.secrets.id = e.segredo;
  perform public._recalcular_desperta(e.user_id, e.agente);
end $$;

create or replace function public.segredo_evento(id text) returns text
language sql stable security definer set search_path = '' as $$
  select s.decrypted_secret from public.eventos_inscricoes e join vault.decrypted_secrets s on s.id = e.segredo
  where e.id = segredo_evento.id;
$$;

-- o que a pessoa vê das próprias inscrições (nunca o segredo), e como desligar
create or replace function public.meus_eventos()
returns table (id text, agente text, evento text, expira timestamptz, criado_em timestamptz, ultimo_envio timestamptz, ultimo_status int, ultimo_erro text)
language sql stable security definer set search_path = '' as $$
  select e.id, e.agente, e.evento, e.expira, e.criado_em, e.ultimo_envio, e.ultimo_status, e.ultimo_erro
  from public.eventos_inscricoes e where e.user_id = auth.uid() order by e.criado_em desc;
$$;

create or replace function public.desligar_eventos(agente text) returns void
language plpgsql security definer set search_path = '' as $$
declare e record;
begin
  if auth.uid() is null then raise exception 'Entre para desligar.'; end if;
  for e in select x.id from public.eventos_inscricoes x where x.user_id = auth.uid() and x.agente = desligar_eventos.agente loop
    perform public.apagar_inscricao_evento(e.id);
  end loop;
end $$;

-- a mesma chamada que acorda o Claude passa a valer para quem assinou eventos
create or replace function public.chamar_despertar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare segredo text;
begin
  if new.apagada or not (new.texto like '%@%' or new.tipo = 'decisao') then return null; end if;
  if not exists (select 1 from public.despertadores d join public.membros m on m.user_id = d.user_id where m.sala_id = new.sala_id)
     and not exists (select 1 from public.eventos_inscricoes e join public.membros m on m.user_id = e.user_id
                     where m.sala_id = new.sala_id and (e.expira is null or e.expira > now())) then
    return null;
  end if;
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'aviso_segredo';
  if segredo is null then return null; end if;
  perform net.http_post(
    url := 'https://cokzyrdmtnbsnnboxggp.supabase.co/functions/v1/avisar',
    body := jsonb_build_object('despertar', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso', segredo),
    timeout_milliseconds := 5000);
  return null;
end $$;

-- desligar o "responder sozinho" do Claude não pode apagar o "desperta" de quem também assinou eventos
create or replace function public.desligar_despertador(agente text) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  if auth.uid() is null then raise exception 'Entre para desligar.'; end if;
  delete from public.despertadores d where d.user_id = auth.uid() and d.agente = desligar_despertador.agente returning d.segredo into s;
  if s is not null then delete from vault.secrets where id = s; end if;
  perform public._recalcular_desperta(auth.uid(), desligar_despertador.agente);
end $$;

revoke execute on function public.salvar_inscricao_evento(text, uuid, text, text, jsonb, text, text, timestamptz),
  public.apagar_inscricao_evento(text), public.segredo_evento(text), public._recalcular_desperta(uuid, text)
  from public, anon, authenticated;
grant execute on function public.salvar_inscricao_evento(text, uuid, text, text, jsonb, text, text, timestamptz),
  public.apagar_inscricao_evento(text), public.segredo_evento(text) to service_role;
revoke execute on function public.meus_eventos(), public.desligar_eventos(text) from public, anon;
grant execute on function public.meus_eventos(), public.desligar_eventos(text) to authenticated;
