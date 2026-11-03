// The Sala — avisos no celular e no computador (Web Push), sem serviço pago.
//
// O banco chama esta função a cada mensagem nova (gatilho chamar_avisar, via pg_net) com {id}
// e o cabeçalho x-aviso. Ela decide quem avisar e manda o push criptografado (RFC 8291, aes128gcm)
// assinado com VAPID (RFC 8292). Tudo com WebCrypto, sem biblioteca.
//
// Quem recebe, conforme a preferência da pessoa (perfis.avisos):
//   tudo     → toda mensagem das salas dela
//   mencoes  → quando chamam ela (@Nome, @todos) ou um agente dela (@Claude-Ana, @agentes), proposta nova,
//              resposta a algo dela, decisão sobre proposta dela
//   nada     → nunca
// Também avisa quem ficou responsável por uma tarefa nova ({tarefa: id}).
//
// Deploy com verify_jwt = false (confere o segredo x-aviso).

import { createClient } from "npm:@supabase/supabase-js@2.118.0";

const db = createClient(Deno.env.get("SUPABASE_URL")!, Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const ASSUNTO = "mailto:robertobeckerbt@gmail.com";

// ---------------------------------------------------------------- base64url

const b64u = (b: Uint8Array) => btoa(String.fromCharCode(...b)).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const deB64u = (s: string) => {
  const p = s.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};
const juntar = (...partes: Uint8Array[]) => {
  const out = new Uint8Array(partes.reduce((n, p) => n + p.length, 0));
  let i = 0;
  for (const p of partes) { out.set(p, i); i += p.length; }
  return out;
};
const txt = (s: string) => new TextEncoder().encode(s);

// ---------------------------------------------------------------- VAPID

let chave: { privada: CryptoKey; publica: string } | null = null;
async function vapid() {
  if (chave) return chave;
  const { data } = await db.rpc("chave_vapid");
  const jwk = JSON.parse(data as string);
  const privada = await crypto.subtle.importKey("jwk", { ...jwk, ext: true }, { name: "ECDSA", namedCurve: "P-256" }, false, ["sign"]);
  const publica = b64u(juntar(new Uint8Array([4]), deB64u(jwk.x), deB64u(jwk.y)));
  chave = { privada, publica };
  return chave;
}

async function jwt(endpoint: string) {
  const { privada } = await vapid();
  const cab = b64u(txt(JSON.stringify({ typ: "JWT", alg: "ES256" })));
  const corpo = b64u(txt(JSON.stringify({ aud: new URL(endpoint).origin, exp: Math.floor(Date.now() / 1000) + 12 * 3600, sub: ASSUNTO })));
  const assinatura = new Uint8Array(await crypto.subtle.sign({ name: "ECDSA", hash: "SHA-256" }, privada, txt(`${cab}.${corpo}`)));
  return `${cab}.${corpo}.${b64u(assinatura)}`;
}

// ---------------------------------------------------------------- criptografia (aes128gcm)

async function hkdf(sal: Uint8Array, ikm: Uint8Array, info: Uint8Array, tamanho: number) {
  const k = await crypto.subtle.importKey("raw", ikm, "HKDF", false, ["deriveBits"]);
  return new Uint8Array(await crypto.subtle.deriveBits({ name: "HKDF", hash: "SHA-256", salt: sal, info }, k, tamanho * 8));
}

async function cifrar(p256dh: string, auth: string, texto: string) {
  const ua = deB64u(p256dh);
  const segredo = deB64u(auth);
  const efemera = await crypto.subtle.generateKey({ name: "ECDH", namedCurve: "P-256" }, true, ["deriveBits"]);
  const as = new Uint8Array(await crypto.subtle.exportKey("raw", efemera.publicKey));
  const uaChave = await crypto.subtle.importKey("raw", ua, { name: "ECDH", namedCurve: "P-256" }, false, []);
  const ecdh = new Uint8Array(await crypto.subtle.deriveBits({ name: "ECDH", public: uaChave }, efemera.privateKey, 256));

  const ikm = await hkdf(segredo, ecdh, juntar(txt("WebPush: info\0"), ua, as), 32);
  const sal = crypto.getRandomValues(new Uint8Array(16));
  const cek = await hkdf(sal, ikm, txt("Content-Encoding: aes128gcm\0"), 16);
  const nonce = await hkdf(sal, ikm, txt("Content-Encoding: nonce\0"), 12);

  const k = await crypto.subtle.importKey("raw", cek, "AES-GCM", false, ["encrypt"]);
  const cifra = new Uint8Array(await crypto.subtle.encrypt({ name: "AES-GCM", iv: nonce }, k, juntar(txt(texto), new Uint8Array([2]))));
  const rs = new Uint8Array([0, 0, 16, 0]); // 4096
  return juntar(sal, rs, new Uint8Array([as.length]), as, cifra);
}

async function empurrar(i: { endpoint: string; p256dh: string; auth: string }, dados: unknown, urgente: boolean) {
  const { publica } = await vapid();
  const r = await fetch(i.endpoint, {
    method: "POST",
    headers: {
      Authorization: `vapid t=${await jwt(i.endpoint)}, k=${publica}`,
      "Content-Encoding": "aes128gcm",
      "Content-Type": "application/octet-stream",
      TTL: "86400",
      Urgency: urgente ? "high" : "normal",
    },
    body: await cifrar(i.p256dh, i.auth, JSON.stringify(dados)),
  });
  await r.body?.cancel();
  return r.status;
}

// ---------------------------------------------------------------- quem avisar

const handle = (s: string) => s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();
// @agents/@everyone/@all (inglês) valem o mesmo que @agentes/@todos
const ALIAS: Record<string, string> = { agents: "agentes", everyone: "todos", all: "todos" };
const apelido = (h: string) => ALIAS[h] ?? h;
const mencoes = (t: string) => [...t.matchAll(/@([\p{L}\p{N}_]+)(?:-[\p{L}\p{N}_]+)?/gu)].map((m) => apelido(handle(m[1])));

// textos que o banco grava em português, para quem usa em inglês
const emIngles = (t: string) =>
  t === "Aprovada." ? "Approved." : t === "Recusada." ? "Declined." : t.replace(/^✓ Concluí a tarefa: /, "✓ Completed the task: ");
type Lingua = "pt" | "en";
const limpo = (t: string, n = 140) => {
  const l = t.replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim();
  return l.length > n ? `${l.slice(0, n - 1)}…` : l;
};

let segredoAviso: string | null = null;
const TODOS = "\u0000todos"; // "todos os seus agentes" (marca interna)

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!segredoAviso) segredoAviso = (await db.rpc("segredo_aviso")).data as string;
  if (!segredoAviso || req.headers.get("x-aviso") !== segredoAviso) return new Response("não", { status: 401 });

  const corpo = await req.json().catch(() => ({}));
  if (corpo.tarefa) return await avisarTarefa(Number(corpo.tarefa));
  const { id } = corpo;
  const { data: m } = await db.from("mensagens")
    .select("id, sala_id, user_id, agente, texto, tipo, estado, responde_a, apagada, autor:perfis!mensagens_user_id_fkey(nome), salas(nome)")
    .eq("id", id).maybeSingle();
  if (!m || m.apagada) return new Response("nada");

  const { data: membros } = await db.from("membros").select("user_id, perfis(nome, avisos, idioma)").eq("sala_id", m.sala_id).neq("user_id", m.user_id);
  if (!membros?.length) return new Response("nada");

  // de quem é a mensagem respondida (resposta a algo meu, decisão sobre proposta minha)
  let donoRespondida: string | null = null;
  if (m.responde_a) {
    const { data: r } = await db.from("mensagens").select("user_id").eq("id", m.responde_a).maybeSingle();
    donoRespondida = r?.user_id ?? null;
  }

  const ditas = mencoes(m.texto);
  const ditasCompletas = [...m.texto.matchAll(/@([\p{L}\p{N}_]+)(?:-([\p{L}\p{N}_]+))?/gu)].map((x) => [apelido(handle(x[1])), x[2] ? handle(x[2]) : ""]);
  // agentes de quem está na sala: "@Claude-Ana" ou "@agentes" chamam o agente, e a pessoa dona dele é avisada
  const { data: agentesSala } = await db.from("agentes").select("user_id, nome").in("user_id", membros.map((x: any) => x.user_id));
  const agenteChamado = (uid: string, primeiro: string): string | null => {
    const meus = (agentesSala ?? []).filter((a) => a.user_id === uid);
    for (const [a, p] of ditasCompletas) {
      // @agentes escrito por um agente não acorda ninguém: senão vira uma corrente de avisos
      if (a === "agentes" && meus.length && !m.agente) return meus.length === 1 ? meus[0].nome : TODOS;
      const ag = meus.find((x) => handle(x.nome) === a);
      if (ag && (!p || p === primeiro)) return ag.nome;
    }
    return null;
  };
  const autorNome = (m.autor as any)?.nome ?? "";
  const primeiro = autorNome.split(" ")[0];
  const quem = (l: Lingua) => m.agente ? (l === "en" ? `${primeiro}'s ${m.agente}` : `${m.agente} de ${primeiro}`) : autorNome || (l === "en" ? "Someone" : "Alguém");
  const sala = (m.salas as any)?.nome ?? "Sala";
  const lingua = new Map<string, Lingua>(membros.map((x: any) => [x.user_id, x.perfis?.idioma === "en" ? "en" : "pt"]));

  const chamadoDe = new Map<string, string>(); // pessoa → qual agente dela foi chamado
  const alvos = membros.filter((x: any) => {
    const pref = x.perfis?.avisos ?? "mencoes";
    if (pref === "nada") return false;
    const meu = handle((x.perfis?.nome ?? "").split(" ")[0]);
    if (!m.agente || m.user_id !== x.user_id) {
      const ag = agenteChamado(x.user_id, meu);
      if (ag) chamadoDe.set(x.user_id, ag);
    }
    if (pref === "tudo") return true;
    return ditas.includes("todos") || (meu && ditas.includes(meu)) || chamadoDe.has(x.user_id) || m.tipo === "proposta" || donoRespondida === x.user_id;
  }).map((x: any) => x.user_id);
  if (!alvos.length) return new Response("nada");

  const { data: inscricoes } = await db.from("inscricoes").select("endpoint, user_id, p256dh, auth").in("user_id", alvos);
  if (!inscricoes?.length) return new Response("nada");

  const titulo = (l: Lingua) => l === "en"
    ? (m.tipo === "proposta" ? `Proposal from ${quem(l)} · ${sala}` :
      m.tipo === "decisao" ? `${primeiro} ${m.estado === "aprovada" ? "approved" : "declined"} a proposal · ${sala}` :
      `${quem(l)} · ${sala}`)
    : (m.tipo === "proposta" ? `Proposta de ${quem(l)} · ${sala}` :
      m.tipo === "decisao" ? `${primeiro} ${m.estado === "aprovada" ? "aprovou" : "recusou"} uma proposta · ${sala}` :
      `${quem(l)} · ${sala}`);
  const dadosPara = (uid: string) => {
    const l = lingua.get(uid) ?? "pt";
    const texto = l === "en" ? emIngles(m.texto) : m.texto;
    const ag = chamadoDe.get(uid);
    if (ag) {
      const seu = l === "en" ? (ag === TODOS ? "your agents" : `your ${ag}`) : (ag === TODOS ? "seus agentes" : `seu ${ag}`);
      return { titulo: l === "en" ? `${quem(l)} called ${seu} · ${sala}` : `${quem(l)} chamou ${seu} · ${sala}`,
        corpo: `${l === "en" ? "Tap to ask for the answer." : "Toque para pedir a resposta."} ${limpo(texto, 110)}`,
        url: `/s/${m.sala_id}?pedir=${m.id}`, sala: m.sala_id, tag: `sala-${m.sala_id}` };
    }
    return { titulo: titulo(l), corpo: limpo(texto), url: `/s/${m.sala_id}`, sala: m.sala_id, tag: `sala-${m.sala_id}` };
  };

  const mortos: string[] = [];
  await Promise.all(inscricoes.map(async (i) => {
    try {
      const chamado = chamadoDe.get(i.user_id);
      const urgente = m.tipo !== "mensagem" || donoRespondida === i.user_id || (!!chamado && chamado !== TODOS && !ditas.includes("agentes"));
      const st = await empurrar(i, dadosPara(i.user_id), urgente);
      if (st === 404 || st === 410) mortos.push(i.endpoint);
      else if (st >= 400) console.log("push", st, new URL(i.endpoint).host);
    } catch (e) { console.log("push falhou", (e as Error).message); }
  }));
  if (mortos.length) await db.from("inscricoes").delete().in("endpoint", mortos);
  return new Response(`avisados ${inscricoes.length - mortos.length}`);
});

