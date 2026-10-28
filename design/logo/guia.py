"""Guia de uso da marca Dalva (página única). Rode depois de final.py.

    cd design/logo && python3 final.py && python3 guia.py
"""
import os
from final import *
from final import _mono

ESPACO_AREA = (53, 96, 15, -28)   # resultado de espacamento.py (alvo 96)
ESPACO_ANTES = (54, 88, 52, 24)


def wm(cor, h=None, espaco=ESPACO, cls=''):
    s = svg_wordmark(cor, espaco)
    if h:
        s = s.replace('<svg ', f'<svg height="{h}" ', 1)
    return s


def ic(svg, size):
    return svg.replace('<svg ', f'<svg width="{size}" height="{size}" ', 1)


def pixel_zoom(grid, z=14):
    cells = []
    for y, row in enumerate(grid):
        for x, c in enumerate(row):
            o = {'#': 1, '+': .55, '-': .25}.get(c, 0)
            if o:
                cells.append(f'<rect x="{x * z}" y="{y * z}" width="{z}" height="{z}" fill="{NOITE}" fill-opacity="{o}"/>')
    lines = ''.join(f'<line x1="{i * z}" y1="0" x2="{i * z}" y2="{16 * z}" stroke="#fff" stroke-opacity=".35"/>'
                    f'<line x1="0" y1="{i * z}" x2="{16 * z}" y2="{i * z}" stroke="#fff" stroke-opacity=".35"/>' for i in range(17))
    N = 16 * z
    return (f'<svg viewBox="0 0 {N} {N}" width="{N}" height="{N}" role="img" aria-label="Favicon de 16 px ampliado">'
            f'<rect width="{N}" height="{N}" rx="{N * .2237:.0f}" fill="{CORAL}"/>{"".join(cells)}{lines}</svg>')


def nao_faca():
    g, tot, xs = wordmark()
    base = svg_d(g)
    vb = f'-40 {-A - 200} {tot + 80} {A + O + 260}'
    vb2 = f'-50 {-A - 200} {(tot + 80) * 1.25:.0f} {A + O + 260}'
    ex = [
        ('Não estique nem comprima.', f'<svg viewBox="{vb2}"><path d="{base}" fill="{NOITE}" transform="scale(1.25 1)"/></svg>', ''),
        ('Não pinte a palavra de coral. O coral é do ícone e dos botões.', f'<svg viewBox="{vb}"><path d="{base}" fill="{CORAL}"/></svg>', ''),
        ('Não acrescente ponto, raio ou estrela.', f'<svg viewBox="{vb}"><path d="{base}" fill="{NOITE}"/><circle cx="{xs[4] + 560}" cy="{-X - 110}" r="80" fill="{CORAL}"/></svg>', ''),
        ('Não use branco sobre coral (contraste 2,6:1).', f'<svg viewBox="{vb}"><path d="{base}" fill="#fff"/></svg>', 'coral'),
    ]
    out = ''
    for txt, svg, cls in ex:
        st = f' style="background:{CORAL}"' if cls == 'coral' else ''
        out += f'<figure class="dont"><div class="dontbox"{st}>{svg}</div><figcaption>{txt}</figcaption></figure>'
    return out


