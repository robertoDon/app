# Dalva · Business plan

**Verdict: Profitable**

- ✓ Each cliente-mês earns $16.90 before fixed costs (85% contribution).
- ✓ Year 1 operating profit: $21,289.
- ✓ Break-even is 1 cliente-mêss a day against a capacity of 1000.
- ✓ 43 of 100 simulated buyers buy (43%, the bar is 25%).

| key number | |
| --- | ---: |
| Price | $19.90 a cliente-mês |
| Profit margin at plan | 79% per cliente-mês |
| Break-even | 1 cliente-mêss a day |
| Year 1 operating profit | $21,289 |
| Startup spend | $2,515 |
| Cash needed before it pays for itself | $2,693 |
| Startup money earned back | month 6 |
| Buyer panel | 43 buy · 57 pass |

## The idea

- What it is: assistente comercial web (PWA) que acha empresas para vender (Caçada), organiza as vendas (Pipeline) e diz as 3 prioridades do dia (Hoje). Slogan: "Prospecção que acontece enquanto você dorme."
- Who it is for: pequenas empresas de tecnologia (startups) de 1 a 10 pessoas no Brasil, onde o fundador vende, administra e entrega ao mesmo tempo.
- What it sells, at what price: assinatura. Teste grátis de 7 dias sem cartão; Dalva R$ 19,90/mês (ou R$ 200/ano); Dalva Time R$ 59,90/mês até 5 pessoas.
- Where and how: online, Brasil. Venda aberta por anúncio no celular, sem vendedor e sem demo (viu o anúncio, entendeu em 5 segundos, assinou no celular). Entrega: web responsiva instalável (PWA), push e e-mail com resumo da manhã.
- Budget and constraints: não informado. Stack: React + Vite, Supabase, Cloudflare (a mesma do produto Plandon). Marca "um produto Don". Cronograma: teste fechado nov/2026 (15 fundadores), beta pago jan/2027, abertura mar/2027, integrações (agenda, e-mail, WhatsApp) jun/2027.

### Módulos do MVP
1. Hoje: 3 prioridades com o porquê, meta do mês, uma frase da Dalva.
2. Pipeline: Lead, Conversa, Proposta, Fechado; próximo passo com data, contatos, histórico, abordagem sugerida.
3. Caçada: descreve o cliente em uma frase e recebe empresas reais da base de CNPJ, com fonte e data; envia ao Pipeline. Custo em créditos; a primeira caçada é grátis.
4. Projetos: entregas, prazos e responsáveis; venda fechada vira projeto.
5. Grana: fechado no mês, em negociação, falta para a meta.

### Números já levantados (Viabilidade, pesquisa de 26/10/2026, estimativas)
- Margem por cliente: Dalva 76–91% (sobe com escala); Time 65–85% no pior caso; custo de um teste grátis R$ 0,33–0,89.
- Premissas: Supabase Pro, hospedagem US$ 20/mês, Claude Haiku com 100 enriquecimentos e 20 buscas na web por pessoa/mês, gateway Asaas, dólar R$ 5,10. Fora da conta: impostos, chargeback, inadimplência, suporte, e-mail, domínio.
- Riscos já vistos: LGPD na Caçada (dado de CNPJ/MEI, precisa de legítimo interesse documentado e opt-out); conta fake abusando do teste sem cartão; Time só compensa a partir de 3 pessoas.

### Pontos em aberto
- Público: foi "startups tech de 1 a 5", depois "B2B de 1 a 10". Decisão do usuário: startups de tecnologia de 1 a 10 pessoas.
- Plano Time a R$ 59,90.
- Teste fechado em novembro ou oferta paga já a R$ 19,90.
- Projetos fica no produto mas sai da vitrine.

### Hipótese de diferencial (Roberto, fundador)
1. Visual e facilidade de adquirir
2. UI
3. Pacote completo, mesmo que pequeno, com o que as startups pequenas mais precisam
4. Preço

Como testar: preço e facilidade de adquirir (7 dias grátis, sem cartão) cabem no painel de compradores. Pacote completo cabe num terceiro pitch que mostre os 5 módulos como um conjunto. Visual e UI não cabem em texto: precisam de tela mostrada a pessoas reais.
Leitura do painel (menções espontâneas nas respostas, A e B): preço citado por 69 e 77 de 100, teste grátis sem cartão por 97 e 93, mas isso vem do próprio pitch. Visual ou interface: 10 e 6. Pacote completo: 1 e 2.

## Summary

**O que é:** assistente comercial por assinatura para startups de 1 a 10 pessoas no Brasil (Hoje, Pipeline, Caçada, Projetos, Grana). R$ 19,90 (1 pessoa) e R$ 59,90 (Time, até 5).

**Veredito calculado:** Profitable, mas só sobre custos estimados e sem custo de aquisição. Margem de contribuição 85% a R$ 19,90, ponto de equilíbrio perto de 20 pagantes, lucro operacional no ano 1 de R$ 21.289 (plano de 0,3 a 9 novos pagantes por dia). O veredito responde "a conta fecha", não "o mercado quer".

**Painel e conselho concordam:** vale testar, não vale construir tudo. Conselho: 3 votos "financie se", nota média 5,0. Painel: 43% (pitch A, Caçada) e 52% (pitch B, prioridades sobre leads que já chegam), mesmas 100 pessoas. Divergem em quem compra: B ganha de quem vende por indicação (45% contra 0%) e de startups maiores; A ganha de quem prospecta a frio (87% contra 60%). Quem usa CRM grátis fica em 35% nos dois.

