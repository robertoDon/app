-- Sala v1: salas colaborativas entre pessoas e agentes.
-- Pessoas entram com Google (ou link por email). Agentes entram pelo conector (OAuth do Supabase)
-- ou por uma chave de agente, e falam em nome da pessoa que os conectou.

-- A v0 (sala única com token no link) sai.
drop table if exists public.mensagens;
drop table if exists public.salas;

-- ---------------------------------------------------------------- tabelas

create table public.perfis (
  id         uuid primary key references auth.users on delete cascade,
  nome       text not null check (char_length(nome) between 1 and 60),
  avatar     text,
  criado_em  timestamptz not null default now()
);

create table public.salas (
  id          uuid primary key default gen_random_uuid(),
  nome        text not null check (char_length(nome) between 1 and 80),
  convite     text not null unique default replace(gen_random_uuid()::text, '-', ''),
  criada_por  uuid not null references public.perfis on delete cascade,
  criada_em   timestamptz not null default now()
);

create table public.membros (
  sala_id   uuid not null references public.salas on delete cascade,
  user_id   uuid not null references public.perfis on delete cascade,
  papel     text not null default 'membro' check (papel in ('dono', 'membro')),
  entrou_em timestamptz not null default now(),
  primary key (sala_id, user_id)
);
create index membros_user on public.membros (user_id);

-- agente = null → quem escreveu foi a pessoa. Senão, o nome do agente dela ("Claude", "ChatGPT"...).
create table public.mensagens (
  id         bigint generated always as identity primary key,
  sala_id    uuid not null references public.salas on delete cascade,
  user_id    uuid not null references public.perfis on delete cascade,
  agente     text check (agente is null or char_length(agente) between 1 and 40),
  texto      text not null check (char_length(texto) between 1 and 20000),
  criada_em  timestamptz not null default now()
);
create index mensagens_sala_id on public.mensagens (sala_id, id);

-- Chaves de agente: para agentes de terminal (Claude Code escutando, Codex, scripts).
-- Guardamos só o hash; a chave aparece uma vez, na criação.
create table public.chaves (
  id          uuid primary key default gen_random_uuid(),
  user_id     uuid not null references public.perfis on delete cascade,
  agente      text not null check (char_length(agente) between 1 and 40),
  hash        text not null unique,
  final       text not null,           -- últimos 4 caracteres, para reconhecer
  criada_em   timestamptz not null default now(),
  usada_em    timestamptz
);
create index chaves_user on public.chaves (user_id);

-- ---------------------------------------------------------------- perfil automático

create or replace function public.criar_perfil() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  insert into public.perfis (id, nome, avatar)
  values (
    new.id,
    left(coalesce(nullif(new.raw_user_meta_data->>'full_name', ''),
                  nullif(new.raw_user_meta_data->>'name', ''),
                  split_part(new.email, '@', 1), 'Sem nome'), 60),
    new.raw_user_meta_data->>'avatar_url'
  )
  on conflict (id) do nothing;
  return new;
end $$;

create trigger ao_criar_usuario after insert on auth.users
for each row execute function public.criar_perfil();

-- ---------------------------------------------------------------- helpers de acesso

create or replace function public.eh_membro(sala uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.sala_id = sala and m.user_id = auth.uid());
$$;

