# Aplicações com fotos reais (Pexels, licença livre) e a marca sobreposta.
import os, base64
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'gen_brand.py')).read().replace("open(os.path.join(OUT, name), 'w').write(html)", "pass"))
PH = os.path.join(HERE, '..', 'photos')
def img(k):
    return 'data:image/jpeg;base64,' + base64.b64encode(open(os.path.join(PH, f'c{k}.jpg'), 'rb').read()).decode()

def owl(s, eye=NOITE, extra=''):
    return f'<svg viewBox="20 12 60 78" width="{s}" height="{int(s * 1.3)}" aria-hidden="true" style="display: block; {extra}">{sym_coruja(fg="#FFFFFF", eye=eye)}</svg>'

def tile(k, w, h, overlay, title, note):
    return f'''<figure style="margin: 0; display: flex; flex-direction: column; gap: 12px">
      <div style="position: relative; width: {w}px; height: {h}px; border-radius: 20px; overflow: hidden; background: #DDD url({img(k)}) center / cover no-repeat">{overlay}</div>
      <figcaption><p style="margin: 0; font-size: 16px; font-weight: 600">{title}</p><p style="margin: 3px 0 0; font-size: 14px; line-height: 1.45; color: {MUTE}">{note}</p></figcaption>
    </figure>'''

def at(x, y, inner, extra=''):
    return f'<div style="position: absolute; left: {x}%; top: {y}%; transform: translate(-50%, -50%); {extra}">{inner}</div>'

WM = lambda s, c, blend='': f'<p style="margin: 0; font-family: {DISPLAY}; font-size: {s}px; font-weight: 700; letter-spacing: -0.035em; color: {c}; white-space: nowrap; {blend}">Dalva</p>'
PRINT_DARK = 'mix-blend-mode: multiply; opacity: 0.92'
PRINT_LIGHT = 'opacity: 0.9; filter: blur(0.2px)'

a = tile('A', 840, 520, at(61.5, 55, f'<div style="display: flex; align-items: center; gap: 5px; {PRINT_DARK}">{icon("coruja", 18)}{WM(17, NOITE)}</div>'),
         'Camiseta clara', 'Assinatura pequena no peito, como etiqueta boa. É a do dia a dia do time.')
b = tile('B', 420, 520, at(48.5, 12.5, owl(42, eye="#15161C", extra="opacity: 0.8; filter: drop-shadow(0 1px 0 rgba(0,0,0,0.6))"), 'transform: translate(-50%, -50%) rotate(-6deg) skewX(-4deg)'),
         'Boné', 'Só a coruja, bordada. Sem nome: quem sabe, sabe.')
c = tile('C', 413, 420, at(37, 44, f'<div style="display: flex; flex-direction: column; align-items: center; gap: 8px; {PRINT_LIGHT}">{owl(30)}<p style="margin: 0; font-family: {DISPLAY}; font-size: 10px; font-weight: 700; line-height: 1.25; color: #FFFFFF; text-align: center">Prospecção que<br>acontece enquanto<br>você dorme.</p></div>'),
         'Camiseta escura', 'A coruja e a frase no peito. É a que puxa conversa em evento.')
d = tile('D', 413, 420, at(60, 44, f'<div style="{PRINT_LIGHT}">{WM(40, "#FFFFFF")}</div>')
         + f'<div style="position: absolute; left: 86%; top: 0; bottom: 0; width: 13px; background: linear-gradient(90deg, #D9602F, {CORAL} 40%, #E86A38); box-shadow: -2px 0 4px rgba(0,0,0,0.35), 2px 0 4px rgba(0,0,0,0.25)"></div>'
         + f'<p style="position: absolute; left: 30%; bottom: 9%; margin: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.14em; line-height: 1.7; color: rgba(255,255,255,0.7)">MAIS CONVERSAS.<br>MAIS NEGÓCIOS.</p>',
         'Caderno', 'Capa Noite, elástico coral. Ideia: brinde para os 15 do teste fechado.')
e = tile('E', 413, 420, at(50, 34, f'<div style="display: flex; align-items: center; gap: 7px; {PRINT_LIGHT}">{owl(22)}{WM(24, "#FFFFFF")}</div>'),
         'Vestida', 'Assinatura no centro, tamanho de bolso. Funciona em quem vende e em quem entrega.')

aplic = (header('Marca · aplicações', 'Onde a Dalva aparece.',
                'Mockups em fotos reais, com a opção 02 (Coruja) só para ver o jeito. Troca quando a gente escolher o logo.')
         + f'''
  <section style="display: flex; gap: 20px">{a}{b}</section>
  <section style="display: flex; gap: 20px">{c}{d}{e}</section>
  <p style="margin: -20px 0 0; font-size: 13px; color: {MUTE}">Fotos: Pexels (licença livre para uso comercial). Ideia, não arte final: bordado e serigrafia precisam de prova com fornecedor.</p>''')
open(os.path.join(OUT, 'Aplicacoes.dc.html'), 'w').write(page('Aplicações', 1440, 1400, aplic, bg=BRUMA))
print('ok')
