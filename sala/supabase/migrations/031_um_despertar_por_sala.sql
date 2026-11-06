-- Um despertar por vez, por agente e por sala.
-- Antes, cada mensagem que chamava o agente disparava uma tarefa nova do Claude Code. Três chamadas em poucos minutos
-- abriam três sessões em paralelo, que trabalhavam no mesmo pedido sem saber umas das outras (e entregavam versões
-- diferentes). Agora: enquanto uma sessão trabalha na sala, as chamadas novas ficam pendentes para ela; o MCP avisa a
-- sessão ao enviar; e, se a sessão terminar sem ter lido a chamada, um único despertar novo sai depois.

create table if not exists public.despertar_salas (
  user_id uuid not null references auth.users(id) on delete cascade,
  agente text not null,
  sala_id uuid not null references public.salas(id) on delete cascade,
  acordado_em timestamptz,          -- quando a última sessão foi disparada para esta sala (null = livre)
  ativo_em timestamptz,             -- última vez que o agente usou esta sala pelo MCP
  lido_ate bigint not null default 0, -- até que mensagem o agente leu esta sala
  pendente bigint,                  -- a chamada mais recente que chegou enquanto a sessão trabalhava
  primary key (user_id, agente, sala_id)
);
alter table public.despertar_salas enable row level security; -- só o serviço (funções) mexe
revoke all on public.despertar_salas from anon, authenticated;

-- sessão ainda trabalhando: usou a sala há pouco (ou acabou de ser disparada), com teto de 30 minutos
create or replace function public.despertar_ocupado(d public.despertar_salas) returns boolean
language sql stable set search_path = '' as $$
  select d.acordado_em is not null
     and d.acordado_em > now() - interval '30 minutes'
     and greatest(d.acordado_em, coalesce(d.ativo_em, d.acordado_em)) > now() - interval '5 minutes';
$$;

-- tenta reservar a sala para uma sessão nova. true = pode disparar; false = já tem sessão, a chamada fica pendente
create or replace function public.reservar_despertar(quem uuid, agente text, sala uuid, msg bigint) returns boolean
language plpgsql security definer set search_path = '' as $$
declare d public.despertar_salas;
begin
  insert into public.despertar_salas as t (user_id, agente, sala_id)
  values (quem, reservar_despertar.agente, sala)
  on conflict on constraint despertar_salas_pkey do nothing;
  select * into d from public.despertar_salas t
   where t.user_id = quem and t.agente = reservar_despertar.agente and t.sala_id = sala for update;
  if public.despertar_ocupado(d) then
    update public.despertar_salas t set pendente = greatest(coalesce(t.pendente, 0), msg)
     where t.user_id = quem and t.agente = reservar_despertar.agente and t.sala_id = sala;
    return false;
  end if;
  update public.despertar_salas t set acordado_em = now(), ativo_em = null, pendente = null
   where t.user_id = quem and t.agente = reservar_despertar.agente and t.sala_id = sala;
  return true;
end $$;

-- o MCP marca o uso da sala (e até onde leu). Só vale para salas onde houve despertar.
create or replace function public.agente_na_sala(quem uuid, agente text, sala uuid, leu_ate bigint default 0) returns void
language sql security definer set search_path = '' as $$
  update public.despertar_salas t
     set ativo_em = now(), lido_ate = greatest(t.lido_ate, coalesce(leu_ate, 0)),
         pendente = case when t.pendente <= greatest(t.lido_ate, coalesce(leu_ate, 0)) then null else t.pendente end
   where t.user_id = quem and t.agente = agente_na_sala.agente and t.sala_id = sala;
$$;

-- a cada minuto: sessão que parou sem ler uma chamada pendente → um despertar novo, só para esse agente
create or replace function public.despertar_pendentes() returns void
language plpgsql security definer set search_path = '' as $$
declare r record; segredo text;
begin
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'aviso_segredo';
  if segredo is null then return; end if;
  for r in
    with alvo as (
      select t.user_id, t.agente, t.sala_id, t.pendente from public.despertar_salas t
       where t.pendente is not null and t.pendente > t.lido_ate and not public.despertar_ocupado(t)
       for update skip locked
    )
    update public.despertar_salas t set acordado_em = null, pendente = null
      from alvo a where t.user_id = a.user_id and t.agente = a.agente and t.sala_id = a.sala_id
    returning a.user_id, a.agente, a.pendente -- o valor de antes de limpar
  loop
    perform net.http_post(
      url := 'https://cokzyrdmtnbsnnboxggp.supabase.co/functions/v1/avisar',
      body := jsonb_build_object('despertar', r.pendente, 'so_user', r.user_id, 'so_agente', r.agente),
      headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso', segredo),
      timeout_milliseconds := 5000);
  end loop;
  -- pendente que o agente já leu não precisa de nada
  update public.despertar_salas t set pendente = null where t.pendente is not null and t.pendente <= t.lido_ate;
end $$;

revoke execute on function public.reservar_despertar(uuid, text, uuid, bigint), public.agente_na_sala(uuid, text, uuid, bigint),
  public.despertar_pendentes(), public.despertar_ocupado(public.despertar_salas) from public, anon, authenticated;

create extension if not exists pg_cron;
select cron.unschedule('despertar-pendentes') where exists (select 1 from cron.job where jobname = 'despertar-pendentes');
select cron.schedule('despertar-pendentes', '* * * * *', 'select public.despertar_pendentes()');
