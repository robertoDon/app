-- The Sala passa a morar em the-sala.vercel.app (o endereço antigo redireciona para cá).
create or replace function public.app_url() returns text language sql immutable as $$ select 'https://the-sala.vercel.app' $$;
