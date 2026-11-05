"""Gera as telas do Grana (planejamento comercial de 90 dias) no canvas.

Fonte: "Follou — Grana | Especificação Funcional Oficial v1.0" (David, 04/11/2026).
Decisões nossas por cima da especificação (05/11/2026):
- Conversas continua sem etapas: a situação lida do WhatsApp faz o papel do estágio,
  e ganhou ou perdeu é o único toque à mão.
- Pipeline e Caçada da especificação são Conversas e Empresas no produto.
- O objetivo do módulo fala em sete respostas; são seis (Q1 a Q6).

Rodar a partir de design/:  python3 geradores/gen_grana.py
Escreve em canvas/. Exemplo único em todas as telas: fundador que cobra por projeto,
meta de R$ 60.000 em 90 dias, R$ 15.000 já contratados, projeto de R$ 15.000,
8 negociações declaradas e 10 empresas novas por semana.
"""
import os

HERE = os.path.dirname(os.path.abspath(__file__))
OUT = os.path.join(HERE, '..', 'canvas')

# Tokens (mesmos de follou.py e das telas do Design 2.0)
FUNDO, PAPEL, AREIA, LINHA, LINHA2 = '#F4F1EC', '#FAF9F7', '#E9E5DE', '#E3DFD7', '#E9E5DE'
TINTA, MEDIA, ACAO, CARVAO, NEVE, NEVE_MEDIA, SINAL = '#1A1815', '#57524B', '#0E7038', '#100F0F', '#F4F1EC', '#C9C6C0', '#3FD07F'
FERRUGEM, FERRUGEM_FUNDO = '#93402B', '#EEE3DF'
DISPLAY = "'Archivo', 'IBM Plex Sans', system-ui, sans-serif"
SANS = "'IBM Plex Sans', -apple-system, system-ui, sans-serif"
MONO = "'IBM Plex Mono', ui-monospace, monospace"
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Archivo:wght@500;600;700&amp;'
         'family=IBM+Plex+Sans:wght@400;500;600&amp;family=IBM+Plex+Mono:wght@500&amp;display=swap">')
SOMBRA = 'box-shadow: 0 1px 2px rgba(16,15,15,0.06)'
CARD = f'border-radius: 24px; background: {PAPEL}; border: 1px solid {LINHA}; {SOMBRA}'
H1 = f"margin: 0; font-family: {DISPLAY}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em; text-wrap: balance"
H1W = f"margin: 0; font-family: {DISPLAY}; font-size: 40px; line-height: 44px; font-weight: 600; letter-spacing: -0.035em"
B = 'font-size: 16px; line-height: 22px'
S = 'font-size: 12px; line-height: 16px'
SW = 'font-size: 13px; line-height: 18px'
NUM = 'font-variant-numeric: tabular-nums'
BTN1 = (f'box-sizing: border-box; height: 48px; padding: 0 20px; border: 0; border-radius: 999px; background: {ACAO}; color: {PAPEL}; '
        f'font: inherit; font-size: 16px; font-weight: 600; text-decoration: none; cursor: pointer; display: flex; align-items: center; '
        f'justify-content: center; gap: 8px; transition: background-color 150ms ease-out')
BTN2 = (f'box-sizing: border-box; height: 44px; padding: 0 18px; border: 1px solid {LINHA}; border-radius: 999px; background: {PAPEL}; color: {TINTA}; '
        f'font: inherit; font-size: 16px; font-weight: 600; text-decoration: none; cursor: pointer; display: flex; align-items: center; '
        f'justify-content: center; gap: 8px; transition: background-color 150ms ease-out')
LINK = (f'height: 44px; padding: 0 4px; border: 0; background: transparent; color: {TINTA}; font: inherit; font-size: 16px; '
        f'font-weight: 500; text-decoration: underline; text-underline-offset: 3px; cursor: pointer; display: inline-flex; align-items: center')
CHIP_ON = (f'height: 44px; box-sizing: border-box; padding: 0 16px; border: 1px solid {CARVAO}; border-radius: 999px; background: {CARVAO}; '
           f'color: {NEVE}; font: inherit; font-size: 16px; font-weight: 600; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; '
           f'transition: background-color 150ms ease-out; {NUM}')
CHIP_OFF = (f'height: 44px; box-sizing: border-box; padding: 0 16px; border: 1px solid {LINHA}; border-radius: 999px; background: {PAPEL}; '
            f'color: {TINTA}; font: inherit; font-size: 16px; font-weight: 500; cursor: pointer; display: inline-flex; align-items: center; gap: 6px; '
            f'transition: background-color 150ms ease-out; {NUM}')
CHECK = '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12.5l4.5 4.5L19 7.5"></path></svg>'
SETA = '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M5 12h14"></path><path d="M13 6l6 6-6 6"></path></svg>'
CHEV = f'<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="{MEDIA}" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M9 6l6 6-6 6"></path></svg>'
VOLTA = '<svg viewBox="0 0 24 24" width="20" height="20" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="M15 6l-6 6 6 6"></path></svg>'

ICONES = {
    'Hoje': '<path d="M3 18h18"></path><path d="M7 18a5 5 0 0 1 10 0"></path><path d="M12 6v3"></path><path d="M5.6 10.6l1.6 1.6"></path><path d="M18.4 10.6l-1.6 1.6"></path>',
    'Conversas': '<path d="M4 5h16v11H9l-5 4z"></path>',
    'Empresas': '<path d="M5 20V5h9v15"></path><path d="M14 10h5v10"></path><path d="M3 20h18"></path><path d="M8 9h3"></path><path d="M8 13h3"></path>',
    'Grana': '<circle cx="12" cy="12" r="8.5"></circle><path d="M14.6 9.3c-.5-.8-1.5-1.3-2.6-1.3-1.5 0-2.6.8-2.6 1.9 0 2.7 5.2 1.4 5.2 4.2 0 1.1-1.1 1.9-2.6 1.9-1.2 0-2.2-.5-2.7-1.4"></path><path d="M12 6.4v1.6"></path><path d="M12 15.9v1.7"></path>',
}
ABAS = [('Hoje', 'HojeMobile', 'Hoje', 'H'), ('Conversas', 'ConversasMobile', 'Conversas', 'C'),
        ('Empresas', 'EmpresasMobile', 'Empresas', 'E'), ('Grana', 'GranaMobile', 'Grana', 'R')]


def icone(nome, w=22):
    return (f'<svg viewBox="0 0 24 24" width="{w}" height="{w}" fill="none" stroke="currentColor" stroke-width="2" '
            f'stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">{ICONES[nome]}</svg>')


