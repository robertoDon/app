-- Guia rápido: boas-vindas e tour do app no primeiro acesso; tour da sala na primeira sala aberta.
-- Cada um aparece uma vez por pessoa, em qualquer aparelho, e pode ser revisto em Conta.
alter table public.perfis add column if not exists guia_visto timestamptz;
alter table public.perfis add column if not exists guia_sala_visto timestamptz;