CSS = r'''
:root{
  /* Layout: guia de marca em coluna única; pranchas de cor fixa (Noite/Bruma/coral) sobre papel; specs em mono */
  --bg:#F7F5F2; --paper:#FFFFFF; --fg:#11131F; --muted:#5E6272; --line:#E6E2DB; --accent:#C2481A;
  --noite:#11131F; --bruma:#F7F5F2; --coral:#FF7A45;
  --display:'Sora','IBM Plex Sans',system-ui,sans-serif; --sans:'IBM Plex Sans',-apple-system,system-ui,sans-serif; --mono:'IBM Plex Mono',ui-monospace,Menlo,monospace;
}
@media (prefers-color-scheme: dark){:root:not([data-theme="light"]){--bg:#0B0D15;--paper:#141726;--fg:#EDEBE7;--muted:#9A9DAD;--line:#262A3B;--accent:#FF8A5B;color-scheme:dark}}
:root[data-theme="dark"]{--bg:#0B0D15;--paper:#141726;--fg:#EDEBE7;--muted:#9A9DAD;--line:#262A3B;--accent:#FF8A5B;color-scheme:dark}
*{box-sizing:border-box}
body{background:var(--bg);color:var(--fg);font:16px/1.6 var(--sans);-webkit-font-smoothing:antialiased}
.wrap{max-width:1120px;margin:0 auto;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:0 96px}
h1,h2,h3{font-family:var(--display);text-wrap:balance;margin:0}
h2{font-size:clamp(26px,3.2vw,36px);letter-spacing:-.02em;font-weight:600}
h3{font-family:var(--mono);font-size:12px;font-weight:500;letter-spacing:.08em;text-transform:uppercase;color:var(--muted);margin:28px 0 10px}
p{margin:0 0 12px;max-width:66ch} ul{margin:0;padding-left:18px;max-width:66ch} li{margin-bottom:6px}
.hero{background:var(--noite);color:#F7F5F2;padding-left:max(16px,env(safe-area-inset-left,0px));padding-right:max(16px,env(safe-area-inset-right,0px));padding-block:56px 64px}
.hero .in{max-width:1120px;margin:0 auto;display:grid;gap:40px}
.eyebrow{font-family:var(--mono);font-size:12px;letter-spacing:.08em;text-transform:uppercase;color:#9A9DAD;display:flex;gap:16px;flex-wrap:wrap}
.hero .mark svg{width:min(560px,100%);height:auto;display:block}
.hero p{color:#C9C7D2;font-size:18px;margin:0}
section{padding-top:80px;display:grid;gap:8px}
.lead{color:var(--muted);font-size:18px;max-width:62ch}
.plates{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:16px;margin-top:20px}
.plate{border-radius:8px;padding:56px 40px;display:flex;align-items:center;justify-content:center;box-shadow:inset 0 0 0 1px rgba(17,19,31,.08);min-width:0}
.plate svg{width:100%;max-width:360px;height:auto}
.plate.sm{padding:36px 28px}
.plate.sm svg{max-width:220px}
.plates.four{grid-template-columns:repeat(4,minmax(0,1fr))}
.cap{font-family:var(--mono);font-size:11.5px;color:var(--muted);margin-top:8px;display:block}
.fig{margin:0;min-width:0}
.gridwrap{overflow-x:auto;border:1px solid var(--line);border-radius:8px;margin-top:16px}
.gridwrap svg{display:block;width:100%;min-width:720px;height:auto}
.two{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:40px;margin-top:16px;align-items:start}
table{border-collapse:collapse;width:100%;font-size:14.5px;font-variant-numeric:tabular-nums}
td,th{text-align:left;padding:10px 14px 10px 0;border-bottom:1px solid var(--line)}
th{font-family:var(--mono);font-weight:500;font-size:11.5px;letter-spacing:.06em;text-transform:uppercase;color:var(--muted)}
td.n,th.n{text-align:right}
.tablewrap{overflow-x:auto}
.icons{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end;margin-top:16px}
.icons figure{margin:0;display:flex;flex-direction:column;align-items:center}
.icons svg{display:block}
.r{border-radius:22.37%;box-shadow:0 0 0 1px rgba(17,19,31,.08)}
.circ{border-radius:50%}
.px{display:flex;gap:28px;flex-wrap:wrap;align-items:flex-end;margin-top:16px}
.px figure{margin:0}
.px img{image-rendering:pixelated}
.min{display:grid;grid-template-columns:repeat(3,minmax(0,1fr));gap:16px;margin-top:16px}
.min div{border:1px solid var(--line);background:var(--paper);border-radius:8px;padding:20px;display:grid;gap:12px;align-content:start}
.min b{font-family:var(--display);font-size:26px;font-weight:600;letter-spacing:-.02em}
.min .demo{background:var(--bruma);border-radius:6px;padding:14px;display:flex;gap:14px;align-items:center;flex-wrap:wrap}
.min .demo svg{display:block}
.colors{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:12px;margin-top:16px}
.sw{border-radius:8px;overflow:hidden;border:1px solid var(--line);background:var(--paper)}
.sw i{display:block;height:84px}
.sw div{padding:12px;font-size:13.5px;line-height:1.45}
.sw b{font-family:var(--display);display:block;font-size:15px}
.sw code{font-family:var(--mono);font-size:12px;color:var(--muted)}
.donts{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px;margin-top:16px}
.dont{margin:0}
.dontbox{background:var(--bruma);border-radius:8px;aspect-ratio:16/9;display:flex;align-items:center;justify-content:center;padding:18px;position:relative;overflow:hidden;box-shadow:inset 0 0 0 1px rgba(17,19,31,.08)}
.dontbox svg{width:100%;height:auto;max-height:100%}
.dontbox::after{content:"";position:absolute;inset:0;background:linear-gradient(to top right,transparent calc(50% - 1px),#C2481A calc(50% - 1px),#C2481A calc(50% + 1px),transparent calc(50% + 1px))}
.dont figcaption{font-size:14px;margin-top:10px}
.files{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:0 40px;margin-top:16px}
.files div{display:flex;gap:16px;justify-content:space-between;border-bottom:1px solid var(--line);padding:10px 0;font-size:14px;min-width:0}
.files code{font-family:var(--mono);font-size:12.5px;overflow-wrap:anywhere}
.files span{color:var(--muted);text-align:right}
.rule{border-left:2px solid var(--fg);padding-left:16px;font-size:15px}
.foot{margin-top:80px;padding-top:20px;border-top:1px solid var(--line);font-size:13px;color:var(--muted);display:flex;justify-content:space-between;gap:16px;flex-wrap:wrap}
@media (max-width:860px){.plates.four,.donts,.colors{grid-template-columns:repeat(2,minmax(0,1fr))}.two,.min,.files{grid-template-columns:1fr}}
@media (max-width:520px){.plates,.plates.four,.donts,.colors{grid-template-columns:1fr}}
'''


