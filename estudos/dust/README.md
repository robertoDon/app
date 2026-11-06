# Estudo do Dust (app + landing)

Estudo feito em nov/2026, no workspace de teste do Roberto (app.dust.tt) e no site público (dust.tt), para guiar a reforma de UI/UX e de funcionalidades do The Sala.

- Prints: [prints/](prints/) (91 telas, máx. 1440 de largura, todas no tema claro, exceto onde o nome diz "escuro").
- Código e tokens: [codigo/tokens.css](codigo/tokens.css) (tokens do app) e [codigo/componentes.md](codigo/componentes.md) (trechos medidos: caixa de escrever, cabeçalho de vidro, selo, revelar ao rolar, keyframes do hero).
- O que foi criado no Dust para testar: 1 agente ("teste-sala"), 1 pod e algumas conversas de teste. Nada conectado (sem OAuth), ninguém convidado, nenhuma configuração do workspace alterada. O tema foi trocado e voltou ao original.

Leitura rápida: seções 1, 10 e 11.

---

## 1. Resumo em 10 linhas

1. O Dust se vende como "multiplayer AI": pessoas e agentes trabalhando juntos. É exatamente a tese do The Sala, só que voltada a empresas grandes.
2. O "Pod" é o equivalente mais próximo de uma sala: conversas, arquivos, tarefas e agentes num lugar só, com ajustes próprios.
3. A caixa de escrever é o coração do app: pílula de raio 40, sombra em 8 camadas, placeholder que gira ensinando @ e /, fila de mensagens com "Skip" e botão Stop.
4. Cada resposta de agente mostra como foi feita: passos, ferramentas, fontes citadas, "Completed in 13 sec", créditos gastos, e o feedback vai para quem edita o agente.
5. Criar agente é guiado: um assistente lateral ("Sidekick") faz perguntas de sim/não e preenche o formulário; um Preview ao lado deixa testar na hora.
6. Visual: neutros quentes (escala stone), um preto quase puro como botão principal, azul elétrico só no acento, Geist + Geist Mono, pesos 450/550.
7. Movimento: saídas mais rápidas que entradas (0.16s vs 0.2s), curvas suaves, tudo respeita "movimento reduzido".
8. A landing tem um hero isométrico vivo (um escritório em SVG com pessoas e agentes "respirando") e cartões de chat que aparecem no hover. No celular o desenho some e fica só texto.
9. Páginas internas mostram cada promessa ao lado de uma miniatura real da interface (Security é o melhor exemplo).
10. O que não serve para nós: conversa de créditos/preço, parede de selos enterprise, modelos chineses no catálogo, H1 em mono que muda de página para página.

---

## 2. Mapa do app

```text
app.dust.tt/w/{w}/
├── conversation/new                ← início (saudação + caixa + sugestões + Discover)
├── conversation/{id}               ← conversa
├── pods/{id}#conversations|files|tasks|settings
├── spaces                          ← aba "Spaces" (conexões, Company Data)
│   └── spaces/{id}/categories/managed
├── builder/agents                  ← lista de agentes, templates, construtor
├── builder/skills                  ← skills
├── members                         ← Admin (pessoas)
└── (Admin) security · models · analytics
```

Caminhos de clique:

| Quero | Clique |
|---|---|
| Nova conversa | lateral › New conversation (ou tecla C) |
| Buscar tudo | lateral › Search (⌘K) |
| Chamar outro agente | caixa › digitar @ |
| Ferramentas e capacidades | caixa › + |
| Trocar modelo | caixa › nível de modelo (Standard) |
| Criar pod | lateral › Pods › Create a Pod |
| Tarefas do pod | pod › aba Tasks |
| Criar agente | lateral › Agents › New › (do zero ou template) |
| Tema e fonte | menu da conta › Settings › Customization |
| Notificações | menu da conta › Settings › Notifications |
| Analytics | aba Admin › Analytics |

---

## 3. Tela por tela

