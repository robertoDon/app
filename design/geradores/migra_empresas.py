"""Migração de 31/10/2026: Caçada vira Empresas (só o nome do módulo; o resto do produto fica).
Roda uma vez, de dentro de design/geradores.
"""
import json, os, re, subprocess
C = os.path.join(os.path.dirname(__file__), '..', 'canvas'); ROOT = os.path.join(C, '..', '..')
RENAME = [('CacadaEntradaMobile', 'EmpresasEntradaMobile'), ('CacadaEntrada', 'EmpresasEntrada'), ('CacadaMobile', 'EmpresasMobile'), ('Cacada', 'Empresas')]
ALVO = re.compile(r'<circle cx="12" cy="12" r="7\.5"></circle><circle cx="12" cy="12" r="2"></circle><path d="M12 2v3"></path><path d="M12 19v3"></path><path d="M2 12h3"></path><path d="M19 12h3"></path>')
PREDIO = '<path d="M5 20V5h9v15"></path><path d="M14 10h5v10"></path><path d="M3 20h18"></path><path d="M8 9h3"></path><path d="M8 13h3"></path>'
TXT = [(r'>G C<', '>G E<'), (r'>G V<', '>G C<'),
       (r'(<title>[^<]*?)Primeira caçada', r'\1Primeiras empresas'), (r'(<title>[^<]*?)Caçada', r'\1Empresas'),
       (r'>Primeira caçada<', '>Primeiras empresas<'), (r'>Caçada<', '>Empresas<'), (r'Nova caçada', 'Buscar empresas'),
       (r'12 empresas novas na sua caçada', '12 empresas novas no seu perfil'), (r'12 empresas novas na sua caçada', '12 empresas novas no seu perfil'),
       (r'Achadas na sua caçada', 'Achadas pelo seu perfil'), (r'desde a última caçada', 'desde a última busca'),
       (r'Caça de novo', 'Busca de novo'), (r'e caça quantas vezes', 'e busca quantas vezes'), (r'>Caçar<', '>Buscar<'), (r'Caçar grátis', 'Buscar grátis'),
       (r'caçada \\"SaaS em SC\\"', r'busca \\"SaaS em SC\\"'), (r'caçada “SaaS em SC”', 'busca “SaaS em SC”'),
       (r'A Caçada em seis passos', 'A busca de empresas em seis passos'), (r"name: 'Caçada'", "name: 'Empresas'"),
       (r'A primeira caçada vem pronta', 'A primeira busca vem pronta'), (r'Hoje, Conversas e Caçada', 'Hoje, Conversas e Empresas'),
       (r'Caçar', 'Buscar'), (r'caçar', 'buscar')]
d = json.load(open(os.path.join(C, 'canvas.json')))
legacy = {f for f, b in d['boards'].items() if b['page'] == 'legado'}
for a, b in RENAME:
    src = os.path.join(C, a + '.dc.html')
    if os.path.exists(src): subprocess.run(['git', 'mv', src, os.path.join(C, b + '.dc.html')], cwd=ROOT, check=True)
ren = {a + '.dc.html': b + '.dc.html' for a, b in RENAME}
d['boards'] = {ren.get(k, k): v for k, v in d['boards'].items()}
d['order'] = [ren.get(k, k) for k in d['order']]
T = {'Empresas.dc.html': '3. Empresas — web', 'EmpresasEntrada.dc.html': '3. Empresas · primeiras empresas — web', 'EmpresasMobile.dc.html': '3. Empresas — celular',
     'EmpresasEntradaMobile.dc.html': '3. Empresas · primeiras empresas — celular'}
for k, v in T.items(): d['boards'][k]['title'] = v
json.dump(d, open(os.path.join(C, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
for f in sorted(os.listdir(C)):
    if not f.endswith('.dc.html') or f in legacy or f.startswith('Legado') or f in ('Contatos.dc.html', 'ContatosMobile.dc.html', 'Motor.dc.html', 'Perguntas.dc.html', 'Dados.dc.html', 'Viabilidade.dc.html'): continue
    p = os.path.join(C, f); s = open(p).read(); o = s
    for a, b in RENAME: s = s.replace(a + '.dc.html', b + '.dc.html')
    s = ALVO.sub(PREDIO, s)
    for a, b in TXT: s = re.sub(a, b, s)
    if s != o: open(p, 'w').write(s); print('editado', f)
