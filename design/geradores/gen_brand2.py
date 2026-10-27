# Executado dentro de gen_brand.py (usa page, header, files).
CARD = f'background: #FFFFFF; border: 1px solid {LINE}; border-radius: 24px; padding: 28px'
def kick(t, c=MUTE):
    return f'<p style="margin: 0; font-size: 13px; font-weight: 600; letter-spacing: 0.06em; text-transform: uppercase; color: {c}">{t}</p>'
def st(t):
    return f'<h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em">{t}</h2>'
B = f'color: {NOITE}; font-weight: 600'

def pill(t, kind):
    # Estado = texto + forma + cor (regra do manual).
    if kind == 'late':
        return f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 5px 10px; border-radius: 999px; background: #F5E6D0; color: #8F550E"><span style="width: 8px; height: 8px; border-radius: 4px; background: {AMBAR}"></span>{t}</span>'
    if kind == 'today':
        return f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 5px 10px; border-radius: 999px; background: #E8ECF3; color: {AZUL}"><span style="width: 8px; height: 8px; border-radius: 4px; box-sizing: border-box; border: 2px solid {AZUL}"></span>{t}</span>'
    return f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 13px; font-weight: 600; padding: 5px 10px; border-radius: 999px; background: #EFECE6; color: {INK2}"><span style="width: 8px; height: 2px; border-radius: 1px; background: {INK2}"></span>{t}</span>'

def btn(t, kind='coral', size=15):
    bg, fg, bd = {'coral': (CORAL, NOITE, CORAL), 'noite': (NOITE, '#FFFFFF', NOITE), 'ghost': ('#FFFFFF', NOITE, LINE)}[kind]
    return f'<button type="button" style="font: inherit; font-size: {size}px; font-weight: 600; color: {fg}; background: {bg}; border: 1px solid {bd}; border-radius: 999px; padding: 12px 22px; min-height: 44px; cursor: pointer; white-space: nowrap">{t}</button>'

# ---------- Main: sistema de marca ----------
sw = ''.join(f'<div style="display: flex; flex-direction: column; gap: 8px"><div style="height: 76px; border-radius: 14px; background: {c}; {"box-shadow: inset 0 0 0 1px " + LINE if c == BRUMA else ""}"></div><p style="margin: 0; font-size: 14px; font-weight: 600">{n}</p><p style="margin: 0; font-size: 12px; color: {MUTE}">{c} · {u}</p></div>'
             for n, c, u in [('Coral', CORAL, 'ação'), ('Noite', NOITE, 'texto'), ('Bruma', BRUMA, 'fundo'), ('Âmbar', AMBAR, 'alerta'), ('Azul', AZUL, 'info')])
voz = ''.join(f'<div style="display: flex; gap: 14px; padding: 10px 0; border-top: 1px solid {LINE}"><span style="min-width: 52px; font-size: 13px; font-weight: 600; color: {NOITE if ok else MUTE}">{"Dizer" if ok else "Evitar"}</span><span style="font-size: 15px; line-height: 1.45; color: {NOITE if ok else MUTE}">{t}</span></div>'
              for ok, t in [(1, '“Achei 18 empresas que podem comprar de você.”'), (1, '“A proposta da Acme está parada há seis dias. Quer retomar hoje?”'),
                            (0, '“Seu pipeline apresenta inatividade e requer intervenção.”'), (0, '“Oi, chefinho! Bora bombar suas vendas?”')])
regras = ''.join(f'<p style="margin: 0; padding: 10px 0; border-top: 1px solid {LINE}; font-size: 15px; line-height: 1.45"><span style="{B}">{a}</span> <span style="color: {MUTE}">{b}</span></p>'
                 for a, b in [('Um coral só.', 'Em botão e em um detalhe por tela. Nunca para dizer “urgente”.'),
                              ('Texto escuro no coral.', 'Branco sobre coral some no sol do celular.'),
                              ('Estado com palavra.', 'Âmbar avisa, mas quem diz “atrasado” é o texto.'),
                              ('Don no rodapé.', '“Um produto Don” assina em baixo. Nunca junto do símbolo.'),
                              ('Prova real ou nada.', 'Sem depoimento, logo ou número inventado em material público.')])
