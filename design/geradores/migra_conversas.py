"""Migração de 31/10/2026: Pipeline vira Conversas (sem funil); Projetos e Grana saem do canvas.

Roda uma vez, de dentro de design/geradores. Depois dela, os quadros são editados à mão (ou por gen_*.py).
"""
import json, os, re, subprocess
C = os.path.join(os.path.dirname(__file__), '..', 'canvas')
ROOT = os.path.join(C, '..', '..')
RENAME = [('PipelineNegocioMobile', 'ConversaMobile'), ('PipelineAbordagemMobile', 'AbordagemMobile'), ('PipelineMobile', 'ConversasMobile'),
          ('PipelineNegocio', 'Conversa'), ('Pipeline', 'Conversas')]
REMOVE = ['Projetos', 'Grana', 'ProjetosMobile', 'GranaMobile', 'LegadoProjetos', 'LegadoGrana', 'LegadoProjetosMobile', 'LegadoGranaMobile']
KANBAN = re.compile(r'<rect x="3\.5" y="4" width="4\.5" height="16" rx="1\.5"></rect><rect x="9\.75" y="4" width="4\.5" height="11" rx="1\.5"></rect><rect x="16" y="4" width="4\.5" height="7" rx="1\.5"></rect>')
CHAT = '<path d="M4 5h16v11H9l-5 4z"></path>'
TXT = [(r'(<title>[^<]*?)Pipeline · negócio aberto \+ abordagem', r'\1Conversa aberta e abordagem'), (r'(<title>[^<]*?)Pipeline · abordagem', r'\1Abordagem'),
       (r'(<title>[^<]*?)Negócio aberto e abordagem', r'\1Conversa aberta e abordagem'), (r'(<title>[^<]*?)Negócio aberto', r'\1Conversa aberta'),
       (r'(<title>[^<]*?)Pipeline', r'\1Conversas'), (r'>Pipeline<', '>Conversas<'), (r'>G P<', '>G V<'),
       (r'O que mudou no Pipeline', 'O que mudou nas Conversas'), (r'para o Pipeline', 'para Conversas'), (r'já estão no seu Pipeline', 'já estão em Conversas'),
       (r'Já no Pipeline', 'Já em Conversas'), (r'no seu Pipeline', 'em Conversas'), (r'Funil compartilhado com o time', 'Conversas compartilhadas com o time'),
       (r'Pipeline, hoje', 'Conversas, hoje'), (r'Pipeline, atualizado hoje', 'Conversas, lido hoje'), (r'\bno Pipeline\b', 'em Conversas'), (r'\bdo Pipeline\b', 'das Conversas'),
       (r'\bPipeline\b', 'Conversas')]

d = json.load(open(os.path.join(C, 'canvas.json')))
legacy = {f for f, b in d['boards'].items() if b['page'] == 'legado'}
for a, b in RENAME:
    src = os.path.join(C, a + '.dc.html')
    if os.path.exists(src):
        subprocess.run(['git', 'mv', src, os.path.join(C, b + '.dc.html')], cwd=ROOT, check=True)
for r in REMOVE:
    p = os.path.join(C, r + '.dc.html')
    if os.path.exists(p): subprocess.run(['git', 'rm', '-q', p], cwd=ROOT, check=True)
# canvas.json
for r in REMOVE:
    d['boards'].pop(r + '.dc.html', None)
    if r + '.dc.html' in d['order']: d['order'].remove(r + '.dc.html')
ren = {a + '.dc.html': b + '.dc.html' for a, b in RENAME}
d['boards'] = {ren.get(k, k): v for k, v in d['boards'].items()}
d['order'] = [ren.get(k, k) for k in d['order']]
for k, v in d['boards'].items():
    if 'Pipeline' in v.get('title', '') and v['page'] != 'legado': pass
json.dump(d, open(os.path.join(C, 'canvas.json'), 'w'), ensure_ascii=False, indent=1)
# conteúdo dos quadros que não são do Legado
for f in sorted(os.listdir(C)):
    if not f.endswith('.dc.html') or f in legacy or f.startswith('Legado'): continue
    p = os.path.join(C, f); s = open(p).read(); o = s
    for a, b in RENAME: s = s.replace(a + '.dc.html', b + '.dc.html')
    s = KANBAN.sub(CHAT, s)
    for a, b in TXT: s = re.sub(a, b, s)
    if s != o: open(p, 'w').write(s); print('editado', f)
