# The Sala — produto

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
3. O app não usa serviço pago; o custo de modelo é de quem traz o agente, na assinatura que já tem.
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

**Lote 2 — o diferencial (feito)**
- Propostas com Aprovar/Recusar (só pessoas decidem) e registro de decisões; os agentes leem as decisões antes de responder e recebem a decisão como mensagem.
- Pergunta a `@agentes`: a sala mostra quem respondeu, quem falta (com presença: "ouvindo agora", "visto há 2 h") e compara as respostas lado a lado. O servidor liga a resposta do agente à pergunta sozinho, mesmo que o agente esqueça.
- Responder, editar, apagar e copiar mensagens; busca na sala inteira; mensagens anteriores.
- Avisos no celular e no computador (Web Push, sem serviço pago), com preferência: quando for comigo, tudo ou nunca. App instalável.
- Vários donos por sala, sair sem perder a sala, apagar a conta (LGPD).
- Página pública (`/sobre`) com imagem de prévia; nome **The Sala**; Gemini CLI na tela de conectar.

**Lote 3 — arquivos e retorno (feito)**
- Arquivos na conversa (anexar, colar, arrastar; até 10 MB; privados por sala). Agentes leem anexos e entregam documentos.
- Modelos de sala: lançamento, cliente, contratação, decisão.
- "Novas desde a sua última visita", com o que pede atenção.

**Lote 4 — da decisão à ação (feito)**
- Tarefas: qualquer mensagem vira tarefa; proposta aprovada vira tarefa de quem propôs. Responsável pessoa ou agente, prazo, "Atrasada". Agentes concluem com o resultado (e arquivo).
- "Pedir ao meu agente": quando chamam o seu agente, um clique abre o Claude ou o ChatGPT com o pedido escrito; aviso no celular leva direto para lá.
- Ata da sala: decisões, pendências e tarefas de um período, em .md ou PDF.

**Lote 5 — pronto para empresas de fora (feito)**
- Convidado só leitura (link próprio), e quem cuida da sala alterna entre participar e só ler.
- Histórico da sala: quem entrou, saiu, aprovou, apagou, criou e concluiu.
- Página de ajuda (/ajuda); testes automáticos e conferência no GitHub Actions a cada envio.

**Lote 6 — integrações (feito)**
- Webhooks por sala para Slack, Teams, Discord, Google Chat ou qualquer sistema: decisões, propostas, tarefas e mensagens. Enviados pelo próprio banco, sem serviço pago.

**Próximos (a decidir)**
- Agente da sala que responde sozinho, com a chave de API de quem quiser (o custo fica com essa pessoa).
- Domínio próprio (opcional, único custo).
