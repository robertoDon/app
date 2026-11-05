import { useCallback, useEffect, useRef, useState } from "react";
import type { Mensagem } from "../supabase";
import { IconeAgente, IconeReagir, IconeCopiar, IconeCheck, IconeDecisao, IconeFechar, IconeLapis, IconeLixo, IconeProposta, IconeRecusa, IconeResponder, IconeTarefa } from "./Icones";
import { Texto } from "./Texto";
import { Anexos } from "./Anexos";
import { naConversa, locale, t as tr } from "../i18n";

export type Citacao = { id: number; autor: string; texto: string } | null;
export type GrupoReacao = { emoji: string; quem: string[]; minha: boolean };
// indicados: a proposta disse quem decide; posso: eu estou entre quem pode decidir
export type Aprovacao = { precisa: number; quem: string[]; euAprovei: boolean; faltam: string[]; indicados?: string[] | null; posso?: boolean };

const ou = (xs: string[], palavra = "ou") => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${palavra} ${xs[xs.length - 1]}`);
const lista = (xs: string[]) => (xs.length < 2 ? xs.join("") : `${xs.slice(0, -1).join(", ")} ${tr("e", "and")} ${xs[xs.length - 1]}`);

// "1 de 2 aprovações · Roberto aprovou · falta David", com um marcador por aprovação
export function LinhaAprovacao({ a }: { a: Aprovacao }) {
  return (
    <p className="aprovacoes">
      <span className="aprovacoes-pontos" aria-hidden>{Array.from({ length: a.precisa }, (_, i) => <span key={i} className={i < a.quem.length ? "cheio" : ""} />)}</span>
      <span><strong>{a.indicados?.length
          ? a.precisa < a.indicados.length
            ? tr(`${a.precisa} de: ${ou(a.indicados)}`, `${a.precisa} of: ${ou(a.indicados, "or")}`)
            : tr(`${a.indicados.length > 1 ? "Decidem" : "Decide"}: ${lista(a.indicados)}`, `${a.indicados.length > 1 ? "Deciding" : "Decides"}: ${lista(a.indicados)}`)
          : tr(`${a.quem.length} de ${a.precisa} aprovações`, `${a.quem.length} of ${a.precisa} approvals`)}</strong>
        {a.quem.length > 0 && <> · {lista(a.quem)} {a.quem.length > 1 ? tr("aprovaram", "approved") : tr("aprovou", "approved")}</>}
        {a.faltam.length > 0 && a.quem.length < a.precisa && (a.faltam.length <= a.precisa - a.quem.length
          ? <> · {tr(`falta ${lista(a.faltam)}`, `waiting for ${lista(a.faltam)}`)}</>
          : <> · {tr(`falta mais ${a.precisa - a.quem.length}`, `${a.precisa - a.quem.length} more needed`)}</>)}
      </span>
    </p>
  );
}
export const EMOJIS = ["👍", "❤️", "😂", "🎉", "👀", "✅", "🙏", "🔥"];

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
  virarTarefa?: () => void;
  decidir?: (aprovar: boolean | "ajuste", nota?: string) => Promise<string | null>;
  tentarDeNovo?: () => void;
  irPara?: (id: number) => void;
  reacoes?: GrupoReacao[];
  reagir?: (emoji: string) => void;
  autorDe?: (id: number) => string | null; // para "#142" virar "mensagem de David"
  aprovacao?: Aprovacao | null; // sala que pede mais de uma aprovação
  tarefaDe?: (id: number) => string | null; // "#12" de uma tarefa desta sala vira o título dela
  nomeDe?: (uid: string | null) => string; // responsáveis dos itens de um plano
  abrirTarefas?: () => void;
};

// seletor rápido de emojis: abre ao lado do botão, fecha com Esc ou clique fora
function Seletor({ escolher, fechar }: { escolher: (e: string) => void; fechar: () => void }) {
  const caixa = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caixa.current?.querySelector<HTMLButtonElement>("button")?.focus();
    // o próprio botão de reagir fica de fora: ele mesmo abre e fecha
    const fora = (e: PointerEvent) => { if (!caixa.current?.parentElement?.contains(e.target as Node)) fechar(); };
    const tecla = (e: KeyboardEvent) => { if (e.key === "Escape") { e.stopPropagation(); fechar(); } };
    document.addEventListener("pointerdown", fora, true);
    document.addEventListener("keydown", tecla, true);
    return () => { document.removeEventListener("pointerdown", fora, true); document.removeEventListener("keydown", tecla, true); };
  }, [fechar]);
  return (
    <div className="seletor-emoji" ref={caixa} role="menu" aria-label={tr("Reagir", "React")}>
      {EMOJIS.map((e) => (
        <button key={e} type="button" role="menuitem" onClick={() => { escolher(e); fechar(); }} aria-label={tr(`Reagir com ${e}`, `React with ${e}`)}>{e}</button>
      ))}
    </div>
  );
}

const hora = (iso?: string | null) => (iso ? new Date(iso).toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" }) : "");

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
  const [escolhendo, setEscolhendo] = useState(false);
  const fecharSeletor = useCallback(() => setEscolhendo(false), []);
  const caixa = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    if (editando && caixa.current) {
      const c = caixa.current;
      c.focus(); c.setSelectionRange(c.value.length, c.value.length);
      c.style.height = "auto"; c.style.height = `${c.scrollHeight}px`;
    }
  }, [editando]);

  const temAcoes = !m.apagada && !m.pendente && !m.falhou && (p.responder || p.copiar || p.editar || p.apagar || p.virarTarefa || p.reagir);

  const salvar = async () => {
    const t = rascunho.trim();
    if (!t || t === m.texto) { setEditando(false); return; }
    setOcupado(true);
    const e = await p.editar!(t);
    setOcupado(false);
    if (e) setErro(e); else { setEditando(false); setErro(""); }
  };

  const decidir = async (aprovar: boolean | "ajuste") => {
    if (aprovar === "ajuste" && !nota.trim()) { setErro(tr("Diga o que precisa mudar.", "Say what needs to change.")); return; }
    setOcupado(true);
    const e = await p.decidir!(aprovar, aprovar === true ? undefined : nota.trim() || undefined);
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
              <span className="msg-de">{tr(`de ${nome}`, `${nome}'s agent`)}</span>
            </>
          ) : (
            <strong>{minha ? tr("Você", "You") : nome}</strong>
          )}
          {p.quando && <time title={p.quandoCompleto}>{p.quando}</time>}
          {m.editada_em && !m.apagada && <span className="msg-de" title={tr(`Editada às ${hora(m.editada_em)}`, `Edited at ${hora(m.editada_em)}`)}>· {tr("editada", "edited")}</span>}
        </header>
      )}

      <div className="msg-linha">
        <div className="msg-corpo">
          {proposta && (
            <p className="proposta-rotulo">
              {m.estado === "pendente" ? <span className="pilula pilula-acento"><IconeProposta tamanho={12} /> {tr("Proposta", "Proposal")}</span>
                : m.estado === "ajuste" ? <span className="pilula pilula-ajuste"><IconeLapis tamanho={12} /> {tr("Em ajuste", "Being adjusted")}</span>
                : m.estado === "substituida" ? <span className="pilula"><IconeProposta tamanho={12} /> {tr("Substituída", "Replaced")}</span>
                : <span className={`pilula ${m.estado === "aprovada" ? "pilula-ok" : "pilula-erro"}`}>{m.estado === "aprovada" ? <IconeCheck tamanho={12} /> : <IconeFechar tamanho={12} />}{m.estado === "aprovada" ? tr("Aprovada", "Approved") : tr("Recusada", "Declined")}</span>}
              {m.estado === "substituida" && m.substituida_por && <button type="button" className="link nota" onClick={() => p.irPara?.(m.substituida_por!)}>{tr("ver a versão nova", "see the new version")}</button>}
              {m.estado === "ajuste" && <span className="nota">· {tr("quem propôs vai corrigir e reenviar", "the proposer will fix and resend")}</span>}
              {m.novo_contexto && <span className="nota">{tr("troca as instruções da sala", "replaces the room instructions")}</span>}
              {m.estado === "pendente" && <span className="nota">· {m.novo_contexto ? tr("precisa do sim de todas as pessoas", "needs everyone's yes") : tr("aguardando decisão", "awaiting decision")}</span>}
            </p>
          )}
          {citacao && (
            <button type="button" className="citacao" onClick={() => p.irPara?.(citacao.id)} title={tr("Ir para a mensagem", "Go to message")}>
              <IconeResponder tamanho={14} /> <strong>{citacao.autor}</strong> <span>{citacao.texto}</span>
            </button>
          )}
          {editando ? (
            <div className="editar">
              <label className="sr" htmlFor={`ed${m.id}`}>{tr("Editar mensagem", "Edit message")}</label>
              <textarea id={`ed${m.id}`} ref={caixa} value={rascunho} maxLength={20000}
                onChange={(e) => { setRascunho(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${e.target.scrollHeight}px`; }}
                onKeyDown={(e) => {
                  if (e.key === "Escape") { e.preventDefault(); setEditando(false); setRascunho(m.texto); }
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); salvar(); }
                }} />
              <div className="linha">
                <button type="button" className="btn btn-pequeno btn-cheio" disabled={ocupado} onClick={salvar}>{tr("Salvar", "Save")}</button>
                <button type="button" className="btn btn-pequeno" onClick={() => { setEditando(false); setRascunho(m.texto); }}>{tr("Cancelar", "Cancel")}</button>
                <span className="nota">{tr("Enter salva · Esc cancela", "Enter to save · Esc to cancel")}</span>
              </div>
            </div>
          ) : m.apagada ? (
            <p className="apagada">{tr("Mensagem apagada.", "Message deleted.")}</p>
          ) : (
            <>
              {m.texto && <Texto texto={naConversa(m.texto)} chamaMim={p.chamaMim ?? (() => false)} refMsg={p.irPara && p.autorDe ? {
                ir: (id) => (p.autorDe?.(id) ? p.irPara!(id) : p.abrirTarefas?.()),
                rotulo: (id) => { const a = p.autorDe?.(id); if (a) return `↩ ${a}`; const tf = p.tarefaDe?.(id); return tf ? `☐ ${tf.length > 48 ? tf.slice(0, 47) + "…" : tf}` : null; },
              } : undefined} />}
              {!!m.anexos?.length && <Anexos anexos={m.anexos} />}
              {proposta && !!m.plano?.length && (
                <details className="plano" open={m.estado === "pendente"}>
                  <summary>{tr(`Plano: ${m.plano.length} ${m.plano.length === 1 ? "tarefa" : "tarefas"}`, `Plan: ${m.plano.length} ${m.plano.length === 1 ? "task" : "tasks"}`)}</summary>
                  <ol>
                    {m.plano.map((i, k) => (
                      <li key={k}>
                        {i.frente && <span className="pilula">{i.frente}</span>}
                        <span>{i.titulo}</span>
                        <span className="nota">
                          {i.responsavel ? (i.responsavel_agente ? tr(`${i.responsavel_agente} de ${(p.nomeDe?.(i.responsavel) ?? "?").split(" ")[0]}`, `${(p.nomeDe?.(i.responsavel) ?? "?").split(" ")[0]}'s ${i.responsavel_agente}`) : p.nomeDe?.(i.responsavel) ?? "?") : tr("sem responsável", "unassigned")}
                          {i.prazo && ` · ${new Date(i.prazo).toLocaleDateString(locale(), { day: "numeric", month: "short" }).replace(".", "")}`}
                          {i.tarefa ? tr(" · replaneja uma tarefa", " · replans a task") : ""}
                        </span>
                      </li>
                    ))}
                  </ol>
                </details>
              )}
              {proposta && m.novo_contexto && (
                <details className="contexto-novo">
                  <summary>{m.estado === "aprovada" ? tr("Ver as instruções aplicadas", "See the applied instructions") : tr("Ver as instruções propostas", "See the proposed instructions")}</summary>
                  <pre>{m.novo_contexto}</pre>
                </details>
              )}
            </>
          )}

          {proposta && (m.estado !== "pendente" || p.decidir || p.aprovacao) && (
            <div className="proposta-pe">
              {m.estado === "pendente" ? (
                p.decidir && p.aprovacao?.posso !== false ? (
                  recusando ? (
                    <form className="recusar" onSubmit={(e) => { e.preventDefault(); decidir("ajuste"); }}>
                      <label className="sr" htmlFor={`nota${m.id}`}>{tr("O que precisa mudar", "What needs to change")}</label>
                      <input id={`nota${m.id}`} autoFocus placeholder={tr("O que precisa mudar? Quem propôs lê isto.", "What needs to change? The proposer reads this.")} value={nota} maxLength={2000}
                        onChange={(e) => { setNota(e.target.value); setErro(""); }} onKeyDown={(e) => e.key === "Escape" && setRecusando(false)} />
                      <div className="decidir">
                        <button type="button" className="btn" onClick={() => setRecusando(false)}>{tr("Voltar", "Back")}</button>
                        <button className="btn btn-cheio" disabled={ocupado}>{tr("Pedir ajuste", "Request changes")}</button>
                      </div>
                      <button type="button" className="link-texto recusar-de-vez" disabled={ocupado} onClick={() => decidir(false)}>{tr("Recusar de vez", "Decline for good")}</button>
                    </form>
                  ) : (
                    <>
                      {p.aprovacao && <LinhaAprovacao a={p.aprovacao} />}
                      <div className="decidir">
                        <button type="button" className="btn" disabled={ocupado} onClick={() => { setRecusando(true); setErro(""); }}>{tr("Ajustar ou recusar", "Adjust or decline")}</button>
                        {p.aprovacao?.euAprovei
                          ? <button type="button" className="btn btn-aprovei" disabled><IconeCheck tamanho={14} /> {tr("Você aprovou", "You approved")}</button>
                          : <button type="button" className="btn btn-cheio" disabled={ocupado} onClick={() => decidir(true)}>{tr("Aprovar", "Approve")}</button>}
                      </div>
                    </>
                  )
                ) : p.aprovacao ? <LinhaAprovacao a={p.aprovacao} /> : null
              ) : (
                <p className="nota">
                  {p.decisor ? tr(`Decidida por ${p.decisor}`, `Decided by ${p.decisor}`) : tr("Decidida", "Decided")}
                  {m.decidida_em && ` · ${hora(m.decidida_em)}`}
                </p>
              )}
            </div>
          )}
        </div>

        {temAcoes && !editando && (
          <div className="msg-acoes" role="toolbar" aria-label={tr("Ações da mensagem", "Message actions")}>
            {p.reagir && (
              <span className="reagir-ancora">
                <button type="button" className="btn-acao" onClick={() => setEscolhendo((v) => !v)} aria-expanded={escolhendo} aria-haspopup="menu"
                  title={tr("Reagir", "React")} aria-label={tr("Reagir", "React")}><IconeReagir tamanho={16} /></button>
                {escolhendo && <Seletor escolher={p.reagir} fechar={fecharSeletor} />}
              </span>
            )}
            {p.responder && <button type="button" className="btn-acao" onClick={p.responder} title={tr("Responder", "Reply")} aria-label={tr("Responder", "Reply")}><IconeResponder tamanho={16} /></button>}
            {p.copiar && (
              <button type="button" className="btn-acao" title={copiado ? tr("Copiado", "Copied") : tr("Copiar texto", "Copy text")} aria-label={tr("Copiar texto", "Copy text")}
                onClick={async () => { if (await p.copiar!()) { setCopiado(true); setTimeout(() => setCopiado(false), 1200); } }}>
                {copiado ? <IconeDecisao tamanho={16} /> : <IconeCopiar tamanho={16} />}
              </button>
            )}
            {p.virarTarefa && <button type="button" className="btn-acao" onClick={p.virarTarefa} title={tr("Virar tarefa", "Make it a task")} aria-label={tr("Virar tarefa", "Make it a task")}><IconeTarefa tamanho={16} /></button>}
            {p.editar && <button type="button" className="btn-acao" onClick={() => { setRascunho(m.texto); setEditando(true); }} title={tr("Editar", "Edit")} aria-label={tr("Editar", "Edit")}><IconeLapis tamanho={16} /></button>}
            {p.apagar && <button type="button" className="btn-acao" onClick={p.apagar} title={tr("Apagar", "Delete")} aria-label={tr("Apagar", "Delete")}><IconeLixo tamanho={16} /></button>}
          </div>
        )}
      </div>

      {!!p.reacoes?.length && !m.apagada && (
        <div className="reacoes" aria-label={tr("Reações", "Reactions")}>
          {p.reacoes.map((r) => (
            <button key={r.emoji} type="button" className={`reacao ${r.minha ? "reacao-minha" : ""}`} disabled={!p.reagir}
              onClick={() => p.reagir?.(r.emoji)} aria-pressed={r.minha} title={r.quem.join(", ")}
              aria-label={`${r.emoji} ${r.quem.length}: ${r.quem.join(", ")}`}>
              <span aria-hidden>{r.emoji}</span> {r.quem.length}
            </button>
          ))}
        </div>
      )}
      {erro && <p className="msg-erro" role="alert">{erro}</p>}
      {m.falhou && (
        <p className="msg-erro" role="alert">
          {tr("Não enviou.", "Not sent.")} <button type="button" className="link" onClick={p.tentarDeNovo}>{tr("Tentar de novo", "Try again")}</button>
        </p>
      )}
    </article>
  );
}

