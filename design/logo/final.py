"""Marca final da Dalva (direção B · 18°): desenho refinado, versões, regras e arquivos.

    cd design/logo && python3 final.py      # gera final/ (SVG, PNG, ICO) e guia.html

PNGs são renderizados com o Chromium do Playwright (node + playwright) e com Pillow.
"""
import json, os, subprocess, tempfile
from fontTools.pens.statisticsPen import StatisticsPen
from PIL import Image, ImageDraw
from letras import *
from direcoes import CORAL, NOITE, BRUMA, AZUL, AMBAR, BRANCO

AQUI = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(AQUI, 'final')
PRETO = '#000000'

ANG = 18          # corte das hastes
KR = 0.70         # tensão do miolo junto da haste (afina a junção bojo/haste)
# Espaço entre letras, em unidades. Ponto de partida: área ótica igual entre pares
# (espacamento.py dá 53, 96, 15, -28); depois corrigido no olho, porque a área pura
# encosta o v no a. Antes do refino: 54, 88, 52, 24.
ESPACO = (58, 96, 36, 8)
ESPACO_PEQUENO = tuple(e + 28 for e in ESPACO)   # versão para até 24 px de altura
PROTECAO = X / 2   # área de proteção: meia altura-x (260 u)


def oval2(cx, cy, rx, ry, kl, kr):
    """Superelipse com tensões diferentes à esquerda e à direita."""
    p = path(); pen = p.getPen()
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + kr * ry), (cx + kr * rx, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - kl * rx, cy + ry), (cx - rx, cy + kl * ry), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - kl * ry), (cx - kl * rx, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + kr * rx, cy - ry), (cx + rx, cy - kr * ry), (cx + rx, cy))
    pen.closePath()
    return p


def bojo_haste(top, wa=556):
    rx = wa / 2; cy = X / 2; ry = X / 2 + O
    outer = oval(rx, cy, rx, ry)
    stem = rect(wa - S, 0, wa, top)
    rxc = (2 * rx - S - SC) / 2; cxc = SC + rxc
    counter = oval2(cxc, cy, rxc, ry - H, K + 0.015, KR)
    g = op(union(outer, stem), counter, D_)
    return cut_top(g, wa - S, top, ANG), wa


def glifos():
    d, wd = bojo_haste(A)
    a, wa = bojo_haste(X)
    l, wl = g_l(A); l = cut_top(l, 0, A, ANG)
    v, wv = g_v()
    return d, wd, a, wa, l, wl, v, wv


def wordmark(espaco=ESPACO):
    d, wd, a, wa, l, wl, v, wv = glifos()
    ps, tot, xs = compose([(d, wd, 0), (a, wa, espaco[0]), (l, wl, espaco[1]), (v, wv, espaco[2]), (a, wa, espaco[3])])
    return union(*ps), tot, xs


def simbolo():
    d, wd = bojo_haste(A)
    return d, wd


# ------------------------------------------------------------------ SVG
def bounds_v(tot):
    return (0, -O, tot, A)


def svg_wordmark(cor, espaco=ESPACO, pad=0, bg=None):
    g, tot, _ = wordmark(espaco)
    x0, y0, x1, y1 = bounds_v(tot)
    p = pad
    vb = (x0 - p, -(y1 + p), x1 - x0 + 2 * p, y1 - y0 + 2 * p)
    bgr = f'<rect x="{vb[0]:.0f}" y="{vb[1]:.0f}" width="{vb[2]:.0f}" height="{vb[3]:.0f}" fill="{bg}"/>' if bg else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}" role="img" aria-label="Dalva">'
            f'<title>Dalva</title>{bgr}<path d="{svg_d(g)}" fill="{cor}"/></svg>')


def centro_otico(g, bbox):
    """Meio-termo entre o centro da caixa e o centro de massa (o bojo pesa à esquerda)."""
    sp = StatisticsPen(); g.draw(sp)
    x0, y0, x1, y1 = bbox
    return 0.5 * ((x0 + x1) / 2) + 0.5 * sp.meanX, (y0 + y1) / 2


