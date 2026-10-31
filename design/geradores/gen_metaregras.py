"""Ficha de regras da pergunta da meta (canvas/MetaRegras.dc.html). Rodar de dentro de design/geradores."""
import os, sys
sys.path.insert(0, os.path.dirname(__file__))
from follou import *
OUT = os.path.join(os.path.dirname(__file__), '..', 'canvas', 'MetaRegras.dc.html')
W, H = 1440, 1900
BOX = f'background: {PAPEL}; border: 1px solid {LINHA_CLARA}; border-radius: 24px'
def kick(t): return f'<p style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {TINTA_MEDIA}">{t}</p>'
def card(titulo, inner, extra=''):
    return f'<section style="{BOX}; padding: 28px; display: flex; flex-direction: column; gap: 16px; {extra}">{kick(titulo)}{inner}</section>'
def p(t, c=TINTA, s=16, lh=22): return f'<p style="margin: 0; font-size: {s}px; line-height: {lh}px; color: {c}">{t}</p>'
def ul(items):
    return '<ul style="list-style: none; margin: 0; padding: 0; display: flex; flex-direction: column">' + ''.join(
        f'<li style="padding: 10px 0; border-top: {"0" if i == 0 else "1px solid " + LINHA_CLARA}; font-size: 16px; line-height: 22px">{t}</li>' for i, t in enumerate(items)) + '</ul>'
estados = [('Chega', 'previsão ≥ meta, com 10 ou mais negócios fechados ou perdidos', 'Chega, por R$ X.', 'As conversas que sustentam a meta: as que, se saírem, derrubam a previsão abaixo dela. No máximo 3.', 'Abrir a primeira'),
           ('Não chega', 'previsão < meta', 'Não chega: faltam R$ X.', 'Até 3 movimentos por ganho esperado. Diz o que a rota não cobre; o que sobra não é escondido.', 'Abrir a primeira'),
           ('Sem dados suficientes', 'menos de 10 negócios fechados ou perdidos', 'Ainda não dá para dizer.', 'Nenhuma estimativa, nenhuma barra. Diz quantos faltam e dá 2 caminhos para destravar.', 'Marcar os que faltam')]
tab = ''.join(f'<div style="display: grid; grid-template-columns: 170px minmax(0, 1fr) 220px minmax(0, 1.2fr) 170px; gap: 16px; padding: 14px 0; border-top: 1px solid {LINHA_CLARA}; font-size: 15px; line-height: 21px">'
              f'<span style="font-weight: 600">{a}</span><span>{b}</span><span style="font-family: {DISPLAY}; font-weight: 600">{c}</span><span>{d}</span><span>{e}</span></div>' for a, b, c, d, e in estados)
tab = (f'<div style="display: grid; grid-template-columns: 170px minmax(0, 1fr) 220px minmax(0, 1.2fr) 170px; gap: 16px; padding-bottom: 8px; font-size: 13px; font-weight: 600; color: {TINTA_MEDIA}">'
       '<span>Estado</span><span>Quando</span><span>Título</span><span>Rota</span><span>Botão principal</span></div>') + tab
contrato = '''POST /api/meta/pergunta   { "mes": "2026-11" }

{ "estado": "chega" | "nao_chega" | "sem_dados",
  "meta": 15000,
  "previsao": 12125,
  "diferenca": -2875,
  "base": { "fechados_ou_perdidos": 12, "taxa_media": 0.38,
            "lido_em": "2026-10-29T08:12:00-03:00" },
  "passos": [ { "conversa_id": "…", "titulo": "Ligar para a Acme",
                "efeito_brl": 960, "efeito": "ganho" | "protege" | "nenhum",
                "prazo": "2026-10-29T10:00:00-03:00", "hipotese": true } ],
  "faltam_para_estimar": 7 }'''
