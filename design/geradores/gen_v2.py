# Capítulo 2, v2: telas refeitas com o feedback do David (26/10).
# Reaproveita os helpers de gen_screens.py (tudo antes de "files = {}").
import os
HERE = os.path.dirname(os.path.abspath(__file__))
_src = open(os.path.join(HERE, 'gen_screens.py')).read()
exec(_src[:_src.index('files = {}')])
def _cut(a, b):
    i = _src.index(a); return _src[i:_src.index(b, i)]
exec(_cut('def timeline', 'TL = ['))
exec(_cut('def actions', 'body = f'))
exec(_cut('months = [', 'closed = ['))
OUT = os.path.join(HERE, 'project')

# Contatos deixa de ser módulo: vira visão dentro do Pipeline.
WEB_NAV = [('Hoje', 'HojeWeb.dc.html'), ('Pipeline', 'Pipeline.dc.html'), ('Caçada', 'Cacada.dc.html'),
           ('Projetos', 'Projetos.dc.html'), ('Grana', 'Grana.dc.html')]

files = {}
LINE = 'border-top: 1px solid rgba(0,0,0,0.06)'

def src(t, kind='pub'):
    # Origem do dado: público verificado, inferido por IA ou cadastrado pelo usuário.
    if kind == 'ia':
        return f'<span style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; border: 1px dashed #A1A1A6; color: #6E6E73; white-space: nowrap">{t}</span>'
    return f'<span style="font-size: 11px; font-weight: 600; padding: 3px 8px; border-radius: 999px; background: #F2F2F5; color: #6E6E73; white-space: nowrap">{t}</span>'

def check(on=True, size=22):
    if on:
        return f'<span style="width: {size}px; height: {size}px; border-radius: 7px; background: #1D1D1F; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FFFFFF" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>'
    return f'<span style="width: {size}px; height: {size}px; border-radius: 7px; border: 2px solid #C7C7CC; box-sizing: border-box; flex-shrink: 0; display: inline-block"></span>'

def small_btn(t, kind='soft'):
    bg, fg = {'soft': ('#F2F2F5', '#1D1D1F'), 'dark': ('#1D1D1F', '#FFFFFF'), 'red': (R, '#FFFFFF'), 'ghost': ('transparent', '#6E6E73')}[kind]
    return f'<button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: {fg}; background: {bg}; border: 0; border-radius: 999px; padding: 8px 14px; min-height: 36px; cursor: pointer; white-space: nowrap">{t}</button>'

def wolf_says(text, cta='', size=20):
    b = (f'<button type="button" style="flex-shrink: 0; font: inherit; font-size: 14px; font-weight: 600; color: {R}; background: #FFFFFF; border: 0; border-radius: 999px; padding: 10px 18px; min-height: 40px; cursor: pointer">{cta}</button>' if cta else '')
    return (f'<div style="background: {R}; color: #FFFFFF; border-radius: 20px; padding: 18px 20px; display: flex; justify-content: space-between; align-items: center; gap: 16px">'
            f'<div><p style="margin: 0; font-size: 13px; font-weight: 600; opacity: 0.9">Mr. Wolf diz</p><p style="margin: 4px 0 0; font-size: {size}px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.35">{text}</p></div>{b}</div>')

def ring(pct, size=104):
    dash = round(314.2 * pct / 100, 1)
    return (f'<svg viewBox="0 0 120 120" width="{size}" height="{size}" role="img" aria-label="Meta do mês: {pct}% atingida"><circle cx="60" cy="60" r="50" fill="none" stroke="#EDEDF0" stroke-width="14"></circle>'
            f'<circle cx="60" cy="60" r="50" fill="none" stroke="#1D1D1F" stroke-width="14" stroke-linecap="round" stroke-dasharray="{dash} 314.2" transform="rotate(-90 60 60)"></circle>'
            f'<text x="60" y="66" text-anchor="middle" font-family="Inter, sans-serif" font-size="26" font-weight="700" fill="#1D1D1F">{pct}%</text></svg>')

def back_header(back, h1, sub=''):
    s = f'<p style="margin: 4px 0 0; font-size: 14px; color: #6E6E73">{sub}</p>' if sub else ''
    return (f'  <div style="padding: 56px 16px 0"><a href="#" style="font-size: 16px; font-weight: 500; text-decoration: none; color: #1D1D1F">‹ {back}</a></div>\n'
            f'  <div style="padding: 10px 20px 0"><h1 style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.035em">{h1}</h1>{s}</div>\n')

# ================= 1. HOJE =================
# Ordem: prazo prometido > etapa > tempo parado > valor.
PRIO = [('Ambiente de testes da Kora', 'Prazo prometido ao cliente · venceu sex 23/10', '3 dias', 'late', 'Abrir'),
        ('Enviar proposta para a Orbita', 'Prazo prometido ao cliente · hoje, 17h', 'hoje', 'today', 'Escrever'),
        ('Ligar para a Acme', 'Proposta parada há 6 dias · R$ 4.800', '6 dias', 'late', 'Ligar')]
HANDLE = '<svg viewBox="0 0 24 24" width="16" height="16" fill="#C7C7CC" aria-hidden="true"><circle cx="9" cy="6" r="1.6"></circle><circle cx="15" cy="6" r="1.6"></circle><circle cx="9" cy="12" r="1.6"></circle><circle cx="15" cy="12" r="1.6"></circle><circle cx="9" cy="18" r="1.6"></circle><circle cx="15" cy="18" r="1.6"></circle></svg>'

