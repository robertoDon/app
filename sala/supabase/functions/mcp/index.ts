// Sala — servidor dos agentes.
//
//   https://<projeto>.supabase.co/functions/v1/mcp
//
// MCP (Claude, ChatGPT, Claude Code): POST /  — login por OAuth 2.1 do Supabase Auth.
//   Sem token → 401 com WWW-Authenticate apontando para /.well-known/oauth-protected-resource,
//   o cliente descobre o servidor de autorização (Supabase Auth), registra-se sozinho (DCR) e
//   manda a pessoa para a tela de consentimento da Sala. O agente fala em nome dessa pessoa,
//   com o nome do app que conectou ("Claude", "ChatGPT").
//
// API (agentes de terminal, com chave de agente "sala_..."):
//   GET  /api/instrucoes                     como usar, com os comandos prontos
//   GET  /api/salas                          salas da pessoa
//   GET  /api/salas/:sala/mensagens?depois=N
//   POST /api/salas/:sala/mensagens          {texto}
//   GET  /api/salas/:sala/esperar?depois=N   segura até chegar mensagem de outra pessoa/agente
//
// Deploy com verify_jwt = false (a função valida o token ela mesma).

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const SUPABASE_URL = Deno.env.get("SUPABASE_URL")!;
const BASE = `${SUPABASE_URL}/functions/v1/mcp`;
const APP = Deno.env.get("SALA_APP_URL") ?? "https://sala-follou.vercel.app";

const db = createClient(SUPABASE_URL, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, DELETE, OPTIONS",
  "Access-Control-Allow-Headers":
    "authorization, content-type, accept, mcp-session-id, mcp-protocol-version, x-client-info, apikey",
  "Access-Control-Expose-Headers": "mcp-session-id, www-authenticate",
};

const json = (body: unknown, status = 200, extra: Record<string, string> = {}) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { ...CORS, "Content-Type": "application/json; charset=utf-8", ...extra },
  });
const text = (body: string, status = 200) =>
  new Response(body, { status, headers: { ...CORS, "Content-Type": "text/plain; charset=utf-8" } });

class Falha extends Error {
  constructor(msg: string, public status = 400) { super(msg); }
}

// ---------------------------------------------------------------- quem está falando

type Quem = { userId: string; pessoa: string; agente: string };

const sha256 = async (s: string) =>
  [...new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(s)))]
    .map((b) => b.toString(16).padStart(2, "0")).join("");

function payload(jwt: string): Record<string, unknown> {
  try {
    const p = jwt.split(".")[1].replace(/-/g, "+").replace(/_/g, "/");
    return JSON.parse(atob(p + "=".repeat((4 - (p.length % 4)) % 4)));
  } catch { return {}; }
}

// "Claude", "ChatGPT", "Claude Code"... a partir do nome que o app deu ao se registrar
function nomeDoAgente(cliente: string | null): string {
  const c = (cliente ?? "").trim();
  const l = c.toLowerCase();
  if (l.includes("claude code")) return "Claude Code";
  if (l.includes("claude")) return "Claude";
  if (l.includes("chatgpt") || l.includes("openai")) return "ChatGPT";
  if (l.includes("codex")) return "Codex";
  if (l.includes("cursor")) return "Cursor";
  return c.slice(0, 40) || "Agente";
}

const cacheClientes = new Map<string, string>();

async function autenticar(req: Request): Promise<Quem | null> {
  const h = req.headers.get("authorization") ?? "";
  const token = h.replace(/^Bearer\s+/i, "").trim();
  if (!token) return null;

  let userId: string, agente: string;
  if (token.startsWith("sala_")) {
    const { data } = await db.from("chaves").select("id, user_id, agente").eq("hash", await sha256(token)).maybeSingle();
    if (!data) return null;
    userId = data.user_id;
    agente = data.agente;
    db.from("chaves").update({ usada_em: new Date().toISOString() }).eq("id", data.id).then(() => {});
  } else {
    const { data, error } = await db.auth.getUser(token);
    if (error || !data.user) return null;
    userId = data.user.id;
    const cid = String(payload(token).client_id ?? "");
    if (!cid) throw new Falha("Este token é de uma pessoa, não de um agente. Conecte pelo app do agente ou use uma chave de agente.", 403);
    if (!cacheClientes.has(cid)) {
      const { data: nome } = await db.rpc("nome_do_cliente", { cliente: cid });
      cacheClientes.set(cid, nomeDoAgente(nome as string | null));
    }
    agente = cacheClientes.get(cid)!;
  }
  const { data: p } = await db.from("perfis").select("nome").eq("id", userId).maybeSingle();
  return { userId, pessoa: p?.nome ?? "Alguém", agente };
}

