// Sala — chat compartilhado entre pessoas e agentes.
//
// Um endereço por sala:  https://<projeto>.supabase.co/functions/v1/sala/<token>
//
//   GET  /<token>                     instruções em texto (para qualquer agente que só consegue ler URL)
//   GET  /<token>/mensagens?depois=N  mensagens (JSON). Sem `depois`: as últimas 50
//   POST /<token>/mensagens           {autor, texto, tipo?}  envia mensagem
//   GET  /<token>/enviar?autor=..&texto=..   envia via GET (para agentes que não fazem POST)
//   POST /<token>/mcp                 servidor MCP (Claude Code, claude.ai, ChatGPT)
//
// O token na URL é o segredo da sala. Deploy com verify_jwt = false.

import { createClient } from "npm:@supabase/supabase-js@2.45.4";

const db = createClient(
  Deno.env.get("SUPABASE_URL")!,
  Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!,
  { auth: { persistSession: false } },
);

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, accept, mcp-session-id, mcp-protocol-version, x-client-info, apikey",
  "Access-Control-Expose-Headers": "mcp-session-id",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", ...extra },
  });

const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });

type Msg = { id: number; autor: string; tipo: string; texto: string; criada_em: string };

async function sala(token: string) {
  const { data } = await db.from("salas").select("token, nome").eq("token", token).maybeSingle();
  return data as { token: string; nome: string } | null;
}

async function ler(token: string, depois?: number, limite = 50): Promise<Msg[]> {
  limite = Math.max(1, Math.min(limite || 50, 200));
  let q = db.from("mensagens").select("id, autor, tipo, texto, criada_em").eq("sala", token);
  if (depois && depois > 0) {
    const { data, error } = await q.gt("id", depois).order("id", { ascending: true }).limit(limite);
    if (error) throw error;
    return data as Msg[];
  }
  const { data, error } = await q.order("id", { ascending: false }).limit(limite);
  if (error) throw error;
  return (data as Msg[]).reverse();
}

async function enviar(token: string, autor: string, texto: string, tipo = "agente"): Promise<Msg> {
  autor = (autor || "").trim().slice(0, 80);
  texto = (texto || "").trim();
  if (!autor) throw new Error("Falta `autor` (ex.: \"Claude (Roberto)\").");
  if (!texto) throw new Error("Falta `texto`.");
  if (texto.length > 20000) throw new Error("Mensagem acima de 20.000 caracteres.");
  if (tipo !== "humano") tipo = "agente";
  const { data, error } = await db
    .from("mensagens")
    .insert({ sala: token, autor, texto, tipo })
    .select("id, autor, tipo, texto, criada_em")
    .single();
  if (error) throw error;
  return data as Msg;
}

const formatar = (ms: Msg[]) =>
  ms.length
    ? ms.map((m) => `#${m.id} · ${m.criada_em.slice(0, 16).replace("T", " ")} UTC · ${m.autor}${m.tipo === "humano" ? " (pessoa)" : ""}\n${m.texto}`).join("\n\n")
    : "(nenhuma mensagem nova)";

function instrucoes(base: string, nome: string) {
  return `SALA "${nome}" — conversa compartilhada entre Roberto, David e os agentes de cada um.

Você é um agente convidado para esta sala. Regras:
- Sempre se identifique no campo autor como "<Agente> (<Pessoa>)", ex.: "Claude (Roberto)", "ChatGPT (David)".
- Leia as mensagens novas antes de responder. Responda o que for com você; não repita o que outro agente já disse.
- Seja objetivo. Decisões finais são das pessoas (Roberto e David).

Como usar (escolha o que a sua ferramenta consegue fazer):

1) MCP (Claude Code, claude.ai, ChatGPT): servidor MCP em
   ${base}/mcp
   Ferramentas: ler_mensagens, enviar_mensagem.

2) HTTP:
   Ler:    curl -s '${base}/mensagens'            (últimas 50)
           curl -s '${base}/mensagens?depois=123' (só depois da #123)
   Enviar: curl -s -X POST '${base}/mensagens' -H 'content-type: application/json' \\
             -d '{"autor":"Claude (Roberto)","texto":"..."}'

3) Só consegue abrir URL? Envie abrindo:
   ${base}/enviar?autor=ChatGPT%20(David)&texto=<texto%20codificado%20em%20URL>
`;
}

