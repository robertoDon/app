# Ajustes pequenos pós-feedback do David (v25).
import os, re
P = os.path.join(os.path.dirname(os.path.abspath(__file__)), 'project')
def rd(f): return open(os.path.join(P, f)).read()
def wr(f, s): open(os.path.join(P, f), 'w').write(s)
def sub(s, old, new, count=1, f=''):
    n = s.count(old)
    assert n >= 1, f'{f}: não achei {old[:70]!r}'
    if count == 1: assert n == 1, f'{f}: {n}x {old[:70]!r}'
    return s.replace(old, new)

CHECK = '<span style="width: 22px; height: 22px; border-radius: 7px; background: #11131F; display: inline-flex; align-items: center; justify-content: center; flex-shrink: 0"><svg viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="#FFFFFF" stroke-width="3" aria-hidden="true"><path d="M5 12l5 5 9-10"></path></svg></span>'
CARD = 'background: #FFFFFF; border-radius: 20px; box-shadow: 0 1px 2px rgba(0,0,0,0.04), 0 8px 24px rgba(0,0,0,0.05)'

def chip(label, origin, sug=False):
    border = '1px dashed #A9A49A' if sug else '1px solid #11131F'
    bg = '#FFFFFF' if sug else '#11131F'
    col = '#33364A' if sug else '#FFFFFF'
    x = '<span aria-hidden="true" style="opacity: 0.6; margin-left: 2px">×</span>'
    return (f'<span style="display: inline-flex; align-items: center; gap: 6px; font-size: 14px; font-weight: 600; padding: 8px 12px 8px 14px; border-radius: 999px; background: {bg}; color: {col}; border: {border}">{label}'
            f'<span style="font-size: 12px; font-weight: 500; opacity: 0.7">· {origin}</span>{x}</span>')

# ---------- Caçada · primeira caçada (web) ----------
f = 'CacadaEntrada.dc.html'; s = rd(f)
s = sub(s, 'Cinco respostas e a tua lista sai pronta.', 'Uma frase e a lista sai pronta. Ajustar é opcional.', f=f)
s = sub(s, '<span style="font-size: 14px; font-weight: 600; color: #5E6272">4 de 5</span>', '<span style="font-size: 14px; font-weight: 500; color: #5E6272">Leva menos de 1 minuto</span>', f=f)
a = s.index('<section style="background: #FFFFFF; border-radius: 20px;'); b = s.index('</section>', a) + len('</section>')
left = f'''<section style="{CARD}; overflow: hidden">
        <div style="padding: 20px; display: flex; flex-direction: column; gap: 12px">
          <label for="q1" style="font-size: 13px; font-weight: 600; color: #5E6272">Para quem você vende? Escreva como falaria para um amigo.</label>
          <div style="display: flex; gap: 10px; flex-wrap: wrap"><input id="q1" type="text" value="Vendo sites e apps para software houses e agências de SC" style="flex: 1 1 320px; min-width: 0; font: inherit; font-size: 17px; padding: 12px 14px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FBFAF8; color: #11131F"><button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: #11131F; background: #FF7A45; border: 0; border-radius: 999px; padding: 12px 22px; min-height: 44px; cursor: pointer">Caçar</button></div>
        </div>
        <div style="padding: 20px; background: #FBFAF8; border-top: 1px solid rgba(0,0,0,0.06); display: flex; flex-direction: column; gap: 12px">
          <p style="margin: 0; font-size: 13px; font-weight: 600; color: #5E6272">ENTENDI ASSIM</p>
          <p style="margin: 0; font-size: 19px; font-weight: 600; letter-spacing: -0.01em; line-height: 1.4">Software houses e agências em Santa Catarina, abertas há mais de dois anos. Quer ajustar algum critério?</p>
          <div style="display: flex; flex-wrap: wrap; gap: 8px">{chip("Software + agências", "da sua frase")}{chip("Santa Catarina", "da sua frase")}{chip("Aberta há 2+ anos", "sugestão", True)}{chip("ME ou EPP", "sugestão", True)}</div>
          <p style="margin: 0; font-size: 13px; color: #5E6272">Contorno cheio veio da sua frase. Tracejado é sugestão da Dalva: toque no × para tirar. <a href="#" style="font-weight: 600">Filtros avançados</a></p>
        </div>
        <div style="display: flex; justify-content: space-between; align-items: center; gap: 12px; padding: 16px 20px; border-top: 1px solid rgba(0,0,0,0.06)"><span style="font-size: 13px; color: #5E6272">Já tem uma lista? <a href="#" style="font-weight: 600">Importar CSV ou Google Contatos</a></span><button type="button" style="font: inherit; font-size: 15px; font-weight: 600; color: #FFFFFF; background: #11131F; border: 0; border-radius: 999px; padding: 12px 20px; min-height: 44px; cursor: pointer">Ver as 80 empresas</button></div>
      </section>'''
