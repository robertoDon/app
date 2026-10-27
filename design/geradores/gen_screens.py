# Gera as telas que faltam do Capítulo 2 (web + celular de cada módulo).
import os
OUT = os.path.join(os.path.dirname(__file__), 'project')
R = '#D7263D'

WOLF = ('<svg viewBox="0 0 100 100" width="{s}" height="{s}" aria-hidden="true"><g transform="translate(14 4) scale(0.72)" stroke-linejoin="round">'
        '<path d="M50 88 L36 78 L16 64 L24 54 L20 14 L40 32 L60 32 L80 14 L76 54 L84 64 L64 78 Z" fill="#FFFFFF" stroke="#FFFFFF" stroke-width="10"></path>'
        '<g><circle cx="36" cy="51" r="5.5" fill="#1D1D1F"></circle><circle cx="64" cy="51" r="5.5" fill="#1D1D1F"></circle></g></g>'
        '<g><g transform="translate(50 80) scale(1.1)" fill="#D7263D" stroke="#D7263D" stroke-width="3" stroke-linejoin="round">'
        '<path d="M-14 -6 L-3 0 L-14 6 Z"></path><path d="M14 -6 L3 0 L14 6 Z"></path><rect x="-4" y="-3" width="8" height="6" rx="2"></rect></g></g></svg>')
TIE = ('<svg viewBox="0 0 30 14" style="display: inline-block; width: 0.4em; height: 0.19em; margin: 0 0.03em; vertical-align: 0" aria-hidden="true">'
       '<g fill="#D7263D" stroke="#D7263D" stroke-width="2" stroke-linejoin="round"><path d="M2 1.5 L13 7 L2 12.5 Z"></path><path d="M28 1.5 L17 7 L28 12.5 Z"></path>'
       '<rect x="12" y="4.5" width="6" height="5" rx="1.5"></rect></g></svg>')

HEAD = '''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Mr. Wolf — %s</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&amp;display=swap">
<style>
body{margin:0}
a{color:#1D1D1F}a:hover{color:#D7263D}
</style>
</helmet>
'''
TAIL = '''</x-dc>
<script type="text/x-dc" data-dc-script data-props='{"$preview":{"width":%d,"height":%d}}'>
class Component extends DCLogic {
  renderVals() { return {}; }
}
</script>
</body>
</html>
'''

WEB_NAV = [('Hoje', 'HojeWeb.dc.html'), ('Pipeline', 'Pipeline.dc.html'), ('Caçada', 'Cacada.dc.html'),
           ('Projetos', 'Projetos.dc.html'), ('Contatos', 'Contatos.dc.html'), ('Grana', 'Grana.dc.html')]

def sidebar(active):
    links = ''
    for name, href in WEB_NAV:
        if name == active:
            links += f'    <a href="#" style="padding: 10px 12px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 600; background: #FFFFFF; color: #1D1D1F; box-shadow: 0 1px 2px rgba(0,0,0,0.05)">{name}</a>\n'
        else:
            links += f'    <a href="{href}" style="padding: 10px 12px; border-radius: 10px; text-decoration: none; font-size: 15px; font-weight: 500; color: #3C3B3A">{name}</a>\n'
    return f'''  <aside style="flex: 1 1 220px; max-width: 260px; box-sizing: border-box; padding: 28px 16px; display: flex; flex-direction: column; gap: 4px">
    <div style="display: flex; align-items: center; gap: 10px; padding: 0 12px 24px">
      <div style="width: 32px; height: 32px; border-radius: 9px; background: #1D1D1F; display: flex; align-items: center; justify-content: center">{WOLF.format(s=20)}</div>
      <p style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.04em">mr{TIE}wolf</p>
    </div>
{links}  </aside>
'''

def web(title, active, header, body):
    return (HEAD % title + '<div style="min-height: 900px; background: #F5F5F7; color: #1D1D1F; font-family: \'Inter\', -apple-system, system-ui, sans-serif; display: flex; flex-wrap: wrap">\n'
            + sidebar(active)
            + '  <main style="flex: 999 1 560px; min-width: 0; box-sizing: border-box; padding: 28px 32px 40px; display: flex; flex-direction: column; gap: 20px">\n'
            + header + body + '  </main>\n</div>\n' + TAIL % (1440, 900))

def web_header(h1, sub, buttons=''):
    return f'''    <header style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
      <div>
        <h1 style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.035em">{h1}</h1>
        <p style="margin: 4px 0 0; font-size: 15px; color: #6E6E73">{sub}</p>
      </div>
      <div style="display: flex; gap: 10px; flex-wrap: wrap">{buttons}</div>
    </header>
'''

