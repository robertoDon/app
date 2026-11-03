-- Revisão dos lotes 3 e 4.

-- 1 e 9. Anexo só aponta para arquivo que existe, na pasta de quem escreve, nesta sala, com nome seguro (sem "..").
--        Tipo e tamanho vêm do armazenamento, não de quem enviou.
create or replace function public.preparar_mensagem() returns trigger
language plpgsql security definer set search_path = '' as $$
declare a jsonb; o record; limpos jsonb := '[]'::jsonb;
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
    if coalesce(a->>'path', '') !~ ('^' || new.sala_id::text || '/' || new.user_id::text || '/[0-9a-f-]{36}-[A-Za-z0-9._-]{1,120}$')
       or (a->>'path') like '%..%' then
      raise exception 'Arquivo inválido.';
    end if;
    select (obj.metadata->>'mimetype') as tipo, coalesce((obj.metadata->>'size')::bigint, 0) as tamanho into o
      from storage.objects obj where obj.bucket_id = 'arquivos' and obj.name = a->>'path';
    if not found then raise exception 'Arquivo não encontrado. Envie de novo.'; end if;
    limpos := limpos || jsonb_build_object(
      'path', a->>'path', 'nome', left(coalesce(nullif(btrim(a->>'nome'), ''), 'arquivo'), 200),
      'tipo', left(coalesce(o.tipo, 'application/octet-stream'), 100), 'tamanho', o.tamanho);
  end loop;
  new.anexos := limpos;
  return new;
end $$;
revoke execute on function public.preparar_mensagem() from public, anon, authenticated;

-- 3. Só dá para ler arquivo que está numa mensagem que não foi apagada (apagado ou nunca enviado não aparece)
create index if not exists mensagens_anexos on public.mensagens using gin (anexos jsonb_path_ops);
drop policy if exists "ler arquivos das suas salas" on storage.objects;
create policy "ler arquivos das suas salas" on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and public.eh_membro(public.sala_do_caminho(name)) and exists (
    select 1 from public.mensagens m
    where m.sala_id = public.sala_do_caminho(name) and not m.apagada
      and m.anexos @> jsonb_build_array(jsonb_build_object('path', name))));

-- 5. Editar não reabre sem querer: tarefa fechada só volta com reabrir = true
drop function if exists public.editar_tarefa(bigint, text, uuid, text, timestamptz, text);
create or replace function public.editar_tarefa(tarefa bigint, titulo text, responsavel uuid, responsavel_agente text,
  prazo timestamptz, estado text default 'aberta', reabrir boolean default false)
returns void language plpgsql security definer set search_path = '' as $$
declare t public.tarefas;
begin
  select * into t from public.tarefas where id = tarefa for update;
  if not found or not public.eh_pessoa() or not public.eh_membro(t.sala_id) then raise exception 'Tarefa não encontrada.'; end if;
  if estado not in ('aberta', 'cancelada') then raise exception 'Para concluir, use Concluir.'; end if;
  if t.estado <> 'aberta' and not reabrir then
    raise exception 'Esta tarefa acabou de ser %. Veja a lista atualizada.', case t.estado when 'feita' then 'concluída' else 'cancelada' end;
  end if;
  perform public._checar_responsavel(t.sala_id, responsavel);
  update public.tarefas set titulo = left(btrim(editar_tarefa.titulo), 200), responsavel = editar_tarefa.responsavel,
    responsavel_agente = nullif(btrim(coalesce(editar_tarefa.responsavel_agente, '')), ''), prazo = editar_tarefa.prazo,
    estado = editar_tarefa.estado, concluida_em = null, concluida_por = null, concluida_por_agente = null,
    resultado = case when editar_tarefa.estado = 'aberta' then null else resultado end
  where id = tarefa;
end $$;
revoke execute on function public.editar_tarefa(bigint, text, uuid, text, timestamptz, text, boolean) from public, anon;
grant execute on function public.editar_tarefa(bigint, text, uuid, text, timestamptz, text, boolean) to authenticated;

-- 5. Aviso também quando a tarefa muda de responsável
drop trigger if exists chamar_avisar_tarefa_troca on public.tarefas;
create trigger chamar_avisar_tarefa_troca after update of responsavel, responsavel_agente on public.tarefas
for each row when (new.estado = 'aberta' and (new.responsavel is distinct from old.responsavel
  or new.responsavel_agente is distinct from old.responsavel_agente))
execute function public.chamar_avisar_tarefa();