rows = ''
for i, (t, why, tag, k, act) in enumerate(PRIO, 1):
    rows += f'''        <div style="display: flex; align-items: center; gap: 14px; padding: 16px 20px; {LINE}">
          {HANDLE}
          <span style="width: 28px; font-size: 22px; font-weight: 700; letter-spacing: -0.03em; color: {"#1D1D1F" if i == 1 else "#A1A1A6"}">{i}</span>
          <div style="flex-grow: 1; min-width: 0"><p style="margin: 0; font-size: 16px; font-weight: 600">{t}</p><p style="margin: 3px 0 0; font-size: 13px; color: #6E6E73">{why}</p></div>
          {pill(tag, k)}
          {small_btn(act)}
          {small_btn("Adiar", "ghost")}
        </div>
'''
agenda = [('10:00', 'Ligar para a Acme', 'Eu te lembro 10 min antes'), ('14:30', 'Aprovar layout Grão', 'Projeto · Bia'), ('17:00', 'Proposta Orbita', 'Prazo prometido')]
ag = ''.join(f'<div style="display: flex; gap: 14px; padding: 12px 0; {LINE}"><span style="width: 44px; font-size: 13px; font-weight: 600; color: #6E6E73">{h}</span><div><p style="margin: 0; font-size: 14px; font-weight: 500">{t}</p><p style="margin: 2px 0 0; font-size: 12px; color: #6E6E73">{s}</p></div></div>' for h, t, s in agenda)
body = f'''    <div style="display: grid; grid-template-columns: minmax(0, 1.65fr) minmax(0, 1fr); gap: 20px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 16px">
        {wolf_says("A entrega da Kora está atrasada há 3 dias. Começa por ela.", "Ver projeto")}
        <section style="{CARD}; overflow: hidden">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 20px">
            <div><p style="margin: 0; font-size: 16px; font-weight: 600">Três coisas pra hoje</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">Primeiro o que você prometeu, depois a etapa, o tempo parado e o valor.</p></div>
            <span style="font-size: 13px; color: #6E6E73; white-space: nowrap">Arraste para reordenar</span>
          </div>
{rows}        </section>
        <p style="margin: 0 4px; font-size: 14px; color: #6E6E73">Na fila: follow-up Nuvem Labs, aprovar layout Grão e mais 2. <a href="#" style="font-weight: 600">Ver tudo</a></p>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 20px; display: flex; align-items: center; gap: 18px">
          {ring(62)}
          <div style="display: flex; flex-direction: column; gap: 4px"><p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Meta de outubro</p><p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.03em">R$ 12.400</p><p style="margin: 0; font-size: 13px; color: #6E6E73">de R$ 20.000 · faltam 5 dias</p></div>
        </section>
        <section style="{CARD}; padding: 16px 20px">
          <p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Agenda de hoje</p>
          {ag}
        </section>
      </div>
    </div>
'''
files['HojeWeb.dc.html'] = web('Hoje (web)', 'Hoje', web_header('Hoje', 'Segunda, 26 de outubro · bom dia, Roberto', btn('Nova tarefa')), body)

pc = ''
for i, (t, why, tag, k, act) in enumerate(PRIO, 1):
    pc += f'''    <div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; {LINE if i > 1 else ""}">
      <span style="width: 20px; font-size: 20px; font-weight: 700; color: {"#1D1D1F" if i == 1 else "#A1A1A6"}">{i}</span>
      <div style="flex-grow: 1; min-width: 0"><p style="margin: 0; font-size: 15px; font-weight: 600">{t}</p><p style="margin: 2px 0 0; font-size: 12px; line-height: 1.35; color: #6E6E73">{why}</p></div>
      {pill(tag, k)}
    </div>
'''
body = (f'''  <div style="padding: 56px 20px 0; display: flex; justify-content: space-between; align-items: center">
    <div><p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Segunda, 26 de outubro</p><h1 style="margin: 2px 0 0; font-size: 32px; font-weight: 700; letter-spacing: -0.035em">Hoje</h1></div>
    <div style="width: 40px; height: 40px; border-radius: 12px; background: #1D1D1F; display: flex; align-items: center; justify-content: center">{WOLF.format(s=24)}</div>
  </div>
  <div style="margin: 18px 16px 0">{wolf_says("A entrega da Kora está atrasada há 3 dias. Começa por ela.", size=17)}</div>
  <div style="display: flex; justify-content: space-between; margin: 22px 20px 8px; font-size: 13px; font-weight: 600; color: #6E6E73"><span>TRÊS COISAS PRA HOJE</span><a href="#" style="color: #1D1D1F; text-decoration: none">Reordenar</a></div>
  <div style="margin: 0 16px; background: #FFFFFF; border-radius: 20px; overflow: hidden">
{pc}  </div>
  <p style="margin: 8px 20px 0; font-size: 12px; color: #8E8E93; text-align: center">Arraste para o lado para adiar · mais 4 na fila</p>
  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 8px">
    <div style="display: flex; justify-content: space-between; align-items: baseline"><p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Meta de outubro</p><p style="margin: 0; font-size: 13px; font-weight: 600">62%</p></div>
    <p style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em">R$ 12.400 <span style="font-size: 14px; font-weight: 500; color: #6E6E73; letter-spacing: 0">de R$ 20.000</span></p>
    {bar(62, "#1D1D1F", 8)}
  </div>
''')
files['Hoje.dc.html'] = phone('Hoje (celular)', 'Hoje', body)