def btn(label, kind='dark'):
    bg, fg = {'dark': ('#1D1D1F', '#FFFFFF'), 'red': (R, '#FFFFFF'), 'soft': ('#FFFFFF', '#1D1D1F')}[kind]
    return f'<button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: {fg}; background: {bg}; border: 0; border-radius: 999px; padding: 12px 20px; min-height: 44px; cursor: pointer">{label}</button>'

CARD = 'background: #FFFFFF; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)'
PILL = {'late': ('#FDE7EA', '#A81B2E'), 'today': ('#FFF1DB', '#8A5300'), 'calm': ('#F2F2F5', '#3C3B3A')}

def pill(t, k):
    bg, fg = PILL[k]
    return f'<span style="font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 999px; background: {bg}; color: {fg}; white-space: nowrap">{t}</span>'

def label(t, m='0 0 8px'):
    return f'<p style="margin: {m}; font-size: 13px; font-weight: 600; color: #6E6E73">{t}</p>'

# ---------- celular ----------
TABS = [
    ('Hoje', '<circle cx="12" cy="12" r="4"></circle><path d="M12 2v3M12 19v3M2 12h3M19 12h3"></path>'),
    ('Pipeline', '<rect x="3" y="4" width="5" height="16" rx="1.5"></rect><rect x="10" y="4" width="5" height="11" rx="1.5"></rect><rect x="17" y="4" width="4" height="7" rx="1.5"></rect>'),
    ('Caçada', '<circle cx="12" cy="12" r="8"></circle><path d="M12 1v6M12 17v6M1 12h6M17 12h6"></path>'),
    ('Projetos', '<rect x="3" y="5" width="18" height="15" rx="3"></rect><path d="M3 10h18M8 3v4M16 3v4M7.5 14.5l2 2 4-4"></path>'),
    ('Grana', '<path d="M4 20V12M10 20V6M16 20v-9M22 20H2"></path>'),
]

def tabbar(active):
    out = '  <nav style="position: absolute; left: 0; right: 0; bottom: 0; height: 84px; box-sizing: border-box; padding: 10px 8px 24px; background: rgba(255,255,255,0.92); border-top: 1px solid rgba(0,0,0,0.08); display: flex; justify-content: space-around" aria-label="Navegação">\n'
    for name, icon in TABS:
        on = name == active
        out += (f'    <a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 4px; text-decoration: none; color: {"#1D1D1F" if on else "#8E8E93"}; font-size: 11px; font-weight: {600 if on else 500}; min-width: 56px">'
                f'<svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" aria-hidden="true">{icon}</svg>{name}</a>\n')
    return out + '  </nav>\n'

def phone(title, active, body):
    return (HEAD % title + '<div style="width: 390px; height: 844px; box-sizing: border-box; background: #F5F5F7; color: #1D1D1F; font-family: \'Inter\', -apple-system, system-ui, sans-serif; display: flex; flex-direction: column; position: relative; overflow: hidden">\n'
            + body + tabbar(active) + '</div>\n' + TAIL % (390, 844))

def phone_header(kicker, h1, right=''):
    return f'''  <div style="padding: 56px 20px 0; display: flex; justify-content: space-between; align-items: center; gap: 12px">
    <div>
      <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">{kicker}</p>
      <h1 style="margin: 2px 0 0; font-size: 32px; font-weight: 700; letter-spacing: -0.035em">{h1}</h1>
    </div>
    {right}
  </div>
'''

FAB = f'  <button type="button" aria-label="{{}}" style="position: absolute; right: 20px; bottom: 100px; width: 56px; height: 56px; border-radius: 28px; border: 0; background: #1D1D1F; color: #FFFFFF; font-size: 28px; font-weight: 400; line-height: 1; box-shadow: 0 8px 24px rgba(0,0,0,0.2); cursor: pointer">+</button>\n'

def bar(pct, color='#1D1D1F', h=6):
    return f'<div style="height: {h}px; border-radius: {h//2}px; background: #EDEDF0; overflow: hidden"><div style="width: {pct}%; height: {h}px; background: {color}"></div></div>'

files = {}

# ===== HOJE WEB =====
tasks = [('Ligar para a Acme', 'Proposta · R$ 4.800', '6 dias', 'late', 'Ligar'),
         ('Follow-up Nuvem Labs', 'Conversa · Ana Ribeiro', 'atrasado', 'late', 'Escrever'),
         ('Enviar proposta Orbita', 'Proposta · R$ 2.900', 'hoje', 'today', 'Abrir'),
         ('Revisar caçada: SaaS em SC', '38 empresas novas', 'quando der', 'calm', 'Revisar')]
