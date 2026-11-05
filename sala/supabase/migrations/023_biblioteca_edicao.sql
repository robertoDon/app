-- Biblioteca: qualquer um que escreve na sala (pessoa ou agente) adiciona, edita e tira itens.
-- Tudo fica no histórico da sala. Agentes passam pelo servidor; pessoas, por estas funções.

drop policy if exists "tirar da biblioteca" on public.biblioteca;

-- registro de quem adicionou (pessoa pelo app ou agente pelo servidor)
create or replace function public.biblioteca_registrar_novo() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  perform public._registrar(new.sala_id, new.user_id, new.agente, 'adicionou à biblioteca', new.titulo);
  return new;
end $$;
drop trigger if exists biblioteca_novo on public.biblioteca;
create trigger biblioteca_novo after insert on public.biblioteca for each row execute function public.biblioteca_registrar_novo();

create or replace function public.editar_biblioteca(item bigint, titulo text, nota text) returns void
language plpgsql security definer set search_path = '' as $$
declare b public.biblioteca;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para editar.'; end if;
  select * into b from public.biblioteca where id = item;
  if b.id is null or not public.eh_membro(b.sala_id) then raise exception 'Item não encontrado.'; end if;
  if not public.pode_escrever(b.sala_id) then raise exception 'Nesta sala você só acompanha.'; end if;
  titulo := btrim(coalesce(titulo, ''));
  if titulo = '' then raise exception 'Dê um título.'; end if;
  update public.biblioteca set titulo = left(editar_biblioteca.titulo, 200), nota = nullif(left(btrim(coalesce(editar_biblioteca.nota, '')), 2000), '') where id = item;
  perform public._registrar(b.sala_id, auth.uid(), null, 'editou na biblioteca', editar_biblioteca.titulo);
end $$;
revoke execute on function public.editar_biblioteca(bigint, text, text) from public, anon;
grant execute on function public.editar_biblioteca(bigint, text, text) to authenticated;

-- devolve o caminho do arquivo (se houver) para o app apagar do armazenamento quando for dele
create or replace function public.apagar_biblioteca(item bigint) returns text
language plpgsql security definer set search_path = '' as $$
declare b public.biblioteca;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para tirar itens.'; end if;
  select * into b from public.biblioteca where id = item;
  if b.id is null or not public.eh_membro(b.sala_id) then raise exception 'Item não encontrado.'; end if;
  if not public.pode_escrever(b.sala_id) then raise exception 'Nesta sala você só acompanha.'; end if;
  delete from public.biblioteca where id = item;
  perform public._registrar(b.sala_id, auth.uid(), null, 'tirou da biblioteca', b.titulo);
  return b.path;
end $$;
revoke execute on function public.apagar_biblioteca(bigint) from public, anon;
grant execute on function public.apagar_biblioteca(bigint) to authenticated;
