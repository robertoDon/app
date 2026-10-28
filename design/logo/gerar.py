"""Gera os SVGs das três direções e a página de apresentação.

    cd design/logo && python3 gerar.py

Dependências: skia-pathops e fonttools (pip install skia-pathops fonttools).
"""
import os
from direcoes import DIRECOES, CORAL, NOITE, BRUMA, AZUL, AMBAR, BRANCO
from svg import wordmark_svg, icone_svg, grade_svg

AQUI = os.path.dirname(os.path.abspath(__file__))
SVG_DIR = os.path.join(AQUI, 'svg')
LETRA = {'horizonte': 'A', 'dezoito': 'B', 'acesa': 'C'}


def tamanhos_svg(sim, spec):
    sizes = [512, 64, 32, 16]
    W = sum(sizes) + 48 * (len(sizes) - 1)
    x = 0; parts = []
    for z in sizes:
        inner = icone_svg(sim, spec).replace('<svg xmlns="http://www.w3.org/2000/svg" ', f'<svg x="{x}" y="{512 - z}" width="{z}" height="{z}" ')
        parts.append(inner)
        x += z + 48
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} 512" width="{W}" height="512">{"".join(parts)}</svg>'


def exportar():
    for key, d in DIRECOES.items():
        out = os.path.join(SVG_DIR, key)
        os.makedirs(out, exist_ok=True)
        m, sim = d['wordmark'](), d['simbolo']()
        acc_mono = lambda c: c
        files = {
            'wordmark-positivo.svg': wordmark_svg(m, NOITE, CORAL),
            'wordmark-negativo.svg': wordmark_svg(m, BRANCO, CORAL),
            'wordmark-fundo-claro.svg': wordmark_svg(m, NOITE, CORAL, pad=0.5, bg=BRUMA),
            'wordmark-fundo-escuro.svg': wordmark_svg(m, BRANCO, CORAL, pad=0.5, bg=NOITE),
            'icone-app.svg': icone_svg(sim, d['icone']),
            'icone-app-alternativo.svg': icone_svg(sim, d['icone_claro']),
            'tamanhos-16-32-64-512.svg': tamanhos_svg(sim, d['icone']),
            'grade-construcao.svg': grade_svg(key, m),
        }
        for name, txt in files.items():
            with open(os.path.join(out, name), 'w') as f:
                f.write(txt + '\n')
    print('SVGs em', SVG_DIR)


