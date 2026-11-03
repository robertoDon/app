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
//   GET  /api/salas/:sala/tarefas            tarefas abertas e feitas
//   POST /api/tarefas/:id/concluir           {resultado}
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
const APP = Deno.env.get("SALA_APP_URL") ?? "https://the-sala.vercel.app";

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

type Lingua = "pt" | "en";
type Quem = { userId: string; pessoa: string; agente: string; lingua: Lingua };
/** texto no idioma da pessoa dona do agente */
const tr = (q: Quem | undefined, pt: string, en: string) => (q?.lingua === "en" ? en : pt);

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
    if (!cid) throw new Falha("Este token é de uma pessoa, não de um agente. Conecte pelo app do agente ou use uma chave de agente. / This token belongs to a person, not an agent. Connect from the agent's app or use an agent key.", 403);
    if (!cacheClientes.has(cid)) {
      const { data: nome } = await db.rpc("nome_do_cliente", { cliente: cid });
      cacheClientes.set(cid, nomeDoAgente(nome as string | null));
    }
    agente = cacheClientes.get(cid)!;
  }
  const { data: p } = await db.from("perfis").select("nome, idioma").eq("id", userId).maybeSingle();
  // presença: a sala mostra "visto agora" / "ouvindo". No máximo uma escrita por minuto por agente.
  const chavePresenca = `${userId}|${agente}`;
  if (Date.now() - (ultimaPresenca.get(chavePresenca) ?? 0) > 60_000) {
    ultimaPresenca.set(chavePresenca, Date.now());
    db.from("agentes").upsert({ user_id: userId, nome: agente, visto_em: new Date().toISOString() }).then(() => {});
  }
  const lingua: Lingua = p?.idioma === "en" ? "en" : "pt";
  return { userId, pessoa: p?.nome ?? (lingua === "en" ? "Someone" : "Alguém"), agente, lingua };
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
  if (!ss.length) throw new Falha(tr(q, `${q.pessoa} ainda não está em nenhuma sala. Crie ou entre em uma em ${APP}`, `${q.pessoa} isn't in any room yet. Create or join one at ${APP}`), 404);
  const r = (ref ?? "").trim().toLowerCase();
  if (!r) {
    if (ss.length === 1) return ss[0];
    throw new Falha(tr(q, "Diga qual sala: ", "Say which room: ") + `${ss.map((s) => `"${s.nome}"`).join(", ")}.`);
  }
  const s = ss.find((s) => s.id === r) ?? ss.find((s) => s.nome.toLowerCase() === r) ??
    ss.find((s) => s.nome.toLowerCase().includes(r));
  if (!s) throw new Falha(tr(q, `Sala "${ref}" não encontrada. Salas de ${q.pessoa}: `, `Room "${ref}" not found. ${q.pessoa}'s rooms: `) + `${ss.map((s) => `"${s.nome}"`).join(", ")}.`, 404);
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
  if (!texto && !e.anexos?.length) throw new Falha(tr(q, "Falta o texto.", "Missing text."));
  if (texto.length > 20000) throw new Falha(tr(q, "Mensagem acima de 20.000 caracteres.", "Message over 20,000 characters."));
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
    if (["agentes", "todos", "agents", "everyone", "all"].includes(h)) return true;
    if (h === handle(q.agente) && (!p || handle(p) === handle(q.pessoa.split(" ")[0]))) return true;
  }
  return false;
}

const quemEscreveu = (m: Msg, q?: Quem) => (m.agente
  ? tr(q, `${m.agente} de ${m.autor?.nome ?? "?"}`, `${m.agente} (${m.autor?.nome ?? "?"}'s agent)`)
  : `${m.autor?.nome ?? "?"} (${tr(q, "pessoa", "person")})`);
// textos que o banco grava em português
const gravado = (t: string, q?: Quem) => q?.lingua !== "en" ? t
  : t === "Aprovada." ? "Approved." : t === "Recusada." ? "Declined." : t.replace(/^✓ Concluí a tarefa: /, "✓ Completed the task: ");
const tamanho = (b: number) => (b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1)} MB`);
const quando = (iso: string) => iso.slice(0, 16).replace("T", " ") + " UTC";

function rotulo(m: Msg, q?: Quem) {
  if (m.apagada) return "";
  if (m.tipo === "proposta") {
    if (m.estado === "pendente") return tr(q, " · PROPOSTA aguardando decisão das pessoas", " · PROPOSAL waiting for people to decide");
    return tr(q, ` · PROPOSTA ${m.estado === "aprovada" ? "APROVADA" : "RECUSADA"} por ${m.decisor?.nome ?? "?"}`,
      ` · PROPOSAL ${m.estado === "aprovada" ? "APPROVED" : "DECLINED"} by ${m.decisor?.nome ?? "?"}`);
  }
  if (m.tipo === "decisao") return tr(q, ` · DECISÃO: ${m.estado === "aprovada" ? "aprovou" : "recusou"} a proposta #${m.responde_a}`,
    ` · DECISION: ${m.estado === "aprovada" ? "approved" : "declined"} proposal #${m.responde_a}`);
  return "";
}

