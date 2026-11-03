-- Integrações no idioma de quem ligou (perfis.idioma): português ou inglês.

create or replace function public._disparar(sala uuid, evento text, texto text, dados jsonb default '{}'::jsonb, texto_en text default null)
returns void language plpgsql security definer set search_path = '' as $$
declare i record; nome text; en boolean; msg text;
begin
  select s.nome into nome from public.salas s where s.id = sala;
  if nome is null then return; end if;
  for i in select g.*, p.idioma from public.integracoes g left join public.perfis p on p.id = g.criada_por
           where g.sala_id = sala and evento = any(g.eventos) loop
    if public._url_externa(i.url) then
      en := i.idioma = 'en' and texto_en is not null;
      msg := case when en then texto_en else texto end;
      perform net.http_post(url := i.url,
        body := public._corpo_integracao(i.url, evento, sala, nome, msg || E'\n' || public.app_url() || '/s/' || sala, dados),
        headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'The Sala'),
        timeout_milliseconds := 5000);
    end if;
  end loop;
end $$;
drop function if exists public._disparar(uuid, text, text, jsonb);

-- "Claude de Ana" / "Ana's Claude"
create or replace function public._autor_en(uid uuid, agente text) returns text language sql stable security definer set search_path = '' as $$
  select coalesce(split_part(public.nome_de(uid), ' ', 1) || '''s ' || agente, public.nome_de(uid));
$$;

create or replace function public.integrar_mensagem() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sala_nome text; resumo text := left(regexp_replace(new.texto, '\s+', ' ', 'g'), 300); p public.mensagens;
  ptxt text; ptxt_en text; nota boolean;
begin
  if not exists (select 1 from public.integracoes where sala_id = new.sala_id) then return null; end if;
  select nome into sala_nome from public.salas where id = new.sala_id;
  if new.tipo = 'proposta' then
    perform public._disparar(new.sala_id, 'proposta',
      '📝 ' || public._autor(new.user_id, new.agente) || ' fez uma proposta em "' || sala_nome || '": ' || resumo,
      jsonb_build_object('mensagem', new.id, 'autor', public._autor(new.user_id, new.agente)),
      '📝 ' || public._autor_en(new.user_id, new.agente) || ' made a proposal in "' || sala_nome || '": ' || resumo);
  elsif new.tipo = 'decisao' then
    select * into p from public.mensagens where id = new.responde_a;
    ptxt := left(regexp_replace(coalesce(p.texto, ''), '\s+', ' ', 'g'), 300);
    nota := new.texto not in ('Aprovada.', 'Recusada.');
    perform public._disparar(new.sala_id, 'decisao',
      case new.estado when 'aprovada' then '✅ ' else '❌ ' end || public.nome_de(new.user_id) ||
      case new.estado when 'aprovada' then ' aprovou' else ' recusou' end || ' em "' || sala_nome || '": ' || ptxt ||
      case when nota then ' · "' || resumo || '"' else '' end,
      jsonb_build_object('proposta', new.responde_a, 'estado', new.estado, 'decidida_por', public.nome_de(new.user_id)),
      case new.estado when 'aprovada' then '✅ ' else '❌ ' end || public.nome_de(new.user_id) ||
      case new.estado when 'aprovada' then ' approved' else ' declined' end || ' in "' || sala_nome || '": ' || ptxt ||
      case when nota then ' · "' || resumo || '"' else '' end);
  elsif not new.apagada then
    perform public._disparar(new.sala_id, 'mensagem',
      '💬 ' || public._autor(new.user_id, new.agente) || ' em "' || sala_nome || '": ' || resumo,
      jsonb_build_object('mensagem', new.id, 'autor', public._autor(new.user_id, new.agente)),
      '💬 ' || public._autor_en(new.user_id, new.agente) || ' in "' || sala_nome || '": ' ||
        regexp_replace(resumo, '^✓ Concluí a tarefa: ', '✓ Completed the task: '));
  end if;
  return null;
end $$;

create or replace function public.integrar_tarefa() returns trigger
language plpgsql security definer set search_path = '' as $$
declare sala_nome text; quem text; quem_en text; quem_fez text; quem_fez_en text;
begin
  if not exists (select 1 from public.integracoes where sala_id = new.sala_id) then return null; end if;
  select nome into sala_nome from public.salas where id = new.sala_id;
  quem := case when new.responsavel is null then 'sem responsável' else public._autor(new.responsavel, new.responsavel_agente) end;
  quem_en := case when new.responsavel is null then 'unassigned' else public._autor_en(new.responsavel, new.responsavel_agente) end;
  if tg_op = 'INSERT' then
    perform public._disparar(new.sala_id, 'tarefa_nova',
      '☐ Tarefa nova em "' || sala_nome || '": ' || new.titulo || ' · ' || quem ||
        coalesce(' · até ' || to_char(new.prazo at time zone 'America/Sao_Paulo', 'DD/MM'), ''),
      jsonb_build_object('tarefa', new.id, 'titulo', new.titulo, 'responsavel', quem, 'prazo', new.prazo),
      '☐ New task in "' || sala_nome || '": ' || new.titulo || ' · ' || quem_en ||
        coalesce(' · due ' || to_char(new.prazo at time zone 'America/Sao_Paulo', 'Mon DD'), ''));
  elsif new.estado = 'feita' and old.estado <> 'feita' then
    quem_fez := coalesce(public._autor(new.concluida_por, new.concluida_por_agente), quem);
    quem_fez_en := coalesce(public._autor_en(new.concluida_por, new.concluida_por_agente), quem_en);
    perform public._disparar(new.sala_id, 'tarefa_feita',
      '☑ ' || quem_fez || ' concluiu em "' || sala_nome || '": ' || new.titulo || coalesce(' · ' || left(new.resultado, 300), ''),
      jsonb_build_object('tarefa', new.id, 'titulo', new.titulo, 'resultado', new.resultado),
      '☑ ' || quem_fez_en || ' completed in "' || sala_nome || '": ' || new.titulo || coalesce(' · ' || left(new.resultado, 300), ''));
  end if;
  return null;
end $$;

create or replace function public.testar_integracao(integracao bigint) returns void
language plpgsql security definer set search_path = '' as $$
declare i public.integracoes; nome text; en boolean;
begin
  select * into i from public.integracoes where id = integracao;
  if not found or not public.eh_dono(i.sala_id) or not public.eh_pessoa() then raise exception 'Integração não encontrada.'; end if;
  select s.nome into nome from public.salas s where s.id = i.sala_id;
  select p.idioma = 'en' into en from public.perfis p where p.id = auth.uid();
  perform net.http_post(url := i.url,
    body := public._corpo_integracao(i.url, 'teste', i.sala_id, nome,
      case when coalesce(en, false) then '👋 Test from The Sala: the room "' || nome || '" is connected here.'
        else '👋 Teste do The Sala: a sala "' || nome || '" está ligada aqui.' end
      || E'\n' || public.app_url() || '/s/' || i.sala_id, '{}'::jsonb),
    headers := jsonb_build_object('Content-Type', 'application/json', 'User-Agent', 'The Sala'),
    timeout_milliseconds := 5000);
end $$;

revoke execute on function public._disparar(uuid, text, text, jsonb, text), public._autor_en(uuid, text),
  public.integrar_mensagem(), public.integrar_tarefa() from public, anon, authenticated;