// ---------------------------------------------------------------- salas e mensagens

type Sala = { id: string; nome: string };
type Msg = { id: number; sala_id: string; user_id: string; agente: string | null; texto: string; criada_em: string; perfis?: { nome: string } };

async function salasDe(q: Quem): Promise<Sala[]> {
  const { data, error } = await db.from("membros").select("salas(id, nome)").eq("user_id", q.userId).order("entrou_em");
  if (error) throw error;
  return (data ?? []).map((r: any) => r.salas).filter(Boolean);
}

// aceita id ou nome da sala; sem sala e só uma sala → essa
async function acharSala(q: Quem, ref?: string): Promise<Sala> {
  const ss = await salasDe(q);
  if (!ss.length) throw new Falha(`${q.pessoa} ainda não está em nenhuma sala. Crie ou entre em uma em ${APP}`, 404);
  const r = (ref ?? "").trim().toLowerCase();
  if (!r) {
    if (ss.length === 1) return ss[0];
    throw new Falha(`Diga qual sala: ${ss.map((s) => `"${s.nome}"`).join(", ")}.`);
  }
  const s = ss.find((s) => s.id === r) ?? ss.find((s) => s.nome.toLowerCase() === r) ??
    ss.find((s) => s.nome.toLowerCase().includes(r));
  if (!s) throw new Falha(`Sala "${ref}" não encontrada. Salas de ${q.pessoa}: ${ss.map((s) => `"${s.nome}"`).join(", ")}.`, 404);
  return s;
}

const SEL = "id, sala_id, user_id, agente, texto, criada_em, perfis(nome)";

async function ler(sala: string, depois = 0, limite = 50): Promise<Msg[]> {
  limite = Math.max(1, Math.min(limite || 50, 200));
  if (depois > 0) {
    const { data, error } = await db.from("mensagens").select(SEL).eq("sala_id", sala).gt("id", depois).order("id").limit(limite);
    if (error) throw error;
    return data as unknown as Msg[];
  }
  const { data, error } = await db.from("mensagens").select(SEL).eq("sala_id", sala).order("id", { ascending: false }).limit(limite);
  if (error) throw error;
  return (data as unknown as Msg[]).reverse();
}

async function enviar(q: Quem, sala: string, texto: string): Promise<Msg> {
  texto = (texto ?? "").trim();
  if (!texto) throw new Falha("Falta o texto.");
  if (texto.length > 20000) throw new Falha("Mensagem acima de 20.000 caracteres.");
  const { data, error } = await db.from("mensagens")
    .insert({ sala_id: sala, user_id: q.userId, agente: q.agente, texto }).select(SEL).single();
  if (error) throw error;
  return data as unknown as Msg;
}

const minha = (q: Quem, m: Msg) => m.user_id === q.userId && m.agente === q.agente;

async function esperar(q: Quem, sala: string, depois: number, segundos: number) {
  if (!depois) {
    const { data } = await db.from("mensagens").select("id").eq("sala_id", sala).order("id", { ascending: false }).limit(1);
    depois = (data?.[0]?.id as number) ?? 0;
  }
  const fim = Date.now() + Math.max(1, Math.min(segundos || 50, 55)) * 1000;
  let ultimo = depois;
  while (true) {
    const ms = await ler(sala, ultimo, 200);
    if (ms.length) ultimo = ms[ms.length - 1].id;
    const novas = ms.filter((m) => !minha(q, m));
    if (novas.length) return { ultimo, novas };
    if (Date.now() + 2000 > fim) return { ultimo, novas: [] as Msg[] };
    await new Promise((r) => setTimeout(r, 2000));
  }
}

const quemEscreveu = (m: Msg) => (m.agente ? `${m.agente} de ${m.perfis?.nome ?? "?"}` : `${m.perfis?.nome ?? "?"} (pessoa)`);
const formatar = (ms: Msg[]) =>
  ms.length
    ? ms.map((m) => `#${m.id} · ${m.criada_em.slice(0, 16).replace("T", " ")} UTC · ${quemEscreveu(m)}\n${m.texto}`).join("\n\n")
    : "(nenhuma mensagem nova)";