### Início
- Saudação que muda a cada visita: "What's cooking, Roberto?", "What's on your mind, Roberto?", "Where do we start, Roberto?" ([57](prints/57-inicio-claro-saudacao.png), [02](prints/02-nova-conversa-claro.png)).
- Caixa de escrever no centro, agente padrão "Dust" e nível "Standard".
- 4 sugestões em linha: "Create a Pod for my team project", "Draft a document from our own knowledge", "Build an agent for a task I keep repeating", "Catch me up on the most important news in my industry".
- Abaixo, o bloco Discover: Featured, Catalog, "Agent & skill for you" e "Trending in your workspace" ([24](prints/24-discover-destaques.png), [25](prints/25-discover-catalogo.png)). Os estados vazios explicam quando vão encher ("Recommendations will show up here as you chat…").

### Conversa
- Primeira conversa: "Welcome to Dust 👋", com cartões de ferramentas sugeridas e as saídas "I have something in mind" / "Skip for now" ([04](prints/04-conversa-boas-vindas.png)).
- Escolher agente com @ ([05](prints/05-picker-de-agentes.png)).
- Agente pensando, depois respondendo com um Stop em pílula ([06](prints/06-agente-pensando.png), [07](prints/07-resposta-em-andamento-com-stop.png)).
- Resposta pronta: passos usados, fontes numeradas e "Completed in X sec" ([08](prints/08-resposta-com-passos-e-fontes.png)). Clicar num passo abre um painel lateral com o detalhe da ferramenta ([09](prints/09-painel-detalhe-da-ferramenta.png)).
- Menus da resposta e da mensagem da pessoa ([10](prints/10-menu-da-resposta.png), [11](prints/11-menu-da-mensagem-da-pessoa.png)). Na mensagem da pessoa, as ações ficam no hover (no celular, sempre visíveis).
- Reações com emoji ([12](prints/12-reacoes.png)).
- Mandar mensagem com o agente ainda respondendo: ela entra numa fila, com o botão "Skip" para furar ([13](prints/13-mensagem-na-fila-skip.png), [14](prints/14-resposta-apos-fila.png)).
- Minimapa para pular entre mensagens em conversa longa ([15](prints/15-minimapa.png)).
- Menu "+" da caixa: comandos (Attach, Upload, Pick model, Compact) e capacidades com uma frase cada ([16](prints/16-menu-mais-do-composer.png)).
- Nível de modelo ([17](prints/17-nivel-de-modelo.png)). Menu da conversa ([18](prints/18-menu-da-conversa.png)).
- Painéis de créditos e de arquivos da conversa ([19](prints/19-painel-de-creditos.png), [20](prints/20-painel-de-arquivos.png)).
- Busca ⌘K ([21](prints/21-busca-cmdk.png)).

### Spaces
- Conexões e dados da empresa por espaço ([22](prints/22-spaces-conexoes.png), [23](prints/23-space-company-data.png)). Não conectamos nada.

### Pods
- Criar pod: nome, descrição e pessoas ([26](prints/26-criar-pod.png)).
- Abas Conversations, Files, Tasks, Settings ([27](prints/27-pod-vazio-conversas.png), [28](prints/28-pod-arquivos.png)).
- Ajustes: geral e personalizar (ícone, cor) ([29](prints/29-pod-ajustes-geral.png), [30](prints/30-pod-ajustes-personalizar.png)).
- Tarefas: filtros "Mine / Everyone / Open", vazio "You're all caught up!" ([31](prints/31-pod-tarefas.png)). Hover, tooltip e menu da tarefa ([32](prints/32-pod-tarefa-hover.png), [33](prints/33-tarefa-tooltip.png), [34](prints/34-menu-da-tarefa.png)).
- "Start with agent": a tarefa vira uma conversa com o agente já com o contexto ([35](prints/35-tarefa-comecar-com-agente.png)).
- Menu do pod ([36](prints/36-menu-do-pod.png)).