def tabbar(ativa):
    """Tab bar de vidro, quatro abas, fundo claro."""
    itens = []
    for nome, mob, _web, _k in ABAS:
        if nome == ativa:
            st = f'border-radius: 26px; background: {CARVAO}; color: {NEVE}; font-weight: 600'
            cur = ' aria-current="page"'
        else:
            st = f'border-radius: 26px; color: {MEDIA}; font-weight: 500'
            cur = ''
        itens.append(f'<a href="{mob}.dc.html"{cur} style="{st}; text-decoration: none; display: flex; flex-direction: column; '
                     f'align-items: center; justify-content: center; gap: 2px; {S}">{icone(nome)}{nome}</a>')
    return ('  <nav aria-label="Navegação" style="position: absolute; left: 31px; bottom: 24px; width: 328px; height: 64px; box-sizing: border-box; '
            'padding: 6px; border-radius: 32px; background: rgba(255,255,255,0.72); backdrop-filter: blur(20px) saturate(1.6); '
            '-webkit-backdrop-filter: blur(20px) saturate(1.6); border: 1px solid rgba(16,15,15,0.08); box-shadow: 0 1px 2px rgba(16,15,15,0.06), '
            '0 12px 32px rgba(16,15,15,0.14); display: grid; grid-template-columns: repeat(4, minmax(0, 1fr)); gap: 4px">\n    '
            + '\n    '.join(itens) + '\n  </nav>\n')


def sidebar(ativa):
    """Barra lateral do web, igual à do Hoje."""
    logo = ('<span role="img" aria-label="Follou" style="display: inline-flex; align-items: center; gap: 8.1px; white-space: nowrap; flex-shrink: 0">'
            '<svg viewBox="0 0 782 641" width="27.45" height="22.5" aria-hidden="true" fill="#3FD07F" style="display: block; flex-shrink: 0">'
            '<path d="M0 0H130V277A95 95 0 0 0 225 372H344V502H225A225 225 0 0 1 0 277Z"></path>'
            '<path transform="translate(437 140)" d="M0 0H130V277A95 95 0 0 0 225 372H344V502H225A225 225 0 0 1 0 277Z"></path></svg>'
            f'<span aria-hidden="true" style="font-family: {DISPLAY}; font-weight: 600; font-size: 23.04px; line-height: 1; letter-spacing: -0.02em; color: {TINTA}">Follou</span></span>')
    links = []
    for nome, _mob, web, k in ABAS:
        if nome == ativa:
            links.append(f'<a href="{web}.dc.html" aria-current="page" style="height: 44px; box-sizing: border-box; padding: 0 12px; border-radius: 999px; '
                         f'background: {PAPEL}; border: 1px solid {LINHA}; {SOMBRA}; color: {TINTA}; text-decoration: none; display: flex; align-items: center; '
                         f'gap: 10px; font-size: 16px; font-weight: 600">{icone(nome, 20)}<span style="flex-grow: 1">{nome}</span>'
                         f'<span style="{SW}; font-weight: 500; color: {MEDIA}">G {k}</span></a>')
        else:
            links.append(f'<a class="dv-nav" href="{web}.dc.html" style="height: 44px; box-sizing: border-box; padding: 0 13px; border-radius: 999px; '
                         f'color: {TINTA}; text-decoration: none; display: flex; align-items: center; gap: 10px; font-size: 16px; font-weight: 500; '
                         f'transition: background-color 150ms ease-out">{icone(nome, 20)}<span style="flex-grow: 1">{nome}</span>'
                         f'<span style="{SW}; font-weight: 500; color: {MEDIA}">G {k}</span></a>')
    return (f'  <aside style="flex: 1 1 220px; max-width: 256px; box-sizing: border-box; padding: 28px 16px; display: flex; flex-direction: column; gap: 4px">\n'
            f'    <div style="padding: 0 12px 20px">{logo}</div>\n'
            f'    <nav aria-label="Navegação" style="display: flex; flex-direction: column; gap: 4px">\n      ' + '\n      '.join(links) +
            '\n    </nav>\n  </aside>\n')


def page(titulo, corpo, logica='renderVals() { return {}; }', w=390, h=844, extra_css=''):
    return f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Follou — {titulo}</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
a:focus-visible,button:focus-visible,input:focus-visible{{outline:2px solid {ACAO};outline-offset:2px}}
.dv-nav:hover{{background:{AREIA}}}
{extra_css}</style>
</helmet>
{corpo}
</x-dc>
<script type="text/x-dc" data-dc-script data-props='{{"$preview":{{"width":{w},"height":{h}}}}}'>
class Component extends DCLogic {{
  {logica}
}}
</script>
</body>
</html>
'''


def tela(conteudo, fundo=FUNDO, cor=TINTA, gap=20, pad='60px 16px 0'):
    return (f'<div style="width: 390px; height: 844px; box-sizing: border-box; position: relative; overflow: hidden; padding: {pad}; '
            f'background: {fundo}; color: {cor}; font-family: {SANS}; display: flex; flex-direction: column; gap: {gap}px">\n{conteudo}</div>')


def web(conteudo, ativa='Grana'):
    return (f'<div style="min-height: 900px; background: {FUNDO}; color: {TINTA}; font-family: {SANS}; display: flex; flex-wrap: wrap">\n'
            f'{sidebar(ativa)}\n  <main style="flex: 999 1 560px; min-width: 0; max-width: 1160px; box-sizing: border-box; padding: 28px 32px 48px; '
            f'display: flex; flex-direction: column; gap: 24px">\n{conteudo}  </main>\n</div>')


def voltar(href, rotulo):
    return (f'<a href="{href}" style="height: 44px; margin-left: -4px; padding-right: 8px; display: inline-flex; align-items: center; gap: 2px; '
            f'color: {TINTA}; font-size: 16px; font-weight: 500; text-decoration: none">{VOLTA}{rotulo}</a>')


def barra(pct, rotulo_esq, rotulo_dir, escuro=False):
    trilho = 'rgba(255,255,255,0.14)' if escuro else LINHA
    cheio = NEVE if escuro else CARVAO
    cor = NEVE_MEDIA if escuro else MEDIA
    return (f'<div><div role="img" aria-label="{rotulo_esq} de {rotulo_dir}" style="height: 6px; border-radius: 3px; background: {trilho}; overflow: hidden">'
            f'<div style="width: {pct}%; height: 6px; border-radius: 3px; background: {cheio}"></div></div>'
            f'<div style="display: flex; justify-content: space-between; margin-top: 8px; {S}; color: {cor}; {NUM}"><span>{rotulo_esq}</span><span>{rotulo_dir}</span></div></div>')


def linha(num, txt, primeira=False, extra=''):
    borda = '0' if primeira else f'1px solid {LINHA2}'
    return (f'<li style="border-top: {borda}; min-height: 56px; box-sizing: border-box; padding: 8px 0; display: flex; align-items: center; gap: 12px">'
            f'<span style="flex-shrink: 0; min-width: 96px; {B}; font-weight: 600; {NUM}">{num}</span>'
            f'<span style="flex: 1; min-width: 0; {S}; color: {MEDIA}">{txt}</span>{extra}</li>')


NAO_SEI = (f'<section aria-label="O que eu ainda não sei" style="border-radius: 24px; border: 1px dashed {MEDIA}; padding: 16px; display: flex; flex-direction: column; gap: 4px">'
           f'<p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">O que eu ainda não sei</p>'
           f'<p style="margin: 0; {S}; color: {TINTA}">Quantas conversas viram venda no seu negócio. Vou descobrir com os seus números. '
           f'Até lá, o plano mede o seu esforço, não uma previsão minha.</p></section>')


def write(nome, html):
    with open(os.path.join(OUT, nome + '.dc.html'), 'w') as f:
        f.write(html)
    print('ok', nome)


# ---------------------------------------------------------------- primeiro acesso, clicável (T01 → Q1..Q6 → T04 → T05)

def pergunta(passo, titulo, aux, comp, nao_sei=''):
    return f'''  <sc-if value="{{{{p.q{passo}}}}}" hint-placeholder-val="{{{{false}}}}">
    <div style="position: absolute; inset: 0; box-sizing: border-box; padding: 60px 16px 0; display: flex; flex-direction: column; gap: 24px">
      <div style="height: 44px; display: flex; justify-content: space-between; align-items: center">
        <button type="button" onClick="{{{{voltar}}}}" style="height: 44px; margin-left: -4px; padding: 0 8px 0 0; border: 0; background: transparent; color: {TINTA}; font: inherit; font-size: 16px; font-weight: 500; display: inline-flex; align-items: center; gap: 2px; cursor: pointer">{VOLTA}Voltar</button>
        <span aria-label="Pergunta {passo} de 6" style="font-family: {MONO}; {S}; font-weight: 500; color: {MEDIA}">{passo} / 6</span>
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <h1 style="{H1}">{titulo}</h1>
        <p style="margin: 0; {B}; color: {MEDIA}">{aux}</p>
      </div>
{comp}
      <div style="position: absolute; left: 16px; right: 16px; bottom: 32px; display: flex; flex-direction: column; gap: 8px; align-items: center">
{nao_sei}        <button type="button" onClick="{{{{seguir}}}}" style="{BTN1}; width: 100%">Continuar</button>
      </div>
    </div>
  </sc-if>
