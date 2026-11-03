import { createClient } from "@supabase/supabase-js";

// Chave publicável: pode ficar no código. Quem protege os dados são as regras (RLS) do banco.
export const SUPABASE_URL = "https://cokzyrdmtnbsnnboxggp.supabase.co";
const SUPABASE_KEY = "sb_publishable_sh1kE5Waqn8IhwcOpy64Ew_553Fafdm";

export const MCP_URL = `${SUPABASE_URL}/functions/v1/mcp`;

export const sb = createClient(SUPABASE_URL, SUPABASE_KEY, {
  auth: { flowType: "pkce", persistSession: true, autoRefreshToken: true, detectSessionInUrl: true },
});

export type Perfil = { id: string; nome: string; avatar: string | null };
export type Sala = {
  id: string; nome: string; convite: string; contexto: string; papel: "dono" | "membro";
  nao_lidas: number; ultima_id: number | null; ultima_texto: string | null;
  ultima_agente: string | null; ultima_nome: string | null; ultima_em: string | null;
};
export type Membro = { user_id: string; papel: "dono" | "membro"; perfis: Perfil | null };

export const abrirConectar = () => window.dispatchEvent(new Event("sala:conectar"));
export type Mensagem = {
  id: number;
  sala_id: string;
  user_id: string;
  agente: string | null;
  texto: string;
  criada_em: string;
  pendente?: boolean;
  falhou?: boolean;
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