# ================= 2. PIPELINE =================
OK, WARN, BAD = ('#C7C7CC', '#6E6E73', 'transparent'), ('#FF9F0A', '#8A5300', '#FF9F0A'), (R, '#A81B2E', R)
COLS = [
    ('Lead', '4', 'prospects · fora da conta', True, [
        ('Pixel Forge', '', 'Primeiro contato · hoje', 'da Caçada', OK),
        ('Rota Dev', '', 'Mensagem no LinkedIn · qua 28/10', 'da Caçada', OK),
        ('Serra Apps', '', 'Primeiro contato · qui 29/10', 'da Caçada', OK),
        ('Bitfaz', '', 'Achar o decisor · venceu 24/10', 'parado 5 dias', WARN)]),
    ('Conversa', '3', 'R$ 11.300', False, [
        ('Nuvem Labs', 'R$ 5.500', 'Follow-up com a Ana · venceu 24/10', 'atrasado 2 dias', BAD),
        ('Kora', 'R$ 3.600', 'Demo · qui 29/10', '1 dia', OK),
        ('Solar Tech', 'R$ 2.200', 'Entender orçamento · sex 30/10', '3 dias', OK)]),
    ('Proposta', '4', 'R$ 17.800', False, [
        ('Acme', 'R$ 4.800', 'Ligar para fechar · hoje, 10h', 'parado 6 dias', BAD),
        ('Orbita', 'R$ 2.900', 'Enviar proposta · hoje, 17h', 'hoje', WARN),
        ('Delta Log', 'R$ 6.100', 'Retorno do jurídico · seg 2/11', '2 dias', OK),
        ('Vela Apps', 'R$ 4.000', 'Revisar escopo · qua 28/10', '4 dias', OK)]),
    ('Fechado', '3', 'R$ 12.400', False, [
        ('Trilho', 'R$ 3.000', 'Virar projeto', 'fechado hoje', OK),
        ('Lumen', 'R$ 5.000', 'Fase 2 em andamento', 'fechado 22/10', OK),
        ('Grão', 'R$ 4.400', 'Pedir indicação', 'fechado 15/10', OK)]),
]

def deal_card(n, v, nx, age, st, pad=14, fs=15):
    dot, ac, edge = st
    val = f'<p style="margin: 0; font-size: {fs}px; font-weight: 600">{v}</p>' if v else ''
    return (f'<article style="background: #FFFFFF; border-radius: 14px; padding: {pad}px; display: flex; flex-direction: column; gap: 8px; box-shadow: 0 1px 2px rgba(0,0,0,0.05), inset 3px 0 0 {edge}">'
            f'<div style="display: flex; justify-content: space-between; gap: 8px"><p style="margin: 0; font-size: {fs}px; font-weight: 600">{n}</p>{val}</div>'
            f'<p style="margin: 0; font-size: 13px; color: #3C3B3A">{nx}</p>'
            f'<div style="display: flex; align-items: center; gap: 6px"><span style="width: 8px; height: 8px; border-radius: 4px; background: {dot}"></span><span style="font-size: 12px; font-weight: 500; color: {ac}">{age}</span></div></article>')

cols = ''
for name, cnt, total, is_lead, cards in COLS:
    style = 'background: transparent; border: 1.5px dashed #D2D2D7' if is_lead else 'background: #EBEBEF'
    cols += f'''        <section style="{style}; border-radius: 20px; padding: 12px; display: flex; flex-direction: column; gap: 10px">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 8px; padding: 4px 6px 2px"><h2 style="margin: 0; font-size: 15px; font-weight: 600">{name} <span style="color: #6E6E73; font-weight: 500">{cnt}</span></h2><span style="font-size: 12px; font-weight: 600; color: {"#8E8E93" if is_lead else "#3C3B3A"}">{total}</span></div>
          {"".join(deal_card(*c) for c in cards)}
        </section>
'''
toggle = ('<div style="display: flex; background: #EBEBEF; border-radius: 999px; padding: 4px" role="group" aria-label="Visão">'
          '<span style="font-size: 14px; font-weight: 600; padding: 8px 16px; border-radius: 999px; background: #FFFFFF; box-shadow: 0 1px 3px rgba(0,0,0,0.1)">Funil</span>'
          '<span style="font-size: 14px; font-weight: 500; padding: 8px 16px; color: #6E6E73">Contatos</span></div>')
legend = ''.join(f'<span style="display: inline-flex; align-items: center; gap: 6px"><span style="width: 8px; height: 8px; border-radius: 4px; background: {c}"></span>{t}</span>'
                 for c, t in [('#C7C7CC', 'em dia'), ('#FF9F0A', 'parado 5 dias'), (R, 'parado 6+ dias ou atrasado')])
body = f'''    <div style="overflow-x: auto">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(230px, 1fr)); gap: 16px; min-width: 980px; align-items: start">
{cols}      </div>
    </div>
    <div style="display: flex; flex-wrap: wrap; gap: 20px; font-size: 13px; color: #6E6E73">{legend}<span>Lead é prospect: ninguém demonstrou interesse ainda, então não entra no Grana.</span></div>
'''
files['Pipeline.dc.html'] = web('Pipeline (web)', 'Pipeline', web_header('Pipeline', '7 oportunidades · R$ 29.100 em negociação · 2 paradas', toggle + btn('Novo negócio')), body)

segs = [('Lead', '4', False), ('Conversa', '3', False), ('Proposta', '4', True), ('Fechado', '3', False)]
seg = ''.join(f'<span style="flex-shrink: 0; font-size: 14px; font-weight: 600; padding: 9px 14px; border-radius: 999px; background: {"#1D1D1F" if on else "#FFFFFF"}; color: {"#FFFFFF" if on else "#3C3B3A"}">{n} <span style="opacity: 0.6">{c}</span></span>' for n, c, on in segs)
body = (phone_header('7 oportunidades · R$ 29.100', 'Pipeline', '<span style="font-size: 13px; font-weight: 600; color: #A81B2E; background: #FDE7EA; padding: 6px 10px; border-radius: 999px">2 paradas</span>')
        + f'  <div style="display: flex; gap: 8px; padding: 18px 16px 4px; overflow: hidden">{seg}</div>\n'
        + '  <div style="display: flex; justify-content: space-between; padding: 12px 20px 8px; font-size: 13px; font-weight: 600; color: #6E6E73"><span>PROPOSTA · 4</span><span>R$ 17.800</span></div>\n'
        + '  <div style="display: flex; flex-direction: column; gap: 10px; padding: 0 16px">\n'
        + ''.join('    ' + deal_card(*c, pad=16, fs=16) + '\n' for c in COLS[2][4])
        + '  </div>\n'
        + '  <p style="margin: 10px 20px 0; font-size: 12px; color: #8E8E93; text-align: center">Arraste o card para o lado para mudar de etapa</p>\n'
        + FAB.format('Novo negócio'))