### Agentes
- Lista vazia e lista com o agente Dust ([37](prints/37-agentes-vazio.png), [38](prints/38-agentes-lista-dust.png)).
- Criar: do zero, com Sidekick ou por template ([39](prints/39-criar-agente-menu.png), [40](prints/40-templates.png)).
- Construtor: instruções, ferramentas, conhecimento, ajustes ([41](prints/41-construtor-agente.png), [42](prints/42-construtor-ajustes.png)).
- Sidekick pergunta sim/não e preenche ([43](prints/43-sidekick-pergunta-sim-nao.png), [44](prints/44-construtor-preenchido.png)).
- Preview ao lado para testar sem salvar ([45](prints/45-construtor-preview.png)).
- Modal "Agent teste-sala created!" com os próximos passos ([46](prints/46-agente-criado-modal.png)).
- Agente usando skill e resposta com feedback ([47](prints/47-agente-teste-pensando-skill.png), [48](prints/48-resposta-com-feedback.png)). O modal de feedback avisa que vai para os editores do agente ([49](prints/49-feedback-modal.png)).

### Skills
- Vazio e lista ([50](prints/50-skills-vazio.png), [51](prints/51-skills-dust.png)).

### Admin
- Segurança, Modelos, Analytics com "Ask analyst" ([52](prints/52-admin-seguranca.png), [53](prints/53-admin-modelos.png), [54](prints/54-admin-analytics.png)).

### Ajustes pessoais
- Personalização: tema em cartões (Light / Dark / Auto), fonte (Default / Lora / OpenDyslexic), atalho de enviar. "Save" fica desligado até mudar algo ([55](prints/55-ajustes-personalizacao.png)).
- Notificações: som quando o agente precisa de você ("Pluck", com Play), popup no app, resumo por email ("Once a week") ([56](prints/56-ajustes-notificacoes.png)).

---

## 4. Sistema visual (valores medidos)

Arquivo completo: [codigo/tokens.css](codigo/tokens.css).

| Item | Valor |
|---|---|
| Base | Tailwind v4, cores em oklch |
| Fontes | Geist (texto), Geist Mono (código e tags), Lora (serif opcional), OpenDyslexic (acessibilidade) |
| Pesos | normal 400, medium 450, semibold 550 (mais leves que o padrão 500/600) |
| Neutros | escala "stone", quente; no escuro as rampas semânticas se invertem |
| Botão principal | quase preto (no escuro, quase branco) |
| Acento | azul elétrico #1c91ff |
| Semânticas | warning = vermelho #e14322; info = dourado |
| Raios | 2 a 32; caixa de escrever 40 |
| Coluna da conversa | 65ch |
| Lateral | 20rem |
| Painel | calc(100dvh - 1rem), cartão com margem sobre o fundo |
| Movimento | entrada .2s, saída .16s, modal .3s / .24s |
| Componentes | Radix (popovers, menus), tiptap/ProseMirror (editor), sonner (toasts) |

Caixa de escrever (escuro): 690×101, raio 40, fundo rgb(50,48,44), sombra em 8 camadas com dois inset que clareiam no foco. Detalhe em [componentes.md §1](codigo/componentes.md).

O que dá a sensação de acabamento:
- Um único acento forte; o resto é neutro quente.
- Sombras em degraus (1px, 3px, 6px), nunca uma sombra grande e borrada.
- Pesos intermediários (450/550): o texto fica firme sem gritar.
- Saída mais rápida que entrada: a interface parece responder antes.

---

## 5. Funcionalidades

| Grupo | O que tem |
|---|---|
| Conversa | vários agentes por @, fila de mensagens com Skip, Stop, reações, minimapa, compactar contexto, editar/repetir |
| Transparência | passos e ferramentas por resposta, fontes numeradas, painel de detalhe, tempo, créditos, feedback para editores |
| Pods | conversas, arquivos, tarefas (com "começar com agente"), ajustes e cor do pod |
| Agentes | construtor com Sidekick, templates, Preview, instruções, ferramentas, conhecimento, nível de modelo |
| Skills | habilidades reutilizáveis; "Self-improving skills" que melhoram com o uso |
| Capacidades | Computer (sandbox), Frames (dashboards vivos), Go Deep, Schedules, Wake-ups, PDFs, planilhas, slides, Word, imagens, voz, busca web |
| Busca | ⌘K global |
| Admin | segurança, modelos, analytics com agente analista, membros |
| Pessoal | tema, fonte (inclui OpenDyslexic), atalho de enviar, som de alerta, resumo por email |
| Por baixo | atualização ao vivo via SSE por conversa e por mensagem |