rows = ''
for t, who, tag, k, act in tasks:
    rows += f'''        <div style="display: flex; align-items: center; gap: 14px; padding: 14px 20px; border-top: 1px solid rgba(0,0,0,0.06)">
          <span style="width: 22px; height: 22px; border-radius: 11px; border: 2px solid #C7C7CC; box-sizing: border-box; flex-shrink: 0"></span>
          <div style="flex-grow: 1; min-width: 0"><p style="margin: 0; font-size: 15px; font-weight: 500">{t}</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">{who}</p></div>
          {pill(tag, k)}
          <button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: #1D1D1F; background: #F2F2F5; border: 0; border-radius: 999px; padding: 8px 14px; min-height: 36px; cursor: pointer">{act}</button>
        </div>
'''
agenda = [('10:00', 'Ligar para a Acme', 'Mr. Wolf te lembra 10 min antes'), ('14:30', 'Aprovar layout Grão', 'Projeto · Bia'), ('17:00', 'Mandar proposta Orbita', 'Prazo de hoje')]
ag = ''.join(f'<div style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid rgba(0,0,0,0.06)"><span style="width: 44px; font-size: 13px; font-weight: 600; color: #6E6E73">{h}</span><div><p style="margin: 0; font-size: 14px; font-weight: 500">{t}</p><p style="margin: 2px 0 0; font-size: 12px; color: #6E6E73">{s}</p></div></div>' for h, t, s in agenda)
body = f'''    <div style="display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 20px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="background: {R}; color: #FFFFFF; border-radius: 20px; padding: 20px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px">
          <div><p style="margin: 0; font-size: 13px; font-weight: 600; opacity: 0.9">Mr. Wolf diz</p><p style="margin: 4px 0 0; font-size: 20px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.35">A proposta da Acme tá parada há 6 dias. Liga hoje às 10h, eu te lembro.</p></div>
          <button type="button" style="flex-shrink: 0; font: inherit; font-size: 14px; font-weight: 600; color: {R}; background: #FFFFFF; border: 0; border-radius: 999px; padding: 10px 18px; min-height: 40px; cursor: pointer">Ver negócio</button>
        </div>
        <section style="{CARD}; overflow: hidden">
          <div style="display: flex; justify-content: space-between; align-items: center; padding: 16px 20px"><p style="margin: 0; font-size: 15px; font-weight: 600">Pra resolver hoje <span style="color: #6E6E73; font-weight: 500">4</span></p><span style="font-size: 13px; color: #6E6E73">2 atrasadas</span></div>
{rows}        </section>
        <section style="{CARD}; padding: 16px 20px">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Entregas dos projetos esta semana</p>
          <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px; padding-top: 10px">
            <div><p style="margin: 0; font-size: 12px; font-weight: 600; color: #A81B2E">atrasada desde 23/10</p><p style="margin: 4px 0 0; font-size: 14px; font-weight: 500">Ambiente de testes Kora</p></div>
            <div><p style="margin: 0; font-size: 12px; font-weight: 600; color: #6E6E73">hoje</p><p style="margin: 4px 0 0; font-size: 14px; font-weight: 500">Aprovar layout Grão</p></div>
            <div><p style="margin: 0; font-size: 12px; font-weight: 600; color: #6E6E73">sex</p><p style="margin: 4px 0 0; font-size: 14px; font-weight: 500">Telas do onboarding Lumen</p></div>
            <div><p style="margin: 0; font-size: 12px; font-weight: 600; color: #6E6E73">seg 2/11</p><p style="margin: 4px 0 0; font-size: 14px; font-weight: 500">Kickoff Faro</p></div>
          </div>
        </section>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 20px; display: flex; align-items: center; gap: 18px">
          <svg viewBox="0 0 120 120" width="104" height="104" role="img" aria-label="Meta do mês: 62% atingida"><circle cx="60" cy="60" r="50" fill="none" stroke="#EDEDF0" stroke-width="14"></circle><circle cx="60" cy="60" r="50" fill="none" stroke="#1D1D1F" stroke-width="14" stroke-linecap="round" stroke-dasharray="194.8 314.2" transform="rotate(-90 60 60)"></circle><text x="60" y="66" text-anchor="middle" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="#1D1D1F">62%</text></svg>
          <div style="display: flex; flex-direction: column; gap: 4px"><p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Meta de outubro</p><p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.03em">R$ 12.400</p><p style="margin: 0; font-size: 13px; color: #6E6E73">de R$ 20.000 · faltam 5 dias</p></div>
        </section>
        <section style="{CARD}; padding: 16px 20px">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Agenda de hoje</p>
          {ag}
        </section>
        <section style="background: #1D1D1F; color: #F5F5F7; border-radius: 20px; padding: 20px; display: flex; flex-direction: column; gap: 10px">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #A1A1A6">Caçada da semana</p>
          <p style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3">38 empresas novas de SaaS em SC esperando você.</p>
          <div><button type="button" style="font: inherit; font-size: 14px; font-weight: 600; color: #1D1D1F; background: #FFFFFF; border: 0; border-radius: 999px; padding: 10px 18px; min-height: 40px; cursor: pointer">Revisar lista</button></div>
        </section>
      </div>
    </div>
'''
files['HojeWeb.dc.html'] = web('Hoje (web)', 'Hoje', web_header('Hoje', 'Segunda, 26 de outubro · bom dia, Roberto', btn('Nova tarefa')), body)

