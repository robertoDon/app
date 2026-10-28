# Medição do custo do dado

Mede quanto custa, de verdade, enriquecer uma empresa na Caçada: o "1 crédito" do capítulo 5 do canvas.

1. Ponha os CNPJs em `medicao/empresas.csv` (uma coluna `cnpj`, 50 empresas do ICP).
2. Configure no ambiente: `SEARCH_API_KEY` (Serper) e `ANTHROPIC_API_KEY`. O preço da busca já vem do plano Starter da Serper (US$ 0,001); troque com `PRECO_BUSCA_USD=` se contratar outro.
3. `pip install anthropic requests` e `python medicao/medir.py`.
4. Roberto e David conferem à mão as 3 colunas (s/n) do CSV em `medicao/resultados/`.

`--so-receita` roda só a parte grátis (BrasilAPI). Por empresa: 2 buscas + 1 chamada à IA. Modelo padrão Haiku 5.5; troque com `MODELO=`.

## As 50 empresas (ICP A, escolhido em 28/10/2026)

Agências digitais e software houses em SC. Tiradas da base aberta da Receita de outubro de 2026 (arquivo `Estabelecimentos1`, cerca de 1/10 da base), com:
- SC, matriz, situação ativa, aberta antes de 2024;
- CNAE principal de software (6201-5/01, 6202-3/00, 6203-1/00, 6204-0/00) ou de agência (7311-4/00, 7319-0/03, 7319-0/04);
- Ltda, porte ME ou EPP (sem empresário individual, para tirar quem trabalha sozinho);
- sorteio de 25 de cada grupo, sem olhar os nomes.

A Receita não informa o número de funcionários; ME e EPP é o mais próximo de "2 a 20 pessoas". Algumas empresas têm CNAE de software mas fazem outra coisa: isso também é parte do que a medição precisa mostrar.

Base: compartilhamento público https://arquivos.receitafederal.gov.br/index.php/s/YggdBLfdninEJX9 (uma pasta por mês).
