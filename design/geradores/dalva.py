# Marca Dalva: tokens, fontes e as 5 opções de logo (estilo Mr. Wolf: símbolo geométrico + um único detalhe coral).
CORAL, NOITE, BRUMA, AMBAR, AZUL = '#FF7A45', '#11131F', '#F7F5F2', '#C77713', '#4E628F'
MUTE, INK2, LINE = '#5E6272', '#33364A', '#E6E2DB'
FONTS = ('<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Sora:wght@500;600;700&amp;'
         'family=IBM+Plex+Sans:wght@400;500;600;700&amp;display=swap">')
SANS = "'IBM Plex Sans', -apple-system, system-ui, sans-serif"
DISPLAY = "'Sora', 'IBM Plex Sans', system-ui, sans-serif"
CSS = (f"body{{margin:0}}\nh1,h2,h3,.ds{{font-family:{DISPLAY}}}\n"
       f"a{{color:{NOITE}}}a:hover{{color:{CORAL}}}\n")

STAR = 'M50 18 C53 41 59 47 82 50 C59 53 53 59 50 82 C47 59 41 53 18 50 C41 47 47 41 50 18 Z'

def _sq(inner, s, bg=NOITE, r=0.24):
    return (f'<svg viewBox="0 0 100 100" width="{s}" height="{s}" aria-hidden="true" style="display: block; flex-shrink: 0">'
            f'<rect width="100" height="100" rx="{int(100 * r)}" fill="{bg}"></rect>{inner}</svg>')

# Cada símbolo recebe (fg, detalhe) para virar positivo/negativo.
def sym_estrela(fg='#FFFFFF', acc=CORAL):
    return f'<path d="{STAR}" fill="{acc}"></path><circle cx="50" cy="50" r="5" fill="{fg}" opacity="0"></circle>'

def sym_coruja(fg='#FFFFFF', acc=CORAL, eye=NOITE):
    return (f'<path d="M24 30 L35 17 L44 27 Q50 25 56 27 L65 17 L76 30 L76 60 Q76 84 50 86 Q24 84 24 60 Z" fill="{fg}" stroke="{fg}" stroke-width="4" stroke-linejoin="round"></path>'
            f'<circle cx="39" cy="50" r="9" fill="{eye}"></circle><circle cx="61" cy="50" r="9" fill="{eye}"></circle>'
            f'<path d="M50 58 L56 64 L50 72 L44 64 Z" fill="{acc}" stroke="{acc}" stroke-width="2" stroke-linejoin="round"></path>')

def sym_ponto(fg='#FFFFFF', acc=CORAL):
    return (f'<text x="22" y="74" font-family="Sora, sans-serif" font-size="66" font-weight="700" fill="{fg}" letter-spacing="-3">d</text>'
            f'<circle cx="74" cy="68" r="7.5" fill="{acc}"></circle>')

def sym_tres(fg='#FFFFFF', acc=CORAL):
    return (f'<rect x="22" y="27" width="56" height="12" rx="6" fill="{acc}"></rect>'
            f'<rect x="22" y="45" width="42" height="12" rx="6" fill="{fg}"></rect>'
            f'<rect x="22" y="63" width="28" height="12" rx="6" fill="{fg}"></rect>')

def sym_balao(fg='#FFFFFF', acc=CORAL, hole=NOITE):
    return (f'<path d="M27 20 H50 A29 29 0 0 1 50 78 H40 L27 88 Z" fill="{fg}" stroke="{fg}" stroke-width="3" stroke-linejoin="round"></path>'
            f'<path d="M41 34 H50 A15 15 0 0 1 50 64 H41 Z" fill="{hole}"></path>'
            f'<circle cx="50" cy="49" r="5" fill="{acc}"></circle>')

def icon(key, s, light=False):
    """Ícone de app. light=True: fundo branco, símbolo Noite."""
    fn = SYMS[key]['sym']
    if light:
        kw = {'fg': NOITE}
        if key == 'coruja': kw['eye'] = '#FFFFFF'
        if key == 'balao': kw['hole'] = '#FFFFFF'
        return _sq(fn(**kw), s, bg='#FFFFFF')
    return _sq(fn(), s)

def _inline_star(color=CORAL):
    return (f'<svg viewBox="18 18 64 64" style="display: inline-block; width: 0.46em; height: 0.46em; margin-left: 0.02em; vertical-align: 0.5em" aria-hidden="true">'
            f'<path d="{STAR}" fill="{color}"></path></svg>')

def wordmark(key, size=40, color=NOITE):
    st = f'margin: 0; font-family: {DISPLAY}; font-size: {size}px; font-weight: 700; letter-spacing: -0.035em; line-height: 1; color: {color}; white-space: nowrap'
    if key == 'estrela':
        return f'<p style="{st}">Dalva{_inline_star()}</p>'
    if key == 'ponto':
        return f'<p style="{st}">dalva<span style="color: {CORAL}">.</span></p>'
    # Demais: símbolo pequeno + nome, como era o mr wolf.
    s = int(size * 1.05)
    return (f'<div style="display: flex; align-items: center; gap: {int(size * 0.28)}px">{icon(key, s, light=(color != NOITE))}'
            f'<p style="{st}">{"dalva" if key == "tres" else "Dalva"}</p></div>')

SYMS = {
    'estrela': {'sym': sym_estrela, 'nome': 'Estrela-d’alva',
                'ideia': 'O nome vem da primeira luz do dia. Uma estrela de quatro pontas, sozinha, no lugar dos três riscos.',
                'pro': 'Conta a origem do nome sem explicar.', 'contra': 'Estrelas são comuns em IA. Precisa de desenho próprio.'},
    'coruja': {'sym': sym_coruja, 'nome': 'Coruja',
               'ideia': 'O primo do lobo. Trabalha de madrugada e você acorda com a lista pronta. O bico coral faz o papel da gravata.',
               'pro': 'Mascote com história: “enquanto você dorme”.', 'contra': 'Puxa para personagem. Pede tom de voz firme.'},
    'ponto': {'sym': sym_ponto, 'nome': 'Ponto final',
              'ideia': '“dalva.” em minúsculas, com ponto coral. Dia decidido, sem discussão. Na linha de Linear e Attio.',
              'pro': 'O mais limpo e o mais barato de aplicar.', 'contra': 'Pouco desenho próprio. Depende de tipografia boa.'},
    'tres': {'sym': sym_tres, 'nome': 'Três do dia',
             'ideia': 'Três barras em ordem, a primeira em coral. É a tela Hoje virada símbolo: três prioridades, na ordem.',
             'pro': 'Diz o que o produto faz. Funciona em 16 px.', 'contra': 'Parece ícone de lista. Pede nome forte ao lado.'},
    'balao': {'sym': sym_balao, 'nome': 'D de conversa',
              'ideia': 'Um D completo que também é balão de conversa. O ponto coral no meio é a próxima mensagem a mandar.',
              'pro': 'Segue o manual: D inteiro, haste íntegra.', 'contra': 'Balão lembra app de chat. Cuidado com o WhatsApp.'},
}
ORDER = ['estrela', 'coruja', 'ponto', 'tres', 'balao']
