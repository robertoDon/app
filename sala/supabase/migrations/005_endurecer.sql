-- Revisão de segurança (advisor do Supabase): funções de gatilho não são chamáveis pela API,
-- helpers de RLS só para quem está logado, search_path fixo em eh_pessoa.
alter function public.eh_pessoa() set search_path = '';
revoke execute on function public.criar_perfil(), public.trava_agentes() from public, anon, authenticated;
revoke execute on function public.eh_membro(uuid), public.eh_dono(uuid), public.compartilha_sala(uuid) from public, anon;
grant execute on function public.eh_membro(uuid), public.eh_dono(uuid), public.compartilha_sala(uuid) to authenticated;
