"""Quadro de marca do Follou (canvas/Main.dc.html), a partir do PDF de posicionamento de 30/10/2026.

Rodar de dentro de design/geradores:  python3 gen_marca.py
É um documento de marca, então segue o manual: claro, canto reto, Archivo nos títulos, Plex Mono no dado.
"""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from follou import *

OUT = os.path.join(os.path.dirname(__file__), '..', 'canvas', 'Main.dc.html')
FOTOS = {'camiseta': '/_blob/8d616adab138d7a32e9db54ebc3cb6a9', 'bone': '/_blob/f2e4d14931e98730d3e10dbdc2b19d31',
         'caneca': '/_blob/484e103dbc496d8f033dca212d250034', 'caderno': '/_blob/9892c02d8e0876bc5878f5b788ff4f65'}
W, H = 1440, 6480

def kicker(t, c=TINTA_MEDIA):
    return f'<p style="margin: 0; font-family: {MONO}; font-size: 12px; line-height: 16px; letter-spacing: 0.12em; text-transform: uppercase; color: {c}">{t}</p>'

def h2(t, c=TINTA):
    return f'<h2 style="margin: 0; font-family: {DISPLAY}; font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.03em; color: {c}">{t}</h2>'

def p(t, c=TINTA_MEDIA, size=16, lh=24, extra=''):
    return f'<p style="margin: 0; font-size: {size}px; line-height: {lh}px; color: {c}{extra}">{t}</p>'

def head(k, t, sub=None, dark=False):
    c1, c2 = (NEVE_FRACA, NEVE) if dark else (TINTA_MEDIA, TINTA)
    s = f'<div style="display: flex; flex-direction: column; gap: 12px; max-width: 880px">{kicker(k, c1)}{h2(t, c2)}'
    if sub: s += p(sub, NEVE_MEDIA if dark else TINTA_MEDIA, 18, 27)
    return s + '</div>'

BOX = f'background: {PAPEL}; border: 1px solid {LINHA_CLARA}'

def section(inner, gap=32):
    return f'<section style="display: flex; flex-direction: column; gap: {gap}px; padding-top: 48px; border-top: 1px solid {LINHA_CLARA}">{inner}</section>'

def vertical(h, text=NEVE, sym=SINAL):
    return (f'<span role="img" aria-label="Follou" style="display: inline-flex; flex-direction: column; align-items: center; gap: {round(h * 0.3)}px">'
            f'{symbol(h, sym)}<span aria-hidden="true" style="font-family: {DISPLAY}; font-weight: 600; font-size: {round(h * 1.1)}px; line-height: 1; letter-spacing: -0.02em; color: {text}">Follou</span></span>')

def endosso(h, text=NEVE, sub=NEVE_FRACA):
    f = round(h * 1.28)
    return (f'<span style="display: inline-flex; flex-direction: column; gap: {round(f * 0.3)}px">{wordmark(f, text)}'
            f'<span style="font-family: {SANS}; font-size: {max(10, round(f * 0.2))}px; line-height: 1; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: {sub}">um produto Don</span></span>')

