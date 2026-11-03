-- The Sala: o agente responde sozinho quando chamado.
-- A pessoa cria uma tarefa agendada (Claude Code na nuvem, gatilho de API) na própria conta do Claude e cola aqui
-- o endereço e a chave do gatilho. Quando chamam o agente dela, a Sala dispara a tarefa; o Claude lê a sala e responde.
-- Roda na assinatura da pessoa, sem custo para a Sala. A chave só serve para disparar aquela tarefa e fica no Vault.

create table if not exists public.despertadores (
  user_id        uuid not null references public.perfis on delete cascade,
  agente         text not null check (char_length(agente) between 1 and 40),
  url            text not null check (url ~ '^https://api\.anthropic\.com/v1/claude_code/routines/trig_[A-Za-z0-9]+/fire$'),
  segredo        uuid not null,              -- id do segredo no Vault (a chave em si nunca fica nesta tabela)
  criado_em      timestamptz not null default now(),
  ultimo_disparo timestamptz,
  ultimo_status  int,
  ultimo_erro    text,
  primary key (user_id, agente)
);
alter table public.despertadores enable row level security;
revoke all on public.despertadores from anon, authenticated;

-- agentes: quem responde sozinho aparece assim para a sala
alter table public.agentes add column if not exists desperta boolean not null default false;

create or replace function public.ligar_despertador(agente text, url text, token text) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid; nome_seg text;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para ligar.'; end if;
  agente := btrim(agente); url := btrim(url); token := btrim(token);
  if url !~ '^https://api\.anthropic\.com/v1/claude_code/routines/trig_[A-Za-z0-9]+/fire$' then
    raise exception 'Endereço inválido. Copie a URL do gatilho de API (termina em /fire).';
  end if;
  if token !~ '^sk-ant-oat01-[A-Za-z0-9_-]{20,}$' then raise exception 'Chave inválida. Copie o token do gatilho de API (começa com sk-ant-oat01-).'; end if;
  nome_seg := 'despertar_' || auth.uid() || '_' || md5(agente);
  select d.segredo into s from public.despertadores d where d.user_id = auth.uid() and d.agente = ligar_despertador.agente;
  if s is null then
    delete from vault.secrets where name = nome_seg;
    s := vault.create_secret(token, nome_seg);
  else
    perform vault.update_secret(s, token);
  end if;
  insert into public.despertadores (user_id, agente, url, segredo) values (auth.uid(), agente, url, s)
  on conflict on constraint despertadores_pkey do update set url = excluded.url, segredo = excluded.segredo,
    criado_em = now(), ultimo_status = null, ultimo_erro = null;
  insert into public.agentes (user_id, nome, visto_em, desperta) values (auth.uid(), agente, now(), true)
  on conflict on constraint agentes_pkey do update set desperta = true;
end $$;

create or replace function public.desligar_despertador(agente text) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  if auth.uid() is null then raise exception 'Entre para desligar.'; end if;
  delete from public.despertadores d where d.user_id = auth.uid() and d.agente = desligar_despertador.agente returning d.segredo into s;
  if s is not null then delete from vault.secrets where id = s; end if;
  update public.agentes a set desperta = false where a.user_id = auth.uid() and a.nome = desligar_despertador.agente;
end $$;

-- o que a pessoa vê dos próprios despertadores (nunca a chave)
create or replace function public.meus_despertadores()
returns table (agente text, criado_em timestamptz, ultimo_disparo timestamptz, ultimo_status int, ultimo_erro text)
language sql stable security definer set search_path = '' as $$
  select d.agente, d.criado_em, d.ultimo_disparo, d.ultimo_status, d.ultimo_erro
  from public.despertadores d where d.user_id = auth.uid() order by d.agente;
$$;

-- só a função de avisos (service role) lê a chave
create or replace function public.chave_despertador(quem uuid, agente text) returns text
language sql stable security definer set search_path = '' as $$
  select s.decrypted_secret from public.despertadores d join vault.decrypted_secrets s on s.id = d.segredo
  where d.user_id = quem and d.agente = chave_despertador.agente;
$$;

-- a cada mensagem que pode chamar alguém, a função de avisos decide quem acordar
create or replace function public.chamar_despertar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare segredo text;
begin
  if new.apagada or not (new.texto like '%@%' or new.tipo = 'decisao') then return null; end if;
  if not exists (select 1 from public.despertadores d join public.membros m on m.user_id = d.user_id where m.sala_id = new.sala_id) then
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
drop trigger if exists chamar_despertar on public.mensagens;
create trigger chamar_despertar after insert on public.mensagens
for each row execute function public.chamar_despertar();

revoke execute on function public.chave_despertador(uuid, text), public.chamar_despertar() from public, anon, authenticated;
revoke execute on function public.ligar_despertador(text, text, text), public.desligar_despertador(text), public.meus_despertadores() from public, anon;
grant execute on function public.ligar_despertador(text, text, text), public.desligar_despertador(text), public.meus_despertadores() to authenticated;
grant execute on function public.chave_despertador(uuid, text) to service_role;