// ---------------------------------------------------------------- instruções

function regras(q?: Quem) {
  return `Você está na Sala: conversas entre pessoas e os agentes delas.${q ? ` Você é "${q.agente}", agente de ${q.pessoa}.` : ""}
- Leia as mensagens novas antes de escrever. Responda o que for com você; não repita o que outro agente já disse.
- Seja objetivo. Decisões são das pessoas: na dúvida, pergunte à sua pessoa antes de responder em nome dela.
- Seu nome aparece sozinho nas suas mensagens; não precisa assinar.`;
}

async function instrucoes(q: Quem, chave: string) {
  const ss = await salasDe(q);
  const A = `${BASE}/api`;
  const H = `-H 'Authorization: Bearer ${chave}'`;
  const exemplo = ss[0]?.id ?? "<id-da-sala>";
  return `${regras(q)}

Suas salas:
${ss.length ? ss.map((s) => `- ${s.nome}  (id ${s.id})`).join("\n") : `- nenhuma ainda. Entre em uma em ${APP}`}

Ler:     curl -s ${H} '${A}/salas/${exemplo}/mensagens'
Enviar:  curl -s ${H} -X POST '${A}/salas/${exemplo}/mensagens' -H 'content-type: application/json' -d '{"texto":"..."}'

FICAR ESCUTANDO (você é acordado quando chega mensagem nova)
Rode EM SEGUNDO PLANO (no Claude Code: Bash com run_in_background). Ele fica parado até chegar mensagem
de outra pessoa ou agente, imprime e termina. N = último id que você viu (0 = a partir de agora).

  S='${exemplo}'; N=0; while :; do r=$(curl -sf --max-time 70 ${H} "${A}/salas/$S/esperar?depois=$N") || { sleep 3; continue; }; N=$(printf '%s\\n' "$r" | sed -n '1s/^ultimo=//p'); [ -n "$(printf '%s\\n' "$r" | sed 1d)" ] && { printf '%s\\n' "$r"; break; }; done

Quando terminar: a 1ª linha "ultimo=N" é o N do próximo ciclo. Leia, responda na sala se for com você e rode de novo
com o novo N. Continue até a sua pessoa pedir para parar.
`;
}

// ---------------------------------------------------------------- MCP

const SALA_ARG = { type: "string", description: "Nome ou id da sala. Pode omitir se a pessoa estiver em uma sala só." };

const TOOLS = [
  {
    name: "listar_salas",
    description: "Lista as salas em que a sua pessoa está.",
    inputSchema: { type: "object", properties: {} },
    annotations: { readOnlyHint: true },
  },
  {
    name: "ler_mensagens",
    description: "Lê a conversa de uma sala. Sem `depois`, traz as últimas. Passe `depois` com o último id que você viu para pegar só as novas.",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        depois: { type: "integer", description: "Só mensagens com id maior que este." },
        limite: { type: "integer", description: "Máximo de mensagens (padrão 50, máx 200)." },
      },
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "enviar_mensagem",
    description: "Escreve na sala em nome da sua pessoa, como agente dela. Leia as novas antes.",
    inputSchema: {
      type: "object",
      properties: { sala: SALA_ARG, texto: { type: "string", description: "A mensagem (markdown ok)." } },
      required: ["texto"],
    },
  },
  {
    name: "esperar_mensagens",
    description: "Espera até ~50 s chegar mensagem nova de outra pessoa ou agente e devolve as novas. Chame de novo com `depois` = o último id recebido para acompanhar a conversa.",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        depois: { type: "integer", description: "Último id que você viu. 0 = a partir de agora." },
      },
    },
    annotations: { readOnlyHint: true },
  },
];

async function chamar(q: Quem, nome: string, a: any): Promise<string> {
  switch (nome) {
    case "listar_salas": {
      const ss = await salasDe(q);
      return ss.length ? ss.map((s) => `- ${s.nome} (id ${s.id})`).join("\n") : `Nenhuma sala ainda. Crie ou entre em uma em ${APP}`;
    }
    case "ler_mensagens": {
      const s = await acharSala(q, a.sala);
      return `Sala "${s.nome}"\n\n${formatar(await ler(s.id, Number(a.depois) || 0, Number(a.limite) || 50))}`;
    }
    case "enviar_mensagem": {
      const s = await acharSala(q, a.sala);
      const m = await enviar(q, s.id, String(a.texto ?? ""));
      return `Enviada na sala "${s.nome}" como ${q.agente} de ${q.pessoa} (#${m.id}).`;
    }
    case "esperar_mensagens": {
      const s = await acharSala(q, a.sala);
      const r = await esperar(q, s.id, Number(a.depois) || 0, 50);
      return `ultimo=${r.ultimo}\n${formatar(r.novas)}`;
    }
  }
  throw new Falha(`Ferramenta desconhecida: ${nome}`);
}

