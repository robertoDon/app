# Conferência manual: medição de 28/10/2026

Conferidas as 19 linhas com `achou_algo = sim`. As outras 31 ficaram como estavam.

## Placar

| Critério | Resultado |
|---|---|
| Empresa certa | **18/19** |
| Dados corretos | **13/19** |
| Por que agora serve | **0/19** |

Como conferi: abri o site de cada empresa (curl e WebFetch) e procurei CNPJ, endereço e telefone. Comparei com o cadastro da Receita (BrasilAPI) e abri as fontes que estavam acessíveis. O cnpja.com devolveu 429, e o econodata e o cylex devolveram 403. O Instagram não abre sem login, então não consegui confirmar nenhum post nem perfil por lá.

Só 3 das 19 linhas têm `por_que_agora` preenchido. As outras 16 têm o campo vazio e por isso receberam `n` no terceiro critério.

## Empresa por empresa (empresa certa / dados corretos / por que agora serve)

1. **Aethos Sistemas** (Criciúma): s / s / n. O endereço da Receita (Av. Santos Dumont, 1665) aparece no site, e o Instagram @aethosistemas tem link no site. O por que agora está vazio, mesmo com uma página "Trabalhe conosco" nas fontes.
2. **Lab of Codes** (Florianópolis): s / **n** / n. O telefone da Receita (48 4042-2777) e o sócio Rodrigo Bianchetti aparecem no site, que atende Brasil e Portugal, então a empresa é a certa. A notícia "CCGPL 2026 em Joinville" não foi confirmada: o post do Instagram não abre, e as buscas só acham o 7º CCGPL, de ago/2025 em Florianópolis. Pode existir, mas não deu para verificar (é uma dúvida, não uma prova de erro). O convênio com o CREA-SC é real (notícia de 18/05/2026), mas é um acordo de desconto para associados, então não serve de gancho comercial, e o texto é genérico ("sinais de atividade atual").
3. **SaveLivez** (Florianópolis): s / s / n. O endereço do site (SC 401, 4150) bate com a Receita. O por que agora está vazio, mas as fontes têm vaga de dev fullstack (jobleads) e página de vagas, que a IA não usou.
4. **ViuMeuPet** (Itapema): s / s / n. O CNPJ aparece no rodapé do site. O campo Instagram ficou vazio, embora @viumeupetoficial esteja no site (faltou, mas não está errado). O por que agora ("publica casos de pets com frequência") só descreve atividade de rotina, sem nenhum fato que sirva de gatilho. As datas dos posts não puderam ser conferidas.
5. **Socalculos** (Florianópolis): s / s / n. O telefone (48) 3338-3041 é o da Receita. Não traz nada além do cadastro.
6. **Kom Passio** (Florianópolis): s / **n** / n. O telefone "(48) 99999999" é o número fictício cadastrado na Receita, não um telefone de verdade.
7. **Bullcode** (Rio do Sul): s / s / n. O telefone é o da Receita: celular antigo de 8 dígitos, provavelmente desatualizado e possivelmente do sócio. Uma das fontes é uma página sobre o sócio pessoa física.
8. **Lermen Sys** (Blumenau): s / s / n. O telefone (47) 3037-1111 aparece na página de contato do site e na Receita.
9. **Pitfall Sistemas** (Lages): s / **n** / n. O CNPJ aparece no Diário Oficial dos municípios do RS (edição de 15/10/2026). O documento é um **termo aditivo de prorrogação** do contrato nº 098/2025 com São José do Ouro/RS, e não uma "contratação recente". A IA errou ao descrever o fato e montou o gancho ("demanda ativa") em cima desse erro.
10. **Digital Gurus** (Florianópolis): s / s / n. O telefone é o da Receita, celular antigo de 8 dígitos e provavelmente desatualizado.
11. **Growth Sales** (São José): s / s / n. O site mostra o CNPJ 37.036.494/0001-74 e o telefone (47) 2018-1728, o mesmo do CSV.
12. **Elevate Marketing** (Joinville): **n / n** / n. É homônima. O site agenciaelevatemarketingdigital.com fica em Barra Velha, usa um CNPJ de mentira ("00.000.000/0001-00"), um e-mail gmail e o telefone (47) 98895-2828. A empresa da Receita fica no Jardim Iririu, em Joinville, com sócia Yasmin Gonçalves e telefone (47) 9194-6329. O Instagram do CSV (@elevate.marketing.hq) não é o do site (@agenciaelevate) e não pôde ser aberto.
13. **Monkey Maker** (Ascurra): s (com dúvida) / **n** / n. O site monkeymaker.com.br é só uma listagem de diretório vazia ("Index of /"), sem nenhum conteúdo que ligue o domínio à empresa. As demais fontes são agregadores de CNPJ da empresa certa. Não serve como site.
14. **Option Assessoria** (Joinville): s / s / n. O rodapé do site traz a razão social, e o e-mail é do sócio Andson. O Instagram @optionassessoria aparece no site. O endereço do site é diferente do da Receita, mas na mesma cidade.
15. **Ao Quadrado** (Joinville): s / s / n. O site diz "Ao Quadrado Ltda, Joinville".
16. **Zuum Agência de Marketing** (Palhoça): s / **n** / n. O campo Instagram aponta para um reel da **CDL Palhoça** de maio/2024 apresentando a agência, não para o perfil da empresa. O telefone (48) 8414-1677 é o antigo da Receita; o site hoje mostra (48) 99174-1677.
17. **Lottelli Assessoria** (Timbó): s / s / n. O telefone é o da Receita. Uma das fontes (solutudo) lista a empresa em Blumenau.
18. **Commerce Sistemas** (Chapecó): s / s / n. O CNPJ e o endereço aparecem no rodapé do comnfe.com.br. No registro.br, o domínio está em nome de Cesar A. Bortolini, e o contato técnico é Camila Farias, que é sócia.
19. **Wyto Comunicação** (Jaraguá do Sul): s / s / n. As fontes falam de "Woop Comunicação Integrada", mas a página da ACIJS mostra a razão social WYTO COMUNICACAO LTDA, com o mesmo endereço e telefone. É a mesma empresa com outro nome fantasia.

## Padrões de erro

1. **O "por que agora" quase nunca sai, e quando sai é fraco ou errado (0/19).** Saiu em 3 de 19 linhas: uma lê errado um documento oficial (Pitfall: aditivo tratado como contratação nova), outra descreve atividade de rotina (ViuMeuPet) e a terceira é genérica, com um evento que não confirmei (Lab of Codes). Quando havia um sinal de verdade, como a vaga da SaveLivez, a IA não usou.
2. **Muito do "achado" é só o cadastro da Receita de volta.** Em 6 linhas o único dado é o telefone que já vem da Receita (Socalculos, Kom Passio, Bullcode, Digital Gurus, Lottelli e Wyto), e na Zuum e na Lermen o telefone também é o da Receita. Esses telefones costumam ser celulares antigos de 8 dígitos, placeholders (99999999) ou números desatualizados. As fontes são quase sempre agregadores de CNPJ (cnpj.biz, econodata, serasa, cnpja), então o "achou algo" infla a taxa de acerto sem trazer informação nova.
3. **Homônimos e links que não são da empresa.** Elevate é outra agência, de Barra Velha. O Instagram da Zuum é um post da CDL. O site da Monkey Maker é um diretório vazio. A IA aceita o primeiro resultado com o nome parecido sem conferir cidade, CNPJ ou telefone, embora o prompt peça isso.