def svg_icone(bg=CORAL, ink=NOITE, raio=0.2237, fill=0.58, N=1024, transparente=False):
    g, wd = simbolo()
    bbox = (0, -O, wd, A)
    cx, cy = centro_otico(g, bbox)
    s = N * fill / (A + O)
    tx = N / 2 - s * cx; ty = N / 2 + s * cy
    r = f' rx="{N * raio:.0f}"' if raio else ''
    fundo = '' if transparente else f'<rect width="{N}" height="{N}"{r} fill="{bg}"/>'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}" role="img" aria-label="Dalva">'
            f'{fundo}<path d="{svg_d(g, s, tx, ty)}" fill="{ink}"/></svg>')


def svg_simbolo(cor):
    g, wd = simbolo()
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 {-A:.0f} {wd} {A + O:.0f}" role="img" aria-label="Dalva">'
            f'<path d="{svg_d(g)}" fill="{cor}"/></svg>')


def svg_favicon32():
    """32 px com a haste presa à grade de pixels: haste = 3 px exatos."""
    g, wd = simbolo()
    s = 3 / S
    h = (A + O) * s                      # ≈ 17,9 px
    stem_x = 19                          # borda esquerda da haste num pixel inteiro
    tx = stem_x - s * (wd - S)
    ty = 24                              # linha de base num pixel inteiro (centro ótico um pouco acima)
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 32 32" width="32" height="32">'
            f'<rect width="32" height="32" rx="7" fill="{CORAL}"/><path d="{svg_d(g, s, tx, ty)}" fill="{NOITE}"/></svg>')


# ------------------------------------------------------------------ 16 px desenhado à mão
G16 = [
    "................",
    "................",
    "................",
    "..........-#....",
    "..........##....",
    "..........##....",
    ".....+######....",
    "....+#######....",
    "....##-...##....",
    "....##....##....",
    "....##-...##....",
    "....+#######....",
    ".....+######....",
    "................",
    "................",
    "................",
]


def hex2rgb(h):
    return tuple(int(h[i:i + 2], 16) for i in (1, 3, 5))


def favicon16(bg=CORAL, ink=NOITE):
    big = Image.new('L', (256, 256), 0)
    ImageDraw.Draw(big).rounded_rectangle((0, 0, 255, 255), radius=int(256 * 0.2237), fill=255)
    mask = big.resize((16, 16), Image.LANCZOS)
    b, k = hex2rgb(bg), hex2rgb(ink)
    im = Image.new('RGBA', (16, 16)); px = im.load()
    for y in range(16):
        for x in range(16):
            t = {'#': 1, '+': .55, '-': .25}.get(G16[y][x], 0)
            px[x, y] = tuple(round(b[i] * (1 - t) + k[i] * t) for i in range(3)) + (mask.getpixel((x, y)),)
    return im


def svg_favicon16():
    rects = []
    for y, row in enumerate(G16):
        for x, c in enumerate(row):
            if c != '.':
                o = {'#': 1, '+': .55, '-': .25}[c]
                rects.append(f'<rect x="{x}" y="{y}" width="1" height="1" fill="{NOITE}"' + (f' fill-opacity="{o}"' if o < 1 else '') + '/>')
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 16 16" width="16" height="16" shape-rendering="crispEdges">'
            f'<rect width="16" height="16" rx="3.5" fill="{CORAL}" shape-rendering="geometricPrecision"/>{"".join(rects)}</svg>')


# ------------------------------------------------------------------ diagramas
def _mono(x, y, t, c=AZUL, anchor='start', size=11):
    return (f'<text x="{x:.1f}" y="{y:.1f}" fill="{c}" font-family="IBM Plex Mono, ui-monospace, monospace" '
            f'font-size="{size}" text-anchor="{anchor}">{t}</text>')


