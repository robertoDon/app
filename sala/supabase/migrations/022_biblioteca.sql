-- Biblioteca da sala: arquivos e links que servem de referência e contexto para pessoas e agentes.
-- Arquivo fica no mesmo armazenamento dos anexos ("arquivos", caminho sala/pessoa/...); link guarda só o endereço.

create table if not exists public.biblioteca (
  id          bigint generated always as identity primary key,
  sala_id     uuid not null references public.salas on delete cascade,
  user_id     uuid not null references public.perfis on delete cascade,
  agente      text check (agente is null or char_length(agente) between 1 and 40),
  tipo        text not null check (tipo in ('arquivo', 'link')),
  titulo      text not null check (char_length(titulo) between 1 and 200),
  nota        text check (nota is null or char_length(nota) <= 2000),
  url         text check (url is null or (url ~* '^https?://' and char_length(url) <= 2000)),
  path        text,
  nome        text,
  mime        text,
  tamanho     bigint,
  criado_em   timestamptz not null default now(),
  check ((tipo = 'link' and url is not null and path is null) or (tipo = 'arquivo' and path is not null and url is null))
);
create index if not exists biblioteca_sala on public.biblioteca (sala_id, id desc);

alter table public.biblioteca enable row level security;
alter table public.biblioteca replica identity full;

drop policy if exists "ver a biblioteca das suas salas" on public.biblioteca;
create policy "ver a biblioteca das suas salas" on public.biblioteca for select to authenticated
  using (public.eh_membro(sala_id));

-- pessoa (pelo app) adiciona; o arquivo precisa estar na pasta dela dentro da sala
drop policy if exists "adicionar na biblioteca" on public.biblioteca;
create policy "adicionar na biblioteca" on public.biblioteca for insert to authenticated
  with check (
    user_id = auth.uid() and agente is null and public.eh_pessoa() and public.pode_escrever(sala_id)
    and (path is null or (public.sala_do_caminho(path) = sala_id and split_part(path, '/', 2) = auth.uid()::text))
  );

-- quem adicionou ou quem cuida da sala tira
drop policy if exists "tirar da biblioteca" on public.biblioteca;
create policy "tirar da biblioteca" on public.biblioteca for delete to authenticated
  using (public.eh_pessoa() and (user_id = auth.uid() or public.eh_dono(sala_id)));

revoke update on public.biblioteca from anon, authenticated;

-- quem é da sala lê os arquivos da biblioteca (além dos anexados em mensagens)
drop policy if exists "ler arquivos das suas salas" on storage.objects;
create policy "ler arquivos das suas salas" on storage.objects for select to authenticated
  using (
    bucket_id = 'arquivos' and public.eh_membro(public.sala_do_caminho(name)) and (
      split_part(name, '/', 2) = auth.uid()::text
      or exists (select 1 from public.mensagens m where m.sala_id = public.sala_do_caminho(objects.name) and not m.apagada
                 and m.anexos @> jsonb_build_array(jsonb_build_object('path', objects.name)))
      or exists (select 1 from public.biblioteca b where b.sala_id = public.sala_do_caminho(objects.name) and b.path = objects.name)
    )
  );

do $$ begin
  alter publication supabase_realtime add table public.biblioteca;
exception when duplicate_object then null; end $$;