main = (header('Marca', 'Dalva', 'Prospecção que acontece enquanto você dorme.',
               f'<p style="margin: 0"><strong style="{B}">O que é.</strong> O assistente comercial de quem vende, administra e entrega ao mesmo tempo. Empresas B2B de 1 a 10 pessoas.</p>'
               f'<p style="margin: 10px 0 0"><strong style="{B}">Nome.</strong> Vem da estrela-d’alva, a primeira luz do dia. Você acorda e o dia já está decidido.</p>'
               f'<p style="margin: 10px 0 0"><strong style="{B}">Visual.</strong> Apple, Linear e Attio: muito branco, um coral, sombra de 1 px, nada de gradiente. O cool está no acabamento.</p>').replace('font-size: 64px', 'font-size: 120px')
        + f'''
  <section style="display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 20px">
    <article style="{CARD}; display: flex; flex-direction: column; gap: 18px">{kick("Paleta")}<div style="display: grid; grid-template-columns: repeat(5, 1fr); gap: 12px">{sw}</div>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: {MUTE}">Cor da marca não é prioridade comercial. Coral chama para agir; âmbar avisa; azul informa.</p></article>
    <article style="{CARD}; display: flex; flex-direction: column; gap: 16px">{kick("Tipografia")}
      <div><p class="ds" style="margin: 0; font-size: 44px; font-weight: 700; letter-spacing: -0.04em; line-height: 1">Sora</p><p style="margin: 6px 0 0; font-size: 14px; color: {MUTE}">Nome, títulos e números grandes. 600 a 700.</p></div>
      <div style="padding-top: 14px; border-top: 1px solid {LINE}"><p style="margin: 0; font-size: 36px; font-weight: 500; letter-spacing: -0.02em; line-height: 1">IBM Plex Sans</p><p style="margin: 6px 0 0; font-size: 14px; color: {MUTE}">Interface: texto, botões, listas, datas.</p></div></article>
    <article style="{CARD}; display: flex; flex-direction: column; gap: 14px">{kick("Na interface")}
      <div style="display: flex; flex-wrap: wrap; gap: 10px">{btn("Começar agora")}{btn("Ver projeto", "noite")}{btn("Adiar", "ghost")}</div>
      <div style="display: flex; flex-wrap: wrap; gap: 8px; padding-top: 14px; border-top: 1px solid {LINE}">{pill("Atrasado 3 dias", "late")}{pill("Hoje, 17h", "today")}{pill("Em dia", "calm")}</div>
      <p style="margin: 0; font-size: 14px; line-height: 1.5; color: {MUTE}">Estado = palavra + forma + cor. Ponto cheio, anel e traço: dá para ler até sem cor.</p></article>
  </section>
  <section style="display: grid; grid-template-columns: 1.25fr 1fr 1fr; gap: 20px; flex-grow: 1">
    <article style="{CARD}; display: flex; flex-direction: column; gap: 8px">{kick("Voz")}<p style="margin: 0 0 6px; font-size: 15px; color: {MUTE}">Próxima, direta e competente. Nem CRM corporativo, nem personagem.</p>{voz}</article>
    <article style="{CARD}; display: flex; flex-direction: column; gap: 4px">{kick("Regras")}{regras}</article>
    <article style="background: {NOITE}; color: #FFFFFF; border-radius: 24px; padding: 28px; display: flex; flex-direction: column; justify-content: space-between; gap: 18px">{kick("Promessa", CORAL)}
      <p class="ds" style="margin: 0; font-size: 30px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.15">Mais conversas. Mais negócios. Menos tempo perdido decidindo por onde começar.</p>
      <div style="display: flex; justify-content: space-between; align-items: flex-end"><p class="ds" style="margin: 0; font-size: 26px; font-weight: 700; letter-spacing: -0.035em">Dalva</p><p style="margin: 0; font-size: 13px; color: #A6A9B6">um produto Don</p></div></article>
  </section>''')
files['Main.dc.html'] = page('Marca', 1440, 1180, main)

# ---------- Estratégia: o caldeirão ----------
def col(k, t, body, dark=False):
    s = f'background: {NOITE}; color: #FFFFFF; border-radius: 24px; padding: 28px' if dark else CARD
    return f'<article style="{s}; display: flex; flex-direction: column; gap: 12px">{kick(k, CORAL if dark else MUTE)}<h2 style="margin: 0; font-size: 24px; font-weight: 700; letter-spacing: -0.03em; line-height: 1.2">{t}</h2>{body}</article>'
def para(t, c=MUTE):
    return f'<p style="margin: 0; font-size: 15px; line-height: 1.55; color: {c}">{t}</p>'
