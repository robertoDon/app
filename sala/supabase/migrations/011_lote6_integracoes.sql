-- The Sala, lote 6: integrações (webhooks) para Slack, Teams, Discord, Google Chat ou qualquer sistema.
-- Quem cuida da sala cadastra a URL e escolhe os eventos. O banco envia direto (pg_net), sem serviço pago.

create table if not exists public.integracoes (
  id         bigint generated always as identity primary key,
  sala_id    uuid not null references public.salas on delete cascade,
  url        text not null check (url ~ '^https://[A-Za-z0-9.-]+(:[0-9]+)?(/.*)?$' and char_length(url) <= 500),
  eventos    text[] not null check (eventos <@ array['proposta', 'decisao', 'tarefa_nova', 'tarefa_feita', 'mensagem']::text[] and cardinality(eventos) > 0),
  criada_por uuid references public.perfis (id) on delete set null,
  criada_em  timestamptz not null default now()
);
create index if not exists integracoes_sala on public.integracoes (sala_id);
alter table public.integracoes enable row level security;
create policy "dono vê as integrações" on public.integracoes for select to authenticated
  using (public.eh_dono(sala_id) and public.eh_pessoa());

create or replace function public.app_url() returns text language sql immutable as $$ select 'https://sala-follou.vercel.app' $$;

-- formato que cada serviço entende
create or replace function public._corpo_integracao(url text, evento text, sala uuid, sala_nome text, texto text, dados jsonb)
returns jsonb language sql immutable set search_path = '' as $$
  select case
    when url like 'https://hooks.slack.com/%' then jsonb_build_object('text', texto)
    when url like 'https://discord.com/api/webhooks/%' or url like 'https://discordapp.com/api/webhooks/%'
      then jsonb_build_object('content', left(texto, 1900))
    when url like 'https://chat.googleapis.com/%' then jsonb_build_object('text', texto)
    when url ~ '^https://[^/]*(webhook\.office\.com|logic\.azure\.com|powerplatform\.com)/' then jsonb_build_object('text', texto)
    else jsonb_build_object('evento', evento, 'sala', jsonb_build_object('id', sala, 'nome', sala_nome),
      'texto', texto, 'link', public.app_url() || '/s/' || sala, 'dados', dados, 'em', now())
  end;
$$;

-- recusa endereços internos (a URL vem de uma pessoa)
create or replace function public._url_externa(url text) returns boolean language sql immutable as $$
  select url ~ '^https://' and split_part(split_part(url, '/', 3), ':', 1) !~*
    '^(localhost|.*\.local|.*\.internal|127\.|10\.|192\.168\.|172\.(1[6-9]|2[0-9]|3[01])\.|169\.254\.|0\.|\[|metadata)';
$$;

create or replace function public._disparar(sala uuid, evento text, texto text, dados jsonb default '{}'::jsonb)
returns void language plpgsql security definer set search_path = '' as $$
declare i record; nome text;
begin
  select s.nome into nome from public.salas s where s.id = sala;
  if nome is null then return; end if;
  for i in select * from public.integracoes where sala_id = sala and evento = any(eventos) loop
    if public._url_externa(i.url) then
      perform net.http_post(url := i.url,
        body := public._corpo_integracao(i.url, evento, sala, nome, texto || E'\n' || public.app_url() || '/s/' || sala, dados),
        headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'The Sala'),
        timeout_milliseconds := 5000);
    end if;
  end loop;
end $$;

create or replace function public._autor(uid uuid, agente text) returns text language sql stable security definer set search_path = '' as $$
  select coalesce(agente || ' de ' || split_part(public.nome_de(uid), ' ', 1), public.nome_de(uid));
$$;

create or replace function public.integrar_mensagem() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sala_nome text; resumo text := left(regexp_replace(new.texto, '\s+', ' ', 'g'), 300); p public.mensagens;
begin
  if not exists (select 1 from public.integracoes where sala_id = new.sala_id) then return null; end if;
  select nome into sala_nome from public.salas where id = new.sala_id;
  if new.tipo = 'proposta' then
    perform public._disparar(new.sala_id, 'proposta', '📝 ' || public._autor(new.user_id, new.agente) || ' fez uma proposta em "' || sala_nome || '": ' || resumo,
      jsonb_build_object('mensagem', new.id, 'autor', public._autor(new.user_id, new.agente)));
  elsif new.tipo = 'decisao' then
    select * into p from public.mensagens where id = new.responde_a;
    perform public._disparar(new.sala_id, 'decisao',
      case new.estado when 'aprovada' then '✅ ' else '❌ ' end || public.nome_de(new.user_id) ||
      case new.estado when 'aprovada' then ' aprovou' else ' recusou' end || ' em "' || sala_nome || '": ' ||
      left(regexp_replace(coalesce(p.texto, ''), '\s+', ' ', 'g'), 300) ||
      case when new.texto not in ('Aprovada.', 'Recusada.') then ' · "' || resumo || '"' else '' end,
      jsonb_build_object('proposta', new.responde_a, 'estado', new.estado, 'decidida_por', public.nome_de(new.user_id)));
  elsif not new.apagada then
    perform public._disparar(new.sala_id, 'mensagem', '💬 ' || public._autor(new.user_id, new.agente) || ' em "' || sala_nome || '": ' || resumo,
      jsonb_build_object('mensagem', new.id, 'autor', public._autor(new.user_id, new.agente)));
  end if;
  return null;
