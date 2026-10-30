"""Troca só a camada de marca (nome, cores, fonte de display, logotipo) dos quadros do canvas.

A estrutura, o UI e o UX não mudam: módulos, telas, sessão da manhã, Ritmo, metas, raios e
espaçamentos ficam como estão. Rodar de dentro de design/geradores:  python3 follou_rebrand.py
É idempotente: um quadro que já não tem as cores e o nome antigos sai igual.
"""
import json, os, re, sys
sys.path.insert(0, os.path.dirname(__file__))
import follou as F

CANVAS = os.path.join(os.path.dirname(__file__), '..', 'canvas')
SKIP = {'Main.dc.html'}  # o quadro de marca é escrito à mão (gen_marca.py)

def lum(h):
    h = h.lstrip('#'); c = [int(h[i:i + 2], 16) / 255 for i in (0, 2, 4)]
    c = [v / 12.92 if v <= 0.03928 else ((v + 0.055) / 1.055) ** 2.4 for v in c]
    return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
def dark(h): return lum(h) < 0.2

# ---------- nome ----------
ART = [(r'\bDa Dalva\b', 'Do Follou'), (r'\bda Dalva\b', 'do Follou'), (r'\bNa Dalva\b', 'No Follou'),
       (r'\bna Dalva\b', 'no Follou'), (r'\bPela Dalva\b', 'Pelo Follou'), (r'\bpela Dalva\b', 'pelo Follou'),
       (r'\bA Dalva\b', 'O Follou'), (r'\ba Dalva\b', 'o Follou'), (r'\bà Dalva\b', 'ao Follou'),
       (r'\bDalva 2\.0 — ', 'Follou — '), (r'dalvaapp\.com\.br', 'follou.com.br'), (r'\bDalva\b', 'Follou'),
       (r'\bdalva\b', 'follou')]

# concordância: o Follou é masculino
GENERO = [('Archivo 700', 'Archivo 600'), ('O horizonte do logo vira família: Hoje e Ritmo.', 'Hoje e Ritmo vêm do horizonte da marca antiga.'), ('Ela prepara e põe', 'Ele prepara e põe'), ('Não. Ela escreve', 'Não. Ele escreve'), ('manda mensagem sozinha?', 'manda mensagem sozinho?'),
          ('conversa com ela por lá', 'conversa com ele por lá'), ('não vence nenhuma sozinha', 'não vence nenhuma sozinho'),
          ('deixa o Follou barata para o cliente e lucrativa para a gente', 'deixa o Follou barato para o cliente e lucrativo para a gente')]

# ---------- cores que não dependem do fundo ----------
FIXO = {'#0B0C14': F.CARVAO, '#1B1E2E': F.SUPERFICIE_ESCURA, '#2A2D3E': F.LINHA_ESCURA,
        '#5E6272': F.TINTA_MEDIA, '#A6A9B6': F.NEVE_MEDIA, '#8A8D99': F.NEVE_FRACA, '#8C8F9C': F.NEVE_FRACA,
        '#A1A1A6': F.NEVE_FRACA, '#C9C7D2': F.NEVE_MEDIA, '#E4E3EA': F.LINHA_CLARA,
        '#F7F5F2': F.NEVE, '#FBFAF8': F.PAPEL, '#EFECE6': F.AREIA, '#F0EDE7': '#EDE9E2', '#E6E2DB': F.LINHA_CLARA,
        '#E8ECF3': F.AREIA, '#F5E6D0': F.ALERTA_TINTA_FUNDO, '#8F550E': F.ALERTA_TINTA}
HEX = re.compile(r'#[0-9A-Fa-f]{6}\b')
BG = re.compile(r'background(?:-color)?\s*:\s*([^;"]*?)(#[0-9A-Fa-f]{6})\b(?=[^;"#]*(?:;|"|$))')

