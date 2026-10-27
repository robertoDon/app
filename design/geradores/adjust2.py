# v33: decisões de 27/10. MVP = Caçada, Pipeline e Hoje. Projetos e Grana saem. Piloto pago. Busca sob demanda.
import os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'project')
def rd(f): return open(os.path.join(P, f + '.dc.html')).read()
def wr(f, s): open(os.path.join(P, f + '.dc.html'), 'w').write(s)
def sub(s, a, b, n=1):
    assert s.count(a) == n, (a[:80], s.count(a))
    return s.replace(a, b)

FRASE = 'Encontre empresas para vender. Não perca o próximo passo.'
AMB = 'background: #F5E6D0; color: #8F550E'
AZ = 'background: #E8ECF3; color: #4E628F'

# 1 · Navegação: sai Projetos e Grana de todas as telas do MVP.
NAV = re.compile(r'\n\s*<a href="[^"]*"[^>]*>(?:<svg(?:(?!</a>).)*?</svg>)?(?:Projetos|Grana)</a>', re.S)
for f in ['HojeWeb', 'Hoje', 'Pipeline', 'PipelineMobile', 'PipelineNegocio', 'PipelineNegocioMobile', 'PipelineAbordagemMobile',
          'Cacada', 'CacadaMobile', 'CacadaEntrada', 'CacadaEntradaMobile']:
    s = rd(f); s, k = NAV.subn('', s); assert k == 2, (f, k); wr(f, s)

# 2 · Hoje web: só ação comercial. Regra: próximo passo de hoje, proposta parada, conversa parada.
s = rd('HojeWeb')
s = sub(s, 'A entrega da Kora está atrasada há 3 dias. Começa por ela.', 'A proposta da Orbita é para hoje. Começa por ela.')
s = sub(s, '>Ver projeto</button>', '>Escrever</button>')
s = sub(s, 'Primeiro o que você prometeu, depois a etapa, o tempo parado e o valor.', 'Primeiro o próximo passo de hoje, depois a proposta e a conversa paradas.')
i = s.find('<div style="display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-top')
j = s.find('</section>', i)
handle = re.search(r'<svg.*?</svg>', s[i:j], re.S).group(0)
def row_w(n, name, meta, tag, kind, act):
    return f'''<div style="display: flex; align-items: center; gap: 14px; padding: 16px 20px; border-top: 1px solid rgba(0,0,0,0.06)">
          {handle}
          <span style="width: 28px; font-size: 22px; font-weight: 700; letter-spacing: -0.03em; color: {'#11131F' if n == 1 else '#A1A1A6'}">{n}</span>
          <div style="flex-grow: 1; min-width: 0"><p style="margin: 0; font-size: 16px; font-weight: 600">{name}</p><p style="margin: 3px 0 0; font-size: 13px; color: #5E6272">{meta}</p></div>
          <span style="font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 999px; {kind}; white-space: nowrap">{tag}</span>
          <button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: #11131F; background: #EFECE6; border: 0; border-radius: 999px; padding: 8px 14px; min-height: 36px; cursor: pointer; white-space: nowrap">{act}</button>
          <button type="button" style="font: inherit; font-size: 13px; font-weight: 600; color: #5E6272; background: transparent; border: 0; border-radius: 999px; padding: 8px 14px; min-height: 36px; cursor: pointer; white-space: nowrap">Adiar</button>
        </div>
        '''
ROWS = [(1, 'Enviar proposta para a Orbita', 'Próximo passo combinado · hoje, 17h', 'hoje', AZ, 'Escrever'),
        (2, 'Ligar para a Acme', 'Proposta parada há 6 dias · R$ 4.800', '6 dias', AMB, 'Ligar'),
        (3, 'Follow-up na Nuvem Labs', 'Conversa sem resposta desde quarta', '2 dias', AMB, 'Escrever')]