def svg_protecao(W=900):
    g, tot, xs = wordmark()
    P = PROTECAO
    x0, y0, x1, y1 = bounds_v(tot)
    margin = 60
    s = (W - 2 * margin) / (tot + 2 * P)
    Hh = (y1 - y0 + 2 * P) * s + 2 * margin
    tx = margin + P * s; ty = margin + (P + y1) * s
    X_ = lambda u: tx + u * s; Y_ = lambda u: ty - u * s
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh:.0f}" role="img" aria-label="Área de proteção">',
         f'<rect width="{W}" height="{Hh:.0f}" fill="{BRUMA}"/>',
         f'<rect x="{X_(-P):.1f}" y="{Y_(y1 + P):.1f}" width="{(tot + 2 * P) * s:.1f}" height="{(y1 - y0 + 2 * P) * s:.1f}" fill="{CORAL}" fill-opacity=".10" stroke="{CORAL}" stroke-dasharray="5 4"/>',
         f'<rect x="{X_(0):.1f}" y="{Y_(y1):.1f}" width="{tot * s:.1f}" height="{(y1 - y0) * s:.1f}" fill="{BRUMA}" stroke="{AZUL}" stroke-width=".8" stroke-opacity=".5"/>',
         f'<path d="{svg_d(g, s, tx, ty)}" fill="{NOITE}"/>']
    # módulos de meia altura-x nos quatro lados
    q = P * s
    for (px_, py_) in [(X_(-P), Y_(y1) - q), (X_(tot), Y_(y1) - q), (X_(-P), Y_(y0)), (X_(tot), Y_(y0))]:
        o.append(f'<rect x="{px_:.1f}" y="{py_:.1f}" width="{q:.1f}" height="{q:.1f}" fill="none" stroke="{CORAL}"/>')
    o.append(_mono(X_(-P) + q / 2, Y_(y1) - q / 2 + 4, '½x', CORAL, 'middle'))
    o.append(_mono(X_(tot) + q / 2, Y_(y0) + q / 2 + 4, '½x', CORAL, 'middle'))
    o.append(_mono(margin - 20 + 6, Hh - 18, 'x = altura-x do wordmark. Nada entra na área tracejada: texto, borda, outro logo, a assinatura Don.', AZUL))
    o.append('</svg>')
    return ''.join(o)