# ---------- 1. abertura ----------
abertura = f'''
  <header style="display: grid; grid-template-columns: minmax(0, 1.1fr) minmax(0, 1fr); gap: 64px; align-items: end">
    <div style="display: flex; flex-direction: column; gap: 32px">
      {lockup(56, TINTA, SINAL_TINTA)}
      <div style="display: flex; flex-direction: column; gap: 16px">
        {kicker('Marca · v1 de 30/10/2026 · substitui a Dalva')}
        <h1 style="margin: 0; font-family: {DISPLAY}; font-size: 72px; line-height: 76px; font-weight: 600; letter-spacing: -0.035em">A jogada de hoje.</h1>
        {p('O conselho da manhã. Diz ao fundador qual decisão comercial vale mais hoje.', TINTA, 22, 32)}
      </div>
    </div>
    <dl style="margin: 0; display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 0; font-size: 16px; line-height: 24px">
      <dt style="padding: 16px 0; font-family: {MONO}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: {SINAL_TINTA}">Para quem</dt>
      <dd style="margin: 0; padding: 16px 0; color: {TINTA}">Fundador de startup de tecnologia, no começo da jornada. Empresa de 1 a 10 pessoas, vende para outras empresas, sem equipe comercial nem CRM. Compara com Clay, Attio e Apollo, não com caderno.</dd>
      <dt style="padding: 16px 0; border-top: 1px solid {LINHA_CLARA}; font-family: {MONO}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: {SINAL_TINTA}">Não é</dt>
      <dd style="margin: 0; padding: 16px 0; border-top: 1px solid {LINHA_CLARA}; color: {TINTA}">CRM, painel de indicadores, relatório nem coach. O produto não motiva: informa.</dd>
      <dt style="padding: 16px 0; border-top: 1px solid {LINHA_CLARA}; font-family: {MONO}; font-size: 12px; letter-spacing: 0.12em; text-transform: uppercase; color: {SINAL_TINTA}">É / não é</dt>
      <dd style="margin: 0; padding: 16px 0; border-top: 1px solid {LINHA_CLARA}; color: {TINTA}">Específico, não motivacional. Desperto, não decorativo. Direto, não abrangente.</dd>
    </dl>
  </header>'''

# ---------- 2. nome ----------
portoes = ''.join(
    f'<div style="{BOX}; padding: 20px; display: flex; flex-direction: column; gap: 8px">{kicker("Portão " + str(i + 1), SINAL_TINTA)}'
    f'<p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">{t}</p>{p(d, TINTA_MEDIA, 14, 20)}</div>'
    for i, (t, d) in enumerate([('Significado', 'Diz o que o produto faz sem precisar explicar.'), ('Boca', 'Cabe numa frase falada, sem soletrar e sem corrigir.'),
                                ('INPI', 'Livre nas classes 9, 35 e 42, as do produto.'), ('Domínio', '.com.br disponível, e a grafia defensiva também.')]))
tons = ''.join(
    f'<div style="{bg}; padding: 24px; display: flex; flex-direction: column; gap: 12px">{kicker(k, kc)}'
    f'<p style="margin: 0; font-family: {DISPLAY}; font-size: 24px; line-height: 30px; font-weight: 600; letter-spacing: -0.02em; color: {tc}">{q}</p>{p(d, dc, 14, 20)}</div>'
    for k, kc, q, d, bg, tc, dc in [
        ('Frouxo demais', ALERTA_TINTA, '“Qualquer coisa me avisa”', 'Devolve a bola e encerra o assunto. Ninguém volta.', BOX, TINTA, TINTA_MEDIA),
        ('O ponto certo', SINAL, '“E aí, follou?”', 'Insiste sem constranger. É pergunta de quem está junto.', f'background: {CARVAO}', NEVE, NEVE_MEDIA),
        ('Duro demais', ALERTA_TINTA, '“Qual o status do processo”', 'Vira auditoria. O cliente passa a responder por dever.', BOX, TINTA, TINTA_MEDIA)])
nome = section(f'''
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 64px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 20px">
        {head('Nome · significado', 'Follow up, dito em português, no passado.')}
        {p('Quem vende no Brasil já fala assim: “fazer o follow”, “o follow tá atrasado”, “e aí, follou?”. O nome não inventa um idioma; recolhe um que já existe no corredor comercial e assume a grafia que a boca já usa.')}
        {p('O passado é de propósito. Um produto que se chama “acompanhar” promete trabalho; um que se chama “acompanhou” promete a coisa feita. Lá fora, <strong style="color: {TINTA}">follou</strong> lê como uma forma de um verbo que todo mundo conhece.')}
      </div>
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="background: {CARVAO}; padding: 32px; display: flex; flex-direction: column; gap: 16px">
          {kicker('O teste da boca', SINAL)}
          <p style="margin: 0; font-family: {DISPLAY}; font-size: 36px; line-height: 40px; font-weight: 600; letter-spacing: -0.03em; color: {NEVE}">“Já follou a Pedrosa?”</p>
          {p('Vira verbo sozinho, sem campanha e sem manual. Nome que o cliente conjuga é nome que o cliente lembra.', NEVE_MEDIA, 15, 22)}
        </div>
        <p style="margin: 0; font-family: {MONO}; font-size: 14px; line-height: 20px; color: {TINTA}">follou.com.br · folou.com.br</p>
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 16px">{portoes}</div>
    <div style="display: flex; flex-direction: column; gap: 16px">
      {p('<strong style="color: {0}">O Brasil cobra de um jeito, e o nome já sabe disso.</strong> Aqui, cobrar é manter a relação viva enquanto o negócio anda.'.format(TINTA))}
      <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{tons}</div>
    </div>''')