# ------------------------------------------------------------------ conteúdo
TEXTO = {
    'horizonte': dict(
        titulo='Horizonte',
        linha='A palavra desenha a serra. A barra do último A é a primeira luz.',
        conceito=('DALVA em caixa-alta desenhada. O primeiro A perde a barra (Λ) e o último ganha uma barra baixa, '
                  'em coral: a linha do horizonte onde a estrela-d’alva aparece. Os topos de Λ, L, V e Λ fazem '
                  'um perfil de serra, pico, vale, pico. A cor entra como peça estrutural da letra, não como enfeite.'),
        porque=[
            'É o caminho do favorito do David (palavra forte + um detalhe coral no fim), trocando o gesto vertical dos raios por um horizontal. Raio é sinal; horizonte é calma, manhã.',
            'A barra não é acessório: tire a cor e ela continua sendo o A. A versão em uma cor funciona sem ajuste.',
            'Silhueta própria: o ritmo ΛLVΛ não se confunde com nenhuma operadora.',
        ],
        risco='Caixa-alta é mais institucional que o tom pedido. O ícone fica com o A (de alva), não com o D: pede explicação na primeira semana, depois vira hábito.',
    ),
    'dezoito': dict(
        titulo='18°',
        linha='Letras desenhadas para a marca. Todo corte a 18°, o ângulo do crepúsculo.',
        conceito=('dalva em caixa-baixa, desenhada letra a letra. Toda haste termina num corte de 18°: o crepúsculo '
                  'astronômico começa quando o sol está 18° abaixo do horizonte, a hora em que a Dalva fecha o trabalho '
                  'da noite. O d e o a são o mesmo desenho (bojo + haste), só muda a altura. As bases são retas: o chão é o horizonte. '
                  'O coral sai da palavra e vira o campo do ícone, o botão que você toca toda manhã.'),
        porque=[
            'É o lettering mais customizado dos três: bojo em superelipse, forquilha do v aberta para tamanho pequeno, cortes paralelos que dão direção à palavra (para a frente e para cima).',
            'Caixa-baixa fala do jeito que a Dalva fala: próxima e direta, sem cara de CRM corporativo.',
            'O melhor ícone dos três: d escuro em campo coral é legível em 16 px e é a única mancha coral da tela inicial.',
            'Segue a regra Don à risca: o acento aparece onde há ação (ícone, botão), não na assinatura.',
        ],
        risco='O wordmark não tem coral. Quem gostou dos riscos do David pode sentir falta do ponto de cor na palavra. O coral precisa morar no ícone e nos botões, sempre.',
    ),
    'acesa': dict(
        titulo='Acesa',
        linha='A palavra vai da noite ao dia. A última letra já amanheceu.',
        conceito=('Dalva em caixa alta e baixa, como o favorito, e nenhum elemento a mais: a última letra é a luz. '
                  'Lida da esquerda para a direita, a palavra acorda. É a redução máxima da ideia do David: tiramos os '
                  'raios e deixamos só o que eles queriam dizer.'),
        porque=[
            'O caminho mais curto a partir do favorito, e o mais simples de aplicar.',
            'Nada para confundir com a Claro: não há traço, raio nem ponto.',
            'O ícone (um a coral em Noite) é forte e quente na tela inicial.',
        ],
        risco='É o menos proprietário dos três. Pintar uma letra é um recurso conhecido, e sem o desenho das letras a marca pode parecer fonte pronta com uma cor trocada. Separa "Dalv" de "a" em alguns olhares.',
    ),
}

REFS = [
    ('FedEx', 'Landor, Lindon Leader, 1994',
     'A seta mora no espaço entre o E e o x. Ninguém precisa vê-la para a marca funcionar; quem vê, não esquece.',
     'O gesto pode estar na construção da letra, sem objeto a mais.'),
    ('Mastercard', 'Pentagram, Michael Bierut, 2016',
     'Redução a dois círculos e uma sobreposição. Sobreviveu até sem o nome.',
     'Um elemento desenhável de memória vale mais que três.'),
    ('Airbnb · Bélo', 'DesignStudio, 2014',
     'Uma linha contínua com significado próprio. Qualquer pessoa desenha.',
     'Teste do guardanapo: dá para desenhar a Dalva de cabeça?'),
    ('Stripe', 'wordmark de desenho próprio',
     'Sem símbolo. A força vem do peso, do espaço entre letras e de um S em campo de cor para o ícone.',
     'Wordmark + letra em campo de cor já é um sistema completo.'),
    ('Linear', 'wordmark + disco com cortes diagonais',
     'Monocromático, preciso, sem ornamento. A marca some e o produto aparece.',
     'Riscos paralelos já têm dono no nosso próprio universo de referência: mais um motivo para fugir dos raios.'),
    ('Attio', 'wordmark em caixa-baixa',
     'Caixa-baixa com espaçamento justo e acabamento de produto. Parece software caro sem parecer banco.',
     'Caixa-baixa passa proximidade sem ficar fofa.'),
    ('Nubank', 'wordmark "nu" desenhado',
     'Duas letras próprias e uma cor dona. No Brasil, reconhecimento em 16 px.',
     'Uma cor dona + letra própria resolvem o ícone.'),
    ('Wise', 'bandeira como símbolo',
     'Um gesto só (a bandeira/seta) ligado ao que o produto faz, numa cor que ninguém mais usa no setor.',
     'Um gesto, um significado, uma cor.'),
]


def plate(svg, bg, pad='28px 32px'):
    return f'<div class="plate" style="background:{bg};padding:{pad}">{svg}</div>'


def icon(key, size, alt=False):
    d = DIRECOES[key]
    return icone_svg(d['simbolo'](), d['icone_claro' if alt else 'icone'], size)


