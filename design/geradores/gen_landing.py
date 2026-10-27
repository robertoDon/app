# Landing web, landing celular e lista de espera da Dalva.
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from dalva import *
OUT = os.path.join(os.path.dirname(__file__), 'project')
exec(open(os.path.join(os.path.dirname(__file__), 'gen_brand2.py')).read().split('# ---------- Main')[0])

def shell(title, w, h, body, bg='#FFFFFF'):
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
<div style="width: {w}px; min-height: {h}px; box-sizing: border-box; background: {bg}; color: {NOITE}; font-family: {SANS}">
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

LOGO = lambda s=24, c=NOITE: f'<p class="ds" style="margin: 0; font-size: {s}px; font-weight: 700; letter-spacing: -0.035em; color: {c}">Dalva</p>'

def phone(w=300):
    k = w / 300
    pr = [('1', 'Retomar a Acme', 'Proposta parada há 6 dias', pill('6 dias', 'late')),
          ('2', 'Enviar proposta à Orbita', 'Você prometeu para hoje', pill('17h', 'today')),
          ('3', 'Falar com a Ilha Digital', 'Achada esta noite · decisor: Carla', pill('nova', 'calm'))]
    rows = ''.join(f'<div style="display: flex; gap: 10px; align-items: center; padding: 11px 12px; background: #FFFFFF; border-radius: 14px; box-shadow: 0 0 0 1px {LINE}"><span class="ds" style="font-size: 16px; font-weight: 700; width: 12px">{n}</span>'
                   f'<div style="flex: 1; min-width: 0"><p style="margin: 0; font-size: 13px; font-weight: 600">{t}</p><p style="margin: 2px 0 0; font-size: 11px; color: {MUTE}">{s}</p></div>{p.replace("font-size: 13px", "font-size: 11px").replace("padding: 5px 10px", "padding: 3px 8px")}</div>' for n, t, s, p in pr)
    return f'''<div style="width: {w}px; height: {int(610 * k)}px; border-radius: {int(46 * k)}px; background: {NOITE}; padding: {int(10 * k)}px; box-sizing: border-box; box-shadow: 0 30px 60px rgba(17,19,31,0.18), 0 2px 6px rgba(17,19,31,0.1); flex-shrink: 0">
      <div style="width: 100%; height: 100%; border-radius: {int(37 * k)}px; background: {BRUMA}; overflow: hidden; padding: 44px 14px 0; box-sizing: border-box; display: flex; flex-direction: column; gap: 12px">
        <div style="display: flex; justify-content: space-between; align-items: center; padding: 0 4px">{LOGO(17)}<span style="width: 28px; height: 28px; border-radius: 14px; background: #E6E2DB; display: inline-flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 600; color: {INK2}">RB</span></div>
        <div style="padding: 4px 4px 0"><p style="margin: 0; font-size: 11px; color: {MUTE}">Terça, 27 de outubro</p><p class="ds" style="margin: 2px 0 0; font-size: 21px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15">Bom dia. Estas são suas 3 prioridades.</p></div>
        <div style="background: {NOITE}; color: #FFFFFF; border-radius: 16px; padding: 12px 14px"><p style="margin: 0; font-size: 11px; font-weight: 600; color: {CORAL}">Esta noite</p><p style="margin: 3px 0 0; font-size: 13px; font-weight: 600; line-height: 1.35">Achei 18 empresas que podem comprar de você.</p></div>
        {rows}
      </div>
    </div>'''

W = 1440
PAD = 'padding-left: 80px; padding-right: 80px'
def section(inner, bg='#FFFFFF', pad='112px'):
    return f'<section style="background: {bg}; padding-top: {pad}; padding-bottom: {pad}; {PAD}">{inner}</section>\n'
