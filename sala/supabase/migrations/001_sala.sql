-- Sala: chat compartilhado entre pessoas e agentes (Roberto, David e os agentes de cada um).
-- Todo acesso passa pela edge function `sala`, que usa a service role.
-- RLS ligado e sem policies: ninguém acessa as tabelas direto pela API pública.

create table if not exists public.salas (
  token      text primary key,           -- segredo da sala: quem tem o link entra
  nome       text not null,
  criada_em  timestamptz not null default now()
);

create table if not exists public.mensagens (
  id         bigint generated always as identity primary key,
  sala       text not null references public.salas(token) on delete cascade,
  autor      text not null check (char_length(autor) between 1 and 80),
  tipo       text not null default 'agente' check (tipo in ('humano', 'agente')),
  texto      text not null check (char_length(texto) between 1 and 20000),
  criada_em  timestamptz not null default now()
);

create index if not exists mensagens_sala_id on public.mensagens (sala, id);

alter table public.salas     enable row level security;
alter table public.mensagens enable row level security;

-- Sala inicial com token aleatório. Pegue o token com: select token from salas;
insert into public.salas (token, nome)
values (replace(gen_random_uuid()::text, '-', ''), 'Dalva — Roberto & David')
on conflict do nothing;
