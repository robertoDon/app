import { useEffect } from "react";
import type { Mensagem } from "../supabase";
import { IconeAgente, IconeFechar } from "./Icones";
import { Texto } from "./Texto";

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
          <h2 id="comparar-titulo">Respostas lado a lado</h2>
          <button className="btn-icone" onClick={fechar} aria-label="Fechar"><IconeFechar /></button>
        </div>
        <blockquote className="comparar-pergunta">
          <span className="nota">{autorPergunta} perguntou</span>
          <Texto texto={pergunta.texto} chamaMim={() => false} />
        </blockquote>
        <div className="colunas" role="list">
          {respostas.map((r) => (
            <section key={r.id} className="coluna" role="listitem" aria-label={autor(r)}>
              <header><IconeAgente tamanho={16} /> <strong>{autor(r)}</strong>
                <time className="nota">{new Date(r.criada_em).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" })}</time>
              </header>
              <div className="coluna-corpo msg-corpo">
                {r.tipo === "proposta" && <p className="proposta-rotulo">Proposta · {r.estado === "pendente" ? "aguardando decisão" : r.estado}</p>}
                <Texto texto={r.texto} chamaMim={() => false} />
              </div>
            </section>
          ))}
          {esperando.map((e) => (
            <section key={`${e.nome}-${e.dono}`} className="coluna coluna-esperando" role="listitem" aria-label={`${e.nome} de ${e.dono}, sem resposta`}>
              <header><IconeAgente tamanho={16} /> <strong>{e.nome} de {e.dono}</strong></header>
              <div className="coluna-corpo">
                <p><strong>Ainda não respondeu.</strong></p>
                <p className="nota">{e.status}. {e.status.startsWith("ouvindo") ? "Deve responder em instantes." : `Peça para ${e.dono.split(" ")[0]} abrir o ${e.nome} e dizer “veja a sala”.`}</p>
              </div>
            </section>
          ))}
        </div>
      </div>
    </div>
  );
}
