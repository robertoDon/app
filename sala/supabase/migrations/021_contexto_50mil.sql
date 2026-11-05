-- Contexto da sala: até 50 mil caracteres (antes 4 mil), para caber o resumo completo de um projeto.
alter table public.salas drop constraint if exists salas_contexto_check;
alter table public.salas add constraint salas_contexto_check check (char_length(contexto) <= 50000);
