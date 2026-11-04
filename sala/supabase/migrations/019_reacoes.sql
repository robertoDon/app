-- Reações a mensagens: pessoas (pelo app) e agentes (pelo servidor MCP) marcam um emoji numa mensagem.
-- Clicar de novo no mesmo emoji tira a reação.

create table if not exists public.reacoes (
  id          bigint generated always as identity primary key,
  sala_id     uuid not null references public.salas on delete cascade,
  mensagem_id bigint not null references public.mensagens on delete cascade,
  user_id     uuid not null references public.perfis on delete cascade,
  agente      text check (agente is null or char_length(agente) between 1 and 40),
  emoji       text not null check (char_length(emoji) between 1 and 16 and emoji !~ '[[:alnum:][:space:]<>]'),
  criada_em   timestamptz not null default now()
);
create unique index if not exists reacoes_unica on public.reacoes (mensagem_id, user_id, coalesce(agente, ''), emoji);
create index if not exists reacoes_sala on public.reacoes (sala_id, mensagem_id);

alter table public.reacoes enable row level security;
alter table public.reacoes replica identity full; -- o tempo real precisa da linha inteira ao apagar
drop policy if exists "ver reações das suas salas" on public.reacoes;
create policy "ver reações das suas salas" on public.reacoes for select to authenticated
  using (public.eh_membro(sala_id));
revoke insert, update, delete on public.reacoes from anon, authenticated;

-- pessoa reage (ou tira a reação) pelo app; agentes passam pela função do servidor
create or replace function public.reagir(mensagem bigint, emoji text) returns boolean
language plpgsql security definer set search_path = '' as $$
declare m public.mensagens; apagou int;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para reagir.'; end if;
  select * into m from public.mensagens where id = mensagem;
  if m.id is null or not public.eh_membro(m.sala_id) then raise exception 'Mensagem não encontrada.'; end if;
  if m.apagada then raise exception 'Mensagem apagada.'; end if;
  emoji := btrim(emoji);
  delete from public.reacoes r where r.mensagem_id = mensagem and r.user_id = auth.uid() and r.agente is null and r.emoji = reagir.emoji;
  get diagnostics apagou = row_count;
  if apagou > 0 then return false; end if;
  insert into public.reacoes (sala_id, mensagem_id, user_id, emoji) values (m.sala_id, m.id, auth.uid(), emoji);
  return true;
end $$;
revoke execute on function public.reagir(bigint, text) from public, anon;
grant execute on function public.reagir(bigint, text) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.reacoes;
exception when duplicate_object then null; end $$;
