-- Contexto da sala por proposta: um agente (ou pessoa) propõe o texto novo inteiro; a proposta só passa com o sim
-- de todas as pessoas que escrevem na sala (dono e membros), seja qual for o número de aprovações da sala.
-- Quando a última aprovação chega, o próprio banco troca o contexto. Ninguém precisa colar o texto.

alter table public.mensagens add column if not exists novo_contexto text;
alter table public.mensagens drop constraint if exists mensagens_novo_contexto_check;
alter table public.mensagens add constraint mensagens_novo_contexto_check
  check (novo_contexto is null or (tipo = 'proposta' and char_length(btrim(novo_contexto)) between 1 and 50000));

-- quantas aprovações esta proposta precisa: troca de contexto pede todas as pessoas que escrevem; o resto segue a sala
create or replace function public.aprovacoes_da_proposta(proposta bigint) returns int
language sql stable security definer set search_path = '' as $$
  select case when p.novo_contexto is not null
    then greatest(1, (select count(*)::int from public.membros m where m.sala_id = p.sala_id and m.papel in ('dono', 'membro')))
    else public.aprovacoes_necessarias(p.sala_id) end
  from public.mensagens p where p.id = proposta;
$$;
grant execute on function public.aprovacoes_da_proposta(bigint) to authenticated;

create or replace function public.decidir(proposta bigint, aprovar boolean, nota text default null) returns bigint
language plpgsql security definer set search_path = '' as $$
declare
  p public.mensagens;
  e text := case when aprovar then 'aprovada' else 'recusada' end;
  n text := nullif(btrim(coalesce(nota, '')), '');
  nova bigint;
  titulo text;
  votos_sim int;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas decidem propostas.'; end if;
  select * into p from public.mensagens where id = proposta and tipo = 'proposta' for update;
  if not found or not public.eh_membro(p.sala_id) then raise exception 'Proposta não encontrada.'; end if;
  if p.apagada then raise exception 'Esta proposta foi apagada.'; end if;
  if p.estado <> 'pendente' then raise exception 'Esta proposta já foi decidida.'; end if;
  if not public.pode_escrever(p.sala_id) then raise exception 'Nesta sala você só acompanha.'; end if;

  if aprovar then
    if exists (select 1 from public.votos v where v.proposta_id = proposta and v.user_id = auth.uid()) then
      raise exception 'Você já aprovou esta proposta. Falta a aprovação de outra pessoa.';
    end if;
    insert into public.votos (proposta_id, sala_id, user_id) values (proposta, p.sala_id, auth.uid());
    select count(*) into votos_sim from public.votos v where v.proposta_id = proposta;
    if votos_sim < public.aprovacoes_da_proposta(proposta) then
      perform public._registrar(p.sala_id, auth.uid(), null, 'aprovou (falta outra aprovação)', left(split_part(btrim(p.texto), E'\n', 1), 200));
      return null;
    end if;
  end if;

  update public.mensagens set estado = e, decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(),
    coalesce(left(n, 2000), case when not aprovar then 'Recusada.'
      when p.novo_contexto is not null then 'Aprovada. O contexto da sala foi trocado pelo texto da proposta.' else 'Aprovada.' end),
    'decisao', e, proposta)
  returning id into nova;

  if aprovar and p.novo_contexto is not null then
    -- já aplicada: vira contexto agora, sem tarefa para ninguém colar
    update public.salas set contexto = btrim(p.novo_contexto) where id = p.sala_id;
  elsif aprovar then
    titulo := btrim(regexp_replace(regexp_replace(split_part(btrim(p.texto), E'\n', 1), '[*_`#>]', '', 'g'), '^(eu\s+)?(proponho|sugiro|posso)\s+', '', 'i'));
    titulo := upper(left(titulo, 1)) || substr(titulo, 2);
    if char_length(titulo) > 120 then titulo := left(titulo, 119) || '…'; end if;
    if titulo = '' then titulo := 'Executar a proposta aprovada'; end if;
    insert into public.tarefas (sala_id, titulo, origem, responsavel, responsavel_agente, criada_por)
    values (p.sala_id, titulo, proposta, p.user_id, p.agente, auth.uid());
  end if;
  return nova;
end $$;
revoke execute on function public.decidir(bigint, boolean, text) from public, anon;
grant execute on function public.decidir(bigint, boolean, text) to authenticated;
