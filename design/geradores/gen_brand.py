# Capítulo 1 da Dalva: logos (Visoes), sistema de marca (Main) e aplicações (Aplicacoes).
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dalva import *

OUT = os.path.join(os.path.dirname(__file__), 'project')

def page(title, w, h, body, bg='#FFFFFF'):
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Dalva — {title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
{CSS}</style>
</helmet>
<div style="width: {w}px; min-height: {h}px; box-sizing: border-box; padding: 72px 80px; background: {bg}; color: {NOITE}; font-family: {SANS}; display: flex; flex-direction: column; gap: 44px">
{body}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{ return {{}}; }}
}}
</script>
</body>
</html>
'''

def header(kicker, h1, sub, right=''):
    r = f'<div style="max-width: 440px; font-size: 16px; line-height: 1.55; color: {MUTE}">{right}</div>' if right else ''
    return (f'''  <header style="display: flex; justify-content: space-between; align-items: flex-end; gap: 48px">
    <div style="display: flex; flex-direction: column; gap: 12px; max-width: 760px">
      <p style="margin: 0; font-size: 14px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: {MUTE}">{kicker}</p>
      <h1 style="margin: 0; font-size: 64px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.02">{h1}</h1>
      <p style="margin: 0; font-size: 20px; line-height: 1.45; color: {MUTE}">{sub}</p>
    </div>
    {r}
  </header>''')

files = {}

# ---------- Logos ----------
cards = ''
for i, k in enumerate(ORDER, 1):
    d = SYMS[k]
    cards += f'''    <article style="border: 1px solid {LINE}; border-radius: 24px; overflow: hidden; display: flex; flex-direction: column; background: #FFFFFF">
      <div style="background: {BRUMA}; height: 230px; display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 20px">
        {icon(k, 104)}
        <div style="display: flex; align-items: flex-end; gap: 14px">{icon(k, 44, light=True).replace('display: block', 'display: block; box-shadow: 0 0 0 1px ' + LINE + ', 0 4px 12px rgba(17,19,31,0.06); border-radius: 10px')}{icon(k, 32)}{icon(k, 16)}</div>
      </div>
      <div style="height: 92px; display: flex; align-items: center; justify-content: center; border-top: 1px solid {LINE}">{wordmark(k, 34)}</div>
      <div style="height: 76px; display: flex; align-items: center; justify-content: center; background: {NOITE}">{wordmark(k, 28, '#FFFFFF')}</div>
      <div style="padding: 22px 22px 24px; display: flex; flex-direction: column; gap: 10px; flex-grow: 1">
        <p style="margin: 0; font-size: 13px; font-weight: 600; color: {MUTE}">0{i}</p>
        <h2 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em">{d["nome"]}</h2>
        <p style="margin: 0; font-size: 15px; line-height: 1.5; color: {INK2}">{d["ideia"]}</p>
        <div style="margin-top: auto; padding-top: 12px; border-top: 1px solid {LINE}; display: flex; flex-direction: column; gap: 6px; font-size: 14px; line-height: 1.45">
          <p style="margin: 0"><span style="font-weight: 600">+</span> {d["pro"]}</p>
          <p style="margin: 0; color: {MUTE}"><span style="font-weight: 600">−</span> {d["contra"]}</p>
        </div>
      </div>
    </article>
'''
logos = (header('Marca · logo', 'Cinco caminhos. Nenhum risco.',
                'O mesmo jeito do Mr. Wolf: um símbolo geométrico, um nome forte e um único detalhe coral. Os três riscos saem, porque lembram a Claro.',
                f'<p style="margin: 0"><strong style="color: {NOITE}; font-weight: 600">Como ler.</strong> Ícone grande, ícone claro, 32 e 16 px. Embaixo, assinatura positiva e negativa.</p>'
                f'<p style="margin: 10px 0 0"><strong style="color: {NOITE}; font-weight: 600">Minha aposta.</strong> Coruja, se a gente quer o charme do lobo. Três do dia, se quer o produto na cara.</p>')
         + f'\n  <section style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px; flex-grow: 1">\n{cards}  </section>')
files['Visoes.dc.html'] = page('Cinco logos', 1440, 1180, logos)

exec(open(os.path.join(os.path.dirname(__file__), 'gen_brand2.py')).read())

for name, html in files.items():
    open(os.path.join(OUT, name), 'w').write(html)
print('ok', list(files))
