"""A pergunta da meta no ⌘K (web) e no campo Perguntar (celular), nos três estados, mais a ficha de regras.
Rodar de dentro de design/geradores:  python3 gen_meta.py
Dados de exemplo; a conta é a mesma nos três estados: chance por conversa x valor.
"""
import os, sys, json
sys.path.insert(0, os.path.dirname(__file__))
from follou import *
C = os.path.join(os.path.dirname(__file__), '..', 'canvas')
D_ = "'Archivo', 'IBM Plex Sans', system-ui, sans-serif"

# --- conta de exemplo -------------------------------------------------------
CONV = [('Acme', 4800, 70), ('Orbita', 2900, 60), ('Delta Log', 6100, 40), ('Vela Apps', 4000, 50), ('Bitfaz Software', 6500, 25), ('Serra Apps', 4800, 20)]
ESP = {n: v * p // 100 for n, v, p in CONV}           # valor esperado por conversa
PREV = sum(ESP.values())                               # 12.125
def brl(v): return 'R$ ' + f'{v:,}'.replace(',', '.')
assert PREV == 12125 and ESP['Acme'] == 3360 and ESP['Delta Log'] == 2440

def chip(txt, kind='hoje', size=13):
    bg, fg, dot = ('#EEE3DF', '#93402B', '<circle cx="4" cy="4" r="4" fill="#93402B"></circle>') if kind == 'atraso' else ('#E9E5DE', '#57524B', '<circle cx="4" cy="4" r="3" fill="none" stroke="#57524B" stroke-width="2"></circle>')
    return (f'<span style="height: 24px; box-sizing: border-box; padding: 0 8px; border-radius: 999px; background: {bg}; color: {fg}; display: inline-flex; align-items: center; gap: 6px; '
            f'font-size: {size}px; font-weight: 600; white-space: nowrap"><svg viewBox="0 0 8 8" width="8" height="8" aria-hidden="true">{dot}</svg>{txt}</span>')
def hip(size=13):
    return (f'<span style="height: 24px; box-sizing: border-box; padding: 0 8px; border-radius: 999px; border: 1px dashed #57524B; color: #57524B; display: inline-flex; align-items: center; '
            f'font-size: {size}px; font-weight: 600; white-space: nowrap">hipótese</span>')
def btn(txt, primary, h=44, full=False):
    st = ('background: #0E7038; color: #FAF9F7; border: 0' if primary else 'background: transparent; color: #1A1815; border: 1px solid #1A1815')
    w = 'width: 100%; justify-content: center; ' if full else ''
    return (f'<a href="#" style="{w}height: {h}px; box-sizing: border-box; padding: 0 20px; border-radius: 999px; {st}; text-decoration: none; display: inline-flex; align-items: center; gap: 8px; '
            f'font-size: 16px; font-weight: 600; white-space: nowrap">{txt}</a>')
def bar(prev, meta, w_label=13):
    top = max(prev, meta) * 1.12
    fp, fm = round(prev / top * 100, 1), round(meta / top * 100, 1)
    return (f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="position: relative; height: 16px">'
            f'<span style="position: absolute; left: 0; right: 0; top: 4px; height: 8px; background: #E9E5DE"></span>'
            f'<span style="position: absolute; left: 0; width: {fp}%; top: 4px; height: 8px; background: #1A1815"></span>'
            f'<span style="position: absolute; left: {fm}%; top: 0; width: 2px; height: 16px; background: #93402B"></span></div>'
            f'<div style="position: relative; height: {w_label + 5}px; font-size: {w_label}px; line-height: {w_label + 5}px; color: #57524B; font-variant-numeric: tabular-nums">'
            f'<span style="position: absolute; left: 0">previsão {brl(prev)}</span><span style="position: absolute; right: {100 - fm}%; text-align: right; white-space: nowrap; transform: translateX(0)">meta {brl(meta)}</span></div></div>')

ESTADOS = {
 'chega': dict(meta=10000, titulo='Chega, por R$ 2.125.', sub='Duas conversas sustentam a meta: sem Acme e Delta Log, a previsão cai para R$ 6.325.', rotulo='Para proteger a meta',
   passos=[('Ligar para a Acme', 'Parada há 6 dias · chance 70%', 'protege ' + brl(ESP['Acme']), ('Hoje, 10h', 'hoje'), 'Abrir a Acme', False),
           ('Cobrar o retorno da Delta Log', 'Proposta sem resposta do jurídico · chance 40%', 'protege ' + brl(ESP['Delta Log']), ('Atrasado 2 dias', 'atraso'), 'Abrir', False)]),
 'nao': dict(meta=15000, titulo='Não chega: faltam R$ 2.875.', sub='Duas ligações cobrem R$ 2.180. Os R$ 695 que sobram dependem de uma conversa nova.', rotulo='A rota para chegar mais perto',
   passos=[('Ligar para a Acme', 'Chance de 70% para 90%', '+ R$ 960', ('Hoje, 10h', 'hoje'), 'Abrir a Acme', True),
           ('Retomar a Delta Log', 'Chance de 40% para 60%', '+ R$ 1.220', ('Atrasado 2 dias', 'atraso'), 'Abrir', True),
           ('Ver as 12 empresas novas do seu perfil', 'Mesmo porte e setor dos três últimos que você fechou', 'não conta para novembro', None, 'Abrir', False)]),
}
FONTE = 'Cálculo: valor de cada conversa × a sua chance de fechar, 38% em média (12 negócios fechados ou perdidos, ago a out). Conversas lidas hoje 08:12.'
HIP = 'Hipótese: no seu histórico, resposta em até 24 horas fecha 20 pontos a mais.'

# --- peças web --------------------------------------------------------------
def passo_web(i, p, first):
    t, sub, ef, due, acao, h = p
    d = chip(due[0], due[1]) if due else ''
    return (f'<li style="min-height: 72px; box-sizing: border-box; padding: 12px 0; display: grid; grid-template-columns: 28px minmax(0, 1fr) auto auto; gap: 16px; align-items: center; border-top: {"0" if i == 0 else "1px solid #E9E5DE"}">'
            f'<span style="width: 28px; height: 28px; border-radius: 14px; background: #E9E5DE; color: #1A1815; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 600">{i + 1}</span>'
            f'<div style="min-width: 0"><p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">{t}</p><p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">{sub}</p></div>'
            f'<div style="display: flex; flex-direction: column; align-items: flex-end; gap: 4px"><span style="font-size: 16px; line-height: 22px; font-weight: 600; font-variant-numeric: tabular-nums">{ef}</span>{d}</div>'
            f'<div style="display: flex; align-items: center; gap: 8px">{hip() if h else ""}{btn(acao, first and i == 0)}</div></li>')

def palette_web(key):
    pal = ('background: #FAF9F7; border: 1px solid #E3DFD7; border-radius: 24px; box-shadow: 0 1px 2px rgba(16,15,15,0.06); overflow: hidden; display: flex; flex-direction: column')
    entrada = ('<div style="height: 64px; box-sizing: border-box; padding: 0 24px; display: flex; align-items: center; gap: 12px; border-bottom: 1px solid #E3DFD7">'
               '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#57524B" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.5 4.5"></path></svg>'
               '<span style="flex-grow: 1; font-size: 16px; line-height: 22px">Bato a meta de novembro?</span>'
               '<kbd style="min-width: 22px; height: 24px; box-sizing: border-box; padding: 0 6px; border-radius: 8px; background: #E9E5DE; color: #1A1815; font: inherit; font-size: 13px; font-weight: 600; display: inline-flex; align-items: center; justify-content: center">Enter</kbd></div>')
    rod = ('<div style="padding: 12px 24px; border-top: 1px solid #E3DFD7; display: flex; flex-wrap: wrap; justify-content: space-between; gap: 8px; font-size: 13px; line-height: 18px; color: #57524B">'
           '<span>Enter abre o primeiro passo · Esc fecha</span><span>Dados de exemplo</span></div>')
    if key == 'sem':
        corpo = ('<div style="padding: 24px; display: flex; flex-direction: column; gap: 20px">'
                 '<p style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 600; color: #57524B">Pergunta ao Follou · meta de novembro: R$ 10.000 · <a href="#" style="color: #1A1815">mudar</a></p>'
                 f'<h2 style="margin: 0; font-family: {D_}; font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.035em">Ainda não dá para dizer.</h2>'
                 '<p style="margin: 0; font-size: 16px; line-height: 22px; color: #1A1815">Para estimar a chance de cada conversa fechar, o Follou precisa de 10 negócios que você já fechou ou perdeu. Você marcou 3. Sem isso, qualquer previsão seria chute.</p>'
                 '<p style="margin: 0; font-size: 16px; line-height: 22px; color: #57524B; font-variant-numeric: tabular-nums">O que dá para afirmar: R$ 29.100 em 7 conversas abertas, sem chance atribuída.</p>'
                 '<div style="border-top: 1px solid #E9E5DE; padding-top: 16px; display: flex; flex-direction: column; gap: 12px"><p style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 600; color: #57524B">Para destravar</p>'
                 '<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column; gap: 12px">'
                 f'<li style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px"><div><p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">Marcar os negócios que você já fechou ou perdeu</p><p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">Faltam 7. Leva uns 3 minutos.</p></div>{btn("Marcar agora", True)}</li>'
                 f'<li style="display: flex; flex-wrap: wrap; align-items: center; justify-content: space-between; gap: 12px"><div><p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">Ler as conversas antigas do WhatsApp</p><p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">O Follou acha sozinho os que fecharam.</p></div>{btn("Conectar", False)}</li>'
                 '</ul></div></div>')
        return f'<div role="dialog" aria-label="Perguntar ao Follou" style="{pal}">{entrada}{corpo}{rod}</div>'
    e = ESTADOS[key]; first = (key == 'nao') or True
    num = (f'<div style="display: flex; flex-direction: column; gap: 12px">{bar(PREV, e["meta"])}</div>')
    passos = ''.join(passo_web(i, p, True) for i, p in enumerate(e['passos']))
    hipotese = f'<p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">{HIP}</p>' if key == 'nao' else ''
    corpo = ('<div style="padding: 24px; display: flex; flex-direction: column; gap: 20px">'
             '<p style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 600; color: #57524B">' + f'Pergunta ao Follou · meta de novembro: {brl(e["meta"])} · <a href="#" style="color: #1A1815">mudar</a></p>'
             f'<h2 style="margin: 0; font-family: {D_}; font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.035em">{e["titulo"]}</h2>'
             f'<p style="margin: 0; font-size: 16px; line-height: 22px; color: #1A1815">{e["sub"]}</p>{num}'
             f'<p style="margin: 0; font-size: 13px; line-height: 18px; color: #57524B">{FONTE} <a href="#" style="color: #1A1815; font-weight: 600">Ver a conta</a></p>'
             f'<div style="border-top: 1px solid #E9E5DE; padding-top: 16px"><p style="margin: 0 0 4px; font-size: 13px; line-height: 18px; font-weight: 600; color: #57524B">{e["rotulo"]}</p>'
             f'<ol style="list-style: none; margin: 0; padding: 0">{passos}</ol>{hipotese}</div></div>')
    return f'<div role="dialog" aria-label="Perguntar ao Follou" style="{pal}">{entrada}{corpo}{rod}</div>'

HEAD = lambda title, extra='': f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>{title}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
a:focus-visible,button:focus-visible{{outline:2px solid #0E7038;outline-offset:2px}}{extra}
</style>
</helmet>
'''
def foot(w, h):
    return f'''</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''

def web(key, nome, titulo):
    body = (f'<div style="position: relative; min-height: 900px; overflow: hidden; font-family: {SANS}; color: #1A1815">'
            '<dc-import name="Hoje" hint-size="100%,900px"></dc-import>'
            '<div style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(16,15,15,0.45)"></div>'
            f'<div style="position: absolute; left: 50%; top: 56px; width: min(680px, calc(100% - 32px)); transform: translateX(-50%)">{palette_web(key)}</div></div>\n')
    open(os.path.join(C, nome + '.dc.html'), 'w').write((HEAD(titulo) + body + foot(1440, 900)).replace('R$ ', 'R$\u00a0'))

# --- peças celular ----------------------------------------------------------
def passo_mob(i, p, first):
    t, sub, ef, due, acao, h = p
    d = chip(due[0], due[1], 12) if due else ''
    return (f'<li style="padding: 12px 0; border-top: {"0" if i == 0 else "1px solid #E9E5DE"}; display: flex; flex-direction: column; gap: 6px">'
            f'<div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px"><p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">{i + 1}. {t}</p>'
            f'<span style="font-size: 16px; line-height: 22px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap">{ef.replace("não conta para novembro", "dezembro")}</span></div>'
            f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 8px"><span style="font-size: 12px; line-height: 16px; color: #57524B">{sub}</span>{d}</div></li>')

def sheet_mob(key):
    base = ('position: absolute; left: 0; right: 0; bottom: 0; box-sizing: border-box; padding: 12px 16px 24px; background: #FAF9F7; border-radius: 24px 24px 0 0; '
            'border: 1px solid #E3DFD7; display: flex; flex-direction: column; gap: 16px')
    topo = ('<span aria-hidden="true" style="align-self: center; width: 36px; height: 4px; border-radius: 2px; background: #CFC9BF"></span>'
            '<div style="height: 44px; box-sizing: border-box; padding: 0 16px; border-radius: 22px; background: #E9E5DE; display: flex; align-items: center; gap: 8px">'
            '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="#57524B" stroke-width="2" stroke-linecap="round" aria-hidden="true"><circle cx="11" cy="11" r="6.5"></circle><path d="M16 16l4.5 4.5"></path></svg>'
            '<span style="font-size: 16px; line-height: 22px">Bato a meta de novembro?</span></div>')
    if key == 'sem':
        return (f'<section role="dialog" aria-label="Perguntar ao Follou" style="{base}">{topo}'
                '<p style="margin: 0; font-size: 12px; line-height: 16px; font-weight: 600; color: #57524B">Meta de novembro: R$ 10.000 · <a href="#" style="color: #1A1815">mudar</a></p>'
                f'<h2 style="margin: 0; font-family: {D_}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em">Ainda não dá para dizer.</h2>'
                '<p style="margin: 0; font-size: 16px; line-height: 22px">O Follou precisa de 10 negócios que você já fechou ou perdeu para estimar a chance de cada conversa. Você marcou 3.</p>'
                '<p style="margin: 0; font-size: 12px; line-height: 16px; color: #57524B; font-variant-numeric: tabular-nums">O que dá para afirmar: R$ 29.100 em 7 conversas abertas, sem chance atribuída.</p>'
                f'<div style="display: flex; flex-direction: column; gap: 8px">{btn("Marcar os 7 que faltam", True, 48, True)}{btn("Ler o WhatsApp antigo", False, 48, True)}</div>'
                '<p style="margin: 0; font-size: 12px; line-height: 16px; color: #57524B">Dados de exemplo.</p></section>')
    e = ESTADOS[key]
    passos = ''.join(passo_mob(i, p, True) for i, p in enumerate(e['passos']))
    prim = e['passos'][0][4]
    hip_ = f'<p style="margin: 0; font-size: 12px; line-height: 16px; color: #57524B">{HIP}</p>' if key == 'nao' else ''
    return (f'<section role="dialog" aria-label="Perguntar ao Follou" style="{base}">{topo}'
            f'<p style="margin: 0; font-size: 12px; line-height: 16px; font-weight: 600; color: #57524B">Meta de novembro: {brl(e["meta"])} · <a href="#" style="color: #1A1815">mudar</a></p>'
            f'<h2 style="margin: 0; font-family: {D_}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em">{e["titulo"]}</h2>'
            f'<p style="margin: 0; font-size: 16px; line-height: 22px">{e["sub"]}</p>{bar(PREV, e["meta"], 12)}'
            f'<div><p style="margin: 0 0 4px; font-size: 12px; line-height: 16px; font-weight: 600; color: #57524B">{e["rotulo"]}</p><ol style="list-style: none; margin: 0; padding: 0">{passos}</ol>{hip_}</div>'
            f'{btn(prim, True, 48, True)}'
            '<p style="margin: 0; font-size: 12px; line-height: 16px; color: #57524B">Previsão = valor × chance de fechar no seu histórico (38% em média, 12 negócios). Dados de exemplo.</p></section>')

def mob(key, nome, titulo):
    body = ('<div style="width: 390px; height: 844px; box-sizing: border-box; position: relative; overflow: hidden; font-family: ' + SANS + '; color: #1A1815">'
            '<dc-import name="HojeMobile" hint-size="390px,844px"></dc-import>'
            '<div style="position: absolute; left: 0; top: 0; right: 0; bottom: 0; background: rgba(16,15,15,0.45)"></div>'
            + sheet_mob(key) + '</div>\n')
    open(os.path.join(C, nome + '.dc.html'), 'w').write((HEAD(titulo) + body + foot(390, 844)).replace('R$ ', 'R$\u00a0'))

for key, n, t in [('chega', 'MetaChega', 'Follou — Meta: chega (web)'), ('nao', 'MetaNaoChega', 'Follou — Meta: não chega (web)'), ('sem', 'MetaSemDados', 'Follou — Meta: sem dados suficientes (web)')]:
    web(key, n, t)
for key, n, t in [('chega', 'MetaChegaMobile', 'Follou — Meta: chega (celular)'), ('nao', 'MetaNaoChegaMobile', 'Follou — Meta: não chega (celular)'), ('sem', 'MetaSemDadosMobile', 'Follou — Meta: sem dados suficientes (celular)')]:
    mob(key, n, t)
print('ok')