**Maior risco:** Caçada não provada e LGPD; concorrente grátis (Agendor, RD Station, HubSpot) adicionando busca por CNPJ; custo de aquisição e retenção desconhecidos.

**Hipótese do fundador (visual/UI, fácil de adquirir, pacote completo, preço):** preço e teste grátis sem cartão aparecem muito (69 a 77 e 93 a 97 em 100), mas o pitch já os traz. Visual/UI (10 e 6) e pacote completo (1 e 2) quase não apareceram e não dá para validar em texto: precisam de tela mostrada a pessoas reais e de um pitch C.

**Para começar:** quase nada de caixa (R$ 2.700 de cobertura até o mês 5 no modelo), mais o trabalho do fundador.

**Esta semana:** fechar a lista de 15 fundadores reais, montar a versão mínima (Hoje + Pipeline + Caçada), a LGPD mínima e o teste fechado com cobrança de R$ 19,90.

Painel = compradores simulados; números = projeção. Clientes e cotações reais confirmam. Não é aconselhamento financeiro, jurídico ou fiscal.

## What the board said

**Votação:** 3 × FUND IF (Offers 5/10, Monopoly 4/10, Product 6/10). **Média: 5,0/10.**
Ninguém passou, ninguém financiou sem condições. Tudo depende de provas que ainda não existem.

### Riscos levantados por mais de um conselheiro (vêm primeiro)
1. **Caçada é o único motor possível de valor, e ainda não foi provada.** Product: se as empresas vierem velhas ou fora do perfil, a promessa quebra no primeiro uso. Monopoly: é a única candidata a vantagem, mas depende de dado público e de modelo de terceiros. Offers: a promessa "prospecção enquanto você dorme" não tem caso nem número que a sustente.
2. **LGPD na Caçada** (CNPJ/MEI): os três citam. Sem legítimo interesse documentado e opt-out, pode barrar a entrega central.
3. **Mercado e preço desconhecidos.** Tamanho do público (startups tech de 1 a 10 pessoas), o que já pagam, CAC e conversão do anúncio estão em aberto. Com R$ 19,90 e sem escala nem efeito de rede, há risco de commodity e guerra de preço.
4. **Escopo maior que o foco.** Pipeline, Hoje e Grana são CRM comum e copiáveis em meses. Product sugere reduzir a vitrine a Hoje + Caçada + Pipeline mínimo.
5. **Conta fake no teste sem cartão** ameaça margem e núcleo da oferta.

### Condições (checklist para o resto do pacote)
- [ ] Teste fechado (nov/2026, 15 fundadores): definir **antes** uma meta de prova, por exemplo pelo menos 5 com conversa real vinda da Caçada, registrada em número ou depoimento. Mostrar que a Caçada, e não o Pipeline, é o motivo de uso e retenção. → `/founder-launch`
- [ ] Taxa de acerto da primeira caçada grátis: quantos leads úteis, quantos o usuário contata. → teste real; `/founder-consumer` aponta o que esperar
- [ ] Tamanho do nicho e concorrentes antes de gastar com anúncio. → `/founder-competitors`
- [ ] Disposição de pagar acima de R$ 19,90 e a rejeição do Time a R$ 59,90. → `/founder-consumer`, `/founder-pricing`
- [ ] CAC por anúncio abaixo de um teto definido, payback curto, impostos e inadimplência na margem. → `/founder-cfo`
- [ ] Garantia que o CFO confirme que é pagável, e nome claro da oferta. → `/founder-offer`
- [ ] Legítimo interesse e opt-out da LGPD documentados antes do beta pago (advogado).
- [ ] Trava contra contas falsas no teste (limite por CNPJ ou celular).
- [ ] Reduzir vitrine e onboarding aos módulos essenciais.
- [ ] Um ativo que se acumula com o uso (histórico, dados de resultado de abordagem) que vire barreira.

### Onde discordam
- **Nota:** Product 6, Offers 5, Monopoly 4. Product vê foco e clareza; Monopoly vê falta de barreira.
- **Preço:** Offers pergunta por que não cobrar R$ 49 ou mais; Monopoly teme que R$ 19,90 já exija volume que o CAC não paga.
- **O que cortar:** Product corta Projetos e Grana; Offers diz que eles não ajudam a prospectar, mas não pede o corte.

### A versão mais forte do negócio
Um produto de duas coisas: achar empresas que valem a conversa (Caçada) e dizer o que fazer hoje com elas (Hoje), com um Pipeline mínimo. Projetos e Grana ficam em segundo plano. A oferta ganha uma promessa mensurável ("X conversas em 30 dias"), garantia que o CFO confirme e a prova do teste fechado como base de marketing. Isso é mais estreito que o artefato atual, que mostra cinco módulos.

*Os conselheiros aplicam frameworks publicados e não falam como seus autores. Os números citados vêm da aba Viabilidade, que são estimativas.*

## The competition

Pesquisa feita em 27/10/2026, só com fontes públicas. Mercado: Brasil, prospecção e CRM leve para startups de tecnologia de 1 a 10 pessoas. Produto comparado: Dalva a R$ 19,90/mês (Caçada por CNPJ + Pipeline + Hoje). Dólar a R$ 5,10, taxa usada no `idea.md` e **não verificada**. Os dados completos estão em `competitors.csv`.