# ===== CONTATOS WEB =====
people = [('AR', 'Ana Ribeiro', 'Nuvem Labs', 'há 9 dias', 'Negócio · R$ 5.500', True),
          ('CM', 'Carla Menezes', 'Bitfaz Software', 'há 5 dias', 'Negócio · R$ 4.200', False),
          ('JP', 'João Pedro Lima', 'Acme', 'há 6 dias', 'Negócio · R$ 4.800', False),
          ('MS', 'Marina Souza', 'Lumen', 'ontem', 'Projeto · 6 de 9', False),
          ('RT', 'Rafael Teixeira', 'Serra Apps', 'há 2 dias', 'Da Caçada', False),
          ('LB', 'Lucas Brandt', 'Kora', 'hoje', 'Negócio + projeto', False),
          ('FC', 'Fernanda Costa', 'Grão', 'há 3 dias', 'Projeto · 3 de 8', False),
          ('TO', 'Tiago Oliveira', 'Orbita', 'há 4 dias', 'Negócio · R$ 2.900', False)]
trs = ''
for ini, n, co, last, link, sel in people:
    bg = 'background: #F5F5F7;' if sel else ''
    trs += f'''            <tr style="border-top: 1px solid rgba(0,0,0,0.06); {bg}">
              <td style="padding: 12px 20px"><div style="display: flex; align-items: center; gap: 12px"><span style="width: 32px; height: 32px; border-radius: 16px; background: #E3E3E8; display: inline-flex; align-items: center; justify-content: center; font-size: 12px; font-weight: 600; color: #3C3B3A">{ini}</span><span style="font-weight: 600">{n}</span></div></td>
              <td style="padding: 12px 20px; color: #3C3B3A">{co}</td>
              <td style="padding: 12px 20px; color: {"#A81B2E" if "9" in last else "#3C3B3A"}">{last}</td>
              <td style="padding: 12px 20px; color: #3C3B3A">{link}</td>
            </tr>
'''
chips = ''.join(f'<span style="font-size: 13px; font-weight: {600 if i == 0 else 500}; padding: 7px 13px; border-radius: 999px; background: {"#1D1D1F" if i == 0 else "#FFFFFF"}; color: {"#FFFFFF" if i == 0 else "#3C3B3A"}">{c}</span>'
                for i, c in enumerate(['Todos', 'Com negócio aberto', 'Clientes', 'Sem conversa há 30+ dias']))

def timeline(items):
    return ''.join(f'<div style="display: flex; gap: 12px; padding: 10px 0"><span style="width: 8px; height: 8px; margin-top: 6px; border-radius: 4px; background: {c}; flex-shrink: 0"></span><div><p style="margin: 0; font-size: 14px; font-weight: 500">{t}</p><p style="margin: 2px 0 0; font-size: 12px; color: #6E6E73">{s}</p></div></div>' for t, s, c in items)

TL = [('Reunião de descoberta', '17/10 · "Querem trocar a planilha até dezembro."', '#1D1D1F'),
      ('E-mail: apresentação enviada', '14/10 · abriu 3 vezes', '#C7C7CC'),
      ('Primeiro contato no LinkedIn', '12/10 · respondeu no mesmo dia', '#C7C7CC'),
      ('Veio da Caçada', '10/10 · SaaS em SC', R)]

def actions(size=44):
    out = ''
    for lbl, icon in [('Ligar', '<path d="M5 4h4l2 5-2.5 1.5a11 11 0 0 0 5 5L15 13l5 2v4a2 2 0 0 1-2 2A16 16 0 0 1 3 6a2 2 0 0 1 2-2"></path>'),
                      ('WhatsApp', '<path d="M21 12a9 9 0 0 1-13.5 7.8L3 21l1.2-4.5A9 9 0 1 1 21 12z"></path>'),
                      ('E-mail', '<rect x="3" y="5" width="18" height="14" rx="2"></rect><path d="M3 7l9 6 9-6"></path>')]:
        out += f'<a href="#" style="display: flex; flex-direction: column; align-items: center; gap: 6px; text-decoration: none; font-size: 12px; font-weight: 500; color: #3C3B3A"><span style="width: {size}px; height: {size}px; border-radius: {size//2}px; background: #F2F2F5; display: flex; align-items: center; justify-content: center; color: #1D1D1F"><svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" aria-hidden="true">{icon}</svg></span>{lbl}</a>'
    return out

