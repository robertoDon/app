# Capítulo 6: contra quem a gente joga (a partir de Dalva_Inteligencia_Competitiva 2.0, Don, 27/10/2026).
import os
HERE = os.path.dirname(os.path.abspath(__file__))
exec(open(os.path.join(HERE, 'gen_brand.py')).read().replace("open(os.path.join(OUT, name), 'w').write(html)", "pass"))

CARD = f'background: #FFFFFF; border: 1px solid {LINE}; border-radius: 20px'
def p(t, size=15, color=INK2, extra=''):
    return f'<p style="margin: 0; font-size: {size}px; line-height: 1.5; color: {color}; {extra}">{t}</p>'
def h3(t, color=NOITE, size=24):
    return f'<h3 style="margin: 6px 0 0; font-size: {size}px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2; color: {color}">{t}</h3>'
def tag(t, kind):
    # Estado sempre com texto + forma + cor.
    if kind == 'livre':
        return f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: {CORAL}; color: {NOITE}; font-size: 12px; font-weight: 700; white-space: nowrap"><span style="width: 7px; height: 7px; border-radius: 50%; background: {NOITE}"></span>{t}</span>'
    if kind == 'fora':
        return f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: 2px 9px; border-radius: 999px; border: 1px dashed {MUTE}; color: {MUTE}; font-size: 12px; font-weight: 600; white-space: nowrap"><span style="width: 8px; height: 1.5px; background: {MUTE}"></span>{t}</span>'
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; background: {BRUMA}; color: {INK2}; font-size: 12px; font-weight: 600; white-space: nowrap"><span style="width: 7px; height: 7px; border-radius: 2px; background: {INK2}"></span>{t}</span>'

# 1 · Ranking de ameaça (nota ponderada em 5 eixos, aba Ameaça).
RANK = [
    ('WhatsApp + planilha', 4.50, 'Permanente', 'Custo zero, zero curva, zero alimentação. Não reage nem precisa.'),
    ('Agendor', 4.40, 'Já em curso', 'Já vende leads por perfil de CNPJ, a R$ 3 cada. Grátis até 3 usuários.'),
    ('IA generalista', 3.90, '12 a 24 meses', 'Google AI Plus, R$ 24,99, busca e escreve. Falta estrutura.'),
    ('RD Station CRM', 3.80, '12 a 24 meses', 'Maior base do SMB. Não desce de preço por margem, não por técnica.'),
    ('Kommo', 3.55, '12 meses', 'IA de mensagem e WhatsApp nativo já no plano de entrada.'),
    ('Leads2b', 3.30, 'Já existe', 'Maior sobreposição de trabalho. A R$ 367, atende outro bolso.'),
    ('SDR júnior ou agência', 3.20, 'Permanente', 'Faz as cinco jornadas com julgamento humano. R$ 1.948 a R$ 10.900.'),
]
rows = ''
for i, (n, s, hz, why) in enumerate(RANK):
    w = s / 5 * 100
    c = NOITE if i < 2 else INK2
    rows += f'''<li style="display: grid; grid-template-columns: 190px minmax(0, 1fr) 52px; gap: 16px; align-items: center; padding: 16px 0; border-top: 1px solid {LINE}">
      <div><p style="margin: 0; font-size: 15px; font-weight: 600; color: {NOITE}">{n}</p>{p(hz, 12, MUTE)}</div>
      <div style="display: flex; flex-direction: column; gap: 6px">
        <div style="height: 10px; border-radius: 999px; background: {BRUMA}"><div style="width: {w:.0f}%; height: 10px; border-radius: 999px; background: {c}"></div></div>
        {p(why, 13, INK2)}
      </div>
      <p style="margin: 0; text-align: right; font-family: {DISPLAY}; font-size: 20px; font-weight: 700; font-variant-numeric: tabular-nums; color: {NOITE}">{f"{s:.2f}".replace(".", ",")}</p>
    </li>'''
rank = f'''<div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
    <div>{kick("Ameaça, de 0 a 5")}{h3("O maior concorrente não é uma empresa. É um hábito.")}
    {p("Nota ponderada: sobreposição de público, de trabalho e de preço, facilidade de troca e capacidade de reação.", 14, MUTE, "margin-top: 6px")}</div>
    <ol style="margin: 0; padding: 0; list-style: none">{rows}</ol>
  </div>'''

# 2 · Territórios de posicionamento.
TER = [
    ('CRM fácil', 'RD Station, Agendor, Bigin, Attio', 'ocupado'),
    ('CRM com WhatsApp', 'Kommo, Ollow, Clint, Ideal Sales', 'ocupado'),
    ('Prospecção inteligente', 'Leads2b, Ramper, Driva: tudo acima de R$ 367', 'ocupado'),
    ('Base de empresas brasileiras', 'Econodata, Speedio, CNPJá, CFO', 'ocupado'),
    ('SDR com IA', 'eesier e estrangeiros, em preço alto', 'ocupado'),
    ('Assistente comercial do fundador', 'Ninguém com clareza.', 'livre'),
]
ter_rows = ''.join(f'''<li style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 12px 0; border-top: 1px solid rgba(255,255,255,0.12)">
      <div><p style="margin: 0; font-size: 15px; font-weight: 600; color: {"#FFFFFF" if k == "livre" else "#D2D2D7"}">{t}</p>{p(o, 13, "#8A8D99")}</div>
      {tag("Livre", "livre") if k == "livre" else f'<span style="display: inline-flex; align-items: center; gap: 6px; padding: 3px 10px; border-radius: 999px; border: 1px solid rgba(255,255,255,0.2); color: #8A8D99; font-size: 12px; font-weight: 600"><span style="width: 7px; height: 7px; border-radius: 2px; background: #8A8D99"></span>Tem dono</span>'}
    </li>''' for t, o, k in TER)
