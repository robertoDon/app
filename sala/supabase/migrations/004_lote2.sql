-- Sala, lote 2: propostas e decisões, respostas, editar e apagar, presença dos agentes,
-- vários donos, saída sem perder a sala, avisos no celular (web push) e exclusão de conta.

-- ---------------------------------------------------------------- mensagens: tipo, resposta, edição

alter table public.mensagens
  add column if not exists tipo text not null default 'mensagem' check (tipo in ('mensagem', 'proposta', 'decisao')),
  add column if not exists responde_a bigint references public.mensagens (id) on delete set null,
  add column if not exists estado text check (estado in ('pendente', 'aprovada', 'recusada')),
  add column if not exists decidida_por uuid references public.perfis (id) on delete set null,
  add column if not exists decidida_em timestamptz,
  add column if not exists editada_em timestamptz,
  add column if not exists apagada boolean not null default false;

create index if not exists mensagens_propostas on public.mensagens (sala_id, id) where tipo <> 'mensagem';
create index if not exists mensagens_responde on public.mensagens (responde_a) where responde_a is not null;

-- proposta sempre nasce pendente; resposta só vale para mensagem da mesma sala
create or replace function public.preparar_mensagem() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  if new.tipo = 'proposta' then
    new.estado := 'pendente'; new.decidida_por := null; new.decidida_em := null;
  elsif new.tipo = 'mensagem' then
    new.estado := null;
  end if;
  if new.responde_a is not null and not exists (
    select 1 from public.mensagens r where r.id = new.responde_a and r.sala_id = new.sala_id
  ) then
    new.responde_a := null;
  end if;
  return new;
end $$;

drop trigger if exists preparar_mensagem on public.mensagens;
create trigger preparar_mensagem before insert on public.mensagens
for each row execute function public.preparar_mensagem();

-- pessoa escreve mensagem ou proposta, como ela mesma; decisão só pela função decidir()
drop policy if exists "pessoa escreve" on public.mensagens;
create policy "pessoa escreve" on public.mensagens for insert to authenticated
  with check (
    user_id = auth.uid() and agente is null and public.eh_pessoa() and public.eh_membro(sala_id)
    and tipo in ('mensagem', 'proposta') and coalesce(estado, 'pendente') = 'pendente'
    and decidida_por is null and decidida_em is null and editada_em is null and not apagada
  );

-- ---------------------------------------------------------------- decidir, editar, apagar

create or replace function public.decidir(proposta bigint, aprovar boolean, nota text default null)
returns bigint language plpgsql security definer set search_path = '' as $$
declare
  p public.mensagens;
  e text := case when aprovar then 'aprovada' else 'recusada' end;
  n text := nullif(btrim(coalesce(nota, '')), '');
  nova bigint;
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Só pessoas decidem propostas.'; end if;
  select * into p from public.mensagens where id = proposta and tipo = 'proposta' for update;
  if not found or not public.eh_membro(p.sala_id) then raise exception 'Proposta não encontrada.'; end if;
  if p.apagada then raise exception 'Esta proposta foi apagada.'; end if;
  if p.estado <> 'pendente' then raise exception 'Esta proposta já foi decidida.'; end if;

  update public.mensagens set estado = e, decidida_por = auth.uid(), decidida_em = now() where id = proposta;
  insert into public.mensagens (sala_id, user_id, texto, tipo, estado, responde_a)
  values (p.sala_id, auth.uid(), coalesce(left(n, 2000), case when aprovar then 'Aprovada.' else 'Recusada.' end), 'decisao', e, proposta)
  returning id into nova;
  return nova;
end $$;

create or replace function public.editar_mensagem(mensagem bigint, texto text)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.mensagens; t text := btrim(coalesce(texto, ''));
begin
  if not public.eh_pessoa() then raise exception 'Só pessoas editam mensagens.'; end if;
  select * into m from public.mensagens where id = mensagem for update;
  if not found or m.user_id <> auth.uid() or m.agente is not null then raise exception 'Você só edita as suas mensagens.'; end if;
  if m.apagada or m.tipo = 'decisao' or (m.tipo = 'proposta' and m.estado <> 'pendente') then
    raise exception 'Esta mensagem não pode mais ser editada.';
  end if;
  if t = '' or char_length(t) > 20000 then raise exception 'O texto precisa ter entre 1 e 20.000 caracteres.'; end if;
  update public.mensagens set texto = t, editada_em = now() where id = mensagem;
end $$;