def map_color(prop, hx, ground_dark, on_sinal):
    """prop: 'bg' | 'fg' (cor de texto) | 'other' (borda, ícone, traço)."""
    h = hx.upper()
    if h == '#FF7A45' or h == '#FF9068':  # acento: ação principal
        base = F.SINAL if ground_dark else F.SINAL_TINTA
        return base if h == '#FF7A45' else ('#62D896' if ground_dark else '#0A5A2D')
    if h == '#C77713':  # âmbar de estado -> ferrugem
        return F.ALERTA if ground_dark else F.ALERTA_TINTA
    if h == '#4E628F':  # azul de estado -> neutro (a marca não tem azul)
        return F.NEVE_MEDIA if ground_dark else F.TINTA_MEDIA
    if h == '#11131F':
        if prop == 'bg': return F.CARVAO
        if on_sinal == 'bright': return F.CARVAO
        if on_sinal == 'deep': return F.PAPEL
        return F.NEVE if ground_dark else F.TINTA
    if h == '#33364A':
        if prop == 'bg': return F.LINHA_ESCURA
        if on_sinal == 'deep': return F.PAPEL
        return F.NEVE_MEDIA if ground_dark else F.TINTA
    if h == '#FFFFFF':
        if prop == 'bg': return F.PAPEL
        return F.NEVE
    if h == '#CFCAC1': return '#CFC9BF'
    return FIXO.get(h, hx)

VOID = {'meta', 'link', 'img', 'br', 'hr', 'input', 'source', 'col', 'wbr'}
TAG = re.compile(r'<(/?)([A-Za-z][\w:-]*)((?:[^>"\']|"[^"]*"|\'[^\']*\')*?)(/?)>')

def recolor(s):
    out, last, stack = [], 0, [(None, True, None)]  # (tag, ground_dark, on_sinal)
    # não mexer em <script>
    spans = [(m.start(), m.end()) for m in re.finditer(r'<script.*?</script>', s, flags=re.S)]
    def in_script(i): return any(a <= i < b for a, b in spans)
    for m in TAG.finditer(s):
        if in_script(m.start()): continue
        out.append(s[last:m.start()]); last = m.end()
        closing, name, attrs, selfc = m.groups()
        if closing:
            if len(stack) > 1: stack.pop()
            out.append(m.group(0)); continue
        _, pg_dark, pg_sinal = stack[-1]
        # fundo próprio
        bg = None; on_sinal = pg_sinal
        mb = BG.search(attrs)
        own_dark = pg_dark
        if mb:
            old = mb.group(2).upper()
            nb = map_color('bg', old, pg_dark, None)
            bg = nb
            own_dark = dark(nb)
            on_sinal = 'bright' if nb == F.SINAL else 'deep' if nb == F.SINAL_TINTA else None
        def sub(mm):
            hx = mm.group(0); h = hx.upper()
            if h not in ('#FF7A45', '#FF9068', '#C77713', '#4E628F', '#11131F', '#33364A', '#FFFFFF') and h not in FIXO and h != '#CFCAC1':
                return hx
            pre = s_attr[max(0, mm.start() - 160):mm.start()]
            if re.search(r'background(?:-color)?\s*:[^;"]*$', pre):
                return map_color('bg', hx, pg_dark if h in ('#FF7A45', '#FF9068', '#C77713') else own_dark, None)
            if re.search(r'(?<![-a-z])color\s*:\s*$', pre):
                return map_color('fg', hx, own_dark, on_sinal)
            return map_color('other', hx, own_dark, on_sinal)
        s_attr = attrs
        attrs2 = HEX.sub(sub, attrs)
        for a, b in (('rgba(17,19,31,', 'rgba(16,15,15,'), ('rgba(17, 19, 31, ', 'rgba(16, 15, 15, ')):
            attrs2 = attrs2.replace(a, b)
        sg = '63,208,127' if own_dark else '14,112,56'
        attrs2 = re.sub(r'rgba\(\s*255,\s*122,\s*69,', f'rgba({sg},', attrs2)
        attrs2 = re.sub(r'rgba\(\s*199,\s*119,\s*19,', 'rgba(232,134,92,' if own_dark else 'rgba(147,64,43,', attrs2)
        out.append(f'<{name}{attrs2}{selfc}>')
        if not selfc and name.lower() not in VOID:
            stack.append((name, own_dark, on_sinal))
    out.append(s[last:])
    return ''.join(out)


def root_dark(s):
    m = re.search(r'<div style="[^"]*?background:\s*(#[0-9A-Fa-f]{6})', s[s.find('</helmet>'):])
    return bool(m) and dark(map_color('bg', m.group(1), True, None))

