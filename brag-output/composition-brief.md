# Hyperframes Composition Brief: Follou

## Objective
Vídeo curto de lançamento para o Follou (CRM de manhã para fundadores que vendem).

## Output
- Composition: `brag-output/composition/`
- Render: `brag-output/brag.mp4`
- Format: landscape, 1920x1080, 30fps
- Duration: 21,5s

## Source Material
- Project root: /home/user/app
- Files read: `design/README.md`, `design/geradores/follou.py`, `design/logo/follou/README.md`, `design/canvas/{Landing,Hoje,Conversas,MetaChega}.dc.html`, `founder/one-pager.md`
- Product name: Follou
- Strongest claim: "Nenhum fundador perde venda por falta de esforço. Perde por não saber por onde começar o dia."
- UI recriada: tela Hoje (sessão da manhã) e pergunta da meta (MetaChega)
- Copy verbatim: "A jogada de hoje.", "Bom dia, Roberto", "3 coisas pra hoje · uns 15 minutos", "Ligar para a Acme", "Proposta de R$ 4.800 parada há 6 dias · Júlia Prado, sócia-administradora", "Enviar proposta para a Orbita", "Follow-up na Nuvem Labs", "Bato a meta de novembro?", "Chega, por R$ 2.125.", "previsão R$ 12.125", "meta R$ 10.000", "Encontra. Aproxima. Executa.", "Testar 7 dias grátis", "Sem cartão"
- Dados de exemplo: todos os nomes de empresas e pessoas são do conjunto de exemplo do design ("Dados de exemplo"); nenhum dado real.

## Creative Direction
- Tone: polished; filme de produto silencioso e premium
- Avoid: linguagem genérica de SaaS, fundos abstratos, qualquer redesenho da marca, preço (inconsistente entre fontes)

## Visual Identity
Carvão #100F0F, superfície #1B1A19, linha #2B2A28, neve #F4F1EC, neve-média #C9C6C0, neve-fraca #8A8782, sinal #3FD07F, alerta #E8865C. Archivo 600 (display), IBM Plex Sans (corpo), IBM Plex Mono (dados). Fontes locais em `assets/fonts/`. Símbolo dos dois L com as medidas de `follou.py`.

## Storyboard
Ver `brag-plan.md`.
1. Hook — 5,0s
2. Reveal — 3,0s
3. Hoje — 5,0s
4. Meta — 4,0s
5. Outro — 4,5s

## Audio
- Role: warm bed + acentos esparsos
- Music: `assets/music/happy-beats-business-moves-vol-1-by-ende-dot-app.mp3` (CC BY 4.0, Sascha Ende; crédito em `assets/music/CREDITS.md`)
- Cue guidance: preset bundled; beats a cada 0,5s (…,10,02, 11,02, …); strong cue 17,02 locked ao lockup final (`// beat-locked`)
- Audio-reactive: subtle. `assets/rms.json` (RMS normalizado a cada 0,1s, extraído com ffmpeg + numpy porque o helper do media-use não está instalado) respira o halo atrás do símbolo e do cartão em foco.
- SFX: card-slide-1 (cartões), keypress-001..008 (digitação), click_003 (Começar), bong_001 (resposta), impactSoft_medium_001 (reveal e lockup)

## Hyperframes
Os skills do Hyperframes não estão instalados no ambiente; a composição segue `npx hyperframes docs` (data-attributes, compositions, gsap) e o gate é `npx hyperframes check`. Render local.
