---
name: don-acabamento
description: Padrão de UI, UX e design dos produtos Don ("o cool está no acabamento"). Use sempre que for desenhar, codar ou revisar tela, landing, componente, dashboard, deck ou peça visual de um produto Don, ou quando pedirem algo "cool", "minimalista", "com cara de Apple/Linear/Attio", ou para revisar se uma interface está no padrão Don.
---

# Don · O cool está no acabamento

Produto Don é barato e vende quase como B2C: visual, minimalista, sem cara de sistema corporativo. A estratégia vem pronta. Nosso papel é deixar cool, e o cool mora no acabamento: nos detalhes que ninguém nota até faltarem.

Seis referências. Cada uma vira regra concreta.

## 1. Apple: respiro e um assunto por tela

- Uma tela, um assunto, uma ação principal. Se precisa de duas, são duas telas.
- Respiro é design. Padding generoso (seção de landing ≥ 96 px vertical; card ≥ 24 px), grid de 8 px.
- Título grande e curto (até 6 palavras), subtítulo explica. Nada de parágrafo no hero.
- Hierarquia por tamanho e peso, não por cor. No máximo 3 tamanhos de texto por tela.

## 2. Linear: atalho para tudo, 150 ms, nada pisca

- Toda ação frequente tem atalho de teclado, mostrado no tooltip e no menu (`⌘K` para buscar/agir).
- Transições de 150 ms, `ease-out`. Hover e foco em 100–150 ms. Nada acima de 250 ms.
- Nada pisca: sem spinner de tela inteira, sem layout que pula. Use skeleton com o formato final e update otimista.
- Foco sempre visível (anel de 2 px), navegação completa por teclado.

## 3. Attio: tabela que parece documento, dado com fonte

- Tabela sem grade pesada: linhas de 1 px só na horizontal, cabeçalho discreto, densidade confortável (linha de 44–52 px).
- Célula editável no lugar, como texto. Sem modal para mudar um campo.
- Todo dado mostra de onde veio e quando ("Receita Federal · há 2 dias"). Dado sem fonte não entra na tela.

## 4. Netflix: o próximo passo já aberto

- A tela inicial abre no que a pessoa deve fazer agora, como o "continuar assistindo". Nunca num menu.
- Depois de cada ação, o próximo passo já aparece pronto (próximo item, próxima mensagem, próximo contato).
- Onboarding termina em valor real em menos de 2 minutos, não em configuração.

## 5. Micropolish: sombra de 1 px, número tabular, vazio com voz

- Sombras quase invisíveis: `0 1px 2px rgba(0,0,0,.06)` mais borda de 1 px. Nunca sombra borrada grande em elemento parado.
- Números sempre `font-variant-numeric: tabular-nums`. Moeda e porcentagem alinhadas à direita em tabelas.
- Estado vazio tem voz e ação: diz o que vai aparecer ali e qual botão faz aparecer. Nunca "Nenhum dado encontrado".
- Raio consistente (8 px em controles, 16–24 px em cards). Ícones com o mesmo traço em toda a interface.

## 6. Grok: fundo escuro, cards flutuando em camadas

- Para vitrine (hero, landing, vídeo), pode usar fundo escuro com o produto real em cards sobrepostos, levemente deslocados, como camadas.
- Mostre a tela de verdade, não ilustração genérica. O produto é o herói.
- Botões em pílula. Um principal (cheio), um secundário (contorno ou texto).
- Escuro é para vitrine. A ferramenta do dia a dia continua clara, a não ser que a marca peça o contrário.

## Regras que valem para tudo

- **Estado = texto + forma + cor.** Nunca só cor (atrasado: ponto cheio + "Atrasado"; hoje: anel + "Hoje"). Contraste AA no mínimo.
- **Uma cor de acento, só em ação.** O acento da marca é para CTA e foco, não para decoração.
- **Microcopy curta, em português de gente.** Verbo no botão ("Mandar mensagem", não "Confirmar"). Sem jargão, sem exclamação.
- **Venda como B2C.** Preço na cara, plano simples, teste sem atrito, prova visual (o produto rodando) antes de texto.
- **Assinatura Don discreta.** "um produto Don" só no rodapé. A marca do produto vem primeiro.
- **Foto real ou produto real.** Nada de mockup feito com formas geométricas para representar objeto (camiseta, boné). Ou foto, ou nada.

## Antes de entregar, confira

1. Cada tela tem um assunto e uma ação principal?
2. Tem atalho nas ações frequentes e foco visível?
3. Alguma transição passa de 150–250 ms ou algo pisca/pula?
4. Todo dado tem fonte e data?
5. A tela inicial abre no próximo passo?
6. Sombras de 1 px, números tabulares, raio consistente?
7. Estados vazios têm voz e botão?
8. Nenhum estado depende só de cor?
9. O acento aparece só em ação?
10. Funciona em 375 px de largura sem scroll horizontal?

Se a resposta de algum item for "não", ajuste antes de mostrar. Em caso de dúvida sobre marca, preço ou estratégia, pergunte. Não chute.
