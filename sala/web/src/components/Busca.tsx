import { useEffect, useRef, useState } from "react";
import { sb, type Mensagem } from "../supabase";
import { IconeBusca, IconeFechar } from "./Icones";

type Props = { salaId: string; autor: (m: Mensagem) => string; irPara: (id: number) => void; fechar: () => void };

const escapar = (t: string) => t.replace(/[\\%_]/g, (c) => `\\${c}`);

function trecho(texto: string, termo: string) {
  const i = texto.toLowerCase().indexOf(termo.toLowerCase());
  if (i < 0) return <>{texto.slice(0, 160)}</>;
  const ini = Math.max(0, i - 60);
  return (
    <>{ini > 0 && "…"}{texto.slice(ini, i)}<mark>{texto.slice(i, i + termo.length)}</mark>{texto.slice(i + termo.length, i + termo.length + 100)}…</>
  );
}

// Busca em toda a conversa da sala, não só no que está carregado na tela.
export function Busca({ salaId, autor, irPara, fechar }: Props) {
  const [termo, setTermo] = useState("");
  const [res, setRes] = useState<Mensagem[] | null>(null);
  const espera = useRef<number | undefined>(undefined);

  useEffect(() => {
    window.clearTimeout(espera.current);
    const t = termo.trim();
    if (t.length < 2) { setRes(null); return; }
    espera.current = window.setTimeout(async () => {
      const { data } = await sb.from("mensagens").select("*").eq("sala_id", salaId).eq("apagada", false)
        .ilike("texto", `%${escapar(t)}%`).order("id", { ascending: false }).limit(50);
      setRes((data as Mensagem[]) ?? []);
    }, 200);
  }, [termo, salaId]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  return (
    <aside className="painel" aria-label="Buscar na sala">
      <header className="painel-topo">
        <h2>Buscar</h2>
        <button className="btn-icone" onClick={fechar} aria-label="Fechar busca"><IconeFechar /></button>
      </header>
      <section className="painel-secao">
        <label className="sr" htmlFor="busca">Buscar nas mensagens</label>
        <div className="campo-icone">
          <IconeBusca tamanho={18} />
          <input id="busca" type="search" autoFocus placeholder="Palavra, número, nome…" value={termo} onChange={(e) => setTermo(e.target.value)} />
        </div>
        {res === null && <p className="nota">Procura em toda a conversa, inclusive no que os agentes escreveram.</p>}
        {res && !res.length && <p className="nota">Nada com “{termo.trim()}” nesta sala.</p>}
      </section>
      {res && res.length > 0 && (
        <ul className="resultados">
          {res.map((m) => (
            <li key={m.id}>
              <button onClick={() => irPara(m.id)}>
                <span className="nota">{autor(m)} · {new Date(m.criada_em).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "")}</span>
                <span className="resultado-texto">{trecho(m.texto, termo.trim())}</span>
              </button>
            </li>
          ))}
        </ul>
      )}
    </aside>
  );
}