---

## 6. Fluxos passo a passo

### Primeira conversa
1. Abrir o app
2. Ler a saudação
3. Clicar numa sugestão
4. Ver o agente pensar
5. Ler passos e fontes
6. Dar feedback

### Pergunta para dois agentes
1. Escrever a pergunta
2. Digitar @ e escolher
3. Enviar
4. Mandar outra (vai para a fila)
5. Clicar Skip para furar

### Criar um agente
1. Agents › New
2. Responder o Sidekick (sim/não)
3. Revisar o formulário preenchido
4. Testar no Preview
5. Salvar
6. Modal com próximos passos

### Pod com tarefa
1. Pods › Create a Pod
2. Dar nome e descrição
3. Aba Tasks › Add
4. Hover na tarefa
5. "Start with agent"
6. Conversa já com contexto

---

## 7. Celular (app a 390px)

- Barra de cima com menu sanduíche, título e nova conversa ([58](prints/58-mobile-inicio.png)).
- Gaveta lateral a ~75% da largura, com fundo escurecido atrás ([59](prints/59-mobile-gaveta.png)).
- Na conversa, as ações da mensagem da pessoa ficam sempre visíveis (não há hover) ([60](prints/60-mobile-conversa.png)).
- Abas do pod viram só ícones ([61](prints/61-mobile-pod-tarefas.png)).
- Saudação curta: "Where do we start, Roberto?", com 4 sugestões.

---

## 8. Landing dust.tt

Só tema claro (não existe modo escuro no site). Altura: 8075px no desktop, 9965px a 390px.

### Tokens da landing

| Item | Valor |
|---|---|
| Fonte | Geist; citações em Source Serif 4; uma palavra em Lora itálico no final |
| H1 hero | 76/68.4, peso 550, -3.04px (390px: 40/36, -1.6px) |
| H2 de seção | 48/56, peso 450, -1.392px (390px: 32/34.56) |
| Sub | 18/27.9, oklch(0.444 0.011 78.213), máx. 520 |
| Parágrafo | 16/26, máx. 680 |
| Cores | fundo branco puro, texto preto, CTA azul oklch(0.6539 0.1893 252.74), seção final navy oklch(0.129 0.042 264.695) |
| Selo (eyebrow) | 12px caixa alta, +0.72px, fundo azul claríssimo, altura 28, com ponto |
| Espaço | seções 96/96; wrapper máx. 1600 com 24px de lado; conteúdo ~1150 |
| Cabeçalho | 94.5 transparente no topo; rolou: fixo 64px, branco 70% + blur 16 + borda |
| Revelar | opacidade 0 → 1 e 14px → 0, 0.5s, atraso de 80ms entre irmãos |

### Cabeçalho e menus
- Nav: Product ▾, Solutions ▾, Resources ▾, Security, Pricing e o botão azul "→ Open Dust" (raio 12, altura 36).
- Product ▾ ([73](prints/73-landing-menu-product.png)), Solutions ▾ com DEPARTMENTS / INDUSTRIES ([74](prints/74-landing-menu-solutions.png)), Resources ▾ com BUILD / EXPLORE / CONNECT ([75](prints/75-landing-menu-resources.png)). Rótulos de grupo em cinza caixa alta, itens grandes.

### Seções, em ordem