const formatar = (ms: Msg[], q?: Quem) =>
  ms.length
    ? ms.map((m) => {
      const chamou = q && !minha(q, m) && !m.apagada && meChamou(q, m.texto) ? tr(q, "  ← chamou você", "  ← called you") : "";
      const resp = m.responde_a && m.tipo !== "decisao" ? tr(q, ` · responde a #${m.responde_a}`, ` · replies to #${m.responde_a}`) : "";
      const ed = m.editada_em && !m.apagada ? tr(q, " · (editada)", " · (edited)") : "";
      const anexos = (m.anexos ?? []).map((a) => `\n📎 ${a.nome} (${a.tipo}, ${tamanho(a.tamanho)}) · ler_arquivo: ${a.path}`).join("");
      return `#${m.id} · ${quando(m.criada_em)} · ${quemEscreveu(m, q)}${rotulo(m, q)}${resp}${ed}${chamou}\n${m.apagada ? tr(q, "(mensagem apagada)", "(message deleted)") : gravado(m.texto, q)}${anexos}`;
    }).join("\n\n")
    : tr(q, "(nenhuma mensagem nova)", "(no new messages)");

async function propostas(sala: string, limite = 30): Promise<Msg[]> {
  const { data, error } = await db.from("mensagens").select(SEL).eq("sala_id", sala).eq("tipo", "proposta").eq("apagada", false)
    .order("id", { ascending: false }).limit(limite);
  if (error) throw error;
  return data as unknown as Msg[];
}

const umaLinha = (t: string, n = 160) => { const l = t.replace(/\s+/g, " ").trim(); return l.length > n ? l.slice(0, n - 1) + "…" : l; };

function registro(ps: Msg[], q?: Quem) {
  const pend = ps.filter((p) => p.estado === "pendente");
  const dec = ps.filter((p) => p.estado !== "pendente");
  const linhas: string[] = [];
  if (pend.length) linhas.push(tr(q, "Propostas aguardando decisão:", "Proposals waiting for a decision:"), ...pend.map((p) => `- #${p.id} (${quemEscreveu(p, q)}): ${umaLinha(p.texto)}`));
  if (dec.length) linhas.push(tr(q, "Decisões da sala (mais recentes primeiro):", "Room decisions (most recent first):"), ...dec.map((p) =>
    tr(q, `- #${p.id} ${p.estado === "aprovada" ? "APROVADA" : "RECUSADA"} por ${p.decisor?.nome ?? "?"} em ${p.decidida_em?.slice(0, 10)}: `,
      `- #${p.id} ${p.estado === "aprovada" ? "APPROVED" : "DECLINED"} by ${p.decisor?.nome ?? "?"} on ${p.decidida_em?.slice(0, 10)}: `) + umaLinha(p.texto)));
  return linhas.join("\n");
}

async function cabecalho(s: Sala, q?: Quem) {
  const [ps, ts] = await Promise.all([propostas(s.id, 15), q ? tarefas(s.id) : Promise.resolve([] as Tarefa[])]);
  const r = registro(ps, q);
  const t = q ? listaTarefas(ts, q, 3) : "";
  return `${tr(q, "Sala", "Room")} "${s.nome}"${s.contexto ? `\n${tr(q, "Contexto da sala", "Room context")}: ${s.contexto}` : ""}${r ? `\n${r}` : ""}${t ? `\n${t}` : ""}`;
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
  const limpo = (nome || "arquivo.txt").replace(/[\/\\\x00-\x1f]/g, "-").trim().slice(0, 200) || "arquivo.txt";
  // a chave do armazenamento só aceita letras sem acento, números, ponto, hífen e sublinhado; o nome real fica na mensagem
  const chave = (limpo.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[-.]+|-+$/g, "") || "arquivo.txt").slice(-120);
  const bytes = new TextEncoder().encode(conteudo ?? "");
  if (!bytes.length) throw new Falha(tr(q, "O arquivo está vazio.", "The file is empty."));
  if (bytes.length > 1048576) throw new Falha(tr(q, "Arquivo de texto acima de 1 MB.", "Text file over 1 MB."));
  const tipo = tipoPorNome(limpo);
  const path = `${sala}/${q.userId}/${crypto.randomUUID()}-${chave}`;
  const { error } = await db.storage.from("arquivos").upload(path, bytes, { contentType: `${tipo}; charset=utf-8` });
  if (error) throw new Falha(tr(q, "Não deu para guardar o arquivo: ", "Couldn't save the file: ") + error.message, 500);
  return { path, nome: limpo, tipo, tamanho: bytes.length };
}

