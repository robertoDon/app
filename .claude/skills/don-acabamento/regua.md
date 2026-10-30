# Régua Don (Design 2.0)

Origem: o Design 2.0 da Dalva (`design/canvas/`, páginas O design e As telas), aprovada em 30/10/2026. A ideia vem do "deslop any vibecoded app": o que deixa uma tela com cara de gerada é valor solto. Texto de 13, 14 e 15 px na mesma tela, espaço de 9 e 14, cinza que não passa no contraste. A cura é uma régua: poucos valores, cada um com nome, e nada fora dela.

## 1. A régua

Cinco grupos. Use o valor com nome; se precisar de um novo, mude a régua antes, não a tela.

| Grupo | Regra |
|---|---|
| Espaçamento | 4, 8, 12, 16, 20, 24. Seção de landing: 96 ou mais. Alvo de toque: 44. |
| Tipo | 3 tamanhos por tela. Celular: 32/36, 16/22, 12/16. Web: 40, 16, 13. Título em fonte de display (Sora 700), resto em Plex Sans. Hierarquia por peso e tamanho, nunca por cor. |
| Cor | Um fundo escuro, um claro, um acento. O acento (coral na Dalva) só em ação, um por tela, com texto escuro sobre ele. Um cinza de texto por tema, ambos com 4,5:1 ou mais. Âmbar e azul só para estado, sempre com texto e forma. |
| Símbolos | Ícones de 24 px, traço 2, pontas redondas, um só conjunto. Sem emoji como ícone. |
| Estrutura | Raios 8 (controle), 16 e 24 (card, folha), pílula (botão e chip). Sombra de 1 px. Barra de abas de vidro flutuando. Movimento de 150 ms. |

Os valores exatos da Dalva estão em `design/canvas/Sistema.dc.html`. Outro produto Don troca as cores e a fonte, mantém o formato da régua.

## 2. Como auditar uma tela

1. Liste todos os valores distintos no código: `font-size`, `padding`/`gap`/`margin`, `border-radius`, cores de texto.
2. Conte. Mais de 3 tamanhos de texto, mais de 6 espaçamentos ou mais de 4 raios já é desvio.
3. Calcule o contraste de cada cinza (fórmula da WCAG 2.1). Abaixo de 4,5:1 sai.
4. Troque cada valor solto pelo vizinho da régua. Não crie um quinto raio.
5. Mostre antes e depois com os números, como em `LegadoAntesDepois` (11 → 3 tamanhos, 14 → 6 espaçamentos, 10 → 4 raios, 2 → 0 cinzas reprovados).

## 3. Padrões de produto que a Dalva provou

- **Sessão em vez de lista.** O Hoje tem um card que é a ação ("Começar"). Dentro, uma tarefa por vez, com Feito, Adiar e Pular. Ao terminar, mostra o que mudou e já abre o próximo. É a regra do Netflix levada até o fim.
- **Hoje escuro de manhã, claro depois.** A tela abre escura e clareia quando o dia está feito. O estado é visível sem cor: o título muda ("Manhã feita.") e o ícone vira check. Escuro aqui é estado do dia, não vitrine.
- **Sequência em dias úteis.** Contar só dias úteis. Fim de semana não quebra. Chame de Ritmo, não de streak. Não pune, não grita.
- **Metas da semana com barra.** Número e barra juntos: "7 de 10 contatos". Nunca o número sozinho.
- **"Como foi?" em folha.** Depois de cada ação, uma folha de baixo com 3 respostas e o próximo passo já na linha de baixo. Raio 24.
- **Sem mascote.** Gamificação traduzida para o trabalho: Ritmo, metas, voz da marca. Personagem infantiliza produto que vende para dono de empresa.
- **Dado com fonte.** Cada item da fila diz de onde veio e desde quando está parado ("Parado desde segunda"), com ponto cheio e palavra.
- **Atalho que vira botão.** Gesto (arrastar para adiar) sempre existe também como botão com nome. Na web, `⌘K` e atalhos `G` + letra, mostrados na barra lateral.
- **O + no topo.** Botão de criar no topo, não flutuando sobre a barra de abas. O polegar fica com as abas.
- **Lista por urgência no celular, quadro na web.** Quadro estreito no celular é ruim; lista com "Precisa de você" e "Em dia" é melhor.

## 4. Como entregar

Quando o trabalho for desenhar ou reformar telas de um produto Don:

1. Faça a auditoria (seção 2) e escreva os números.
2. Monte a página "Régua" com os tokens conferidos em volta de uma tela real, como `Regua`.
3. Redesenhe uma sessão clicável, não telas soltas, como `HojeMobile` → `FocoMobile` → `ComoFoiMobile` → `FeitoMobile`.
4. Cada página nova do canvas entra no `canvas.json` e no `design/README.md`.