s = s[:a] + left + s[b:]
s = sub(s, 'empresas batem com o que você respondeu.', 'empresas batem com a sua frase. Fonte: Receita Federal, set/2026.', f=f)
s = sub(s, 'A primeira caçada não gasta crédito. Você sai daqui com uma lista pronta para trabalhar.',
        'Buscar empresas nunca gasta crédito. Crédito só quando você pede para enriquecer um contato.', f=f)
s = s.replace('''        </section>
      </div>
    </div>
  </main>''', f'''        </section>
        <section style="{CARD}; padding: 20px; display: flex; flex-direction: column; gap: 6px">
          <p style="margin: 0; font-size: 15px; font-weight: 600">E toda noite, de novo</p>
          <p style="margin: 0; font-size: 14px; line-height: 1.5; color: #33364A">A Dalva repete esta caçada de madrugada e te mostra só as empresas novas. Se não aparecer nenhuma, ela diz isso e não insiste.</p>
        </section>
      </div>
    </div>
  </main>''')
assert 'E toda noite' in s
wr(f, s)

# ---------- Caçada · primeira caçada (celular) ----------
f = 'CacadaEntradaMobile.dc.html'; s = rd(f)
s = sub(s, '<p style="margin: 0; font-size: 13px; font-weight: 500; color: #5E6272">4 de 5</p>', '<p style="margin: 0; font-size: 13px; font-weight: 500; color: #5E6272">Uma frase basta</p>', f=f)
s = re.sub(r'  <div style="margin: 14px 20px 0"><div style="height: 4px;.*?</div></div></div>\n', '', s, count=1)
a = s.index('  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; overflow: hidden">'); b = s.index('  <div style="position: absolute; left: 16px; right: 16px; bottom: 100px">')
mchip = lambda l, sug=False: f'<span style="font-size: 13px; font-weight: 600; padding: 7px 12px; border-radius: 999px; background: {"#FFFFFF" if sug else "#11131F"}; color: {"#33364A" if sug else "#FFFFFF"}; border: {"1px dashed #A9A49A" if sug else "1px solid #11131F"}">{l} <span aria-hidden="true" style="opacity: 0.6">×</span></span>'
s = s[:a] + f'''  <div style="margin: 16px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 14px; display: flex; flex-direction: column; gap: 10px">
    <label for="q1m" style="font-size: 13px; font-weight: 600; color: #5E6272">Para quem você vende?</label>
    <textarea id="q1m" rows="2" style="font: inherit; font-size: 16px; line-height: 1.35; padding: 10px 12px; border: 1px solid rgba(0,0,0,0.12); border-radius: 12px; background: #FBFAF8; color: #11131F; resize: none">Sites e apps para software houses e agências de SC</textarea>
  </div>
  <div style="margin: 10px 16px 0; background: #FFFFFF; border-radius: 20px; padding: 16px; display: flex; flex-direction: column; gap: 10px">
    <p style="margin: 0; font-size: 12px; font-weight: 600; color: #5E6272">ENTENDI ASSIM</p>
    <p style="margin: 0; font-size: 17px; font-weight: 600; line-height: 1.4">Software houses e agências em SC, abertas há mais de dois anos. Quer ajustar?</p>
    <div style="display: flex; flex-wrap: wrap; gap: 6px">{mchip("Software + agências")}{mchip("SC")}{mchip("2+ anos", True)}{mchip("ME ou EPP", True)}</div>
    <p style="margin: 0; font-size: 12px; line-height: 1.45; color: #5E6272">Tracejado é sugestão da Dalva. Toque no × para tirar.</p>
  </div>
  <p style="margin: 12px 20px 0; font-size: 13px; line-height: 1.45; color: #5E6272; text-align: center">~80 empresas · Receita Federal, set/2026<br>Buscar é grátis. E ela repete toda noite.</p>
''' + s[b:]
s = sub(s, '>Continuar</button>', '>Ver as 80 empresas</button>', f=f)
wr(f, s)

