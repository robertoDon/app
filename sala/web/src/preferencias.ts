import { useSyncExternalStore } from "react";
import type { User } from "@supabase/supabase-js";
import { sb } from "./supabase";

// Preferências pessoais que valem em qualquer aparelho: ficam na conta (metadados do login) e, para abrir rápido,
// também neste aparelho. Fonte de leitura da conversa e som quando alguém precisa de você.
export type Fonte = "padrao" | "serifa" | "leitura";
export type Som = "nada" | "comigo";
type Prefs = { fonte: Fonte; som: Som };

const CHAVE = "sala.prefs";
const ouvintes = new Set<() => void>();
const lidas = (): Prefs => {
  try { const v = JSON.parse(localStorage.getItem(CHAVE) ?? "{}"); return { fonte: v.fonte ?? "padrao", som: v.som ?? "nada" }; }
  catch { return { fonte: "padrao", som: "nada" }; }
};
let atual: Prefs = lidas();

// fontes extras só são baixadas quando escolhidas
const FONTES: Record<Exclude<Fonte, "padrao">, string> = {
  serifa: "https://fonts.googleapis.com/css2?family=Source+Serif+4:opsz,wght@8..60,400..700&display=swap",
  leitura: "https://fonts.googleapis.com/css2?family=Lexend:wght@300..700&display=swap",
};
function aplicar() {
  const raiz = document.documentElement;
  if (atual.fonte === "padrao") delete raiz.dataset.fonte;
  else {
    raiz.dataset.fonte = atual.fonte;
    const href = FONTES[atual.fonte];
    if (!document.querySelector(`link[href="${href}"]`)) {
      const l = document.createElement("link"); l.rel = "stylesheet"; l.href = href; document.head.appendChild(l);
    }
  }
}

function guardar(p: Partial<Prefs>, naConta = true) {
  atual = { ...atual, ...p };
  try { localStorage.setItem(CHAVE, JSON.stringify(atual)); } catch { /* sem storage */ }
  aplicar();
  ouvintes.forEach((f) => f());
  if (naConta) void sb.auth.updateUser({ data: { prefs: atual } });
}

export const iniciarPreferencias = () => aplicar();
/** Ao entrar: o que está na conta vale (a pessoa pode ter escolhido em outro aparelho). */
export function lerDaConta(u: User | null | undefined) {
  const p = u?.user_metadata?.prefs as Partial<Prefs> | undefined;
  if (p && (p.fonte !== atual.fonte || p.som !== atual.som)) guardar(p, false);
}
export const definirFonte = (fonte: Fonte) => guardar({ fonte });
export const definirSom = (som: Som) => guardar({ som });
export const prefs = () => atual;
export function usePrefs(): Prefs {
  return useSyncExternalStore((f) => { ouvintes.add(f); return () => ouvintes.delete(f); }, () => atual, () => atual);
}

/** Um "plim" curto em dois tons, feito na hora (sem arquivo de áudio). */
let audio: AudioContext | null = null;
export function tocarPlim() {
  try {
    audio ??= new AudioContext();
    const agora = audio.currentTime;
    [[880, 0], [1318.5, 0.11]].forEach(([freq, atraso]) => {
      const o = audio!.createOscillator(), g = audio!.createGain();
      o.type = "sine"; o.frequency.value = freq;
      g.gain.setValueAtTime(0, agora + atraso);
      g.gain.linearRampToValueAtTime(0.12, agora + atraso + 0.012);
      g.gain.exponentialRampToValueAtTime(0.0001, agora + atraso + 0.32);
      o.connect(g).connect(audio!.destination);
      o.start(agora + atraso); o.stop(agora + atraso + 0.34);
    });
  } catch { /* navegador sem áudio */ }
}
