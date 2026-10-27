# Capítulo 5: como funciona por baixo (mecanismo da Caçada, tipos de dado, regras do Hoje e custos).
import os
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'gen_brand.py')).read().replace("open(os.path.join(OUT, name), 'w').write(html)", "pass"))

CARD = f'background: #FFFFFF; border: 1px solid {LINE}; border-radius: 20px'
def card(inner, extra=''):
    return f'<div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px; {extra}">{inner}</div>'
def p(t, size=15, color=INK2, extra=''):
    return f'<p style="margin: 0; font-size: {size}px; line-height: 1.5; color: {color}; {extra}">{t}</p>'

# Quem faz cada passo: texto + forma + cor.
WHO = {
    'voce': ('Você', '#FFFFFF', NOITE, f'1px solid {NOITE}', '●'),
    'auto': ('Automático', '#EFECE6', INK2, '1px solid #EFECE6', '↻'),
    'ia':   ('IA', '#E8ECF3', AZUL, '1px solid #E8ECF3', '✦'),
    'cred': ('1 crédito', '#F5E6D0', '#8F550E', '1px solid #F5E6D0', '◆'),
}
def who(k):
    t, bg, fg, bd, ic = WHO[k]
    return f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 999px; background: {bg}; color: {fg}; border: {bd}; white-space: nowrap"><span aria-hidden="true">{ic}</span>{t}</span>'

# ---------- Board 1: o motor da Caçada ----------
steps = [
    ('1', 'Frase', 'Você escreve para quem vende, como falaria para um amigo.', ['voce'], 'grátis'),
    ('2', 'Interpreta', 'A IA vira a frase em filtros (setor, estado, porte, idade) e mostra “Entendi assim” para você corrigir.', ['ia'], '~R$ 0,01'),
    ('3', 'Busca na base', 'Filtra a base de CNPJ da Receita, que baixamos todo mês para o nosso banco. Empresa e sócios vêm daqui.', ['auto'], 'grátis'),
    ('4', 'Escolhe', 'Você marca as que fazem sentido. Quem já está no Pipeline aparece apagado.', ['voce'], 'grátis'),
    ('5', 'Enriquece', 'Só nas escolhidas: site, Google Maps, vagas abertas, notícias. Sem resultado, não cobra.', ['cred'], 'até ~R$ 0,10'),
    ('6', 'Motivo e mensagem', 'A IA escreve o “por que agora” e um rascunho no seu tom. Você revisa e manda.', ['ia', 'voce'], '~R$ 0,01'),
]
flow = ''
for i, (n, t, d, ws, cost) in enumerate(steps):
    arrow = '' if i == len(steps) - 1 else f'<span aria-hidden="true" style="position: absolute; right: -17px; top: 44px; font-size: 18px; color: {MUTE}">→</span>'
    flow += f'''<div style="position: relative; {CARD}; padding: 18px; display: flex; flex-direction: column; gap: 10px">
        <div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 13px; font-weight: 600; color: {MUTE}">{n}</span><span style="font-size: 13px; font-weight: 600; font-variant-numeric: tabular-nums">{cost}</span></div>
        <h3 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em">{t}</h3>
        {p(d, 14)}
        <div style="margin-top: auto; display: flex; gap: 6px; flex-wrap: wrap">{"".join(who(w) for w in ws)}</div>
        {arrow}
      </div>'''

loop = f'''<div style="background: {NOITE}; color: {BRUMA}; border-radius: 20px; padding: 24px 28px; display: grid; grid-template-columns: 260px 1fr 1fr 1fr; gap: 28px; align-items: start">
    <div style="display: flex; flex-direction: column; gap: 8px">{kick("Toda noite", CORAL)}<h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em; color: #FFFFFF">É isso que sustenta o “enquanto você dorme”.</h3></div>
    {p(f'<strong style="color: #FFFFFF">Roda de novo o passo 3</strong> com os filtros salvos, às 3h. Só na base: não gasta busca na web nem crédito.', 15, '#D2D2D7')}
    {p(f'<strong style="color: #FFFFFF">Tira o que você já viu</strong>, pelo CNPJ: empresas já mostradas, descartadas ou no Pipeline.', 15, '#D2D2D7')}
    {p(f'<strong style="color: #FFFFFF">Avisa só o que é novo.</strong> Sem novidade, o Hoje diz “nada novo nesta caçada” e não insiste.', 15, '#D2D2D7')}
  </div>'''