| # | Print | Título exato | Subtítulo / texto | CTAs |
|---|---|---|---|---|
| 0 | [62](prints/62-landing-hero.png), [76](prints/76-landing-hero-hover.png) | Multiplayer AI for human-agent collaboration | Dust connects your company knowledge, tools, and teams so you can create, share, and run agents across real workflows. Use different models for different tasks, with people in control. | Request a demo · Try for free → |
| 1 | [63](prints/63-landing-logos-contexto.png) | Trusted by teams at 3,000+ global organizations | faixa de logos rolando (40s), "Case study" nos cartões | — |
| 2 | [63](prints/63-landing-logos-contexto.png) | SEE DUST IN ACTION · AI that uses your context to do real work | Most AI tools can retrieve a message from Slack or a record from your CRM. Dust brings the relevant context together… | — (cartão animado de fluxo Zendesk) |
| 3 | [64](prints/64-landing-depoimento.png) | (depoimento) "Dust is the most impactful software we've adopted since building Clay." | Everett Berry, Head of GTM Engineering at Clay | setas do carrossel |
| 4 | [65](prints/65-landing-um-sistema.png), [66](prints/66-landing-grade-01-04.png) | SELF-IMPROVING AI · One system for your company's AI work | grade 01 Agents with company context · 02 Multiplayer AI for cross-functional work · 03 Model flexibility · 04 AI-native governance (números mono coloridos, vídeos em loop) | — |
| 5 | [67](prints/67-landing-pessoas-e-ia.png) | TEAM COLLABORATION · Work that moves between people and AI | "That is what we mean by multiplayer AI: shared work between people, agents, and the systems they use." + citação serif de Ryan Wang (Assembled) + mock com cursores de várias pessoas | — |
| 6 | [68](prints/68-landing-seguranca.png) | ENTERPRISE-READY · Use AI on your terms, without giving up control of your data | "Granular enough for your CISO, invisible to everyone else." 3 cartões pastel: Security and privacy, Identity and access, Enterprise deployment | Trust datasheet · Visit Trust Center → |
| 7 | [69](prints/69-landing-times-engenharia.png), [70](prints/70-landing-times-suporte.png) | HOW EVERY TEAM USES DUST · One platform, every team, compounding value | abas sublinhadas: Engineering, Customer Support, Sales, Marketing & Content, Data & analytics, Operations | — |
| 8 | [71](prints/71-landing-imprensa-final.png) | IN THE PRESS · News and announcements | SIFTED, AXIOS ("raises $40M"), FORBES | More about us |
| 9 | [72](prints/72-landing-final-rodape.png) | THE PLATFORM FOR AI OPERATORS · The best teams aren't just using AI. They're running it. | fundo navy, "running" em Lora itálico; texto sobre "AI Operators" | We're hiring → |
| — | [72](prints/72-landing-final-rodape.png) | Rodapé | 5 colunas: PRODUCT, DEVELOPERS, COMPANY, CONNECT, LEGAL (inclui "Cookie Settings" e "Trust Center") | — |

### Hero: como é feito
- Um SVG isométrico de um andar de escritório: salas, pessoas e agentes. Escondido abaixo de 1024px.
- Só CSS keyframes, sem canvas nem Lottie. Pessoas balançam (3.6s e 4.8s alternados), agentes pulsam (4.6s), halo do agente "trabalhando" mais rápido (3.4s), cursor piscando (0.9s), emoji e pílulas "pulam" ao aparecer, porta pisca quando alguém entra.
- Amplitude mínima (0.8px, escala 1.03). Durações diferentes para nada pulsar junto. Parece vivo, não animado demais.
- Hover numa pessoa ou sala: surge um cartão de chat "Incident · Agent · Ops · just now". Sobre o agente, a tag mono "@Incident" e um halo verde.
- Movimento reduzido: tudo para.
- Keyframes completos em [componentes.md §7](codigo/componentes.md).

### Rolagem
- O cabeçalho vira vidro fixo de 64px.
- Cada bloco sobe 14px e aparece em 0.5s, com 80ms entre irmãos.
- Logos em faixa infinita de 40s.

### Depoimentos e logos
- Um depoimento grande por vez, em carrossel, com nome e cargo. Logos em faixa, cada um com "Case study".
- Citação dentro de seção em serif (Source Serif 4, 18/25.2): muda o ritmo de leitura sem trocar a marca.

### Landing a 390px
- Hero só texto, H1 40/36 em 3 linhas, à esquerda; os dois CTAs lado a lado ([77](prints/77-landing-mobile-hero.png)).
- Cabeçalho: sanduíche, logo, "Open Dust" azul; vidro ao rolar.
- Grade 01–04 empilha com número mono e uma régua ([79](prints/79-landing-mobile-grade.png)). Contexto ([78](prints/78-landing-mobile-contexto.png)).
- Cartões pastel de segurança empilham ([80](prints/80-landing-mobile-seguranca.png)). Abas de times rolam de lado ([81](prints/81-landing-mobile-times.png)). Final escuro centralizado ([82](prints/82-landing-mobile-final.png)).
- Menu: folha branca de tela cheia com logo e X, rótulos cinza em caixa alta, itens grandes com ›, "Pricing" solto ([83](prints/83-landing-mobile-menu.png)).

