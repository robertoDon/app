import { createClient } from "@supabase/supabase-js";
import { definirIdioma, t, type Idioma } from "./i18n";

// Chave publicável: pode ficar no código. Quem protege os dados são as regras (RLS) do banco.
export const SUPABASE_URL = "https://cokzyrdmtnbsnnboxggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_sh1kE5Waqn8IhwcOpy64Ew_553Fafdm";

export const MCP_URL = `${SUPABASE_URL}/functions/v1/mcp`;

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Perfil = { id: string; nome: string; avatar: string | null; avisos?: "tudo" | "mencoes" | "nada"; idioma?: Idioma | null; guia_visto?: string | null; guia_sala_visto?: string | null };
export type Sala = {
  id: string; nome: string; convite: string | null; convite_leitura: string | null; contexto: string; papel: "dono" | "membro" | "leitor";
  nao_lidas: number; pendentes: number; lido_ate: number; minhas_tarefas: number; ultima_id: number | null; ultima_texto: string | null;
  ultima_agente: string | null; ultima_nome: string | null; ultima_em: string | null; ultima_tipo: Mensagem["tipo"] | null;
};
export type Anexo = { path: string; nome: string; tipo: string; tamanho: number };
export type Agente = { user_id: string; nome: string; visto_em: string; ouvindo_ate: string | null; desperta?: boolean };
export type Membro = { user_id: string; papel: "dono" | "membro" | "leitor"; perfis: Perfil | null };

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
  if (a.ouvindo_ate && new Date(a.ouvindo_ate).getTime() > agora) return { ativo: true, texto: t("ouvindo agora", "listening now") };
  if (a.desperta) return { ativo: true, texto: t("responde sozinho", "replies on its own") };
  const min = Math.round((agora - new Date(a.visto_em).getTime()) / 60000);
  if (min < 5) return { ativo: true, texto: t("ativo agora", "active now") };
  if (min < 60) return { ativo: false, texto: t(`visto há ${min} min`, `seen ${min} min ago`) };
  const h = Math.round(min / 60);
  if (h < 24) return { ativo: false, texto: t(`visto há ${h} h`, `seen ${h} h ago`) };
  const d = Math.round(h / 24);
  return { ativo: false, texto: d === 1 ? t("visto ontem", "seen yesterday") : t(`visto há ${d} dias`, `seen ${d} days ago`) };
}

export async function apagarConta() {
  const { data } = await sb.auth.getSession();
  const r = await fetch(`${MCP_URL}/api/conta`, { method: "DELETE", headers: { Authorization: `Bearer ${data.session?.access_token}` } });
  if (!r.ok) throw new Error((await r.json().catch(() => ({}))).erro ?? t("Não deu para apagar a conta agora.", "Couldn't delete the account right now."));
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

/** Troca o idioma neste aparelho e no perfil (avisos, agentes e integrações seguem). */
export async function trocarIdioma(i: Idioma) {
  definirIdioma(i);
  const { data } = await sb.auth.getSession();
  if (data.session) await sb.from("perfis").update({ idioma: i }).eq("id", data.session.user.id);
}

export const ultimaSala = {
  get: () => { try { return localStorage.getItem("sala.ultima"); } catch { return null; } },
  set: (id: string) => { try { localStorage.setItem("sala.ultima", id); } catch { /* sem storage */ } },
};

// ---------------------------------------------------------------- arquivos

export const LIMITE_ARQUIVO = 10 * 1024 * 1024;

// o armazenamento só aceita letras sem acento, números, ponto, hífen e sublinhado na chave; o nome real fica na mensagem
export const chaveDoNome = (nome: string) => {
  const limpo = nome.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^A-Za-z0-9._-]+/g, "-").replace(/\.{2,}/g, ".").replace(/^[-.]+|-+$/g, "");
  return (limpo || "arquivo").slice(-120);
};

export async function subirArquivo(sala: string, eu: string, f: File): Promise<Anexo> {
  if (f.size > LIMITE_ARQUIVO) throw new Error(t(`${f.name} passa de 10 MB.`, `${f.name} is over 10 MB.`));
  const nome = (f.name || "arquivo").replace(/[\/\\\x00-\x1f]/g, "-").trim().slice(0, 200) || "arquivo";
  const path = `${sala}/${eu}/${crypto.randomUUID()}-${chaveDoNome(nome)}`;
  const { error } = await sb.storage.from("arquivos").upload(path, f, { contentType: f.type || "application/octet-stream" });
  if (error) throw new Error(t(`Não deu para enviar ${nome}: ${error.message}`, `Couldn't upload ${nome}: ${error.message}`));
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
  b < 1024 ? `${b} B` : b < 1048576 ? `${Math.round(b / 1024)} KB` : `${t((b / 1048576).toFixed(1).replace(".", ","), (b / 1048576).toFixed(1))} MB`;

// ---------------------------------------------------------------- tarefas

export type Tarefa = {
  id: number; sala_id: string; titulo: string; origem: number | null;
  responsavel: string | null; responsavel_agente: string | null; prazo: string | null;
  estado: "aberta" | "feita" | "cancelada"; resultado: string | null;
  criada_por: string | null; criada_por_agente: string | null; criada_em: string;
  concluida_em: string | null; concluida_por: string | null; concluida_por_agente: string | null;
};

export const atrasada = (t: Tarefa) => t.estado === "aberta" && !!t.prazo && new Date(t.prazo).getTime() < Date.now();

// ---------------------------------------------------------------- pedir ao meu agente

// Claude e ChatGPT abrem com o pedido já escrito; nos outros, o pedido vai para a área de transferência.
export function pedidoPara(agente: string, sala: string, m: { id: number }, autor: string) {
  const texto = t(
    `Leia a sala "${sala}" no The Sala e responda à mensagem #${m.id} de ${autor}. ` +
    `Use ler_mensagens para ver a conversa e enviar_mensagem com responde_a=${m.id} para responder. Se precisar de uma decisão, use fazer_proposta.`,
    `Read the room "${sala}" on The Sala and reply to message #${m.id} from ${autor}. ` +
    `Use ler_mensagens to see the conversation and enviar_mensagem with responde_a=${m.id} to reply. If you need a decision, use fazer_proposta.`);
  const a = agente.toLowerCase();
  const url = a === "claude" ? `https://claude.ai/new?q=${encodeURIComponent(texto)}`
    : a === "chatgpt" ? `https://chatgpt.com/?q=${encodeURIComponent(texto)}`
    : null;
  return { texto, url };
}