def tier(kick_t, title, items, dark=False):
    bg, fg, sub = (NOITE, '#FFFFFF', '#D2D2D7') if dark else ('#FFFFFF', NOITE, INK2)
    lis = ''.join(f'<li style="padding: 10px 0; border-top: 1px solid {"rgba(255,255,255,0.12)" if dark else LINE}; font-size: 15px; line-height: 1.45; color: {sub}">{x}</li>' for x in items)
    return f'''<div style="background: {bg}; border: 1px solid {NOITE if dark else LINE}; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 10px">
      {kick(kick_t, CORAL if dark else MUTE)}<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: {fg}">{title}</h3>
      <ul style="margin: 4px 0 0; padding: 0; list-style: none">{lis}</ul></div>'''

tiers = (tier('Dá para fazer já', 'Custo quase zero.', [
            '<strong>Empresa certa:</strong> setor, porte, cidade, idade e situação, direto da Receita.',
            '<strong>O sócio-administrador.</strong> Em empresas de 1 a 10 pessoas, costuma ser quem decide. Dado oficial.',
            '<strong>Busca toda noite</strong>, só com empresas novas.'])
         + tier('Dá, com crédito', 'Só nas empresas escolhidas.', [
            '<strong>Site, telefone comercial e Instagram</strong> da empresa.',
            '<strong>Nota e número de avaliações</strong> no Google Maps.',
            '<strong>Vaga aberta</strong> (vendas, marketing, dev) e notícia recente.',
            'O “por que agora”, montado com esses sinais.'])
         + tier('Não prometemos', 'Mesmo que o cliente peça.', [
            '<strong>WhatsApp ou celular pessoal</strong> do sócio. Risco de LGPD, e o telefone da Receita muitas vezes é do contador.',
            '<strong>Intenção de compra</strong> como fato. É sempre hipótese.',
            '<strong>Lead “aquecido” sem contato.</strong> Quem aquece é a conversa.'], dark=True))

motor = (header('Capítulo 5 · como funciona por baixo', 'O motor da Caçada.',
                'Seis passos, do que você escreve até a mensagem pronta. Cada um diz quem faz e quanto custa.',
                f'<p style="margin: 0"><strong style="{B}">Como ler.</strong> {who("voce")} {who("auto")} {who("ia")} {who("cred")}</p>'
                f'<p style="margin: 10px 0 0">Custos com dólar a R$ 5,10, como no capítulo 4. Estimativas para conferir no protótipo.</p>')
         + f'''
  <section style="display: grid; grid-template-columns: repeat(6, minmax(0, 1fr)); gap: 20px">{flow}</section>
  {loop}
  <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">{tiers}</section>''')
files['Motor.dc.html'] = page('O motor da Caçada', 1440, 1240, motor, bg=BRUMA)

# ---------- Board 2: cada dado diz de onde veio ----------
def badge(kind):
    return {
        'oficial': f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 6px; background: {NOITE}; color: #FFFFFF; white-space: nowrap">✓ Receita · set/26</span>',
        'web': f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; border: 1px solid {NOITE}; color: {NOITE}; white-space: nowrap">↗ site da empresa · 22/10</span>',
        'inferido': f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 3px 8px; border-radius: 6px; border: 1px dashed #8A8D99; color: {INK2}; white-space: nowrap">? provável</span>',
        'hipotese': f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; font-style: italic; padding: 4px 9px; border-radius: 6px; background: #E8ECF3; color: {AZUL}; white-space: nowrap">~ hipótese</span>',
        'gerado': f'<span style="display: inline-flex; align-items: center; gap: 5px; font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 6px; background: #FFE9DF; color: #8A3A14; white-space: nowrap">✦ rascunho da Dalva</span>',
    }[kind]

rows = [
    ('oficial', 'Oficial', 'CNPJ, situação, setor (CNAE), cidade, data de abertura, sócios.', 'Mostra a fonte e o mês da base. É o único que aparece sem ressalva.'),
    ('web', 'Encontrado na web', 'Site, telefone comercial, Instagram, nota no Google, vaga aberta, notícia.', 'Link para a fonte e a data em que a Dalva viu. Mais de 90 dias: a data fica âmbar.'),
    ('inferido', 'Inferido', 'Cargo de alguém, tamanho real do time, se a empresa está ativa.', 'Sempre “provável”. Nunca vira filtro nem entra no título do card.'),
    ('hipotese', 'Hipótese', '“Pode precisar de site novo”, “está crescendo”.', 'Só no “por que agora”, com o sinal que levou a ela ao lado.'),
    ('gerado', 'Gerado pela IA', 'Mensagem sugerida, resumo, motivo de prioridade.', 'Rascunho até você revisar. Nada sai sem você.'),
]
table = ''.join(f'''<tr style="border-top: 1px solid {LINE}">
      <td style="padding: 16px 20px; vertical-align: top; width: 210px">{badge(k)}</td>
      <td style="padding: 16px 12px; vertical-align: top; width: 170px; font-size: 15px; font-weight: 600">{t}</td>
      <td style="padding: 16px 12px; vertical-align: top; font-size: 15px; line-height: 1.45; color: {INK2}">{ex}</td>
      <td style="padding: 16px 20px; vertical-align: top; font-size: 15px; line-height: 1.45; color: {INK2}">{rule}</td></tr>''' for k, t, ex, rule in rows)