def recolor_blocks(s):
    """<style> e <script>: regras de foco, hover e cores guardadas em dados do JS."""
    fd = root_dark(s)
    def blk(m):
        b = m.group(0)
        def sub(mm):
            hx = mm.group(0); h = hx.upper()
            if h not in ('#FF7A45', '#FF9068', '#C77713', '#4E628F', '#11131F', '#33364A', '#FFFFFF', '#5E6272', '#A6A9B6', '#EFECE6', '#E6E2DB', '#F7F5F2', '#8F550E', '#F5E6D0', '#E8ECF3'):
                return hx
            pre = b[max(0, mm.start() - 45):mm.start()]
            if re.search(r'(?:background|fundo|bg|bgc)\w*[\s\'":=?]*$', pre, flags=re.I): prop = 'bg'
            elif re.search(r'(?<![-a-z])(?:color|cor|corValor|corRot)\s*[\'":=?]*\s*$', pre, flags=re.I): prop = 'fg'
            else: prop = 'other'
            return map_color(prop, hx, fd and h in ('#FF7A45', '#FF9068') or False, None) if h in ('#FF7A45', '#FF9068') else map_color(prop, hx, fd, None)
        return HEX.sub(sub, b)
    return re.sub(r'<(script|style)\b.*?</\1>', blk, s, flags=re.S)

def fonts(s):
    s = s.replace('family=Sora:wght@500;600;700&amp;', 'family=Archivo:wght@500;600;700&amp;')
    s = s.replace('family=Sora:wght@600;700&amp;', 'family=Archivo:wght@500;600;700&amp;')
    def st(m):
        v = m.group(0)
        if 'Sora' not in v: return v
        v = v.replace("'Sora'", "'Archivo'").replace('Sora', 'Archivo')
        return re.sub(r'font-weight:\s*700', 'font-weight: 600', v)
    s = re.sub(r'style="[^"]*"', st, s)
    s = re.sub(r"(h1,h2,h3,\.ds\{font-family:[^}]*\})", lambda m: m.group(1).replace('Sora', 'Archivo'), s)
    return s.replace('Sora', 'Archivo')

LOGO = re.compile(r'<svg viewBox="0 -742 2542 752" width="([\d.]+)" height="([\d.]+)"[^>]*>.*?</svg>', re.S)
def logos(s):
    def sub(m):
        h = float(m.group(2)); fill = re.search(r'fill="(#[0-9A-Fa-f]{6})"', m.group(0))
        light_ground = not fill or fill.group(1).upper() != '#FFFFFF'
        sym_h = round(h * 0.86)
        if light_ground: return F.lockup(sym_h, text=F.TINTA, sym=F.SINAL_TINTA)
        return F.lockup(sym_h, text=F.NEVE, sym=F.SINAL)
    return LOGO.sub(sub, s)

def names(s):
    for a, b in ART: s = re.sub(a, b, s)
    for a, b in GENERO: s = s.replace(a, b)
    return s