create or replace function public.eh_dono(sala uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select exists (select 1 from public.membros m where m.sala_id = sala and m.user_id = auth.uid() and m.papel = 'dono');
$$;

create or replace function public.compartilha_sala(outro uuid) returns boolean
language sql stable security definer set search_path = '' as $$
  select outro = auth.uid() or exists (
    select 1 from public.membros a join public.membros b on a.sala_id = b.sala_id
    where a.user_id = auth.uid() and b.user_id = outro);
$$;

-- token de agente (OAuth) tem client_id; sessão de pessoa não
create or replace function public.eh_pessoa() returns boolean
language sql stable as $$ select coalesce(auth.jwt() ->> 'client_id', '') = '' $$;

-- ---------------------------------------------------------------- RLS

alter table public.perfis    enable row level security;
alter table public.salas     enable row level security;
alter table public.membros   enable row level security;
alter table public.mensagens enable row level security;
alter table public.chaves    enable row level security;

create policy "ver perfis de quem divide sala" on public.perfis for select to authenticated
  using (public.compartilha_sala(id));
create policy "editar o próprio perfil" on public.perfis for update to authenticated
  using (id = auth.uid() and public.eh_pessoa()) with check (id = auth.uid());

create policy "ver salas onde está" on public.salas for select to authenticated
  using (public.eh_membro(id));
create policy "dono renomeia" on public.salas for update to authenticated
  using (public.eh_dono(id) and public.eh_pessoa()) with check (public.eh_dono(id));
create policy "dono apaga" on public.salas for delete to authenticated
  using (public.eh_dono(id) and public.eh_pessoa());

create policy "ver membros das suas salas" on public.membros for select to authenticated
  using (public.eh_membro(sala_id));
create policy "sair ou dono remove" on public.membros for delete to authenticated
  using (public.eh_pessoa() and (user_id = auth.uid() or public.eh_dono(sala_id)));

create policy "ler mensagens das suas salas" on public.mensagens for select to authenticated
  using (public.eh_membro(sala_id));
-- pessoa escreve como ela mesma; agente escreve pela edge function (service role)
create policy "pessoa escreve" on public.mensagens for insert to authenticated
  with check (user_id = auth.uid() and agente is null and public.eh_pessoa() and public.eh_membro(sala_id));

create policy "ver as próprias chaves" on public.chaves for select to authenticated
  using (user_id = auth.uid() and public.eh_pessoa());
create policy "apagar as próprias chaves" on public.chaves for delete to authenticated
  using (user_id = auth.uid() and public.eh_pessoa());

-- ---------------------------------------------------------------- RPCs

create or replace function public.criar_sala(nome text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para criar uma sala.'; end if;
  insert into public.salas (nome, criada_por) values (trim(criar_sala.nome), auth.uid()) returning id into s;
  insert into public.membros (sala_id, user_id, papel) values (s, auth.uid(), 'dono');
  return s;
end $$;

-- prévia do convite (nome da sala e quem está), antes de entrar
create or replace function public.ver_convite(codigo text)
returns table (sala_id uuid, nome text, pessoas bigint, ja_membro boolean)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome,
         (select count(*) from public.membros m where m.sala_id = s.id),
         exists (select 1 from public.membros m where m.sala_id = s.id and m.user_id = auth.uid())
  from public.salas s where s.convite = codigo;
$$;

create or replace function public.entrar_sala(codigo text) returns uuid
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para aceitar o convite.'; end if;
  select id into s from public.salas where convite = codigo;
  if s is null then raise exception 'Convite inválido ou trocado.'; end if;
  insert into public.membros (sala_id, user_id) values (s, auth.uid()) on conflict do nothing;
  return s;
end $$;

create or replace function public.trocar_convite(sala uuid) returns text
language plpgsql security definer set search_path = '' as $$
declare c text := replace(gen_random_uuid()::text, '-', '');
begin
  if not public.eh_dono(sala) or not public.eh_pessoa() then raise exception 'Só quem criou a sala troca o convite.'; end if;
  update public.salas set convite = c where id = sala;
  return c;
end $$;

-- cria a chave e devolve o texto uma única vez
create or replace function public.criar_chave(agente text) returns text
language plpgsql security definer set search_path = '' as $$
declare k text := 'sala_' || replace(gen_random_uuid()::text, '-', '') || replace(gen_random_uuid()::text, '-', '');
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para criar uma chave.'; end if;
  insert into public.chaves (user_id, agente, hash, final)
  values (auth.uid(), trim(criar_chave.agente), encode(extensions.digest(k, 'sha256'), 'hex'), right(k, 4));
  return k;
end $$;

-- nome do app que conectou o agente via OAuth (só a edge function chama)
create or replace function public.nome_do_cliente(cliente uuid) returns text
language sql stable security definer set search_path = '' as $$
  select client_name from auth.oauth_clients where id = cliente;
$$;

revoke execute on function public.nome_do_cliente(uuid) from public, anon, authenticated;
revoke execute on function public.criar_sala(text), public.entrar_sala(text), public.trocar_convite(uuid),
  public.criar_chave(text), public.ver_convite(text) from public, anon;
grant execute on function public.criar_sala(text), public.entrar_sala(text), public.trocar_convite(uuid),
  public.criar_chave(text), public.ver_convite(text) to authenticated;

-- ---------------------------------------------------------------- tempo real

alter publication supabase_realtime add table public.mensagens, public.membros;