'''


def campo(id_, rotulo, valor):
    return (f'      <div style="display: flex; flex-direction: column; gap: 8px">\n'
            f'        <label for="{id_}" style="{S}; font-weight: 600; color: {MEDIA}">{rotulo}</label>\n'
            f'        <div style="height: 64px; box-sizing: border-box; padding: 0 16px; border-radius: 16px; background: {PAPEL}; border: 1px solid {CARVAO}; display: flex; align-items: center; gap: 8px">'
            f'<span style="font-family: {DISPLAY}; font-size: 32px; line-height: 36px; font-weight: 600; color: {MEDIA}">R$</span>'
            f'<input id="{id_}" type="text" inputmode="numeric" value="{valor}" style="flex: 1; min-width: 0; border: 0; background: transparent; padding: 0; color: {TINTA}; '
            f'font-family: {DISPLAY}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em; {NUM}"></div>\n'
            f'      </div>\n')


def chips(lista, coluna=False):
    lay = 'flex-direction: column; align-items: stretch' if coluna else 'flex-wrap: wrap'
    full = '; justify-content: flex-start; width: 100%' if coluna else ''
    return f'''      <div role="group" style="display: flex; {lay}; gap: 8px">
        <sc-for list="{{{{{lista}}}}}" as="c" hint-placeholder-count="4">
          <sc-if value="{{{{c.on}}}}" hint-placeholder-val="{{{{false}}}}"><button type="button" aria-pressed="true" onClick="{{{{c.pick}}}}" style="{CHIP_ON}{full}">{{{{c.rotulo}}}}</button></sc-if>
          <sc-if value="{{{{c.off}}}}" hint-placeholder-val="{{{{true}}}}"><button type="button" aria-pressed="false" onClick="{{{{c.pick}}}}" style="{CHIP_OFF}{full}">{{{{c.rotulo}}}}</button></sc-if>
        </sc-for>
      </div>
'''


def revisao_linha(rotulo, valor, ir, primeira=False):
    borda = '0' if primeira else f'1px solid {LINHA2}'
    return (f'<li style="border-top: {borda}"><button type="button" onClick="{{{{ir.{ir}}}}}" style="width: 100%; min-height: 56px; box-sizing: border-box; padding: 8px 0; '
            f'border: 0; background: transparent; color: {TINTA}; font: inherit; display: flex; align-items: center; gap: 12px; cursor: pointer; text-align: left">'
            f'<span style="flex: 1; min-width: 0; {S}; color: {MEDIA}">{rotulo}</span><span style="{B}; font-weight: 600; {NUM}">{valor}</span>{CHEV}</button></li>')


def grupo(titulo, linhas):
    return (f'<section style="display: flex; flex-direction: column; gap: 8px"><h2 style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">{titulo}</h2>'
            f'<ul style="list-style: none; margin: 0; padding: 0 16px; {CARD}">' + ''.join(linhas) + '</ul></section>')


def gen_plano_mobile():
    t01 = f'''  <sc-if value="{{{{p.t01}}}}" hint-placeholder-val="{{{{true}}}}">
    <div style="position: absolute; inset: 0; box-sizing: border-box; padding: 60px 16px 0; display: flex; flex-direction: column; gap: 24px">
      <p style="margin: 0; height: 44px; display: flex; align-items: center; gap: 8px; {B}; font-weight: 600">{icone('Grana', 20)}Grana</p>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <h1 style="{H1}">Antes de começar, algumas perguntas.</h1>
        <p style="margin: 0; {B}">Elas montam o seu plano dos próximos 90 dias. Nenhuma exige abrir planilha.</p>
        <p style="margin: 0; {B}; color: {MEDIA}">Leva menos de três minutos.</p>
      </div>
      <div style="position: absolute; left: 16px; right: 16px; bottom: 32px; display: flex; flex-direction: column; gap: 8px; align-items: center">
        <a href="HojeMobile.dc.html" style="{LINK}">Agora não</a>
        <button type="button" onClick="{{{{seguir}}}}" style="{BTN1}; width: 100%">Começar</button>
      </div>
    </div>
  </sc-if>
'''
    q1 = pergunta(1, 'Como você cobra os seus clientes?', 'Isso muda a forma do seu plano.', chips('modelos', coluna=True))
    q2 = pergunta(2, 'Quanto você quer faturar nos próximos 90 dias?',
                  'Valor que você vai faturar. Quando o dinheiro cai é outra conta, e o Follou não cuida dela.',
                  campo('g-meta', 'Meta dos 90 dias', '60.000'),
                  f'        <button type="button" style="{LINK}">Não sei</button>\n')
    q3 = pergunta(3, 'De contrato já assinado, quanto você vai faturar nos próximos 90 dias?',
                  'Só a parte que entra dentro desses 90 dias.', campo('g-garantido', 'Já garantido', '15.000'),
                  f'        <button type="button" style="{LINK}">Não tenho nada garantido</button>\n')
    q4 = pergunta(4, 'Quanto costuma valer um projeto seu?', 'Aproximado serve. Se não souber, eu pergunto o do último que você fechou.',
                  campo('g-ticket', 'Valor de um projeto', '15.000'), f'        <button type="button" style="{LINK}">Não sei</button>\n')
    stepper = f'''      <div role="group" aria-label="Negociações em aberto" style="display: flex; align-items: center; justify-content: center; gap: 24px; padding: 16px 0">
        <button type="button" aria-label="Uma a menos" onClick="{{{{menos}}}}" style="width: 56px; height: 56px; border-radius: 28px; border: 1px solid {LINHA}; background: {PAPEL}; color: {TINTA}; cursor: pointer; display: flex; align-items: center; justify-content: center"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M5 12h14"></path></svg></button>
        <span aria-live="polite" style="min-width: 96px; text-align: center; font-family: {DISPLAY}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em; {NUM}">{{{{neg}}}}</span>
        <button type="button" aria-label="Uma a mais" onClick="{{{{mais}}}}" style="width: 56px; height: 56px; border-radius: 28px; border: 1px solid {LINHA}; background: {PAPEL}; color: {TINTA}; cursor: pointer; display: flex; align-items: center; justify-content: center"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" aria-hidden="true"><path d="M12 5v14"></path><path d="M5 12h14"></path></svg></button>
      </div>
      <p style="margin: 0; {S}; color: {MEDIA}; text-align: center">Zero também vale. Você cadastra cada uma depois, com calma.</p>