body = f'''    <div style="display: flex; gap: 10px; flex-wrap: wrap; align-items: center">
      <input type="search" placeholder="Buscar pessoa ou empresa" aria-label="Buscar contato" style="flex: 0 1 320px; min-width: 0; font: inherit; font-size: 15px; padding: 10px 14px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FFFFFF; color: #1D1D1F">
      {chips}
    </div>
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) 360px; gap: 20px; align-items: start">
      <section style="{CARD}; overflow: hidden">
        <table style="width: 100%; border-collapse: collapse; font-size: 14px">
          <thead><tr style="text-align: left; color: #6E6E73"><th style="padding: 14px 20px; font-weight: 500">Pessoa</th><th style="padding: 14px 20px; font-weight: 500">Empresa</th><th style="padding: 14px 20px; font-weight: 500">Última conversa</th><th style="padding: 14px 20px; font-weight: 500">Ligado a</th></tr></thead>
          <tbody>
{trs}          </tbody>
        </table>
      </section>
      <aside style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; align-items: center; gap: 14px"><span style="width: 52px; height: 52px; border-radius: 26px; background: #1D1D1F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 600">AR</span><div><p style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em">Ana Ribeiro</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">Head de Produto · Nuvem Labs</p></div></div>
        <div style="display: flex; gap: 22px">{actions()}</div>
        <div style="border-radius: 14px; background: #FDE7EA; color: #A81B2E; padding: 12px 14px; font-size: 14px; font-weight: 500; line-height: 1.4">Mr. Wolf: 9 dias sem conversa e o follow-up venceu. Quer que eu rascunhe a mensagem?</div>
        <div style="border-radius: 14px; background: #F5F5F7; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center"><div><p style="margin: 0; font-size: 12px; color: #6E6E73">Negócio aberto</p><p style="margin: 2px 0 0; font-size: 15px; font-weight: 600">Nuvem Labs · R$ 5.500</p></div>{pill("Conversa", "calm")}</div>
        <div>{label("HISTÓRICO", "0 0 2px")}{timeline(TL)}</div>
      </aside>
    </div>
'''
files['Contatos.dc.html'] = web('Contatos (web)', 'Contatos', web_header('Contatos', '86 empresas · 124 pessoas · 7 sem conversa há 30+ dias', btn('Importar planilha', 'soft') + btn('Novo contato')), body)

# ===== GRANA WEB =====
months = [('mai', 6200), ('jun', 8900), ('jul', 7400), ('ago', 10800), ('set', 11600), ('out', 12400)]
def chart(h, w_bar):
    bars = ''
    for m, v in months:
        hh = round(v / 20000 * h)
        c = R if m == 'out' else '#1D1D1F'
        bars += f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; height: 100%"><span style="font-size: 12px; font-weight: 600; color: #3C3B3A">{v/1000:.1f}k</span><div style="width: {w_bar}; height: {hh}px; border-radius: 8px 8px 4px 4px; background: {c}"></div><span style="font-size: 12px; color: #6E6E73">{m}</span></div>'.replace('.', ',', 1) if False else \
                f'<div style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: flex-end; gap: 8px; height: 100%"><span style="font-size: 12px; font-weight: 600; color: #3C3B3A">{str(round(v/1000, 1)).replace(".", ",")}k</span><div style="width: {w_bar}; height: {hh}px; border-radius: 8px 8px 4px 4px; background: {c}"></div><span style="font-size: 12px; color: #6E6E73">{m}</span></div>'
    return f'<div style="position: relative; height: {h + 50}px; display: flex; gap: 12px; align-items: flex-end"><div style="position: absolute; left: 0; right: 0; bottom: {h + 26}px; border-top: 2px dashed #C7C7CC"></div><span style="position: absolute; right: 0; bottom: {h + 30}px; font-size: 12px; font-weight: 600; color: #6E6E73">meta R$ 20 mil</span>{bars}</div>'