files['PipelineMobile.dc.html'] = phone('Pipeline (celular)', 'Pipeline', body)

# ----- 2b. Negócio aberto + abordagem sugerida (sub-tela do Pipeline) -----
TL = [('Reunião de descoberta', '17/10 · "Querem trocar a planilha até dezembro."', '#1D1D1F'),
      ('Primeiro contato enviado', '12/10 · abordagem sugerida, você revisou', '#C7C7CC'),
      ('Selecionada para prospectar', '10/10 · caçada "SaaS em SC"', R)]
FACTS = [('Desenvolvimento de software · Florianópolis', src('Receita Federal · set/26')),
         ('Aberta em 2019 · microempresa', src('Receita Federal · set/26')),
         ('Ana Ribeiro, Head de Produto', src('você cadastrou')),
         ('Vende por planilha, sem CRM', src('inferido por IA', 'ia'))]
facts = ''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 10px 0; {LINE}"><span style="font-size: 14px">{t}</span>{s}</div>' for t, s in FACTS)
STEPS = [('1º contato', 'enviado', False), ('Follow-up 1', '', True), ('Follow-up 2', '', False), ('Follow-up 3', '', False)]
steps = ''.join(f'<span style="font-size: 13px; font-weight: 600; padding: 8px 14px; border-radius: 999px; background: {"#1D1D1F" if on else "transparent"}; color: {"#FFFFFF" if on else ("#A1A1A6" if d else "#3C3B3A")}">{n}{" ✓" if d else ""}</span>' for n, d, on in STEPS)
MSG = ('Oi, Ana! Na nossa conversa do dia 17 você comentou que querem trocar a planilha até dezembro. '
       'Montei um rascunho de como ficaria o painel de vocês. Te mostro em 20 minutos esta semana?')
body = f'''    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.25fr); gap: 20px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 18px">
          <div style="display: flex; align-items: center; gap: 14px"><span style="width: 52px; height: 52px; border-radius: 26px; background: #1D1D1F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 17px; font-weight: 600">AR</span><div><p style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em">Ana Ribeiro</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">Head de Produto · Nuvem Labs</p></div></div>
          <div style="display: flex; gap: 22px">{actions()}</div>
        </section>
        <section style="{CARD}; padding: 14px 22px 8px">{label("A EMPRESA", "4px 0 4px")}{facts}</section>
        <section style="{CARD}; padding: 14px 22px 8px">{label("HISTÓRICO", "4px 0 0")}{timeline(TL)}</section>
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 18px 22px; display: flex; justify-content: space-between; align-items: center; gap: 16px; box-shadow: inset 3px 0 0 {R}, 0 1px 2px rgba(0,0,0,0.04)">
          <div><p style="margin: 0; font-size: 12px; font-weight: 600; color: #6E6E73">PRÓXIMO PASSO</p><p style="margin: 4px 0 0; font-size: 17px; font-weight: 600">Follow-up com a Ana</p><p style="margin: 2px 0 0; font-size: 13px; font-weight: 500; color: #A81B2E">venceu sex 24/10 · 2 dias</p></div>
          {small_btn("Remarcar")}
        </section>
        <section style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 16px">
          <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px"><h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em">Abordagem sugerida</h2>{src("sugestão do lobo", "ia")}</div>
          <div style="display: flex; flex-wrap: wrap; gap: 4px; background: #F2F2F5; border-radius: 999px; padding: 4px; align-self: flex-start">{steps}</div>
          <div style="background: #F5F5F7; border-radius: 16px; padding: 18px 20px; font-size: 16px; line-height: 1.55">{MSG}</div>
          <p style="margin: 0; font-size: 13px; color: #6E6E73">Escrita a partir da reunião de 17/10. Revise antes de mandar: nada sai sem você.</p>
          <div style="display: flex; flex-wrap: wrap; gap: 10px">{btn("Abrir no WhatsApp")}{btn("Copiar", "soft")}{btn("Outra versão", "soft")}</div>
        </section>
      </div>
    </div>
'''
hdr = web_header('Nuvem Labs', '<a href="Pipeline.dc.html" style="text-decoration: none; color: #6E6E73">‹ Pipeline</a> · Conversa · R$ 5.500', btn('Mover para Proposta', 'soft') + btn('Marcar como ganho'))
files['PipelineNegocio.dc.html'] = web('Negócio aberto (web)', 'Pipeline', hdr, body)