# ---------- 3. símbolo e assinatura ----------
def tile(inner, label, dark=True, h=200):
    bg = CARVAO if dark else PAPEL
    bd = '' if dark else f'; border: 1px solid {LINHA_CLARA}'
    return (f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 10px"><div style="height: {h}px; background: {bg}{bd}; display: flex; align-items: center; justify-content: center">{inner}</div>'
            f'<figcaption style="font-family: {MONO}; font-size: 12px; line-height: 16px; letter-spacing: 0.08em; text-transform: uppercase; color: {TINTA_MEDIA}">{label}</figcaption></figure>')

tamanhos = ''.join(
    f'<div style="{BOX}; padding: 16px; display: flex; flex-direction: column; align-items: center; gap: 12px">'
    f'<div style="width: {s + 24}px; height: {s + 24}px; background: {CARVAO}; display: flex; align-items: center; justify-content: center">{g}</div>'
    f'<p style="margin: 0; font-family: {MONO}; font-size: 12px; line-height: 16px; color: {TINTA}">{lab}</p>{p(d, TINTA_MEDIA, 13, 18, "; text-align: center")}</div>'
    for s, g, lab, d in [(72, symbol(round(72 * 641 / 782), SINAL), '96 px', 'Os dois pés e o avanço do segundo traço legíveis.'),
                         (40, symbol(round(40 * 641 / 782), SINAL), '56 px', 'Aguenta, com o traço engrossado de 14 para 15.'),
                         (24, symbol(round(24 * 641 / 782), SINAL), '32 px · o piso', 'Abaixo disso os pés fecham e lê como pausa.'),
                         (16, single(16, SINAL), '16 px · variante', 'Favicon usa o glifo de traço único. Um traço não colapsa.')])
simbolo = section(f'''
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1.2fr); gap: 64px; align-items: center">
      <div style="display: flex; flex-direction: column; gap: 20px">
        {head('Símbolo', 'O defeito do nome virou o símbolo.')}
        {p('O duplo L era o problema: dois traços iguais, colados, que qualquer um erraria ao escrever. Em vez de esconder, a marca virou para ele. São dois L, um deslocado do outro, cada um feito de uma haste reta e de um quarto de círculo no canto.')}
        {p('O vão entre os dois nunca fecha. É ele que diz que são duas coisas, não uma: o que foi feito e o que ainda falta.')}
        <pre style="margin: 0; padding: 16px; {BOX}; font-family: {MONO}; font-size: 13px; line-height: 20px; color: {TINTA}">haste t        = 130
altura do L    = 502 (3,86 t)
largura do L   = 344 (2,65 t)
raio externo   = 225 · raio interno 95
2º L           = +437 x, +140 y
ponta          = reta, nunca arredondada</pre>
      </div>
      <div style="height: 520px; background: {CARVAO}; display: flex; align-items: center; justify-content: center">{symbol(300, SINAL, 'Símbolo do Follou')}</div>
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px">
      {tile(lockup(48, NEVE, SINAL), 'Horizontal · o padrão')}
      {tile(vertical(48), 'Vertical')}
      {tile(symbol(64, SINAL), 'Só o símbolo')}
      {tile(endosso(32), 'Endosso')}
    </div>
    <div style="display: grid; grid-template-columns: 2fr 1fr 1fr 1fr; gap: 16px">
      {tile(lockup(48, TINTA, SINAL_TINTA), 'Horizontal no claro', dark=False)}
      {tile(symbol(64, NEVE), 'Uma cor · neve', h=200)}
      {tile(symbol(64, TINTA), 'Uma cor · tinta', dark=False)}
      {tile(endosso(32, TINTA, TINTA_MEDIA), 'Endosso no claro', dark=False)}
    </div>
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 32px; align-items: start">
      <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 12px">{tamanhos}</div>
      <div style="background: {AREIA}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
        <p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">Medidas e endosso</p>
        {p('Tudo se mede pelo traço t. Símbolo ao logotipo: 1,4 t. Respiro em volta: 2 t. Assinatura completa a partir de 120 px. O logotipo alinha pela altura das maiúsculas: o F conversa com a haste.', TINTA, 14, 21)}
        {p('O endosso é texto, sempre: “um produto Don”, Plex Sans em caixa alta, entressaca 0,14 em, nunca maior que 20% do logotipo. Nunca o símbolo da Don ao lado do símbolo do Follou. Nunca abrir entressaca entre os dois L, quebrar a palavra em duas linhas nem desenhar um L diferente do outro.', TINTA, 14, 21)}
      </div>
    </div>''')