### Páginas internas

Product (/home/product) — [84](prints/84-produto-hero.png), [85](prints/85-produto-mock.png), [86](prints/86-produto-governanca.png), [87](prints/87-produto-capacidades.png)
- H1 centralizado que digita: "Multiplayer AI for |" e troca o time (Marketing, Support, RevOps…), cursor azul.
- Sub: "Dust is multiplayer, multi-model AI that gives digital teams of people and agents a single place to work together in parallel…". CTAs: Contact Sales · Try Dust Now.
- Vídeo, depois um mock do produto sobre padrão de pixels azuis.
- 3 blocos em acordeão, cada item com um mock num cartão azul-claro: "Multiplayer AI built for real, cross-functional work", "Use any model, switch any time, and control your data", "Govern AI usage and costs across people and agents".
- Fecha com "Capabilities built for AI Operator" (Pods, Self-improving skills), com "Learn more".
- Faz bem: acordeão com um mock por item. Você lê um título e já vê a tela.

Solutions › Customer Support — [88](prints/88-solucao-suporte-hero.png), [89](prints/89-solucao-suporte-cards.png)
- Selo "Dust for Customer Support", H1 "Instant knowledge, exceptional support" em Geist Mono 64/400.
- Diagrama: fontes (Drive, Notion, Zendesk, Intercom, Slack, Confluence) → Dust → agentes @ticketRouter, @supportCopilot, @customerVoice, @docBuilder.
- "Solve faster, satisfy more" (3 cartões), números em círculos amarelos ("50% reduction in ticket resolution time", "6h saved weekly per agent"), 4 casos de uso, vídeo, 7 depoimentos, "Join them".
- Faz bem: agentes com nome de função (@ticketRouter) explicam o produto melhor que um parágrafo. Faz mal: é um modelo antigo, outro visual da home nova.

Security (/home/security) — [90](prints/90-seguranca-hero.png), [91](prints/91-seguranca-modelos.png)
- "Designed for enterprises" › "Enterprise-grade Security" (mono), selos GDPR / SOC 2 / HIPAA, "Visit our Trust Center".
- 3 blocos: "Ingest data on your terms", "Select trusted models, keep data protected", "Maintain rigorous access control at all levels". Cada um com 3 promessas curtas ("Your data is never used to train models.") e uma miniatura real ao lado (árvore de pastas com checkbox; chaves de provedor ligadas/desligadas).
- Faz bem: promessa curta + prova visual da própria interface. É o melhor padrão do site.

### O que a landing do The Sala deve copiar no espírito
1. Hero que mostra a ideia viva: pessoas e agentes juntos, com movimento mínimo e hover que revela uma conversa.
2. Esconder o desenho pesado no celular e deixar o texto forte sozinho.
3. Cabeçalho que vira vidro ao rolar.
4. Revelar ao rolar curto (14px, 0.5s, 80ms).
5. Uma promessa por bloco, sempre com a tela real ao lado.
6. Agentes com nome de função nos exemplos (@ata, @tarefas), em vez de explicar.
7. Selo pequeno acima de cada título para dar ritmo.
8. Uma palavra em serif itálico num título final, uma vez só.

### O que não copiar
1. Azul como cor de ação: o nosso é o roxo --acento.
2. Só tema claro: as páginas públicas do The Sala seguem o tema da pessoa, com botão.
3. Pricing no menu, "Try for free", créditos: proibido falar de preço ou "grátis".
4. Parede de selos e logos enterprise, "3,000+ organizations": não temos, e soaria falso.
5. Três fontes de título diferentes (Geist, Geist Mono, Lora) e páginas internas com outro visual.
6. "Request a demo / Contact Sales" como CTA principal: o nosso é entrar e criar uma sala.

---

## 9. Por baixo do capô