def pagina():
    g, tot, _ = wordmark()
    ratio = tot / (A + O)
    pares = ['d a', 'a l', 'l v', 'v a']
    linhas = ''.join(f'<tr><td>{p}</td><td class="n">{b}</td><td class="n">{ar}</td><td class="n"><b>{f}</b></td></tr>'
                     for p, b, ar, f in zip(pares, ESPACO_ANTES, ESPACO_AREA, ESPACO))
    icone = svg_icone()
    files = [
        ('svg/dalva-wordmark-noite.svg', 'principal, fundo claro'),
        ('svg/dalva-wordmark-branco.svg', 'fundo escuro'),
        ('svg/dalva-wordmark-preto.svg', 'impressão em 1 cor'),
        ('svg/dalva-wordmark-pequeno-*.svg', 'até 24 px de altura'),
        ('svg/dalva-simbolo-*.svg', 'só o d (Noite, branco, coral)'),
        ('svg/dalva-icone.svg', 'ícone com cantos'),
        ('svg/dalva-icone-quadrado.svg', 'lojas de app (a loja arredonda)'),
        ('svg/dalva-icone-escuro.svg', 'iOS modo escuro'),
        ('svg/dalva-icone-mono.svg', 'iOS tingido, monocromático'),
        ('svg/favicon.svg · favicon.ico', 'navegador (16, 32, 48)'),
        ('png/icone-ios-1024.png', 'App Store'),
        ('png/icone-play-512.png', 'Google Play'),
        ('png/android-adaptativo-*.png', 'Android: frente, fundo, mono'),
        ('png/apple-touch-icon-180.png', 'atalho no iPhone'),
        ('png/icone-pwa-192/512.png', 'web app'),
        ('png/avatar-800.png', 'perfil (WhatsApp, LinkedIn)'),
        ('png/dalva-wordmark-*-32/64/96.png', 'e-mail, documentos'),
        ('svg/grade-construcao.svg · area-de-protecao.svg', 'referência'),
    ]
    flist = ''.join(f'<div><code>{a}</code><span>{b}</span></div>' for a, b in files)
    w16 = round(16 * ratio)
    return f'''<title>Guia da marca Dalva</title>
<meta name="claude:viewport-fit-sides" content="cover">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600&family=IBM+Plex+Sans:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>{CSS}</style>
<header class="hero"><div class="in">
  <div class="eyebrow"><span>Guia da marca</span><span>v1.0</span><span>28 out 2026</span></div>
  <div class="mark">{wm(BRANCO)}</div>
  <p>Prospecção que acontece enquanto você dorme.</p>
</div></header>
<main class="wrap">

<section id="marca">
  <h2>A marca</h2>
  <p class="lead">dalva em caixa-baixa, com letras desenhadas para a marca. Toda haste termina num corte de 18°: o crepúsculo astronômico começa quando o sol está 18° abaixo do horizonte, a hora em que a Dalva fecha o trabalho da noite. O coral não entra na palavra. Ele mora no ícone, que é o botão que a pessoa toca toda manhã, e nos botões do produto.</p>
  <div class="plates">
    <div class="plate" style="background:var(--bruma)">{wm(NOITE)}</div>
    <div class="plate" style="background:var(--noite)">{wm(BRANCO)}</div>
  </div>
</section>

<section id="construcao">
  <h2>Construção</h2>
  <p class="lead">Retângulos e superelipses unidos por operações booleanas, numa grade de 64 unidades (meia haste).</p>
  <div class="gridwrap">{svg_grade()}</div>
  <div class="two">
    <ul>
      <li>Altura-x 520, ascendente 742, haste 128, curvas 134 (a curva parece mais fina que a reta, por isso é mais grossa).</li>
      <li>Bojo em superelipse k = 0,60; passa 10 unidades da linha de base e da altura-x (overshoot) para parecer do mesmo tamanho que as hastes.</li>
      <li>O miolo do d e do a é assimétrico: redondo à esquerda, mais reto junto da haste (k = 0,70). A junção afina e o miolo continua aberto em tamanho pequeno.</li>
      <li>d e a são o mesmo desenho; só muda a altura da haste.</li>
      <li>A forquilha do v é achatada (armadilha de tinta) para não empastar.</li>
      <li>Diagonais terminam retas na altura-x; só as hastes verticais levam o corte de 18°.</li>
    </ul>
    <div>
      <h3 style="margin-top:0">Espaço entre letras (unidades)</h3>
      <div class="tablewrap"><table>
        <tr><th>Par</th><th class="n">Rodada 1</th><th class="n">Área ótica</th><th class="n">Final</th></tr>{linhas}
      </table></div>
      <p style="margin-top:12px;font-size:14.5px;color:var(--muted)">A área ótica mede o branco entre cada par e iguala tudo ao par de hastes (a l). Ela aperta demais o v contra o a, então o valor final fica entre a medida e o olho.</p>
    </div>
  </div>
</section>

<section id="versoes">
  <h2>Versões</h2>
  <p class="lead">Três cores para a palavra, nenhuma delas coral. Abaixo de 24 px de altura, use a versão pequena: o espaço entre letras abre 28 unidades por par para as letras não grudarem.</p>
  <div class="plates four">
    <figure class="fig"><div class="plate sm" style="background:var(--bruma)">{wm(NOITE)}</div><span class="cap">Noite · principal</span></figure>
    <figure class="fig"><div class="plate sm" style="background:var(--noite)">{wm(BRANCO)}</div><span class="cap">Branco · fundo escuro</span></figure>
    <figure class="fig"><div class="plate sm" style="background:#fff">{wm(PRETO)}</div><span class="cap">Preto · impressão em 1 cor</span></figure>
    <figure class="fig"><div class="plate sm" style="background:var(--coral)">{wm(NOITE)}</div><span class="cap">Noite sobre coral · peças de vitrine</span></figure>
  </div>
</section>

<section id="icone">
  <h2>Ícone</h2>
  <p class="lead">O d em Noite sobre coral. Contraste 7,1:1. O d fica no centro ótico: metade pelo centro da caixa, metade pelo centro de massa, porque o bojo pesa à esquerda.</p>
  <div class="icons">
    <figure>{ic(icone, 128).replace('<svg ', '<svg class="r" ', 1)}<span class="cap">Principal</span></figure>
    <figure>{ic(svg_icone(bg=NOITE, ink=CORAL), 128).replace('<svg ', '<svg class="r" ', 1)}<span class="cap">iOS escuro</span></figure>
    <figure><div style="background:#5E6272;border-radius:22.37%;width:128px;height:128px">{ic(svg_icone(ink=BRANCO, transparente=True), 128)}</div><span class="cap">iOS tingido</span></figure>
    <figure>{ic(svg_icone(raio=0), 128).replace('<svg ', '<svg class="circ" ', 1)}<span class="cap">Avatar / Android</span></figure>
  </div>
  <h3>Tamanhos pequenos são desenhados à parte</h3>
  <div class="px">
    <figure>{pixel_zoom(G16)}<span class="cap">16 px, pixel a pixel (ampliado 14×)</span></figure>
    <figure>{ic(svg_favicon32(), 32)}<span class="cap">32 px · haste de 3 px exatos</span></figure>
    <figure>{svg_favicon16()}<span class="cap">16 px real</span></figure>
  </div>
</section>

<section id="protecao">
  <h2>Área de proteção</h2>
  <p class="lead">Meia altura-x livre em volta da palavra, em qualquer tamanho. É mais ou menos a largura de duas hastes.</p>
  <div class="gridwrap" style="border:0">{svg_protecao()}</div>
  <p class="rule">A assinatura "um produto Don" fica no rodapé, nunca dentro dessa área nem ao lado do ícone.</p>
</section>

<section id="minimo">
  <h2>Tamanho mínimo</h2>
  <div class="min">
    <div><h3 style="margin:0">Palavra, tela</h3><b>16 px</b><span>de altura (≈ {w16} px de largura). Até 24 px, use a versão pequena.</span>
      <div class="demo">{wm(NOITE, 16, ESPACO_PEQUENO)}{wm(NOITE, 24, ESPACO_PEQUENO)}</div></div>
    <div><h3 style="margin:0">Palavra, impressão</h3><b>5 mm</b><span>de altura (≈ 17 mm de largura). Abaixo disso, só o ícone.</span></div>
    <div><h3 style="margin:0">Ícone</h3><b>16 px</b><span>com o favicon desenhado à mão. De 24 a 48 px, a versão de 32 px; acima, o vetor.</span>
      <div class="demo">{svg_favicon16()}{ic(svg_favicon32(), 32)}{ic(icone, 48).replace('<svg ', '<svg class="r" ', 1)}</div></div>
  </div>
</section>

<section id="cores">
  <h2>Cores</h2>
  <div class="colors">
    <div class="sw"><i style="background:#FF7A45"></i><div><b>Coral</b><code>#FF7A45</code><br>Ícone e botões. Só com Noite por cima.</div></div>
    <div class="sw"><i style="background:#11131F"></i><div><b>Noite</b><code>#11131F</code><br>Palavra, texto, fundo de vitrine.</div></div>
    <div class="sw"><i style="background:#F7F5F2;box-shadow:inset 0 -1px 0 #E6E2DB"></i><div><b>Bruma</b><code>#F7F5F2</code><br>Fundo do dia a dia.</div></div>
    <div class="sw"><i style="background:#FFFFFF;box-shadow:inset 0 -1px 0 #E6E2DB"></i><div><b>Branco</b><code>#FFFFFF</code><br>Palavra sobre Noite.</div></div>
    <div class="sw"><i style="background:#000000"></i><div><b>Preto</b><code>#000000</code><br>Só impressão em 1 cor.</div></div>
  </div>
</section>

<section id="nao">
  <h2>Não faça</h2>
  <div class="donts">{nao_faca()}</div>
</section>

<section id="arquivos">
  <h2>Arquivos</h2>
  <p class="lead">No repositório, em <code>design/logo/final/</code>. Tudo sai de <code>final.py</code>; mudou o desenho, rode de novo.</p>
  <div class="files">{flist}</div>
</section>

<div class="foot"><span>Dalva · guia da marca v1.0</span><span>um produto Don</span></div>
</main>'''


if __name__ == '__main__':
    open(os.path.join(AQUI, 'guia.html'), 'w').write(pagina())
    print('guia.html')