'''
    q5 = pergunta(5, 'Com quantas empresas você está negociando agora?', 'Conte cada empresa uma vez, esteja ela em que ponto estiver.', stepper)
    q6 = pergunta(6, 'Numa semana normal, quantas empresas novas você consegue abordar?', 'Semana normal, não a sua melhor semana.',
                  chips('ritmos'), f'        <button type="button" style="{LINK}">Não sei estimar</button>\n')
    rev = f'''  <sc-if value="{{{{p.t04}}}}" hint-placeholder-val="{{{{false}}}}">
    <div style="position: absolute; inset: 0; box-sizing: border-box; padding: 60px 16px 0; display: flex; flex-direction: column; gap: 20px">
      <div style="height: 44px; display: flex; align-items: center"><button type="button" onClick="{{{{voltar}}}}" style="height: 44px; margin-left: -4px; padding: 0 8px 0 0; border: 0; background: transparent; color: {TINTA}; font: inherit; font-size: 16px; font-weight: 500; display: inline-flex; align-items: center; gap: 2px; cursor: pointer">{VOLTA}Voltar</button></div>
      <div style="display: flex; flex-direction: column; gap: 8px"><h1 style="{H1}">Confere antes de montar.</h1><p style="margin: 0; {B}; color: {MEDIA}">Toque numa linha para mudar.</p></div>
      {grupo('Sua meta', [revisao_linha('Faturar em 90 dias', 'R$ 60.000', 'q2', True), revisao_linha('Já garantido', 'R$ 15.000', 'q3')])}
      {grupo('Seu negócio', [revisao_linha('Como você cobra', '{{modeloRotulo}}', 'q1', True), revisao_linha('Valor de um projeto', 'R$ 15.000', 'q4'), revisao_linha('Negociando agora', '{{neg}} empresas', 'q5')])}
      {grupo('Seu ritmo', [revisao_linha('Empresas novas por semana', '{{ritmoRotulo}}', 'q6', True)])}
      <div style="position: absolute; left: 16px; right: 16px; bottom: 32px"><button type="button" onClick="{{{{seguir}}}}" style="{BTN1}; width: 100%">Ver meu plano</button></div>
    </div>
  </sc-if>
'''
    res = f'''  <sc-if value="{{{{p.t05}}}}" hint-placeholder-val="{{{{false}}}}">
    <div style="position: absolute; inset: 0; box-sizing: border-box; padding: 60px 16px 0; display: flex; flex-direction: column; gap: 20px">
      <div style="display: flex; flex-direction: column; gap: 4px">
        <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Seu plano · 90 dias</p>
        <h1 style="{H1}; {NUM}">R$ 45.000 a conquistar</h1>
      </div>
      {barra(25, 'R$ 15.000 já garantidos', 'meta R$ 60.000')}
      <ul style="list-style: none; margin: 0; padding: 0 16px; {CARD}">
        {linha('cerca de 3', 'vendas novas, com projeto de R$ 15.000', True)}
        {linha('10 por semana', 'empresas novas, o ritmo que você declarou')}
        {linha('{{neg}}', 'negociações em aberto, todas a registrar')}
      </ul>
      {NAO_SEI}
      <div style="position: absolute; left: 16px; right: 16px; bottom: 32px; display: flex; flex-direction: column; gap: 8px; align-items: center">
        <button type="button" onClick="{{{{ir.t04}}}}" style="{LINK}">Editar o plano</button>
        <a href="GranaCadastroMobile.dc.html" style="{BTN1}; width: 100%">Cadastrar minhas negociações</a>
      </div>
    </div>
  </sc-if>
'''
    corpo = (f'<div style="width: 390px; height: 844px; position: relative; overflow: hidden; background: {FUNDO}; color: {TINTA}; font-family: {SANS}">\n'
             + t01 + q1 + q2 + q3 + q4 + q5 + q6 + rev + res + '</div>')
    logica = '''passos() { return ['t01', 'q1', 'q2', 'q3', 'q4', 'q5', 'q6', 't04', 't05']; }
  renderVals() {
    const s = this.state || {};
    const xs = this.passos();
    const i = s.i ?? 0;
    const modelo = s.modelo ?? 1;
    const ritmo = s.ritmo ?? 2;
    const neg = s.neg ?? 8;
    const p = {};
    xs.forEach((k, n) => { p[k] = n === i; });
    const ir = {};
    xs.forEach((k, n) => { ir[k] = () => this.setState({ i: n }); });
    const lista = (rotulos, atual, campo) => rotulos.map((rotulo, n) => ({ rotulo, on: n === atual, off: n !== atual, pick: () => this.setState({ [campo]: n }) }));
    const modelos = ['Mensalidade', 'Projeto fechado', 'Mensalidade + implantação', 'Ainda não vendi'];
    const ritmos = ['2', '5', '10', '20', 'Mais de 20'];
    return {
      p, ir, neg,
      modelos: lista(modelos, modelo, 'modelo'),
      ritmos: lista(ritmos, ritmo, 'ritmo'),
      modeloRotulo: modelos[modelo],
      ritmoRotulo: ritmos[ritmo],
      seguir: () => this.setState({ i: Math.min(i + 1, xs.length - 1) }),
      voltar: () => this.setState({ i: Math.max(i - 1, 0) }),
      menos: () => this.setState({ neg: Math.max(neg - 1, 0) }),
      mais: () => this.setState({ neg: neg + 1 })
    };
  }'''
    write('GranaPlanoMobile', page('Grana · primeiro plano (celular)', corpo, logica))


# ---------------------------------------------------------------- estados do resultado (T06, T07, T13) e primeira ação (T08)

def rodape(principal, secundaria=''):
    return (f'  <div style="position: absolute; left: 16px; right: 16px; bottom: 32px; display: flex; flex-direction: column; gap: 8px; align-items: center">\n'
            f'{secundaria}    {principal}\n  </div>\n')


def gen_estados():
    t06 = f'''  <div style="display: flex; flex-direction: column; gap: 4px">
    <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Seu plano · 90 dias</p>
    <h1 style="{H1}">Dá para começar, mas falta um número.</h1>
  </div>
  <p style="margin: 0; {B}">Sem saber quanto vale uma venda sua, não consigo dizer quantas você precisa. O resto do plano está de pé.</p>
  <ul style="list-style: none; margin: 0; padding: 0 16px; {CARD}">
    {linha('R$ 45.000', 'a conquistar, com R$ 15.000 já garantidos', True)}
    {linha('—', 'vendas novas: falta o valor de uma venda', extra=f'<span style="{S}; font-weight: 600; color: {TINTA}">Informar</span>')}
    {linha('10 por semana', 'empresas novas, o ritmo que você declarou')}
    {linha('8', 'negociações em aberto, todas a registrar')}
  </ul>