- Front: Next.js, Tailwind v4 (tokens em oklch, variantes .dark), Radix para menus e popovers, tiptap/ProseMirror no editor, sonner para toasts.
- Ao carregar o início, o app pede em paralelo: usuário, contexto de auth, status de uso, créditos, conversas, agentes, modelos, Discover (featured, for_you, trending), sugestões de menção e preferências do usuário salvas como metadata (fonte, som).
- Conversa: GET da conversa, mensagens, feedbacks, ações bloqueadas (aguardando aprovação), "wakeups" e uso de contexto.
- Ao vivo: SSE, um canal por conversa (/api/sse/w/{w}/assistant/conversations/{cId}/events) e um por mensagem (…/messages/{mId}/events).
- Ferramentas são MCP (/mcp, /mcp/available).
- Preferências pessoais ficam em metadata do usuário (conversation_font, sound_notification_type), não em localStorage: valem em qualquer aparelho.
- Landing: SVG + CSS keyframes, vídeos .mp4 em loop, IntersectionObserver trocando classe. Nada de biblioteca de animação.

---

## 10. O que o The Sala aprende

Prioridade = impacto ÷ esforço. P1 = faz já (alto impacto, pouco esforço). P2 = vale o projeto. P3 = depois.

| Prioridade | Tela do The Sala | Ideia | Como fica no The Sala |
|---|---|---|---|
| P1 | caixa de escrever | Placeholder que gira ensinando um recurso por vez | Alternar "Escreva aqui · @ chama alguém" com "/ abre comandos" e "Arraste um arquivo". Hoje é fixo. |
| P1 | caixa de escrever | Caixa com mais presença: raio maior, sombra em degraus, foco que acende por dentro | Raio 14–20 (cartão), sombra com --sombra-media, foco com anel suave do --acento. Hoje a borda vira roxa sólida. |
| P1 | sala/conversa | Mostrar como o agente respondeu: tempo e ferramentas numa linha discreta | "Respondeu em 8 s · leu 2 arquivos", abaixo da bolha do agente, com o anel do IconeAgente. Sem créditos. |
| P1 | sala/conversa | Stop em pílula enquanto o agente escreve | Botão "Parar" no lugar do enviar, mesma posição. |
| P1 | início / lista de salas | Saudação que muda + 3 a 4 sugestões clicáveis | "Boas-vindas de volta" alternando com "Por onde começamos?" (sem gênero); sugestões: criar sala, chamar agente, ver tarefas. |
| P1 | ajuda | Estados vazios que dizem quando vão encher | "As decisões aprovadas aparecem aqui." em vez de lista vazia. |
| P1 | conta | Tema em cartões visuais (Claro / Escuro / Auto) e "Salvar" desligado até mudar | Ajustes com miniaturas do tema; botão só ativa com mudança. |
| P2 | sala/conversa | Fila de mensagens com "pular" quando o agente ainda responde | Mensagem enviada durante a resposta fica marcada "na fila", com "mandar agora". |
| P2 | sala/conversa | Painel lateral com o detalhe de um passo/ferramenta | Clicar em "leu 2 arquivos" abre o painel com os arquivos (reusar o painel da sala). |
| P2 | sala/conversa | Feedback na resposta do agente, avisando quem recebe | 👍/👎 vai para a pessoa dona do agente, e o modal diz isso. |
| P2 | tarefas | "Começar com agente" a partir de uma tarefa | No menu da tarefa: "Pedir ao agente", abre a conversa com o texto da tarefa já escrito. |
| P2 | tarefas | Filtros Minhas / Todas / Abertas e vazio "Tudo em dia" | Três abas pequenas no topo de Tarefas. |
| P2 | conectar agente | Assistente que pergunta sim/não e preenche, com prévia ao lado | Conectar agente em passos curtos, com uma prévia de como ele vai aparecer na sala. |
| P2 | conectar agente | Modal de sucesso com próximos passos | "Agente conectado" + "Chamar na sala" / "Ver instruções". |
| P2 | painel | Uma frase por item em menus de capacidades | Cada ferramenta do painel com nome + uma linha do que faz. |
| P2 | landing | Hero vivo: sala isométrica com pontos (pessoas) e anéis (agentes) que respiram, hover mostra uma bolha de conversa | SVG + keyframes, 3 a 4 durações diferentes, some no celular, para com movimento reduzido. Roxo só no CTA. |
| P2 | landing | Cabeçalho que vira vidro ao rolar | Usar --vidro + blur 16, 64px, borda --linha. |
| P2 | landing | Revelar ao rolar curto e escalonado | 14px, 0.5s, 80ms entre irmãos. |
| P2 | landing | Promessa + tela real lado a lado | Cada bloco com um componente real (Bolha, Tarefas, Decisoes) na vitrine. |
| P2 | privacidade | Página de confiança no padrão do Security | 3 blocos curtos ("Seus dados não treinam modelos", "Você escolhe quem entra", "Sai quando quiser") com miniatura real. Só o que for verdade. |
| P3 | conta | Escolha de fonte de leitura, inclusive uma para dislexia | Padrão Inter; opção OpenDyslexic. Salvar no perfil, não no aparelho. |
| P3 | conta | Som quando um agente precisa da pessoa | Som curto opcional quando "Te chamaram" ou uma proposta espera o seu sim. |
| P3 | sala/conversa | Minimapa em conversa longa | Marcas na borda direita para pular entre mensagens e propostas. |
| P3 | biblioteca | Arquivos da conversa num painel | Biblioteca já existe; mostrar "arquivos desta conversa" no topo. |
| P3 | memória | Skills que melhoram com o uso | Agente propõe atualizar a memória da sala como proposta (já é o nosso modelo de "sim" humano). |
| P3 | entrar / convite | Primeira tela com saídas claras ("Tenho algo em mente" / "Pular") | No convite aceito: "Entrar na sala" ou "Ver como funciona". |
| P3 | lateral | Atalho de uma tecla para nova sala e ⌘K para busca | Mostrar o atalho ao lado do item, como o Dust faz ("C", "⌘K"). |

