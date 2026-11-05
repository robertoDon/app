# Design do Follou

A marca mudou de Dalva para Follou em 30/10/2026 (PDF de posicionamento). Só a camada de marca mudou: nome, logo, cores, fonte de display e a frase de posicionamento. UI e UX seguem o Design 2.0.

Canvas do conceito do produto: https://claude.ai/artifact/JoLM6BpVWakan6zacwe6mP (v65, 05/11/2026). Seis páginas: A marca e o produto, O design, As telas, A vitrine, A conta e o motor e Contra quem a gente joga.

- `canvas/` — as telas e capítulos publicados no canvas (`*.dc.html`) e o `canvas.json` com a posição e o tamanho de cada um.
- `geradores/` — os scripts Python que geraram as telas. `follou.py` tem os tokens e o símbolo; `follou_rebrand.py` aplica a marca nas telas (idempotente); `gen_marca.py` gera o quadro de marca (Main); `gen_logo_follou.py` gera os arquivos em `logo/follou/`; `migra_conversas.py` e `migra_empresas.py` (uma vez só cada) fizeram Pipeline virar Conversas, tiraram Projetos e Grana e trocaram Caçada por Empresas; `gen_conversas.py` gera Conversas; `gen_grana.py` gera as telas do Grana e a ficha de regras (roda de `design/`: `python3 geradores/gen_grana.py`). `gen_brand.py` tem os helpers (tokens, `page`, `header`); `adjust.py` e `adjust2.py` são os ajustes feitos por cima do HTML (v25 e v33, decisões de 27/10).

Os scripts foram escritos para rodar numa pasta de trabalho com `project/` ao lado; ajuste os caminhos antes de rodar aqui.

## O design (30/10/2026)

O Design 2.0 é o design da Dalva a partir de 30/10/2026; não é uma proposta separada. Toda tela segue a régua (ver `.claude/skills/don-acabamento/regua.md`). A página Legado (telas de 28/10) foi apagada em 02/11/2026; o histórico está no git.

Nomes: web é `<Nome>.dc.html`; celular é `<Nome>Mobile.dc.html`.

- `Regua`, `Sistema` — a régua e os tokens, símbolos e componentes (página O design).
- `Hoje`, `HojeMobile` → `FocoMobile` → `ComoFoiMobile` → `FeitoMobile` — a sessão da manhã, clicável. O Hoje abre escuro e clareia quando a manhã termina. Sem sequência de dias, recorde nem número de meta.
- `Conversas`, `Conversa`, `Abordagem`, `Empresas`, `EmpresasEntrada` e as versões `*Mobile` — os módulos. Conversas é a lista que substituiu o funil do Pipeline em 31/10/2026: a situação é lida do WhatsApp e do e-mail, sem etapas para atualizar.
- `Grana`, `GranaCadastro` (web) e `GranaPlanoMobile` (primeiro plano, clicável: apresentação, seis perguntas, revisão e resultado), `GranaComecoMobile`, `GranaMobile`, `GranaSemanaMobile`, `GranaCadastroMobile`, `GranaEditarMobile`, `GranaSemTicketMobile`, `GranaCobertaMobile`, `GranaSemDadosMobile` — o planejamento comercial de 90 dias, a quarta aba. `GranaRegras` tem as perguntas, a conta, o 1-3-5, a ordem das prioridades do Hoje e o tom. Fonte: especificação do David de 04/11/2026.
- `Landing`, `LandingMobile`, `Waitlist` — a vitrine.

`ComoFoiMobile` importa `FocoMobile` já com a folha aberta; `Regua` importa `HojeMobile`.

Projetos saiu de vez em 31/10/2026. O Grana voltou em 05/11/2026 como planejamento comercial (reunião David e Beto de 03/11 e especificação de 04/11): sem previsão de faturamento nem chance de bater a meta. A pergunta da meta (⌘K e folha Perguntar) e o vídeo de lançamento saíram. Conversas segue sem etapas: a situação lida do WhatsApp faz o papel do estágio, e ganhou ou perdeu é o único toque à mão. Logo: `logo/follou/` (símbolo dos dois L). A direção 18° da Dalva ficou em `logo/` como histórico. No canvas, o quadro Main é a marca inteira: nome, símbolo, paleta, tipos, voz e aplicações. 