def h2(k, t, sub='', c=NOITE, center=False):
    al = 'text-align: center; margin-left: auto; margin-right: auto;' if center else ''
    s = f'<p style="margin: 16px 0 0; font-size: 19px; line-height: 1.5; color: {MUTE if c == NOITE else "#A6A9B6"}; max-width: 620px; {al}">{sub}</p>' if sub else ''
    return f'<div style="{al} max-width: 820px">{kick(k, CORAL if c != NOITE else MUTE)}<h2 style="margin: 14px 0 0; font-size: 52px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; color: {c}">{t}</h2>{s}</div>'

nav = f'''<nav style="display: flex; justify-content: space-between; align-items: center; height: 76px; {PAD}; border-bottom: 1px solid {LINE}">
  {LOGO()}
  <div style="display: flex; gap: 32px; font-size: 15px; font-weight: 500"><a href="#" style="text-decoration: none">Como funciona</a><a href="#" style="text-decoration: none">Preços</a><a href="#" style="text-decoration: none">Perguntas</a></div>
  <div style="display: flex; gap: 10px; align-items: center"><a href="#" style="font-size: 15px; font-weight: 500; text-decoration: none; padding: 0 12px">Entrar</a>{btn("Testar grátis", "noite", 14)}</div>
</nav>'''

hero = f'''<section style="{PAD}; padding-top: 96px; padding-bottom: 104px; display: flex; justify-content: space-between; align-items: center; gap: 64px; background: linear-gradient(180deg, #FFFFFF, {BRUMA})">
  <div style="max-width: 680px; display: flex; flex-direction: column; gap: 28px">
    <p style="margin: 0; display: inline-flex; align-self: flex-start; gap: 8px; align-items: center; font-size: 14px; font-weight: 500; color: {INK2}; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 999px; padding: 7px 14px"><span style="width: 7px; height: 7px; border-radius: 4px; background: {CORAL}"></span>Assistente comercial para empresas de 1 a 10 pessoas</p>
    <h1 style="margin: 0; font-size: 84px; font-weight: 700; letter-spacing: -0.05em; line-height: 0.98">Prospecção que acontece enquanto você dorme.</h1>
    <p style="margin: 0; font-size: 21px; line-height: 1.5; color: {MUTE}; max-width: 560px">A Dalva acha empresas que podem comprar de você, escreve a primeira mensagem no seu tom e abre seu dia com três ações, na ordem.</p>
    <div style="display: flex; gap: 12px">{btn("Testar 7 dias grátis", "coral", 17).replace("padding: 12px 22px", "padding: 16px 28px")}{btn("Ver como funciona", "ghost", 17).replace("padding: 12px 22px", "padding: 16px 28px")}</div>
    <p style="margin: 0; font-size: 14px; color: {MUTE}">Sem cartão · depois R$ 19,90 por mês · cancela em um toque</p>
  </div>
  <div style="position: relative; padding-right: 40px">{phone(320)}
    <div style="position: absolute; left: -150px; bottom: 90px; width: 230px; background: #FFFFFF; border-radius: 18px; padding: 16px; box-shadow: 0 0 0 1px {LINE}, 0 18px 40px rgba(17,19,31,0.12)"><p style="margin: 0; font-size: 12px; color: {MUTE}">Mensagem sugerida · no seu tom</p><p style="margin: 8px 0 0; font-size: 14px; line-height: 1.45">“Oi, Carla! Vi que a Ilha Digital abriu vaga de vendas. Posso te mostrar como…”</p><div style="margin-top: 12px; display: flex; gap: 8px"><span style="font-size: 12px; font-weight: 600; background: {NOITE}; color: #FFFFFF; border-radius: 999px; padding: 6px 12px">Enviar</span><span style="font-size: 12px; font-weight: 600; color: {INK2}; padding: 6px 4px">Editar</span></div></div>
  </div>
</section>'''

quote = section(f'<p class="ds" style="margin: 0 auto; max-width: 1000px; text-align: center; font-size: 54px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.12; color: #FFFFFF">Nenhum fundador perde venda por falta de esforço. <span style="color: {CORAL}">Perde por não saber por onde começar o dia.</span></p>', NOITE, '120px')