pil = ''.join(f'<div style="display: grid; grid-template-columns: 92px 1fr auto; gap: 12px; align-items: baseline; padding: 10px 0; border-top: 1px solid {LINE}"><span style="font-size: 15px; font-weight: 600">{a}</span><span style="font-size: 14px; color: {MUTE}">{b}</span><span style="font-size: 13px; font-weight: 600; color: {INK2}">{c}</span></div>'
              for a, b, c in [('Encontra', 'Empresas com o sócio responsável e o motivo para a conversa.', 'Caçada'), ('Aproxima', 'Mensagem no seu tom, pronta para mandar.', 'Pipeline'),
                              ('Executa', 'Próximo passo com data. Avisa antes de esfriar.', 'Hoje')])
planos = ''.join(f'<div style="flex: 1; border-radius: 16px; padding: 16px; {"background: " + NOITE + "; color: #FFFFFF" if hl else "background: " + BRUMA}"><p style="margin: 0; font-size: 13px; font-weight: 600; {"color: " + CORAL if hl else "color: " + MUTE}">{n}</p><p class="ds" style="margin: 6px 0 0; font-size: 21px; font-weight: 700; letter-spacing: -0.03em; white-space: nowrap">{p}</p><p style="margin: 2px 0 0; font-size: 13px; opacity: 0.7">{d}</p></div>'
                 for n, p, d, hl in [('Teste', 'R$ 0', '7 dias, sem cartão', 0), ('Dalva', 'R$ 19,90', 'por mês', 1), ('Dalva Time', 'R$ 59,90', 'até 5 pessoas', 0)])
tl = ''.join(f'<div style="flex: 1; display: flex; flex-direction: column; gap: 6px; padding-top: 14px; border-top: 2px solid {CORAL if i == 0 else LINE}"><span style="font-size: 12px; font-weight: 600; color: {MUTE}">{a}</span><span style="font-size: 15px; font-weight: 600">{b}</span><span style="font-size: 13px; color: {MUTE}; line-height: 1.4">{c}</span></div>'
             for i, (a, b, c) in enumerate([('NOV 2026', 'Teste fechado', '15 fundadores usando todo dia'), ('JAN 2027', 'Beta pago', 'Primeiras assinaturas'),
                                           ('MAR 2027', 'Abertura', 'Anúncio no celular, sem vendedor'), ('JUN 2027', 'Integrações', 'Agenda, e-mail, WhatsApp')]))
tempero = ''.join(f'<p style="margin: 0; padding: 9px 0; border-top: 1px solid rgba(255,255,255,0.12); font-size: 14px; line-height: 1.45"><span style="font-weight: 600">{a}</span> <span style="color: #A6A9B6">{b}</span></p>'
                  for a, b in [('Apple.', 'Muito respiro e um assunto por tela.'), ('Linear.', 'Atalho para tudo, transição de 150 ms, nada pisca.'),
                               ('Attio.', 'Tabela que parece documento. Dado com fonte.'), ('Netflix.', 'O próximo passo já aberto, como o “continuar assistindo”.'),
                               ('Micropolish.', 'Sombra de 1 px, número tabular, estado vazio com voz.'), ('Grok.', 'Fundo escuro, cards do produto flutuando em camadas.')])
decidir = ''.join(f'<p style="margin: 0; padding: 9px 0; border-top: 1px solid {LINE}; font-size: 14px; line-height: 1.45"><span style="font-weight: 600">{a}</span> <span style="color: {MUTE}">{b}</span></p>'
                  for a, b in [('Público.', 'A gente tinha “startups tech de 1 a 5”. O David abriu para “B2B de 1 a 10”.'),
                               ('Time por R$ 59,90.', 'A conta fecha (65–85%), mas só compensa a partir de 4 pessoas. Com 3, as avulsas saem R$ 0,20 mais barato.'),
                               ('Teste fechado ou oferta paga.', 'Novembro com 15 fundadores, ou já cobrando 19,90 no anúncio?'),
                               ('Projetos.', 'Fica no produto, mas sai da vitrine: a venda é prospecção.')])
