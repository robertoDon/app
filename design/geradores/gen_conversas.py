"""Conversas (web): a lista que substitui o funil do Pipeline. Reaproveita a lateral do próprio arquivo.
Rodar de dentro de design/geradores:  python3 gen_conversas.py
"""
import os, re
P = os.path.join(os.path.dirname(__file__), '..', 'canvas', 'Conversas.dc.html')
s = open(P).read()
head = s[:s.index('  <main ')]
head = head.replace('family=IBM+Plex+Sans:wght@400;500;600&amp;display=swap', 'family=IBM+Plex+Sans:wght@400;500;600&amp;display=swap')
BOX = 'border-radius: 24px; background: #FAF9F7; border: 1px solid #E3DFD7; box-shadow: 0 1px 2px rgba(16,15,15,0.06)'
def chip(kind, txt):
    if kind == 'atraso':
        bg, fg, dot = '#EEE3DF', '#93402B', '<circle cx="4" cy="4" r="4" fill="#93402B"></circle>'
    else:
        bg, fg, dot = '#E9E5DE', '#57524B', '<circle cx="4" cy="4" r="3" fill="none" stroke="#57524B" stroke-width="2"></circle>'
    return (f'<span style="height: 24px; box-sizing: border-box; padding: 0 8px; border-radius: 999px; background: {bg}; color: {fg}; display: inline-flex; align-items: center; gap: 6px; '
            f'font-size: 13px; font-weight: 600; white-space: nowrap"><svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">{dot}</svg>{txt}</span>')
COLS = 'grid-template-columns: minmax(0, 1.2fr) minmax(0, 2fr) minmax(0, 1.2fr) 150px 96px'
def row(first, nome, sit, quando, passo, valor, kind=None, semvalor=False):
    tp = chip(kind, passo) if kind else f'<span style="font-size: 16px; line-height: 22px; font-variant-numeric: tabular-nums">{passo}</span>'
    vc = '#57524B' if semvalor else '#1A1815'
    bt = '' if first else 'border-top: 1px solid #E9E5DE; '
    return (f'<a class="cv-row" href="Conversa.dc.html" style="{bt}min-height: 64px; box-sizing: border-box; padding: 10px 24px; display: grid; {COLS}; gap: 16px; align-items: center; color: #1A1815; text-decoration: none; transition: background-color 150ms ease-out">'
            f'<span style="font-size: 16px; line-height: 22px; font-weight: 600">{nome}</span>'
            f'<span style="font-size: 16px; line-height: 22px">{sit}</span>'
            f'<span style="font-size: 13px; line-height: 18px; color: #57524B">{quando}</span>'
            f'<span>{tp}</span>'
            f'<span style="text-align: right; font-size: 16px; line-height: 22px; font-variant-numeric: tabular-nums; color: {vc}">{valor}</span></a>')
def th():
    cells = ['Empresa', 'Situação, lida da conversa', 'Último contato', 'Próximo passo', 'Valor']
    out = ''.join(f'<span style="font-size: 13px; line-height: 18px; font-weight: 600; color: #57524B; {"text-align: right" if c == "Valor" else ""}">{c}</span>' for c in cells)
    return f'<div style="padding: 12px 24px; display: grid; {COLS}; gap: 16px; border-bottom: 1px solid #E3DFD7">{out}</div>'
urg = [('Delta Log', 'Proposta enviada · cobrar o retorno do jurídico', 'WhatsApp · há 8 dias', 'Atrasado 2 dias', 'R$ 6.100', 'atraso'),
       ('Vela Apps', 'Proposta enviada · revisar o escopo', 'E-mail · ontem', 'Hoje, 16h', 'R$ 4.000', 'hoje')]
dia = [('Acme', 'Proposta enviada · reunião de fechamento marcada', 'WhatsApp · há 6 dias', 'ter 3/11, 15h', 'R$ 4.800', None),
       ('Orbita', 'Proposta enviada · aguardando resposta', 'E-mail · há 3 dias', 'seg 2/11', 'R$ 2.900', None),
       ('Bitfaz Software', 'Em conversa · caso de uso combinado', 'WhatsApp · ontem', 'sex 30/10', 'R$ 6.500', None),
       ('Serra Apps', 'Em conversa · demo marcada', 'E-mail · há 2 dias', 'qua 4/11', 'R$ 4.800', None),
       ('Nuvem Labs', 'Em conversa · follow-up depois da reunião de 17/10', 'WhatsApp · há 12 dias', 'seg 2/11', 'sem valor', None)]
def grupo(titulo, n, rows, ponto):
    r = ''.join(row(i == 0, *x[:5], kind=x[5], semvalor=(x[4] == 'sem valor')) for i, x in enumerate(rows))
    return (f'<section aria-label="{titulo}" style="display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; display: flex; align-items: center; gap: 8px; font-size: 16px; line-height: 22px; font-weight: 600">{ponto}{titulo} '
            f'<span style="color: #57524B; font-weight: 500; font-variant-numeric: tabular-nums">· {n}</span></h2>'
            f'<div style="{BOX}; overflow-x: auto"><div style="min-width: 820px">{th() if titulo.startswith("Precisa") else ""}{r}</div></div></section>')
barra = '<span aria-hidden="true" style="width: 10px; height: 2px; background: #2B2A28"></span>'
cheio = '<svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true"><circle cx="4" cy="4" r="4" fill="#93402B"></circle></svg>'
main = f'''  <main style="flex: 999 1 560px; min-width: 0; box-sizing: border-box; padding: 24px 32px 48px; display: flex; flex-direction: column; gap: 24px">
    <header style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
      <div>
        <h1 style="margin: 0; font-family: 'Archivo', 'IBM Plex Sans', system-ui, sans-serif; font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.035em">Conversas</h1>
        <p style="margin: 4px 0 0; font-size: 16px; line-height: 22px; color: #57524B; font-variant-numeric: tabular-nums">7 abertas · 2 precisam de você · lidas do WhatsApp e do e-mail, hoje 08:12</p>
      </div>
      <button type="button" class="pn-btn" style="height: 44px; box-sizing: border-box; padding: 0 12px 0 18px; border: 1px solid #1A1815; border-radius: 999px; background: #FAF9F7; color: #1A1815; font: inherit; font-size: 16px; font-weight: 600; display: inline-flex; align-items: center; gap: 8px; cursor: pointer">Nova conversa<kbd style="min-width: 22px; height: 24px; box-sizing: border-box; padding: 0 6px; border-radius: 8px; background: #E9E5DE; color: #1A1815; font: inherit; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center">N</kbd></button>
    </header>

    {grupo('Precisa de você', 2, urg, cheio)}
    {grupo('Em dia', 5, dia, barra)}

    <p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">Sem etapas para atualizar: o Follou lê a situação de cada conversa e muda a ordem sozinho. Quem não responde por 30 dias sai da lista e fica no histórico. Dados de exemplo.</p>
  </main>
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":1440,"height":900}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
head = head.replace('.pn-btn:hover{background:#E9E5DE}', '.pn-btn:hover{background:#E9E5DE}\n.cv-row:hover{background:#F4F1EC}')
open(P, 'w').write(head + main)
print('ok')