s = s[:i] + ''.join(row_w(*r) for r in ROWS) + s[j:]
s = sub(s, 'Na fila: follow-up Nuvem Labs, aprovar layout Grão e mais 2.', 'Na fila: abordar a Ilha Digital, nova da Caçada, e mais 2.')
# Meta (digitada à mão) vira a semana, que sai dos registros em um toque.
i = s.find('<section', s.find('<div style="display: flex; flex-direction: column; gap: 16px">', s.find('Ver tudo')))
j = s.find('</section>', i) + len('</section>')
def stat(v, l):
    return f'<div style="display: flex; flex-direction: column; gap: 2px"><p style="margin: 0; font-size: 28px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums">{v}</p><p style="margin: 0; font-size: 13px; color: #5E6272">{l}</p></div>'
semana = f'''<section style="background: #FFFFFF; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05); padding: 20px; display: flex; flex-direction: column; gap: 14px">
          <p style="margin: 0; font-size: 15px; font-weight: 600">Esta semana</p>
          <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px">{stat(6, 'contatos')}{stat(3, 'responderam')}{stat(1, 'reunião')}</div>
          <p style="margin: 0; font-size: 13px; color: #5E6272">Sai dos toques depois de cada contato. Nada para digitar.</p>
        </section>'''
assert 'Meta de outubro' in s[i:j]
s = s[:i] + semana + s[j:]
s = sub(s, '<div style="display: flex; gap: 14px; padding: 12px 0; border-top: 1px solid rgba(0,0,0,0.06)"><span style="width: 44px; font-size: 13px; font-weight: 600; color: #5E6272">14:30</span><div><p style="margin: 0; font-size: 14px; font-weight: 500">Aprovar layout Grão</p><p style="margin: 2px 0 0; font-size: 12px; color: #5E6272">Projeto · Bia</p></div></div>', '')
s = sub(s, '>Prazo prometido</p>', '>Próximo passo combinado</p>')
wr('HojeWeb', s)

# 3 · Hoje celular.
s = rd('Hoje')
s = sub(s, 'A entrega da Kora está atrasada há 3 dias. Começa por ela.', 'A proposta da Orbita é para hoje. Começa por ela.')
i = s.find('<div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; ">')
j = s.find('<p style="margin: 8px 20px 0; font-size: 12px; color: #8A8D99', i)
j = s.rfind('</div>', i, j)  # fecha o card branco
def row_m(n, name, meta, tag, kind, act=None):
    bt = '' if n == 1 else 'border-top: 1px solid rgba(0,0,0,0.06)'
    return f'''<div style="display: flex; align-items: center; gap: 12px; padding: 14px 16px; {bt}">
      <span style="width: 20px; font-size: 20px; font-weight: 700; color: {'#11131F' if n == 1 else '#A1A1A6'}">{n}</span>
      <div style="flex-grow: 1; min-width: 0"><p style="margin: 0; font-size: 15px; font-weight: 600">{name}</p><p style="margin: 2px 0 0; font-size: 12px; line-height: 1.35; color: #5E6272">{meta}</p></div>
      <span style="font-size: 12px; font-weight: 600; padding: 4px 9px; border-radius: 999px; {kind}; white-space: nowrap">{tag}</span>
    </div>
  '''
s = s[:i] + ''.join(row_m(*r) for r in ROWS) + s[j:]
i = s.find('<div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 8px">')
j = s.find('<nav', i)
j = s.rfind('</div>', i, j) + len('</div>')
assert 'Meta de outubro' in s[i:j]
def stat_m(v, l):
    return f'<div><p style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em; font-variant-numeric: tabular-nums">{v}</p><p style="margin: 0; font-size: 12px; color: #5E6272">{l}</p></div>'
s = s[:i] + f'''<div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px">
    <p style="margin: 0; font-size: 13px; font-weight: 500; color: #5E6272">Esta semana</p>
    <div style="display: grid; grid-template-columns: repeat(3, 1fr); gap: 8px">{stat_m(6, 'contatos')}{stat_m(3, 'responderam')}{stat_m(1, 'reunião')}</div>
  </div>
  ''' + s[j:]
wr('Hoje', s)