terr = f'''<div style="background: {NOITE}; border-radius: 20px; padding: 28px; display: flex; flex-direction: column; gap: 12px">
    {kick("Território", CORAL)}
    <p style="margin: 0; font-family: {DISPLAY}; font-size: 34px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.12; color: #FFFFFF">Seis territórios. Cinco já têm dono.</p>
    <ul style="margin: 0; padding: 0; list-style: none">{ter_rows}</ul>
    <div style="margin-top: auto; padding-top: 14px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; flex-direction: column; gap: 8px">
      {p("FRASE EM TESTE", 12, CORAL, "font-weight: 700; letter-spacing: 0.08em")}
      <p style="margin: 0; font-family: {DISPLAY}; font-size: 20px; font-weight: 700; letter-spacing: -0.02em; line-height: 1.3; color: #FFFFFF">“Encontre empresas para vender. Não perca o próximo passo.”</p>
      {p("Descreve o que o MVP entrega, sem prometer autonomia. Âncora de preço: o salário de um SDR, R$ 1.948 (Novo CAGED).", 14, "#D2D2D7")}
    </div>
  </div>'''

# 3 · Jornadas.
JOR = [
    (1, 'Encontrar empresas', 'Bem servida e barata', 'ocupado', 'CFO entrega 10.000 leads por R$ 17. Ninguém entrega decisor nesse preço.'),
    (2, 'Iniciar a conversa', 'Quase sem oferta', 'livre', 'Só Econodata e Cortex confirmam decisor. Nenhum dos dois publica preço.'),
    (3, 'Não perder o fio', 'Saturada e grátis', 'ocupado', 'RD Station e Agendor fazem bem, de graça. É o que o público já largou duas vezes.'),
    (4, 'Prioridade do dia', 'Só em plano caro', 'livre', 'RD Station Pro a R$ 131 por usuário. monday, só com 3 licenças.'),
    (5, 'Ver o resultado', 'Qualquer CRM faz', 'ocupado', 'Relatório de funil é item de tabela. Não diferencia.'),
]
jor = ''.join(f'''<div style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 10px">
      <span style="font-family: {DISPLAY}; font-size: 13px; font-weight: 700; color: {MUTE}">Jornada {n}</span>
      <h3 style="margin: 0; font-size: 19px; font-weight: 700; letter-spacing: -0.02em">{t}</h3>
      <div>{tag(s, "livre" if k == "livre" else "ocupado")}</div>
      {p(b, 14)}
    </div>''' for n, t, s, k, b in JOR)
jor_sec = f'''<section style="display: flex; flex-direction: column; gap: 16px">
    <div style="display: flex; justify-content: space-between; align-items: end; gap: 24px">
      <div>{kick("As cinco jornadas")}{h3("A Dalva não vence nenhuma sozinha. O produto é a continuidade entre elas.")}</div>
      {p("Avaliação documental: nenhum concorrente foi testado por dentro.", 13, MUTE, "white-space: nowrap")}
    </div>
    <div style="display: grid; grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 20px">{jor}</div>
  </section>'''

# 4 · A conta que decide: custo do dado por empresa enriquecida, R$ 19,90, 50 créditos.
# Sobra por assinante antes do dado: 19,90 - 0,28 (infra) - 1,09 (gateway) = 18,53.
SOBRA = 18.53
CEN = [
    ('R$ 0,0125', 0.0125, 'Planilha do David', 'Parece contar só a IA, sem a busca na web. Confirmar com o David.'),
    ('R$ 0,10', 0.10, 'Nossa estimativa', 'Sócio vem grátis da Receita; até 2 buscas na web.'),
    ('R$ 2,40', 2.40, 'Preço da Speedio', 'Inclui telefone e e-mail do decisor. Outro produto.'),
]
def brl(v):
    s = f'{abs(v):,.2f}'.replace(',', 'X').replace('.', ',').replace('X', '.')
    return ('− ' if v < 0 else '') + 'R$ ' + s
