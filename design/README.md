# Design da Dalva

Canvas do conceito do produto: https://claude.ai/artifact/JoLM6BpVWakan6zacwe6mP (v52, 30/10/2026). Duas páginas: Conceito e Design 2.0.

- `canvas/` — as telas e capítulos publicados no canvas (`*.dc.html`) e o `canvas.json` com a posição e o tamanho de cada um.
- `geradores/` — os scripts Python que geraram as telas. `gen_brand.py` tem os helpers (tokens, `page`, `header`); `adjust.py` e `adjust2.py` são os ajustes feitos por cima do HTML (v25 e v33, decisões de 27/10).

Os scripts foram escritos para rodar numa pasta de trabalho com `project/` ao lado; ajuste os caminhos antes de rodar aqui.

## Design 2.0 (30/10/2026)

Página nova no canvas, "Design 2.0", com os arquivos `canvas/V2*.dc.html`. É o mesmo produto com régua: cada valor da tela tem nome.

- `V2Deslop` — a régua: espaçamento, tipo, cor, símbolos e estrutura, conferidos em volta do Hoje novo.
- `V2Antes` — antes e depois, com os números contados nas telas de celular de 28/10 (11 tamanhos de texto viraram 3, 14 espaçamentos viraram 6, 10 raios viraram 4, e os 2 cinzas reprovados no AA saíram).
- `V2Sistema` — tokens, contraste, ícones, movimento e componentes.
- `V2Hoje` → `V2Foco` → `V2ComoFoi` → `V2Feito` — a sessão da manhã, clicável. O Hoje abre escuro e clareia quando a manhã termina.
- `V2Pipeline`, `V2Cacada` — os módulos no sistema novo; `V2HojeWeb` — o Hoje na web.

`V2ComoFoi` importa `V2Foco` já com a folha aberta; `V2Deslop` e `V2Antes` importam `V2Hoje` (e `V2Antes` importa o `Hoje` antigo). Mudou o Hoje novo, mudam os três.

Fora do MVP (v2): Projetos e Grana. Logo provisório: `logo/` (direção 18°, guia em `logo/guia.html`). No canvas, Marca, Visões e Aplicações viraram um quadro só (Main), e todas as telas usam o logo novo.
