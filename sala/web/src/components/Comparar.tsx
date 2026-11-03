import { useEffect } from "react";
import type { Mensagem } from "../supabase";
import { IconeAgente, IconeFechar } from "./Icones";
import { Texto } from "./Texto";
import { gravado, locale, t } from "../i18n";

export type Esperando = { nome: string; dono: string; status: string };

type Props = {
  pergunta: Mensagem;
  autorPergunta: string;
  respostas: Mensagem[];
  autor: (m: Mensagem) => string;
  esperando: Esperando[];
  fechar: () => void;
};

// A mesma pergunta, as respostas de cada agente lado a lado.
export function Comparar({ pergunta, autorPergunta, respostas, autor, esperando, fechar }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal modal-largo" role="dialog" aria-modal="true" aria-labelledby="comparar-titulo">
        <div className="modal-topo">
          <h2 id="comparar-titulo">{t("Respostas lado a lado", "Side-by-side answers")}</h2>
          <button className="btn-icone" onClick={fechar} aria-label={t("Fechar", "Close")}><IconeFechar /></button>
        </div>
        <blockquote className="comparar-pergunta">
          <span className="nota">{t(`${autorPergunta} perguntou`, `${autorPergunta} asked`)}</span>
          <Texto texto={gravado(pergunta.texto)} chamaMim={() => false} />
        </blockquote>
        <div className="colunas" role="list">
          {respostas.map((r) => (
            <section key={r.id} className="coluna" role="listitem" aria-label={autor(r)}>
              <header><IconeAgente tamanho={16} /> <strong>{autor(r)}</strong>
                <time className="nota">{new Date(r.criada_em).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" })}</time>
              </header>
              <div className="coluna-corpo msg-corpo">
                {r.tipo === "proposta" && <p className="proposta-rotulo">{t("Proposta", "Proposal")} · {r.estado === "pendente" ? t("aguardando decisão", "awaiting decision") : r.estado === "aprovada" ? t("aprovada", "approved") : r.estado === "recusada" ? t("recusada", "declined") : r.estado}</p>}
                <Texto texto={gravado(r.texto)} chamaMim={() => false} />
              </div>
            </section>
          ))}
          {esperando.map((e) => (
            <section key={`${e.nome}-${e.dono}`} className="coluna coluna-esperando" role="listitem" aria-label={t(`${e.nome} de ${e.dono}, sem resposta`, `${e.dono}'s ${e.nome}, no answer yet`)}>
              <header><IconeAgente tamanho={16} /> <strong>{t(`${e.nome} de ${e.dono}`, `${e.dono}'s ${e.nome}`)}</strong></header>
              <div className="coluna-corpo">
                <p><strong>{t("Ainda não respondeu.", "No answer yet.")}</strong></p>
                <p className="nota">{e.status}. {/^(ouvindo|listening)/.test(e.status)
                  ? t("Deve responder em instantes.", "It should answer any moment.")
                  : t(`Peça para ${e.dono.split(" ")[0]} abrir o ${e.nome} e dizer “veja a sala”.`, `Ask ${e.dono.split(" ")[0]} to open ${e.nome} and say “check the room”.`)}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