closed = [('Lumen', 'App de agendamento', 'R$ 5.000', '22/10'), ('Grão', 'Site + painel de pedidos', 'R$ 4.400', '15/10'), ('Mapa Seguros', 'Landing + automação', 'R$ 3.000', '08/10')]
cl = ''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 12px 0; border-top: 1px solid rgba(0,0,0,0.06)"><div><p style="margin: 0; font-size: 14px; font-weight: 600">{n}</p><p style="margin: 2px 0 0; font-size: 12px; color: #6E6E73">{d} · {dt}</p></div><span style="font-size: 15px; font-weight: 600; white-space: nowrap">{v}</span></div>' for n, d, v, dt in closed)
fc = [('Proposta', 'R$ 17.800', '50%', 'R$ 8.900'), ('Conversa', 'R$ 11.300', '20%', 'R$ 2.260'), ('Lead', 'R$ 9.600', '5%', 'R$ 480')]
fcr = ''.join(f'<div style="display: grid; grid-template-columns: 1fr auto auto; gap: 12px; padding: 10px 0; border-top: 1px solid rgba(0,0,0,0.06); font-size: 14px"><span style="font-weight: 500">{s} <span style="color: #6E6E73">{t}</span></span><span style="color: #6E6E73">× {p}</span><span style="font-weight: 600; min-width: 72px; text-align: right">{r}</span></div>' for s, t, p, r in fc)

def stat(lbl, val, note, extra=''):
    return f'<div style="{CARD}; padding: 22px 24px; display: flex; flex-direction: column; gap: 6px"><p style="margin: 0; font-size: 14px; font-weight: 500; color: #6E6E73">{lbl}</p><p style="margin: 0; font-size: 44px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; white-space: nowrap">{val}</p><p style="margin: 0; font-size: 14px; color: #3C3B3A">{note}</p>{extra}</div>'

body = f'''    <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
      {stat("Fechado em outubro", "R$ 12.400", "3 vendas · +7% sobre setembro")}
      {stat("Previsão do pipeline", "R$ 11.640", "O que deve entrar nos próximos 30 dias")}
      {stat("Meta do mês", "R$ 20.000", "62% atingida · faltam 5 dias", '<div style="margin-top: 6px">' + bar(62, R, 8) + '</div>')}
    </section>
    <div style="display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px; align-items: start">
      <section style="{CARD}; padding: 22px 24px; display: flex; flex-direction: column; gap: 18px">
        <div><h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em">Fechado por mês</h2><p style="margin: 4px 0 0; font-size: 14px; color: #6E6E73">Melhor mês dos últimos seis. Falta R$ 7.600 para bater a meta.</p></div>
        {chart(240, '56%')}
      </section>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 18px 22px"><p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Fechados em outubro</p>{cl}</section>
        <section style="{CARD}; padding: 18px 22px"><p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">De onde vem a previsão</p>{fcr}<p style="margin: 10px 0 0; font-size: 12px; color: #6E6E73">Chance de fechar por etapa. Dá para ajustar.</p></section>
      </div>
    </div>
'''
files['Grana.dc.html'] = web('Grana (web)', 'Grana', web_header('Grana', 'Outubro de 2026 · três números e um gráfico', btn('Exportar CSV', 'soft')), body)

# ===== PIPELINE CELULAR =====
segs = [('Lead', '4', False), ('Conversa', '3', False), ('Proposta', '4', True), ('Fechado', '3', False)]
seg = ''.join(f'<span style="flex-shrink: 0; font-size: 14px; font-weight: 600; padding: 9px 14px; border-radius: 999px; background: {"#1D1D1F" if on else "#FFFFFF"}; color: {"#FFFFFF" if on else "#3C3B3A"}">{n} <span style="opacity: 0.6">{c}</span></span>' for n, c, on in segs)
deals = [('Acme', 'R$ 4.800', 'Ligar para fechar', 'parado 6 dias', R, '#A81B2E', 'João Pedro'),
         ('Orbita', 'R$ 2.900', 'Enviar proposta hoje', 'hoje', '#FF9F0A', '#8A5300', 'Tiago'),
         ('Faro', 'R$ 6.100', 'Aguardando jurídico', '2 dias', '#C7C7CC', '#6E6E73', 'Paula'),
         ('Vela Apps', 'R$ 4.000', 'Revisar escopo', '4 dias', '#C7C7CC', '#6E6E73', 'Diego')]
