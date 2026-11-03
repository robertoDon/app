// The Sala — avisos no celular e no computador (Web Push), sem serviço pago.
//
// O banco chama esta função a cada mensagem nova (gatilho chamar_avisar, via pg_net) com {id}
// e o cabeçalho x-aviso. Ela decide quem avisar e manda o push criptografado (RFC 8291, aes128gcm)
// assinado com VAPID (RFC 8292). Tudo com WebCrypto, sem biblioteca.
//
// Quem recebe, conforme a preferência da pessoa (perfis.avisos):
//   tudo     → toda mensagem das salas dela
//   mencoes  → quando chamam ela (@Nome, @todos), proposta nova, resposta a algo dela, decisão sobre proposta dela
//   nada     → nunca
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
const mencoes = (t: string) => [...t.matchAll(/@([\p{L}\p{N}_]+)(?:-[\p{L}\p{N}_]+)?/gu)].map((m) => handle(m[1]));
const limpo = (t: string, n = 140) => {
  const l = t.replace(/[*_`>#]/g, "").replace(/\s+/g, " ").trim();
  return l.length > n ? `${l.slice(0, n - 1)}…` : l;
};

let segredoAviso: string | null = null;

Deno.serve(async (req) => {
  if (req.method !== "POST") return new Response("ok");
  if (!segredoAviso) segredoAviso = (await db.rpc("segredo_aviso")).data as string;
  if (!segredoAviso || req.headers.get("x-aviso") !== segredoAviso) return new Response("não", { status: 401 });

  const { id } = await req.json().catch(() => ({}));
  const { data: m } = await db.from("mensagens")
    .select("id, sala_id, user_id, agente, texto, tipo, estado, responde_a, apagada, autor:perfis!mensagens_user_id_fkey(nome), salas(nome)")
    .eq("id", id).maybeSingle();
  if (!m || m.apagada) return new Response("nada");

  const { data: membros } = await db.from("membros").select("user_id, perfis(nome, avisos)").eq("sala_id", m.sala_id).neq("user_id", m.user_id);
  if (!membros?.length) return new Response("nada");

  // de quem é a mensagem respondida (resposta a algo meu, decisão sobre proposta minha)
  let donoRespondida: string | null = null;
  if (m.responde_a) {
    const { data: r } = await db.from("mensagens").select("user_id").eq("id", m.responde_a).maybeSingle();
    donoRespondida = r?.user_id ?? null;
  }

  const ditas = mencoes(m.texto);
  const autorNome = (m.autor as any)?.nome ?? "Alguém";
  const quem = m.agente ? `${m.agente} de ${autorNome.split(" ")[0]}` : autorNome;
  const sala = (m.salas as any)?.nome ?? "Sala";

  const alvos = membros.filter((x: any) => {
    const pref = x.perfis?.avisos ?? "mencoes";
    if (pref === "nada") return false;
    if (pref === "tudo") return true;
    const meu = handle((x.perfis?.nome ?? "").split(" ")[0]);
    return ditas.includes("todos") || (meu && ditas.includes(meu)) || m.tipo === "proposta" || donoRespondida === x.user_id;
  }).map((x: any) => x.user_id);
  if (!alvos.length) return new Response("nada");

  const { data: inscricoes } = await db.from("inscricoes").select("endpoint, user_id, p256dh, auth").in("user_id", alvos);
  if (!inscricoes?.length) return new Response("nada");

  const titulo =
    m.tipo === "proposta" ? `Proposta de ${quem} · ${sala}` :
    m.tipo === "decisao" ? `${autorNome.split(" ")[0]} ${m.estado === "aprovada" ? "aprovou" : "recusou"} uma proposta · ${sala}` :
    `${quem} · ${sala}`;
  const dados = { titulo, corpo: limpo(m.texto), url: `/s/${m.sala_id}`, sala: m.sala_id, tag: `sala-${m.sala_id}` };

  const mortos: string[] = [];
  await Promise.all(inscricoes.map(async (i) => {
    try {
      const st = await empurrar(i, dados, m.tipo !== "mensagem" || donoRespondida === i.user_id);
      if (st === 404 || st === 410) mortos.push(i.endpoint);
      else if (st >= 400) console.log("push", st, new URL(i.endpoint).host);
    } catch (e) { console.log("push falhou", (e as Error).message); }
  }));
  if (mortos.length) await db.from("inscricoes").delete().in("endpoint", mortos);
  return new Response(`avisados ${inscricoes.length - mortos.length}`);
});