estr = (header('Estratégia', 'O caldeirão.', 'O David traz a estratégia. A gente deixa cool.',
               f'<p style="margin: 0"><strong style="{B}">Fontes.</strong> Manual da Dalva, apresentação institucional do David, o conceito Mr. Wolf e as telas v2.</p>'
               f'<p style="margin: 10px 0 0"><strong style="{B}">Como vende.</strong> Barato, então vende quase como B2C: viu o anúncio, entendeu em 5 segundos, assinou no celular.</p>')
        + f'''
  <section style="display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 20px">
    {col("Posicionamento", "Prospecção que acontece enquanto você dorme.", para("O assistente comercial de quem vende, administra e entrega ao mesmo tempo. Você acorda com as empresas achadas e as três ações do dia em ordem.") + para("“Nenhum fundador perde venda por falta de esforço. Perde por não saber por onde começar o dia.”", NOITE))}
    {col("Três pilares", "Encontra, aproxima, executa.", pil)}
    {col("Preço", "Barato o bastante para não pensar.", f'<div style="display: flex; gap: 8px">{planos}</div>' + para("Sem cartão para testar. Cancela em um toque. Sem demo, sem vendedor."))}
  </section>
  <section style="display: grid; grid-template-columns: 1.3fr 1fr 1fr; gap: 20px; flex-grow: 1">
    {col("Linha do tempo · datas do David", "Do teste fechado à abertura.", f'<div style="display: flex; gap: 14px; margin-top: 6px">{tl}</div>' + para("A venda aberta é por anúncio. Por isso a landing de celular é a peça mais importante do lançamento."))}
    {col("Nossos temperos", "O cool está no acabamento.", tempero, dark=True)}
    {col("Pra decidir com o David", "Quatro pontos em aberto.", decidir)}
  </section>''')
files['Estrategia.dc.html'] = page('Estratégia', 1440, 1180, estr, bg=BRUMA)

# ---------- Aplicações ----------
K = 'coruja'
def tee(bg, fg, front=True):
    col_ = '#FFFFFF' if bg == NOITE else NOITE
    mark = (f'<g transform="translate(176 92)">{"" }</g>')
    return (f'<svg viewBox="0 0 300 300" width="100%" style="display: block" aria-hidden="true">'
            f'<path d="M98 22 L58 36 L12 80 L42 122 L72 104 L72 290 L228 290 L228 104 L258 122 L288 80 L242 36 L202 22 Q150 58 98 22 Z" fill="{bg}" stroke="{"#2A2D3B" if bg == NOITE else "#DDD8CF"}" stroke-width="2" stroke-linejoin="round"></path>'
            f'<path d="M98 22 Q150 58 202 22" fill="none" stroke="{"#2A2D3B" if bg == NOITE else "#DDD8CF"}" stroke-width="6"></path></svg>')
def place(svg, overlay):
    return f'<div style="position: relative">{svg}<div style="position: absolute; inset: 0">{overlay}</div></div>'
tee1 = place(tee('#F2EEE7', NOITE), f'<div style="position: absolute; left: 58%; top: 26%">{wordmark(K, 15)}</div>')
tee2 = place(tee(NOITE, '#FFFFFF'), f'<div style="position: absolute; left: 50%; top: 30%; transform: translateX(-50%); display: flex; flex-direction: column; align-items: center; gap: 10px">{SYMS[K]["sym"] and icon(K, 46)}<p class="ds" style="margin: 0; font-size: 13px; font-weight: 700; color: #FFFFFF; text-align: center; line-height: 1.25; letter-spacing: -0.01em">Prospecção que<br>acontece enquanto<br>você dorme.</p></div>')
cap = (f'<div style="position: relative"><svg viewBox="0 0 300 210" width="100%" style="display: block" aria-hidden="true">'
       f'<path d="M52 150 Q50 40 150 38 Q250 40 248 150 Z" fill="{NOITE}"></path><path d="M150 38 L150 150" stroke="#2A2D3B" stroke-width="2"></path>'
       f'<path d="M40 150 Q150 128 288 162 Q262 192 150 182 Q62 176 40 150 Z" fill="#1C1F2D"></path><circle cx="150" cy="40" r="6" fill="#2A2D3B"></circle></svg>'
       f'<div style="position: absolute; left: 50%; top: 40%; transform: translate(-50%, -50%)">{icon(K, 52)}</div></div>')