body = f'''  <div style="padding: 56px 16px 0; display: flex; justify-content: space-between; align-items: center">
    <a href="#" style="font-size: 16px; font-weight: 500; text-decoration: none; color: #1D1D1F">‹ Pipeline</a>
    <a href="#" style="font-size: 16px; font-weight: 500; text-decoration: none; color: #1D1D1F">Editar</a>
  </div>
  <div style="display: flex; flex-direction: column; align-items: center; gap: 4px; padding: 14px 20px 0; text-align: center">
    <span style="width: 68px; height: 68px; border-radius: 34px; background: #1D1D1F; color: #FFFFFF; display: inline-flex; align-items: center; justify-content: center; font-size: 22px; font-weight: 600">AR</span>
    <h1 style="margin: 10px 0 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em">Ana Ribeiro</h1>
    <p style="margin: 0; font-size: 14px; color: #6E6E73">Head de Produto · Nuvem Labs</p>
  </div>
  <div style="display: flex; justify-content: center; gap: 28px; padding: 16px 0 0">{actions(48)}</div>
  <div style="margin: 16px 16px 0; border-radius: 16px; background: #FFFFFF; padding: 12px 14px; display: flex; justify-content: space-between; align-items: center"><div><p style="margin: 0; font-size: 12px; color: #6E6E73">Conversa</p><p style="margin: 2px 0 0; font-size: 15px; font-weight: 600">Nuvem Labs · R$ 5.500</p></div>{pill("venceu 24/10", "late")}</div>
  <div style="margin: 10px 16px 0; border-radius: 16px; background: {R}; color: #FFFFFF; padding: 14px; display: flex; justify-content: space-between; align-items: center; gap: 10px"><p style="margin: 0; font-size: 14px; font-weight: 500; line-height: 1.4">Rascunhei o follow-up da Ana. Quer ver?</p><button type="button" style="flex-shrink: 0; font: inherit; font-size: 13px; font-weight: 600; color: {R}; background: #FFFFFF; border: 0; border-radius: 999px; padding: 8px 14px; min-height: 36px; cursor: pointer">Ver</button></div>
  <div style="margin: 10px 16px 0; border-radius: 16px; background: #FFFFFF; padding: 8px 14px 4px">{label("HISTÓRICO", "4px 0 0")}{timeline(TL)}</div>
'''
files['PipelineNegocioMobile.dc.html'] = phone('Negócio aberto (celular)', 'Pipeline', body)

msteps = ''.join(f'<span style="flex: 1; text-align: center; font-size: 12px; font-weight: 600; padding: 8px 4px; border-radius: 999px; background: {"#FFFFFF" if on else "transparent"}; color: {"#1D1D1F" if on else ("#A1A1A6" if d else "#6E6E73")}; box-shadow: {"0 1px 3px rgba(0,0,0,0.1)" if on else "none"}">{n.replace("Follow-up ", "F")}{" ✓" if d else ""}</span>' for n, d, on in STEPS)
body = (back_header('Nuvem Labs', 'Abordagem', 'Follow-up 1 para a Ana Ribeiro')
        + f'''  <div style="margin: 16px 16px 0; display: flex; gap: 2px; background: #E8E8ED; border-radius: 999px; padding: 3px">{msteps}</div>
  <div style="margin: 14px 16px 0; background: #FFFFFF; border-radius: 20px 20px 20px 6px; padding: 16px 18px; font-size: 16px; line-height: 1.55">{MSG}</div>
  <div style="display: flex; align-items: center; gap: 8px; margin: 10px 20px 0">{src("sugestão do lobo", "ia")}<span style="font-size: 12px; color: #6E6E73">Revise antes de mandar</span></div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 100px; display: flex; flex-direction: column; gap: 10px">
    <button type="button" style="font: inherit; font-size: 16px; font-weight: 600; color: #FFFFFF; background: #1D1D1F; border: 0; border-radius: 999px; padding: 14px; min-height: 50px; cursor: pointer">Abrir no WhatsApp</button>
    <div style="display: flex; gap: 10px"><button type="button" style="flex: 1; font: inherit; font-size: 15px; font-weight: 600; color: #1D1D1F; background: #FFFFFF; border: 0; border-radius: 999px; padding: 12px; min-height: 46px; cursor: pointer">Copiar</button><button type="button" style="flex: 1; font: inherit; font-size: 15px; font-weight: 600; color: #1D1D1F; background: #FFFFFF; border: 0; border-radius: 999px; padding: 12px; min-height: 46px; cursor: pointer">Outra versão</button></div>
  </div>
''')
files['PipelineAbordagemMobile.dc.html'] = phone('Abordagem (celular)', 'Pipeline', body)

# ================= 3. CAÇADA =================
CO = [('Bitfaz Software', 'Software', 'Florianópolis', '2019', 'dup', 'Carla M. · CEO'),
      ('Ilha Digital', 'Agência de marketing', 'Florianópolis', '2017', True, ''),
      ('Codemar', 'Software', 'Joinville', '2021', True, ''),
      ('Serra Apps', 'Software', 'Blumenau', '2020', 'dup', 'Rodrigo T. · Sócio'),
      ('Vento Sul Studio', 'Agência de marketing', 'Itajaí', '2018', False, ''),
      ('Pinhão Tech', 'Consultoria em TI', 'Chapecó', '2016', False, '')]
ENRICH = f'<button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: {R}; background: transparent; border: 1px solid rgba(215,38,61,0.35); border-radius: 999px; padding: 6px 12px; cursor: pointer; white-space: nowrap">Achar decisor · 1 crédito</button>'
trs = ''
for n, sec, city, since, sel, contact in CO:
    dup = sel == 'dup'
    first = pill('Já no Pipeline', 'calm') if dup else check(sel)
    who = f'<span style="font-size: 13px">{contact}</span>' if contact else ENRICH
    trs += f'''            <tr style="{LINE}{"; color: #A1A1A6" if dup else ""}">
              <td style="padding: 12px 0 12px 20px; width: 120px">{first}</td>
              <td style="padding: 12px 16px; font-weight: 600">{n}</td>
              <td style="padding: 12px 16px">{sec}</td>
              <td style="padding: 12px 16px">{city}</td>
              <td style="padding: 12px 16px">{since}</td>
              <td style="padding: 12px 20px; border-left: 1px solid rgba(0,0,0,0.06)">{who}</td>
            </tr>
'''
chips = ''.join(f'<span style="font-size: 13px; font-weight: 500; padding: 6px 12px; border-radius: 999px; background: #F2F2F5; color: #3C3B3A">{c}</span>' for c in ['Setor: software + agências', 'Estado: SC', 'Abertas antes de 2023', 'Porte: ME e EPP'])
hist = ' · '.join(f'<a href="#" style="text-decoration: none; color: #3C3B3A">{h}</a>' for h in ['Indústrias em Joinville, 12/10', 'Agências em Floripa, 02/10'])
meter = ('<div style="background: #FFFFFF; border-radius: 14px; padding: 10px 14px; display: flex; align-items: center; gap: 12px">'
         '<div style="width: 120px">' + bar(76) + '</div><span style="font-size: 13px; font-weight: 500; color: #3C3B3A">38 de 50 créditos</span></div>')