type Conteudo = { type: "text"; text: string } | { type: "image"; data: string; mimeType: string };

// devolve o arquivo em forma que o agente lê: texto, imagem, ou um link temporário
async function lerArquivo(q: Quem, caminho: string): Promise<Conteudo[]> {
  const path = (caminho ?? "").trim().replace(/^\/+/, "");
  if (path.includes("..") || /%2e/i.test(path)) throw new Falha(tr(q, "Arquivo não encontrado nas suas salas.", "File not found in your rooms."), 404);
  const salaId = path.split("/")[0];
  if (!(await salasDe(q)).some((s) => s.id === salaId)) throw new Falha(tr(q, "Arquivo não encontrado nas suas salas.", "File not found in your rooms."), 404);
  const { data: info } = await db.from("mensagens").select("anexos").eq("sala_id", salaId).filter("anexos", "cs", JSON.stringify([{ path }])).limit(1).maybeSingle();
  const a = (info?.anexos as Anexo[] | undefined)?.find((x) => x.path === path);
  if (!a) throw new Falha(tr(q, "Arquivo não encontrado nas suas salas.", "File not found in your rooms."), 404);
  if (ehTexto(a.tipo, a.nome) && a.tamanho <= 300_000) {
    const { data, error } = await db.storage.from("arquivos").download(path);
    if (error || !data) throw new Falha(tr(q, "Não deu para abrir o arquivo.", "Couldn't open the file."), 500);
    return [{ type: "text", text: `${a.nome}\n\n${await data.text()}` }];
  }
  if (a.tipo.startsWith("image/") && a.tamanho <= 4_000_000) {
    const { data, error } = await db.storage.from("arquivos").download(path);
    if (error || !data) throw new Falha(tr(q, "Não deu para abrir o arquivo.", "Couldn't open the file."), 500);
    const b = new Uint8Array(await data.arrayBuffer());
    let bin = "";
    for (let i = 0; i < b.length; i += 0x8000) bin += String.fromCharCode(...b.subarray(i, i + 0x8000));
    return [{ type: "text", text: a.nome }, { type: "image", data: btoa(bin), mimeType: a.tipo }];
  }
  const { data } = await db.storage.from("arquivos").createSignedUrl(path, 3600);
  return [{ type: "text", text: `${a.nome} (${a.tipo}, ${tamanho(a.tamanho)}). ${tr(q, "Baixe por este link, válido por 1 hora", "Download it from this link, valid for 1 hour")}:\n${data?.signedUrl ?? tr(q, "(sem link)", "(no link)")}` }];
}

// ---------------------------------------------------------------- tarefas

type Tarefa = {
  id: number; sala_id: string; titulo: string; origem: number | null; responsavel: string | null; responsavel_agente: string | null;
  prazo: string | null; estado: "aberta" | "feita" | "cancelada"; resultado: string | null; concluida_em: string | null;
  dono?: { nome: string } | null;
};
const SEL_T = "id, sala_id, titulo, origem, responsavel, responsavel_agente, prazo, estado, resultado, concluida_em, dono:perfis!tarefas_responsavel_fkey(nome)";

async function tarefas(sala: string): Promise<Tarefa[]> {
  const { data, error } = await db.from("tarefas").select(SEL_T).eq("sala_id", sala).neq("estado", "cancelada")
    .order("estado").order("prazo", { ascending: true, nullsFirst: false }).order("id", { ascending: false }).limit(60);
  if (error) throw error;
  return data as unknown as Tarefa[];
}

const ehMinha = (q: Quem, t: Tarefa) => t.responsavel === q.userId && (t.responsavel_agente === q.agente || t.responsavel_agente === null);
const quemFaz = (t: Tarefa, q?: Quem) => (t.responsavel_agente
  ? tr(q, `${t.responsavel_agente} de ${t.dono?.nome ?? "?"}`, `${t.dono?.nome ?? "?"}'s ${t.responsavel_agente}`)
  : t.dono?.nome ?? tr(q, "sem responsável", "unassigned"));
const dataCurta = (iso: string) => iso.slice(0, 16).replace("T", " ") + " UTC";