def mini(kind):
    if kind == 'enc':
        r = ''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 13px"><span><span style="font-weight: 600">{a}</span> <span style="color: {MUTE}">· {b}</span></span><span style="font-size: 11px; color: {MUTE}">Receita Federal</span></div>' for a, b in [('Ilha Digital', 'Florianópolis'), ('Codemar', 'Joinville'), ('Vento Sul', 'Itajaí')])
        return f'<p style="margin: 0 0 6px; font-size: 13px; font-weight: 600">18 empresas no seu perfil</p>{r}'
    if kind == 'apr':
        return f'<p style="margin: 0; font-size: 12px; color: {MUTE}">Para Carla · Ilha Digital</p><p style="margin: 8px 0 0; font-size: 14px; line-height: 1.5">“Oi, Carla! Vi que vocês estão contratando vendas. Te mostro em 20 minutos como…”</p><div style="margin-top: 12px; display: flex; gap: 8px">{btn("Abrir no WhatsApp", "noite", 12).replace("padding: 12px 22px; min-height: 44px", "padding: 7px 12px; min-height: 0")}</div>'
    return ''.join(f'<div style="display: flex; justify-content: space-between; align-items: center; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 13px"><span style="font-weight: 600">{a}</span>{p}</div>' for a, p in [('Retomar a Acme', pill('6 dias', 'late')), ('Proposta Orbita', pill('hoje', 'today')), ('Demo Kora', pill('qui', 'calm'))]).replace('font-size: 13px; font-weight: 600; padding: 5px 10px', 'font-size: 11px; font-weight: 600; padding: 3px 8px')
pil = ''.join(f'''<article style="background: {BRUMA}; border-radius: 28px; padding: 32px; display: flex; flex-direction: column; gap: 20px">
      <div><p style="margin: 0; font-size: 14px; font-weight: 600; color: {MUTE}">0{i}</p><h3 style="margin: 8px 0 0; font-size: 32px; font-weight: 700; letter-spacing: -0.035em">{t}</h3><p style="margin: 10px 0 0; font-size: 17px; line-height: 1.5; color: {MUTE}">{d}</p></div>
      <div style="margin-top: auto; background: #FFFFFF; border-radius: 18px; padding: 16px; box-shadow: 0 0 0 1px {LINE}">{mini(k)}</div></article>'''
              for i, (t, d, k) in enumerate([('Encontra', 'Você descreve o cliente ideal em uma frase. A Dalva acha as empresas, com o decisor e o motivo para a conversa.', 'enc'),
                                             ('Aproxima', 'Uma mensagem para cada empresa, escrita no seu tom. Você revisa e manda. Nada sai sem você.', 'apr'),
                                             ('Executa', 'Próximo passo com data. Quando a conversa esfria, a Dalva avisa antes de o negócio morrer.', 'exe')], 1))
pilares = section(h2('Como a Dalva trabalha', 'Encontra. Aproxima. Executa.', 'Três movimentos, uma tela. Sem planilha para alimentar.') + f'<div style="margin-top: 56px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px">{pil}</div>')

def day(k, t, items, dark):
    c, m, bg = ('#FFFFFF', '#A6A9B6', NOITE) if dark else (NOITE, MUTE, '#FFFFFF')
    it = ''.join(f'<div style="padding: 18px 0; border-top: 1px solid {"rgba(255,255,255,0.12)" if dark else LINE}"><p style="margin: 0; font-size: 18px; font-weight: 600; color: {c}">{a}</p><p style="margin: 4px 0 0; font-size: 15px; color: {m}">{b}</p></div>' for a, b in items)
    return f'<article style="background: {bg}; border-radius: 28px; padding: 36px; {"box-shadow: 0 0 0 1px " + LINE if not dark else ""}">{kick(k, CORAL if dark else MUTE)}<h3 style="margin: 12px 0 18px; font-size: 32px; font-weight: 700; letter-spacing: -0.035em; color: {c}">{t}</h3>{it}</article>'