def svg_grade(W=1080):
    g, tot, xs = wordmark()
    d, wd, a, wa, l, wl, v, wv = glifos()
    left, right, top, bottom = 150, 40, 46, 70
    s = (W - left - right) / tot
    top_u = A + 40
    Hh = top + bottom + (top_u + 40) * s
    tx = left; ty = top + top_u * s
    X_ = lambda u: tx + u * s; Y_ = lambda u: ty - u * s
    o = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh:.0f}" role="img" aria-label="Grade de construção">',
         f'<rect width="{W}" height="{Hh:.0f}" fill="{BRUMA}"/>']
    step = S / 2
    u = 0
    while X_(u) < W - right:
        o.append(f'<line x1="{X_(u):.1f}" y1="{top - 10}" x2="{X_(u):.1f}" y2="{Hh - bottom + 10:.0f}" stroke="{AZUL}" stroke-width=".5" opacity=".13"/>'); u += step
    u = -step
    while u < top_u:
        o.append(f'<line x1="{left - 8}" y1="{Y_(u):.1f}" x2="{W - right + 10}" y2="{Y_(u):.1f}" stroke="{AZUL}" stroke-width=".5" opacity=".13"/>'); u += step
    for u, lab in [(0, 'linha de base 0'), (X, f'altura-x {X}'), (A, f'ascendente {A}')]:
        o.append(f'<line x1="{left - 8}" y1="{Y_(u):.1f}" x2="{W - right + 10}" y2="{Y_(u):.1f}" stroke="{AZUL}"/>')
        o.append(_mono(left - 14, Y_(u) + 3.5, lab, AZUL, 'end', 10))
    for u, lab in [(-O, f'overshoot {O}'), (X + O, '')]:
        o.append(f'<line x1="{left - 8}" y1="{Y_(u):.1f}" x2="{W - right + 10}" y2="{Y_(u):.1f}" stroke="{AZUL}" stroke-dasharray="2 3" opacity=".6"/>')
        if lab: o.append(_mono(left - 14, Y_(u) + 12, lab, AZUL, 'end', 9))
    o.append(f'<path d="{svg_d(g, s, tx, ty)}" fill="#E4E1EA" stroke="{NOITE}" stroke-width="1.1"/>')
    import math
    t = math.tan(math.radians(ANG))
    for sx, top_ in [(xs[0] + wd - S, A), (xs[1] + wa - S, X), (xs[2], A), (xs[4] + wa - S, X)]:
        xa, xb = sx - 150, sx + S + 150
        o.append(f'<line x1="{X_(xa):.1f}" y1="{Y_(top_ - S * t - 150 * t):.1f}" x2="{X_(xb):.1f}" y2="{Y_(top_ + 150 * t):.1f}" stroke="{CORAL}" stroke-dasharray="5 3"/>')
    o.append(_mono(X_(xs[2] + S + 160), Y_(A + 160 * t) - 4, '18°', CORAL, 'start', 12))
    for gi in (0, 1, 4):
        cx = xs[gi] + wa / 2
        o.append(f'<ellipse cx="{X_(cx):.1f}" cy="{Y_(X / 2):.1f}" rx="{wa / 2 * s:.1f}" ry="{(X / 2 + O) * s:.1f}" fill="none" stroke="{AZUL}" stroke-dasharray="3 3"/>')
    # espaços
    widths = [wd, wa, wl, wv, wa]
    for i in range(4):
        a_ = xs[i] + widths[i]; b_ = xs[i + 1]
        o.append(_mono(X_((a_ + b_) / 2), Y_(-70), str(ESPACO[i]), NOITE, 'middle', 10))
    o.append(_mono(X_(xs[2] + S / 2), Y_(-150), f'haste {S}', NOITE, 'middle', 10))
    o.append(f'<line x1="{X_(xs[2]):.1f}" y1="{Y_(-115):.1f}" x2="{X_(xs[2] + S):.1f}" y2="{Y_(-115):.1f}" stroke="{NOITE}"/>')
    o.append(_mono(left - 8, Hh - 14, 'unidades de desenho; módulo = meia haste (64). Números sob a linha de base: espaço entre letras.', AZUL, 'start', 10))
    o.append('</svg>')
    return ''.join(o)


# ------------------------------------------------------------------ PNG
SHOT_JS = r'''
const { chromium } = require('playwright');
(async () => {
  const jobs = JSON.parse(require('fs').readFileSync(process.argv[2], 'utf8'));
  const b = await chromium.launch();
  const p = await b.newPage();
  for (const j of jobs) {
    await p.setViewportSize({ width: j.w, height: j.h });
    await p.setContent(`<html><body style="margin:0;background:transparent">${j.svg.replace('<svg ', `<svg width="${j.w}" height="${j.h}" style="display:block" `)}</body></html>`);
    await p.screenshot({ path: j.out, omitBackground: true, clip: { x: 0, y: 0, width: j.w, height: j.h } });
  }
  await b.close();
})();
'''


def render_png(jobs):
    with tempfile.TemporaryDirectory() as tmp:
        js = os.path.join(tmp, 'shot.js'); jf = os.path.join(tmp, 'jobs.json')
        open(js, 'w').write(SHOT_JS); open(jf, 'w').write(json.dumps(jobs))
        subprocess.run(['node', js, jf], check=True)


