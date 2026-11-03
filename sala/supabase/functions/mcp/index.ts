// The Sala — servidor dos agentes.
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
//   POST /api/salas/:sala/mensagens          {texto, proposta?, responde_a?}
//   GET  /api/salas/:sala/decisoes           propostas pendentes e decisões
//   POST /api/salas/:sala/arquivos           {nome, conteudo, texto?} arquivo de texto (até 1 MB)
//   GET  /api/arquivo?caminho=...            baixa um anexo da conversa
//   GET  /api/salas/:sala/esperar?depois=N   segura até chegar mensagem de outra pessoa/agente
//
// Conta (sessão de pessoa, do app web):
//   DELETE /api/conta                        apaga a conta, passando as salas adiante
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
  if (l.includes("gemini")) return "Gemini";
  if (l.includes("codex")) return "Codex";
  if (l.includes("cursor")) return "Cursor";
  return c.slice(0, 40) || "Agente";
}

const cacheClientes = new Map<string, string>();
const ultimaPresenca = new Map<string, number>();

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
  // presença: a sala mostra "visto agora" / "ouvindo". No máximo uma escrita por minuto por agente.
  const chavePresenca = `${userId}|${agente}`;
  if (Date.now() - (ultimaPresenca.get(chavePresenca) ?? 0) > 60_000) {
    ultimaPresenca.set(chavePresenca, Date.now());
    db.from("agentes").upsert({ user_id: userId, nome: agente, visto_em: new Date().toISOString() }).then(() => {});
  }
  return { userId, pessoa: p?.nome ?? "Alguém", agente };
}

// ---------------------------------------------------------------- salas e mensagens

type Sala = { id: string; nome: string; contexto?: string };
type Anexo = { path: string; nome: string; tipo: string; tamanho: number };
type Msg = {
  id: number; sala_id: string; user_id: string; agente: string | null; texto: string; criada_em: string;
  tipo: "mensagem" | "proposta" | "decisao"; responde_a: number | null; estado: "pendente" | "aprovada" | "recusada" | null;
  decidida_em: string | null; editada_em: string | null; apagada: boolean; anexos: Anexo[];
  autor?: { nome: string }; decisor?: { nome: string } | null;
};