-- apaga o conteúdo e deixa o lugar marcado. Você apaga as suas e as dos seus agentes; quem é dono, qualquer uma.
create or replace function public.apagar_mensagem(mensagem bigint)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.mensagens;
begin
  if not public.eh_pessoa() then raise exception 'Só pessoas apagam mensagens.'; end if;
  select * into m from public.mensagens where id = mensagem for update;
  if not found or not public.eh_membro(m.sala_id) then raise exception 'Mensagem não encontrada.'; end if;
  if m.user_id <> auth.uid() and not public.eh_dono(m.sala_id) then
    raise exception 'Você apaga as suas mensagens e as dos seus agentes.';
  end if;
  update public.mensagens set apagada = true, texto = 'Mensagem apagada.' where id = mensagem;
end $$;

-- ---------------------------------------------------------------- presença dos agentes

create table if not exists public.agentes (
  user_id     uuid not null references public.perfis on delete cascade,
  nome        text not null check (char_length(nome) between 1 and 40),
  visto_em    timestamptz not null default now(),
  ouvindo_ate timestamptz,          -- esperando mensagem agora (Claude Code escutando, esperar_mensagens)
  primary key (user_id, nome)
);
alter table public.agentes enable row level security;
drop policy if exists "ver agentes de quem divide sala" on public.agentes;
create policy "ver agentes de quem divide sala" on public.agentes for select to authenticated
  using (public.compartilha_sala(user_id));
drop policy if exists "tirar os próprios agentes" on public.agentes;
create policy "tirar os próprios agentes" on public.agentes for delete to authenticated
  using (user_id = auth.uid() and public.eh_pessoa());

-- ---------------------------------------------------------------- donos e saída

-- quem criou pode sair da conta sem levar a sala junto
alter table public.salas alter column criada_por drop not null;
alter table public.salas drop constraint if exists salas_criada_por_fkey;
alter table public.salas add constraint salas_criada_por_fkey
  foreign key (criada_por) references public.perfis (id) on delete set null;

-- dono só tira quem não é dono
drop policy if exists "sair ou dono remove" on public.membros;
create policy "sair ou dono remove" on public.membros for delete to authenticated
  using (public.eh_pessoa() and (user_id = auth.uid() or (public.eh_dono(sala_id) and papel = 'membro')));