# ---------- 4. paleta ----------
def swatch_row(nome, hx, uso, cr, dark):
    tc, mc, ln = (NEVE, NEVE_FRACA, LINHA_ESCURA) if dark else (TINTA, TINTA_MEDIA, LINHA_CLARA)
    ring = f'box-shadow: inset 0 0 0 1px {ln}; ' if hx in (CARVAO, PAPEL) else ''
    return (f'<div style="display: grid; grid-template-columns: 40px minmax(0, 1fr) auto; gap: 16px; align-items: center; padding: 12px 0; border-top: 1px solid {ln}">'
            f'<span style="width: 40px; height: 40px; {ring}background: {hx}"></span>'
            f'<div><p style="margin: 0; font-size: 15px; line-height: 20px; font-weight: 600; color: {tc}">{nome}</p>'
            f'<p style="margin: 0; font-family: {MONO}; font-size: 12px; line-height: 16px; color: {mc}">{hx} · {uso}</p></div>'
            f'<span style="font-family: {MONO}; font-size: 14px; color: {tc}; font-variant-numeric: tabular-nums">{cr}</span></div>')

escuro = ''.join(swatch_row(*r, True) for r in [('Carvão', CARVAO, 'fundo, herdado', ''), ('Neve', NEVE, 'texto', '17,0'), ('Neve-média', NEVE_MEDIA, 'apoio', '11,2'),
                                                ('Neve-fraca', NEVE_FRACA, 'legenda, 14 px ou mais', '5,4'), ('Sinal', SINAL, 'a ação de hoje', '9,6'), ('Alerta', ALERTA, 'o que está vencendo', '7,3')])
claro = ''.join(swatch_row(*r, False) for r in [('Papel', PAPEL, 'fundo, herdado', ''), ('Tinta', TINTA, 'texto', '16,8'), ('Tinta-média', TINTA_MEDIA, 'apoio', '7,4'),
                                                ('Tinta-fraca', TINTA_FRACA, 'legenda', '5,3'), ('Sinal-tinta', SINAL_TINTA, 'a ação de hoje', '5,9'), ('Alerta-tinta', ALERTA_TINTA, 'o que está vencendo', '6,6')])
proib = ''.join(
    f'<div style="display: flex; align-items: center; gap: 12px"><span style="width: 44px; height: 44px; background: {bg}; border: 1px solid {LINHA_ESCURA}; color: {fg}; display: flex; align-items: center; justify-content: center; font-family: {DISPLAY}; font-weight: 600; font-size: 18px">Aa</span>'
    f'<div><p style="margin: 0; font-size: 14px; line-height: 20px; color: {NEVE}">{n}</p><p style="margin: 0; font-family: {MONO}; font-size: 13px; color: {ALERTA}">{r}</p></div></div>'
    for n, fg, bg, r in [('sinal no papel', SINAL, PAPEL, '1,89'), ('sinal-tinta no carvão', SINAL_TINTA, CARVAO, '3,09'),
                         ('alerta no papel', ALERTA, PAPEL, '2,50'), ('alerta-tinta no carvão', ALERTA_TINTA, CARVAO, '2,74')])
