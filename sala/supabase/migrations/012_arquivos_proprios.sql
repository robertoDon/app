-- Quem subiu um arquivo sempre o enxerga (e pode apagá-lo), mesmo que ele não tenha ido para nenhuma mensagem.
drop policy if exists "ler arquivos das suas salas" on storage.objects;
create policy "ler arquivos das suas salas" on storage.objects for select to authenticated
  using (bucket_id = 'arquivos' and public.eh_membro(public.sala_do_caminho(name)) and (
    split_part(name, '/', 2) = auth.uid()::text
    or exists (
      select 1 from public.mensagens m
      where m.sala_id = public.sala_do_caminho(name) and not m.apagada
        and m.anexos @> jsonb_build_array(jsonb_build_object('path', name)))));