def phone(key):
    others = ['Agenda', 'Mail', 'Banco', 'Notas', 'Fotos', 'Mapas', 'WhatsApp']
    cells = []
    for i, name in enumerate(others[:3]):
        cells.append(f'<div class="app"><span class="ph" style="--h:{i}"></span><small>{name}</small></div>')
    cells.append(f'<div class="app"><span class="ic">{icon(key, 46)}</span><small>Dalva</small></div>')
    for i, name in enumerate(others[3:]):
        cells.append(f'<div class="app"><span class="ph" style="--h:{i + 3}"></span><small>{name}</small></div>')
    return f'''<figure class="mock phone"><div class="screen">
<div class="status"><b>6:12</b><span>qua, 28 out</span></div>
<div class="notif"><span class="ni">{icon(key, 22)}</span><div><b>Dalva</b><span>Bom dia. Suas 3 ações de hoje estão prontas.</span></div></div>
<div class="grid">{''.join(cells)}</div></div><figcaption>Tela inicial e notificação, 6:12</figcaption></figure>'''


def avatar(key):
    return f'''<figure class="mock chat"><div class="chatbox">
<div class="row"><span class="av">{icon(key, 44)}</span><div><b>Dalva</b><span>1. Ligar para a Grão Fino Cafés (abriu filial ontem)</span></div><time>6:00</time></div>
<div class="row muted"><span class="av ini">MR</span><div><b>Marina Rocha</b><span>Fechado, mando o contrato hoje</span></div><time>ontem</time></div>
<div class="row muted"><span class="av ini">CT</span><div><b>Contabilidade Tavares</b><span>Guia do DAS anexa</span></div><time>seg</time></div>
</div><figcaption>Avatar redondo numa lista de conversas</figcaption></figure>'''


def header(key):
    m = DIRECOES[key]['wordmark']()
    h = 22 if key != 'horizonte' else 19
    return f'''<figure class="mock site"><div class="sitebox">
<nav><span class="wm">{wordmark_svg(m, NOITE, CORAL, height=h)}</span><span class="links"><a>Como funciona</a><a>Preço</a><a>Entrar</a></span><span class="cta">Testar grátis</span></nav>
<div class="hero"><h4>Prospecção que acontece enquanto você dorme.</h4><p>Encontre empresas para vender. Não perca o próximo passo.</p></div>
<footer>um produto Don</footer></div><figcaption>Cabeçalho do site</figcaption></figure>'''


def direcao_html(key):
    d = DIRECOES[key]; t = TEXTO[key]
    m = d['wordmark'](); sim = d['simbolo']()
    porque = ''.join(f'<li>{p}</li>' for p in t['porque'])
    sizes = ''.join(f'<div class="sz"><div class="szbox">{icon(key, z)}</div><small>{z} px</small></div>' for z in (16, 32, 64))
    wm_small = ''.join(f'<div class="sz"><div class="szbox">{wordmark_svg(m, NOITE, CORAL, height=z)}</div><small>{z} px</small></div>' for z in (12, 16, 24))
    return f'''
<section class="dir" id="{key}">
  <header class="dirhead"><span class="tag">{LETRA[key]}</span><h2>{t['titulo']}</h2><p class="line">{t['linha']}</p></header>
  <div class="pair">
    {plate(wordmark_svg(m, BRANCO, CORAL), NOITE, '56px 48px')}
    {plate(wordmark_svg(m, NOITE, CORAL), BRUMA, '56px 48px')}
  </div>
  <div class="cols">
    <div class="txt"><h3>Conceito</h3><p>{t['conceito']}</p>
      <h3>Por que funciona para a Dalva</h3><ul>{porque}</ul>
      <h3>Risco</h3><p>{t['risco']}</p></div>
    <div class="icons">
      <div class="iconpair"><figure>{icon(key, 148)}<figcaption>Ícone</figcaption></figure><figure>{icon(key, 148, True)}<figcaption>Alternativo</figcaption></figure></div>
      <h3>Teste de tamanho</h3>
      <div class="sizes">{sizes}</div>
      <div class="big"><div class="bigbox">{icon(key, 512)}</div><small>512 px</small></div>
      <h3>Wordmark pequeno</h3>
      <div class="sizes wm">{wm_small}</div>
    </div>
  </div>
  <h3 class="gh">Grade de construção</h3>
  <div class="gridwrap">{grade_svg(key, m)}</div>
  <h3 class="gh">Na vida real</h3>
  <div class="mocks">{phone(key)}{avatar(key)}{header(key)}</div>
</section>'''