manha = section(h2('O mesmo dia', 'A manhã já chega decidida.') + f'''<div style="margin-top: 56px; display: grid; grid-template-columns: 1fr 1fr; gap: 20px">
    {day("Sem a Dalva", "Começa sem ordem.", [("A lista de empresas nunca sai", "Prospecção fica para quando sobrar tempo. Nunca sobra."), ("A proposta esquecida", "Ninguém lembra que a Acme respondeu há seis dias."), ("O dia decidido no impulso", "Atende quem grita mais alto, não quem está perto de comprar.")], False)}
    {day("Com a Dalva", "Começa pelo que importa.", [("18 empresas encontradas", "Achadas durante a noite, com mensagem sugerida."), ("Acme no topo da fila", "Parada há seis dias e perto de fechar."), ("Três ações para hoje", "Na ordem, com o motivo de cada uma ao lado.")], True)}
  </div>''', BRUMA)

steps = ''.join(f'<div style="display: flex; flex-direction: column; gap: 12px; padding-top: 22px; border-top: 2px solid {CORAL if i == 1 else LINE}"><span class="ds" style="font-size: 44px; font-weight: 700; letter-spacing: -0.04em; color: {NOITE if i == 1 else "#CFCAC1"}">{i}</span><p style="margin: 0; font-size: 20px; font-weight: 600">{t}</p><p style="margin: 0; font-size: 16px; line-height: 1.5; color: {MUTE}">{d}</p></div>'
                for i, (t, d) in enumerate([('Descreva', 'Uma frase sobre quem é seu cliente ideal.'), ('Receba', 'Empresas que batem com o perfil, toda manhã.'),
                                           ('Aborde', 'Mensagem pronta, no seu tom, para cada uma.'), ('Acompanhe', 'Próximo passo com data e aviso quando esfriar.')], 1))
etapas = section(h2('Em um minuto', 'Da primeira frase ao primeiro negócio.') + f'<div style="margin-top: 56px; display: grid; grid-template-columns: repeat(4, 1fr); gap: 28px">{steps}</div>')

rows = [('Custo por mês', 'R$ 0', 'R$ 90 a 400', 'R$ 3.000 ou mais', 'R$ 19,90'), ('Acha empresas para você', 'Não', 'Não', 'Sim', 'Sim'),
        ('Tempo para começar', 'Na hora', '2 a 4 semanas', '1 mês', '1 minuto'), ('Precisa de alguém alimentando', 'Sim', 'Sim', 'Não', 'Não'), ('Diz o que fazer hoje', 'Não', 'Não', 'Não', 'Sim')]
th = ''.join(f'<th style="padding: 16px 20px; text-align: left; font-size: 14px; font-weight: 600; {"background: " + NOITE + "; color: #FFFFFF; border-radius: 14px 14px 0 0" if h == "Dalva" else "color: " + MUTE}">{h}</th>' for h in ['', 'Planilha', 'CRM tradicional', 'Agência', 'Dalva'])
tr = ''.join('<tr>' + ''.join(f'<td style="padding: 16px 20px; border-top: 1px solid {LINE}; font-size: 16px; {"font-weight: 600" if j == 0 else ""}{"; background: " + NOITE + "; color: #FFFFFF; font-weight: 600; border-top-color: rgba(255,255,255,0.12)" if j == 4 else ""}">{v}</td>' for j, v in enumerate(r)) + '</tr>' for r in rows)
compara = section(h2('Comparando', 'Mais barato que um almoço. Faz mais que um CRM.') + f'<table style="margin-top: 48px; width: 100%; border-collapse: collapse"><thead><tr>{th}</tr></thead><tbody>{tr}</tbody></table><p style="margin: 16px 0 0; font-size: 13px; color: {MUTE}">Faixas de preço de mercado para referência. Conferir antes de publicar.</p>', BRUMA)