''' + rodape(f'<button type="button" style="{BTN1}; width: 100%">Informar o valor de uma venda</button>', f'    <a href="HojeMobile.dc.html" style="{LINK}">Depois</a>\n')
    write('GranaSemTicketMobile', page('Grana · plano sem valor de venda (celular)', tela(t06)))

    t07 = f'''  <div style="display: flex; flex-direction: column; gap: 4px">
    <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Seu plano · 90 dias</p>
    <h1 style="{H1}">O que já está contratado cobre este plano.</h1>
  </div>
  {barra(100, 'R$ 60.000 garantidos', 'meta R$ 50.000')}
  <p style="margin: 0; {B}">O risco aqui é perder o que você tem, não faltar venda nova. Hoje cuida primeiro dos compromissos e das negociações paradas.</p>
''' + rodape(f'<button type="button" style="{BTN1}; width: 100%">Revisar a meta</button>', f'    <a href="ConversasMobile.dc.html" style="{LINK}">Ver minhas negociações abertas</a>\n')
    write('GranaCobertaMobile', page('Grana · meta já coberta (celular)', tela(t07)))

    t13 = f'''  <p style="margin: 0; height: 44px; display: flex; align-items: center; gap: 8px; {B}; font-weight: 600">{icone('Grana', 20)}Grana</p>
  <div style="display: flex; flex-direction: column; gap: 8px">
    <h1 style="{H1}">Ainda não dá para montar o plano.</h1>
    <p style="margin: 0; {B}">Falta dizer como você cobra e qual é a sua meta. São duas perguntas.</p>
  </div>
''' + rodape(f'<a href="GranaPlanoMobile.dc.html" style="{BTN1}; width: 100%">Responder agora</a>')
    write('GranaSemDadosMobile', page('Grana · sem dados suficientes (celular)', tela(t13 + tabbar('Grana'))))

    t08 = f'''  <p style="margin: 0; height: 44px; display: flex; align-items: center; {B}; color: {NEVE_MEDIA}">Seu plano está pronto.</p>
  <section aria-label="Comece por aqui" style="background: {PAPEL}; color: {TINTA}; border-radius: 24px; padding: 20px; display: flex; flex-direction: column; gap: 16px">
    <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Comece por aqui</p>
    <div style="display: flex; flex-direction: column; gap: 8px">
      <h1 style="{H1}">Trazer 20 empresas novas</h1>
      <p style="margin: 0; {S}; color: {MEDIA}">O plano pede vendas novas e você aborda 10 por semana. Vinte é o seu ritmo de duas semanas.</p>
    </div>
    <a href="EmpresasEntradaMobile.dc.html" style="{BTN1}; align-self: flex-start"><svg viewBox="0 0 24 24" width="16" height="16" aria-hidden="true"><path d="M8 5.2v13.6a1 1 0 0 0 1.5.86l11-6.8a1 1 0 0 0 0-1.72l-11-6.8A1 1 0 0 0 8 5.2z" fill="currentColor"></path></svg>Começar</a>
  </section>
  <a href="HojeMobile.dc.html" style="{LINK}; color: {NEVE}; align-self: flex-start">Ver meu dia</a>
'''
    write('GranaComecoMobile', page('Grana · primeira ação (celular)', tela(t08, fundo=CARVAO, cor=NEVE, gap=24)))


# ---------------------------------------------------------------- a aba Grana no dia a dia

def gen_aba():
    cab = f'''  <header style="display: flex; justify-content: space-between; align-items: center; gap: 12px">
    <div>
      <h1 style="{H1}">Grana</h1>
      <p style="margin: 2px 0 0; {S}; color: {MEDIA}; {NUM}">Plano de 90 dias · faltam 83 dias</p>
    </div>
    <a href="GranaEditarMobile.dc.html" style="{LINK}">Editar</a>
  </header>
'''
    corpo = cab + f'''  <section aria-label="Meta" style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 16px">
    <div>
      <p style="margin: 0; font-family: {DISPLAY}; font-size: 32px; line-height: 36px; font-weight: 600; letter-spacing: -0.035em; {NUM}">R$ 30.000</p>
      <p style="margin: 2px 0 0; {S}; color: {MEDIA}">a conquistar · cerca de 2 vendas com projeto de R$ 15.000</p>
    </div>
    {barra(50, 'R$ 30.000 já garantidos', 'meta R$ 60.000')}
  </section>
  <ul style="list-style: none; margin: 0; padding: 0 16px; {CARD}">
    {linha('8', 'negociações em aberto · 3 cadastradas, 5 a registrar', True, f'<a href="GranaCadastroMobile.dc.html" style="{S}; font-weight: 600; color: {TINTA}; min-height: 44px; display: inline-flex; align-items: center">Cadastrar</a>')}
    {linha('2 de 3', 'tiveram movimento nas últimas duas semanas')}
    {linha('10 por semana', 'empresas novas, o ritmo que você declarou')}
  </ul>
  <a href="GranaSemanaMobile.dc.html" style="min-height: 56px; box-sizing: border-box; padding: 0 16px; {CARD}; color: {TINTA}; text-decoration: none; display: flex; align-items: center; gap: 12px"><span style="flex: 1; {B}; font-weight: 600">Semana passada</span><span style="{S}; color: {MEDIA}; {NUM}">7 de 10 abordagens</span>{CHEV}</a>
  <p style="margin: 0; {S}; color: {MEDIA}">Quantas conversas viram venda eu ainda não sei. Até lá, o plano mede o seu esforço, não uma previsão minha.</p>
''' + tabbar('Grana')
    write('GranaMobile', page('Grana (celular)', tela(corpo)))

    sem = f'''  <header>{voltar('GranaMobile.dc.html', 'Grana')}</header>
  <div style="display: flex; flex-direction: column; gap: 4px">
    <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Segunda, 9 de novembro</p>
    <h1 style="{H1}">Semana passada</h1>
  </div>
  <ul style="list-style: none; margin: 0; padding: 0 16px; {CARD}">
    {linha('7 de 10', 'empresas novas abordadas', True)}
    {linha('2', 'conversas novas')}
    {linha('1', 'proposta enviada')}
  </ul>
  <section style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 16px">
    <p style="margin: 0; {B}; font-weight: 600">2 negociações estão sem próximo passo.</p>
    <a href="ConversasMobile.dc.html" style="{BTN1}; align-self: flex-start">Resolver as duas</a>
  </section>