paleta = section(f'''
    {head('Paleta', 'Neutros da casa, dois sinais próprios.', 'O parentesco com a Don vive nos neutros, sem alteração. A diferença vive nos sinais: verde para a ação recomendada, ferrugem para o que está vencendo. As razões de contraste foram calculadas pela fórmula da WCAG sobre estes hexadecimais.')}
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px">
      <div style="background: {CARVAO}; padding: 24px 24px 12px">{kicker('Fundo escuro · o padrão do produto', NEVE_FRACA)}<div style="margin-top: 12px">{escuro}</div></div>
      <div style="{BOX}; padding: 24px 24px 12px">{kicker('Fundo claro · site, documento, impresso')}<div style="margin-top: 12px">{claro}</div></div>
    </div>
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 24px; align-items: stretch">
      <div style="{BOX}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        {kicker('Ferrugem-fundo · preenchimento, não texto')}
        <div style="background: {FERRUGEM_FUNDO}; color: {NEVE}; padding: 12px 16px; display: flex; justify-content: space-between; font-size: 15px; font-weight: 600"><span>vencido há 6 dias</span><span style="font-family: {MONO}; font-weight: 400">#652E19 · 9,5</span></div>
        {p('Quando o alerta é um bloco preenchido, nenhum dos dois ferrugens serve: o alerta com texto branco dá 2,6. O terceiro token resolve. Sobre o papel funciona como chip; no carvão desaparece e o alerta volta a ser texto.', TINTA_MEDIA, 14, 21)}
      </div>
      <div style="background: {CARVAO}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        {kicker('Quatro usos proibidos · saíram do cálculo', SINAL)}
        <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 16px">{proib}</div>
        {p('Cada sinal pertence a um fundo só. Não há versão “clara o bastante” do verde para o papel nem do ferrugem para o carvão.', NEVE_MEDIA, 14, 21)}
      </div>
    </div>
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 24px">
      <div style="display: flex; flex-direction: column; gap: 8px"><p style="margin: 0; font-size: 16px; font-weight: 600">Por que verde, e não o laranja da casa</p>{p('Herdar a cor transformaria a irmã em variação. E o verde é a cor mais vazia da categoria, onde quase todo mundo é roxo, azul ou preto.', TINTA_MEDIA, 14, 21)}</div>
      <div style="display: flex; flex-direction: column; gap: 8px"><p style="margin: 0; font-size: 16px; font-weight: 600">Por que ferrugem, e não vermelho</p>{p('Vermelho com verde é o par que mais falha no daltonismo, e vermelho em software de vendas lê como erro do sistema. Ferrugem é atenção sem pânico.', TINTA_MEDIA, 14, 21)}</div>
      <div style="display: flex; flex-direction: column; gap: 8px"><p style="margin: 0; font-size: 16px; font-weight: 600">A cor nunca informa sozinha</p>{p('Verde e ferrugem ficam a 1,32 de luminância no escuro. Prioridade é dita por posição e por palavra: o que importa vem no topo, e o vencido diz “vencido há 6 dias”.', TINTA_MEDIA, 14, 21)}</div>
    </div>''')

