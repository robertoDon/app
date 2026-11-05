-- Memória da sala: o estado do projeto, mantido pelos agentes por baixo dos panos (sem aprovação, com histórico).
-- O contexto (salas.contexto) passa a ser as instruções da sala: curtas, escritas pelas pessoas.
-- O contexto que as salas já tinham vira a memória inicial.

alter table public.salas add column if not exists memoria text not null default '';
alter table public.salas drop constraint if exists salas_memoria_check;
alter table public.salas add constraint salas_memoria_check check (char_length(memoria) <= 50000);

create table if not exists public.memoria_versoes (
  id        bigint generated always as identity primary key,
  sala_id   uuid not null references public.salas on delete cascade,
  texto     text not null check (char_length(texto) <= 50000),
  resumo    text check (char_length(resumo) <= 300),
  user_id   uuid references public.perfis (id) on delete set null,
  agente    text,
  criada_em timestamptz not null default now()
);
create index if not exists memoria_versoes_sala on public.memoria_versoes (sala_id, id desc);
alter table public.memoria_versoes enable row level security;
drop policy if exists "ver memória das suas salas" on public.memoria_versoes;
create policy "ver memória das suas salas" on public.memoria_versoes for select to authenticated
  using (public.eh_membro(sala_id));

-- pessoas editam ou voltam a memória por aqui; agentes passam pelo servidor mcp
create or replace function public.salvar_memoria(sala uuid, texto text, resumo text default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare v bigint; novo text := btrim(coalesce(texto, ''));
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas editam a memória por aqui.'; end if;
  if not public.eh_membro(sala) then raise exception 'Sala não encontrada.'; end if;
  if not public.pode_escrever(sala) then raise exception 'Nesta sala você só acompanha.'; end if;
  if char_length(novo) > 50000 then raise exception 'A memória passa de 50 mil caracteres.'; end if;
  if novo = (select memoria from public.salas where id = sala) then return null; end if;
  update public.salas set memoria = novo where id = sala;
  insert into public.memoria_versoes (sala_id, texto, resumo, user_id)
  values (sala, novo, nullif(left(btrim(coalesce(resumo, '')), 300), ''), auth.uid()) returning id into v;
  perform public._registrar(sala, auth.uid(), null, 'editou a memória', resumo);
  return v;
end $$;
revoke execute on function public.salvar_memoria(uuid, text, text) from public, anon;
grant execute on function public.salvar_memoria(uuid, text, text) to authenticated;

do $$ begin
  alter publication supabase_realtime add table public.memoria_versoes;
exception when duplicate_object then null; end $$;

-- o contexto atual vira a memória inicial; as instruções começam vazias
insert into public.memoria_versoes (sala_id, texto, resumo)
select id, btrim(contexto), 'O contexto antigo da sala virou a memória inicial.'
from public.salas where btrim(contexto) <> '' and memoria = '';
update public.salas set memoria = btrim(contexto) where btrim(contexto) <> '' and memoria = '';
-- depois que o servidor passa a ler a memória: as instruções começam vazias
update public.salas set contexto = '' where btrim(contexto) <> '' and memoria = btrim(contexto);
