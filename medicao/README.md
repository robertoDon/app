# Medição do custo do dado

Mede quanto custa, de verdade, enriquecer uma empresa na Caçada: o "1 crédito" do capítulo 5 do canvas.

1. Ponha os CNPJs em `medicao/empresas.csv` (uma coluna `cnpj`, 50 empresas do ICP).
2. Configure no ambiente: `SEARCH_API_KEY` (Serper) e `ANTHROPIC_API_KEY`. O preço da busca já vem do plano Starter da Serper (US$ 0,001); troque com `PRECO_BUSCA_USD=` se contratar outro.
3. `pip install anthropic requests` e `python medicao/medir.py`.
4. Roberto e David conferem à mão as 3 colunas (s/n) do CSV em `medicao/resultados/`.

`--so-receita` roda só a parte grátis (BrasilAPI). Por empresa: 2 buscas + 1 chamada à IA. Modelo padrão Haiku 5.5; troque com `MODELO=`.