**Fontes que não abriram:** site da Econodata (403), Casa dos Dados (403), CNPJá (429), páginas de preço do Agendor e do RD Station com URL antiga (404, usei as URLs novas), Ploomes e Kommo só parcialmente (ver fim da seção 1). Não afirmo nada sobre Casa dos Dados e CNPJá além de que não consegui ler.

### 1. Tabela (do mais direto ao menos direto)

| Concorrente | Tipo | Preço comparável | O que vende | Posicionamento (cópia) | Nota |
| --- | --- | --- | --- | --- | --- |
| [Speedio](https://www.speedio.com.br/) | Direto | R$ 719/mês (300 empresas, 1 usuário) a R$ 1.379/mês (1.000 empresas) | Listas B2B com decisores e contatos validados | "Escale suas vendas B2B com leads qualificados e validados" | 4,8 (939) [B2B Stack](https://www.b2bstack.com.br/product/speedio/avaliacoes) |
| [Econodata](https://www.b2bstack.com.br/product/econodata) | Direto | Sob consulta | Base de empresas, filtros, listas | "Alcance seu público-alvo com precisão!" | 4,7 (989) |
| [EmpresAqui](https://empresaqui.com.br/) | Direto | Plus 12x R$ 199,90 (resultado de busca, [página do plano](https://www.empresaqui.com.br/plano-mensal); não confirmado) | Dados e prospecção B2B, IA, API | "uma plataforma brasileira de dados empresariais e prospecção B2B" | sem nota |
| [MonitorCNPJ](https://monitorcnpj.com.br/buscador-de-leads/) | Direto | Grátis 20/dia; R$ 99,90 por 500 consultas (único) | Lista de empresas por CNAE/UF/porte | "Monte sua lista de empresas por filtro" | sem nota |
| [Agendor](https://www.agendor.com.br/planos-precos/crm) | CRM leve | Grátis até 3 usuários; Pro R$ 59/usuário | Funil, contatos, tarefas | "O CRM mais bem avaliado do Brasil, do plano grátis ao corporativo" | 4,8 (271) [B2B Stack](https://www.b2bstack.com.br/product/agendor/avaliacoes) |
| [RD Station CRM](https://www.rdstation.com/planos/crm/) | CRM leve | Free até 4 usuários; Basic R$ 73/usuário | Funil, WhatsApp, e-mail | "Seu processo de vendas organizado e escalável" | 4,5 (2.548) [B2B Stack](https://www.b2bstack.com.br/product/rd-station-crm/avaliacoes) |
| [Pipedrive](https://www.pipedrive.com/pt-br/pricing) | CRM global | Lite US$ 14 (~R$ 71) no anual | Funil visual | sem slogan capturado | sem nota |
| [HubSpot CRM](https://www.hubspot.com/pricing/crm?products=sales-hub&currency=BRL) | CRM global | Free até 2 usuários; Starter "a partir de US$ 7" (~R$ 36) | CRM gratuito com upgrade | sem slogan capturado | sem nota |
| [Apollo.io](https://www.apollo.io/pricing) | Dados globais | Free; Basic ~US$ 49 (~R$ 250), valor de [terceiro](https://www.zeliq.com/blog/apolloio-pricing) | Contatos e sequências | "The most loved sales platform on the planet" | sem nota |
| [Sales Navigator](https://business.linkedin.com/br/pt/sell/sales-navigator/compare-plans) | Substituto | US$ 119,99/mês (~R$ 612) | Busca de leads no LinkedIn | "Encontre leads, economize tempo e feche negócios maiores" | sem nota |
| [Planilha/Notion](https://www.notion.com/pt/templates/category/crm) | Substituto | Modelos gratuitos | Montar o CRM à mão | "Modelos para CRM" | n/a |
| [SDR terceirizado](https://lessie.ai/pt/blog/sdr-agency) | Substituto | US$ 5.000 a 15.000/mês, referência não brasileira | Prospecção feita por pessoas | n/a | n/a |

Também olhados, fora da tabela: [Ploomes](https://www.ploomes.com/precos) (Básico R$ 79/usuário/mês; Avançado R$ 269, mínimo 4 usuários; para equipes maiores) e [Kommo](https://www.kommo.com/br/blog/kommo-precos/) (US$ 20/usuário/mês, ~R$ 102, mínimo de 6 meses segundo o FAQ do próprio blog). Lusha ([US$ 37,45/mês no anual](https://www.lusha.com/pricing/), ~R$ 191) é outro exemplo de dados globais. Não vi nenhuma dessas três como mais próxima da Dalva que as linhas acima. WhatsApp puro e planilha solta são o substituto mais comum, mas não achei fonte pública que o quantifique.

### 2. Faixa de preço (por mês, item mais próximo)

- **Menor:** R$ 0 (Agendor, RD Station, HubSpot, Apollo, Notion/planilha, MonitorCNPJ 20/dia).
- **Mediana dos pagos comparáveis:** cerca de R$ 100 (9 valores: HubSpot ~36, Agendor 59, Pipedrive ~71, RD 73, MonitorCNPJ 99,90 único, EmpresAqui ~167 a 200, Apollo ~250, Sales Navigator ~612, Speedio 719). Mediana é uma ordem de grandeza, pois mistura por usuário, por lista e conversão de dólar.
- **Maior:** agência de SDR, ~R$ 25 mil+ (referência estrangeira). Entre ferramentas, Speedio R$ 1.379.
- **Dalva a R$ 19,90** fica abaixo de qualquer opção paga encontrada. Só ficam abaixo dela os planos gratuitos, que têm limites.

### 3. Mapa de posicionamento (texto)

Eixos: **preço** (baixo a alto) e **cobertura do fluxo** (só CRM, só lista, lista + CRM).

- Preço baixo, só CRM: Agendor Free/Pro, RD Free/Basic, HubSpot Free, Pipedrive Lite, Notion.
- Preço baixo/único, só lista: MonitorCNPJ.
- Preço médio, só lista/contatos: EmpresAqui, Apollo, Sales Navigator.
- Preço alto, só lista: Speedio, Econodata (sob consulta).
- Lista + CRM no mesmo produto e abaixo de R$ 30: **nenhum encontrado**. É o ponto que a Dalva ocuparia. "Nenhum encontrado" vale para esta busca, não prova que não exista.

### 4. Reclamações (amostras pequenas, só a primeira página de avaliações; todas de nota alta, então não há 1 a 3 estrelas)

- **Dados desatualizados/incorretos (Econodata, 3 relatos na amostra de ~10):** "Alguns dados não batem ( telefone, endereço...." e "ALGUNS CONTATOS QUE NÃO EXISTEM QUE PODERIAM SER ATUALIZADOS" ([fonte](https://www.b2bstack.com.br/product/econodata/avaliacoes)).
- **Falta integração com CRM (Speedio, 5 de 10):** "Conectar com CRMs externos agregaria valor, centralizando dados e facilitando o fluxo..." ([fonte](https://www.b2bstack.com.br/product/speedio/avaliacoes)).
- **Dados menos completos em nichos (Speedio, 3 de 10):** "Em segmentos específicos, os dados poderiam ser mais completos e atualizados." (mesma fonte).
- **Preço para pequena empresa (Agendor, 1 relato, fina):** "preço poderia ser mais adequado a realidade das pequenas empresas." ([fonte](https://www.b2bstack.com.br/product/agendor/avaliacoes)).
- **Interface fragmentada (Agendor, 1, fina):** "Muitas sessões separadas, poderia ser mais simples e integrado."
- **Relatórios e duplicatas (RD Station, 2, fina):** "quando há mais de um contato por empresa, gera duplicata" ([fonte](https://www.b2bstack.com.br/product/rd-station-crm/avaliacoes)).
- **Limite de consultas grátis e falta de plano individual (Econodata, 1, fina):** "Número restrito de consultas grátis".

### 5. A lacuna

**Existe, mas é estreita e frágil.**

- Os CRMs leves já resolvem o funil de graça (Agendor até 3 usuários, RD Station até 4, HubSpot até 2). Pipeline sozinho **não é** lacuna; cobrar por ele seria difícil.
- As ferramentas de lista são caras (Speedio R$ 719+) ou só entregam planilha (MonitorCNPJ R$ 99,90 por 500, sem pipeline). Nelas a queixa recorrente é falta de conexão com CRM e dados velhos.
- Quem quer lista + funil hoje costura duas ferramentas, e o fundador de 1 a 10 pessoas teria de montar sozinho. A Dalva junta busca por CNPJ, funil e "3 prioridades do dia" por R$ 19,90.
- Não achei, nesta busca, produto que fale com startups de tecnologia especificamente. Isso é ausência de evidência, não prova.
- **Limites da lacuna:** o preço R$ 19,90 só pesa se o comprador não aceitar o grátis (Agendor/RD) + MonitorCNPJ avulso. A base de CNPJ é pública, então o dado em si não é diferencial; a qualidade do contato (telefone, e-mail) é onde Econodata e Speedio são criticados e onde a Dalva ainda não provou nada. Não verifiquei se a Dalva entrega contato melhor.

### 6. A ameaça

**Principal:** Agendor ou RD Station CRM acrescentarem busca de empresas por CNPJ e priorização por IA dentro do plano gratuito. Já têm base de usuários, marca, funil gratuito e nota alta (4,8 e 4,5), e o gratuito é exatamente a alternativa à Dalva. Não encontrei anúncio desse movimento; é risco inferido, não fato.

**Segunda:** Speedio ou Econodata lançarem plano barato com CRM embutido. Têm os dados; a reclamação sobre integração com CRM mostra a demanda. Terceira: MonitorCNPJ (R$ 99,90 único) ensinando o comprador a pagar quase nada por lista.

Próximos passos: `/founder-consumer` usa as reclamações; `/founder-pricing` usa a faixa de preço acima.

## The buyer panel

**43 buy · 57 pass** (43% buy) out of 100 simulated buyers. Seed 7, so the same cards can be dealt again.

These are simulated buyers, not customers. Use this to find objections and weak spots, then confirm the big ones with real people before you spend.

### By segment

| group | buyers | buy rate |
| --- | ---: | ---: |
| Startup de 3 a 5 pessoas, já vende para alguns clientes | 40 | 52% |
| Startup de 6 a 10 pessoas, com alguém que faz vendas junto com outras funções | 20 | 40% |
| Fundador solo ou dupla (1 a 2 pessoas), ainda sem receita recorrente | 40 | 35% |

### By buying behaviour

| group | buyers | buy rate |
| --- | ---: | ---: |
| Curioso por IA | 10 | 90% |
| Prospecta a frio | 15 | 87% |
| Planilha e WhatsApp | 20 | 65% |
| Já usa CRM gratuito | 20 | 35% |
| Cético com ferramentas novas | 15 | 7% |
| Vende por indicação | 20 | 0% |

### By income

| group | buyers | buy rate |
| --- | ---: | ---: |
| $83,000 to $201,000 | 33 | 52% |
| $201,000 and up | 34 | 44% |
| under $83,000 | 33 | 33% |

### Why they pass

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 31 | "Nenhum. Até testaria os 7 dias porque é grátis e sem cartão, mas meus clientes vêm de indicação e eu não tenho tempo de abordar empresa nenhuma, então uma lista de CNPJ ia ficar parada e eu cancelaria antes de pagar." (P002) · "Nenhum plano. Eu até testaria os 7 dias grátis, já que não pede cartão, mas meu gargalo não é achar empresa, é ter tempo de abordar. Uma lista melhor só me dá mais gente que eu não vou conseguir contatar, então não vejo motivo para pagar nem os R$ 19,90." (P007) |
| habit | 15 | "Nenhum plano. Eu até testaria os 7 dias grátis por curiosidade com a busca de CNPJ, mas já organizo tudo no HubSpot grátis, na planilha e no LinkedIn, e ainda sem receita não vou colocar mais uma assinatura no cartão para algo que já faço de graça." (P001) · "Nenhum plano. Talvez eu até teste os 7 dias porque não pede cartão, mas meu pipeline já vive na planilha/Notion e a prospecção eu faço no LinkedIn; não vejo motivo para migrar tudo para mais um app, e o preço não é o problema." (P003) |
| trust | 7 | "Nenhum plano por enquanto. Eu até testaria os 7 dias grátis pra ver a busca na base de CNPJ, mas meu pipeline já está no HubSpot grátis e não vou mudar meus dados de lugar pra uma marca que acabou de aparecer num anúncio." (P027) · "Nenhum plano por enquanto. Talvez eu faça a busca grátis de CNPJ por curiosidade, mas não vou tirar meu pipeline do Notion e colocar dados de clientes numa marca que ninguém que eu sigo no LinkedIn ou no X comentou ainda; o preço não é o problema, a confiança é." (P031) |
| timing | 4 | "Nenhum plano. Até testo os 7 dias grátis porque não pede cartão, mas meu gargalo não é achar empresa, é ter tempo de abordar: faço demo e proposta de noite e uma lista a mais só vira mais uma coisa que eu não uso e cancelo." (P012) · "Nenhum plano. Eu até testaria de graça os 7 dias, mas mesmo com lista de empresas eu não teria tempo de abordar ninguém, e meu pipeline já vive na planilha e no WhatsApp. R$ 19,90 não pesa, mas pagar por algo que eu não ia usar é só mais uma assinatura esquecida." (P081) |

### Why they buy

| reason | buyers | in their words |
| --- | ---: | --- |
| need | 40 | "Assinaria o Dalva individual, R$ 19,90, para quem faz vendas aqui testar: o teste é grátis sem cartão e a busca na base de CNPJ com fonte pode poupar horas de garimpo no LinkedIn. O Time só depois de ver se alguém realmente abre o app toda manhã, porque o resto da equipe vive na planilha e no WhatsApp." (P004) · "Eu testaria os 7 dias com certeza, e se a busca por CNPJ me trouxer empresas que batem com o meu cliente ideal, assino o Dalva de R$ 19,90 só pra mim, porque quem vende aqui sou eu. O Dalva Time não faz sentido agora: o resto do time entrega, não prospecta." (P005) |
| price | 2 | "Assinaria o plano Dalva, o individual. R$ 19,90 é barato o bastante para testar sem dor, e os 7 dias grátis sem cartão e a primeira busca grátis me deixam ver se a base de CNPJ acha clientes que eu já não acharia na planilha e no LinkedIn. Se não provar valor na primeira semana, cancelo num toque." (P095) · "Assinaria a Dalva de R$ 19,90: perco tempo demais pesquisando empresa no LinkedIn e, por esse preço, o risco é quase zero, ainda mais com 7 dias grátis sem cartão. O Time só se eu ver que alguém do time realmente usa." (P097) |
| trust | 1 | "Assinaria o Dalva de R$ 19,90, só se a primeira busca grátis me mostrar empresas que servem pro meu cliente. Por esse preço o risco é pequeno e eu testo sem cartão, mas o Dalva Time eu só olharia depois de uns meses." (P084) |

### What would flip a no

- Se no teste grátis a busca de CNPJ me trouxesse leads que eu não acharia no LinkedIn e pelo menos uma reunião marcada, eu pagaria os R$ 19,90 do plano individual.
- Se a Dalva me ajudasse a fazer a abordagem por mim, tipo já escrever e mandar a primeira mensagem ou organizar as indicações que eu recebo, aí os R$ 19,90 valeriam.
- Se na busca grátis ela me trouxesse empresas certeiras com o contato do decisor e importasse minha planilha atual sem eu ter que redigitar nada, eu assinaria o Dalva Time para o time todo.
- Se a Dalva já me entregasse a primeira mensagem escrita para cada empresa, pronta para eu mandar no LinkedIn ou WhatsApp com um toque, cortando o tempo de abordagem e não só o de pesquisa.
- Se a Dalva puxasse os leads e negócios do meu CRM atual (HubSpot ou Pipedrive) e me mandasse as prioridades de follow-up sem eu ter que trocar de ferramenta.
- Se a Dalva puxasse sozinha os contatos e conversas que já tenho (LinkedIn, WhatsApp, e-mail) e me lembrasse de forma confiável quem da minha rede e das indicações eu preciso responder ou retomar hoje, sem eu ter que digitar nada.
- Se a Dalva ajudasse a cuidar das indicações e dos contatos que eu já tenho, lembrando quem eu preciso acompanhar e quando, e deixasse claro como fica dentro da LGPD sem empurrar disparo frio.
- Se a Dalva também escrevesse e deixasse pronta a primeira mensagem para cada empresa, de um jeito que eu só revise e envie em poucos minutos à noite, e isso me rendesse uma reunião real ainda no período grátis.
- Se ela me ajudasse a puxar e acompanhar indicações da minha rede (lembrar de pedir indicação, avisar quem esfriou) e substituísse meu CRM grátis importando tudo dele.
- Se nos 7 dias grátis a Dalva me trouxesse empresas que realmente encaixam no meu cliente ideal, com o decisor e um motivo concreto para falar com ele agora, e isso me fizesse marcar pelo menos uma reunião, eu assinaria o plano individual.
- Se na busca grátis ou nos 7 dias a Dalva me trouxesse empresas que eu realmente consigo abordar e pelo menos uma virasse conversa de venda, eu assinaria o plano Dalva de R$ 19,90.
- Se ela ajudasse a trabalhar indicações e a acompanhar a rede que eu já tenho (lembrar de quem pedir indicação, quando fazer follow-up), com exportação fácil dos dados caso a empresa feche.

Buyers say they would buy **1.0 times** in the first month on average.

100 buyers gave all four price answers. Run founder-pricing's van_westendorp.py on the answers folder.

## Pricing

Valores em R$ (a ferramenta imprime "$"). Painéis simulados: servem para escolher o que testar, não são prova.

### O que os compradores disseram

| ponto | Painel A (Caçada) | Painel B (priorizar leads) |
| --- | ---: | ---: |
| PMC (abaixo disso, "barato demais") | 10,88 | 8,36 |
| OPP (menor resistência) | 15,78 | 8,36 |
| IPP (barganha = caro) | 29,87 | 20,36 |
| PME (acima disso, não compra) | 78,60 | 59,72 |

Medianas A: barato demais 5, barganha 15, ficando caro 49, caro demais 99. B: 5 / 15 / 40 / 90.
R$ 19,90 e R$ 59,90 estão dentro da faixa aceitável nos dois painéis. R$ 59,90 fica perto do teto no B (PME 59,72) e só o plano Time o usa.

### Concorrentes (founder/competitors.md)

CRMs grátis a R$ 0 (Agendor, RD Station CRM, HubSpot, Apollo, Notion); MonitorCNPJ R$ 99,90 por 500 empresas; Speedio R$ 719 a 1.379 por mês; Econodata sob consulta. Contra os caros, R$ 19,90 é um diferencial claro. Contra os grátis, preço não diferencia: quem usa CRM grátis comprou 35% nos dois painéis.

### Margem (founder/cfo.md, custos estimados)

| preço | contribuição por cliente-mês | margem |
| --- | ---: | ---: |
| R$ 19,90 | 16,90 | 85% |
| R$ 29,90 | 26,90 | 90% |
| R$ 59,90 | 56,90 | 95% |

Custo variável estimado R$ 3,00 (gateway 1,20, IA 1,20, banco/hospedagem 0,60). Fixo R$ 330 por mês: ponto de equilíbrio perto de 20 clientes pagantes.

### Recomendação

1. **Preço:** manter R$ 19,90 (Dalva) e R$ 59,90 (Dalva Time) como as duas opções. Os dois cabem na faixa e a margem aguenta qualquer um. O ponto de indiferença (IPP, R$ 20 a 30) sugere folga acima de 19,90, mas o painel é teto otimista e o Time quase não foi escolhido (0 no A, 6 no B).
2. **Escada:** Dalva R$ 19,90 (1 pessoa) → Dalva Time R$ 59,90 (até 5). O degrau só se paga a partir de 3 pessoas (3 x 19,90 = 59,70). Hoje não há razão forte para subir um solo; vale testar um meio-termo a R$ 29,90 para 2 a 3 pessoas.
3. **Oferta de abertura:** 7 dias grátis sem cartão (já no pitch, o ponto mais citado, 97 e 93 em 100) e primeira caçada grátis. Evitar desconto de lançamento: o preço já é baixo e não deve ensinar a esperar promoção. Condição de segurança: limitar contas falsas no teste (e-mail verificado e limite de créditos).
4. **Testar com pessoas reais:** duas páginas de venda ou pré-venda, uma com R$ 19,90 e outra com R$ 29,90 para o plano individual, 15 fundadores cada. Medir cartão colocado depois do teste, não "interesse".
5. **Objeções de preço:** quase ninguém recusou por preço. As recusas foram necessidade, hábito e confiança (ver panel-comparison.md). Marketing deve responder "já uso CRM grátis" e "não confio em dar meus leads", não preço.

### Alerta de honestidade

R$ 19,90 sozinho não é diferencial contra CRM grátis. A margem é alta porque o custo variável é estimado e não inclui impostos, chargeback, inadimplência, suporte nem o trabalho do fundador. O risco real é aquisição (CAC) e retenção, não infraestrutura.

## The numbers

Every number below comes from the input file. Nothing is looked up or guessed.

### One cliente-mês

| line | per cliente-mês |
| --- | ---: |
| Price | $19.90 |
| Gateway Asaas (estimativa, mix Pix/cartão) | -$1.20 |
| IA Claude Haiku: enriquecimentos e buscas (idea.md, estimativa) | -$1.20 |
| Banco e hospedagem rateados por cliente (estimativa) | -$0.60 |
| **Contribution** (what each cliente-mês leaves to pay the fixed costs) | **$16.90** (85%) |

### The margin that matters

Fixed costs: $330 a month (Supabase Pro (US$25 a R$5,10) $128, Hospedagem (US$20 a R$5,10) $102, Domínio, e-mail, ferramentas (estimativa) $100).

- **Break-even: 1 cliente-mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (10 a day): **79%** of every sale, after every cost.
- Capacity: 1000 a day.

### Year 1, month by month

| month | cliente-mêss a day | revenue | profit | cumulative (after $2,515 startup) |
| ---: | ---: | ---: | ---: | ---: |
| 1 | 0 | $179 | -$178 | -$2,693 |
| 2 | 1 | $418 | $25 | -$2,668 |
| 3 | 1 | $716 | $278 | -$2,390 |
| 4 | 2 | $1,075 | $583 | -$1,807 |
| 5 | 2 | $1,492 | $938 | -$870 |
| 6 | 3 | $1,970 | $1,343 | $474 |
| 7 | 4 | $2,507 | $1,799 | $2,273 |
| 8 | 5 | $3,104 | $2,306 | $4,579 |
| 9 | 6 | $3,701 | $2,813 | $7,393 |
| 10 | 7 | $4,298 | $3,320 | $10,713 |
| 11 | 8 | $4,895 | $3,827 | $14,541 |
| 12 | 9 | $5,373 | $4,233 | $18,774 |

- **Year 1 operating profit: $21,289** on $29,731 of revenue.
- After the $2,515 startup spend: $18,774.
- Startup money earned back: month 6.
- Cash you need before it pays for itself: **$2,693**.

### What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 79% | 1 | $21,289 |
| Price -10% | 77% | 1 | $18,316 |
| Volume -20% | 78% | 1 | $16,239 |
| Unit costs +15% | 77% | 1 | $20,616 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.

---

### Leitura do Dalva (nota do analista)

- A ferramenta imprime "$", mas os valores são R$. "cliente-mês por dia" = novos pagantes médios por dia x 30. O plano de 10/dia equivale a ~300 clientes pagantes no mês 12; a rampa 0,3 a 9/dia é uma hipótese conservadora frente aos 43% a 52% do painel (que é teto, não previsão).
- Ponto de equilíbrio real: R$ 330 de fixo ÷ R$ 16,90 de contribuição = ~20 clientes pagantes.
- Custos variáveis e fixos são estimativas a partir do idea.md (Viabilidade). Fora da conta: impostos, chargeback, inadimplência, suporte, aquisição e o trabalho do fundador.
- Margem a R$ 59,90: 95%; a R$ 29,90: 90%.
- O que decide a viabilidade não está nessa conta: custo de aquisição, retenção e LGPD.

## Marketing

Base: painéis A e B, competitors.md, pricing.md, cfo.md. Painéis simulados são teto, não previsão.

### Quem compra mais (primeira audiência)

- Startups de 3 a 5 pessoas (52% no A, 60% no B) e de 6 a 10 (40% e 55%).
- Quem controla leads em planilha e WhatsApp (65% e 75%) e os curiosos por IA (80% no B).
- Quem prospecta a frio compra a Caçada (87% no A). Quem vende por indicação só compra a versão de prioridades (0% no A, 45% no B).
- Fora de alcance por ora: quem já usa CRM grátis (35% nos dois) e céticos (7% e 27%).

### Posicionamento (3 versões; recomendo a 1)

1. Para startups de 1 a 10 pessoas que perdem lead e proposta esfriando em planilha e WhatsApp, a Dalva é o assistente comercial de R$ 19,90 que diz, toda manhã, quem responder primeiro e já deixa a mensagem pronta, ao contrário de um CRM que só guarda dados.
2. Para quem prospecta a frio: a Dalva acha empresas reais na base de CNPJ, com fonte e data, e as coloca no seu pipeline, ao contrário de listas de R$ 719 por mês.
3. Para fundadores sem tempo: um pacote pequeno e completo (Hoje, Pipeline, Caçada, Projetos, Grana) por menos que um almoço.

Recomendada: a 1, porque B converteu mais (52% contra 43%) e cobre indicação e cold juntos; a 2 vira o gancho de Caçada para quem prospecta a frio. A 3 só vale depois de testar "pacote completo" num pitch C (hipótese do Roberto, ainda sem evidência: citado por 1 e 2 em 100).

### Canais (começar com 2 ou 3)

| canal | por que serve | custo | como saber que funcionou |
| --- | --- | --- | --- |
| LinkedIn (posts do fundador, mostrando a tela) | onde fundadores de startup estão; mostra o visual/UI | tempo | cadastros no teste de 7 dias |
| Comunidades de startups (WhatsApp, Slack, Discord, aceleradoras) | confiança por indicação | tempo | cadastros por comunidade |
| Teste fechado com 15 fundadores (contato direto) | valida o que o painel só simula | tempo | 5 pagam depois do teste |

Fora por enquanto: anúncio pago e Google Ads (CAC desconhecido, sem página de venda validada), influenciadores.

### Dez ganchos (cada um responde a uma objeção ou razão do painel)

1. "Lead esfriando? Todo dia 8h a Dalva diz quem responder primeiro." (razão: conveniência)
2. "Mensagem de follow-up já pronta. Você só aperta enviar." (razão: tempo)
3. "R$ 19,90, menos que um almoço, 7 dias grátis, sem cartão." (razão: preço; usar o que o pitch já diz)
4. "Seus dados saem quando você quiser: exporte tudo em CSV." (objeção: confiança/dados)
5. "Já usa HubSpot grátis? A Dalva diz o que fazer hoje, o HubSpot só guarda." (objeção: hábito)
6. "Descreva seu cliente em uma frase e receba empresas reais do CNPJ, com fonte e data." (Caçada)
7. "Primeira busca grátis. Se a lista não servir, você não paga nada." (risco)
8. "Cancela em um toque." (objeção: assinatura que não uso)
9. "Feita para 1 a 10 pessoas. Sem treinamento de 3 semanas." (objeção: ferramenta pesada)
10. "Tudo que a startup pequena precisa, nada que sobra: Hoje, Pipeline, Caçada, Projetos e Grana." (hipótese de pacote, a testar)

Citações do painel são pesquisa. Não usar como depoimento. Sem depoimentos falsos.

### Oferta de abertura

7 dias grátis sem cartão e primeira Caçada grátis (já no pitch). Sem desconto de lançamento. Contas falsas: e-mail verificado e limite de créditos no teste.

### Orçamento e CAC

Contribuição de R$ 16,90 por mês por cliente. Com retenção de 6 meses (hipótese, não medida), vida ~R$ 100; CAC máximo razoável ~R$ 35 a 50. Orçamento inicial pequeno (R$ 1.500 no CFO), gasto só depois de 5 pagantes reais no teste fechado.

### Três números por semana

1. Cadastros no teste de 7 dias.
2. % que pede cartão depois do teste (o painel disse 43% a 52%; trabalhar com uma fração disso).
3. Cancelamentos no primeiro mês. Mudar algo se menos de 5 de 15 pagarem.

## Launch plan

### Passo 1: testar antes de gastar

Teste fechado em novembro com 15 fundadores reais de startups de 1 a 10 pessoas (o público definido), sem anúncio. Oferta paga real a R$ 19,90 depois dos 7 dias grátis, cobrança por Asaas.

Linha de sucesso, escrita antes de rodar: 5 dos 15 colocam cartão ou Pix depois do teste (33%), contra o teto de 43% a 52% do painel. Se menos de 3 pagarem, voltar para /founder-offer e /founder-pricing e rever o pitch (A, B ou C) antes de qualquer gasto.

Variantes do teste: metade vê o pitch A (Caçada), metade o B (prioridades). Segunda metade do teste: R$ 19,90 contra R$ 29,90 no plano individual.

Pendente de confirmar: data de lançamento alvo, quem executa cada tarefa (fundador), jurídico/LGPD (ver idea.md). Não há founder/ops.md nem brand.md: ops e marca foram pulados por escolha.

### Passo 2: contagem regressiva (datas a confirmar)

| semana | tarefa | dono | caminho crítico |
| --- | --- | --- | --- |
| 1 | LGPD mínima: política, base legal, aviso de fonte pública, exportar e apagar dados | fundador + advogado | sim |
| 1 | Conta Asaas, cobrança de teste, e-mail verificado e limite de créditos | fundador | sim |
| 2 | Módulos Hoje, Pipeline e Caçada mínimos no ar; PWA instalável | fundador | sim |
| 2 | Recrutar 15 fundadores (LinkedIn, comunidades) | fundador | não |
| 3 | Teste fechado, dia 7 e dia 14 | fundador | sim |
| 4 | Revisão: pagaram? Decidir abrir ou parar | fundador | sim |

### Passo 3: dia do lançamento (só se a revisão passar)

Publicar a página com preço, 7 dias grátis e a primeira Caçada grátis. Post do fundador no LinkedIn mostrando a tela; avisar as comunidades. Se algo quebrar: pausar cadastros, avisar por e-mail, não cobrar.

### Passo 4: primeiros 30 dias

Revisões nos dias 7, 14 e 30. Medir: cadastros, % que paga depois do teste, uso do "Hoje" por manhã, cancelamentos, custo de IA por conta. Mudar de rumo se menos de 5 de 15 pagarem ou se o uso cair depois do dia 3.

### Riscos para o dia

LGPD, contas falsas no teste, custo de IA por conta acima do estimado, concorrente grátis adicionando busca por CNPJ.

## Not done yet

- The offer: run /founder-offer
- Brand: run /founder-brand
- Operations: run /founder-ops

_The panel is simulated buyers and the numbers are projections from your inputs. Confirm demand with real customers and costs with real quotes before you spend. Not financial, legal or tax advice._
