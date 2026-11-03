import { createClient } from "@supabase/supabase-js";

// Chave publicável: pode ficar no código. Quem protege os dados são as regras (RLS) do banco.
export const SUPABASE_URL = "https://cokzyrdmtnbsnnboxggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_sh1kE5Waqn8IhwcOpy64Ew_553Fafdm";

export const MCP_URL = `${SUPABASE_URL}/functions/v1/mcp`;

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Perfil = { id: string; nome: string; avatar: string | null; avisos?: "tudo" | "mencoes" | "nada" };
export type Sala = {
  id: string; nome: string; convite: string; contexto: string; papel: "dono" | "membro";
  nao_lidas: number; pendentes: number; lido_ate: number; ultima_id: number | null; ultima_texto: string | null;
  ultima_agente: string | null; ultima_nome: string | null; ultima_em: string | null; ultima_tipo: Mensagem["tipo"] | null;
};
export type Anexo = { path: string; nome: string; tipo: string; tamanho: number };
export type Agente = { user_id: string; nome: string; visto_em: string; ouvindo_ate: string | null };
export type Membro = { user_id: string; papel: "dono" | "membro"; perfis: Perfil | null };

export const abrirConectar = () => window.dispatchEvent(new Event("sala:conectar"));
export type Mensagem = {
  id: number;
  sala_id: string;
  user_id: string;
  agente: string | null;
  texto: string;
  criada_em: string;
  tipo: "mensagem" | "proposta" | "decisao";
  responde_a: number | null;
  estado: "pendente" | "aprovada" | "recusada" | null;
  decidida_por: string | null;
  decidida_em: string | null;
  editada_em: string | null;
  apagada: boolean;
  anexos: Anexo[];
  pendente?: boolean; // enviando
  falhou?: boolean;
};

// Presença do agente, em texto (nunca só cor): "ouvindo agora", "visto há 3 h"
export function presenca(a: Agente): { ativo: boolean; texto: string } {
  const agora = Date.now();
  if (a.ouvindo_ate && new Date(a.ouvindo_ate).getTime() > agora) return { ativo: true, texto: "ouvindo agora" };
  const min = Math.round((agora - new Date(a.visto_em).getTime()) / 60000);
  if (min < 5) return { ativo: true, texto: "ativo agora" };
  if (min < 60) return { ativo: false, texto: `visto há ${min} min` };
  const h = Math.round(min / 60);
  if (h < 24) return { ativo: false, texto: `visto há ${h} h` };
  const d = Math.round(h / 24);
  return { ativo: false, texto: d === 1 ? "visto ontem" : `visto há ${d} dias` };
}

export async function apagarConta() {
  const { data } = await sb.auth.getSession();
  const r = await fetch(`${MCP_URL}/api/conta`, { method: "DELETE", headers: { Authorization: `Bearer ${data.session?.access_token}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro ?? "Não deu para apagar a conta agora.");
  await sb.auth.signOut();
}

export const copiarTexto = async (t: string) => {
  try { await navigator.clipboard.writeText(t); return true; } catch { return false; }
};

export async function entrarComGoogle(volta: string) {
  await sb.auth.signInWithOAuth({ provider: "google", options: { redirectTo: volta } });
}

export async function entrarComEmail(email: string, volta: string) {
  return sb.auth.signInWithOtp({ email, options: { emailRedirectTo: volta } });
}

export const ultimaSala = {
  get: () => { try { return localStorage.getItem("sala.ultima"); } catch { return null; } },
  set: (id: string) => { try { localStorage.setItem("sala.ultima", id); } catch { /* sem storage */ } },
};

// ---------------------------------------------------------------- arquivos

export const LIMITE_ARQUIVO = 10 * 1024 * 1024;

export async function subirArquivo(sala: string, eu: string, f: File): Promise<Anexo> {
  if (f.size > LIMITE_ARQUIVO) throw new Error(`${f.name} passa de 10 MB.`);
  const nome = (f.name || "arquivo").replace(/[\/\\?%*:|"<>\x00-\x1f]/g, "-").slice(0, 120);
  const path = `${sala}/${eu}/${crypto.randomUUID()}-${nome}`;
  const { error } = await sb.storage.from("arquivos").upload(path, f, { contentType: f.type || "application/octet-stream" });
  if (error) throw new Error(`Não deu para enviar ${nome}: ${error.message}`);
  return { path, nome, tipo: f.type || "application/octet-stream", tamanho: f.size };
}

// links temporários (1 h), guardados para não pedir de novo a cada tela
const links = new Map<string, { url: string; ate: number }>();
export async function linksDe(paths: string[], baixar = false): Promise<Record<string, string>> {
  const agora = Date.now();
  const chave = (p: string) => (baixar ? `b:${p}` : p);
  const faltam = paths.filter((p) => !((links.get(chave(p))?.ate ?? 0) > agora));
  if (faltam.length) {
    const { data } = await sb.storage.from("arquivos").createSignedUrls(faltam, 3600, baixar ? { download: true } : undefined);
    data?.forEach((d) => d.path && d.signedUrl && links.set(chave(d.path), { url: d.signedUrl, ate: agora + 55 * 60_000 }));
  }
  return Object.fromEntries(paths.map((p) => [p, links.get(chave(p))?.url ?? ""]));
}

export const tamanhoLegivel = (b: number) =>
  b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${(b / 1048576).toFixed(1).replace(".", ",")} MB`;