dl = ''.join(f'''    <article style="background: #FFFFFF; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05)">
      <div style="display: flex; justify-content: space-between; gap: 8px"><p style="margin: 0; font-size: 16px; font-weight: 600">{n}</p><p style="margin: 0; font-size: 16px; font-weight: 600">{v}</p></div>
      <p style="margin: 0; font-size: 14px; color: #3C3B3A">{nx} · <span style="color: #6E6E73">{who}</span></p>
      <div style="display: flex; align-items: center; gap: 6px"><span style="width: 8px; height: 8px; border-radius: 4px; background: {dot}"></span><span style="font-size: 12px; font-weight: 500; color: {ac}">{age}</span></div>
    </article>
''' for n, v, nx, age, dot, ac, who in deals)
body = (phone_header('11 abertos · R$ 38.700 em jogo', 'Pipeline', '<span style="font-size: 13px; font-weight: 600; color: #A81B2E; background: #FDE7EA; padding: 6px 10px; border-radius: 999px">2 parados</span>')
        + f'  <div style="display: flex; gap: 8px; padding: 18px 16px 4px; overflow: hidden">{seg}</div>\n'
        + '  <div style="display: flex; justify-content: space-between; padding: 12px 20px 8px; font-size: 13px; font-weight: 600; color: #6E6E73"><span>PROPOSTA · 4</span><span>R$ 17.800</span></div>\n'
        + f'  <div style="display: flex; flex-direction: column; gap: 10px; padding: 0 16px">\n{dl}  </div>\n'
        + '  <p style="margin: 10px 20px 0; font-size: 12px; color: #8E8E93; text-align: center">Arraste o card para o lado para mudar de etapa</p>\n'
        + FAB.format('Novo negócio'))
files['PipelineMobile.dc.html'] = phone('Pipeline (celular)', 'Pipeline', body)

# ===== CAÇADA CELULAR =====
co = [('Bitfaz Software', 'Software · Florianópolis · 2019', 'Carla M. · CEO', True),
      ('Ilha Digital', 'Agência · Florianópolis · 2017', '', True),
      ('Codemar', 'Software · Joinville · 2021', '', False),
      ('Serra Apps', 'Software · Blumenau · 2020', 'Rafael T. · Sócio', False)]
cards = ''
for n, meta, contact, chk in co:
    box = (f'<span style="width: 22px; height: 22px; border-radius: 7px; background: #1D1D1F; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FFFFFF" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>'
           if chk else '<span style="width: 22px; height: 22px; border-radius: 7px; border: 2px solid #C7C7CC; box-sizing: border-box; flex-shrink: 0"></span>')
    right = (f'<span style="font-size: 13px; font-weight: 500">{contact}</span>' if contact else
             f'<button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: {R}; background: transparent; border: 1px solid rgba(215,38,61,0.35); border-radius: 999px; padding: 6px 12px; cursor: pointer">Achar decisor · 1 crédito</button>')
    cards += f'''    <article style="background: #FFFFFF; border-radius: 16px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start">
      {box}
      <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px"><div><p style="margin: 0; font-size: 15px; font-weight: 600">{n}</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">{meta}</p></div><div>{right}</div></div>
    </article>
'''
body = (phone_header('38 de 50 créditos', 'Caçada', '<div style="width: 64px">' + bar(76) + '</div>')
        + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px; {CARD.split(";")[2]}">
    <label for="qm" style="font-size: 13px; font-weight: 600; color: #6E6E73">Para quem você quer vender?</label>
    <textarea id="qm" rows="2" style="font: inherit; font-size: 16px; line-height: 1.35; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FAFAFC; color: #1D1D1F; resize: none">Software houses e agências em SC, abertas há mais de 2 anos</textarea>
    <button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: {R}; border: 0; border-radius: 999px; padding: 12px; min-height: 44px; cursor: pointer">Caçar</button>
  </div>
  <p style="margin: 18px 20px 8px; font-size: 13px; font-weight: 600; color: #6E6E73">[N] EMPRESAS · BASE PÚBLICA DE CNPJ</p>
  <div style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px">
{cards}  </div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 96px"><button type="button" style="width: 100%; font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: #1D1D1F; border: 0; border-radius: 999px; padding: 14px; min-height: 48px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); cursor: pointer">Mandar 2 para o Pipeline</button></div>
''')
files['CacadaMobile.dc.html'] = phone('Caçada (celular)', 'Caçada', body)

# ===== PROJETOS CELULAR =====
pj = [('Kora', 'Integração com ERP · Você', 40, R, 'Ambiente de testes', 'venceu sex 23/10', 'atrasado', 'late'),
      ('Grão', 'Site + painel de pedidos · Bia', 38, '#FF9F0A', 'Aprovar layout', 'hoje', 'atenção', 'today'),
      ('Lumen', 'App de agendamento · Rafael', 67, '#1D1D1F', 'Telas do onboarding', 'sex 30/10', 'no prazo', 'calm'),
      ('Faro', 'MVP de marketplace · Rafael', 8, '#1D1D1F', 'Kickoff e escopo', 'seg 2/11', 'no prazo', 'calm')]
pc = ''.join(f'''    <article style="background: #FFFFFF; border-radius: 16px; padding: 14px 16px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.05)">
      <div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 8px"><div><p style="margin: 0; font-size: 16px; font-weight: 600">{n}</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">{d}</p></div>{pill(st, k)}</div>
      {bar(p, c)}
      <p style="margin: 0; font-size: 13px; color: #3C3B3A">Próxima: <strong style="font-weight: 600">{nx}</strong> · <span style="color: {"#A81B2E" if k == "late" else "#6E6E73"}">{dt}</span></p>
    </article>
''' for n, d, p, c, nx, dt, st, k in pj)
body = (phone_header('4 ativos · 4 entregas na semana', 'Projetos')
        + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border: 1px dashed rgba(0,0,0,0.18); border-radius: 16px; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px">
    <p style="margin: 0; font-size: 14px; line-height: 1.35"><strong style="font-weight: 600">Trilho fechou hoje.</strong><br><span style="color: #6E6E73">R$ 2.200 · vira projeto?</span></p>
    <button type="button" style="flex-shrink: 0; font: inherit; font-size: 14px; font-weight: 600; color: #FFFFFF; background: {R}; border: 0; border-radius: 999px; padding: 9px 14px; min-height: 40px; cursor: pointer">Criar</button>
  </div>
  <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 16px 0">
{pc}  </div>
''' + FAB.format('Novo projeto'))
files['ProjetosMobile.dc.html'] = phone('Projetos (celular)', 'Projetos', body)