''' + tabbar('Grana')
    write('GranaSemanaMobile', page('Grana · semana passada (celular)', tela(sem)))

    edit = f'''  <header style="display: flex; justify-content: space-between; align-items: center">{voltar('GranaMobile.dc.html', 'Grana')}</header>
  <h1 style="{H1}">Seu plano</h1>
  {grupo('Sua meta', [revisao_linha('Faturar em 90 dias', 'R$ 60.000', 'meta', True), revisao_linha('Já garantido', 'R$ 30.000', 'garantido')])}
  {grupo('Seu negócio', [revisao_linha('Como você cobra', 'Projeto fechado', 'modelo', True), revisao_linha('Valor de um projeto', 'R$ 15.000', 'ticket')])}
  {grupo('Seu ritmo', [revisao_linha('Empresas novas por semana', '10', 'ritmo', True)])}
  <p style="margin: 0; {S}; color: {MEDIA}">Os 90 dias não mudam aqui: vão de 30/10/2026 a 27/01/2027. Para outro período, encerre este plano e abra o próximo.</p>
''' + rodape(f'<button type="button" style="{BTN1}; width: 100%">Salvar</button>')
    logica_edit = '''renderVals() {
    const nada = () => {};
    return { ir: { meta: nada, garantido: nada, modelo: nada, ticket: nada, ritmo: nada } };
  }'''
    write('GranaEditarMobile', page('Grana · editar o plano (celular)', tela(edit), logica_edit))


# ---------------------------------------------------------------- cadastro progressivo (T10)

CAD_LOGICA = '''renderVals() {
    const s = this.state || {};
    const falta = s.falta ?? 5;
    const antes = s.antes ?? 0;
    const ponto = s.ponto ?? 1;
    const lista = (rotulos, atual, campo) => rotulos.map((rotulo, n) => ({ rotulo, on: n === atual, off: n !== atual, pick: () => this.setState({ [campo]: n }) }));
    return {
      falta, temFalta: falta > 0, tudo: falta === 0,
      titulo: falta === 1 ? 'Você tem 1 negociação para registrar.' : 'Você tem ' + falta + ' negociações para registrar.',
      antes: lista(['Sim', 'Não'], antes, 'antes'),
      pontos: lista(['Para abordar', 'Em conversa', 'Proposta'], ponto, 'ponto'),
      salvar: () => this.setState({ falta: Math.max(falta - 1, 0) }),
      terminei: () => this.setState({ falta: 0 })
    };
  }'''


def form_cadastro(lab='12px'):
    lb = f'style="{S}; font-weight: 600; color: {MEDIA}"'
    return f'''      <div style="display: flex; flex-direction: column; gap: 8px">
        <label for="g-empresa" {lb}>Empresa</label>
        <input id="g-empresa" type="text" value="Pedrosa Logística" style="height: 48px; box-sizing: border-box; padding: 0 16px; border-radius: 16px; border: 1px solid {CARVAO}; background: {PAPEL}; color: {TINTA}; font: inherit; {B}">
      </div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <p id="g-antes" style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Essa negociação já existia antes do seu plano?</p>
{chips('antes')}      </div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <p style="margin: 0; {S}; font-weight: 600; color: {MEDIA}">Em que ponto está</p>
{chips('pontos')}      </div>
      <div style="display: flex; flex-direction: column; gap: 8px">
        <label for="g-valor" {lb}>Valor · se souber</label>
        <input id="g-valor" type="text" inputmode="numeric" placeholder="R$" style="height: 48px; box-sizing: border-box; padding: 0 16px; border-radius: 16px; border: 1px solid {LINHA}; background: {PAPEL}; color: {TINTA}; font: inherit; {B}; {NUM}">
      </div>
'''


def gen_cadastro():
    corpo = f'''  <header>{voltar('GranaMobile.dc.html', 'Grana')}</header>
  <sc-if value="{{{{temFalta}}}}" hint-placeholder-val="{{{{true}}}}">
    <div style="display: flex; flex-direction: column; gap: 20px">
      <div style="display: flex; flex-direction: column; gap: 8px">
        <h1 style="{H1}; {NUM}">{{{{titulo}}}}</h1>
        <p style="margin: 0; {B}; color: {MEDIA}">Uma de cada vez. Nome da empresa já basta para começar.</p>
      </div>
{form_cadastro()}    </div>
    <div style="position: absolute; left: 16px; right: 16px; bottom: 32px; display: flex; flex-direction: column; gap: 8px; align-items: center">
      <button type="button" onClick="{{{{terminei}}}}" style="{LINK}">Terminei</button>
      <button type="button" onClick="{{{{salvar}}}}" style="{BTN1}; width: 100%">Salvar e cadastrar outra</button>
    </div>
  </sc-if>
  <sc-if value="{{{{tudo}}}}" hint-placeholder-val="{{{{false}}}}">
    <div style="display: flex; flex-direction: column; gap: 8px">
      <h1 style="{H1}">Tudo cadastrado.</h1>
      <p style="margin: 0; {B}; color: {MEDIA}">A partir de agora a conta do plano usa só o que está cadastrado.</p>
    </div>
    <div style="position: absolute; left: 16px; right: 16px; bottom: 32px"><a href="GranaMobile.dc.html" style="{BTN1}; width: 100%">Voltar ao plano</a></div>
  </sc-if>
'''
    write('GranaCadastroMobile', page('Grana · cadastrar negociações (celular)', tela(corpo), CAD_LOGICA))

    webc = f'''    <header style="display: flex; flex-direction: column; gap: 2px">
      {voltar('Grana.dc.html', 'Grana')}
    </header>
    <sc-if value="{{{{temFalta}}}}" hint-placeholder-val="{{{{true}}}}">
      <section style="max-width: 560px; {CARD}; padding: 32px; display: flex; flex-direction: column; gap: 24px">
        <div style="display: flex; flex-direction: column; gap: 8px">
          <h1 style="{H1W}; {NUM}">{{{{titulo}}}}</h1>
          <p style="margin: 0; {B}; color: {MEDIA}">Uma de cada vez. Nome da empresa já basta para começar.</p>
        </div>
{form_cadastro()}        <div style="display: flex; flex-wrap: wrap; gap: 12px; align-items: center">
          <button type="button" onClick="{{{{salvar}}}}" style="{BTN1}">Salvar e cadastrar outra</button>
          <button type="button" onClick="{{{{terminei}}}}" style="{LINK}">Terminei</button>
        </div>
      </section>
    </sc-if>
    <sc-if value="{{{{tudo}}}}" hint-placeholder-val="{{{{false}}}}">
      <section style="max-width: 560px; {CARD}; padding: 32px; display: flex; flex-direction: column; gap: 16px">
        <h1 style="{H1W}">Tudo cadastrado.</h1>
        <p style="margin: 0; {B}; color: {MEDIA}">A partir de agora a conta do plano usa só o que está cadastrado.</p>
        <a href="Grana.dc.html" style="{BTN1}; align-self: flex-start">Voltar ao plano</a>
      </section>
    </sc-if>