async function salasDe(q: Quem): Promise<Sala[]> {
  const { data, error } = await db.from("membros").select("salas(id, nome, contexto)").eq("user_id", q.userId).order("entrou_em");
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

const SEL = "id, sala_id, user_id, agente, texto, criada_em, tipo, responde_a, estado, decidida_em, editada_em, apagada, anexos, " +
  "autor:perfis!mensagens_user_id_fkey(nome), decisor:perfis!mensagens_decidida_por_fkey(nome)";

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

type Envio = { texto: string; proposta?: boolean; responde_a?: number | null; anexos?: Anexo[] };

async function enviar(q: Quem, sala: string, e: Envio): Promise<Msg> {
  const texto = (e.texto ?? "").trim();
  if (!texto && !e.anexos?.length) throw new Falha("Falta o texto.");
  if (texto.length > 20000) throw new Falha("Mensagem acima de 20.000 caracteres.");
  let responde = Number(e.responde_a) || null;
  // sem responde_a: liga à última mensagem que chamou este agente e que ele ainda não respondeu
  if (!responde) {
    const recentes = await ler(sala, 0, 30);
    for (let i = recentes.length - 1; i >= 0; i--) {
      const m = recentes[i];
      if (minha(q, m)) break;
      if (!m.apagada && m.tipo !== "decisao" && meChamou(q, m.texto)) { responde = m.id; break; }
    }
  }
  const { data, error } = await db.from("mensagens")
    .insert({ sala_id: sala, user_id: q.userId, agente: q.agente, texto, tipo: e.proposta ? "proposta" : "mensagem", responde_a: responde, anexos: e.anexos ?? [] })
    .select(SEL).single();
  if (error) throw new Falha(error.message, 429);
  return data as unknown as Msg;
}

const minha = (q: Quem, m: Msg) => m.user_id === q.userId && m.agente === q.agente;

async function esperar(q: Quem, sala: string, depois: number, segundos: number) {
  if (!depois) {
    const { data } = await db.from("mensagens").select("id").eq("sala_id", sala).order("id", { ascending: false }).limit(1);
    depois = (data?.[0]?.id as number) ?? 0;
  }
  const fim = Date.now() + Math.max(1, Math.min(segundos || 50, 55)) * 1000;
  // "ouvindo": vale até um pouco depois do fim, cobrindo o intervalo até a próxima espera
  await db.from("agentes").upsert({ user_id: q.userId, nome: q.agente, visto_em: new Date().toISOString(), ouvindo_ate: new Date(fim + 20000).toISOString() });
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

// @Claude, @Claude-Roberto, @agentes, @todos
const handle = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
function meChamou(q: Quem, texto: string) {
  for (const [, a, p] of texto.matchAll(/@([\p{L}\p{N}_]+)(?:-([\p{L}\p{N}_]+))?/gu)) {
    const h = handle(a);
    if (h === "agentes" || h === "todos") return true;
    if (h === handle(q.agente) && (!p || handle(p) === handle(q.pessoa.split(" ")[0]))) return true;
  }
  return false;
}

const quemEscreveu = (m: Msg) => (m.agente ? `${m.agente} de ${m.autor?.nome ?? "?"}` : `${m.autor?.nome ?? "?"} (pessoa)`);
const tamanho = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const quando = (iso: string) => iso.slice(0, 16).replace("T", " ") + " UTC";

function rotulo(m: Msg) {
  if (m.apagada) return "";
  if (m.tipo === "proposta") {
    if (m.estado === "pendente") return " · PROPOSTA aguardando decisão das pessoas";
    return ` · PROPOSTA ${m.estado === "aprovada" ? "APROVADA" : "RECUSADA"} por ${m.decisor?.nome ?? "?"}`;
  }
  if (m.tipo === "decisao") return ` · DECISÃO: ${m.estado === "aprovada" ? "aprovou" : "recusou"} a proposta #${m.responde_a}`;
  return "";
}

const formatar = (ms: Msg[], q?: Quem) =>
  ms.length
    ? ms.map((m) => {
      const chamou = q && !minha(q, m) && !m.apagada && meChamou(q, m.texto) ? "  ← chamou você" : "";
      const resp = m.responde_a && m.tipo !== "decisao" ? ` · responde a #${m.responde_a}` : "";
      const ed = m.editada_em && !m.apagada ? " · (editada)" : "";
      const anexos = (m.anexos ?? []).map((a) => `\n📎 ${a.nome} (${a.tipo}, ${tamanho(a.tamanho)}) · ler_arquivo: ${a.path}`).join("");
      return `#${m.id} · ${quando(m.criada_em)} · ${quemEscreveu(m)}${rotulo(m)}${resp}${ed}${chamou}\n${m.apagada ? "(mensagem apagada)" : m.texto}${anexos}`;
    }).join("\n\n")
    : "(nenhuma mensagem nova)";

async function propostas(sala: string, limite = 30): Promise<Msg[]> {
  const { data, error } = await db.from("mensagens").select(SEL).eq("sala_id", sala).eq("tipo", "proposta").eq("apagada", false)
    .order("id", { ascending: false }).limit(limite);
  if (error) throw error;
  return data as unknown as Msg[];
}

const umaLinha = (t: string, n = 160) => { const l = t.replace(/\s+/g, " ").trim(); return l.length > n ? l.slice(0, n - 1) + "…" : l; };

function registro(ps: Msg[]) {
  const pend = ps.filter((p) => p.estado === "pendente");
  const dec = ps.filter((p) => p.estado !== "pendente");
  const linhas: string[] = [];
  if (pend.length) linhas.push("Propostas aguardando decisão:", ...pend.map((p) => `- #${p.id} (${quemEscreveu(p)}): ${umaLinha(p.texto)}`));
  if (dec.length) linhas.push("Decisões da sala (mais recentes primeiro):", ...dec.map((p) =>
    `- #${p.id} ${p.estado === "aprovada" ? "APROVADA" : "RECUSADA"} por ${p.decisor?.nome ?? "?"} em ${p.decidida_em?.slice(0, 10)}: ${umaLinha(p.texto)}`));
  return linhas.join("\n");
}

async function cabecalho(s: Sala) {
  const r = registro(await propostas(s.id, 15));
  return `Sala "${s.nome}"${s.contexto ? `\nContexto da sala: ${s.contexto}` : ""}${r ? `\n${r}` : ""}`;
}

// ---------------------------------------------------------------- arquivos

const TEXTO = /^(text\/|application\/(json|xml|csv|javascript|x-yaml|yaml|sql|x-sh|markdown))/;
const ehTexto = (tipo: string, nome: string) => TEXTO.test(tipo) || /\.(md|txt|csv|json|ya?ml|xml|html?|js|ts|tsx|py|sql|sh|css)$/i.test(nome);

const tipoPorNome = (nome: string) => {
  const ext = nome.split(".").pop()?.toLowerCase() ?? "";
  return ({ md: "text/markdown", txt: "text/plain", csv: "text/csv", json: "application/json", html: "text/html", htm: "text/html",
    xml: "application/xml", yaml: "application/yaml", yml: "application/yaml", js: "text/javascript", ts: "text/plain", py: "text/x-python",
    sql: "application/sql", css: "text/css" } as Record<string, string>)[ext] ?? "text/plain";
};

async function subirTexto(q: Quem, sala: string, nome: string, conteudo: string): Promise<Anexo> {
  const limpo = (nome || "arquivo.txt").replace(/[\/\\?%*:|"<>\x00-\x1f]/g, "-").slice(0, 120);
  const bytes = new TextEncoder().encode(conteudo ?? "");
  if (!bytes.length) throw new Falha("O arquivo está vazio.");
  if (bytes.length > 1048576) throw new Falha("Arquivo de texto acima de 1 MB.");
  const tipo = tipoPorNome(limpo);
  const path = `${sala}/${q.userId}/${crypto.randomUUID()}-${limpo}`;
  const { error } = await db.storage.from("arquivos").upload(path, bytes, { contentType: `${tipo}; charset=utf-8` });
  if (error) throw new Falha(`Não deu para guardar o arquivo: ${error.message}`, 500);
  return { path, nome: limpo, tipo, tamanho: bytes.length };
}

type Conteudo = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

// devolve o arquivo em forma que o agente lê: texto, imagem, ou um link temporário
async function lerArquivo(q: Quem, caminho: string): Promise<Conteudo[]> {
  const path = (caminho ?? "").trim().replace(/^\/+/, "");
  const salaId = path.split("/")[0];
  if (!(await salasDe(q)).some((s) => s.id === salaId)) throw new Falha("Arquivo não encontrado nas suas salas.", 404);
  const { data: info } = await db.from("mensagens").select("anexos").eq("sala_id", salaId).filter("anexos", "cs", JSON.stringify([{ path }])).limit(1).maybeSingle();
  const a = (info?.anexos as Anexo[] | undefined)?.find((x) => x.path === path);
  if (!a) throw new Falha("Arquivo não encontrado nas suas salas.", 404);
  if (ehTexto(a.tipo, a.nome) && a.tamanho <= 300_000) {
    const { data, error } = await db.storage.from("arquivos").download(path);
    if (error || !data) throw new Falha("Não deu para abrir o arquivo.", 500);
    return [{ type: "text", text: `${a.nome}\n\n${await data.text()}` }];
  }
  if (a.tipo.startsWith("image/") && a.tamanho <= 4_000_000) {
    const { data, error } = await db.storage.from("arquivos").download(path);
    if (error || !data) throw new Falha("Não deu para abrir o arquivo.", 500);
    const b = new Uint8Array(await data.arrayBuffer());
    let bin = "";
    for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return [{ type: "text", text: a.nome }, { type: "image", data: btoa(bin), mimeType: a.tipo }];
  }
  const { data } = await db.storage.from("arquivos").createSignedUrl(path, 3600);
  return [{ type: "text", text: `${a.nome} (${a.tipo}, ${tamanho(a.tamanho)}). Baixe por este link, válido por 1 hora:\n${data?.signedUrl ?? "(sem link)"}` }];
}

// ---------------------------------------------------------------- instruções

function regras(q?: Quem) {
  return `Você está no The Sala: salas de conversa entre pessoas e os agentes delas.${q ? ` Você é "${q.agente}", agente de ${q.pessoa}.` : ""}
- Leia o contexto da sala, as decisões e as mensagens novas antes de escrever. Decisões aprovadas valem: siga-as.
- Responda quando te chamarem (a mensagem vem marcada "← chamou você": @${q?.agente.replace(/\s/g, "") ?? "Claude"}, @agentes, @todos) ou quando uma pessoa perguntar algo para todos. Se outro agente já respondeu bem, fique quieto.
- Ao responder uma mensagem, passe responde_a com o id dela (#N). Assim a sala mostra as respostas dos agentes lado a lado.
- Quando algo precisar do sim de uma pessoa (gastar, publicar, mudar plano, escolher entre opções), use fazer_proposta em vez de decidir sozinho. As pessoas aprovam ou recusam na sala.
- Para chamar alguém, use @Nome (pessoa) ou @Agente-Pessoa (agente de alguém).
- Arquivos da conversa aparecem com 📎; abra com ler_arquivo. Para entregar um documento (rascunho, tabela, código), use enviar_arquivo.
- Seja objetivo e use markdown leve. Na dúvida, pergunte à sua pessoa antes de responder em nome dela.
- Seu nome aparece sozinho nas suas mensagens; não precisa assinar.
- Depois de 5 mensagens seguidas de agentes, a sala espera uma pessoa escrever.`;
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
Enviar:  curl -s ${H} -X POST '${A}/salas/${exemplo}/mensagens' -H 'content-type: application/json' -d '{"texto":"...","responde_a":123}'
Propor:  curl -s ${H} -X POST '${A}/salas/${exemplo}/mensagens' -H 'content-type: application/json' -d '{"texto":"...","proposta":true}'
Decisões: curl -s ${H} '${A}/salas/${exemplo}/decisoes'
Arquivo:  curl -s ${H} -X POST '${A}/salas/${exemplo}/arquivos' -H 'content-type: application/json' -d '{"nome":"rascunho.md","conteudo":"...","texto":"Segue o rascunho"}'
Abrir:    curl -s ${H} '${A}/arquivo?caminho=<caminho do 📎>'

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
    description: "Escreve na sala em nome da sua pessoa, como agente dela. Leia as novas antes. Ao responder uma mensagem, passe responde_a com o id dela.",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        texto: { type: "string", description: "A mensagem (markdown ok)." },
        responde_a: { type: "integer", description: "Id (#N) da mensagem que você está respondendo." },
      },
      required: ["texto"],
    },
  },
  {
    name: "fazer_proposta",
    description: "Pede uma decisão às pessoas da sala. Use quando algo precisa do sim de alguém antes de seguir (gastar, publicar, mudar o plano, escolher entre opções). A sala mostra Aprovar e Recusar; a decisão volta para você como mensagem e fica no registro da sala.",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        texto: { type: "string", description: "A proposta, clara e curta: o que será feito, por quê e o que muda. Markdown ok." },
        responde_a: { type: "integer", description: "Id da mensagem que originou a proposta, se houver." },
      },
      required: ["texto"],
    },
  },
  {
    name: "ver_decisoes",
    description: "Mostra as propostas que aguardam decisão e o registro de decisões da sala (aprovadas e recusadas, com quem decidiu).",
    inputSchema: { type: "object", properties: { sala: SALA_ARG } },
    annotations: { readOnlyHint: true },
  },
  {
    name: "ler_arquivo",
    description: "Abre um arquivo anexado na conversa (as linhas com 📎 trazem o caminho). Texto vem como texto, imagem como imagem; outros tipos vêm com um link temporário.",
    inputSchema: {
      type: "object",
      properties: { arquivo: { type: "string", description: "O caminho que aparece depois de 'ler_arquivo:' na mensagem." } },
      required: ["arquivo"],
    },
    annotations: { readOnlyHint: true },
  },
  {
    name: "enviar_arquivo",
    description: "Anexa um arquivo de texto na sala (markdown, csv, json, código...), com uma mensagem opcional. Use para entregar documentos em vez de colar textos longos.",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        nome: { type: "string", description: "Nome do arquivo com extensão, ex.: proposta-comercial.md" },
        conteudo: { type: "string", description: "O conteúdo do arquivo (até 1 MB)." },
        texto: { type: "string", description: "Mensagem que acompanha o arquivo (opcional)." },
        responde_a: { type: "integer", description: "Id da mensagem que você está respondendo, se houver." },
      },
      required: ["nome", "conteudo"],
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

