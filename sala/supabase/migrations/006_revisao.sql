-- Revisão do lote 2.

-- 1. "endpoint" era ambíguo (parâmetro e coluna): a inscrição de avisos sempre falhava.
create or replace function public.inscrever(endpoint text, p256dh text, auth text) returns void
language plpgsql security definer set search_path = '' as $$
begin
  if auth.uid() is null or not public.eh_pessoa() then raise exception 'Entre para receber avisos.'; end if;
  insert into public.inscricoes as i (endpoint, user_id, p256dh, auth)
  values (inscrever.endpoint, auth.uid(), inscrever.p256dh, inscrever.auth)
  on conflict on constraint inscricoes_pkey
  do update set user_id = excluded.user_id, p256dh = excluded.p256dh, auth = excluded.auth, criada_em = now();
end $$;

-- 2. Proposta não muda depois de enviada (quem aprova precisa ver o que aprova). Só quem está na sala edita.
create or replace function public.editar_mensagem(mensagem bigint, texto text)
returns void language plpgsql security definer set search_path = '' as $$
declare m public.mensagens; t text := btrim(coalesce(texto, ''));
begin
  if not public.eh_pessoa() then raise exception 'Só pessoas editam mensagens.'; end if;
  select * into m from public.mensagens where id = mensagem for update;
  if not found or not public.eh_membro(m.sala_id) or m.user_id <> auth.uid() or m.agente is not null then
    raise exception 'Você só edita as suas mensagens.';
  end if;
  if m.apagada or m.tipo <> 'mensagem' then
    raise exception 'Propostas e decisões não mudam depois de enviadas. Apague e proponha de novo.';
  end if;
  if t = '' or char_length(t) > 20000 then raise exception 'O texto precisa ter entre 1 e 20.000 caracteres.'; end if;
  update public.mensagens set texto = t, editada_em = now() where id = mensagem;
end $$;

-- 6. Sair sempre pela função (que passa a sala adiante). Direto pela API, só quem não é dono.
drop policy if exists "sair ou dono remove" on public.membros;
create policy "sair ou dono remove" on public.membros for delete to authenticated
  using (public.eh_pessoa() and papel = 'membro' and (user_id = auth.uid() or public.eh_dono(sala_id)));

create or replace function public._sair(sala uuid, quem uuid) returns void
language plpgsql security definer set search_path = '' as $$
declare proximo uuid;
begin
  perform 1 from public.salas where id = sala for update; -- uma saída por vez nesta sala
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