html = f'''<!doctype html>
<html lang="pt-BR">
<head>
<meta charset="utf-8">
<title>Follou — Pergunta da meta: regras</title>
<script src="./support.js"></script>
</head>
<body>
<x-dc>
<helmet>
{FONTS}
<style>
body{{margin:0}}
</style>
</helmet>
<div style="width: {W}px; min-height: {H}px; box-sizing: border-box; padding: 64px 80px; background: {NEVE}; color: {TINTA}; font-family: {SANS}; display: flex; flex-direction: column; gap: 24px">
  <header style="display: flex; flex-direction: column; gap: 12px; max-width: 880px">
    {kick('A pergunta da meta · regras de resposta')}
    <h1 style="margin: 0; font-family: {DISPLAY}; font-size: 56px; line-height: 60px; font-weight: 600; letter-spacing: -0.04em">Ela responde com uma rota, não com um painel.</h1>
    {p('Entra pelo ⌘K na web e pelo botão Perguntar no topo do Hoje, no celular. Uma pergunta, uma resposta, no máximo três passos. Se virar relatório, virou CRM.', TINTA_MEDIA, 18, 27)}
  </header>
  {card('Os três estados', tab)}
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">
    {card('A conta', ul(['<strong>Previsão</strong> = soma de valor × chance de fechar, conversa por conversa.',
        'A <strong>chance</strong> vem do histórico do próprio usuário (negócios fechados e perdidos), ajustada pelos dias sem resposta e pela abertura da proposta.',
        'O <strong>efeito</strong> de um passo = valor × (chance depois − chance antes). Sempre marcado “hipótese”.',
        'Mínimo de 10 negócios fechados ou perdidos. Abaixo disso, o estado é “sem dados”.',
        'Toda resposta mostra a fonte e a data da leitura: “38% em média, 12 negócios, lidas hoje 08:12”.']))}
    {card('Regras de resposta', ul(['Termina em ação: o botão principal abre o primeiro passo. É o único verde da tela.',
        'No máximo 3 passos, cada um com efeito em reais e prazo escrito.',
        'Diz o que a rota não cobre. “Não conta para novembro” é resposta, não falha.',
        'Sem placar: só a barra de referência (previsão e meta). Nenhum gráfico de histórico.',
        'Sem dados, sem estimativa: o estado desenhado diz quantos faltam e como destravar.']))}
  </div>
  <div style="display: grid; grid-template-columns: repeat(2, minmax(0, 1fr)); gap: 24px">
    {card('O que ela não é', ul(['Previsão por mês, trimestre ou etapa.', 'Histórico de metas, ranking ou meta por pessoa.', 'Exportação, filtros e relatório. Quem precisa disso já tem CRM.', 'Aviso de “você está abaixo da meta”. O Follou só responde quando perguntam.']))}
    {card('Entrada e estados vazios', ul(['<strong>Web:</strong> ⌘K reconhece a pergunta (“bato a meta”). Enter abre o primeiro passo, Esc fecha.', '<strong>Celular:</strong> botão Perguntar no topo do Hoje abre a folha, raio 24.', '<strong>Sem meta definida:</strong> a primeira pergunta é “Qual a meta de novembro?”, um campo numérico só.', '<strong>Eventos:</strong> meta_perguntada, meta_passo_aberto, meta_destravada.']))}
  </div>
  <section style="background: {CARVAO}; color: {NEVE}; border-radius: 24px; padding: 28px; display: flex; flex-direction: column; gap: 12px">
    <p style="margin: 0; font-size: 13px; line-height: 18px; font-weight: 600; letter-spacing: 0.08em; text-transform: uppercase; color: {NEVE_FRACA}">Contrato da resposta · proposta para o código</p>
    <pre style="margin: 0; font-family: {MONO}; font-size: 14px; line-height: 21px; color: {NEVE_MEDIA}; white-space: pre-wrap">{contrato}</pre>
  </section>
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
open(OUT, 'w').write(html.replace('"', '"'))
print('ok')