create or replace function public.tornar_dono(sala uuid, pessoa uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_dono(sala) or not public.eh_pessoa() then raise exception 'Só quem é dono da sala faz isso.'; end if;
  update public.membros set papel = 'dono' where sala_id = sala and user_id = pessoa;
end $$;

-- sai da sala. Se era o último dono, passa para quem entrou primeiro; se era o último, a sala some.
create or replace function public._sair(sala uuid, quem uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare proximo uuid;
begin
  if exists (select 1 from public.membros where sala_id = sala and user_id = quem and papel = 'dono')
     and not exists (select 1 from public.membros where sala_id = sala and user_id <> quem and papel = 'dono') then
    select user_id into proximo from public.membros where sala_id = sala and user_id <> quem order by entrou_em limit 1;
    if proximo is null then
      delete from public.salas where id = sala;
      return;
    end if;
    update public.membros set papel = 'dono' where sala_id = sala and user_id = proximo;
  end if;
  delete from public.membros where sala_id = sala and user_id = quem;
end $$;
revoke execute on function public._sair(uuid, uuid) from public, anon, authenticated;

create or replace function public.sair_da_sala(sala uuid) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if not public.eh_membro(sala) or not public.eh_pessoa() then raise exception 'Você não está nesta sala.'; end if;
  perform public._sair(sala, auth.uid());
end $$;

-- a edge function chama antes de apagar a conta (service role)
create or replace function public.sair_de_tudo(quem uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare s uuid;
begin
  for s in select sala_id from public.membros where user_id = quem loop
    perform public._sair(s, quem);
  end loop;
end $$;
revoke execute on function public.sair_de_tudo(uuid) from public, anon, authenticated;

-- ---------------------------------------------------------------- avisos (web push)

alter table public.perfis add column if not exists avisos text not null default 'mencoes'
  check (avisos in ('tudo', 'mencoes', 'nada'));

create table if not exists public.inscricoes (
  endpoint   text primary key,
  user_id    uuid not null references public.perfis on delete cascade,
  p256dh     text not null,
  auth       text not null,
  criada_em  timestamptz not null default now()
);
create index if not exists inscricoes_user on public.inscricoes (user_id);
alter table public.inscricoes enable row level security;
drop policy if exists "ver as próprias inscrições" on public.inscricoes;
create policy "ver as próprias inscrições" on public.inscricoes for select to authenticated
  using (user_id = auth.uid() and public.eh_pessoa());
drop policy if exists "apagar as próprias inscrições" on public.inscricoes;
create policy "apagar as próprias inscrições" on public.inscricoes for delete to authenticated
  using (user_id = auth.uid() and public.eh_pessoa());

-- o aparelho pode ter sido de outra pessoa antes: a inscrição passa para quem está agora
create or replace function public.inscrever(endpoint text, p256dh text, auth text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para receber avisos.'; end if;
  insert into public.inscricoes (endpoint, user_id, p256dh, auth)
  values (inscrever.endpoint, auth.uid(), inscrever.p256dh, inscrever.auth)
  on conflict (endpoint) do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, criada_em = now();
end $$;

-- a cada mensagem nova, se alguém da sala tem aviso ligado, chama a função "avisar"
create extension if not exists pg_net with schema extensions;

create or replace function public.chamar_avisar() returns trigger
language plpgsql security definer set search_path = '' as $$
declare segredo text;
begin
  if new.apagada or not exists (
    select 1 from public.inscricoes i join public.membros m on m.user_id = i.user_id
    join public.perfis p on p.id = i.user_id
    where m.sala_id = new.sala_id and i.user_id <> new.user_id and p.avisos <> 'nada'
  ) then
    return null;
  end if;
  select decrypted_secret into segredo from vault.decrypted_secrets where name = 'aviso_segredo';
  if segredo is null then return null; end if;
  perform net.http_post(
    url := 'https://cokzyrdmtnbsnnboxggp.supabase.co/functions/v1/avisar',
    body := jsonb_build_object('id', new.id),
    headers := jsonb_build_object('Content-Type', 'application/json', 'x-aviso', segredo)
  );
  return null;
end $$;

drop trigger if exists chamar_avisar on public.mensagens;
create trigger chamar_avisar after insert on public.mensagens
for each row execute function public.chamar_avisar();

-- ---------------------------------------------------------------- lista de salas com propostas pendentes

drop function if exists public.minhas_salas();
create or replace function public.minhas_salas()
returns table (id uuid, nome text, convite text, contexto text, papel text, nao_lidas bigint, pendentes bigint,
               ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text, ultima_em timestamptz, ultima_tipo text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome, s.convite, s.contexto, m.papel,
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.id > m.lido_ate and x.user_id <> auth.uid()),
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.tipo = 'proposta' and x.estado = 'pendente' and not x.apagada),
         u.id, left(u.texto, 140), u.agente, p.nome, u.criada_em, u.tipo
  from public.membros m
  join public.salas s on s.id = m.sala_id
  left join lateral (select * from public.mensagens y where y.sala_id = s.id order by y.id desc limit 1) u on true
  left join public.perfis p on p.id = u.user_id
  where m.user_id = auth.uid()
  order by coalesce(u.criada_em, s.criada_em) desc;
$$;

-- ---------------------------------------------------------------- permissões e tempo real

revoke execute on function public.decidir(bigint, boolean, text), public.editar_mensagem(bigint, text),
  public.apagar_mensagem(bigint), public.tornar_dono(uuid, uuid), public.sair_da_sala(uuid),
  public.inscrever(text, text, text), public.minhas_salas() from public, anon;
grant execute on function public.decidir(bigint, boolean, text), public.editar_mensagem(bigint, text),
  public.apagar_mensagem(bigint), public.tornar_dono(uuid, uuid), public.sair_da_sala(uuid),
  public.inscrever(text, text, text), public.minhas_salas() to authenticated;
revoke execute on function public.preparar_mensagem(), public.chamar_avisar() from public, anon, authenticated;

do $$ begin
  alter publication supabase_realtime add table public.agentes;
exception when duplicate_object then null; end $$;

-- a função "avisar" confere o segredo lendo daqui (só service role)
create or replace function public.segredo_aviso() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'aviso_segredo';
$$;
revoke execute on function public.segredo_aviso() from public, anon, authenticated;

-- chave privada VAPID (JWK) guardada no Vault como 'vapid_jwk'; só a função "avisar" lê
create or replace function public.chave_vapid() returns text
language sql stable security definer set search_path = '' as $$
  select decrypted_secret from vault.decrypted_secrets where name = 'vapid_jwk';
$$;
revoke execute on function public.chave_vapid() from public, anon, authenticated;