'''
    write('GranaCadastro', page('Grana · cadastrar negociações (web)', web(webc), CAD_LOGICA, w=1440, h=900))


# ---------------------------------------------------------------- a aba Grana no web

def gen_web():
    lin = lambda n, t, p=False, e='': linha(n, t, p, e).replace(f'{S}; color: {MEDIA}">', f'{SW}; color: {MEDIA}">')
    corpo = f'''    <header style="display: flex; flex-wrap: wrap; justify-content: space-between; align-items: flex-end; gap: 16px">
      <div>
        <p style="margin: 0; {SW}; color: {MEDIA}; {NUM}">Plano de 90 dias · 30/10/2026 a 27/01/2027 · faltam 83 dias</p>
        <h1 style="margin: 2px 0 0; {H1W[len('margin: 0; '):]}">Grana</h1>
      </div>
      <a href="#" style="{BTN2}">Editar o plano</a>
    </header>
    <div style="display: flex; flex-wrap: wrap; gap: 24px; align-items: flex-start">
      <div style="flex: 1.6 1 480px; min-width: 0; display: flex; flex-direction: column; gap: 24px">
        <section aria-label="Meta" style="{CARD}; padding: 28px 32px 32px; display: flex; flex-direction: column; gap: 20px">
          <div>
            <p style="margin: 0; {SW}; font-weight: 600; color: {MEDIA}">Seu plano · projeto fechado</p>
            <p style="margin: 4px 0 0; {H1W[len('margin: 0; '):]}; {NUM}">R$ 30.000 a conquistar</p>
            <p style="margin: 4px 0 0; {B}; color: {MEDIA}">São cerca de 2 vendas novas, com projeto de R$ 15.000.</p>
          </div>
          {barra(50, 'R$ 30.000 já garantidos', 'meta R$ 60.000').replace(S, SW)}
          <p style="margin: 0; {SW}; color: {MEDIA}">Garantido = R$ 15.000 de contrato que você já tinha + a venda da Acme, de R$ 15.000, em 3/11.</p>
        </section>
        <section style="{CARD}; overflow: hidden">
          <div style="padding: 16px 24px"><h2 style="margin: 0; {B}; font-weight: 600">Sua carteira</h2></div>
          <ul style="list-style: none; margin: 0; padding: 0 24px; border-top: 1px solid {LINHA2}">
            {lin('8', 'negociações em aberto · 3 cadastradas, 5 que você ainda não registrou', True, f'<a href="GranaCadastro.dc.html" style="{BTN2}">Cadastrar</a>')}
            {lin('2 de 3', 'tiveram movimento nas últimas duas semanas')}
            {lin('1', 'sem próximo passo · Nuvem Labs', False, f'<a href="Conversa.dc.html" style="{BTN2}">Abrir</a>')}
          </ul>
        </section>
      </div>
      <div style="flex: 1 1 300px; min-width: 0; display: flex; flex-direction: column; gap: 24px">
        <section style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
          <div style="display: flex; justify-content: space-between; align-items: baseline; gap: 12px"><h2 style="margin: 0; {B}; font-weight: 600">Semana passada</h2><span style="{SW}; color: {MEDIA}">seg, 2/11 a sex, 6/11</span></div>
          <ul style="list-style: none; margin: 0; padding: 0">
            {lin('7 de 10', 'empresas novas abordadas', True)}
            {lin('2', 'conversas novas')}
            {lin('1', 'proposta enviada')}
          </ul>
        </section>
        <section style="{CARD}; padding: 24px; display: flex; flex-direction: column; gap: 12px">
          <h2 style="margin: 0; {B}; font-weight: 600">Seu ritmo</h2>
          <p style="margin: 0; {SW}; color: {MEDIA}">10 empresas novas por semana, como você declarou. A próxima busca traz as dessa semana.</p>
          <a href="Empresas.dc.html" style="{BTN2}; align-self: flex-start">Ver empresas{SETA}</a>
        </section>
        {NAO_SEI.replace(S, SW)}
      </div>
    </div>