cen = ''
for lbl, c, who, note in CEN:
    banca = int(SOBRA // c)
    m = SOBRA - 50 * c
    ok = m > 0
    res = (f'{tag("Fecha", "ocupado")}' if ok else f'{tag("Não fecha", "fora")}')
    cen += f'''<div style="padding: 18px; border-radius: 16px; background: {BRUMA if ok else "#FFFFFF"}; border: 1px {"solid" if ok else "dashed"} {LINE if ok else MUTE}; display: flex; flex-direction: column; gap: 8px">
      {p(who, 13, MUTE, "font-weight: 600")}
      <p style="margin: 0; font-family: {DISPLAY}; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums; color: {NOITE}">{lbl}</p>
      {p("por empresa", 12, MUTE)}
      <div style="padding-top: 8px; border-top: 1px solid {LINE}; display: flex; flex-direction: column; gap: 4px">
        {p(f'<strong style="{B}">{banca:,}'.replace(",", ".") + '</strong> empresas por mês cabem na assinatura', 13)}
        {p(f'Com 50 créditos: <strong style="{B}; white-space: nowrap">{brl(m)}</strong> de margem', 13)}
      </div>
      <div>{res}</div>
      {p(note, 13, MUTE)}
    </div>'''
conta = f'''<div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 14px">
    <div>{kick("A conta que decide")}{h3("Quanto custa enriquecer uma empresa?")}
    {p("Assinatura de R$ 19,90, já descontados infraestrutura (R$ 0,28) e gateway (R$ 1,09).", 14, MUTE, "margin-top: 6px")}</div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 12px">{cen}</div>
    {p(f'<strong style="{B}">Só medindo em 50 empresas reais se sabe.</strong> A medição precisa incluir o custo das buscas na web e conferir na mão se o sócio e os sinais batem.', 14)}
  </div>'''

# 5 · O que caiu e o que ficou de pé.
CAIU = [
    ('Existe um vão vazio abaixo de R$ 52.', 'Há 8 produtos pagos abaixo de R$ 50. Zoho Bigin, R$ 45,90, é feito para micro empresa.'),
    ('Ninguém junta prospecção e funil.', 'Leads2b (R$ 367), Exact Sales (R$ 896) e Ramper juntam. O Agendor já vende leads por CNPJ.'),
    ('A Dalva cobre 93% (ou 86%) do escopo.', 'Métrica circular: as funções saíram do escopo da própria Dalva.'),
    ('SDR de IA R$ 1.997, Dalva R$ 19,90.', 'Um SDR de IA executa; a Dalva sugere. O abismo de preço gera desconfiança.'),
]
caiu = ''.join(f'''<li style="padding: 12px 0; border-top: 1px solid {LINE}; display: flex; flex-direction: column; gap: 4px">
      <div style="display: flex; align-items: center; gap: 10px">{tag("Descartada", "fora")}<p style="margin: 0; font-size: 15px; font-weight: 600; color: {MUTE}">{t}</p></div>
      {p(b, 14)}
    </li>''' for t, b in CAIU)
PE = [
    ('A combinação, nesse preço, com dado brasileiro.', 'Nenhum dos 11 internacionais declara cobertura de empresas do Brasil.'),
    ('O conhecimento comercial da Don vira regra.', 'Saber o próximo passo certo é o que a Don vende por hora. Copiar exige refazer o produto.'),
    ('Distribuição própria.', 'Base, mentorados, podcast e Startup Summit: o canal que um ticket baixo consegue pagar.'),
]
pe = ''.join(f'''<li style="padding: 12px 0; border-top: 1px solid {LINE}; display: flex; gap: 12px">
      <span style="flex: none; margin-top: 5px; width: 10px; height: 10px; border-radius: 50%; background: {CORAL}; box-shadow: 0 0 0 2px {NOITE}"></span>
      <div><p style="margin: 0; font-size: 15px; font-weight: 600; color: {NOITE}">{t}</p>{p(b, 14, INK2, "margin-top: 2px")}</div>
    </li>''' for t, b in PE)
balanco = f'''<div style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 10px">
    <div>{kick("Revisão do quadro anterior")}{h3("Quatro afirmações caíram. Três ficaram de pé.")}</div>
    <ul style="margin: 0; padding: 0; list-style: none">{caiu}</ul>
    {p("FICOU DE PÉ", 12, NOITE, "margin-top: 8px; font-weight: 700; letter-spacing: 0.08em")}
    <ul style="margin: 0; padding: 0; list-style: none">{pe}</ul>
  </div>'''

body = (header('Capítulo 6 · concorrência', 'Contra quem a gente joga.',
               'A oportunidade existe, mas é mais estreita do que parecia: achar, abordar e priorizar num preço de micro empresa, com dado brasileiro.',
               f'<p style="margin: 0"><strong style="{B}">Fonte.</strong> Inteligência competitiva 2.0, Don, 27/10/2026. 46 produtos, preço da página oficial de cada um.</p>'
               f'<p style="margin: 10px 0 0">Nenhum concorrente foi testado por dentro. Toda comparação é documental.</p>')
        + f'''
  <section style="display: grid; grid-template-columns: minmax(0, 1.55fr) minmax(0, 1fr); gap: 20px">{rank}{terr}</section>
  {jor_sec}
  <section style="display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 20px; align-items: start">{conta}{balanco}</section>''')
open(os.path.join(OUT, 'Concorrencia.dc.html'), 'w').write(page('Contra quem a gente joga', 1440, 2290, body, bg=BRUMA))
print('ok')