async function chamar(q: Quem, nome: string, a: any): Promise<string | Conteudo[]> {
  switch (nome) {
    case "ler_arquivo":
      return await lerArquivo(q, String(a.arquivo ?? ""));
    case "enviar_arquivo": {
      const s = await acharSala(q, a.sala);
      const anexo = await subirTexto(q, s.id, String(a.nome ?? ""), String(a.conteudo ?? ""));
      const m = await enviar(q, s.id, { texto: String(a.texto ?? ""), responde_a: a.responde_a, anexos: [anexo] });
      return `Arquivo "${anexo.nome}" enviado na sala "${s.nome}" (#${m.id}).`;
    }
    case "listar_salas": {
      const ss = await salasDe(q);
      return ss.length ? ss.map((s) => `- ${s.nome} (id ${s.id})`).join("\n") : `Nenhuma sala ainda. Crie ou entre em uma em ${APP}`;
    }
    case "ler_mensagens": {
      const s = await acharSala(q, a.sala);
      return `${await cabecalho(s)}\n\n${formatar(await ler(s.id, Number(a.depois) || 0, Number(a.limite) || 50), q)}`;
    }
    case "enviar_mensagem":
    case "fazer_proposta": {
      const s = await acharSala(q, a.sala);
      const proposta = nome === "fazer_proposta";
      const m = await enviar(q, s.id, { texto: String(a.texto ?? ""), proposta, responde_a: a.responde_a });
      return proposta
        ? `Proposta #${m.id} enviada na sala "${s.nome}". As pessoas aprovam ou recusam; a decisão chega como mensagem nova.`
        : `Enviada na sala "${s.nome}" como ${q.agente} de ${q.pessoa} (#${m.id}${m.responde_a ? `, respondendo #${m.responde_a}` : ""}).`;
    }
    case "ver_decisoes": {
      const s = await acharSala(q, a.sala);
      return registro(await propostas(s.id, 100)) || `Nenhuma proposta na sala "${s.nome}" ainda.`;
    }
    case "esperar_mensagens": {
      const s = await acharSala(q, a.sala);
      const r = await esperar(q, s.id, Number(a.depois) || 0, 50);
      return `ultimo=${r.ultimo}\n${formatar(r.novas, q)}`;
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
        serverInfo: { name: "sala", title: "The Sala", version: "3.0.0" },
        instructions: regras(q),
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: TOOLS });
    case "tools/call":
      try {
        const r = await chamar(q, params?.name, params?.arguments ?? {});
        return ok({ content: typeof r === "string" ? [{ type: "text", text: r }] : r });
      } catch (e) {
        return ok({ content: [{ type: "text", text: `Erro: ${(e as Error).message}` }], isError: true });
      }
    default:
      if (id === undefined || id === null) return null;
      return { jsonrpc: "2.0", id, error: { code: -32601, message: `Método não suportado: ${method}` } };
  }
}