end $$;
create trigger integrar_mensagem after insert on public.mensagens
for each row execute function public.integrar_mensagem();

create or replace function public.integrar_tarefa() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sala_nome text; quem text;
begin
  if not exists (select 1 from public.integracoes where sala_id = new.sala_id) then return null; end if;
  select nome into sala_nome from public.salas where id = new.sala_id;
  quem := case when new.responsavel is null then 'sem responsável' else public._autor(new.responsavel, new.responsavel_agente) end;
  if tg_op = 'INSERT' then
    perform public._disparar(new.sala_id, 'tarefa_nova', '☐ Tarefa nova em "' || sala_nome || '": ' || new.titulo || ' · ' || quem ||
      coalesce(' · até ' || to_char(new.prazo at time zone 'America/Sao_Paulo', 'DD/MM'), ''),
      jsonb_build_object('tarefa', new.id, 'titulo', new.titulo, 'responsavel', quem, 'prazo', new.prazo));
  elsif new.estado = 'feita' and old.estado <> 'feita' then
    perform public._disparar(new.sala_id, 'tarefa_feita', '☑ ' || coalesce(public._autor(new.concluida_por, new.concluida_por_agente), quem) ||
      ' concluiu em "' || sala_nome || '": ' || new.titulo || coalesce(' · ' || left(new.resultado, 300), ''),
      jsonb_build_object('tarefa', new.id, 'titulo', new.titulo, 'resultado', new.resultado));
  end if;
  return null;
end $$;
create trigger integrar_tarefa after insert or update of estado on public.tarefas
for each row execute function public.integrar_tarefa();

create or replace function public.criar_integracao(sala uuid, url text, eventos text[]) returns bigint
language plpgsql security definer set search_path = '' as $$
declare i bigint;
begin
  if not public.eh_dono(sala) or not public.eh_pessoa() then raise exception 'Só quem cuida da sala liga integrações.'; end if;
  if not public._url_externa(btrim(url)) then raise exception 'Use um endereço https público (Slack, Teams, Discord, Google Chat ou o seu sistema).'; end if;
  if (select count(*) from public.integracoes where sala_id = sala) >= 5 then raise exception 'No máximo 5 integrações por sala.'; end if;
  insert into public.integracoes (sala_id, url, eventos, criada_por) values (sala, btrim(url), eventos, auth.uid()) returning id into i;
  perform public._registrar(sala, auth.uid(), null, 'ligou uma integração', split_part(btrim(url), '/', 3));
  return i;
end $$;

create or replace function public.apagar_integracao(integracao bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.integracoes;
begin
  select * into i from public.integracoes where id = integracao;
  if not found or not public.eh_dono(i.sala_id) or not public.eh_pessoa() then raise exception 'Integração não encontrada.'; end if;
  delete from public.integracoes where id = integracao;
  perform public._registrar(i.sala_id, auth.uid(), null, 'desligou uma integração', split_part(i.url, '/', 3));
end $$;

create or replace function public.testar_integracao(integracao bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.integracoes; nome text;
begin
  select * into i from public.integracoes where id = integracao;
  if not found or not public.eh_dono(i.sala_id) or not public.eh_pessoa() then raise exception 'Integração não encontrada.'; end if;
  select s.nome into nome from public.salas s where s.id = i.sala_id;
  perform net.http_post(url := i.url,
    body := public._corpo_integracao(i.url, 'teste', i.sala_id, nome,
      '👋 Teste do The Sala: a sala "' || nome || '" está ligada aqui.' || E'\n' || public.app_url() || '/s/' || i.sala_id, '{}'::jsonb),
    headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'The Sala'),
    timeout_milliseconds := 5000);
end $$;

revoke execute on function public._corpo_integracao(text, text, uuid, text, text, jsonb), public._disparar(uuid, text, text, jsonb),
  public._autor(uuid, text), public.integrar_mensagem(), public.integrar_tarefa(), public._url_externa(text)
  from public, anon, authenticated;
revoke execute on function public.criar_integracao(uuid, text, text[]), public.apagar_integracao(bigint), public.testar_integracao(bigint) from public, anon;
grant execute on function public.criar_integracao(uuid, text, text[]), public.apagar_integracao(bigint), public.testar_integracao(bigint) to authenticated;