async function mandarPara(uid: string, dados: unknown, urgente: boolean) {
  const { data: inscricoes } = await db.from("inscricoes").select("endpoint, user_id, p256dh, auth").eq("user_id", uid);
  const mortos: string[] = [];
  await Promise.all((inscricoes ?? []).map(async (i) => {
    try {
      const st = await empurrar(i, dados, urgente);
      if (st === 404 || st === 410) mortos.push(i.endpoint);
    } catch (e) { console.log("push falhou", (e as Error).message); }
  }));
  if (mortos.length) await db.from("inscricoes").delete().in("endpoint", mortos);
  return (inscricoes?.length ?? 0) - mortos.length;
}

async function avisarTarefa(id: number) {
  const { data: t } = await db.from("tarefas")
    .select("id, sala_id, titulo, responsavel, responsavel_agente, prazo, criada_por, criada_por_agente, salas(nome), autor:perfis!tarefas_criada_por_fkey(nome), dono:perfis!tarefas_responsavel_fkey(avisos, idioma)")
    .eq("id", id).maybeSingle();
  if (!t || !t.responsavel || (t.dono as any)?.avisos === "nada") return new Response("nada");
  const en = (t.dono as any)?.idioma === "en";
  const autor = (t.autor as any)?.nome ?? "";
  const de = t.criada_por_agente
    ? (en ? `${autor.split(" ")[0]}'s ${t.criada_por_agente}` : `${t.criada_por_agente} de ${autor.split(" ")[0]}`)
    : autor || (en ? "someone" : "Alguém");
  const para = t.responsavel_agente ? (en ? `your ${t.responsavel_agente}` : `o seu ${t.responsavel_agente}`) : (en ? "you" : "você");
  const dia = (iso: string) => new Date(iso).toLocaleDateString(en ? "en-US" : "pt-BR", { day: "numeric", month: "short", timeZone: "America/Sao_Paulo" });
  const prazo = t.prazo ? (en ? ` · due ${dia(t.prazo)}` : ` · até ${dia(t.prazo)}`) : "";
  const salaNome = (t.salas as any)?.nome ?? "Sala";
  const n = await mandarPara(t.responsavel, {
    titulo: en ? `New task for ${para} · ${salaNome}` : `Tarefa nova para ${para} · ${salaNome}`,
    corpo: en ? `${t.titulo}${prazo} · from ${de}` : `${t.titulo}${prazo} · de ${de}`,
    url: `/s/${t.sala_id}?tarefas=1`, sala: t.sala_id, tag: `tarefa-${t.id}`,
  }, true);
  return new Response(`avisados ${n}`);
}
