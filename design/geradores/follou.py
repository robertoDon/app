"""Marca Follou: tokens, símbolo e assinatura.

Fonte: PDF "Follou — Posicionamento de marca e naming" (outubro de 2026).
Os hexadecimais são os impressos na prancha 04 do manual. O símbolo foi medido
no arquivo final (prancha 38): haste 130, altura 502, largura 344, raio externo 225,
raio interno 95, segundo L deslocado em (437, 140).
"""

# Fundo escuro (o aplicativo)
CARVAO, NEVE, NEVE_MEDIA, NEVE_FRACA = '#100F0F', '#F4F1EC', '#C9C6C0', '#8A8782'
SINAL, ALERTA, FERRUGEM_FUNDO = '#3FD07F', '#E8865C', '#652E19'
# Fundo claro (site, documento, impresso)
PAPEL, TINTA, TINTA_MEDIA, TINTA_FRACA = '#FAF9F7', '#1A1815', '#57524B', '#6E675F'
SINAL_TINTA, ALERTA_TINTA = '#0E7038', '#93402B'

# Derivados (não estão no manual; saem do carvão, da neve e da tinta)
SUPERFICIE_ESCURA = '#1B1A19'   # carvão + 5% de neve
LINHA_ESCURA = '#2B2A28'        # carvão + 12% de neve
AREIA = '#E9E5DE'               # neve + 4% de tinta
LINHA_CLARA = '#E3DFD7'
ALERTA_TINTA_FUNDO = '#EEE3DF'  # alerta-tinta + 88% de papel

DISPLAY = "'Archivo', 'IBM Plex Sans', system-ui, sans-serif"
SANS = "'IBM Plex Sans', -apple-system, system-ui, sans-serif"
MONO = "'IBM Plex Mono', ui-monospace, monospace"
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&amp;'
         'family=IBM+Plex+Sans:wght@400;500;600;700&amp;family=IBM+Plex+Mono:wght@400;500&amp;display=swap">')

# Símbolo: dois L, cada um com haste reta e quarto de círculo no canto; o vão nunca fecha.
SYMBOL_W, SYMBOL_H = 782, 641
_L = 'M0 0H130V277A95 95 0 0 0 225 372H344V502H225A225 225 0 0 1 0 277Z'
SYMBOL_PATHS = f'<path d="{_L}"></path><path transform="translate(437 140)" d="{_L}"></path>'


def symbol(h, color=SINAL, label=None):
    """Só o símbolo, com altura h em px."""
    w = round(h * SYMBOL_W / SYMBOL_H, 2)
    a = f'role="img" aria-label="{label}"' if label else 'aria-hidden="true"'
    return (f'<svg viewBox="0 0 {SYMBOL_W} {SYMBOL_H}" width="{w}" height="{h}" {a} fill="{color}" '
            f'style="display: block; flex-shrink: 0">{SYMBOL_PATHS}</svg>')


def single(h, color=SINAL):
    """Glifo de traço único (variante de 16 px): L com ponta final subindo a 45 graus."""
    return (f'<svg viewBox="0 0 100 100" width="{h}" height="{h}" aria-hidden="true" fill="none" stroke="{color}" '
            f'stroke-width="15" style="display: block; flex-shrink: 0"><path d="M24 6V58A16 16 0 0 0 40 74H66L90 50"></path></svg>')


def lockup(h, text=NEVE, sym=SINAL, label='Follou'):
    """Assinatura horizontal. h = altura do símbolo em px; o logotipo é Archivo SemiBold, entressaca -0,02 em."""
    f = round(h * 1.28, 2)
    gap = round(h * 0.36, 2)
    return (f'<span role="img" aria-label="{label}" style="display: inline-flex; align-items: center; gap: {gap}px; '
            f'white-space: nowrap; flex-shrink: 0">{symbol(h, sym)}'
            f'<span aria-hidden="true" style="font-family: {DISPLAY}; font-weight: 600; font-size: {f}px; line-height: 1; '
            f'letter-spacing: -0.02em; color: {text}">Follou</span></span>')


def wordmark(f, color=NEVE):
    return (f'<span style="font-family: {DISPLAY}; font-weight: 600; font-size: {f}px; line-height: 1; '
            f'letter-spacing: -0.02em; color: {color}">Follou</span>')
