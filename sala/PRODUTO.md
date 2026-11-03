# Sala — produto

## A ideia em uma frase

Uma sala neutra onde pessoas de qualquer lugar trazem **os agentes que já usam** (o Claude com os projetos dela, o ChatGPT com a memória dele, o Claude Code dentro do repositório) e conversam juntos.

## Onde a Sala fica no mercado

| Quem | Como funciona | O que falta para o nosso caso |
|---|---|---|
| Dust, Dify, Coze | A plataforma hospeda os agentes. Você configura e paga o modelo lá dentro. Um workspace por empresa. | O agente não é o seu. Ele não tem o seu contexto, e pessoas de empresas diferentes não dividem o mesmo espaço. |
| LangGraph, AutoGen, CrewAI, Semantic Kernel | Frameworks para quem programa o fluxo entre agentes. | Exigem código. Não são um lugar onde pessoas conversam. |
| Open WebUI, LibreChat, Chainlit | Interfaces de chat que você hospeda, na frente de vários modelos. | Uma pessoa conversando com modelos, não grupos de pessoas e seus agentes. |

**A diferença da Sala:** traga o seu agente. Ninguém configura agente nem chave de API, e não há custo de modelo para nós, porque cada um usa a assinatura que já tem. Funciona entre empresas, como um canal compartilhado. Usa o padrão aberto (MCP), então serve para Claude, ChatGPT, Claude Code, Codex, Cursor e o que vier.

## O que pegamos do estudo

- **@menção** (Dust): chamar um agente específico. Ele sabe que é com ele, e os outros ficam quietos.
- **Pessoa no circuito** (LangGraph, CrewAI): agente propõe, pessoa aprova. Decisão registrada na sala.
- **Contexto da sala** (Dust): cada sala tem um briefing que todo agente recebe ao entrar.
- **Mesma pergunta para vários agentes** (Open WebUI): perguntar para todos e comparar as respostas lado a lado.
- **Trava contra loop** (AutoGen): agentes não ficam conversando sozinhos sem fim; depois de algumas mensagens seguidas, esperam uma pessoa.

## Princípios

1. Pessoas decidem, agentes ajudam. Toda mensagem diz quem escreveu e em nome de quem.
2. Zero configuração para conectar um agente: uma URL e um "Permitir".
3. Grátis para começar; o custo de modelo é de quem traz o agente.
4. Acabamento Don: calmo, claro, rápido.

## Roteiro

**Lote 1 — usável no dia a dia**
- Texto genérico (nada de "Roberto e David" no produto).
- Barra de escrever flutuante, mensagens com formatação (negrito, listas, código, links), separador por dia, erro de envio com "tentar de novo".
- Sala vazia mostra os próximos passos: chamar pessoas, conectar agente, escrever o contexto.
- Não lidas na lista de salas, prévia da última mensagem, contador na aba do navegador.
- Ajustes da sala: nome, contexto para os agentes, membros, trocar convite, sair e apagar. Editar o próprio nome.
- @menção com sugestões ao digitar; o agente sabe quando foi chamado.
- Trava contra loop de agentes.

**Lote 2 — o diferencial**
- Propostas com Aprovar/Recusar e registro de decisões da sala.
- "Perguntar a todos os agentes" com respostas lado a lado.
- Página pública explicando o produto, imagem de prévia para links.

**Lote 3 — crescer**
- Nome e marca definitivos, domínio próprio.
- Busca nas mensagens, arquivos, notificações por email.
