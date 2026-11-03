import { useEffect, useRef, useState } from "react";
import type { Mensagem } from "../supabase";
import { IconeAgente, IconeCopiar, IconeDecisao, IconeLapis, IconeLixo, IconeProposta, IconeRecusa, IconeResponder } from "./Icones";
import { Texto } from "./Texto";
import { Anexos } from "./Anexos";

export type Citacao = { id: number; autor: string; texto: string } | null;

type Props = {
  m: Pick<Mensagem, "id" | "agente" | "texto" | "tipo" | "estado" | "apagada" | "editada_em" | "decidida_em"> & Partial<Mensagem>;
  nome: string;
  quando: string;
  quandoCompleto?: string;
  minha?: boolean;
  continua?: boolean; // mesma autoria da anterior: esconde o cabeçalho
  citacao?: Citacao;
  decisor?: string;
  destaque?: boolean;
  chamaMim?: (mencao: string) => boolean;
  // ações (sem elas, a bolha é só vitrine)
  responder?: () => void;
  copiar?: () => Promise<boolean>;
  editar?: (texto: string) => Promise<string | null>; // devolve erro ou null
  apagar?: () => void;
  decidir?: (aprovar: boolean, nota?: string) => Promise<string | null>;
  tentarDeNovo?: () => void;
  irPara?: (id: number) => void;
};

const hora = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" }) : "");

