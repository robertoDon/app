"""As três direções da marca Dalva, montadas a partir de letras.py.

Cada direção devolve partes coloríveis por papel: 'ink' (texto) e 'acc' (o único acento).
"""
from letras import *

CORAL, NOITE, BRUMA, AMBAR, AZUL = '#FF7A45', '#11131F', '#F7F5F2', '#C77713', '#4E628F'
BRANCO = '#FFFFFF'


class Marca:
    """parts: lista de (path, papel). bbox em unidades (x0, y0, x1, y1), y para cima."""
    def __init__(self, parts, bbox, notes=None):
        self.parts, self.bbox, self.notes = parts, bbox, notes or {}


# ---------------------------------------------------------------- 1. Horizonte
# DALVA em caixa-alta. O primeiro A não tem barra (Λ); o último ganha a barra baixa,
# coral: a linha do horizonte onde a estrela-d'alva aparece. Os topos de Λ L V Λ
# desenham um perfil de serra; a barra é a primeira luz atrás dela.
HZ_BAR_Y = 150          # base da barra (≈ 1/5 da caixa-alta)
HZ_W = 652              # largura do Λ


def _hz_bar(x0, w=HZ_W, apex=150):
    hull = shift(poly([(0, 0), (w, 0), (w / 2 + apex / 2, C), (w / 2 - apex / 2, C)]), x0, 0)
    lam = shift(g_Lambda(w, apex)[0], x0, 0)
    b = op(shift(rect(0, HZ_BAR_Y, w, HZ_BAR_Y + H), x0, 0), hull, I_)
    return op(b, lam, D_)


def horizonte_wordmark():
    D, wD = g_D()
    Lm, wL = g_Lambda(HZ_W, 150)
    L, wLL = g_L(470)
    V, wV = g_V(HZ_W, 150)
    ps, tot, xs = compose([(D, wD, 0), (Lm, wL, 26), (L, wLL, 40), (V, wV, -62), (Lm, wL, -52)])
    bar = _hz_bar(xs[-1])
    parts = [(p, 'ink') for p in ps] + [(bar, 'acc')]
    return Marca(parts, (0, 0, tot, C), {'xs': xs, 'widths': [wD, wL, wLL, wV, wL], 'tot': tot})


def horizonte_simbolo():
    Lm, wL = g_Lambda(HZ_W, 150)
    return Marca([(Lm, 'ink'), (_hz_bar(0), 'acc')], (0, 0, wL, C))


# ---------------------------------------------------------------- 2. 18°
# dalva em caixa-baixa desenhada. Toda haste vertical termina num corte de 18°:
# o crepúsculo astronômico começa quando o sol está 18° abaixo do horizonte, a hora
# em que a Dalva termina o trabalho da noite. O 'd' e o 'a' são o mesmo desenho
# (bojo + haste), só muda a altura. Bases retas: o chão é o horizonte.
ANG = 18


def dezoito_wordmark():
    d, wd = g_bowl_stem(A)
    a, wa = g_bowl_stem(X)
    l, wl = g_l(A)
    v, wv = g_v()
    d = cut_top(d, wd - S, A, ANG)
    a = cut_top(a, wa - S, X, ANG)
    l = cut_top(l, 0, A, ANG)
    ps, tot, xs = compose([(d, wd, 0), (a, wa, 54), (l, wl, 88), (v, wv, 52), (a, wa, 24)])
    return Marca([(p, 'ink') for p in ps], (0, 0, tot, A), {'xs': xs, 'widths': [wd, wa, wl, wv, wa], 'tot': tot, 'wa': wa})


def dezoito_simbolo():
    d, wd = g_bowl_stem(A)
    d = cut_top(d, wd - S, A, ANG)
    return Marca([(d, 'ink')], (0, -O, wd, A))


# ---------------------------------------------------------------- 3. Acesa
# Dalva em caixa alta e baixa, como o favorito do David, mas sem nenhum elemento a
# mais: a palavra vai da noite ao dia e a última letra já está acesa.
def acesa_wordmark():
    D, wD = g_D()
    a, wa = g_bowl_stem(X)
    l, wl = g_l(A)
    v, wv = g_v()
    ps, tot, xs = compose([(D, wD, 0), (a, wa, 52), (l, wl, 90), (v, wv, 54), (a, wa, 26)])
    parts = [(p, 'ink') for p in ps[:-1]] + [(ps[-1], 'acc')]
    return Marca(parts, (0, 0, tot, A), {'xs': xs, 'widths': [wD, wa, wl, wv, wa], 'tot': tot, 'wa': wa})


def acesa_simbolo():
    a, wa = g_bowl_stem(X)
    return Marca([(a, 'acc')], (0, -O, wa, X + O))


DIRECOES = {
    'horizonte': dict(
        nome='Horizonte', wordmark=horizonte_wordmark, simbolo=horizonte_simbolo,
        icone=dict(bg=NOITE, ink=BRANCO, acc=CORAL, fill=0.54, dy=0.0),
        icone_claro=dict(bg=BRUMA, ink=NOITE, acc=CORAL, fill=0.54, dy=0.0),
    ),
    'dezoito': dict(
        nome='18°', wordmark=dezoito_wordmark, simbolo=dezoito_simbolo,
        icone=dict(bg=CORAL, ink=NOITE, acc=NOITE, fill=0.58, dy=0.0),
        icone_claro=dict(bg=NOITE, ink=CORAL, acc=CORAL, fill=0.58, dy=0.0),
    ),
    'acesa': dict(
        nome='Acesa', wordmark=acesa_wordmark, simbolo=acesa_simbolo,
        icone=dict(bg=NOITE, ink=CORAL, acc=CORAL, fill=0.50, dy=0.0),
        icone_claro=dict(bg=BRUMA, ink=CORAL, acc=CORAL, fill=0.50, dy=0.0),
    ),
}
