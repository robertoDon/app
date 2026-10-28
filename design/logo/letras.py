"""Letras desenhadas para a marca Dalva.

Tudo é construído em unidades de fonte (y para cima, linha de base em 0) a partir de
retângulos e superelipses, e unido com operações booleanas (skia-pathops) para que
o SVG final tenha contornos limpos, sem sobreposição.
"""
import math
import pathops
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen

# Métricas (unidades)
X = 520      # altura de x
C = 700      # altura de caixa-alta
A = 742      # ascendente (d, l)
S = 128      # haste vertical
SC = 134     # espessura nas curvas (compensação ótica: curva parece mais fina)
H = 104      # espessura horizontal (topo/base das curvas)
O = 10       # overshoot das formas redondas
K = 0.60     # tensão da superelipse (0.5523 = círculo)

U, D_, I_, X_ = (pathops.PathOp.UNION, pathops.PathOp.DIFFERENCE,
                 pathops.PathOp.INTERSECTION, pathops.PathOp.XOR)


def path():
    return pathops.Path()


def rect(x0, y0, x1, y1):
    p = path(); pen = p.getPen()
    pen.moveTo((x0, y0)); pen.lineTo((x1, y0)); pen.lineTo((x1, y1)); pen.lineTo((x0, y1))
    pen.closePath()
    return p


def poly(pts):
    p = path(); pen = p.getPen()
    pen.moveTo(pts[0])
    for q in pts[1:]:
        pen.lineTo(q)
    pen.closePath()
    return p


def oval(cx, cy, rx, ry, k=K):
    p = path(); pen = p.getPen()
    pen.moveTo((cx + rx, cy))
    pen.curveTo((cx + rx, cy + k * ry), (cx + k * rx, cy + ry), (cx, cy + ry))
    pen.curveTo((cx - k * rx, cy + ry), (cx - rx, cy + k * ry), (cx - rx, cy))
    pen.curveTo((cx - rx, cy - k * ry), (cx - k * rx, cy - ry), (cx, cy - ry))
    pen.curveTo((cx + k * rx, cy - ry), (cx + rx, cy - k * ry), (cx + rx, cy))
    pen.closePath()
    return p


def op(a, b, kind):
    return pathops.op(a, b, kind)


def union(*ps):
    out = ps[0]
    for p in ps[1:]:
        out = op(out, p, U)
    return out


def halfplane(px, py, ang_deg, side=1, big=5000):
    """Semiplano à esquerda (side=1) da reta que passa por (px,py) com ângulo ang."""
    a = math.radians(ang_deg)
    dx, dy = math.cos(a), math.sin(a)
    nx, ny = -dy * side, dx * side
    p1 = (px - dx * big, py - dy * big)
    p2 = (px + dx * big, py + dy * big)
    return poly([p1, p2, (p2[0] + nx * big, p2[1] + ny * big), (p1[0] + nx * big, p1[1] + ny * big)])


def shift(p, dx, dy):
    out = path()
    p.draw(TransformPen(out.getPen(), (1, 0, 0, 1, dx, dy)))
    return out


def scale(p, s, cx=0, cy=0):
    out = path()
    p.draw(TransformPen(out.getPen(), (s, 0, 0, s, cx - s * cx, cy - s * cy)))
    return out


def svg_d(p, s=1.0, tx=0.0, ty=0.0):
    """Converte para 'd' de SVG (y para baixo): x' = s*x + tx, y' = ty - s*y."""
    pen = SVGPathPen(None, ntos=lambda v: ('%.2f' % v).rstrip('0').rstrip('.'))
    p.draw(TransformPen(pen, (s, 0, 0, -s, tx, ty)))
    return pen.getCommands()


# ---------------------------------------------------------------- glifos
# Cada glifo devolve (path, largura do desenho). Espaçamento é feito no compositor.