body = f'''    <form style="{CARD}; padding: 16px; display: flex; flex-direction: column; gap: 14px">
      <label for="q" style="font-size: 13px; font-weight: 600; color: #6E6E73">Para quem você quer vender?</label>
      <div style="display: flex; gap: 10px; flex-wrap: wrap">
        <input id="q" type="text" value="Software houses e agências digitais em SC, abertas há mais de 2 anos" style="flex: 1 1 320px; min-width: 0; font: inherit; font-size: 17px; padding: 12px 14px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FAFAFC; color: #1D1D1F">
        <button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: {R}; border: 0; border-radius: 999px; padding: 12px 22px; min-height: 44px; cursor: pointer">Caçar · 1 crédito</button>
      </div>
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 10px"><div style="display: flex; flex-wrap: wrap; gap: 8px">{chips}</div><span style="font-size: 13px; color: #6E6E73">Últimas: {hist}</span></div>
    </form>
    <section style="{CARD}; overflow: hidden">
      <div style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 20px">
        <p style="margin: 0; font-size: 15px; font-weight: 600">80 empresas compatíveis <span style="font-weight: 400; color: #6E6E73">· 2 já estão no teu Pipeline</span></p>
        {btn("Mandar 2 para o Pipeline")}
      </div>
      <div style="overflow-x: auto">
        <table style="width: 100%; min-width: 820px; border-collapse: collapse; font-size: 14px; color: #3C3B3A">
          <thead>
            <tr style="text-align: left; color: #6E6E73; font-size: 12px">
              <th colspan="5" style="padding: 10px 20px 4px; font-weight: 600">DADO PÚBLICO <span style="font-weight: 500">· Receita Federal, set/2026 · grátis</span></th>
              <th style="padding: 10px 20px 4px; font-weight: 600; border-left: 1px solid rgba(0,0,0,0.06)">ENRIQUECIDO <span style="font-weight: 500">· só cobra se achar</span></th>
            </tr>
            <tr style="text-align: left; color: #6E6E73"><th style="padding: 8px 0 10px 20px; font-weight: 500"></th><th style="padding: 8px 16px 10px; font-weight: 500">Empresa</th><th style="padding: 8px 16px 10px; font-weight: 500">Setor</th><th style="padding: 8px 16px 10px; font-weight: 500">Cidade</th><th style="padding: 8px 16px 10px; font-weight: 500">Desde</th><th style="padding: 8px 20px 10px; font-weight: 500; border-left: 1px solid rgba(0,0,0,0.06)">Decisor</th></tr>
          </thead>
          <tbody>
{trs}          </tbody>
        </table>
      </div>
    </section>
'''
files['Cacada.dc.html'] = web('Caçada (web)', 'Caçada', web_header('Caçada', 'Diga para quem você vende. O lobo acha as empresas.', meter), body)

