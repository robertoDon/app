import { useSyncExternalStore } from "react";

// Idioma: português para quem usa o navegador em português, inglês para o resto.
// A pessoa troca quando quiser (fica no aparelho e no perfil, para avisos e agentes seguirem).
export type Idioma = "pt" | "en";

const CHAVE = "sala.idioma";
const ouvintes = new Set<() => void>();

function guardado(): Idioma | null {
  try {
    const v = localStorage.getItem(CHAVE);
    return v === "pt" || v === "en" ? v : null;
  } catch { return null; }
}

export function doNavegador(): Idioma {
  const ls = typeof navigator === "undefined" ? [] : (navigator.languages?.length ? navigator.languages : [navigator.language]);
  return ls.some((l) => /^pt\b/i.test(l ?? "")) ? "pt" : "en";
}

let atual: Idioma = guardado() ?? doNavegador();
if (typeof document !== "undefined") document.documentElement.lang = atual === "en" ? "en" : "pt-BR";

export const idioma = () => atual;
export const escolhido = () => guardado() !== null;

/** t("Entrar", "Sign in"): o texto em português e em inglês, lado a lado no código. */
export const t = (pt: string, en: string) => (atual === "en" ? en : pt);

/** Locale para datas e números. */
export const locale = () => (atual === "en" ? "en-US" : "pt-BR");

export function definirIdioma(i: Idioma, lembrar = true) {
  if (lembrar) { try { localStorage.setItem(CHAVE, i); } catch { /* sem storage */ } }
  if (i === atual) return;
  atual = i;
  if (typeof document !== "undefined") document.documentElement.lang = i === "en" ? "en" : "pt-BR";
  ouvintes.forEach((f) => f());
}

export function useIdioma(): Idioma {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => atual, () => atual);
}

// ---------------------------------------------------------------- mensagens do servidor

// O banco responde em português; para quem usa em inglês, traduzimos as mensagens conhecidas.
const ERROS: [RegExp, string][] = [
  [/^Arquivo de outra sala ou de outra pessoa\./, "That file belongs to another room or person."],
  [/^Arquivo inválido\./, "Invalid file."],
  [/^Arquivo não encontrado\. Envie de novo\./, "File not found. Upload it again."],
  [/^Convite inválido ou trocado\./, "This invite is invalid or was replaced."],
  [/^Entre para aceitar o convite\./, "Sign in to accept the invite."],
  [/^Entre para criar uma chave\./, "Sign in to create a key."],
  [/^Entre para criar uma sala\./, "Sign in to create a room."],
  [/^Entre para receber avisos\./, "Sign in to get notifications."],
  [/^Esta mensagem não pode mais ser editada\./, "This message can no longer be edited."],
  [/^Esta proposta foi apagada\./, "This proposal was deleted."],
  [/^Esta proposta já foi decidida\./, "This proposal was already decided."],
  [/^Esta tarefa acabou de ser concluída\./, "This task was just completed. Check the updated list."],
  [/^Esta tarefa acabou de ser cancelada\./, "This task was just canceled. Check the updated list."],
  [/^Esta tarefa já foi fechada\./, "This task is already closed."],
  [/^Integração não encontrada\./, "Integration not found."],
  [/^Já são 5 mensagens seguidas de agentes/, "Agents have sent 5 messages in a row in this room. Wait for a person to write before continuing."],
  [/^Mensagem não encontrada\./, "Message not found."],
  [/^Nesta sala você está como convidado para acompanhar\. Peça a quem cuida da sala para poder escrever\./, "You're a viewer in this room. Ask the room owner to let you write."],
  [/^Nesta sala você está como convidado para acompanhar\. Peça a quem cuida da sala para poder mexer nas tarefas\./, "You're a viewer in this room. Ask the room owner to let you change tasks."],
  [/^No máximo 10 arquivos por mensagem\./, "Up to 10 files per message."],
  [/^No máximo 5 integrações por sala\./, "Up to 5 integrations per room."],
  [/^O responsável precisa estar na sala\./, "The assignee must be in the room."],
  [/^O texto precisa ter entre 1 e 20\.000 caracteres\./, "Text must be between 1 and 20,000 characters."],
  [/^Papel inválido\./, "Invalid role."],
  [/^Para concluir, use Concluir\./, "To complete it, use Complete."],
  [/^Proposta não encontrada\./, "Proposal not found."],
  [/^Propostas e decisões não mudam depois de enviadas/, "Proposals and decisions can't be changed once sent. Delete it and propose again."],
  [/^Só pessoas apagam mensagens\./, "Only people can delete messages."],
  [/^Só pessoas decidem propostas\./, "Only people can decide on proposals."],
  [/^Só pessoas editam mensagens\./, "Only people can edit messages."],
  [/^Só quem (criou|cuida d)a sala troca o convite\./, "Only the room owner can replace the invite."],
  [/^Só quem cuida da sala faz isso\./, "Only the room owner can do that."],
  [/^Só quem cuida da sala liga integrações\./, "Only the room owner can add integrations."],
  [/^Só quem é dono da sala faz isso\./, "Only the room owner can do that."],
  [/^Tarefa não encontrada\./, "Task not found."],
  [/^Use um endereço https público/, "Use a public https address (Slack, Teams, Discord, Google Chat or your own system)."],
  [/^Você apaga as suas mensagens e as dos seus agentes\./, "You can delete your own messages and your agents' messages."],
  [/^Você não está nesta sala\./, "You're not in this room."],
  [/^Você só edita as suas mensagens\./, "You can only edit your own messages."],
  [/^Entre de novo para apagar a conta\./, "Sign in again to delete your account."],
  [/^Agentes não apagam contas\./, "Agents can't delete accounts."],
  [/check constraint/i, "Check the address: it must start with https://"],
  [/Failed to fetch|NetworkError|Load failed/i, "No connection. Check your internet and try again."],
];

