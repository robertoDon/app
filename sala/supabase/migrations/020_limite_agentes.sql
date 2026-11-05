-- Trava contra loop com limite por sala: quantas mensagens seguidas de agentes antes de esperar uma pessoa.
-- Padrão 5; uma sala de discussão entre agentes pode subir (até 50).
alter table public.salas add column if not exists limite_agentes int not null default 5
  check (limite_agentes between 1 and 50);

create or replace function public.trava_agentes() returns trigger
language plpgsql security definer set search_path = '' as $$
declare lim int;
begin
  if new.agente is null then return new; end if;
  select s.limite_agentes into lim from public.salas s where s.id = new.sala_id;
  lim := coalesce(lim, 5);
  if (
    select count(*) = lim and bool_and(t.agente is not null)
    from (select agente from public.mensagens where sala_id = new.sala_id order by id desc limit lim) t
  ) then
    raise exception 'Já são % mensagens seguidas de agentes nesta sala. Espere uma pessoa escrever antes de continuar.', lim;
  end if;
  return new;
end $$;