TEXTO = {
 'Estrategia.dc.html': [
  ('> Empresas B2B de 1 a 10 pessoas, em que o fundador vende, entrega e administra.<', '> Fundador de startup de tecnologia no começo da jornada: 1 a 10 pessoas, vende para outras empresas, sem equipe comercial nem CRM.<'),
  ('>Encontre empresas para vender. Não perca o próximo passo.<', '>Follou — a jogada de hoje.<'),
  ('>O assistente comercial de quem vende, administra e entrega ao mesmo tempo. Você descreve o cliente, recebe as empresas e as três ações do dia em ordem.<',
   '>O conselho da manhã. Diz ao fundador qual decisão comercial vale mais hoje: você descreve o cliente, recebe as empresas e as três ações do dia em ordem.<')],
 'Landing.dc.html': [('>Assistente comercial para empresas de 1 a 10 pessoas<', '>O conselho da manhã para fundadores que vendem<'),
  ('>Encontre empresas para vender. Não perca o próximo passo.<', '>A jogada de hoje.<')],
 'LandingMobile.dc.html': [('>Encontre empresas para vender. Não perca o próximo passo.<', '>A jogada de hoje.<')],
 'Waitlist.dc.html': [('>Encontre empresas para vender. Não perca o próximo passo. Se você vende, entrega e administra ao mesmo tempo, entra no piloto.<',
   '>A jogada de hoje, toda manhã. Se você é fundador e vende sem equipe comercial, entra no piloto.<')],
 'Regua.dc.html': [
  ('Noite<span style="width: 14px; height: 14px; border-radius: 7px; background: #100F0F"', 'Carvão<span style="width: 14px; height: 14px; border-radius: 7px; background: #100F0F"'),
  ('Bruma<span', 'Neve<span'),
  ('Coral<span style="width: 14px; height: 14px; border-radius: 7px; background: #0E7038"', 'Sinal<span style="width: 14px; height: 14px; border-radius: 7px; background: #3FD07F"'),
  ('Âmbar<span style="width: 14px; height: 14px; border-radius: 7px; background: #93402B"', 'Ferrugem<span style="width: 14px; height: 14px; border-radius: 7px; background: #E8865C"'),
  ('Azul<span style="width: 14px; height: 14px; border-radius: 7px; background: #C9C6C0"', 'Tinta-média<span style="width: 14px; height: 14px; border-radius: 7px; background: #57524B"')],
 'Sistema.dc.html': [
  ('coral, uma vez por tela', 'verde sinal, uma vez por tela'),
  ('O logo é desenho próprio: nunca “Follou” escrito em Archivo.', 'O logotipo é Archivo SemiBold, entressaca −0,02 em, sempre com o símbolo ao lado.'),
  ('>Aposentados<', '>Proibidos<'),
  ('#8A8D99 · 3,0:1', 'sinal no papel · 1,9:1'), ('#A1A1A6 · 2,6:1', 'sinal-tinta no carvão · 3,1:1'), ('branco sobre coral · 2,6:1', 'alerta no papel · 2,5:1'),
  ('Coral é o principal, um por tela. Texto em Noite sobre o coral. O resto é texto ou ícone.',
   'Verde é o principal, um por tela. Carvão sobre o sinal no escuro, papel sobre o sinal-tinta no claro. O resto é texto ou ícone.')],
}
CORES_SISTEMA = """      cores: [
        { nome: 'Carvão', hex: '#100F0F', papel: 'Fundo do aplicativo e da manhã.', cr: 'neve: 17,0:1' },
        { nome: 'Neve', hex: '#F4F1EC', papel: 'Texto no escuro. Fundo do dia.', cr: 'tinta: 15,7:1' },
        { nome: 'Papel', hex: '#FAF9F7', papel: 'Card e folha.', cr: 'tinta: 16,8:1' },
        { nome: 'Sinal', hex: '#3FD07F', papel: 'Ação principal no escuro, uma por tela. Texto em carvão.', cr: 'carvão: 9,6:1' },
        { nome: 'Sinal-tinta', hex: '#0E7038', papel: 'Ação principal no claro. Texto em papel.', cr: 'papel: 5,9:1' },
        { nome: 'Ferrugem', hex: '#E8865C', papel: 'Atrasado, parado, no escuro. No claro: chip #EEE3DF com texto #93402B.', cr: 'carvão: 7,3:1\\nchip: 5,6:1' },
        { nome: 'Tinta-média', hex: '#57524B', papel: 'Texto de apoio no claro. Marca também o “Hoje”: a marca não tem azul.', cr: 'na neve: 6,9:1' },
        { nome: 'Neve-média', hex: '#C9C6C0', papel: 'Texto de apoio no escuro.', cr: 'no carvão: 11,2:1' }
      ]"""

def texto(f, s):
    for a, b in TEXTO.get(f, []):
        if a in s: s = s.replace(a, b)
    if f == 'Sistema.dc.html':
        s = re.sub(r"      cores: \[.*?\n      \]", lambda m: CORES_SISTEMA, s, flags=re.S)
    return s

def run(files):
    for f in files:
        p = os.path.join(CANVAS, f); s = open(p).read(); o = s
        s = logos(s); s = fonts(s); s = recolor(s); s = recolor_blocks(s); s = names(s); s = texto(f, s)
        if s != o: open(p, 'w').write(s)
        left = sorted(set(re.findall(r'#(?:FF7A45|FF9068|11131F|33364A|5E6272|A6A9B6|C77713|4E628F|8F550E|F5E6D0|E8ECF3)\b', s, flags=re.I)))
        print(f'{f:34} {"mudou" if s != o else "igual "} {("sobrou " + str(left)) if left else ""}')

if __name__ == '__main__':
    d = json.load(open(os.path.join(CANVAS, 'canvas.json')))
    files = [f for f, b in d['boards'].items() if b['page'] != 'legado' and f not in SKIP]
    run(files)