def exportar():
    sv = os.path.join(OUT, 'svg'); pn = os.path.join(OUT, 'png')
    os.makedirs(sv, exist_ok=True); os.makedirs(pn, exist_ok=True)
    arquivos = {
        'dalva-wordmark-noite.svg': svg_wordmark(NOITE),
        'dalva-wordmark-branco.svg': svg_wordmark(BRANCO),
        'dalva-wordmark-preto.svg': svg_wordmark(PRETO),
        'dalva-wordmark-pequeno-noite.svg': svg_wordmark(NOITE, ESPACO_PEQUENO),
        'dalva-wordmark-pequeno-branco.svg': svg_wordmark(BRANCO, ESPACO_PEQUENO),
        'dalva-simbolo-noite.svg': svg_simbolo(NOITE),
        'dalva-simbolo-branco.svg': svg_simbolo(BRANCO),
        'dalva-simbolo-coral.svg': svg_simbolo(CORAL),
        'dalva-icone.svg': svg_icone(),
        'dalva-icone-quadrado.svg': svg_icone(raio=0),
        'dalva-icone-escuro.svg': svg_icone(bg=NOITE, ink=CORAL),
        'dalva-icone-mono.svg': svg_icone(ink=BRANCO, transparente=True),
        'favicon.svg': svg_favicon32(),
        'favicon-16.svg': svg_favicon16(),
        'grade-construcao.svg': svg_grade(),
        'area-de-protecao.svg': svg_protecao(),
    }
    for n, t in arquivos.items():
        open(os.path.join(sv, n), 'w').write(t + '\n')

    g, tot, _ = wordmark()
    ratio = tot / (A + O)
    jobs = []
    for h in (32, 64, 96):
        w = round(h * ratio)
        jobs += [dict(svg=svg_wordmark(NOITE), w=w, h=h, out=os.path.join(pn, f'dalva-wordmark-noite-{h}.png')),
                 dict(svg=svg_wordmark(BRANCO), w=w, h=h, out=os.path.join(pn, f'dalva-wordmark-branco-{h}.png'))]
    sq = svg_icone(raio=0)
    for n, z in [('icone-ios-1024', 1024), ('icone-play-512', 512), ('icone-pwa-192', 192), ('icone-pwa-512', 512), ('apple-touch-icon-180', 180), ('avatar-800', 800)]:
        jobs.append(dict(svg=sq, w=z, h=z, out=os.path.join(pn, f'{n}.png')))
    jobs.append(dict(svg=svg_icone(bg=NOITE, ink=CORAL, raio=0), w=1024, h=1024, out=os.path.join(pn, 'icone-ios-escuro-1024.png')))
    jobs.append(dict(svg=svg_icone(ink=BRANCO, transparente=True), w=1024, h=1024, out=os.path.join(pn, 'icone-ios-tingido-1024.png')))
    jobs.append(dict(svg=svg_icone(), w=512, h=512, out=os.path.join(pn, 'icone-arredondado-512.png')))
    # Android adaptativo: 432 px, área segura = círculo de 66/108 → símbolo menor
    jobs.append(dict(svg=svg_icone(ink=NOITE, transparente=True, fill=0.58 * 66 / 108 * 1.05), w=432, h=432, out=os.path.join(pn, 'android-adaptativo-frente-432.png')))
    jobs.append(dict(svg=svg_icone(ink=BRANCO, transparente=True, fill=0.58 * 66 / 108 * 1.05), w=432, h=432, out=os.path.join(pn, 'android-monocromatico-432.png')))
    jobs.append(dict(svg=f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 10 10"><rect width="10" height="10" fill="{CORAL}"/></svg>', w=432, h=432, out=os.path.join(pn, 'android-adaptativo-fundo-432.png')))
    jobs.append(dict(svg=svg_favicon32(), w=32, h=32, out=os.path.join(pn, 'favicon-32.png')))
    jobs.append(dict(svg=svg_icone(), w=48, h=48, out=os.path.join(pn, 'favicon-48.png')))
    render_png(jobs)
    f16 = favicon16(); f16.save(os.path.join(pn, 'favicon-16.png'))
    f32 = Image.open(os.path.join(pn, 'favicon-32.png')).convert('RGBA')
    f48 = Image.open(os.path.join(pn, 'favicon-48.png')).convert('RGBA')
    f48.save(os.path.join(OUT, 'favicon.ico'), sizes=[(16, 16), (32, 32), (48, 48)], append_images=[f16, f32])
    return arquivos, ratio


if __name__ == '__main__':
    arquivos, ratio = exportar()
    print('final/ pronto. proporção do wordmark:', round(ratio, 3))
