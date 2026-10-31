# Design do Follou

A marca mudou de Dalva para Follou em 30/10/2026 (PDF de posicionamento). Só a camada de marca mudou: nome, logo, cores, fonte de display e a frase de posicionamento. UI e UX seguem o Design 2.0.

Canvas do conceito do produto: https://claude.ai/artifact/JoLM6BpVWakan6zacwe6mP (v59, 31/10/2026). Sete páginas: A marca e o produto, O design, As telas, A vitrine, A conta e o motor, Contra quem a gente joga e Legado.

- `canvas/` — as telas e capítulos publicados no canvas (`*.dc.html`) e o `canvas.json` com a posição e o tamanho de cada um.
- `geradores/` — os scripts Python que geraram as telas. `follou.py` tem os tokens e o símbolo; `follou_rebrand.py` aplica a marca nas telas (idempotente); `gen_marca.py` gera o quadro de marca (Main); `gen_logo_follou.py` gera os arquivos em `logo/follou/`; `migra_conversas.py` (uma vez só) fez Pipeline virar Conversas e tirou Projetos e Grana; `gen_conversas.py`, `gen_meta.py` e `gen_metaregras.py` geram Conversas, a pergunta da meta e a ficha de regras. `gen_brand.py` tem os helpers (tokens, `page`, `header`); `adjust.py` e `adjust2.py` são os ajustes feitos por cima do HTML (v25 e v33, decisões de 27/10).

Os scripts foram escritos para rodar numa pasta de trabalho com `project/` ao lado; ajuste os caminhos antes de rodar aqui.

## O design (30/10/2026)

O Design 2.0 é o design da Dalva a partir de 30/10/2026; não é uma proposta separada. Toda tela segue a régua (ver `.claude/skills/don-acabamento/regua.md`). A versão de 28/10 ficou na página Legado, com arquivos `Legado*.dc.html`.

Nomes: web é `<Nome>.dc.html`; celular é `<Nome>Mobile.dc.html`.

- `Regua`, `Sistema` — a régua e os tokens, símbolos e componentes (página O design).
- `Hoje`, `HojeMobile` → `FocoMobile` → `ComoFoiMobile` → `FeitoMobile` — a sessão da manhã, clicável. O Hoje abre escuro e clareia quando a manhã termina.
- `Conversas`, `Conversa`, `Abordagem`, `Cacada`, `CacadaEntrada` e as versões `*Mobile` — os módulos. Conversas é a lista que substituiu o funil do Pipeline em 31/10/2026: a situação é lida do WhatsApp e do e-mail, sem etapas para atualizar.
- `MetaChega`, `MetaNaoChega`, `MetaSemDados` (web, ⌘K) e as versões `*Mobile` (folha Perguntar, no topo do Hoje) — a pergunta da meta. `MetaRegras` tem a conta, as regras e o contrato da resposta.
- `Landing`, `LandingMobile`, `Waitlist` — a vitrine.
- `LegadoAntesDepois` — o antes e depois, com os números contados nas telas de 28/10.

`ComoFoiMobile` importa `FocoMobile` já com a folha aberta; `Regua` importa `HojeMobile`; `LegadoAntesDepois` importa `LegadoHoje` e `HojeMobile`.

Projetos e Grana saíram de vez em 31/10/2026: levam o produto para CRM. Logo: `logo/follou/` (símbolo dos dois L). A direção 18° da Dalva ficou em `logo/` como histórico. No canvas, o quadro Main é a marca inteira: nome, símbolo, paleta, tipos, voz e aplicações. A página Legado continua com a marca Dalva.