table = f'''<section style="{CARD}; overflow: hidden"><table style="width: 100%; border-collapse: collapse">
    <thead><tr style="text-align: left; font-size: 13px; color: {MUTE}"><th style="padding: 14px 20px; font-weight: 600">Selo na tela</th><th style="padding: 14px 12px; font-weight: 600">Tipo</th><th style="padding: 14px 12px; font-weight: 600">Exemplos</th><th style="padding: 14px 20px; font-weight: 600">Regra</th></tr></thead>
    <tbody>{table}</tbody></table></section>'''

def line(label, value, kind):
    return f'<div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 11px 0; border-top: 1px solid {LINE}"><div><p style="margin: 0; font-size: 12px; color: {MUTE}">{label}</p><p style="margin: 2px 0 0; font-size: 15px; font-weight: 500">{value}</p></div>{badge(kind).replace("site da empresa · 22/10", "Gupy · 22/10") if label == "Sinal" else badge(kind)}</div>'
lead = card(f'''<div style="display: flex; justify-content: space-between; align-items: flex-start; gap: 12px"><div>{kick("Lead com motivo")}<h3 style="margin: 6px 0 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em">Ilha Digital</h3>{p("Agência de marketing · Florianópolis · desde 2017", 14, MUTE)}</div></div>
    <div>{line("Sócio-administrador", "Paulo R.", "oficial")}{line("Site e telefone comercial", "ilhadigital.com.br · (48) 3xxx", "web")}{line("Sinal", "Vaga aberta: executivo de vendas", "web")}{line("Leitura", "Está montando time comercial", "hipotese")}</div>
    <div style="background: {BRUMA}; border-radius: 14px; padding: 14px 16px; display: flex; flex-direction: column; gap: 8px"><div style="display: flex; justify-content: space-between; align-items: center"><span style="font-size: 13px; font-weight: 600">Por que agora</span>{badge("gerado")}</div>{p("Abriram vaga de vendas há 5 dias. Quem monta time comercial costuma precisar de site e funil prontos para receber os leads.", 14)}</div>''')

warm = card(f'''{kick("Aquecimento em 3 passos")}<h3 style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.03em">O lead chega aquecido porque a Dalva planejou o contato, não porque comprou um dado.</h3>
    <ol style="margin: 6px 0 0; padding: 0; list-style: none; display: flex; flex-direction: column">
      <li style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid {LINE}"><span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 700; width: 20px">1</span><div><p style="margin: 0; font-size: 15px; font-weight: 600">Hoje: aparecer</p>{p("Seguir a empresa e comentar um post de verdade. A Dalva sugere qual.", 14)}</div></li>
      <li style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid {LINE}"><span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 700; width: 20px">2</span><div><p style="margin: 0; font-size: 15px; font-weight: 600">Em 2 dias: a mensagem</p>{p("Citando o motivo (a vaga, o post). Canal comercial da empresa: site, e-mail ou LinkedIn.", 14)}</div></li>
      <li style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid {LINE}"><span style="font-family: {DISPLAY}; font-size: 20px; font-weight: 700; width: 20px">3</span><div><p style="margin: 0; font-size: 15px; font-weight: 600">Em 5 dias: o follow-up</p>{p("Se não respondeu. Depois disso, a Dalva sugere parar e tirar do funil.", 14)}</div></li>
    </ol>
    <p style="margin: 0; font-size: 13px; color: {MUTE}">Cada passo vira uma ação no Hoje, no dia certo.</p>''')

