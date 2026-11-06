import { useEffect, useState, type RefObject } from "react";
import { t } from "../i18n";

type Marca = { id: number; topo: number; tipo: "agente" | "pessoa" | "minha" | "proposta"; eu: boolean; rotulo: string };

// Conversa longa: uma régua na borda direita com uma marca por mensagem (propostas e menções a você se destacam)
// e a janela do que está na tela. Clicar numa marca pula para a mensagem.
export function Minimapa({ feed, versao, irPara }: { feed: RefObject<HTMLDivElement | null>; versao: unknown; irPara: (id: number) => void }) {
  const [marcas, setMarcas] = useState<Marca[]>([]);
  const [janela, setJanela] = useState({ topo: 0, altura: 1 });

  useEffect(() => {
    const f = feed.current;
    if (!f) return;
    const medir = () => {
      const total = f.scrollHeight || 1;
      setJanela({ topo: f.scrollTop / total, altura: Math.min(1, f.clientHeight / total) });
    };
    const mapear = () => {
      const total = f.scrollHeight || 1;
      const els = [...f.querySelectorAll<HTMLElement>("article.msg[id^='m']")];
      setMarcas(els.map((el) => {
        const cls = el.classList;
        const quem = el.querySelector(".msg-meta strong")?.textContent ?? "";
        const texto = (el.querySelector(".msg-corpo")?.textContent ?? "").replace(/\s+/g, " ").slice(0, 70);
        return {
          id: Number(el.id.slice(1)),
          topo: (el.offsetTop - f.offsetTop) / total,
          tipo: cls.contains("msg-proposta") ? "proposta" : cls.contains("msg-agente") ? "agente" : cls.contains("msg-minha") ? "minha" : "pessoa",
          eu: !!el.querySelector(".mencao-eu"),
          rotulo: quem ? `${quem}: ${texto}` : texto,
        };
      }));
      medir();
    };
    const id = window.requestAnimationFrame(mapear);
    f.addEventListener("scroll", medir, { passive: true });
    window.addEventListener("resize", mapear);
    return () => { window.cancelAnimationFrame(id); f.removeEventListener("scroll", medir); window.removeEventListener("resize", mapear); };
  }, [feed, versao]);

  if (marcas.length < 2) return null;
  return (
    <nav className="minimapa" aria-label={t("Mapa da conversa", "Conversation map")}>
      <span className="minimapa-janela" style={{ top: `${janela.topo * 100}%`, height: `${janela.altura * 100}%` }} aria-hidden />
      {marcas.map((m) => (
        <button key={m.id} type="button" className={`minimapa-marca mm-${m.tipo} ${m.eu ? "mm-eu" : ""}`} style={{ top: `${m.topo * 100}%` }}
          onClick={() => irPara(m.id)} title={m.rotulo} aria-label={m.rotulo} tabIndex={m.tipo === "proposta" || m.eu ? 0 : -1} />
      ))}
    </nav>
  );
}