# ---------- Caçada (web) ----------
f = 'Cacada.dc.html'; s = rd(f)
s = sub(s, '>38 de 50 créditos</span>', '>38 de 50 créditos para enriquecer</span>', f=f)
s = sub(s, 'Caçar · 1 crédito', 'Caçar · grátis', f=f)
s = sub(s, '<span style="font-size: 13px; color: #5E6272">Últimas:', '<span style="font-size: 13px; color: #5E6272"><span style="display: inline-flex; align-items: center; gap: 6px; font-weight: 600; color: #33364A; margin-right: 10px"><span style="width: 30px; height: 18px; border-radius: 999px; background: #11131F; position: relative; display: inline-block"><span style="position: absolute; right: 2px; top: 2px; width: 14px; height: 14px; border-radius: 50%; background: #FFFFFF"></span></span>Repetir toda noite</span>Últimas:', f=f)
s = sub(s, '<th colspan="5" style="padding: 10px 20px 4px; font-weight: 600">DADO PÚBLICO <span style="font-weight: 500">· Receita Federal, set/2026 · grátis</span></th>',
        '<th colspan="6" style="padding: 10px 20px 4px; font-weight: 600">DADO OFICIAL <span style="font-weight: 500">· Receita Federal, set/2026 · grátis</span></th>', f=f)
s = sub(s, 'ENRIQUECIDO <span style="font-weight: 500">· só cobra se achar</span>', 'ENRIQUECIDO <span style="font-weight: 500">· web, com fonte · só cobra se achar</span>', f=f)
s = sub(s, '<th style="padding: 8px 16px 10px; font-weight: 500">Desde</th><th style="padding: 8px 20px 10px; font-weight: 500; border-left: 1px solid rgba(0,0,0,0.06)">Decisor</th>',
        '<th style="padding: 8px 16px 10px; font-weight: 500">Desde</th><th style="padding: 8px 16px 10px; font-weight: 500">Sócio-administrador</th><th style="padding: 8px 20px 10px; font-weight: 500; border-left: 1px solid rgba(0,0,0,0.06)">Contato e sinais</th>', f=f)
s = sub(s, 'min-width: 820px', 'min-width: 980px', f=f)
socios = {'2019': 'Carla M.', '2017': 'Paulo R.', '2021': 'Marina S.', '2020': 'Rodrigo T.', '2018': 'Júlia A.', '2016': 'Eduardo B.'}
for ano, nome in socios.items():
    s = sub(s, f'<td style="padding: 12px 16px">{ano}</td>', f'<td style="padding: 12px 16px">{ano}</td><td style="padding: 12px 16px">{nome}</td>', f=f)
s = s.replace('Achar decisor · 1 crédito', 'Enriquecer · 1 crédito')
s = sub(s, '<span style="font-size: 13px">Carla M. · CEO</span>', '<span style="font-size: 13px">site · vaga aberta em vendas</span>', f=f)
s = sub(s, '<span style="font-size: 13px">Rodrigo T. · Sócio</span>', '<span style="font-size: 13px">site · 4,8 no Google</span>', f=f)
wr(f, s)

# ---------- Caçada (celular) ----------
f = 'CacadaMobile.dc.html'; s = rd(f)
s = sub(s, '>38 de 50 créditos</p>', '>38 de 50 créditos para enriquecer</p>', f=f)
s = sub(s, 'Caçar · 1 crédito', 'Caçar · grátis', f=f)
s = s.replace('Achar decisor · 1 crédito', 'Enriquecer · 1 crédito')
for a_, b_ in [('Software · Florianópolis · 2019', 'Software · Florianópolis · 2019<br>Sócia: Carla M.'), ('Agência de marketing · Florianópolis · 2017', 'Agência · Florianópolis · 2017<br>Sócio: Paulo R.'),
               ('Software · Joinville · 2021', 'Software · Joinville · 2021<br>Sócia: Marina S.'), ('Software · Blumenau · 2020', 'Software · Blumenau · 2020<br>Sócio: Rodrigo T.')]:
    s = sub(s, a_, b_, f=f)
wr(f, s)

# ---------- Pipeline ----------
f = 'Pipeline.dc.html'; s = rd(f)
s = sub(s, '>Lead <span', '>Para abordar <span', f=f)
s = s.replace('prospects · fora da conta', 'fora da conta')
s = sub(s, 'Achar o decisor · venceu 24/10', 'Achar o contato · venceu 24/10', f=f)
s = sub(s, '>Fechado <span style="color: #5E6272; font-weight: 500">3</span>', '>Ganho <span style="color: #5E6272; font-weight: 500">3</span>', f=f)
s = s.replace('>fechado hoje<', '>ganho hoje<').replace('>fechado 22/10<', '>ganho 22/10<').replace('>fechado 15/10<', '>ganho 15/10<')
s = sub(s, 'Lead é prospect: ninguém demonstrou interesse ainda, então não entra no Grana.', 'Para abordar: ninguém demonstrou interesse ainda, então não entra no Grana. Perdidos saem do funil e ficam no histórico.', f=f)
# linha de perdidos no fim da coluna Ganho
i = s.index('>ganho 15/10<'); j = s.index('</article>', i) + len('</article>')
s = s[:j] + '<a href="#" style="display: flex; justify-content: space-between; padding: 10px 6px 2px; font-size: 13px; font-weight: 500; color: #5E6272; text-decoration: none"><span>2 perdidos em outubro</span><span>ver motivos</span></a>' + s[j:]
wr(f, s)