nb = (f'<div style="display: flex; gap: 14px; justify-content: center"><div style="position: relative; width: 150px; height: 210px; border-radius: 10px 14px 14px 10px; background: {NOITE}; box-shadow: 0 10px 24px rgba(17,19,31,0.18)">'
      f'<div style="position: absolute; right: 22px; top: 0; bottom: 0; width: 10px; background: {CORAL}"></div><div style="position: absolute; left: 18px; top: 22px">{wordmark(K, 17, "#FFFFFF")}</div>'
      f'<p style="position: absolute; left: 18px; bottom: 18px; margin: 0; font-size: 9px; font-weight: 600; letter-spacing: 0.12em; color: #A6A9B6; line-height: 1.6">MAIS CONVERSAS.<br>MAIS NEGÓCIOS.</p></div>'
      f'<div style="width: 150px; height: 210px; border-radius: 14px 10px 10px 14px; background: #FBFAF8; box-shadow: 0 10px 24px rgba(17,19,31,0.10); padding: 20px 16px; box-sizing: border-box; display: flex; flex-direction: column; gap: 9px">'
      + ''.join(f'<div style="display: flex; gap: 8px; align-items: center"><span style="font-size: 10px; font-weight: 700; color: {MUTE}">{i}</span><span style="height: 6px; flex: 1; border-radius: 3px; background: {CORAL if i == 1 else LINE}"></span></div>' for i in (1, 2, 3))
      + f'<p style="margin: auto 0 0; font-size: 10px; color: {MUTE}; line-height: 1.4">Três coisas pra hoje.<br>O resto espera.</p></div></div>')
apps = ''.join(f'<div style="width: 46px; height: 46px; border-radius: 12px; background: {c}"></div>' for c in ['#D9D5CD', '#C9CED8', '#E3D6C6', '#CFD6CC', '#D6CFDA', '#DDD8CF', '#C9CED8'])
phone = (f'<div style="width: 262px; height: 264px; margin: 0 auto; border-radius: 34px; background: linear-gradient(160deg, #2A2D3B, {NOITE}); padding: 34px 22px 0; box-sizing: border-box; display: grid; grid-template-columns: repeat(4, 46px); gap: 14px 12px; align-content: start; justify-content: space-between">'
         f'{apps}<div style="display: flex; flex-direction: column; align-items: center; gap: 4px">{icon(K, 46)}<span style="font-size: 10px; color: #FFFFFF; white-space: nowrap">Dalva</span></div></div>')
tab = (f'<div style="border-radius: 12px; background: #E9E5DE; padding: 8px 8px 0"><div style="display: flex; align-items: center; gap: 8px; width: 210px; background: #FFFFFF; border-radius: 9px 9px 0 0; padding: 9px 12px">{icon(K, 16)}<span style="font-size: 13px; color: {NOITE}">Dalva · Hoje</span></div>'
       f'<div style="background: #FFFFFF; height: 46px"></div></div>')
def app(t, n, inner, h=330):
    return f'<article style="{CARD}; padding: 22px; display: flex; flex-direction: column; gap: 14px"><div style="height: {h}px; display: flex; flex-direction: column; justify-content: center; background: {BRUMA}; border-radius: 16px; padding: 18px; box-sizing: border-box">{inner}</div><div><p style="margin: 0; font-size: 16px; font-weight: 600">{t}</p><p style="margin: 4px 0 0; font-size: 14px; line-height: 1.45; color: {MUTE}">{n}</p></div></article>'
aplic = (header('Marca · aplicações', 'Onde a Dalva aparece.', 'Ideia, não arte final. Aplicado com a opção 02, Coruja, só para ver o jeito. Troca quando a gente escolher.')
         + f'''
  <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">
    {app("Camiseta clara", "Assinatura pequena no peito. Discreta como uma etiqueta boa.", f'<div style="width: 250px; margin: 0 auto">{tee1}</div>')}
    {app("Camiseta escura", "Na frente, o símbolo e a frase. É a camiseta que puxa conversa no evento.", f'<div style="width: 250px; margin: 0 auto">{tee2}</div>')}
    {app("Boné", "Só o símbolo, bordado. Sem nome: quem sabe, sabe.", f'<div style="width: 270px; margin: 0 auto">{cap}</div>')}
  </section>
  <section style="display: grid; grid-template-columns: repeat(3, minmax(0, 1fr)); gap: 20px">
    {app("Caderno", "Capa Noite com elástico coral. Dentro, três linhas por dia, e só.", nb, 300)}
    {app("Tela do celular", "O ícone precisa se achar entre trinta apps. Fundo Noite, um detalhe coral.", phone, 300)}
    {app("Aba do navegador", "Testar em 16 px antes de fechar a opção. É onde a maioria dos logos morre.", f'<div style="display: flex; flex-direction: column; align-items: center; gap: 18px">{tab}<div style="display: flex; gap: 16px; align-items: flex-end">{icon(K, 56)}{icon(K, 32)}{icon(K, 16)}</div></div>', 300)}
  </section>''')
files['Aplicacoes.dc.html'] = page('Aplicações', 1440, 1180, aplic, bg=BRUMA)