# 4 · Caçada sob demanda.
s = rd('Cacada')
s = re.sub(r'<span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #33364A; margin-right: 10px"><span style="width: 30px;.*?Repetir toda noite</span>', '', s, count=1, flags=re.S)
assert 'toda noite' not in s
wr('Cacada', s)
s = rd('CacadaEntrada')
s = sub(s, '>E toda noite, de novo</p>', '>Quer mais? Caça de novo</p>')
s = sub(s, 'A Dalva repete esta caçada de madrugada e te mostra só as empresas novas. Se não aparecer nenhuma, ela diz isso e não insiste.',
        'Mude a frase e caça quantas vezes quiser, sem gastar nada. A Dalva esconde o que você já viu e mostra só o que é novo.')
wr('CacadaEntrada', s)
s = rd('CacadaEntradaMobile')
s = sub(s, 'Buscar é grátis. E ela repete toda noite.', 'Buscar é grátis, quantas vezes quiser.')
wr('CacadaEntradaMobile', s)
s = rd('Pipeline')
s = sub(s, 'Para abordar: ninguém demonstrou interesse ainda, então não entra no Grana. Perdidos', 'Para abordar: ninguém demonstrou interesse ainda. Perdidos')
wr('Pipeline', s)

# 5 · Vitrine: sai “enquanto você dorme” e “toda noite”.
for f in ['Landing', 'LandingMobile', 'Waitlist']:
    s = rd(f)
    s = sub(s, '>Esta noite</p>', '>Sua caçada</p>')
    s = sub(s, 'Achada esta noite · sócia: Carla', 'Achada na caçada · sócia: Carla')
    s = sub(s, 'Você prometeu para hoje</p>', 'Próximo passo: hoje</p>')
    if f != 'Waitlist':
        s = sub(s, 'Prospecção que acontece enquanto você dorme.</h1>', FRASE + '</h1>')
    wr(f, s)
s = rd('Landing')
s = sub(s, 'Achadas durante a noite, com mensagem sugerida.', 'Achadas na sua caçada, com mensagem sugerida.')
s = sub(s, 'Busca de empresas sem limite, toda noite', 'Busca de empresas sem limite')
wr('Landing', s)
s = rd('LandingMobile')
s = sub(s, 'Você acorda com as empresas achadas e as três ações do dia em ordem.', 'Você descreve o cliente numa frase. A Dalva acha as empresas e põe as três ações do dia em ordem.')
s = sub(s, 'Busca sem limite, toda noite', 'Busca sem limite')
wr('LandingMobile', s)

# 6 · Lista de espera vira o piloto pago.
s = rd('Waitlist')
s = sub(s, 'Teste fechado · novembro de 2026', 'Piloto pago · novembro de 2026')
s = sub(s, 'Prospecção que acontece enquanto você dorme. Se você vende, entrega e administra ao mesmo tempo, guarda uma vaga.',
        FRASE + ' Se você vende, entrega e administra ao mesmo tempo, entra no piloto.')
s = sub(s, '>Quero uma vaga</button>', '>Entrar por R$ 19,90</button>')
s = sub(s, 'Depois do teste: R$ 19,90 por mês.', 'Não serviu? Devolvemos em 30 dias.')
wr('Waitlist', s)

# 7 · Quadros de estratégia e produto.
s = rd('Estrategia')
s = sub(s, 'Prospecção que acontece enquanto você dorme.</h2>', FRASE + '</h2>')
s = sub(s, 'Você acorda com as empresas achadas e as três ações do dia em ordem.', 'Você descreve o cliente, recebe as empresas e as três ações do dia em ordem.')
s = sub(s, '>Teste fechado</span><span style="font-size: 13px; color: #5E6272; line-height: 1.4">15 fundadores usando todo dia</span>',
        '>Piloto pago</span><span style="font-size: 13px; color: #5E6272; line-height: 1.4">15 fundadores a R$ 19,90</span>')
