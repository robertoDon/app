-- The Sala, lote 3: arquivos na conversa e "enquanto você esteve fora".

-- ---------------------------------------------------------------- arquivos (Supabase Storage, privado)
-- Caminho: <sala_id>/<user_id>/<uuid>-<nome>. Só quem está na sala lê; cada um sobe com o próprio id.

insert into storage.buckets (id, name, public, file_size_limit)
values ('arquivos', 'arquivos', false, 10485760)
on conflict (id) do update set public = false, file_size_limit = 10485760;

create or replace function public.sala_do_caminho(caminho text) returns uuid
language sql immutable set search_path = '' as $$
  select case when split_part(caminho, '/', 1) ~ '^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$'
              then split_part(caminho, '/', 1)::uuid end;
$$;

drop policy if exists "ler arquivos das suas salas" on storage.objects;
create policy "ler arquivos das suas salas" on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and public.eh_membro(public.sala_do_caminho(name)));
drop policy if exists "subir arquivo na sua sala" on storage.objects;
create policy "subir arquivo na sua sala" on storage.objects for insert to authenticated
  with check (bucket_id = 'arquivos' and public.eh_pessoa() and public.eh_membro(public.sala_do_caminho(name))
              and split_part(name, '/', 2) = auth.uid()::text);
drop policy if exists "apagar os próprios arquivos" on storage.objects;
create policy "apagar os próprios arquivos" on storage.objects for delete to authenticated
  using (bucket_id = 'arquivos' and public.eh_pessoa() and split_part(name, '/', 2) = auth.uid()::text);

alter table public.mensagens add column if not exists anexos jsonb not null default '[]'::jsonb;
alter table public.mensagens drop constraint if exists mensagens_texto_check;
alter table public.mensagens add constraint mensagens_texto_check
  check (char_length(texto) <= 20000 and (char_length(texto) >= 1 or jsonb_array_length(anexos) > 0));

-- anexo só aponta para arquivo da própria sala e de quem escreve; no máximo 10
create or replace function public.preparar_mensagem() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a jsonb; limpos jsonb := '[]'::jsonb;
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
  if jsonb_typeof(new.anexos) <> 'array' then new.anexos := '[]'::jsonb; end if;
  if jsonb_array_length(new.anexos) > 10 then raise exception 'No máximo 10 arquivos por mensagem.'; end if;
  for a in select * from jsonb_array_elements(new.anexos) loop
    if coalesce(a->>'path', '') not like new.sala_id::text || '/' || new.user_id::text || '/%' then
      raise exception 'Arquivo de outra sala ou de outra pessoa.';
    end if;
    limpos := limpos || jsonb_build_object(
      'path', a->>'path', 'nome', left(coalesce(a->>'nome', 'arquivo'), 200),
      'tipo', left(coalesce(a->>'tipo', 'application/octet-stream'), 100),
      'tamanho', coalesce((a->>'tamanho')::bigint, 0));
  end loop;
  new.anexos := limpos;
  return new;
end $$;
revoke execute on function public.preparar_mensagem() from public, anon, authenticated;

-- apagar a mensagem também tira os anexos da conversa; o app apaga o arquivo pela API do Storage
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
  update public.mensagens set apagada = true, texto = 'Mensagem apagada.', anexos = '[]'::jsonb where id = mensagem;
end $$;

-- ---------------------------------------------------------------- lista de salas com "lido até"

drop function if exists public.minhas_salas();
create or replace function public.minhas_salas()
returns table (id uuid, nome text, convite text, contexto text, papel text, nao_lidas bigint, pendentes bigint, lido_ate bigint,
               ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text, ultima_em timestamptz, ultima_tipo text)
language sql stable security definer set search_path = '' as $$
  select s.id, s.nome, s.convite, s.contexto, m.papel,
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.id > m.lido_ate and x.user_id <> auth.uid()),
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.tipo = 'proposta' and x.estado = 'pendente' and not x.apagada),
         m.lido_ate,
         u.id, left(case when u.texto = '' and jsonb_array_length(u.anexos) > 0 then '📎 ' || (u.anexos->0->>'nome') else u.texto end, 140),
         u.agente, p.nome, u.criada_em, u.tipo
  from public.membros m
  join public.salas s on s.id = m.sala_id
  left join lateral (select * from public.mensagens y where y.sala_id = s.id order by y.id desc limit 1) u on true
  left join public.perfis p on p.id = u.user_id
  where m.user_id = auth.uid()
  order by coalesce(u.criada_em, s.criada_em) desc;
$$;
revoke execute on function public.minhas_salas() from public, anon;
grant execute on function public.minhas_salas() to authenticated;