# ---------- 5. tipografia ----------
tipo = section(f'''
    {head('Tipografia', 'Uma voz nova, duas herdadas.')}
    <div style="display: grid; grid-template-columns: minmax(0, 1.3fr) minmax(0, 1fr) minmax(0, 1fr); gap: 24px">
      <div style="{BOX}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">{kicker('Archivo SemiBold · logotipo e títulos', TINTA)}<span style="font-family: {MONO}; font-size: 12px; color: {SINAL_TINTA}">própria</span></div>
        <p style="margin: 0; font-family: {DISPLAY}; font-size: 96px; line-height: 1; font-weight: 600; letter-spacing: -0.02em">Fo<span style="color: {SINAL_TINTA}">ll</span>ou</p>
        {p('A escolha é pelo L: haste pesada e pé longo, então dois L seguidos criam o ritmo que o nome precisa que ninguém esqueça. Entressaca −0,02 em: fecha o par sem deixar os pés se tocarem.', TINTA_MEDIA, 14, 21)}
      </div>
      <div style="{BOX}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">{kicker('IBM Plex Sans · interface', TINTA)}<span style="font-family: {MONO}; font-size: 12px; color: {SINAL_TINTA}">da Don</span></div>
        <p style="margin: 0; font-size: 24px; line-height: 32px">Pedrosa Logística abriu sua proposta quatro vezes ontem.</p>
        {p('A voz de tudo que se lê. Altura-x generosa, sem tentar ter personalidade: a personalidade mora no logotipo e no sinal.', TINTA_MEDIA, 14, 21)}
      </div>
      <div style="{BOX}; padding: 24px; display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; justify-content: space-between; align-items: baseline">{kicker('IBM Plex Mono · dado', TINTA)}<span style="font-family: {MONO}; font-size: 12px; color: {SINAL_TINTA}">da Don</span></div>
        <p style="margin: 0; font-family: {MONO}; font-size: 40px; line-height: 48px; font-variant-numeric: tabular-nums">12 · 4 · 6d</p>
        {p('Dígito de largura fixa alinha em coluna. Se é para ler, Plex Sans; se é para conferir, Plex Mono.', TINTA_MEDIA, 14, 21)}
      </div>
    </div>
    {p('O Follou não herda o Advent Pro, fonte do logotipo da Don: marca irmã que assina na tipografia da mãe vira submarca.', TINTA_MEDIA, 14, 21)}''')

# ---------- 6. valores e voz ----------
valores = ''.join(
    f'<div style="display: grid; grid-template-columns: 48px minmax(0, 1fr) minmax(0, 1fr); gap: 16px; padding: 14px 0; border-top: 1px solid {LINHA_CLARA}; align-items: baseline">'
    f'<span style="font-family: {MONO}; font-size: 14px; color: {SINAL_TINTA}">{n}</span><span style="font-size: 16px; line-height: 22px; font-weight: 600">{t}</span>{p(d, TINTA_MEDIA, 15, 22)}</div>'
    for n, t, d in [('01', 'Clareza acima de completude', 'Uma tela, uma ação no topo.'), ('02', 'Cobrança sem constrangimento', 'Sem vermelho, sem alarme, sem placar.'),
                    ('03', 'Decisão, nunca só dado', 'Nenhum gráfico sem a frase que o usa.'), ('04', 'Herança com distância', 'Endosso em rodapé, nunca em bordado.'),
                    ('05', 'Honestidade sobre o que não sabe', '“Sem dados suficientes” é tela, não erro.')])
atributos = ''.join(
    f'<div style="display: grid; grid-template-columns: 120px minmax(0, 1fr); gap: 16px; padding: 14px 0; border-top: 1px solid {LINHA_ESCURA}">'
    f'<span style="font-size: 15px; font-weight: 600; color: {SINAL}">{a}</span><div>{p(d, NEVE_MEDIA, 14, 20)}<p style="margin: 4px 0 0; font-size: 16px; line-height: 22px; color: {NEVE}">{e}</p></div></div>'
    for a, d, e in [('Direto', 'Frase curta, verbo na frente, uma ideia por linha.', '“Ligue para a Pedrosa hoje.”'),
                    ('Específico', 'Nome de empresa e número de dias, nunca “alguns clientes”.', '“Parada há 11 dias.”'),
                    ('Sóbrio', 'Sem exclamação, sem emoji, sem comemoração.', '“Proposta aberta 4 vezes.”'),
                    ('Parceiro', 'Fala de dentro da operação, no plural de quem divide o risco.', '“Vale insistir aqui.”'),
                    ('Honesto', 'Admite o limite do que sabe, sem pedir desculpa.', '“Ainda não dá para dizer.”')])