Regras do The Sala que valem em todas as linhas acima: roxo --acento só em ação; Inter, títulos 600; botões raio 8 (7/10); cartões 14–20; anel para agente, nunca robô; texto sem gênero; páginas públicas com tema da pessoa e botão de troca; nada de preço ou "grátis".

Nota de passagem: hoje os botões do The Sala em styles.css usam raio 999px (pílula), e o CLAUDE.md pede raio 8. Vale alinhar na reforma.

---

## 11. O que NÃO copiar, e por quê

| Do Dust | Por que não |
|---|---|
| Créditos por resposta, painel de créditos, Pricing no menu | O The Sala não fala de preço nem de "grátis". |
| Azul elétrico como acento e botão principal preto | Nossa cor de ação é o roxo --acento, uma só. |
| Geist, Geist Mono em título, Lora, Source Serif | Nossa régua é Inter 600 com tracking apertado. Três famílias de título confundem. |
| Pesos 450/550 | Nossa régua é 600 nos títulos; misturar pesos quebra a consistência. |
| Raio 40 na caixa de escrever | Fica fora da nossa régua de cartões 14–20. Pegar a ideia (presença), não o número. |
| Parede de selos (GDPR, SOC 2, HIPAA) e "3,000+ organizations" | Não temos, e prometer o que não existe derruba a confiança. |
| Catálogo de modelos com DeepSeek, Moonshot, Z.ai | Regra do Roberto: nenhuma IA chinesa, nem como opção. |
| Admin pesado (Spaces, grupos, SCIM, analytics de custo) | O The Sala é de salas pequenas; isso vira peso morto na tela. |
| 20+ capacidades no menu "+" | Excesso para quem só quer conversar. Mostrar poucas, com a frase de cada uma. |
| Páginas internas com visual antigo (Solutions) | Cada página nossa usa os mesmos tokens e componentes do app. |
| Landing só em tema claro | Nossas páginas públicas seguem o tema da pessoa. |
| "Request a demo" como CTA principal | Nosso caminho é entrar e criar uma sala, sem venda no meio. |
| Ícones de agente variados (emoji, avatar colorido) | Agente no The Sala é sempre o anel. |
