-- Pedir ajuste: a pessoa devolve a proposta a quem propôs, com uma nota, sem vetar.
-- A proposta fica "ajuste"; quando o autor manda a versão nova (substitui), a antiga fica "substituida".
-- Aprovações dadas à versão antiga não contam para a nova.

alter table public.mensagens drop constraint if exists mensagens_estado_check;
alter table public.mensagens add constraint mensagens_estado_check
  check (estado = any (array['pendente', 'aprovada', 'recusada', 'ajuste', 'substituida']));
alter table public.mensagens add column if not exists substituida_por bigint references public.mensagens (id) on delete set null;

create or replace function public.pedir_ajuste(proposta bigint, nota text) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  p public.mensagens;
  n text := nullif(btrim(coalesce(nota, '')), '');
  nova bigint;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas pedem ajuste.'; end if;
  select * into p from public.mensagens where id = proposta and tipo = 'proposta' for update;
  if not found or not public.eh_membro(p.sala_id) then raise exception 'Proposta não encontrada.'; end if;
  if p.apagada then raise exception 'Esta proposta foi apagada.'; end if;
  if p.estado <> 'pendente' then raise exception 'Esta proposta já foi decidida.'; end if;
  if not public.pode_escrever(p.sala_id) then raise exception 'Nesta sala você só acompanha.'; end if;
  if n is null then raise exception 'Diga o que precisa mudar: quem propôs lê isto.'; end if;

  update public.mensagens set estado = 'ajuste', decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  delete from public.votos v where v.proposta_id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(), left(n, 2000), 'decisao', 'ajuste', proposta)
  returning id into nova;
  perform public._registrar(p.sala_id, auth.uid(), null, 'pediu ajuste', left(n, 200));
  return nova;
end $$;
revoke execute on function public.pedir_ajuste(bigint, text) from public, anon;
grant execute on function public.pedir_ajuste(bigint, text) to authenticated;
