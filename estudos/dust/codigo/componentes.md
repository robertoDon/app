# Dust: trechos de DOM e CSS medidos

Valores tirados do navegador (getComputedStyle e stylesheets) em nov/2026. São referência de técnica, não código para colar: no The Sala tudo passa pelos tokens de `styles.css` (Inter, roxo `--acento`, raios 8/14–20).

Tokens do app: [tokens.css](tokens.css).

---

## 1. Caixa de escrever (composer) do app

Medido no tema escuro, home do app.

```text
tag: div (tiptap/ProseMirror dentro)
tamanho: 690 x 101
font: Geist 16px/24px 400, cor oklch(0.923 0.003 48.717)
fundo: rgb(50, 48, 44)        /* stone-ish quente, não cinza neutro */
border: 1px solid transparent
border-radius: 40px            /* pílula grande */
```

Sombra empilhada (repouso, escuro). São 8 camadas: 4 vazias para animar, 2 inset de brilho e 4 de profundidade.

```css
box-shadow:
  rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0) 0 0 0 0,
  rgba(0,0,0,0) 0 0 0 0, rgba(0,0,0,0) 0 0 0 0,   /* slots p/ ring de foco */
  inset 0 1px 0 0 rgba(255,255,255,.035),          /* fio de luz no topo */
  inset 0 0 0 1px rgba(255,255,255,.055),          /* borda interna */
  0 0 0 1.5px rgba(0,0,0,.14),                     /* contorno externo */
  0 1px 1px -0.5px rgba(0,0,0,.18),
  0 3px 3px -1.5px rgba(0,0,0,.18),
  0 6px 6px -3px rgba(0,0,0,.18);                  /* sombra que cresce em degraus */
```

No foco, os alfas dos dois inset sobem (0.02/0.04 → 0.035/0.055 e acima). A caixa "acende" por dentro, sem anel colorido.

Barra de formatação (aparece ao selecionar texto ou pelo botão Aa):

| Ação | Atalho |
|---|---|
| Heading | ⌘⌥1 |
| Bold | ⌘B |
| Italic | ⌘I |
| Link | ⌘⇧U |
| Bulleted list | ⌘⇧8 |
| Ordered list | ⌘⇧7 |
| Blockquote | ⌘⇧9 |
| Inline code | ⌘E |
| Code block | ⌘⌥C |

Placeholder que gira e ensina: "Type @ to loop in a teammate" ↔ "Type / to add tools and more".

Menção no editor vira um span decorado:

```html
<p class="whitespace-pre-wrap break-words font-normal">
  pergunta para <span data-decoration-id="id_…" class="suggestion">@an</span>
</p>
```

---

## 2. Lateral do app (estrutura)

```text
[Work] [Spaces] [Admin]               ← abas no topo da lateral
New conversation              C       ← atalho de uma letra
Search                        ⌘K
Agents                        New
Skills                        New
Pods                          Create a Pod / Browse Pods
Conversations                 ⋯ (Hide triggered | Edit history | Clear history)
  TODAY
    Produto Dust Fontes
    Welcome to Dust
───────────────
(R) Roberto  · Standard             ← menu da conta no rodapé
```

Largura: `--sidebar-width: 20rem`. Painel principal: `calc(100dvh - 1rem)`, com margem de 0.5rem e raio, "cartão" sobre o fundo.

---

## 3. Menu "+" do composer (texto real)

Commands: Attach (Search knowledge and reference conversation or Pod files), Upload file, Pick model (Override the model used), Compact (Free up context by summarizing the conversation).

Capabilities (cada uma com uma linha de descrição): Build Agents and Skills, Computer (sandbox Linux), Create Frames (dashboards e apresentações vivos), Discover Knowledge, Discover Skills, Discover Tools, Dust Learning, Dust Support, Go Deep (análise longa, "may take several minutes"), Mention Users, PDFs, Pods, Schedules, Slide decks, Spreadsheets, Word documents, Workspace Analytics, Create Images, Speech generator, Wake-ups ("Resume the current conversation later"), Web search browse.

Lição: cada item tem nome curto + uma frase do que faz. Nada de ícone sem legenda.

---

## 4. Landing: cabeçalho que vira vidro

```text
topo:   <header> static, 94.5px, fundo transparente
rolou:  div.fixed top-0 w-full border-b z-50
        height 64px
        background: oklab(0.986 0.0008 0.0019 / 0.7)
        backdrop-filter: blur(16px)
        transition: transform, height
```

CTA do cabeçalho "→ Open Dust": fundo oklch(0.6539 0.1893 252.74), texto oklch(0.9681 0.0183 232.5), raio 12, altura 36, padding 0 12px, 16px/400.

Equivalente The Sala (já existe `--vidro`):

```css
.lp-topo { position: sticky; top: 0; height: 64px;
  background: var(--vidro); backdrop-filter: blur(16px);
  border-bottom: 1px solid var(--linha); }
```

---

## 5. Landing: eyebrow (selo acima do título)

```text
span, Geist 12px, letter-spacing 0.72px, uppercase
fundo oklch(0.9226 0.0441 234.57)   /* azul claríssimo */
texto oklch(0.5319 0.1614 253.34)   /* azul médio */
altura 28, padding 0 12px, raio pílula, com um ponto à esquerda
```