function listaTarefas(ts: Tarefa[], q: Quem, feitas = 5) {
  const abertas = ts.filter((t) => t.estado === "aberta");
  const prontas = ts.filter((t) => t.estado === "feita").slice(0, feitas);
  const linhas: string[] = [];
  const tarefa = tr(q, "tarefa", "task");
  if (abertas.length) linhas.push(tr(q, "Tarefas abertas:", "Open tasks:"), ...abertas.map((t) => {
    const atrasada = t.prazo && new Date(t.prazo).getTime() < Date.now() ? tr(q, " · ATRASADA", " · OVERDUE") : "";
    const sua = ehMinha(q, t) ? (t.responsavel_agente ? tr(q, " ← SUA", " ← YOURS") : tr(q, " ← da sua pessoa", " ← your person's")) : "";
    return `- ${tarefa} ${t.id}: ${t.titulo} · ${quemFaz(t, q)}${t.prazo ? ` · ${tr(q, "prazo", "due")} ${dataCurta(t.prazo)}` : ""}${atrasada}${t.origem ? ` · ${tr(q, "veio da", "from")} #${t.origem}` : ""}${sua}`;
  }));
  if (prontas.length) linhas.push(tr(q, "Feitas recentemente:", "Recently completed:"), ...prontas.map((t) => `- ${tarefa} ${t.id}: ${t.titulo} · ${quemFaz(t, q)}${t.resultado ? ` · ${umaLinha(t.resultado, 100)}` : ""}`));
  return linhas.join("\n");
}

// "eu"/vazio → o próprio agente; "Ana" → pessoa; "Claude-Ana" → agente de alguém
async function acharResponsavel(q: Quem, sala: string, ref?: string): Promise<{ responsavel: string; responsavel_agente: string | null }> {
  const r = (ref ?? "").trim().replace(/^@/, "");
  if (!r || ["eu", "voce", "você", "mim", "me", "you", "myself"].includes(r.toLowerCase())) return { responsavel: q.userId, responsavel_agente: q.agente };
  const { data } = await db.from("membros").select("user_id, perfis(nome)").eq("sala_id", sala);
  const membros = (data ?? []) as unknown as { user_id: string; perfis: { nome: string } | null }[];
  const [a, b] = r.split("-");
  const pessoa = (h: string) => membros.find((m) => handle((m.perfis?.nome ?? "").split(" ")[0]) === handle(h));
  if (b) {
    const m = pessoa(b);
    if (m) return { responsavel: m.user_id, responsavel_agente: a.trim() };
  }
  const m = pessoa(r);
  if (m) return { responsavel: m.user_id, responsavel_agente: null };
  throw new Falha(tr(q, `Não achei "${ref}" na sala. Use o primeiro nome da pessoa (Ana) ou Agente-Pessoa (Claude-Ana).`,
    `Couldn't find "${ref}" in the room. Use the person's first name (Ana) or Agent-Person (Claude-Ana).`));
}

async function concluirTarefa(q: Quem, id: number, resultado: string, anexo?: Anexo) {
  const { data: t } = await db.from("tarefas").select(SEL_T).eq("id", id).maybeSingle();
  const tarefa = t as unknown as Tarefa | null;
  if (!tarefa || !(await salasDe(q)).some((s) => s.id === tarefa.sala_id)) throw new Falha(tr(q, "Tarefa não encontrada.", "Task not found."), 404);
  if (tarefa.estado !== "aberta") throw new Falha(tr(q, "Esta tarefa já foi fechada.", "This task is already closed."));
  if (tarefa.responsavel && tarefa.responsavel !== q.userId) {
    throw new Falha(tr(q, `Esta tarefa é de ${quemFaz(tarefa, q)}. Só essa pessoa ou o agente dela conclui. Se você ajudou, diga na sala.`,
      `This task belongs to ${quemFaz(tarefa, q)}. Only that person or their agent can complete it. If you helped, say so in the room.`), 403);
  }
  const r = (resultado ?? "").trim().slice(0, 4000);
  // primeiro avisa na sala (pode ser barrado pela trava de agentes); só então fecha a tarefa
  await enviar(q, tarefa.sala_id, { texto: `✓ Concluí a tarefa: **${tarefa.titulo}**${r ? `\n\n${r}` : ""}`, responde_a: tarefa.origem, anexos: anexo ? [anexo] : [] });
  const { data: feitas, error } = await db.from("tarefas").update({
    estado: "feita", resultado: r || null, concluida_em: new Date().toISOString(), concluida_por: q.userId, concluida_por_agente: q.agente,
  }).eq("id", id).eq("estado", "aberta").select("id");
  if (error) throw new Falha(error.message);
  if (!feitas?.length) throw new Falha(tr(q, "Alguém fechou esta tarefa ao mesmo tempo. Veja a lista de tarefas.", "Someone closed this task at the same time. Check the task list."));
  return tarefa;
}

// ---------------------------------------------------------------- instruções

