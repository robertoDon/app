import { sb } from "./supabase";

// Avisos no aparelho (Web Push): o próprio navegador entrega.
const VAPID = "BKvdRjqDk300tIkQfCZ0Zz9Wfa8n7Qn0gnsvvrLcxHG_I6MKBAOs3ZxUtxt48lW83kk0EvAl9ce3i4YCUYsIIZY";

export type EstadoAvisos = "sem-suporte" | "iphone-instalar" | "negado" | "desligado" | "ligado";

const ehIphone = () => /iphone|ipad|ipod/i.test(navigator.userAgent);
const instalado = () => window.matchMedia("(display-mode: standalone)").matches || (navigator as unknown as { standalone?: boolean }).standalone === true;

export async function registrarSw() {
  if (!("serviceWorker" in navigator)) return null;
  try { return await navigator.serviceWorker.register("/sw.js"); } catch { return null; }
}

export async function estadoAvisos(): Promise<EstadoAvisos> {
  if (ehIphone() && !instalado()) return "iphone-instalar";
  if (!("serviceWorker" in navigator) || !("PushManager" in window) || !("Notification" in window)) return "sem-suporte";
  if (Notification.permission === "denied") return "negado";
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  return sub && Notification.permission === "granted" ? "ligado" : "desligado";
}

const chave = (b64: string) => {
  const p = b64.replace(/-/g, "+").replace(/_/g, "/");
  return Uint8Array.from(atob(p + "=".repeat((4 - (p.length % 4)) % 4)), (c) => c.charCodeAt(0));
};

export async function ligarAvisos(): Promise<EstadoAvisos> {
  const permissao = await Notification.requestPermission();
  if (permissao !== "granted") return permissao === "denied" ? "negado" : "desligado";
  const reg = (await navigator.serviceWorker.getRegistration()) ?? (await registrarSw());
  if (!reg) return "sem-suporte";
  await navigator.serviceWorker.ready;
  const sub = (await reg.pushManager.getSubscription()) ??
    (await reg.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: chave(VAPID) }));
  const j = sub.toJSON();
  const { error } = await sb.rpc("inscrever", { endpoint: j.endpoint, p256dh: j.keys?.p256dh, auth: j.keys?.auth });
  if (error) throw error;
  return "ligado";
}

export async function desligarAvisos() {
  const reg = await navigator.serviceWorker.getRegistration();
  const sub = await reg?.pushManager.getSubscription();
  if (sub) {
    await sb.from("inscricoes").delete().eq("endpoint", sub.endpoint);
    await sub.unsubscribe();
  }
}

export const lembrete = {
  dispensado: () => { try { return localStorage.getItem("sala.avisos.dispensado") === "1"; } catch { return true; } },
  dispensar: () => { try { localStorage.setItem("sala.avisos.dispensado", "1"); } catch { /* sem storage */ } },
};
