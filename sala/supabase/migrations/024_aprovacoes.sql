-- Propostas com mais de uma aprovação: cada sala define quantas pessoas precisam aprovar (1 = como antes;
-- 20 = na prática, todo mundo que escreve na sala). Cada "Aprovar" vira um voto; um "Recusar" encerra na hora.

alter table public.salas add column if not exists aprovacoes int not null default 1 check (aprovacoes between 1 and 20);

create table if not exists public.votos (
  proposta_id bigint not null references public.mensagens on delete cascade,
  sala_id     uuid not null references public.salas on delete cascade,
  user_id     uuid not null references public.perfis on delete cascade,
  criado_em   timestamptz not null default now(),
  primary key (proposta_id, user_id)
);
create index if not exists votos_sala on public.votos (sala_id);
alter table public.votos enable row level security;
alter table public.votos replica identity full;
drop policy if exists "ver votos das suas salas" on public.votos;
create policy "ver votos das suas salas" on public.votos for select to authenticated using (public.eh_membro(sala_id));
revoke insert, update, delete on public.votos from anon, authenticated;
do $$ begin
  alter publication supabase_realtime add table public.votos;
exception when duplicate_object then null; end $$;

-- quantas aprovações esta proposta precisa (nunca mais do que quem pode escrever na sala)
create or replace function public.aprovacoes_necessarias(sala uuid) returns int
language sql stable security definer set search_path = '' as $$
  select least(
    (select s.aprovacoes from public.salas s where s.id = sala),
    greatest(1, (select count(*)::int from public.membros m where m.sala_id = sala and m.papel in ('dono', 'membro')))
  );
$$;
grant execute on function public.aprovacoes_necessarias(uuid) to authenticated;

-- devolve o id da mensagem de decisão quando a proposta fecha; null quando o voto foi registrado e ainda faltam aprovações
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
    if votos_sim < public.aprovacoes_necessarias(p.sala_id) then
      perform public._registrar(p.sala_id, auth.uid(), null, 'aprovou (falta outra aprovação)', left(split_part(btrim(p.texto), E'\n', 1), 200));
      return null;
    end if;
  end if;

  update public.mensagens set estado = e, decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(), coalesce(left(n, 2000), case when aprovar then 'Aprovada.' else 'Recusada.' end), 'decisao', e, proposta)
  returning id into nova;

  if aprovar then
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