lgpd = f'''<div style="background: {NOITE}; color: {BRUMA}; border-radius: 20px; padding: 24px; display: flex; flex-direction: column; gap: 10px">
    {kick("LGPD: regras desde o dia 1", CORAL)}<h3 style="margin: 0; font-size: 22px; font-weight: 700; letter-spacing: -0.025em; color: #FFFFFF">Dado público não é dado livre.</h3>
    <ul style="margin: 0; padding: 0; list-style: none">{"".join(f'<li style="padding: 9px 0; border-top: 1px solid rgba(255,255,255,0.12); font-size: 14px; line-height: 1.45; color: #D2D2D7">{x}</li>' for x in [
        "Só canais comerciais da empresa. Nada de contato pessoal de pessoa física.",
        "Toda mensagem diz de onde veio o contato e como pedir para sair.",
        "Pedido de exclusão apaga a pessoa de todas as contas, não só de uma.",
        "MEI é tratado como pessoa física: sem enriquecimento.",
        "Parecer de advogado antes do teste aberto."])}</ul></div>'''

dados = (header('Capítulo 5 · como funciona por baixo', 'Cada dado diz de onde veio.',
                'Cinco tipos, cada um com um selo diferente na tela: texto, forma e cor, como os estados. É regra da arquitetura de dados, não só da interface.')
         + f'''
  {table}
  <section style="display: grid; grid-template-columns: 1fr 1fr 0.9fr; gap: 20px; align-items: start">{lead}{warm}{lgpd}</section>''')
files['Dados.dc.html'] = page('Cada dado diz de onde veio', 1440, 1370, dados, bg=BRUMA)

# ---------- Board 3: as 5 perguntas, respondidas ----------
Q = [
    ('De onde vem cada informação?',
     'Empresa e sócio: base de CNPJ da Receita. Site, nota, vaga e notícia: web, só ao enriquecer, sempre com fonte e data.',
     'Só do seu Pipeline: datas, etapas, valores e o que você registrou. Nada de fora.'),
    ('Como decide o que recomendar?',
     'A IA só traduz a frase em filtros, e você vê e corrige. A ordem da lista é regra: quanto bate com os filtros, depois quem tem site ativo.',
     'Regra fixa, sem IA: 1) compromisso prometido vencido ou de hoje; 2) proposta parada; 3) conversa parada. Desempate: etapa, dias parado, valor. A IA só escreve a frase do motivo.'),
    ('O que é automático e o que depende de você?',
     'Automático: busca toda noite, tirar repetidas, apagar quem já está no Pipeline. Você: escolher, enriquecer e mandar.',
     'Automático: montar as 3 do dia às 6h. Você: concluir, adiar com motivo ou registrar o desfecho em um toque.'),
    ('Qual o custo máximo de cada operação?',
     'Buscar: R$ 0. Interpretar: ~R$ 0,01. Enriquecer: teto de 2 buscas na web, ~R$ 0,10. Mensagem: ~R$ 0,01.',
     'Ordenar: R$ 0. Frase do motivo: menos de R$ 0,01 por dia.'),
    ('E quando não acha, erra ou falha?',
     'Frase vaga: faz uma pergunta só. Zero resultados: sugere afrouxar um filtro. Enriquecimento vazio: diz “não achei” e não cobra.',
     'Pipeline vazio: “Hoje está limpo. Quer caçar?”. Falta data: pergunta, não adivinha. Adiado 2 vezes: “Ainda faz sentido?”.'),
]
qrows = ''.join(f'''<tr style="border-top: 1px solid {LINE}">
      <td style="padding: 16px 20px; vertical-align: top; width: 300px"><span style="font-size: 13px; font-weight: 600; color: {MUTE}">{i}</span><p style="margin: 2px 0 0; font-size: 17px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.35">{q}</p></td>
      <td style="padding: 16px 12px; vertical-align: top; font-size: 15px; line-height: 1.5; color: {INK2}">{c}</td>
      <td style="padding: 16px 20px; vertical-align: top; font-size: 15px; line-height: 1.5; color: {INK2}">{h}</td></tr>''' for i, (q, c, h) in enumerate(Q, 1))
qtable = f'''<section style="{CARD}; overflow: hidden"><table style="width: 100%; border-collapse: collapse">
    <thead><tr style="text-align: left; font-size: 13px; color: {MUTE}"><th style="padding: 14px 20px; font-weight: 600">Pergunta</th><th style="padding: 14px 12px; font-weight: 600">Caçada</th><th style="padding: 14px 20px; font-weight: 600">Hoje</th></tr></thead>
    <tbody>{qrows}</tbody></table></section>'''

def opt(t, on=False):
    return f'<span style="font-size: 14px; font-weight: 600; padding: 10px 14px; border-radius: 999px; background: {NOITE if on else "#FFFFFF"}; color: {"#FFFFFF" if on else INK2}; border: 1px solid {NOITE if on else LINE}">{t}</span>'