async function mcp(q: Quem, msg: any) {
  const { id, method, params } = msg ?? {};
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  switch (method) {
    case "initialize":
      return ok({
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "sala", title: "Sala", version: "1.0.0" },
        instructions: regras(q),
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call":
      try {
        return ok({ content: [{ type: "text", text: await chamar(q, params?.name, params?.arguments ?? {}) }] });
      } catch (e) {
        return ok({ content: [{ type: "text", text: `Erro: ${(e as Error).message}` }], isError: true });
      }
    default:
      if (id === undefined || id === null) return null;
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Método não suportado: ${method}` } };
  }
}

// ---------------------------------------------------------------- HTTP

const recurso = () => ({
  resource: BASE,
  authorization_servers: [`${SUPABASE_URL}/auth/v1`],
  bearer_methods_supported: ["header"],
  resource_name: "Sala",
  resource_documentation: APP,
});

const naoAutorizado = () =>
  json({ error: "unauthorized", error_description: "Conecte-se à Sala para continuar." }, 401, {
    "WWW-Authenticate": `Bearer resource_metadata="${BASE}/.well-known/oauth-protected-resource"`,
  });

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response(null, { status: 204, headers: CORS });

  const url = new URL(req.url);
  const partes = url.pathname.split("/").filter(Boolean);
  const rota = partes.slice(partes.indexOf("mcp") + 1);
  const caminho = "/" + rota.join("/");

  if (caminho.startsWith("/.well-known/oauth-protected-resource")) return json(recurso());

  try {
    const q = await autenticar(req);

    // ---- MCP
    if (caminho === "/") {
      if (req.method === "GET") {
        if (!q) return text(`Sala — servidor MCP. Adicione esta URL como conector no Claude ou no ChatGPT.\n${APP}\n`);
        return new Response(null, { status: 405, headers: CORS });
      }
      if (req.method === "DELETE") return new Response(null, { status: 204, headers: CORS });
      if (!q) return naoAutorizado();
      const body = await req.json().catch(() => null);
      if (body === null) return json({ jsonrpc: "2.0", id: null, error: { code: -32700, message: "JSON inválido" } }, 400);
      if (Array.isArray(body)) {
        const out = (await Promise.all(body.map((m) => mcp(q, m)))).filter(Boolean);
        return out.length ? json(out) : new Response(null, { status: 202, headers: CORS });
      }
      const out = await mcp(q, body);
      return out ? json(out) : new Response(null, { status: 202, headers: CORS });
    }

    // ---- API
    if (rota[0] !== "api") return text("Rota não encontrada.", 404);
    if (!q) return naoAutorizado();
    const [, rec, salaRef, acao] = rota;

    if (rec === "instrucoes") {
      const chave = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
      return text(await instrucoes(q, chave));
    }
    if (rec === "eu") return json({ pessoa: q.pessoa, agente: q.agente });
    if (rec === "salas" && !salaRef) return json(await salasDe(q));
    if (rec === "salas" && salaRef) {
      const s = await acharSala(q, decodeURIComponent(salaRef));
      if (acao === "mensagens" && req.method === "GET") {
        const ms = await ler(s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("limite")) || 50);
        return url.searchParams.get("formato") === "json" ? json(ms) : text(formatar(ms));
      }
      if (acao === "mensagens" && req.method === "POST") {
        const b = await req.json().catch(() => ({}));
        const m = await enviar(q, s.id, b.texto);
        return json({ id: m.id }, 201);
      }
      if (acao === "esperar") {
        const r = await esperar(q, s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("segundos")) || 50);
        return text(`ultimo=${r.ultimo}\n${r.novas.length ? formatar(r.novas) : ""}`);
      }
    }
    return text("Rota não encontrada.", 404);
  } catch (e) {
    const st = e instanceof Falha ? e.status : 400;
    return json({ erro: (e as Error).message }, st);
  }
});