def plano(n, p, per, feats, cta, hl=False):
    c, m = ('#FFFFFF', '#A6A9B6') if hl else (NOITE, MUTE)
    f = ''.join(f'<p style="margin: 0; padding: 10px 0; border-top: 1px solid {"rgba(255,255,255,0.12)" if hl else LINE}; font-size: 15px; color: {c}">{x}</p>' for x in feats)
    tag = f'<span style="font-size: 12px; font-weight: 600; color: {NOITE}; background: {CORAL}; border-radius: 999px; padding: 4px 10px">mais usado</span>' if hl else ''
    return f'''<article style="background: {NOITE if hl else "#FFFFFF"}; border-radius: 28px; padding: 32px; display: flex; flex-direction: column; gap: 18px; box-shadow: 0 0 0 1px {NOITE if hl else LINE}">
      <div style="display: flex; justify-content: space-between; align-items: center"><p style="margin: 0; font-size: 17px; font-weight: 600; color: {c}">{n}</p>{tag}</div>
      <div><p class="ds" style="margin: 0; font-size: 52px; font-weight: 700; letter-spacing: -0.045em; color: {c}">{p}</p><p style="margin: 2px 0 0; font-size: 15px; color: {m}">{per}</p></div>
      <div>{f}</div><div style="margin-top: auto">{btn(cta, "coral" if hl else "ghost", 16).replace("padding: 12px 22px", "padding: 14px 22px; width: 100%")}</div></article>'''
precos = section(h2('Preços', 'Começa grátis. Fica por R$ 19,90.', 'Sem cartão para testar. Cancela em um toque, sem falar com ninguém.', center=True)
                 + f'''<div style="margin: 56px auto 0; max-width: 1080px; display: grid; grid-template-columns: repeat(3, 1fr); gap: 20px; align-items: stretch">
    {plano("Teste", "R$ 0", "por 7 dias", ["Busca de empresas limitada", "Três ações do dia", "Sem cartão de crédito"], "Começar teste")}
    {plano("Dalva", "R$ 19,90", "por mês", ["Busca de empresas sem limite", "Mensagem sugerida no seu tom", "Funil e próximos passos", "Resumo da manhã"], "Assinar agora", True)}
    {plano("Dalva Time", "R$ 59,90", "por mês, até 5 pessoas", ["Tudo do plano Dalva", "Funil compartilhado", "Meta por pessoa"], "Falar de time")}
  </div>''')

faq = ''.join(f'<div style="padding: 24px 0; border-top: 1px solid {LINE}; display: grid; grid-template-columns: 1fr 1.3fr; gap: 40px"><p style="margin: 0; font-size: 19px; font-weight: 600">{q}</p><p style="margin: 0; font-size: 17px; line-height: 1.55; color: {MUTE}">{a}</p></div>'
              for q, a in [('De onde vêm as empresas?', 'Da base pública de CNPJ da Receita Federal. Contato de decisor só aparece quando a Dalva encontra, e sempre com a fonte ao lado.'),
                           ('A Dalva manda mensagem sozinha?', 'Não. Ela escreve, você revisa e manda. Nada sai sem você.'),
                           ('Preciso migrar meu CRM?', 'Não. Importa uma planilha ou os contatos do Google, ou começa do zero com a primeira busca.'),
                           ('Serve para o meu negócio?', 'Se você vende para outras empresas e é quem vende, entrega e administra, foi feita para você.')])
perguntas = section(h2('Perguntas', 'Antes de testar.') + f'<div style="margin-top: 40px">{faq}</div>', BRUMA)

final = f'''<section style="background: {NOITE}; padding: 120px 80px 48px; color: #FFFFFF">
  <div style="display: flex; justify-content: space-between; align-items: flex-end; gap: 48px">
    <h2 style="margin: 0; font-size: 72px; font-weight: 700; letter-spacing: -0.045em; line-height: 1.02; max-width: 820px">Comece amanhã de manhã com o dia já decidido.</h2>
    <div style="display: flex; flex-direction: column; gap: 12px; align-items: flex-end">{btn("Testar 7 dias grátis", "coral", 17).replace("padding: 12px 22px", "padding: 16px 28px")}<p style="margin: 0; font-size: 14px; color: #A6A9B6">Sem cartão · R$ 19,90 por mês depois</p></div>
  </div>
  <div style="margin-top: 110px; padding-top: 28px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: space-between; align-items: center; font-size: 14px; color: #A6A9B6">
    <div style="display: flex; gap: 14px; align-items: baseline">{LOGO(20, "#FFFFFF")}<span>um produto Don</span></div><span>dalvaapp.com.br · contato@dalvaapp.com.br</span>
  </div>
</section>'''