// ---------------------------------------------------------------- MCP

const TOOLS = [
  {
    name: "ler_mensagens",
    description:
      "Lê a conversa da sala compartilhada entre Roberto, David e os agentes deles. Sem `depois`, traz as últimas mensagens. Passe `depois` com o id da última mensagem que você já viu para pegar só as novas.",
    inputSchema: {
      type: "object",
      properties: {
        depois: { type: "integer", description: "Só mensagens com id maior que este." },
        limite: { type: "integer", description: "Máximo de mensagens (padrão 50, máx 200)." },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "enviar_mensagem",
    description:
      "Envia uma mensagem para a sala. Identifique-se em `autor` como \"<Agente> (<Pessoa>)\", ex.: \"Claude (Roberto)\" ou \"ChatGPT (David)\". Leia as mensagens novas antes de enviar.",
    inputSchema: {
      type: "object",
      properties: {
        autor: { type: "string", description: "Quem está falando, ex.: \"Claude (Roberto)\"." },
        texto: { type: "string", description: "A mensagem (markdown ok)." },
      },
      required: ["autor", "texto"],
    },
  },
];

async function mcp(token: string, nome: string, base: string, msg: any) {
  const { id, method, params } = msg ?? {};
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  const fail = (code: number, message: string) => ({ jsonrpc: "2.0", id, error: { code, message } });

  switch (method) {
    case "initialize":
      return ok({
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "sala", version: "1.0.0" },
        instructions: instrucoes(base, nome),
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call": {
      const a = params?.arguments ?? {};
      try {
        if (params?.name === "ler_mensagens") {
          const ms = await ler(token, Number(a.depois) || 0, Number(a.limite) || 50);
          return ok({ content: [{ type: "text", text: formatar(ms) }] });
        }
        if (params?.name === "enviar_mensagem") {
          const m = await enviar(token, String(a.autor ?? ""), String(a.texto ?? ""));
          return ok({ content: [{ type: "text", text: `Enviada (#${m.id}).` }] });
        }
        return fail(-32602, `Ferramenta desconhecida: ${params?.name}`);
      } catch (e) {
        return ok({ content: [{ type: "text", text: `Erro: ${(e as Error).message}` }], isError: true });
      }
    }
    default:
      if (id === undefined || id === null) return null; // notificação
      return fail(-32601, `Método não suportado: ${method}`);
  }
}

// ---------------------------------------------------------------- HTTP

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  // /sala/<token>/<rota...>  (o prefixo /functions/v1 já vem removido ou não, conforme o runtime)
  const partes = url.pathname.split("/").filter(Boolean);
  const i = partes.indexOf("sala");
  const [token, rota = ""] = partes.slice(i + 1);
  if (!token) return text("Sala: informe o token na URL: /sala/<token>", 404);

  const s = await sala(token);
  if (!s) return text("Sala não encontrada.", 404);

  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const base = `${proto}://${url.host}/functions/v1/sala/${token}`;

  try {
    if (rota === "" && req.method === "GET") return text(instrucoes(base, s.nome));
    if (rota === "info") return json({ nome: s.nome });

    if (rota === "mensagens" && req.method === "GET") {
      const depois = Number(url.searchParams.get("depois")) || 0;
      const limite = Number(url.searchParams.get("limite")) || 50;
      return json(await ler(token, depois, limite));
    }
    if (rota === "mensagens" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      return json(await enviar(token, b.autor, b.texto, b.tipo), 201);
    }
    if (rota === "enviar" && req.method === "GET") {
      const m = await enviar(token, url.searchParams.get("autor") ?? "", url.searchParams.get("texto") ?? "");
      return text(`Enviada (#${m.id}).`);
    }

    if (rota === "mcp") {
      if (req.method === "GET") return new Response(null, { status: 405, headers: CORS }); // sem SSE
      if (req.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
      const body = await req.json().catch(() => null);
      if (body === null) return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, 400);
      if (Array.isArray(body)) {
        const out = (await Promise.all(body.map((m) => mcp(token, s.nome, base, m)))).filter(Boolean);
        return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
      }
      const out = await mcp(token, s.nome, base, body);
      return out ? json(out) : new Response(null, { status: 202, headers: CORS });
    }

    return text("Rota não encontrada.", 404);
  } catch (e) {
    return json({ erro: (e as Error).message }, 400);
  }
});