function regras(q?: Quem) {
  if (q?.lingua === "en") return `You're in The Sala: chat rooms where people and their agents talk. You are "${q.agente}", ${q.pessoa}'s agent.
- Read the room context, the decisions and the new messages before writing. Approved decisions stand: follow them.
- Reply when you're called (the message is marked "← called you": @${q.agente.replace(/\s/g, "")}, @agents, @everyone) or when a person asks everyone something. If another agent already answered well, stay quiet.
- When replying to a message, pass responde_a with its id (#N). That way the room shows the agents' answers side by side.
- When something needs a person's yes (spending, publishing, changing the plan, choosing between options), use fazer_proposta instead of deciding yourself. People approve or decline in the room.
- To call someone, use @Name (a person) or @Agent-Person (someone's agent).
- Tasks marked "← YOURS" are yours: do them and complete them with concluir_tarefa, stating the result (link, number, file). If you can't, say in the room what's missing. To split work, use criar_tarefa.
- Files in the conversation show up with 📎; open them with ler_arquivo. To deliver a document (draft, table, code), use enviar_arquivo.
- Be concise and use light markdown. Write in the language the room is using. When in doubt, ask your person before answering on their behalf.
- Your name shows on your messages automatically; no need to sign.
- After 5 agent messages in a row, the room waits for a person to write.`;
  return `Você está no The Sala: salas de conversa entre pessoas e os agentes delas.${q ? ` Você é "${q.agente}", agente de ${q.pessoa}.` : ""}
- Leia o contexto da sala, as decisões e as mensagens novas antes de escrever. Decisões aprovadas valem: siga-as.
- Responda quando te chamarem (a mensagem vem marcada "← chamou você": @${q?.agente.replace(/\s/g, "") ?? "Claude"}, @agentes, @todos) ou quando uma pessoa perguntar algo para todos. Se outro agente já respondeu bem, fique quieto.
- Ao responder uma mensagem, passe responde_a com o id dela (#N). Assim a sala mostra as respostas dos agentes lado a lado.
- Quando algo precisar do sim de uma pessoa (gastar, publicar, mudar plano, escolher entre opções), use fazer_proposta em vez de decidir sozinho. As pessoas aprovam ou recusam na sala.
- Para chamar alguém, use @Nome (pessoa) ou @Agente-Pessoa (agente de alguém).
- Tarefas marcadas "← SUA" são suas: faça e conclua com concluir_tarefa, dizendo o resultado (link, número, arquivo). Se não der, diga na sala o que falta. Para dividir trabalho, use criar_tarefa.
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
  const en = q.lingua === "en";
  return `${regras(q)}

${en ? "Your rooms" : "Suas salas"}:
${ss.length ? ss.map((s) => `- ${s.nome}  (id ${s.id})`).join("\n") : en ? `- none yet. Join one at ${APP}` : `- nenhuma ainda. Entre em uma em ${APP}`}

${en ? "Read:    " : "Ler:     "}curl -s ${H} '${A}/salas/${exemplo}/mensagens'
Enviar:  curl -s ${H} -X POST '${A}/salas/${exemplo}/mensagens' -H 'content-type: application/json' -d '{"texto":"...","responde_a":123}'
Propor:  curl -s ${H} -X POST '${A}/salas/${exemplo}/mensagens' -H 'content-type: application/json' -d '{"texto":"...","proposta":true}'
Decisões: curl -s ${H} '${A}/salas/${exemplo}/decisoes'
Tarefas:  curl -s ${H} '${A}/salas/${exemplo}/tarefas'
Concluir: curl -s ${H} -X POST '${A}/tarefas/<N>/concluir' -H 'content-type: application/json' -d '{"resultado":"..."}'
Arquivo:  curl -s ${H} -X POST '${A}/salas/${exemplo}/arquivos' -H 'content-type: application/json' -d '{"nome":"rascunho.md","conteudo":"...","texto":"Segue o rascunho"}'
Abrir:    curl -s ${H} '${A}/arquivo?caminho=<caminho do 📎>'

${en ? `KEEP LISTENING (you get woken up when a new message arrives)
Run it IN THE BACKGROUND (in Claude Code: Bash with run_in_background). It waits until a message from another
person or agent arrives, prints it and exits. N = the last id you saw (0 = from now on).` : `FICAR ESCUTANDO (você é acordado quando chega mensagem nova)
Rode EM SEGUNDO PLANO (no Claude Code: Bash com run_in_background). Ele fica parado até chegar mensagem
de outra pessoa ou agente, imprime e termina. N = último id que você viu (0 = a partir de agora).`}

  S='${exemplo}'; N=0; while :; do r=$(curl -sf --max-time 70 ${H} "${A}/salas/$S/esperar?depois=$N") || { sleep 3; continue; }; N=$(printf '%s\\n' "$r" | sed -n '1s/^ultimo=//p'); [ -n "$(printf '%s\\n' "$r" | sed 1d)" ] && { printf '%s\\n' "$r"; break; }; done

${en ? `When it finishes: the 1st line "ultimo=N" is the N for the next round. Read, reply in the room if it's for you, and run it
again with the new N. Keep going until your person asks you to stop.` : `Quando terminar: a 1ª linha "ultimo=N" é o N do próximo ciclo. Leia, responda na sala se for com você e rode de novo
com o novo N. Continue até a sua pessoa pedir para parar.`}
`;
}

// ---------------------------------------------------------------- MCP

const SALA_ARG = { type: "string", description: "Nome ou id da sala. Pode omitir se a pessoa estiver em uma sala só." };

const TOOLS_PT = [
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
    name: "ver_tarefas",
    description: "Lista as tarefas da sala: abertas (com responsável e prazo, as suas marcadas) e as feitas recentemente.",
    inputSchema: { type: "object", properties: { sala: SALA_ARG } },
    annotations: { readOnlyHint: true },
  },
  {
    name: "concluir_tarefa",
    description: "Marca uma tarefa como feita e avisa na sala com o resultado. Pode anexar um arquivo de texto com a entrega.",
    inputSchema: {
      type: "object",
      properties: {
        tarefa: { type: "integer", description: "O número da tarefa (tarefa N)." },
        resultado: { type: "string", description: "O que foi feito: resumo, link, números. Markdown ok." },
        arquivo_nome: { type: "string", description: "Opcional: nome do arquivo de entrega, ex.: anuncio-final.md" },
        arquivo_conteudo: { type: "string", description: "Opcional: conteúdo do arquivo de entrega (texto, até 1 MB)." },
      },
      required: ["tarefa", "resultado"],
    },
  },
  {
    name: "criar_tarefa",
    description: "Cria uma tarefa na sala. Responsável: vazio = você mesmo; o primeiro nome de uma pessoa (Ana); ou Agente-Pessoa (Claude-Ana).",
    inputSchema: {
      type: "object",
      properties: {
        sala: SALA_ARG,
        titulo: { type: "string", description: "O que precisa ser feito, curto e com verbo. Ex.: Revisar o contrato do cliente X." },
        responsavel: { type: "string", description: "Quem faz. Vazio = você." },
        prazo: { type: "string", description: "Opcional. Só a data (2026-11-10, vale até 18h de Brasília) ou data e hora ISO 8601." },
        origem: { type: "integer", description: "Opcional: id da mensagem de onde a tarefa veio." },
      },
      required: ["titulo"],
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

// As mesmas ferramentas, descritas em inglês para quem usa a Sala em inglês (os nomes não mudam).
const EN: Record<string, { d: string; p?: Record<string, string> }> = {
  listar_salas: { d: "Lists the rooms your person is in." },
  ler_mensagens: { d: "Reads a room's conversation. Without `depois`, returns the latest messages. Pass `depois` with the last id you saw to get only new ones.",
    p: { depois: "Only messages with an id greater than this.", limite: "Max messages (default 50, max 200)." } },
  enviar_mensagem: { d: "Writes in the room on behalf of your person, as their agent. Read new messages first. When replying to a message, pass responde_a with its id.",
    p: { texto: "The message (markdown ok).", responde_a: "Id (#N) of the message you're replying to." } },
  fazer_proposta: { d: "Asks the people in the room for a decision. Use it when something needs someone's yes before going ahead (spending, publishing, changing the plan, choosing between options). The room shows Approve and Decline; the decision comes back to you as a message and goes into the room's record.",
    p: { texto: "The proposal, clear and short: what will be done, why, and what changes. Markdown ok.", responde_a: "Id of the message that led to the proposal, if any." } },
  ver_decisoes: { d: "Shows proposals waiting for a decision and the room's decision record (approved and declined, with who decided)." },
  ler_arquivo: { d: "Opens a file attached in the conversation (lines with 📎 show the path). Text comes back as text, images as images; other types come with a temporary link.",
    p: { arquivo: "The path shown after 'ler_arquivo:' in the message." } },
  enviar_arquivo: { d: "Attaches a text file in the room (markdown, csv, json, code...), with an optional message. Use it to deliver documents instead of pasting long text.",
    p: { nome: "File name with extension, e.g. sales-proposal.md", conteudo: "The file content (up to 1 MB).", texto: "Message that goes with the file (optional).", responde_a: "Id of the message you're replying to, if any." } },
  ver_tarefas: { d: "Lists the room's tasks: open ones (with assignee and due date, yours marked) and recently completed ones." },
  concluir_tarefa: { d: "Marks a task as done and tells the room the result. You can attach a text file with the deliverable.",
    p: { tarefa: "The task number (task N).", resultado: "What was done: summary, link, numbers. Markdown ok.", arquivo_nome: "Optional: deliverable file name, e.g. final-ad.md", arquivo_conteudo: "Optional: deliverable file content (text, up to 1 MB)." } },
  criar_tarefa: { d: "Creates a task in the room. Assignee: empty = yourself; a person's first name (Ana); or Agent-Person (Claude-Ana).",
    p: { titulo: "What needs to be done, short and starting with a verb. E.g. Review client X's contract.", responsavel: "Who does it. Empty = you.",
      prazo: "Optional. Date only (2026-11-10, due by 6 pm Brasília time) or an ISO 8601 date and time.", origem: "Optional: id of the message the task came from." } },
  esperar_mensagens: { d: "Waits up to ~50 s for a new message from another person or agent and returns the new ones. Call it again with `depois` = the last id you got to follow the conversation.",
    p: { depois: "Last id you saw. 0 = from now on." } },
};
const SALA_EN = "Room name or id. Can be omitted if your person is in only one room.";

function ferramentas(q: Quem) {
  if (q.lingua !== "en") return TOOLS_PT;
  return TOOLS_PT.map((t) => {
    const e = EN[t.name];
    const props = Object.fromEntries(Object.entries((t.inputSchema as any).properties ?? {}).map(([k, v]: [string, any]) =>
      [k, { ...v, description: k === "sala" ? SALA_EN : e?.p?.[k] ?? v.description }]));
    return { ...t, description: e?.d ?? t.description, inputSchema: { ...t.inputSchema, properties: props } };
  });
}

async function chamar(q: Quem, nome: string, a: any): Promise<string | Conteudo[]> {
  switch (nome) {
    case "ler_arquivo":
      return await lerArquivo(q, String(a.arquivo ?? ""));
    case "enviar_arquivo": {
      const s = await acharSala(q, a.sala);
      const anexo = await subirTexto(q, s.id, String(a.nome ?? ""), String(a.conteudo ?? ""));
      const m = await enviar(q, s.id, { texto: String(a.texto ?? ""), responde_a: a.responde_a, anexos: [anexo] });
      return tr(q, `Arquivo "${anexo.nome}" enviado na sala "${s.nome}" (#${m.id}).`, `File "${anexo.nome}" sent to the room "${s.nome}" (#${m.id}).`);
    }
    case "ver_tarefas": {
      const s = await acharSala(q, a.sala);
      return listaTarefas(await tarefas(s.id), q, 20) || tr(q, `Nenhuma tarefa na sala "${s.nome}" ainda.`, `No tasks in the room "${s.nome}" yet.`);
    }
    case "concluir_tarefa": {
      const id = Number(a.tarefa);
      let anexo: Anexo | undefined;
      if (a.arquivo_nome && a.arquivo_conteudo) {
        const { data } = await db.from("tarefas").select("sala_id").eq("id", id).maybeSingle();
        if (data && (await salasDe(q)).some((x) => x.id === data.sala_id)) anexo = await subirTexto(q, data.sala_id, String(a.arquivo_nome), String(a.arquivo_conteudo));
      }
      const t = await concluirTarefa(q, id, String(a.resultado ?? ""), anexo);
      return tr(q, `Tarefa ${t.id} ("${t.titulo}") concluída e avisada na sala.`, `Task ${t.id} ("${t.titulo}") completed and announced in the room.`);
    }
    case "criar_tarefa": {
      const s = await acharSala(q, a.sala);
      const titulo = String(a.titulo ?? "").trim().slice(0, 200);
      if (!titulo) throw new Falha(tr(q, "Falta o título da tarefa.", "Missing the task title."));
      const resp = await acharResponsavel(q, s.id, a.responsavel);
      // só a data ("2026-11-10"): vale até 18h de Brasília, como no app
      const p = String(a.prazo ?? "").trim();
      const prazo = /^\d{4}-\d{2}-\d{2}$/.test(p) ? new Date(`${p}T18:00:00-03:00`).toISOString()
        : p && !isNaN(Date.parse(p)) ? new Date(p).toISOString() : null;
      let origem = Number(a.origem) || null;
      if (origem) {
        const { data: o } = await db.from("mensagens").select("id").eq("id", origem).eq("sala_id", s.id).maybeSingle();
        if (!o) origem = null;
      }
      const { data, error } = await db.from("tarefas").insert({
        sala_id: s.id, titulo, ...resp, prazo, origem, criada_por: q.userId, criada_por_agente: q.agente,
      }).select("id").single();
      if (error) throw new Falha(error.message);
      return tr(q, `Tarefa ${data.id} criada na sala "${s.nome}".`, `Task ${data.id} created in the room "${s.nome}".`);
    }
    case "listar_salas": {
      const ss = await salasDe(q);
      return ss.length ? ss.map((s) => `- ${s.nome} (id ${s.id})`).join("\n") : tr(q, `Nenhuma sala ainda. Crie ou entre em uma em ${APP}`, `No rooms yet. Create or join one at ${APP}`);
    }
    case "ler_mensagens": {
      const s = await acharSala(q, a.sala);
      return `${await cabecalho(s, q)}\n\n${formatar(await ler(s.id, Number(a.depois) || 0, Number(a.limite) || 50), q)}`;
    }
    case "enviar_mensagem":
    case "fazer_proposta": {
      const s = await acharSala(q, a.sala);
      const proposta = nome === "fazer_proposta";
      const m = await enviar(q, s.id, { texto: String(a.texto ?? ""), proposta, responde_a: a.responde_a });
      return proposta
        ? tr(q, `Proposta #${m.id} enviada na sala "${s.nome}". As pessoas aprovam ou recusam; a decisão chega como mensagem nova.`,
          `Proposal #${m.id} sent to the room "${s.nome}". People approve or decline; the decision arrives as a new message.`)
        : tr(q, `Enviada na sala "${s.nome}" como ${q.agente} de ${q.pessoa} (#${m.id}${m.responde_a ? `, respondendo #${m.responde_a}` : ""}).`,
          `Sent to the room "${s.nome}" as ${q.pessoa}'s ${q.agente} (#${m.id}${m.responde_a ? `, replying to #${m.responde_a}` : ""}).`);
    }
    case "ver_decisoes": {
      const s = await acharSala(q, a.sala);
      return registro(await propostas(s.id, 100), q) || tr(q, `Nenhuma proposta na sala "${s.nome}" ainda.`, `No proposals in the room "${s.nome}" yet.`);
    }
    case "esperar_mensagens": {
      const s = await acharSala(q, a.sala);
      const r = await esperar(q, s.id, Number(a.depois) || 0, 50);
      return `ultimo=${r.ultimo}\n${formatar(r.novas, q)}`;
    }
  }
  throw new Falha(tr(q, `Ferramenta desconhecida: ${nome}`, `Unknown tool: ${nome}`));
}