land = nav + hero + quote + pilares + manha + etapas + compara + precos + perguntas + final
files = {'Landing.dc.html': shell('Landing', W, 900, land)}

# ---------- Landing celular (compra no celular, quase B2C) ----------
mp = lambda inner, bg='#FFFFFF', pad='56px 20px': f'<section style="background: {bg}; padding: {pad}">{inner}</section>\n'
mh2 = lambda k, t, c=NOITE: f'{kick(k, CORAL if c != NOITE else MUTE)}<h2 style="margin: 10px 0 0; font-size: 32px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.08; color: {c}">{t}</h2>'
mpil = ''.join(f'<div style="display: flex; gap: 14px; padding: 18px 0; border-top: 1px solid {LINE}"><span class="ds" style="font-size: 22px; font-weight: 700; color: {CORAL if i == 1 else "#CFCAC1"}">{i}</span><div><p style="margin: 0; font-size: 18px; font-weight: 600">{t}</p><p style="margin: 4px 0 0; font-size: 15px; line-height: 1.5; color: {MUTE}">{d}</p></div></div>'
               for i, (t, d) in enumerate([('Encontra', 'Empresas no seu perfil, com decisor e fonte do dado.'), ('Aproxima', 'Mensagem pronta no seu tom. Você revisa e manda.'), ('Executa', 'Três ações por dia, na ordem, com o motivo.')], 1))
mfaq = ''.join(f'<div style="padding: 16px 0; border-top: 1px solid {LINE}; display: flex; justify-content: space-between; gap: 12px; font-size: 16px; font-weight: 600"><span>{q}</span><span style="color: {MUTE}; font-weight: 400">+</span></div>'
               for q in ['De onde vêm as empresas?', 'A Dalva manda mensagem sozinha?', 'Preciso migrar meu CRM?', 'Como cancelo?'])
mob = (f'<nav style="height: 60px; padding: 0 20px; display: flex; justify-content: space-between; align-items: center; border-bottom: 1px solid {LINE}">{LOGO(20)}<a href="#" style="font-size: 15px; font-weight: 500; text-decoration: none">Entrar</a></nav>\n'
       + mp(f'''<p style="margin: 0; font-size: 13px; font-weight: 500; color: {INK2}">Para quem vende, entrega e administra</p>
  <h1 style="margin: 12px 0 0; font-size: 44px; font-weight: 700; letter-spacing: -0.045em; line-height: 1">Prospecção que acontece enquanto você dorme.</h1>
  <p style="margin: 16px 0 0; font-size: 17px; line-height: 1.5; color: {MUTE}">Você acorda com as empresas achadas e as três ações do dia em ordem.</p>
  <div style="margin-top: 24px">{btn("Testar 7 dias grátis", "coral", 17).replace("padding: 12px 22px", "padding: 16px 22px; width: 100%")}</div>
  <p style="margin: 12px 0 0; font-size: 13px; color: {MUTE}; text-align: center">Sem cartão · R$ 19,90/mês depois · cancela em um toque</p>
  <div style="margin-top: 40px; display: flex; justify-content: center">{phone(270)}</div>''', f'linear-gradient(180deg, #FFFFFF, {BRUMA})', '40px 20px 56px')
       + mp(f'<p class="ds" style="margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.035em; line-height: 1.15; color: #FFFFFF">Ninguém perde venda por preguiça. <span style="color: {CORAL}">Perde por não saber por onde começar o dia.</span></p>', NOITE)
       + mp(mh2('Como funciona', 'Encontra. Aproxima. Executa.') + f'<div style="margin-top: 20px">{mpil}</div>')
       + mp(mh2('Preço', 'Menos que um almoço.') + f'<div style="margin-top: 24px">{plano("Dalva", "R$ 19,90", "por mês, depois de 7 dias grátis", ["Empresas sem limite", "Mensagem no seu tom", "Funil e próximos passos"], "Testar grátis", True)}</div>'
            f'<p style="margin: 14px 0 0; font-size: 14px; color: {MUTE}; text-align: center">Time de até 5 pessoas: R$ 59,90 por mês.</p>', BRUMA)
       + mp(mh2('Perguntas', 'Antes de testar.') + f'<div style="margin-top: 16px">{mfaq}</div>')
       + mp(f'<h2 style="margin: 0; font-size: 34px; font-weight: 700; letter-spacing: -0.04em; line-height: 1.05; color: #FFFFFF">Comece amanhã de manhã com o dia já decidido.</h2>'
            f'<div style="margin-top: 24px">{btn("Testar 7 dias grátis", "coral", 17).replace("padding: 12px 22px", "padding: 16px 22px; width: 100%")}</div>'
            f'<div style="margin-top: 48px; padding-top: 20px; border-top: 1px solid rgba(255,255,255,0.12); display: flex; justify-content: space-between; align-items: baseline; font-size: 13px; color: #A6A9B6">{LOGO(18, "#FFFFFF")}<span>um produto Don</span></div>', NOITE, '56px 20px 40px'))