toque = card(f'''{kick("Registro em um toque")}<h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em">Depois de cada contato, uma pergunta só.</h3>
    {p("Sem agenda, e-mail e WhatsApp integrados, é isso que mantém o Hoje certo. Nenhum campo para digitar.", 15)}
    <div style="background: {BRUMA}; border-radius: 16px; padding: 18px; display: flex; flex-direction: column; gap: 12px">
      <p style="margin: 0; font-size: 15px; font-weight: 600">Como foi com a Ilha Digital?</p>
      <div style="display: flex; flex-wrap: wrap; gap: 8px">{opt("Respondeu")}{opt("Não respondeu", True)}{opt("Reunião marcada")}{opt("Sem interesse")}</div>
      <div style="display: flex; justify-content: space-between; align-items: center; gap: 10px; padding-top: 10px; border-top: 1px solid {LINE}"><span style="font-size: 14px; color: {INK2}">Próximo passo: <strong style="color: {NOITE}">follow-up na seg, 3/11</strong></span><span style="font-size: 13px; font-weight: 600; text-decoration: underline">mudar</span></div>
    </div>
    {p("“Sem interesse” pede o motivo em um toque e tira do funil como perdido.", 13, MUTE)}''')

def crow(op, val, note=''):
    return f'<div style="display: flex; justify-content: space-between; gap: 12px; padding: 10px 0; border-top: 1px solid {LINE}"><div><p style="margin: 0; font-size: 15px; font-weight: 500">{op}</p>{p(note, 13, MUTE) if note else ""}</div><span style="font-size: 15px; font-weight: 600; font-variant-numeric: tabular-nums; white-space: nowrap">{val}</span></div>'
creditos = card(f'''{kick("Pra decidir com o David")}<h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em">Quantos créditos por mês?</h3>
    {p("O capítulo 4 contou 20 buscas na web por pessoa. As telas falam em 50 créditos. Com teto de 2 buscas por crédito e todo mundo usando tudo:", 15)}
    <div>{crow("20 créditos", "71–83%", "margem do plano mensal, de 100 a 5.000 clientes")}{crow("50 créditos", "55–67%", "mesma conta, com 2,5 vezes mais enriquecimento")}</div>
    {p("Cache ajuda: a mesma empresa enriquecida para dois clientes no mês só paga a busca uma vez.", 13, MUTE)}''')

hoje = card(f'''{kick("Hoje: por que estas três")}<h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em">O motivo aparece em cada card.</h3>
    <div style="display: flex; flex-direction: column; gap: 8px">
      <div style="background: {BRUMA}; border-radius: 14px; padding: 14px 16px"><div style="display: flex; justify-content: space-between; gap: 8px"><span style="font-size: 15px; font-weight: 600">Mandar proposta à Orbita</span>{pill("Hoje", "today")}</div>{p("Você prometeu para hoje.", 13, MUTE, "margin-top: 4px")}</div>
      <div style="background: {BRUMA}; border-radius: 14px; padding: 14px 16px"><div style="display: flex; justify-content: space-between; gap: 8px"><span style="font-size: 15px; font-weight: 600">Retomar a Acme</span>{pill("6 dias", "late")}</div>{p("Proposta parada há 6 dias. Parada há mais tempo.", 13, MUTE, "margin-top: 4px")}</div>
      <div style="background: {BRUMA}; border-radius: 14px; padding: 14px 16px"><div style="display: flex; justify-content: space-between; gap: 8px"><span style="font-size: 15px; font-weight: 600">Follow-up na Nuvem Labs</span>{pill("2 dias", "late")}</div>{p("Conversa sem resposta desde quarta.", 13, MUTE, "margin-top: 4px")}</div>
    </div>
    {p("Se Projetos sair do MVP, o Hoje fica só com o que é comercial.", 13, MUTE)}''')

perguntas = (header('Capítulo 5 · como funciona por baixo', 'As cinco perguntas, respondidas.',
                    'As perguntas da análise do David, para os dois módulos que seguram o produto: a Caçada traz o cliente, o Hoje faz ele voltar.')
             + f'''
  {qtable}
  <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px; align-items: start">{hoje}{toque}{creditos}</section>''')
files['Perguntas.dc.html'] = page('As cinco perguntas', 1440, 1490, perguntas, bg=BRUMA)

for name in ['Motor.dc.html', 'Dados.dc.html', 'Perguntas.dc.html']:
    open(os.path.join(OUT, name), 'w').write(files[name])
print('ok')
