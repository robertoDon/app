-- The Sala em português e inglês. O idioma fica no perfil para avisos, agentes e integrações seguirem a pessoa.
alter table public.perfis add column if not exists idioma text check (idioma in ('pt', 'en'));