# ===== CONTATOS CELULAR =====
body = f'''  <div style="padding: 56px 16px 0; display: flex; justify-content: space-between; align-items: center">
    <a href="#" style="font-size: 16px; font-weight: 500; text-decoration: none; color: #1D1D1F">‹ Pipeline</a>
    <a href="#" style="font-size: 16px; font-weight: 500; text-decoration: none; color: #1D1D1F">Editar</a>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 18px 20px 0; text-align: center">
    <span style="width: 72px; height: 72px; border-radius: 36px; background: #1D1D1F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 24px; font-weight: 600">AR</span>
    <h1 style="margin: 10px 0 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em">Ana Ribeiro</h1>
    <p style="margin: 0; font-size: 14px; color: #6E6E73">Head de Produto · Nuvem Labs</p>
  </div>
  <div style="display: flex; justify-content: center; gap: 28px; padding: 18px 0 0">{actions(48)}</div>
  <div style="margin: 18px 16px 0; border-radius: 16px; background: #FDE7EA; color: #A81B2E; padding: 12px 14px; font-size: 14px; font-weight: 500; line-height: 1.4">Mr. Wolf: 9 dias sem conversa. Quer que eu rascunhe o follow-up?</div>
  <div style="margin: 10px 16px 0; border-radius: 16px; background: #FFFFFF; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center"><div><p style="margin: 0; font-size: 12px; color: #6E6E73">Negócio aberto</p><p style="margin: 2px 0 0; font-size: 15px; font-weight: 600">Nuvem Labs · R$ 5.500</p></div>{pill("Conversa", "calm")}</div>
  <div style="margin: 10px 16px 0; border-radius: 16px; background: #FFFFFF; padding: 8px 14px 4px">{label("HISTÓRICO", "4px 0 0")}{timeline(TL[:3])}</div>
'''
files['ContatosMobile.dc.html'] = phone('Contato (celular)', 'Pipeline', body)

# ===== GRANA CELULAR =====
body = (phone_header('Outubro de 2026', 'Grana')
        + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)">
    <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Fechado no mês</p>
    <p style="margin: 0; font-size: 40px; font-weight: 700; letter-spacing: -0.04em; line-height: 1">R$ 12.400</p>
    {bar(62, R, 8)}
    <p style="margin: 0; font-size: 13px; color: #6E6E73">62% da meta de R$ 20.000 · faltam 5 dias</p>
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 16px 0">
    <div style="background: #FFFFFF; border-radius: 18px; padding: 14px 16px"><p style="margin: 0; font-size: 12px; font-weight: 500; color: #6E6E73">Previsão 30 dias</p><p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.03em">R$ 11.640</p></div>
    <div style="background: #FFFFFF; border-radius: 18px; padding: 14px 16px"><p style="margin: 0; font-size: 12px; font-weight: 500; color: #6E6E73">Falta pra meta</p><p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.03em">R$ 7.600</p></div>
  </div>
  <div style="margin: 10px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px">
    <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600">Fechado por mês</p>
    {chart(150, '62%')}
  </div>
  <div style="margin: 10px 16px 0; background: #1D1D1F; color: #F5F5F7; border-radius: 18px; padding: 14px 16px; font-size: 14px; line-height: 1.4"><strong style="font-weight: 600">Mr. Wolf:</strong> fecha Acme e Orbita e outubro bate R$ 20.100.</div>
''')
files['GranaMobile.dc.html'] = phone('Grana (celular)', 'Grana', body)

for name, html in files.items():
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(html)
    print(name, len(html))
