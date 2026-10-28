"""Saída SVG: wordmark, ícone, grade de construção."""
import math
from letras import svg_d, X, C, A, S, SC, H, O
from direcoes import CORAL, NOITE, BRUMA, AZUL, BRANCO


def marca_paths(m, colors, s, tx, ty):
    return ''.join(f'<path d="{svg_d(p, s, tx, ty)}" fill="{colors[role]}"/>' for p, role in m.parts)


def wordmark_svg(m, ink, acc, height=None, pad=0.0, bg=None, units_h=None):
    """SVG da marca com viewBox justo (mais `pad` × altura de caixa em volta). height = altura em px."""
    x0, y0, x1, y1 = m.bbox
    y0 -= O; y1 += O
    p = pad * (y1 - y0)
    vb = (x0 - p, -(y1 + p), (x1 - x0) + 2 * p, (y1 - y0) + 2 * p)
    body = ''.join(f'<path d="{svg_d(q, 1, 0, 0)}" fill="{ {"ink": ink, "acc": acc}[r] }"/>' for q, r in m.parts)
    bgr = f'<rect x="{vb[0]}" y="{vb[1]}" width="{vb[2]}" height="{vb[3]}" fill="{bg}"/>' if bg else ''
    hw = ''
    if height:
        hw = f' height="{height}" width="{height * vb[2] / vb[3]:.1f}"'
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb[0]:.0f} {vb[1]:.0f} {vb[2]:.0f} {vb[3]:.0f}"{hw}'
            f' role="img" aria-label="Dalva">{bgr}{body}</svg>')


def icone_svg(m, spec, size=None, radius=0.2237, mask=True):
    """Ícone de app 1024×1024 com a forma centralizada oticamente."""
    N = 1024
    x0, y0, x1, y1 = m.bbox
    w, h = x1 - x0, y1 - y0
    s = N * spec['fill'] / max(w, h)
    tx = N / 2 - s * (x0 + w / 2)
    ty = N / 2 + s * (y0 + h / 2) + spec.get('dy', 0) * N
    colors = {'ink': spec['ink'], 'acc': spec['acc']}
    body = marca_paths(m, colors, s, tx, ty)
    r = f' rx="{N * radius:.0f}"' if mask else ''
    sz = f' width="{size}" height="{size}"' if size else ''
    return (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {N} {N}"{sz} role="img" aria-label="Dalva">'
            f'<rect width="{N}" height="{N}"{r} fill="{spec["bg"]}"/>{body}</svg>')


def _line(x1, y1, x2, y2, c=AZUL, w=1, dash=None, op=1):
    d = f' stroke-dasharray="{dash}"' if dash else ''
    return f'<line x1="{x1:.1f}" y1="{y1:.1f}" x2="{x2:.1f}" y2="{y2:.1f}" stroke="{c}" stroke-width="{w}"{d} opacity="{op}"/>'


def _txt(x, y, t, c=AZUL, anchor='start', size=11):
    return (f'<text x="{x:.1f}" y="{y:.1f}" fill="{c}" font-family="IBM Plex Mono, ui-monospace, monospace" '
            f'font-size="{size}" text-anchor="{anchor}" letter-spacing=".02em">{t}</text>')


