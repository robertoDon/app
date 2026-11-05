-- Idioma da sala: a conversa (textos que o sistema grava, @agentes/@agents, o que os agentes escrevem) segue a sala.
-- Botões e menus continuam no idioma de cada pessoa (perfis.idioma).

alter table public.salas add column if not exists idioma text not null default 'pt';
alter table public.salas drop constraint if exists salas_idioma_check;
alter table public.salas add constraint salas_idioma_check check (idioma in ('pt', 'en'));

-- sala nova nasce no idioma de quem cria
create or replace function public.idioma_da_sala_nova() returns trigger
language plpgsql security definer set search_path = '' as $$
begin
  new.idioma := coalesce((select p.idioma from public.perfis p where p.id = auth.uid()), new.idioma, 'pt');
  return new;
end $$;
drop trigger if exists idioma_da_sala_nova on public.salas;
create trigger idioma_da_sala_nova before insert on public.salas for each row execute function public.idioma_da_sala_nova();

-- a lista de salas passa a trazer o idioma
drop function if exists public.minhas_salas();
create function public.minhas_salas()
 returns table(id uuid, nome text, convite text, convite_leitura text, contexto text, papel text, nao_lidas bigint, pendentes bigint,
   lido_ate bigint, minhas_tarefas bigint, ultima_id bigint, ultima_texto text, ultima_agente text, ultima_nome text,
   ultima_em timestamp with time zone, ultima_tipo text, idioma text)
 language sql stable security definer set search_path to ''
as $function$
  select s.id, s.nome,
         case when m.papel = 'leitor' then null else s.convite end,
         case when m.papel = 'dono' then s.convite_leitura end,
         s.contexto, m.papel,
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.id > m.lido_ate and x.user_id <> auth.uid()),
         (select count(*) from public.mensagens x
           where x.sala_id = s.id and x.tipo = 'proposta' and x.estado = 'pendente' and not x.apagada),
         m.lido_ate,
         (select count(*) from public.tarefas t where t.sala_id = s.id and t.estado = 'aberta' and t.responsavel = auth.uid()),
         u.id, left(case when u.texto = '' and jsonb_array_length(u.anexos) > 0 then '📎 ' || (u.anexos->0->>'nome') else u.texto end, 140),
         u.agente, p.nome, u.criada_em, u.tipo, s.idioma
  from public.membros m
  join public.salas s on s.id = m.sala_id
  left join lateral (select * from public.mensagens y where y.sala_id = s.id order by y.id desc limit 1) u on true
  left join public.perfis p on p.id = u.user_id
  where m.user_id = auth.uid()
  order by coalesce(u.criada_em, s.criada_em) desc;
$function$;
revoke execute on function public.minhas_salas() from public, anon;
grant execute on function public.minhas_salas() to authenticated;
