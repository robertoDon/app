"""Arquivos do símbolo do Follou em design/logo/follou. Rodar de dentro de design/geradores."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from follou import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'logo', 'follou')
def svg(vb, body, bg=None):
    r = f'<rect width="100%" height="100%" fill="{bg}"/>' if bg else ''
    return f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="{vb}">{r}{body}</svg>\n'
def sym(c): return f'<g fill="{c}">{SYMBOL_PATHS.replace("></path>", "/>")}</g>'
files = {
    'simbolo-sinal.svg': svg(f'0 0 {SYMBOL_W} {SYMBOL_H}', sym(SINAL)),
    'simbolo-sinal-tinta.svg': svg(f'0 0 {SYMBOL_W} {SYMBOL_H}', sym(SINAL_TINTA)),
    'simbolo-neve.svg': svg(f'0 0 {SYMBOL_W} {SYMBOL_H}', sym(NEVE)),
    'simbolo-tinta.svg': svg(f'0 0 {SYMBOL_W} {SYMBOL_H}', sym(TINTA)),
    # ícone de app: símbolo no sinal sobre carvão, com respiro de 2 t
    'icone-app.svg': svg('-260 -330 1302 1302', sym(SINAL), CARVAO),
    # 16 px: glifo de traço único
    'favicon-16.svg': (f'<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 100"><rect width="100" height="100" fill="{CARVAO}"/>'
                       f'<path d="M24 6V58A16 16 0 0 0 40 74H66L90 50" fill="none" stroke="{SINAL}" stroke-width="15"/></svg>\n'),
}
for n, s in files.items():
    open(os.path.join(OUT, n), 'w').write(s)
print('\n'.join(files))