files['LandingMobile.dc.html'] = shell('Landing (celular)', 390, 844, mob)

# ---------- Lista de espera: teste fechado ----------
field = lambda lab, ph, t='text': f'<label style="display: flex; flex-direction: column; gap: 6px; font-size: 13px; font-weight: 600; color: {INK2}">{lab}<input type="{t}" placeholder="{ph}" style="font: inherit; font-size: 16px; font-weight: 400; padding: 14px 16px; border: 1px solid {LINE}; border-radius: 14px; background: #FFFFFF; color: {NOITE}"></label>'
wl = f'''<div style="height: 900px; box-sizing: border-box; padding: 40px 80px; display: flex; flex-direction: column; background: linear-gradient(180deg, #FFFFFF, {BRUMA})">
  <div style="display: flex; justify-content: space-between; align-items: center">{LOGO()}<span style="font-size: 14px; color: {MUTE}">um produto Don</span></div>
  <div style="flex: 1; display: flex; justify-content: space-between; align-items: center; gap: 64px">
    <div style="max-width: 600px; display: flex; flex-direction: column; gap: 24px">
      <p style="margin: 0; display: inline-flex; align-self: flex-start; gap: 8px; align-items: center; font-size: 14px; font-weight: 500; color: {INK2}; background: #FFFFFF; border: 1px solid {LINE}; border-radius: 999px; padding: 7px 14px"><span style="width: 7px; height: 7px; border-radius: 4px; background: {CORAL}"></span>Teste fechado · novembro de 2026</p>
      <h1 style="margin: 0; font-size: 68px; font-weight: 700; letter-spacing: -0.045em; line-height: 1">15 fundadores vão testar a Dalva primeiro.</h1>
      <p style="margin: 0; font-size: 19px; line-height: 1.5; color: {MUTE}">Prospecção que acontece enquanto você dorme. Se você vende, entrega e administra ao mesmo tempo, guarda uma vaga.</p>
      <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 12px">{field("E-mail", "voce@empresa.com.br", "email")}{field("WhatsApp", "(48) 99999-0000", "tel")}</div>
      <div style="display: flex; align-items: center; gap: 16px">{btn("Quero uma vaga", "coral", 17).replace("padding: 12px 22px", "padding: 16px 28px")}<span style="font-size: 14px; color: {MUTE}">Depois do teste: R$ 19,90 por mês.</span></div>
    </div>
    <div style="padding-right: 40px">{phone(300)}</div>
  </div>
</div>'''
files['Waitlist.dc.html'] = shell('Lista de espera', 1440, 900, wl)

for n, h in files.items():
    open(os.path.join(OUT, n), 'w').write(h)
print('ok', list(files))