cards = ''
for n, sec, city, since, sel, contact in CO[:4]:
    dup = sel == 'dup'
    first = check(sel) if not dup else check(False)
    right = (pill('Já no Pipeline', 'calm') if dup else (f'<span style="font-size: 13px; font-weight: 500">{contact}</span>' if contact else ENRICH))
    cards += f'''    <article style="background: #FFFFFF; border-radius: 16px; padding: 14px 16px; display: flex; gap: 12px; align-items: flex-start{"; opacity: 0.55" if dup else ""}">
      {first}
      <div style="flex-grow: 1; display: flex; flex-direction: column; gap: 8px"><div><p style="margin: 0; font-size: 15px; font-weight: 600">{n}</p><p style="margin: 2px 0 0; font-size: 13px; color: #6E6E73">{sec} · {city} · {since}</p></div><div>{right}</div></div>
    </article>
'''
body = (phone_header('38 de 50 créditos', 'Caçada', '<div style="width: 64px">' + bar(76) + '</div>')
        + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 18px; padding: 14px; display: flex; flex-direction: column; gap: 10px">
    <label for="qm" style="font-size: 13px; font-weight: 600; color: #6E6E73">Para quem você quer vender?</label>
    <textarea id="qm" rows="2" style="font: inherit; font-size: 16px; line-height: 1.35; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FAFAFC; color: #1D1D1F; resize: none">Software houses e agências em SC, abertas há mais de 2 anos</textarea>
    <button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: {R}; border: 0; border-radius: 999px; padding: 12px; min-height: 44px; cursor: pointer">Caçar · 1 crédito</button>
  </div>
  <p style="margin: 18px 20px 8px; font-size: 12px; font-weight: 600; color: #6E6E73">80 EMPRESAS · RECEITA FEDERAL, SET/2026</p>
  <div style="display: flex; flex-direction: column; gap: 8px; padding: 0 16px">
{cards}  </div>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 96px"><button type="button" style="width: 100%; font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: #1D1D1F; border: 0; border-radius: 999px; padding: 14px; min-height: 48px; box-shadow: 0 8px 24px rgba(0,0,0,0.2); cursor: pointer">Mandar 2 para o Pipeline</button></div>
''')
files['CacadaMobile.dc.html'] = phone('Caçada (celular)', 'Caçada', body)

# ----- 3b. Primeira caçada (entrada, sub-tela da Caçada) -----
Q = [('O que você vende?', 'Sites e apps sob medida', 'done'),
     ('Para que tipo de empresa?', 'Software houses e agências', 'done'),
     ('Em qual região?', 'Santa Catarina', 'done'),
     ('O que torna uma empresa interessante?', '', 'now'),
     ('Quais você quer começar a prospectar?', 'Você escolhe na lista', 'next')]
CRIT = [('Aberta há mais de 2 anos', True), ('ME ou EPP', True), ('Matriz, não filial', False), ('Com site próprio', False)]

def crit_chips(fs=14):
    return ''.join(f'<span style="font-size: {fs}px; font-weight: 600; padding: 9px 14px; border-radius: 999px; background: {"#1D1D1F" if on else "#FFFFFF"}; color: {"#FFFFFF" if on else "#3C3B3A"}; border: 1px solid {"#1D1D1F" if on else "rgba(0,0,0,0.12)"}">{t}</span>' for t, on in CRIT)

def qlist(fs_q=17, pad='16px 20px', chips_fs=14):
    out = ''
    for i, (q, a, st) in enumerate(Q, 1):
        num = (check(True, 26) if st == 'done' else
               f'<span style="width: 26px; height: 26px; border-radius: 8px; background: {R if st == "now" else "#EDEDF0"}; color: {"#FFFFFF" if st == "now" else "#A1A1A6"}; display: inline-flex; align-items: center; justify-content: center; font-size: 13px; font-weight: 700; flex-shrink: 0">{i}</span>')
        inner = (f'<p style="margin: 0; font-size: 13px; color: #6E6E73">{q}</p><p style="margin: 2px 0 0; font-size: {fs_q - 1}px; font-weight: 600">{a}</p>' if st == 'done' else
                 f'<p style="margin: 0; font-size: {fs_q}px; font-weight: 700; letter-spacing: -0.01em">{q}</p><div style="display: flex; flex-wrap: wrap; gap: 8px; margin-top: 12px">{crit_chips(chips_fs)}</div>' if st == 'now' else
                 f'<p style="margin: 0; font-size: {fs_q - 1}px; font-weight: 600; color: #A1A1A6">{q}</p><p style="margin: 2px 0 0; font-size: 13px; color: #A1A1A6">{a}</p>')
        bg = 'background: #FAFAFC;' if st == 'now' else ''
        out += f'<div style="display: flex; gap: 14px; align-items: flex-start; padding: {pad}; {bg} {LINE if i > 1 else ""}">{num}<div style="flex-grow: 1; min-width: 0">{inner}</div></div>'
    return out

body = f'''    <div style="display: grid; grid-template-columns: minmax(0, 1.5fr) minmax(0, 1fr); gap: 20px; align-items: start">
      <section style="{CARD}; overflow: hidden">
        {qlist()}
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 20px; {LINE}"><span style="font-size: 13px; color: #6E6E73">Já tem uma lista? <a href="#" style="font-weight: 600">Importar CSV ou Google Contatos</a></span>{btn("Continuar")}</div>
      </section>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="background: #1D1D1F; color: #F5F5F7; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 8px">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #A1A1A6">Até aqui</p>
          <p style="margin: 0; font-size: 56px; font-weight: 700; letter-spacing: -0.045em; line-height: 1">~80</p>
          <p style="margin: 0; font-size: 15px; line-height: 1.45; color: #D2D2D7">empresas batem com o que você respondeu.</p>
        </section>
        <section style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 6px">
          <p style="margin: 0; font-size: 15px; font-weight: 600">Essa é por conta do lobo</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #3C3B3A">A primeira caçada não gasta crédito. Você sai daqui com uma lista pronta para trabalhar.</p>
        </section>
      </div>
    </div>
'''
files['CacadaEntrada.dc.html'] = web('Primeira caçada (web)', 'Caçada', web_header('Primeira caçada', 'Cinco respostas e a tua lista sai pronta.', '<span style="font-size: 14px; font-weight: 600; color: #6E6E73">4 de 5</span>'), body)

body = (phone_header('4 de 5', 'Primeira caçada', '')
        + f'''  <div style="margin: 14px 20px 0">{bar(80, R, 4)}</div>
  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; overflow: hidden">{qlist(16, "13px 16px", 13)}</div>
  <p style="margin: 12px 20px 0; font-size: 13px; color: #6E6E73; text-align: center">~80 empresas batem até aqui · a primeira caçada é grátis</p>
  <div style="position: absolute; left: 16px; right: 16px; bottom: 100px"><button type="button" style="width: 100%; font: inherit; font-size: 16px; font-weight: 600; color: #FFFFFF; background: #1D1D1F; border: 0; border-radius: 999px; padding: 14px; min-height: 50px; cursor: pointer">Continuar</button></div>
''')
files['CacadaEntradaMobile.dc.html'] = phone('Primeira caçada (celular)', 'Caçada', body)

# ================= 4. PROJETOS (celular; web segue o arquivo à mão) =================
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
    <p style="margin: 0; font-size: 14px; line-height: 1.35"><strong style="font-weight: 600">Trilho fechou hoje.</strong><br><span style="color: #6E6E73">R$ 3.000 · vira projeto?</span></p>
    <button type="button" style="flex-shrink: 0; font: inherit; font-size: 14px; font-weight: 600; color: #FFFFFF; background: {R}; border: 0; border-radius: 999px; padding: 9px 14px; min-height: 40px; cursor: pointer">Criar</button>
  </div>
  <div style="display: flex; flex-direction: column; gap: 10px; padding: 16px 16px 0">
{pc}  </div>
''' + FAB.format('Novo projeto'))
files['ProjetosMobile.dc.html'] = phone('Projetos (celular)', 'Projetos', body)

