# Unit economics: Dalva (assinatura de prospecção e pipeline para startups de 1 a 10 pessoas)

Every number below comes from the input file. Nothing is looked up or guessed.

## One cliente-mês

| line | per cliente-mês |
| --- | ---: |
| Price | $19.90 |
| Gateway Asaas (estimativa, mix Pix/cartão) | -$1.20 |
| IA Claude Haiku: enriquecimentos e buscas (idea.md, estimativa) | -$1.20 |
| Banco e hospedagem rateados por cliente (estimativa) | -$0.60 |
| **Contribution** (what each cliente-mês leaves to pay the fixed costs) | **$16.90** (85%) |

## The margin that matters

Fixed costs: $330 a month (Supabase Pro (US$25 a R$5,10) $128, Hospedagem (US$20 a R$5,10) $102, Domínio, e-mail, ferramentas (estimativa) $100).

- **Break-even: 1 cliente-mêss a day.** Below that you lose money every month.
- **Profit margin at your plan** (10 a day): **79%** of every sale, after every cost.
- Capacity: 1000 a day.

## Year 1, month by month

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

## What if

| scenario | margin at plan | break-even a day | year 1 profit |
| --- | ---: | ---: | ---: |
| Base plan | 79% | 1 | $21,289 |
| Price -10% | 77% | 1 | $18,316 |
| Volume -20% | 78% | 1 | $16,239 |
| Unit costs +15% | 77% | 1 | $20,616 |

No red flags in these numbers. They are only as good as the inputs: check every cost against a real quote.

---

## Leitura do Dalva (nota do analista)

- A ferramenta imprime "$", mas os valores são R$. "cliente-mês por dia" = novos pagantes médios por dia x 30. O plano de 10/dia equivale a ~300 clientes pagantes no mês 12; a rampa 0,3 a 9/dia é uma hipótese conservadora frente aos 43% a 52% do painel (que é teto, não previsão).
- Ponto de equilíbrio real: R$ 330 de fixo ÷ R$ 16,90 de contribuição = ~20 clientes pagantes.
- Custos variáveis e fixos são estimativas a partir do idea.md (Viabilidade). Fora da conta: impostos, chargeback, inadimplência, suporte, aquisição e o trabalho do fundador.
- Margem a R$ 59,90: 95%; a R$ 29,90: 90%.
- O que decide a viabilidade não está nessa conta: custo de aquisição, retenção e LGPD.