CSS = r'''
:root{
  /* Layout: folha de apresentação de estúdio; pranchas de cor fixa sobre papel neutro, uma coluna larga */
  --bg:#F7F5F2; --paper:#FFFFFF; --fg:#11131F; --muted:#5E6272; --line:#E6E2DB; --accent:#D9551F; --soft:#EFECE6;
  --noite:#11131F; --bruma:#F7F5F2; --coral:#FF7A45; --azul:#4E628F;
  --display:'Sora','IBM Plex Sans',system-ui,sans-serif; --sans:'IBM Plex Sans',-apple-system,system-ui,sans-serif;
  --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0B0D15;--paper:#141726;--fg:#EDEBE7;--muted:#9A9DAD;--line:#262A3B;--accent:#FF8A5B;--soft:#181B2A;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0B0D15;--paper:#141726;--fg:#EDEBE7;--muted:#9A9DAD;--line:#262A3B;--accent:#FF8A5B;--soft:#181B2A;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font:16px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:1180px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:56px 96px}
h1,h2,h3,h4{font-family:var(--display);text-wrap:balance;margin:0}
h1{font-size:clamp(34px,5vw,56px);line-height:1.05;letter-spacing:-.025em;font-weight:600;max-width:16ch}
h2{font-size:clamp(28px,3.4vw,40px);letter-spacing:-.02em;font-weight:600}
h3{font-size:13px;font-family:var(--mono);font-weight:500;text-transform:uppercase;letter-spacing:.08em;color:var(--muted);margin:28px 0 10px}
p{margin:0 0 12px;max-width:66ch} ul{margin:0;padding-left:18px;max-width:64ch} li{margin:0 0 8px}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);display:flex;gap:16px;flex-wrap:wrap}
.lead{font-size:19px;color:var(--muted);max-width:60ch;margin-top:20px}
.intro{display:grid;gap:8px;margin-bottom:64px}
.plate{border-radius:6px;box-shadow:inset 0 0 0 1px rgba(17,19,31,.08);display:flex;align-items:center;justify-content:center;min-width:0}
.plate svg{width:100%;height:auto;max-height:120px}
.lineup{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin:32px 0 80px}
.card{display:grid;gap:10px;min-width:0}
.card .plate{aspect-ratio:16/9;padding:12% 12%}
.card .plate svg{max-height:none}
.card .meta{display:flex;gap:14px;align-items:center}
.card .meta svg{width:56px;height:56px;flex:none}
.card b{font-family:var(--display);font-size:20px;font-weight:600;display:block}
.card span{color:var(--muted);font-size:14px;line-height:1.45;display:block}
.tag{font-family:var(--mono);font-size:12px;border:1px solid var(--line);border-radius:999px;padding:2px 10px;color:var(--muted)}
section{margin-top:96px}
.sechead{display:grid;gap:10px;margin-bottom:28px}
.refs{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:1px;background:var(--line);border:1px solid var(--line);border-radius:8px;overflow:hidden}
.ref{background:var(--paper);padding:20px;display:grid;gap:6px;align-content:start;min-width:0}
.ref b{font-family:var(--display);font-size:17px;font-weight:600}
.ref .who{font-family:var(--mono);font-size:11.5px;color:var(--muted)}
.ref p{font-size:14.5px;line-height:1.5;margin:0}
.ref .li{font-size:14px;color:var(--fg);border-top:1px solid var(--line);padding-top:8px;margin-top:4px}
.ref .li::before{content:"Para a Dalva: ";color:var(--muted)}
.check{display:grid;grid-template-columns:minmax(0,1.2fr) minmax(0,1fr);gap:40px;margin-top:40px}
.verdict{background:var(--paper);border:1px solid var(--line);border-radius:8px;padding:24px}
table{border-collapse:collapse;width:100%;font-size:14.5px}
td,th{text-align:left;padding:10px 12px 10px 0;border-bottom:1px solid var(--line);vertical-align:top}
th{font-family:var(--mono);font-weight:500;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
.tablewrap{overflow-x:auto}
.dir{border-top:1px solid var(--line);padding-top:56px}
.dirhead{display:grid;gap:10px;margin-bottom:28px}
.dirhead .tag{justify-self:start}
.line{font-size:19px;color:var(--muted);margin:0}
.pair{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px}
.pair .plate svg{max-height:110px}
.cols{display:grid;grid-template-columns:minmax(0,1.15fr) minmax(0,1fr);gap:48px;margin-top:8px}
.icons{min-width:0}
.iconpair{display:flex;gap:20px;flex-wrap:wrap;margin-top:28px}
.iconpair figure,.mock{margin:0}
.iconpair svg,.szbox svg,.bigbox svg{border-radius:22.37%;box-shadow:0 0 0 1px rgba(17,19,31,.08)}
.sizes.wm .szbox svg{border-radius:0;box-shadow:none}
figcaption,.sz small,.big small{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:8px;display:block}
.sizes{display:flex;gap:28px;align-items:flex-end;flex-wrap:wrap}
.sz{display:flex;flex-direction:column;align-items:center}
.szbox{background:var(--paper);border:1px solid var(--line);border-radius:6px;padding:14px;display:flex;align-items:center;justify-content:center;min-height:92px;min-width:92px}
.sizes.wm .szbox{background:var(--bruma);min-width:0}
.big{margin-top:20px}
.bigbox svg{width:100%;max-width:512px;height:auto;display:block}
.gh{margin-top:48px}
.gridwrap{overflow-x:auto;border:1px solid var(--line);border-radius:6px}
.gridwrap svg{display:block;width:100%;min-width:720px;height:auto}
.mocks{display:grid;grid-template-columns:240px minmax(0,1fr) minmax(0,1.35fr);gap:20px;align-items:start}
.phone .screen{width:240px;height:440px;border-radius:34px;background:#1C1F2E;border:6px solid #000;padding:18px 16px;display:flex;flex-direction:column;gap:16px;color:#fff;font-size:11px}
.status{display:flex;justify-content:space-between;opacity:.9}
.notif{display:flex;gap:10px;background:rgba(255,255,255,.12);border-radius:16px;padding:10px;align-items:flex-start;line-height:1.35}
.notif b{display:block;font-weight:600}
.notif .ni svg{display:block;border-radius:6px}
.phone .grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px 8px;margin-top:6px}
.app{display:flex;flex-direction:column;align-items:center;gap:5px}
.app small{font-size:9.5px;color:rgba(255,255,255,.85)}
.app .ph{width:46px;height:46px;border-radius:11px;background:hsl(calc(220 + var(--h) * 9) 9% calc(30% + var(--h) * 3%))}
.app .ic svg{display:block}
.chatbox,.sitebox{background:#fff;color:#11131F;border:1px solid #E6E2DB;border-radius:10px;overflow:hidden}
.row{display:flex;gap:12px;align-items:center;padding:12px 14px;border-bottom:1px solid #EFECE6;font-size:13px;line-height:1.35}
.row>div{min-width:0;flex:1}
.row b{display:block;font-weight:600}
.row span{display:block;color:#5E6272;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.row time{font-size:11px;color:#5E6272;align-self:flex-start}
.av{width:44px;height:44px;border-radius:50%;overflow:hidden;flex:none;display:block}
.av svg{width:44px;height:44px;display:block}
.av.ini{background:#E6E2DB;color:#5E6272;display:flex;align-items:center;justify-content:center;font-size:13px;font-weight:600}
.row.muted b{font-weight:500}
.sitebox{background:#F7F5F2}
.sitebox nav{display:flex;align-items:center;gap:18px;padding:16px 20px;border-bottom:1px solid #E6E2DB;background:#fff;flex-wrap:wrap}
.sitebox .wm svg{display:block}
.links{display:flex;gap:16px;font-size:13px;margin-left:auto}
.links a{color:#33364A}
.cta{background:#FF7A45;color:#11131F;font-weight:600;font-size:13px;padding:7px 14px;border-radius:999px}
.hero{padding:36px 22px 28px}
.hero h4{font-size:24px;line-height:1.15;letter-spacing:-.02em;font-weight:600;max-width:15ch}
.hero p{color:#5E6272;font-size:14px;margin-top:10px}
.sitebox footer{font-size:11px;color:#5E6272;padding:10px 22px;border-top:1px solid #E6E2DB}
.rec{background:var(--noite);color:#F7F5F2;border-radius:12px;padding:clamp(24px,5vw,56px);display:grid;gap:24px}
.rec h2{color:#fff}
.rec p,.rec li{color:#C9C7D2}
.rec b{color:#fff}
.rec .rk{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px}
.rec .rk div{border:1px solid #2A2E44;border-radius:8px;padding:16px;font-size:14.5px;line-height:1.5}
.rec .rk b{font-family:var(--display);display:block;font-size:17px;margin-bottom:4px}
.rec .rk .win{border-color:#FF7A45}
.next{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:20px;margin-top:20px}
.next div{border-top:2px solid var(--fg);padding-top:12px;font-size:15px}
.next b{font-family:var(--display);display:block;margin-bottom:4px}
a{color:var(--accent)}
.foot{max-width:none;margin-top:96px;font-size:13px;color:var(--muted);border-top:1px solid var(--line);padding-top:20px}
@media (max-width:960px){.refs{grid-template-columns:repeat(2,minmax(0,1fr))}.mocks{grid-template-columns:240px minmax(0,1fr)}.mocks .site{grid-column:1/-1}.cols,.check{grid-template-columns:1fr;gap:16px}}
@media (max-width:720px){.lineup,.pair,.rec .rk,.next{grid-template-columns:1fr}.refs{grid-template-columns:1fr}.mocks{grid-template-columns:1fr}.phone .screen{margin:0 auto}.links{display:none}}
'''