def grade_svg(key, m, W=1080):
    """Grade de construção: métricas, módulos e o gesto de cada direção."""
    x0, y0, x1, y1 = m.bbox
    top_u = max(A, y1) + 40
    left, right, top, bottom = 150, 40, 46, 64
    s = (W - left - right) / (x1 - x0)
    Hh = top + bottom + (top_u + 40) * s
    tx = left - x0 * s
    ty = top + top_u * s

    def Y(u): return ty - u * s
    def Xp(u): return tx + u * s

    out = [f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 {W} {Hh:.0f}" role="img" aria-label="Grade de construção">',
           f'<rect width="{W}" height="{Hh:.0f}" fill="{BRUMA}"/>']
    # módulo de fundo: quadriculado de S/2
    step = S / 2 * s
    gx = tx
    while gx > 0: gx -= step
    while gx < left - 8: gx += step
    while gx < W - right + 10:
        out.append(_line(gx, top - 10, gx, Hh - bottom + 10, AZUL, 0.5, op=0.13)); gx += step
    gy = Y(0)
    while gy > top - 10: gy -= step
    while gy < Hh - bottom + 10:
        out.append(_line(left - 8, gy, W - right + 10, gy, AZUL, 0.5, op=0.13)); gy += step
    # métricas
    metrics = [(0, 'linha de base 0'), (X, f'altura-x {X}')]
    if key == 'horizonte':
        metrics = [(0, 'linha de base 0'), (C, f'caixa-alta {C}'), (150, 'horizonte'), (150 + H, '')]
    else:
        metrics.append((A, f'ascendente {A}'))
        if key == 'acesa':
            metrics.append((C, f'caixa-alta {C}'))
    for u, lab in metrics:
        col = CORAL if key == 'horizonte' and u in (150, 150 + H) else AZUL
        out.append(_line(left - 8, Y(u), W - right + 10, Y(u), col, 1, dash='4 4' if col == CORAL else None, op=0.9))
        if lab:
            out.append(_txt(left - 14, Y(u) + 3.5, lab, col, 'end', 10))
    # glifos em contorno
    for p, role in m.parts:
        fill = '#F3D9CC' if role == 'acc' else '#E4E1EA'
        stroke = CORAL if role == 'acc' else NOITE
        out.append(f'<path d="{svg_d(p, s, tx, ty)}" fill="{fill}" stroke="{stroke}" stroke-width="1.2"/>')
    xs = m.notes.get('xs', [])
    ws = m.notes.get('widths', [])
    # gesto de cada direção
    if key in ('dezoito', 'acesa'):
        wa = m.notes['wa']
        bowl_glyphs = [0, 1, 4] if key == 'dezoito' else [1, 4]
        for gi in bowl_glyphs:
            gx0 = xs[gi]
            cx = gx0 + wa / 2; cy = X / 2
            rx = wa / 2; ry = X / 2 + O
            out.append(f'<ellipse cx="{Xp(cx):.1f}" cy="{Y(cy):.1f}" rx="{rx * s:.1f}" ry="{ry * s:.1f}" fill="none" stroke="{AZUL}" stroke-width="1" stroke-dasharray="3 3"/>')
            out.append(_line(Xp(cx), Y(cy) - 4, Xp(cx), Y(cy) + 4, AZUL, 1))
            out.append(_line(Xp(cx) - 4, Y(cy), Xp(cx) + 4, Y(cy), AZUL, 1))
    if key == 'dezoito':
        t = math.tan(math.radians(18))
        # reta de corte prolongada em cada haste
        stems = [(xs[0] + ws[0] - S, A), (xs[1] + ws[1] - S, X), (xs[2], A), (xs[4] + ws[4] - S, X)]
        for sx, top_ in stems:
            xa, xb = sx - 150, sx + S + 150
            ya = top_ - S * t - 150 * t; yb = top_ + 150 * t
            out.append(_line(Xp(xa), Y(ya), Xp(xb), Y(yb), CORAL, 1, dash='5 3'))
        sx, top_ = stems[2]
        out.append(_txt(Xp(sx + S + 160), Y(top_ + 160 * t) - 4, '18°', CORAL, 'start', 12))
        # haste
        sx = xs[2]
        out.append(_line(Xp(sx), Y(-60), Xp(sx + S), Y(-60), NOITE, 1))
        out.append(_txt(Xp(sx + S / 2), Y(-60) + 16, f'haste {S}', NOITE, 'middle', 10))
    if key == 'acesa':
        sx = xs[2]
        out.append(_line(Xp(sx), Y(-60), Xp(sx + S), Y(-60), NOITE, 1))
        out.append(_txt(Xp(sx + S / 2), Y(-60) + 16, f'haste {S}', NOITE, 'middle', 10))
        # espaço ótico: áreas iguais entre letras
        for i in range(4):
            a_ = xs[i] + ws[i]; b_ = xs[i + 1]
            out.append(f'<rect x="{Xp(a_):.1f}" y="{Y(X):.1f}" width="{(b_ - a_) * s:.1f}" height="{X * s:.1f}" fill="{AZUL}" opacity=".10"/>')
        out.append(_txt(Xp(xs[4] + ws[4] / 2), Y(A) + 2, 'a acesa', CORAL, 'middle', 11))
    if key == 'horizonte':
        # diagonais e ápices
        for gi in (1, 3, 4):
            gx0 = xs[gi]; w = ws[gi]
            out.append(_line(Xp(gx0 + w / 2), Y(-40), Xp(gx0 + w / 2), Y(C + 40), AZUL, 1, dash='2 4'))
        sx = xs[0]
        out.append(_line(Xp(sx), Y(-60), Xp(sx + S), Y(-60), NOITE, 1))
        out.append(_txt(Xp(sx + S / 2), Y(-60) + 16, f'haste {S}', NOITE, 'middle', 10))
    out.append(_txt(left - 8, Hh - 18, 'unidades: 1 módulo = meia haste (64). Curvas: superelipse k = 0,60.', AZUL, 'start', 10))
    out.append('</svg>')
    return ''.join(out)


HZ_BAR_Y = 150