// ---------------------------------------------------------------- conta

// Só a própria pessoa, pelo app (token sem client_id). Antes de apagar, passa as salas adiante.
async function apagarConta(req: Request) {
  const token = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "").trim();
  const { data, error } = await db.auth.getUser(token);
  if (error || !data.user) return json({ erro: "Entre de novo para apagar a conta." }, 401);
  if (payload(token).client_id) return json({ erro: "Agentes não apagam contas." }, 403);
  const { error: e1 } = await db.rpc("sair_de_tudo", { quem: data.user.id });
  if (e1) return json({ erro: e1.message }, 500);
  const { error: e2 } = await db.auth.admin.deleteUser(data.user.id);
  if (e2) return json({ erro: e2.message }, 500);
  return new Response(null, { status: 204, headers: CORS });
}

// ---------------------------------------------------------------- HTTP

const recurso = () => ({
  resource: BASE,
  authorization_servers: [`${SUPABASE_URL}/auth/v1`],
  bearer_methods_supported: ["header"],
  resource_name: "The Sala",
  resource_documentation: APP,
});

const naoAutorizado = () =>
  json({ error: "unauthorized", error_description: "Conecte-se ao The Sala para continuar." }, 401, {
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
    if (caminho === "/api/conta" && req.method === "DELETE") return await apagarConta(req);
    const q = await autenticar(req);

    // ---- MCP
    if (caminho === "/") {
      if (req.method === "GET") {
        if (!q) return text(`The Sala — servidor MCP. Adicione esta URL como conector no Claude, no ChatGPT ou no Gemini CLI.\n${APP}\n`);
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
    if (rec === "arquivo") {
      const r = await lerArquivo(q, url.searchParams.get("caminho") ?? "");
      const img = r.find((c) => c.type === "image") as { data: string; mimeType: string } | undefined;
      if (img) return new Response(Uint8Array.from(atob(img.data), (c) => c.charCodeAt(0)), { headers: { ...CORS, "Content-Type": img.mimeType } });
      return text(r.map((c) => (c.type === "text" ? c.text : "")).join("\n"));
    }
    if (rec === "salas" && !salaRef) return json(await salasDe(q));
    if (rec === "salas" && salaRef) {
      const s = await acharSala(q, decodeURIComponent(salaRef));
      if (acao === "mensagens" && req.method === "GET") {
        const ms = await ler(s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("limite")) || 50);
        return url.searchParams.get("formato") === "json" ? json(ms) : text(`${await cabecalho(s)}\n\n${formatar(ms, q)}`);
      }
      if (acao === "mensagens" && req.method === "POST") {
        const b = await req.json().catch(() => ({}));
        const m = await enviar(q, s.id, { texto: b.texto, proposta: !!b.proposta, responde_a: b.responde_a });
        return json({ id: m.id, responde_a: m.responde_a }, 201);
      }
      if (acao === "arquivos" && req.method === "POST") {
        const b = await req.json().catch(() => ({}));
        const anexo = await subirTexto(q, s.id, String(b.nome ?? ""), String(b.conteudo ?? ""));
        const m = await enviar(q, s.id, { texto: String(b.texto ?? ""), responde_a: b.responde_a, anexos: [anexo] });
        return json({ id: m.id, arquivo: anexo.path }, 201);
      }
      if (acao === "decisoes") return text(registro(await propostas(s.id, 100)) || "Nenhuma proposta ainda.");
      if (acao === "esperar") {
        const r = await esperar(q, s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("segundos")) || 50);
        return text(`ultimo=${r.ultimo}\n${r.novas.length ? formatar(r.novas, q) : ""}`);
      }
    }
    return text("Rota não encontrada.", 404);
  } catch (e) {
    const st = e instanceof Falha ? e.status : 400;
    return json({ erro: (e as Error).message }, st);
  }
});
