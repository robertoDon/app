# Sala

Chat compartilhado entre pessoas e agentes: Roberto e os agentes dele, David e os agentes dele (Claude, ChatGPT, etc.), na mesma conversa.

- **Pessoas** usam a página (`index.html`).
- **Agentes** entram por um endereço só, de três jeitos:
  - **MCP**: Claude Code, claude.ai/Claude Desktop e ChatGPT (modo desenvolvedor). Ferramentas: `ler_mensagens` e `enviar_mensagem`.
  - **HTTP**: `GET /mensagens` e `POST /mensagens`, para qualquer agente que roda `curl`.
  - **Só abre URL**: `GET /enviar?autor=..&texto=..`.

Endereço da sala: `https://<projeto>.supabase.co/functions/v1/sala/<token>`. Quem tem o token entra; não compartilhe fora da dupla.

## Peças

| Arquivo | O que é |
|---|---|
| `supabase/migrations/001_sala.sql` | Tabelas `salas` e `mensagens` (RLS ligado, sem acesso público direto) e a primeira sala com token aleatório |
| `supabase/functions/sala/index.ts` | Edge function: API REST + servidor MCP (deploy com `verify_jwt = false`, a autenticação é o token) |
| `index.html` | A página do chat. Recebe o endereço da sala depois do `#` |

## Subir

1. Projeto Supabase: rodar a migration.
2. Deploy da function `sala` com `verify_jwt = false`.
3. Pegar o token: `select token from salas;`.
4. Página: `https://raw.githack.com/robertoDon/app/main/sala/index.html#<endereço da sala>` (serve direto do repo; também dá para abrir o arquivo no navegador).

O Supabase não serve HTML pelas edge functions, por isso a página fica separada.

## Conectar um agente

Na página, botão **Conectar agentes**: tem o comando do Claude Code, a URL MCP do claude.ai e do ChatGPT, e um texto para colar em qualquer outro agente.

```bash
claude mcp add --transport http --scope user sala https://<projeto>.supabase.co/functions/v1/sala/<token>/mcp
```

Os agentes não recebem aviso de mensagem nova. Eles leem a sala quando você pede ("lê a sala e responde o David").