voz = section(f'''
    <div style="display: grid; grid-template-columns: minmax(0, 1fr) minmax(0, 1fr); gap: 48px; align-items: start">
      <div style="display: flex; flex-direction: column; gap: 20px">
        {head('Valores', 'O que o Follou defende.', 'Cinco princípios que decidem o produto quando a decisão é difícil. Cabem numa frase: o Follou prefere dizer uma coisa certa a dizer cinco coisas completas.')}
        <div>{valores}</div>
      </div>
      <div style="background: {CARVAO}; padding: 32px; display: flex; flex-direction: column; gap: 20px">
        {head('Voz', 'Um colega competente que leu os dados antes de você acordar.', None, dark=True)}
        <div>{atributos}</div>
        <div style="display: flex; flex-direction: column; gap: 8px; padding-top: 16px; border-top: 1px solid {LINHA_ESCURA}">
          {kicker('Nunca diz', ALERTA)}
          <p style="margin: 0; font-size: 15px; line-height: 22px; color: {NEVE_FRACA}"><s>“Bora fechar negócio hoje!”</s> · <s>“Vamos juntos, você consegue.”</s> · <s>“Foco total na meta!”</s> · <s>“Que incrível ter você de volta.”</s></p>
          {p('Sem superlativo, promessa de resultado, linguagem de coach ou frase que comece com “parabéns”. O fundador não quer ser animado; quer ser informado.', NEVE_MEDIA, 14, 20)}
        </div>
      </div>
    </div>''')

# ---------- 7. aplicações ----------
fis = ''.join(
    f'<figure style="margin: 0; display: flex; flex-direction: column; gap: 12px"><div style="aspect-ratio: 1; overflow: hidden; background: {CARVAO}">'
    f'<img src="{FOTOS[k]}" alt="{alt}" style="width: 100%; height: 100%; object-fit: cover; display: block"></div>'
    f'<figcaption style="display: flex; flex-direction: column; gap: 6px"><span style="font-size: 16px; font-weight: 600">{t}</span>'
    f'<span style="font-family: {MONO}; font-size: 12px; line-height: 18px; color: {TINTA}; white-space: pre-line">{spec}</span>{p(d, TINTA_MEDIA, 13, 19)}</figcaption></figure>'
    for k, t, alt, spec, d in [
        ('camiseta', 'Camiseta', 'Camiseta carvão com o símbolo bordado em verde no peito esquerdo', 'malha carvão #100F0F\nbordado, peito esquerdo, 45 mm', 'Marca pequena é camiseta que alguém usa fora do evento.'),
        ('bone', 'Boné', 'Boné carvão com o símbolo bordado em verde na frente', 'sarja carvão, aba estruturada\nbordado frontal, 50 mm, traço ≥ 2,5 mm', 'O teste mais duro: a costura engrossa o traço e tende a fechar o vão.'),
        ('caneca', 'Caneca', 'Caneca carvão fosca com a assinatura horizontal do Follou', 'cerâmica carvão, fosca\nassinatura horizontal, 60 mm', 'A única peça com logotipo: superfície plana o bastante para a redução.'),
        ('caderno', 'Caderno', 'Caderno de capa carvão com o símbolo em baixo-relevo', 'capa dura carvão\nbaixo-relevo cego, 40 mm', 'Sem cor, só a forma responde. O teste de que o símbolo vive em uma cor.')])
digitais = f'''
      <div style="display: flex; flex-direction: column; gap: 16px">
        <div style="display: flex; gap: 24px; align-items: flex-end">
          <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; align-items: center"><div style="width: 120px; height: 120px; background: {CARVAO}; display: flex; align-items: center; justify-content: center">{symbol(52, SINAL)}</div><figcaption style="font-family: {MONO}; font-size: 12px; color: {TINTA_MEDIA}">ícone do app</figcaption></figure>
          <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; align-items: center"><div style="width: 72px; height: 72px; background: {SINAL}; display: flex; align-items: center; justify-content: center">{symbol(30, CARVAO)}</div><figcaption style="font-family: {MONO}; font-size: 12px; color: {TINTA_MEDIA}">avatar</figcaption></figure>
          <figure style="margin: 0; display: flex; flex-direction: column; gap: 8px; align-items: center"><div style="display: flex; align-items: center; gap: 8px; background: {AREIA}; border: 1px solid {LINHA_CLARA}; padding: 8px 12px">{single(16, SINAL_TINTA)}<span style="font-size: 13px; color: {TINTA}">Hoje · Follou</span></div><figcaption style="font-family: {MONO}; font-size: 12px; color: {TINTA_MEDIA}">aba · 16 px</figcaption></figure>
        </div>
        {p('No ícone, o símbolo fica no sinal sobre o carvão: é o que a pessoa toca toda manhã. Abaixo de 24 px entra o glifo de traço único.', TINTA_MEDIA, 14, 21)}
      </div>'''