/** Mensagem de erro do servidor no idioma da pessoa. */
export function erro(e: unknown): string {
  const msg = typeof e === "string" ? e : (e as { message?: string } | null)?.message ?? String(e);
  if (atual !== "en") {
    if (/Failed to fetch|NetworkError|Load failed/i.test(msg)) return "Sem conexão. Confira a internet e tente de novo.";
    return msg;
  }
  for (const [re, en] of ERROS) if (re.test(msg)) return en;
  return msg;
}

// Textos que o sistema grava na conversa e no histórico (ficam em português no banco).
const GRAVADOS: Record<string, string> = {
  "adicionou à biblioteca": "added to the library:",
  "editou na biblioteca": "edited in the library:",
  "tirou da biblioteca": "removed from the library:",
  "atualizou a memória": "updated the memory:",
  "editou a memória": "edited the memory:",
  "Aprovada.": "Approved.",
  "Aprovada. O contexto da sala foi trocado pelo texto da proposta.": "Approved. The room instructions were replaced with the proposal's text.",
  "Recusada.": "Declined.",
  "entrou": "joined",
  "entrou como convidado (só lê)": "joined as a viewer",
  "passou a sala para": "made an owner:",
  "deixou só lendo": "set to view only:",
  "liberou para escrever": "let write:",
  "saiu": "left",
  "tirou da sala": "removed from the room",
  "apagou uma mensagem": "deleted a message",
  "retirou a proposta": "withdrew the proposal",
  "aprovou a proposta": "approved the proposal",
  "recusou a proposta": "declined the proposal",
  "fez uma proposta": "made a proposal",
  "criou a tarefa": "created the task",
  "concluiu a tarefa": "completed the task",
  "cancelou a tarefa": "canceled the task",
  "reabriu a tarefa": "reopened the task",
  "renomeou a sala": "renamed the room",
  "mudou o contexto para os agentes": "changed the room instructions",
  "trocou os links de convite": "replaced the invite links",
  "ligou uma integração": "added an integration",
  "desligou uma integração": "removed an integration",
  "criou a sala": "created the room",
};

/** Texto fixo gravado pelo sistema (decisão sem comentário, ação do histórico), no idioma da pessoa. */
export function gravado(texto: string): string {
  if (atual !== "en") return texto;
  if (GRAVADOS[texto]) return GRAVADOS[texto];
  const m = texto.match(/^✓ Concluí a tarefa: (.*)$/s);
  if (m) return `✓ Completed the task: ${m[1]}`;
  return texto;
}