'''
    write('Grana', page('Grana (web)', web(corpo), w=1440, h=900))


# ---------------------------------------------------------------- ficha de regras (para quem for programar)

def gen_regras():
    th = f'style="text-align: left; padding: 10px 12px; {SW}; font-weight: 600; color: {MEDIA}; border-bottom: 1px solid {LINHA}"'
    td = f'style="padding: 10px 12px; {SW}; vertical-align: top; border-bottom: 1px solid {LINHA2}"'
    tdm = f'style="padding: 10px 12px; font-family: {MONO}; font-size: 13px; line-height: 18px; vertical-align: top; border-bottom: 1px solid {LINHA2}"'

    def tabela(cab, linhas, mono_col=None):
        h = ''.join(f'<th {th}>{c}</th>' for c in cab)
        b = ''
        for l in linhas:
            b += '<tr>' + ''.join(f'<td {tdm if i == mono_col else td}>{c}</td>' for i, c in enumerate(l)) + '</tr>'
        return f'<table style="width: 100%; border-collapse: collapse"><thead><tr>{h}</tr></thead><tbody>{b}</tbody></table>'

    def bloco(titulo, conteudo, sub=''):
        s = f'<p style="margin: 4px 0 0; {SW}; color: {MEDIA}">{sub}</p>' if sub else ''
        return (f'<section style="{CARD}; padding: 28px; display: flex; flex-direction: column; gap: 16px">'
                f'<div><h2 style="margin: 0; font-family: {DISPLAY}; font-size: 24px; line-height: 28px; font-weight: 600; letter-spacing: -0.03em">{titulo}</h2>{s}</div>{conteudo}</section>')

    perguntas = tabela(['#', 'Pergunta (projeto)', 'Não sei', 'Variável'], [
        ['Q1', 'Como você cobra os seus clientes? Mensalidade · Projeto fechado · Mensalidade + implantação · Ainda não vendi', '“Ainda não vendi” abre Q1b: e como pretende cobrar?', 'modelo'],
        ['Q2', 'Quanto você quer faturar nos próximos 90 dias? (mensalidade: quanto quer faturar por mês quando o plano terminar)', 'Pergunta quanto entrou nos últimos 90 dias e propõe o mesmo valor', 'metaProjeto · metaMrr'],
        ['Q3', 'De contrato já assinado, quanto você vai faturar nos próximos 90 dias? (mensalidade: quanto fatura hoje)', '“Não tenho nada garantido” = 0 declarado', 'contratosAFaturar · mrrAtual'],
        ['Q3b/c', 'Alguma mensalidade já tem data para terminar nos 90 dias? Quanto por mês deixa de entrar?', 'Só com mensalidade ativa', 'mrrPerdaConhecida'],
        ['Q4', 'Quanto costuma valer um projeto seu?', 'Último que fechou → quanto pretende cobrar (estimado) → desconhecido', 'ticketProjeto · ticketMrr'],
        ['Q5', 'Com quantas empresas você está negociando agora?', 'Zero vale', 'negociacoesDeclaradas'],
        ['Q6', 'Numa semana normal, quantas empresas novas você consegue abordar? 2 · 5 · 10 · 20 · Mais de 20', '“Não sei estimar” = desconhecido; o plano sai sem rotina', 'capacidadeSemanal'],
    ])
    conta = tabela(['Número', 'Conta', 'Quando falta dado'], [
        ['Previsto de mensalidade', 'max(mrrAtual − mrrPerdaConhecida + Σ mensalidade das ganhas, 0)', 'padrão 0 declarado'],
        ['Previsto de projeto', 'contratosAFaturar + Σ valor × min(3, parcelas) / parcelas das ganhas', 'parcelas > 1 marca as vendas com ~'],
        ['Lacuna', 'max(meta − previsto, 0), mensalidade e projeto separados', 'meta desconhecida → null e plano incompleto (T13)'],
        ['Vendas de referência', 'ceil(lacuna / ticket); no misto, max(mensalidade, projeto) enquanto toda venda tiver os dois', 'ticket desconhecido → null (T06)'],
        ['Carteira', 'cadastradas abertas + max(declaradas − preexistentes cadastradas, 0) até o dia 14', 'declaradas nunca viram card'],
        ['Primeira busca', 'capacidade × 2 quando precisa prospectar', 'capacidade desconhecida ou 0 → não abre'],
        ['Movimento', 'abertas com interação nos últimos 14 dias, sobre o total', 'sem meta: só a proporção'],
    ], mono_col=1)
    m135 = tabela(['', 'O quê', 'Onde aparece'], [
        ['Norte', 'Receita a conquistar (meta − garantido)', 'Grana'],
        ['S1', 'Cerca de N vendas novas', 'Grana'],
        ['S2', 'Empresas novas por semana (o ritmo declarado)', 'Grana, Empresas, segunda-feira'],
        ['S3', 'Negociações com movimento em 14 dias, sem meta', 'Grana'],
        ['O1', 'Empresas novas abordadas na semana', 'Segunda-feira'],
        ['O2', 'Conversas iniciadas', 'Segunda-feira'],
        ['O3', 'Negociações paradas há mais de 14 dias', 'Hoje'],
        ['O4', 'Próximos passos vencidos', 'Hoje'],
        ['O5', 'Negociações sem próximo passo, meta zero', 'Hoje, segunda-feira'],
    ])
    prio = tabela(['Nível', 'Entra', 'Ordem'], [
        ['1 · compromisso', 'Conversa com próximo passo combinado para hoje ou antes', 'Mais vencido → maior valor nos 90 dias → nome'],
        ['2 · intervenção', 'Conversa sem próximo passo', 'Proposta → conversa → para abordar → mais tempo parada → valor → nome'],
        ['3 · prospecção', 'No máximo 1 card: buscar empresas, ou informar o ritmo se ele for desconhecido', 'Só se o plano pede venda nova'],
    ])
    nao = tabela(['Não calcula', 'Por quê'], [
        ['Previsão de faturamento', 'Exigiria taxa de conversão que o produto ainda não tem'],
        ['Chance de bater a meta', 'Idem'],
        ['Viável ou inviável', 'Os dados não dão um limite rigoroso'],
        ['Previsão por etapa', 'Conversas não tem etapas nem probabilidade por estágio'],
        ['Causa do gargalo', 'O produto vê correlação, nunca causa'],
        ['Caixa, cobrança, contas a receber', 'Fora do escopo: o plano é de faturamento, nunca de dinheiro recebido'],
    ])
    tom = tabela(['Diz assim', 'Não diz'], [
        ['Você já tem R$ 30.000 previstos. Faltam R$ 30.000.', 'Falta pouco, vamos lá!'],
        ['Quatro propostas estão esperando resposta.', 'Que tal dar aquele gás nas propostas?'],
        ['Ainda não dá para dizer quantas conversas viram venda.', 'Sua conversão está abaixo do mercado.'],
        ['Combinado há 6 dias.', 'Você falhou com este cliente.'],
    ])
    nossas = f'''<ul style="margin: 0; padding-left: 20px; display: flex; flex-direction: column; gap: 8px; {SW}">
<li><strong style="font-weight: 600">Conversas sem etapas.</strong> A situação lida do WhatsApp e do e-mail faz o papel do estágio (para abordar, conversa, proposta). Ganhou ou perdeu é o único toque à mão.</li>
<li><strong style="font-weight: 600">Nomes do produto.</strong> Pipeline e Caçada da especificação são Conversas e Empresas.</li>
<li><strong style="font-weight: 600">Seis perguntas, não sete.</strong> O objetivo da especificação fala em sete respostas; o questionário vai de Q1 a Q6.</li>
<li><strong style="font-weight: 600">Sem placar.</strong> Saem do produto a sequência de dias, o recorde e a meta do mês com previsão. O Hoje não mostra número de meta.</li>
<li><strong style="font-weight: 600">Tecnologia é nossa.</strong> A da especificação bate com a que já usamos (a mesma do Plandon), mas a decisão é nossa.</li>
</ul>'''
    corpo = f'''<div style="width: 1440px; box-sizing: border-box; padding: 64px 80px; background: {FUNDO}; color: {TINTA}; font-family: {SANS}; display: flex; flex-direction: column; gap: 32px">
  <header style="display: flex; justify-content: space-between; align-items: flex-end; gap: 48px">
    <div style="display: flex; flex-direction: column; gap: 12px">
      <p style="margin: 0; {SW}; font-weight: 600; color: {MEDIA}">Grana · especificação do David, 04/11/2026</p>
      <h1 style="margin: 0; font-family: {DISPLAY}; font-size: 56px; line-height: 1.05; font-weight: 600; letter-spacing: -0.04em">Seis perguntas, um plano de 90 dias.</h1>
    </div>
    <p style="margin: 0; max-width: 440px; {B}; color: {MEDIA}">O Grana responde quatro coisas e só: quanto falta para a meta, quantas vendas isso dá, o que está em aberto hoje e o que fazer primeiro. Desconhecido nunca vira zero.</p>
  </header>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px; align-items: start">
    <div style="display: flex; flex-direction: column; gap: 24px">
      {bloco('As perguntas', perguntas, 'Uma por tela. 4 a 13 telas conforme o jeito de cobrar; 6 no caso de projeto.')}
      {bloco('A conta', conta, 'Tudo é aritmética sobre o que o fundador disse e registrou. Nenhuma taxa de conversão.')}
      {bloco('O que fica de fora', nao)}
    </div>
    <div style="display: flex; flex-direction: column; gap: 24px">
      {bloco('1-3-5', m135, 'Nove números por trás, nunca os nove na mesma tela.')}
      {bloco('As três do Hoje', prio, 'Mesma entrada, mesma saída. Nunca mais de 3 cards, nunca card de negociação só declarada. Valor só desempata.')}
      {bloco('O tom', tom, 'Colega competente que leu os dados antes de você acordar. Sem exclamação, sem “parabéns”, sem placar.')}
      {bloco('O que decidimos por cima', nossas, '05/11/2026')}
    </div>
  </div>
</div>'''
    write('GranaRegras', page('Grana · regras, conta e tom', corpo, w=1440, h=2300))


if __name__ == '__main__':
    gen_plano_mobile()
    gen_estados()
    gen_aba()
    gen_cadastro()
    gen_web()
    gen_regras()