# ================= 5. GRANA =================
closed = [('Trilho', 'Site institucional', 'R$ 3.000', '26/10', ('a receber', 'today')),
          ('Lumen', 'Fase 2 do app', 'R$ 5.000', '22/10', ('recebido', 'calm')),
          ('Grão', 'Site + painel de pedidos', 'R$ 4.400', '15/10', ('recebido', 'calm'))]
cl = ''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding: 12px 0; {LINE}"><div><p style="margin: 0; font-size: 14px; font-weight: 600">{n}</p><p style="margin: 2px 0 0; font-size: 12px; color: #6E6E73">{d} · {dt}</p></div><div style="display: flex; align-items: center; gap: 10px">{pill(*p)}<span style="font-size: 15px; font-weight: 600; white-space: nowrap">{v}</span></div></div>' for n, d, v, dt, p in closed)
neg = [('Delta Log', 'Proposta', 'R$ 6.100'), ('Nuvem Labs', 'Conversa', 'R$ 5.500'), ('Acme', 'Proposta', 'R$ 4.800')]
ng = ''.join(f'<div style="display: flex; justify-content: space-between; padding: 10px 0; {LINE}; font-size: 14px"><span style="font-weight: 500">{n} <span style="color: #6E6E73">{s}</span></span><span style="font-weight: 600">{v}</span></div>' for n, s, v in neg)
ng += f'<div style="display: flex; justify-content: space-between; padding: 10px 0; {LINE}; font-size: 14px; color: #6E6E73"><span>Mais 4 oportunidades</span><span>R$ 12.700</span></div>'

def stat(lbl, val, note, extra=''):
    return f'<div style="{CARD}; padding: 22px 24px; display: flex; flex-direction: column; gap: 6px"><p style="margin: 0; font-size: 14px; font-weight: 500; color: #6E6E73">{lbl}</p><p style="margin: 0; font-size: 44px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; white-space: nowrap">{val}</p><p style="margin: 0; font-size: 14px; color: #3C3B3A">{note}</p>{extra}</div>'

body = f'''    <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">
      {stat("Fechado em outubro", "R$ 12.400", "R$ 9.400 recebido · R$ 3.000 a receber")}
      {stat("Em negociação", "R$ 29.100", "7 oportunidades em Conversa e Proposta")}
      {stat("Falta para a meta", "R$ 7.600", "Meta de R$ 20.000 · faltam 5 dias", '<div style="margin-top: 6px">' + bar(62, R, 8) + '</div>')}
    </section>
    <div style="display: grid; grid-template-columns: minmax(0, 1.6fr) minmax(0, 1fr); gap: 20px; align-items: start">
      <section style="{CARD}; padding: 22px 24px; display: flex; flex-direction: column; gap: 18px">
        <div><h2 style="margin: 0; font-size: 20px; font-weight: 700; letter-spacing: -0.02em">Fechado por mês</h2><p style="margin: 4px 0 0; font-size: 14px; color: #6E6E73">Melhor mês dos últimos seis. Falta R$ 7.600 para bater a meta.</p></div>
        {chart(240, '56%')}
      </section>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <section style="{CARD}; padding: 18px 22px"><p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Fechados em outubro</p>{cl}</section>
        <section style="{CARD}; padding: 18px 22px"><p style="margin: 0 0 4px; font-size: 15px; font-weight: 600">Em negociação</p>{ng}<p style="margin: 10px 0 0; font-size: 12px; color: #6E6E73">Lead não entra: ninguém demonstrou interesse ainda.</p></section>
      </div>
    </div>
'''
files['Grana.dc.html'] = web('Grana (web)', 'Grana', web_header('Grana', 'Outubro de 2026 · três números e um gráfico', btn('Exportar CSV', 'soft')), body)

body = (phone_header('Outubro de 2026', 'Grana')
        + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 18px; display: flex; flex-direction: column; gap: 10px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)">
    <p style="margin: 0; font-size: 13px; font-weight: 500; color: #6E6E73">Fechado no mês</p>
    <p style="margin: 0; font-size: 40px; font-weight: 700; letter-spacing: -0.04em; line-height: 1">R$ 12.400</p>
    <p style="margin: 0; font-size: 13px; color: #6E6E73">R$ 9.400 recebido · R$ 3.000 a receber</p>
  </div>
  <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin: 10px 16px 0">
    <div style="background: #FFFFFF; border-radius: 18px; padding: 14px 16px"><p style="margin: 0; font-size: 12px; font-weight: 500; color: #6E6E73">Em negociação</p><p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.03em">R$ 29.100</p></div>
    <div style="background: #FFFFFF; border-radius: 18px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px"><div><p style="margin: 0; font-size: 12px; font-weight: 500; color: #6E6E73">Falta pra meta</p><p style="margin: 4px 0 0; font-size: 22px; font-weight: 700; letter-spacing: -0.03em">R$ 7.600</p></div>{bar(62, R, 6)}</div>
  </div>
  <div style="margin: 10px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px">
    <p style="margin: 0 0 6px; font-size: 15px; font-weight: 600">Fechado por mês</p>
    {chart(140, '62%')}
  </div>
  <div style="margin: 10px 16px 0; background: #1D1D1F; color: #F5F5F7; border-radius: 18px; padding: 14px 16px; font-size: 14px; line-height: 1.4"><strong style="font-weight: 600">Mr. Wolf:</strong> fecha Acme e Orbita e outubro bate R$ 20.100.</div>
''')
files['GranaMobile.dc.html'] = phone('Grana (celular)', 'Grana', body)

for name, html in files.items():
    with open(os.path.join(OUT, name), 'w') as f:
        f.write(html)
    print(name, len(html))