s = sub(s, 'Quatro pontos em aberto.</h2>', 'Dois decididos, dois em aberto.</h2>')
s = sub(s, '<span style="font-weight: 600">Teste fechado ou oferta paga.</span> <span style="color: #5E6272">Novembro com 15 fundadores, ou já cobrando 19,90 no anúncio?</span>',
        '<span style="font-weight: 600">Piloto: decidido.</span> <span style="color: #5E6272">Pago, R$ 19,90 desde o primeiro dia, devolução em 30 dias.</span>')
s = sub(s, '<span style="font-weight: 600">Projetos.</span> <span style="color: #5E6272">Fica no produto, mas sai da vitrine: a venda é prospecção.</span>',
        '<span style="font-weight: 600">Escopo: decidido.</span> <span style="color: #5E6272">Projetos e Grana saem do MVP. O Hoje fica só comercial.</span>')
wr('Estrategia', s)

s = rd('Modulos')
s = sub(s, 'Cinco módulos. Nada além.', 'Três módulos. Nada além.')
s = sub(s, 'Cada módulo responde uma pergunta que o fundador faz todo dia.', 'Cada módulo responde uma pergunta que o fundador faz todo dia. Projetos e Grana ficam para a v2.')
s = sub(s, 'grid-template-columns: repeat(5, minmax(0, 1fr)); gap: 14px">\n    <sc-for list="{{mvp}}" as="m" hint-placeholder-count="5">',
        'grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 14px">\n    <sc-for list="{{mvp}}" as="m" hint-placeholder-count="3">')
s = sub(s, "what: 'Três prioridades com o porquê de cada uma, a meta do mês e uma frase da Dalva. Dá para reordenar ou adiar.', note: 'Primeiro o que você prometeu, depois a etapa, o tempo parado e o valor.'",
        "what: 'Três prioridades comerciais com o porquê de cada uma, a semana em números e uma frase da Dalva. Dá para reordenar ou adiar.', note: 'Primeiro o próximo passo de hoje, depois a proposta e a conversa paradas.'")
s = sub(s, 'Buscar é grátis e repete toda noite.', 'Buscar é grátis, quantas vezes quiser.')
s = re.sub(r",\n\s*\{ n: '4', name: 'Projetos'.*?\}\n", '\n', s, count=1, flags=re.S)
s = re.sub(r",?\n\s*\{ n: '5', name: 'Grana'.*?\}\n", '\n', s, count=1, flags=re.S)
assert "'Projetos'" not in s and "'Grana'" not in s
wr('Modulos', s)

s = rd('Motor')
s = sub(s, '>Toda noite</p><h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em; color: #FFFFFF">É isso que sustenta o “enquanto você dorme”.</h3>',
        '>Sob demanda</p><h3 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em; color: #FFFFFF">Só roda quando você pede.</h3>')
s = sub(s, '<strong style="color: #FFFFFF">Roda de novo o passo 3</strong> com os filtros salvos, às 3h. Só na base: não gasta busca na web nem crédito.',
        '<strong style="color: #FFFFFF">Sem busca automática no MVP.</strong> Quem não usa não gera custo. A base da Receita só muda uma vez por mês.')
s = sub(s, '<strong>Busca toda noite</strong>, só com empresas novas.', '<strong>Caçar de novo</strong> quando quiser, só com empresas novas.')
wr('Motor', s)

s = rd('Perguntas')
s = sub(s, 'Automático: busca toda noite, tirar repetidas,', 'Automático: tirar repetidas,')
s = sub(s, '1) compromisso prometido vencido ou de hoje;', '1) próximo passo vencido ou de hoje;')
s = sub(s, 'Você prometeu para hoje.</p>', 'Próximo passo combinado para hoje.</p>')
s = sub(s, 'Se Projetos sair do MVP, o Hoje fica só com o que é comercial.', 'Só entra o que é comercial. Projetos e Grana ficaram para a v2.')
wr('Perguntas', s)
s = rd('Landing'); s = sub(s, 'font-size: 84px; font-weight: 700; letter-spacing: -0.05em; line-height: 0.98">Encontre', 'font-size: 68px; font-weight: 700; letter-spacing: -0.05em; line-height: 0.98">Encontre'); wr('Landing', s)
print('ok')