async function mcp(q: Quem, msg: any) {
  const { id, method, params } = msg ?? {};
  const ok = (result: unknown) => ({ jsonrpc: "2.0", id, result });
  switch (method) {
    case "initialize":
      return ok({
        protocolVersion: params?.protocolVersion ?? "2025-06-18",
        capabilities: { tools: {} },
        serverInfo: { name: "sala", title: "The Sala", version: "4.2.0" },
        instructions: regras(q),
      });
    case "ping":
      return ok({});
    case "tools/list":
      return ok({ tools: ferramentas(q) });
    case "tools/call":
      try {
        const r = await chamar(q, params?.name, params?.arguments ?? {});
        return ok({ content: typeof r === "string" ? [{ type: "text", text: r }] : r });
      } catch (e) {
        return ok({ content: [{ type: "text", text: `${tr(q, "Erro", "Error")}: ${(e as Error).message}` }], isError: true });
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
  json({ error: "unauthorized", error_description: "Conecte-se ao The Sala para continuar. / Connect to The Sala to continue." }, 401, {
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
        if (!q) return text(`The Sala — servidor MCP. Adicione esta URL como conector no Claude, no ChatGPT ou no Gemini CLI.\nThe Sala — MCP server. Add this URL as a connector in Claude, ChatGPT or Gemini CLI.\n${APP}\n`);
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
    if (rota[0] !== "api") return text("Rota não encontrada. / Not found.", 404);
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
    if (rec === "tarefas" && salaRef && acao === "concluir" && req.method === "POST") {
      const b = await req.json().catch(() => ({}));
      const t = await concluirTarefa(q, Number(salaRef), String(b.resultado ?? ""));
      return json({ id: t.id, estado: "feita" });
    }
    if (rec === "salas" && salaRef) {
      const s = await acharSala(q, decodeURIComponent(salaRef));
      if (acao === "mensagens" && req.method === "GET") {
        const ms = await ler(s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("limite")) || 50);
        return url.searchParams.get("formato") === "json" ? json(ms) : text(`${await cabecalho(s, q)}\n\n${formatar(ms, q)}`);
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
      if (acao === "tarefas") return text(listaTarefas(await tarefas(s.id), q, 20) || tr(q, "Nenhuma tarefa ainda.", "No tasks yet."));
      if (acao === "decisoes") return text(registro(await propostas(s.id, 100), q) || tr(q, "Nenhuma proposta ainda.", "No proposals yet."));
      if (acao === "esperar") {
        const r = await esperar(q, s.id, Number(url.searchParams.get("depois")) || 0, Number(url.searchParams.get("segundos")) || 50);
        return text(`ultimo=${r.ultimo}\n${r.novas.length ? formatar(r.novas, q) : ""}`);
      }
    }
    return text(tr(q ?? undefined, "Rota não encontrada.", "Not found."), 404);
  } catch (e) {
    const st = e instanceof Falha ? e.status : 400;
    return json({ erro: (e as Error).message }, st);
  }
});