// Pessoa: bolha clara (a minha, escura). Agente: fundo suave + ícone + "Claude · de Ana".
// Proposta: cartão com Aprovar e Recusar. Estado nunca só por cor: sempre ícone e texto.
export function Bolha(p: Props) {
  const { m, nome, minha, continua, citacao } = p;
  const proposta = m.tipo === "proposta" && !m.apagada;
  const [editando, setEditando] = useState(false);
  const [rascunho, setRascunho] = useState(m.texto);
  const [erro, setErro] = useState("");
  const [recusando, setRecusando] = useState(false);
  const [nota, setNota] = useState("");
  const [ocupado, setOcupado] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const caixa = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editando && caixa.current) {
      const c = caixa.current;
      c.focus(); c.setSelectionRange(c.value.length, c.value.length);
      c.style.height = "auto"; c.style.height = `${c.scrollHeight}px`;
    }
  }, [editando]);

  const temAcoes = !m.apagada && !m.pendente && !m.falhou && (p.responder || p.copiar || p.editar || p.apagar);

  const salvar = async () => {
    const t = rascunho.trim();
    if (!t || t === m.texto) { setEditando(false); return; }
    setOcupado(true);
    const e = await p.editar!(t);
    setOcupado(false);
    if (e) setErro(e); else { setEditando(false); setErro(""); }
  };

  const decidir = async (aprovar: boolean) => {
    setOcupado(true);
    const e = await p.decidir!(aprovar, aprovar ? undefined : nota);
    setOcupado(false);
    if (e) setErro(e); else { setRecusando(false); setErro(""); }
  };

  const cls = ["msg", m.agente ? "msg-agente" : "msg-pessoa", minha ? "msg-minha" : "", m.pendente ? "msg-pendente" : "",
    m.falhou ? "msg-falhou" : "", continua && !proposta ? "msg-continua" : "", proposta ? "msg-proposta" : "",
    m.apagada ? "msg-apagada" : "", p.destaque ? "msg-destaque" : ""].join(" ");

  return (
    <article className={cls} id={`m${m.id}`} tabIndex={-1}>
      {(!continua || proposta) && (
        <header className="msg-meta">
          {m.agente ? (
            <>
              <span className="msg-selo"><IconeAgente tamanho={14} /> {m.agente}</span>
              <span className="msg-de">de {nome}</span>
            </>
          ) : (
            <strong>{minha ? "Você" : nome}</strong>
          )}
          {p.quando && <time title={p.quandoCompleto}>{p.quando}</time>}
          {m.editada_em && !m.apagada && <span className="msg-de" title={`Editada às ${hora(m.editada_em)}`}>· editada</span>}
        </header>
      )}

      <div className="msg-linha">
        <div className="msg-corpo">
          {proposta && <p className="proposta-rotulo"><IconeProposta tamanho={14} /> Proposta</p>}
          {citacao && (
            <button type="button" className="citacao" onClick={() => p.irPara?.(citacao.id)} title="Ir para a mensagem">
              <IconeResponder tamanho={14} /> <strong>{citacao.autor}</strong> <span>{citacao.texto}</span>
            </button>
          )}
          {editando ? (
            <div className="editar">
              <label className="sr" htmlFor={`ed${m.id}`}>Editar mensagem</label>
              <textarea id={`ed${m.id}`} ref={caixa} value={rascunho} maxLength={20000}
                onChange={(e) => { setRascunho(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { e.preventDefault(); setEditando(false); setRascunho(m.texto); }
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); salvar(); }
                }} />
              <div className="linha">
                <button type="button" className="btn btn-pequeno btn-cheio" disabled={ocupado} onClick={salvar}>Salvar</button>
                <button type="button" className="btn btn-pequeno" onClick={() => { setEditando(false); setRascunho(m.texto); }}>Cancelar</button>
                <span className="nota">Enter salva · Esc cancela</span>
              </div>
            </div>
          ) : m.apagada ? (
            <p className="apagada">Mensagem apagada.</p>
          ) : (
            <>
              {m.texto && <Texto texto={m.texto} chamaMim={p.chamaMim ?? (() => false)} />}
              {!!m.anexos?.length && <Anexos anexos={m.anexos} />}
            </>
          )}

          {proposta && (
            <div className="proposta-pe">
              {m.estado === "pendente" ? (
                p.decidir ? (
                  recusando ? (
                    <form className="recusar" onSubmit={(e) => { e.preventDefault(); decidir(false); }}>
                      <label className="sr" htmlFor={`nota${m.id}`}>Por que recusar</label>
                      <input id={`nota${m.id}`} autoFocus placeholder="Por quê? O agente lê isto. (opcional)" value={nota} maxLength={2000}
                        onChange={(e) => setNota(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setRecusando(false)} />
                      <div className="linha">
                        <button className="btn btn-pequeno" disabled={ocupado}>Recusar proposta</button>
                        <button type="button" className="btn btn-pequeno btn-texto" onClick={() => setRecusando(false)}>Voltar</button>
                      </div>
                    </form>
                  ) : (
                    <div className="linha">
                      <button type="button" className="btn btn-pequeno btn-cheio" disabled={ocupado} onClick={() => decidir(true)}>
                        <IconeDecisao tamanho={16} /> Aprovar
                      </button>
                      <button type="button" className="btn btn-pequeno" disabled={ocupado} onClick={() => setRecusando(true)}>
                        <IconeRecusa tamanho={16} /> Recusar
                      </button>
                      <span className="nota">Aguardando decisão</span>
                    </div>
                  )
                ) : <span className="nota">Aguardando decisão</span>
              ) : (
                <p className={`decidida decidida-${m.estado}`}>
                  {m.estado === "aprovada" ? <IconeDecisao tamanho={16} /> : <IconeRecusa tamanho={16} />}
                  {m.estado === "aprovada" ? "Aprovada" : "Recusada"}{p.decisor ? ` por ${p.decisor}` : ""}
                  {m.decidida_em && <time>· {hora(m.decidida_em)}</time>}
                </p>
              )}
            </div>
          )}
        </div>

        {temAcoes && !editando && (
          <div className="msg-acoes" role="toolbar" aria-label="Ações da mensagem">
            {p.responder && <button type="button" className="btn-acao" onClick={p.responder} title="Responder" aria-label="Responder"><IconeResponder tamanho={16} /></button>}
            {p.copiar && (
              <button type="button" className="btn-acao" title={copiado ? "Copiado" : "Copiar texto"} aria-label="Copiar texto"
                onClick={async () => { if (await p.copiar!()) { setCopiado(true); setTimeout(() => setCopiado(false), 1200); } }}>
                {copiado ? <IconeDecisao tamanho={16} /> : <IconeCopiar tamanho={16} />}
              </button>
            )}
            {p.editar && <button type="button" className="btn-acao" onClick={() => { setRascunho(m.texto); setEditando(true); }} title="Editar" aria-label="Editar"><IconeLapis tamanho={16} /></button>}
            {p.apagar && <button type="button" className="btn-acao" onClick={p.apagar} title="Apagar" aria-label="Apagar"><IconeLixo tamanho={16} /></button>}
          </div>
        )}
      </div>

      {erro && <p className="msg-erro" role="alert">{erro}</p>}
      {m.falhou && (
        <p className="msg-erro" role="alert">
          Não enviou. <button type="button" className="link" onClick={p.tentarDeNovo}>Tentar de novo</button>
        </p>
      )}
    </article>
  );
}

// Decisão vira um acontecimento na linha do tempo: "Bruno aprovou a proposta de ChatGPT de Bruno".
export function Evento({ m, quem, de, quando, irPara }: { m: Mensagem; quem: string; de: string; quando: string; irPara?: (id: number) => void }) {
  const aprovou = m.estado === "aprovada";
  const nota = m.texto !== "Aprovada." && m.texto !== "Recusada." ? m.texto : "";
  return (
    <div className={`evento evento-${m.estado}`} id={`m${m.id}`}>
      <span className="evento-icone" aria-hidden>{aprovou ? <IconeDecisao tamanho={16} /> : <IconeRecusa tamanho={16} />}</span>
      <span className="evento-texto">
        <strong>{quem}</strong> {aprovou ? "aprovou" : "recusou"}{" "}
        <button type="button" className="link" onClick={() => m.responde_a && irPara?.(m.responde_a)}>a proposta{de ? ` de ${de}` : ""}</button>
        {nota && <span className="evento-nota">“{nota}”</span>}
      </span>
      <time>{quando}</time>
    </div>
  );
}