def pagina():
    lineup = ''
    for key, d in DIRECOES.items():
        m = d['wordmark'](); t = TEXTO[key]
        lineup += f'''<a class="card" href="#{key}" style="text-decoration:none;color:inherit">
{plate(wordmark_svg(m, BRANCO, CORAL), NOITE)}
<div class="meta">{icon(key, 56)}<div><b>{LETRA[key]} · {t['titulo']}</b><span>{t['linha']}</span></div></div></a>'''
    refs = ''.join(f'<div class="ref"><b>{n}</b><span class="who">{w}</span><p>{p}</p><p class="li">{l}</p></div>' for n, w, p, l in REFS)
    dirs = ''.join(direcao_html(k) for k in DIRECOES)
    return f'''<title>Marca Dalva</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>{CSS}</style>
<main class="wrap">
<div class="intro">
  <div class="eyebrow"><span>Dalva · identidade</span><span>Rodada 1</span><span>28 out 2026</span></div>
  <h1>Três caminhos para a primeira luz</h1>
  <p class="lead">O favorito do David tem a força certa: palavra branca, pesada, e um único ponto de cor no fim. O problema eram os três riscos, que repetem a estrutura da marca da Claro. Aqui estão três jeitos de manter a força sem os raios, cada um com letras desenhadas para a Dalva, ícone, versões claro e escuro, grade e testes de tamanho.</p>
</div>
<div class="lineup">{lineup}</div>

<section id="pesquisa">
  <div class="sechead"><h2>O que torna uma marca digital forte</h2><p class="line">Oito referências e o que cada uma ensina para este projeto.</p></div>
  <div class="refs">{refs}</div>
  <div class="check">
    <div>
      <h3>Checagem: Claro</h3>
      <p>A marca da Claro é a palavra em caixa-baixa com três traços curtos saindo do canto superior direito do "o" final, em vermelho. O logo do David repete quatro decisões dela ao mesmo tempo: palavra curta terminada em letra redonda, três traços, o mesmo canto, cor quente avermelhada. Mudar a cor de vermelho para coral não basta; num olhar de dois segundos a estrutura pesa mais que o tom. A Claro também vende para pequenas empresas, então o público é o mesmo. Por isso nenhuma das direções usa traço radial, ponto ou estrela.</p>
      <h3>Outras checagens</h3>
      <p>Operadoras: Claro (vermelho), Vivo (roxo), TIM (azul e vermelho). Coral sobre Noite não colide com nenhuma. Concorrentes diretos (Speedio, Econodata): não consegui verificar os logos nesta pesquisa. Antes dos arquivos finais, falta a busca no INPI pelo nome e pela marca mista nas classes 9, 35 e 42.</p>
    </div>
    <div class="verdict">
      <h3 style="margin-top:0">Semelhança por direção</h3>
      <div class="tablewrap"><table>
        <tr><th>Direção</th><th>Risco</th><th>Por quê</th></tr>
        <tr><td>A · Horizonte</td><td>Baixo</td><td>Gesto horizontal, nenhum traço radial. O Λ sem barra é recurso conhecido; a barra só no último A é o que o torna nosso.</td></tr>
        <tr><td>B · 18°</td><td>Baixo</td><td>Caixa-baixa geométrica é comum em SaaS; a distinção vem dos cortes e do ícone coral.</td></tr>
        <tr><td>C · Acesa</td><td>Médio</td><td>Nada em comum com a Claro, mas pintar a última letra é recurso conhecido. Risco de parecer genérico, não de conflito.</td></tr>
      </table></div>
    </div>
  </div>
</section>

{dirs}

<section id="recomendacao">
  <div class="rec">
    <h2>Recomendação: B · 18°</h2>
    <p>É a única das três em que a marca inteira é desenho próprio, e a que melhor cumpre o que a Dalva promete: o ícone coral é a primeira coisa acesa na tela do celular às seis da manhã, e o toque nele abre as três ações do dia. A palavra em caixa-baixa tem o tom certo (próxima, direta, competente), e os cortes a 18° dão um sistema que continua nas telas: o mesmo ângulo pode marcar o item "Hoje", o início de um card ou o corte de uma foto, sem virar enfeite.</p>
    <p>A Horizonte é a ideia mais bonita e a mais fiel ao favorito do David. Perde por dois motivos: caixa-alta puxa para o institucional e o ícone com A pede explicação. Se a decisão for manter um ponto coral dentro da palavra, ela é a escolha. A Acesa é a mais segura e a menos proprietária: funciona, mas não seria nossa.</p>
    <div class="rk">
      <div class="win"><b>B · 18°</b>Melhor ícone, melhor tom, lettering próprio. Risco: não tem coral na palavra.</div>
      <div><b>A · Horizonte</b>Conceito mais forte e silhueta própria. Risco: caixa-alta e ícone com A.</div>
      <div><b>C · Acesa</b>A mais simples de adotar. Risco: genérica.</div>
    </div>
  </div>
  <h3 style="margin-top:48px">Depois da escolha</h3>
  <div class="next">
    <div><b>Desenho fino</b>Kerning ótico par a par, overshoots, armadilhas de tinta e uma versão de 16 px desenhada à mão.</div>
    <div><b>Regras</b>Versões em uma cor (Noite, branco, coral), área de proteção, tamanho mínimo para tela e impressão, ícone monocromático do iOS.</div>
    <div><b>Arquivos</b>SVG e PNG finais, favicon, ícones iOS/Android, avatar e um guia curto de uso.</div>
  </div>
</section>
<p class="foot">Letras construídas em código (retângulos e superelipses unidos por operações booleanas), sem fonte pronta. Processo guiado pela skill logo-design (rampstackco/claude-skills). Arquivos em design/logo/svg.</p>
</main>'''


if __name__ == '__main__':
    exportar()
    with open(os.path.join(AQUI, 'apresentacao.html'), 'w') as f:
        f.write(pagina())
    print('apresentacao.html')