def g_bowl_stem(top, wa=556, cut=None, k=K):
    """Bojo + haste à direita: 'a' (top=X) e 'd' (top=A) são a mesma construção."""
    rx = wa / 2; cx = rx; cy = X / 2; ry = X / 2 + O
    outer = oval(cx, cy, rx, ry, k)
    stem = rect(wa - S, 0, wa, top)
    rxc = (2 * rx - S - SC) / 2
    cxc = SC + rxc
    counter = oval(cxc, cy, rxc, ry - H, k + 0.015)
    g = op(union(outer, stem), counter, D_)
    if cut is not None:   # corte do topo da haste num ângulo
        g = op(g, halfplane(wa - S, top, cut, side=1), D_) if cut else g
    return g, wa


def g_D(w=628, k=K):
    x1 = w; rx = 300; xs = x1 - rx; ry = C / 2
    p = path(); pen = p.getPen()
    pen.moveTo((0, 0)); pen.lineTo((0, C)); pen.lineTo((xs, C))
    pen.curveTo((xs + k * rx, C), (x1, ry + k * ry), (x1, ry))
    pen.curveTo((x1, ry - k * ry), (xs + k * rx, 0), (xs, 0))
    pen.closePath()
    # miolo
    x0i = S; x1i = x1 - SC; rxi = rx - SC + 6; xsi = x1i - rxi; ryi = (C - 2 * H) / 2
    q = path(); pn = q.getPen(); ki = k + 0.02
    pn.moveTo((x0i, H)); pn.lineTo((x0i, C - H)); pn.lineTo((xsi, C - H))
    pn.curveTo((xsi + ki * rxi, C - H), (x1i, ry + ki * ryi), (x1i, ry))
    pn.curveTo((x1i, ry - ki * ryi), (xsi + ki * rxi, H), (xsi, H))
    pn.closePath()
    return op(p, q, D_), w


def g_l(top=A):
    return rect(0, 0, S, top), S


def g_v(w=548, apex=150, top=X, trap=True):
    dx = w / 2 - apex / 2
    phi = math.atan2(dx, top)
    sd = (S - 4) / math.cos(phi)          # espessura horizontal que dá haste ótica igual a S
    yin = top - (w / 2 - sd) * (top / dx)  # forquilha interna
    if trap:   # forquilha achatada: abre a tinta no tamanho pequeno
        t = 14; m = (top - yin) / (w / 2 - sd); yt = yin + t * m
        inner = [(w / 2 - t, yt), (w / 2 + t, yt)]
    else:
        inner = [(w / 2, yin)]
    pts = [(0, top), (sd, top)] + inner + [(w - sd, top), (w, top), (w / 2 + apex / 2, 0), (w / 2 - apex / 2, 0)]
    return poly(pts), w


def g_L(w=480):
    return union(rect(0, 0, S, C), rect(0, 0, w, H + 4)), w


def g_Lambda(w=640, apex=146, top=C):
    """A sem barra (Λ) com ápice reto: espelho vertical do V."""
    v, _ = g_v(w, apex, top, trap=False)
    out = path()
    v.draw(TransformPen(out.getPen(), (1, 0, 0, -1, 0, top)))
    # forquilha interna achatada
    return out, w


def g_V(w=640, apex=146):
    return g_v(w, apex, C, trap=False)


def compose(glyphs):
    """glyphs: lista de (path, largura, espaço antes). Devolve (paths deslocados, largura total, x de cada glifo)."""
    x = 0; out = []; xs = []
    for p, w, gap in glyphs:
        x += gap
        xs.append(x)
        out.append(shift(p, x, 0))
        x += w
    return out, x, xs


def cut_top(g, x0, top, ang):
    """Corta o topo de uma haste (x0..x0+S) num ângulo; o canto direito fica na altura `top`."""
    t = math.tan(math.radians(ang))
    cutter = op(halfplane(x0, top - S * t, ang, 1), rect(x0 - 1, top - 400, x0 + S + 1, top + 400), I_)
    return op(g, cutter, D_)
