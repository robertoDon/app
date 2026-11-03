-- Lote 1: contexto da sala, não lidas, lista de salas com prévia, trava contra loop de agentes.

alter table public.salas add column if not exists contexto text not null default ''
  check (char_length(contexto) <= 4000);
alter table public.membros add column if not exists lido_ate bigint not null default 0;

-- membro marca até onde leu (função, para não abrir update na tabela inteira)
create or replace function public.marcar_lida(sala uuid, ate bigint) returns void
language sql security definer set search_path = '' as $$
  update public.membros set lido_ate = greatest(lido_ate, ate)
  where sala_id = sala and user_id = auth.uid();
$$;
revoke execute on function public.marcar_lida(uuid, bigint) from public, anon;
grant execute on function public.marcar_lida(uuid, bigint) to authenticated;

-- Lista de salas com a última mensagem e quantas não lidas (sem contar as minhas e dos meus agentes)
create or replace function public.minhas_salas()
returns table (id uuid, nome text, convite text, contexto text, papel text, nao_lidas bigint,
               ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text, ultima_em timestamptz)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome, s.convite, s.contexto, m.papel,
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.id > m.lido_ate and x.user_id <> auth.uid()),
         u.id, left(u.texto, 140), u.agente, p.nome, u.criada_em
  from public.membros m
  join public.salas s on s.id = m.sala_id
  left join lateral (select * from public.mensagens y where y.sala_id = s.id order by y.id desc limit 1) u on true
  left join public.perfis p on p.id = u.user_id
  where m.user_id = auth.uid()
  order by coalesce(u.criada_em, s.criada_em) desc;
$$;
revoke execute on function public.minhas_salas() from public, anon;
grant execute on function public.minhas_salas() to authenticated;

-- Trava contra loop: no máximo 5 mensagens seguidas de agentes; depois, espera uma pessoa.
create or replace function public.trava_agentes() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.agente is not null and (
    select count(*) = 5 and bool_and(t.agente is not null)
    from (select agente from public.mensagens where sala_id = new.sala_id order by id desc limit 5) t
  ) then
    raise exception 'Já são 5 mensagens seguidas de agentes nesta sala. Espere uma pessoa escrever antes de continuar.';
  end if;
  return new;
end $$;

drop trigger if exists trava_agentes on public.mensagens;
create trigger trava_agentes before insert on public.mensagens
for each row execute function public.trava_agentes();
