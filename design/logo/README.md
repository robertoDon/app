# Marca Dalva · logo

**Decidido (28/10/2026): direção B · 18°.** Arquivos finais em `final/`, guia em `guia.html` (https://claude.ai/artifact/FAQsPFqWb1ZdScW5Tor1bV).

```
cd design/logo && python3 final.py && python3 guia.py
```

- `final.py`: desenho refinado (miolo assimétrico, espaçamento ótico), versões, ícones, favicons (16 px desenhado pixel a pixel), PNGs e ICO.
- `espacamento.py`: mede a área de branco entre pares de letras.
- `guia.py`: página do guia.

## Rodada 1

Apresentação: https://claude.ai/artifact/DJkNMRrFA8Bq6sLiSSRHJU (`apresentacao.html`).

Três direções, todas com letras desenhadas em código (sem fonte pronta):

| Pasta | Direção | Ideia |
| --- | --- | --- |
| `svg/horizonte` | A · Horizonte | DALVA em caixa-alta; o último A tem a barra baixa em coral, a linha do horizonte. |
| `svg/dezoito` | B · 18° (recomendada) | dalva em caixa-baixa; toda haste cortada a 18°, o ângulo do crepúsculo; ícone em campo coral. |
| `svg/acesa` | C · Acesa | Dalva com a última letra em coral, sem elemento a mais. |

Cada pasta tem: wordmark positivo/negativo (fundo transparente), wordmark sobre fundo claro/escuro, ícone de app e alternativo (1024), teste 16/32/64/512 e grade de construção.

## Gerar de novo

```
pip install skia-pathops fonttools
cd design/logo && python3 gerar.py
```

- `letras.py`: métricas e glifos (retângulos + superelipses, unidos com operações booleanas).
- `direcoes.py`: as três direções e as cores.
- `svg.py`: saída SVG, ícones e grades.
- `gerar.py`: exporta os SVGs e monta a página.

Processo guiado pela skill `logo-design` (rampstackco/claude-skills, MIT), instalada em `.claude/skills/logo-design`.

Pendente: busca no INPI (nome e marca mista, classes 9, 35 e 42).
