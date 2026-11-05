-- Quem aprova x quantos aprovam.
-- A proposta pode indicar quem decide (aprovadores); quantas aprovações precisam continua sendo a regra da sala.
-- Antes: indicar aprovadores exigia o sim de todos eles, mesmo numa sala com "1 pessoa".
-- Agora: precisa = o menor entre a regra da sala e quantos foram indicados ("Todos" = todos os indicados).

create or replace function public.aprovacoes_da_proposta(proposta bigint) returns int
language sql stable security definer set search_path = '' as $$
  select case
    when p.novo_contexto is not null
      then greatest(1, (select count(*)::int from public.membros m where m.sala_id = p.sala_id and m.papel in ('dono', 'membro')))
    when p.aprovadores is not null then least(cardinality(p.aprovadores), public.aprovacoes_necessarias(p.sala_id))
    else public.aprovacoes_necessarias(p.sala_id) end
  from public.mensagens p where p.id = proposta;
$$;
grant execute on function public.aprovacoes_da_proposta(bigint) to authenticated, service_role;

-- painel: "exato" (todos que faltam precisam aprovar) agora vem só da conta, também com indicados
do $$
declare d text;
begin
  d := pg_get_functiondef('public.painel_sala(uuid)'::regprocedure);
  d := replace(d, '(indicados or precisa - votos >= cardinality(faltam))', '(precisa - votos >= cardinality(faltam))');
  execute d;
end $$;

-- propostas simples que já têm os votos que a regra nova pede: fecham como aprovadas, no nome de quem votou por último
do $$
declare
  p record;
  ultimo uuid;
begin
  for p in
    select m.* from public.mensagens m
    where m.tipo = 'proposta' and m.estado = 'pendente' and not m.apagada and m.aprovadores is not null
      and m.plano is null and m.novo_contexto is null
      and (select count(*) from public.votos v where v.proposta_id = m.id) >= public.aprovacoes_da_proposta(m.id)
  loop
    select v.user_id into ultimo from public.votos v where v.proposta_id = p.id order by v.ctid desc limit 1;
    update public.mensagens set estado = 'aprovada', decidida_por = ultimo, decidida_em = now() where id = p.id;
    insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
    values (p.sala_id, ultimo, 'Aprovada.', 'decisao', 'aprovada', p.id);
    perform public._registrar(p.sala_id, ultimo, null, 'aprovou', left(split_part(btrim(p.texto), E'\n', 1), 200));
  end loop;
end $$;