f = 'PipelineMobile.dc.html'; s = rd(f)
s = sub(s, '>Lead <span style="opacity: 0.6">4</span>', '>Para abordar <span style="opacity: 0.6">4</span>', f=f)
s = sub(s, '>Fechado <span style="opacity: 0.6">3</span>', '>Ganho <span style="opacity: 0.6">3</span>', f=f)
wr(f, s)

# ---------- Grana ----------
for f in ['Grana.dc.html', 'GranaMobile.dc.html']:
    s = rd(f)
    s = s.replace('>Fechado em outubro<', '>Ganho em outubro<').replace('>Fechado no mês<', '>Ganho no mês<').replace('>Fechado por mês<', '>Ganho por mês<').replace('>Fechados em outubro<', '>Ganhos em outubro<')
    s = sub(s, 'R$ 9.400 recebido · R$ 3.000 a receber', '3 contratos ganhos · conta contrato, não caixa', f=f)
    s = s.replace('Lead não entra: ninguém demonstrou interesse ainda.', 'Para abordar não entra: ninguém demonstrou interesse ainda.')
    s = s.replace('Meta de R$ 20.000 · faltam 5 dias', 'Meta: R$ 20.000 em contratos · faltam 5 dias')
    s = re.sub(r'<span style="[^"]*">(a receber|recebido)</span>', '', s)
    assert 'recebid' not in s and 'a receber' not in s, f
    wr(f, s)

# ---------- Módulos ----------
f = 'Modulos.dc.html'; s = rd(f)
s = sub(s, "what: 'Lead, Conversa, Proposta, Fechado.", "what: 'Para abordar, Conversa, Proposta, Ganho ou perdido.", f=f)
s = s.replace("note: 'Lead é prospect e fica fora da conta.", "note: 'Para abordar fica fora da conta.")
s = s.replace("note: 'Custo em créditos antes de rodar.", "note: 'Buscar é grátis e repete toda noite. Crédito só para enriquecer.")
s = s.replace("what: 'Fechado no mês,", "what: 'Ganho no mês,")
s = s.replace("note: 'Separa recebido de fechado.", "note: 'Conta contrato ganho, não caixa.")
wr(f, s)

# ---------- Landing web ----------
f = 'Landing.dc.html'; L = rd(f).split('\n')
assert 'Mais barato que um almoço. Faz mais que um CRM.' in L[53]; del L[53]
s = '\n'.join(L)
s = sub(s, 'A Dalva acha as empresas, com o decisor e o motivo para a conversa.', 'A Dalva acha as empresas, com o sócio responsável e o motivo para a conversa.', f=f)
s = sub(s, 'Próximo passo com data. Quando a conversa esfria, a Dalva avisa antes de o negócio morrer.', 'Ela prepara e põe na ordem; você manda. Próximo passo com data, e um aviso antes de a conversa esfriar.', f=f)
s = s.replace('decisor: Carla', 'sócia: Carla')
s = sub(s, '>Sem cartão de crédito<', '>Sem cartão, sem cobrança no fim<', f=f)
s = sub(s, '>Busca de empresas sem limite<', '>Busca de empresas sem limite, toda noite<', f=f)
s = sub(s, '>Mensagem sugerida no seu tom<', '>50 créditos por mês para enriquecer contatos<', f=f)
s = sub(s, 'Contato de decisor só aparece quando a Dalva encontra, e sempre com a fonte ao lado.', 'O sócio vem do cadastro oficial. Contato e sinais vêm da web, só quando a Dalva encontra, e sempre com a fonte e a data ao lado.', f=f)
wr(f, s)

f = 'LandingMobile.dc.html'; s = rd(f)
s = sub(s, 'Empresas no seu perfil, com decisor e fonte do dado.', 'Empresas no seu perfil, com o sócio e a fonte do dado.', f=f)
s = sub(s, 'Três ações por dia, na ordem, com o motivo.', 'Ela prepara e põe na ordem. Você manda.', f=f)
s = s.replace('decisor: Carla', 'sócia: Carla')
s = sub(s, '>Empresas sem limite<', '>Busca sem limite, toda noite<', f=f)
s = sub(s, '>Mensagem no seu tom<', '>50 créditos/mês para enriquecer<', f=f)
wr(f, s)

f = 'Waitlist.dc.html'; s = rd(f); s = s.replace('decisor: Carla', 'sócia: Carla'); wr(f, s)
print('ok')