Exemplos: SEE DUST IN ACTION, SELF-IMPROVING AI, TEAM COLLABORATION, ENTERPRISE-READY, HOW EVERY TEAM USES DUST, IN THE PRESS, THE PLATFORM FOR AI OPERATORS.

---

## 6. Landing: revelar ao rolar

```css
.home-reveal      { opacity: 0; transform: translateY(14px);
                    transition: opacity .5s cubic-bezier(.215,.61,.355,1),
                                transform .5s cubic-bezier(.215,.61,.355,1); }
.home-reveal-in   { opacity: 1; transform: none; }
/* irmãos: transition-delay 0s, .08s, .16s … (stagger de 80ms) */
```

58 elementos com essa classe na home. Um IntersectionObserver só troca a classe.

---

## 7. Landing: hero isométrico (SVG + CSS keyframes)

Estrutura: `div.dust-floor-host` (h: min(86vh, 900px), escondido abaixo de lg) → `svg.floor-svg` → `g.room-block` (salas) com `polygon.roof-logo`. 52 SVGs e 32 imagens na página; sem canvas e sem Lottie. Vídeos .mp4 em loop nos blocos de baixo.

Keyframes reais:

```css
@keyframes dust-floor-human-bob   { 0%,100% { transform: translateY(0) scale(1) }
                                    50% { transform: translateY(-.8px) scale(1.03) } }  /* 3.6s e 4.8s alternados */
@keyframes dust-floor-agent-pulse { 0%,100% { transform: scale(1) } 50% { transform: scale(1.03) } } /* 4.6s */
@keyframes dust-floor-halo        { 0%,100% { opacity:.28; transform: scale(1) }
                                    50% { opacity:.12; transform: scale(1.4) } }        /* 4.6s */
@keyframes dust-floor-halo-working{ 0%,100% { opacity:.34; transform: scale(1.05) }
                                    50% { opacity:.14; transform: scale(1.6) } }        /* 3.4s */
@keyframes dust-floor-caret-blink { 50% { opacity: 0 } }                                /* 0.9s */
@keyframes dust-floor-status-pulse{ 0% { opacity:.5; transform: scale(1) }
                                    70%,100% { opacity:0; transform: scale(2.6) } }
@keyframes dust-floor-emoji-pop   { 0% { transform: scale(.4); opacity:0 }
                                    60% { transform: scale(1.25); opacity:1 } 100% { transform: scale(1) } }
@keyframes dust-floor-pill-pop    { 0% { transform: scale(.85); opacity:0 }
                                    60% { transform: scale(1.04); opacity:1 } 100% { transform: scale(1) } }
@keyframes dust-floor-trail-dash  { 100% { stroke-dashoffset: -12 } }
@keyframes dust-floor-spark-rotate{ 100% { transform: rotate(360deg) } }
@keyframes dust-floor-door-flash  { 0% { opacity:0 } 30% { opacity:.9 } 100% { opacity:0 } }
@keyframes dust-floor-door-pulse  { 0%,100% { opacity:.25 } 50% { opacity:.55 } }
@keyframes home-trusted-marquee   { /* translateX, 40s linear infinite */ }
```

Durações diferentes (3.6 / 4.8 / 4.6 / 3.4 s) evitam que tudo pulse junto: parece vivo, não mecânico. Amplitude mínima (0.8px, scale 1.03).

Movimento reduzido desliga tudo:

```css
@media (prefers-reduced-motion: reduce) {
  .dust-floor-host .human-body, .dust-floor-host .status-online-pulse,
  .dust-floor-host .activity-emoji.pop, .dust-floor-host .agent-body, … { animation: none; }
}
```

Hover num avatar/sala: aparece um cartão de chat ("Incident / Agent · Ops · just now"). Sobre o agente, tag mono "@Incident" e halo verde ("working").

---

## 8. Página Product: título que digita

```text
H1 centralizado: "Multiplayer AI for " + palavra que troca (Marketing, Support, RevOps, …) + "|" azul
```

Técnica: apaga letra a letra, escreve a próxima, cursor piscando. Simples, uma linha de estado.

---

## 9. Medidas de tipografia da landing

| Elemento | Desktop | 390px |
|---|---|---|
| H1 hero | Geist 76/68.4, 550, -3.04px | 40/36, 550, -1.6px, 3 linhas, à esquerda |
| Sub hero | 18/27.9, 400, oklch(0.444 0.011 78.213), max 520 | igual |
| "Trusted by…" | 28/36, 550, -0.56px | 20/28 |
| H2 de seção | 48/56, 450, -1.392px | 32/34.56 |
| H3 da grade 01–04 | 28/36, 550, -0.28px | — |
| H3 abas por time | 48/47.04, 550, -1.44px | — |
| Parágrafo de seção | 16/26, max 680 | igual |
| H1 final | 56, 550; "running" em Lora 56/57.12 itálico | centralizado |
| Citação | Source Serif 4, 18/25.2 | — |
| H1 Solutions/Security | Geist Mono 64, 400 | — |

Fundo do body: oklch(1 0 0). Texto: preto puro. Seção final: oklch(0.129 0.042 264.695) (navy). Padding de seção 96/96. Wrapper max-w 1600 com px-6; conteúdo ~1150.
