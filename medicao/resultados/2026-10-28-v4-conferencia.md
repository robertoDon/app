# Conferência manual: v4 de 28/10/2026

Conferidas as 13 linhas com algum campo preenchido (site, instagram, telefone_comercial, vaga_aberta, noticia_recente ou por_que_agora). Depois, uma checagem rápida de recall em 10 linhas vazias.

Como conferi: baixei os sites com curl (User-Agent identificado) e procurei CNPJ, telefone e Instagram no HTML. Comparei com a Receita via BrasilAPI (inclusive `data_entrada_sociedade`), abri o PDF do Diário Oficial da Pitfall e as páginas de vaga da SaveLivez (datas do WordPress). O Instagram não abre sem login, então conferi os perfis só pelo link no site da empresa.

## Linhas com dado (empresa certa / dados corretos / por que agora serve)

| # | Empresa (cidade) | Empresa certa | Dados corretos | Por que agora serve | Nota |
|---|---|---|---|---|---|
| 0 | Aethos Sistemas (Criciúma) | s | s | n | Site com CNPJ no rodapé, e o @aethosistemas tem link no site. Sem por que agora. |
| 3 | Lab of Codes (Florianópolis) | s | s | n | Site e Instagram certos. A v4 tirou a notícia fraca da v3 (melhorou). Sem por que agora. |
| 6 | SaveLivez (Florianópolis) | s | **n** | n | As duas vagas estão listadas, mas as páginas são de dez/2021, editadas pela última vez em jul/2025 e nov/2025. "Confirmadas como abertas hoje" e "abrindo ao mesmo tempo" não têm base. Contratar dev também não é gancho para estruturar o comercial. |
| 8 | RSJ Programas (Blumenau) | s | s | n | O iddi.com.br mostra a razão social e o CNPJ, e o telefone (47) 3324-3509 está no site. Bom achado (domínio com outro nome). |
| 9 | ViuMeuPet (Itapema) | s | s | n | Site com CNPJ, Instagram linkado no site. O telefone +55 51 98660-6810 é o contato de desenvolvedor na Play Store. |
| 16 | Lermen Sys (Blumenau) | s | s | n | Site certo. Faltou o @lermensys, que tem link no site. |
| 18 | Pitfall Sistemas (Lages) | s | **n** | n | **Repete o erro da v3.** O DO de 14/10/2026 publica um *termo aditivo* que só prorroga até out/2027 um contrato antigo com São José do Ouro/RS (R$ 1.243,91/mês, com reajuste pelo IPCA). Não é contrato novo. Também não confirmei o Instagram @pitfallsistemas. |
| 27 | Cosmos Publicidade (Videira) | s | s | s (fraco) | Receita: Leandro Fossatti e Patricia Tragancin entraram em **07/01/2026**. O motor diz "mês não informado", mas a data exata está na BrasilAPI. "Mudando de comando" exagera, porque a administradora é a mesma desde 2006. Novos sócios servem como gancho, mas não há site nem contato além da Receita. |
| 28 | Option Assessoria (Joinville) | s | s | n | Site com a razão social no rodapé e Instagram linkado no site. Sem por que agora. |
| 30 | Ao Quadrado (Joinville) | s | s | n | Site certo. Faltou o @aoquadrado_design, que tem link no site. |
| 31 | Zuum Marketing (Palhoça) | s | s | n | O telefone (48) 99174-1677 é o WhatsApp do site (a v3 trazia o telefone antigo da Receita e o reel da CDL: corrigido). |
| 43 | Commerce Sistemas (Chapecó) | s | s | n | Site com CNPJ e telefone (49) 3340-1510. O "Trabalhe conosco" é só um formulário de currículo, e o motor fez bem em não tratar como vaga. |
| 48 | LFZ Solutions (Blumenau) | s | s | n | Receita: Tais Ribeiro Zaguini entrou em **20/01/2026** (de novo "mês não informado", sem razão). Ela tem o sobrenome do fundador, então é provavelmente da família. "Gestão comercial concentrada nos fundadores" não decorre do fato. |

## Recall: 10 linhas sem nada (busca rápida por nome + cidade)

| # | Empresa (cidade) | Achei site/Instagram/vaga que o motor perdeu? | Nota |
|---|---|---|---|
| 2 | Lyck Serviços e Consultoria (Joinville) | n | Só agregadores de CNPJ (Serasa). |
| 4 | Servimedix (Pomerode) | n | Nada. |
| 7 | Servsoft Informática (São José) | n (incerto) | O servsoft.com.br existe, mas está "em construção", sem CNPJ nem cidade. Não dá para ligar à empresa. |
| 17 | WKA Desenvolvimento (Florianópolis) | n | Nada. |
| 19 | Credisystem Informática (Blumenau) | parcial | Tem página no Facebook (facebook.com/credisystem, software para financeiras) e telefone (47) 3035-4699 em diretório. O credisystem.com.br devolveu 503. |
| 22 | Hugs Agência de Marcas (Passo de Torres) | n | Nada conclusivo. |
| 32 | DP Branding / Deny Peres (Florianópolis) | **s (provável)** | Instagram @dp_branding e LinkedIn de "Deny Peres, Fundador DPbranding". O nome fantasia e o nome da sócia batem, mas o LinkedIn diz Rio de Janeiro. |
| 38 | Enribranding (Florianópolis) | n | Nada. |
| 39 | ON Multiagência (Itajaí) | n | Nada. |
| 41 | Galax Marketing (Chapecó) | n | Só homônimos (Galax placas de vídeo). |

Limite desta checagem: o WebSearch disponível indexa mal o Brasil, e domínios adivinhados não resolveram. Então "n" quer dizer "não achei em busca rápida", não "não existe".

## Totais

| Critério | Resultado |
|---|---|
| Empresa certa | **13/13** |
| Dados corretos | **11/13** |
| Por que agora serve | **1/13** (1 de 5 preenchidos, e fraco) |
| Recall (10 vazias) | 1 perda provável (DP Branding) e 1 parcial (Credisystem, só Facebook) |

## Padrões de erro

1. **O "por que agora" continua quase nulo.** Saiu em 5 de 13 linhas e só 1 serve. Os erros são de interpretação, não de achado: aditivo de prorrogação lido como contrato novo (Pitfall, o mesmo erro da v3), páginas de vaga de 2021 tratadas como "abertas hoje" (SaveLivez) e conclusões que não saem do fato (LFZ, Cosmos).
2. **Sinal da Receita com data jogada fora.** A BrasilAPI dá o dia exato da entrada do sócio (jan/2026 nos dois casos), mas o motor escreve "mês não informado".
3. **A identificação melhorou.** Nenhum homônimo e nenhum link de terceiro nesta rodada, e Zuum e Lab of Codes foram corrigidas. Ainda falta pegar o Instagram que tem link no próprio site (Lermen, Ao Quadrado).