// Decisão vira um acontecimento na linha do tempo: "Bruno aprovou a proposta de ChatGPT de Bruno".
export function Evento({ m, quem, de, quando, irPara }: { m: Mensagem; quem: string; de: string; quando: string; irPara?: (id: number) => void }) {
  const aprovou = m.estado === "aprovada";
  const ajuste = m.estado === "ajuste";
  const nota = m.texto !== "Aprovada." && m.texto !== "Recusada." ? m.texto : "";
  return (
    <div className={`evento evento-${m.estado}`} id={`m${m.id}`}>
      <span className="evento-icone" aria-hidden>{aprovou ? <IconeDecisao tamanho={16} /> : ajuste ? <IconeLapis tamanho={16} /> : <IconeRecusa tamanho={16} />}</span>
      <span className="evento-texto">
        <strong>{quem}</strong> {aprovou ? tr("aprovou", "approved") : ajuste ? tr("pediu ajuste", "asked for changes to") : tr("recusou", "declined")}{" "}
        <button type="button" className="link" onClick={() => m.responde_a && irPara?.(m.responde_a)}>{ajuste ? (de ? tr(`na proposta de ${de}`, `the proposal from ${de}`) : tr("na proposta", "the proposal")) : de ? tr(`a proposta de ${de}`, `the proposal from ${de}`) : tr("a proposta", "the proposal")}</button>
        {nota && <span className="evento-nota">“{nota}”</span>}
      </span>
      <time>{quando}</time>
    </div>
  );
}
