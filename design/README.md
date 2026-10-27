# Design da Dalva

Canvas do conceito do produto: https://claude.ai/artifact/JoLM6BpVWakan6zacwe6mP (v33, 27/10/2026).

- `canvas/` — as telas e capítulos publicados no canvas (`*.dc.html`) e o `canvas.json` com a posição e o tamanho de cada um.
- `geradores/` — os scripts Python que geraram as telas. `gen_brand.py` tem os helpers (tokens, `page`, `header`); `adjust.py` e `adjust2.py` são os ajustes feitos por cima do HTML (v25 e v33, decisões de 27/10).

Os scripts foram escritos para rodar numa pasta de trabalho com `project/` ao lado; ajuste os caminhos antes de rodar aqui.

Fora do MVP (v2): Projetos e Grana. A marca ainda não está decidida: Main, Aplicações e Visões ainda dizem "enquanto você dorme".