aplic = section(f'''
    <div style="display: grid; grid-template-columns: minmax(0, 1.2fr) minmax(0, 1fr); gap: 48px; align-items: end">
      {head('Aplicações', 'Quatro peças, uma regra: só o símbolo, uma cor.', 'Em bordado, gravação e baixo-relevo o que sobrevive é a silhueta. Objeto físico não leva endosso nem assinatura completa; a caneca é a única exceção.')}
      {digitais}
    </div>
    <div style="display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 24px">{fis}</div>
    {p('Fotos da prancha 10 do PDF de marca. Vetor fechado para a produção, amostra física antes da matriz, verde ou nada: o ferrugem não entra em peça física.', TINTA_MEDIA, 13, 19)}''')

# ---------- 8. regras ----------
regras = ''.join(
    f'<div style="{bg}; padding: 20px; display: flex; flex-direction: column; gap: 8px"><p style="margin: 0; font-size: 16px; line-height: 22px; font-weight: 600">{t}</p>{p(d, TINTA_MEDIA, 14, 20)}</div>'
    for t, d, bg in [('1 · Um sinal por tela', 'O verde marca a decisão que vale mais hoje, e só ela. Duas coisas verdes na mesma tela: o produto não cumpriu a promessa.', BOX),
                     ('2 · Cada sinal pertence a um fundo só', '#3FD07F só no escuro, #0E7038 só no claro. A proibição saiu do cálculo: 1,89 e 3,09.', BOX),
                     ('3 · O duplo L é indivisível', 'Nunca abrir entressaca entre os L, quebrar a palavra em duas linhas nem estilizar um L diferente do outro.', BOX),
                     ('4 · Escuro é produto, claro é documento', 'O produto se apresenta no escuro: ícone, abertura da manhã, vitrine do app. Site, proposta e impresso são claros.', BOX),
                     ('5 · Canto reto na marca', 'Raio zero em peça de marca. A interface segue a régua do Design 2.0.', BOX),
                     ('A regra que vem de fora', 'Nenhum número em peça pública que não seja dado real do próprio usuário. Sem contagem de usuários, estrela, depoimento ou logo de cliente.', f'background: {AREIA}')])
fim = section(f'''
    {head('Regras', 'Cinco regras que dispensam consulta.')}
    <div style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 16px">{regras}</div>
    <footer style="display: flex; justify-content: space-between; align-items: center; padding-top: 24px">
      {lockup(28, TINTA, SINAL_TINTA)}
      <span style="font-family: {SANS}; font-size: 12px; font-weight: 500; letter-spacing: 0.14em; text-transform: uppercase; color: {TINTA_MEDIA}">um produto Don · follou.com.br</span>
    </footer>''')

html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Follou — Marca</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
h1,h2,h3{{font-family:{DISPLAY}}}
a{{color:{TINTA}}}a:hover{{color:{SINAL_TINTA}}}
</style>
</helmet>
<div style="width: {W}px; min-height: {H}px; box-sizing: border-box; padding: 80px; background: {PAPEL}; color: {TINTA}; font-family: {SANS}; display: flex; flex-direction: column; gap: 48px">
{abertura}
{nome}
{simbolo}
{paleta}
{tipo}
{voz}
{aplic}
{fim}
</div>
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{W},"height":{H}}}}}'>
class Component extends DCLogic {{
  renderVals() {{
    return {{}};
  }}
}}
</script>
</body>
</html>
'''
open(OUT, 'w').write(html)
print('ok', len(html))
