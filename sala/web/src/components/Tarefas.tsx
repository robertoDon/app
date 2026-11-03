import { useEffect, useState } from "react";
import { atrasada, sb, type Membro, type Tarefa } from "../supabase";
import type { AgenteSala } from "../pages/Sala";
import { IconeAgente, IconeCaixa, IconeFechar, IconeMais, IconeTarefa } from "./Icones";
import { erro as msgErro, locale, t } from "../i18n";

export type RascunhoTarefa = { titulo: string; origem: number | null; responsavel: string; prazo?: string } | null;

type Props = {
  salaId: string;
  tarefas: Tarefa[] | null;
  membros: Membro[];
  agentes: AgenteSala[];
  eu: string;
  nome: (uid: string | null) => string;
  rascunho: RascunhoTarefa;
  limparRascunho: () => void;
  irPara: (id: number) => void;
  fechar: () => void;
};

// valor do seletor de responsável: "p:<pessoa>" ou "a:<pessoa>:<agente>"
export const valorResp = (uid: string | null, agente: string | null) => (uid ? (agente ? `a:${uid}:${agente}` : `p:${uid}`) : "");
const lerResp = (v: string) => {
  if (!v) return { responsavel: null, responsavel_agente: null };
  const [tf, uid, ...ag] = v.split(":");
  return { responsavel: uid, responsavel_agente: tf === "a" ? ag.join(":") : null };
};
const paraInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
// prazo só com data: vale até as 18h no fuso de quem escolheu (fim do dia útil)
const doInput = (d: string) => {
  const [a, m, dia] = d.split("-").map(Number);
  return a && m && dia ? new Date(a, m - 1, dia, 18, 0, 0).toISOString() : null;
};
export const prazoCurto = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date(); const amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
  if (d.toDateString() === hoje.toDateString()) return t("hoje", "today");
  if (d.toDateString() === amanha.toDateString()) return t("amanhã", "tomorrow");
  return d.toLocaleDateString(locale(), { day: "numeric", month: "short" }).replace(".", "");
};

function Formulario({ inicial, membros, agentes, nome, salvar, cancelar, botao }: {
  inicial: { titulo: string; responsavel: string; prazo: string };
  membros: Membro[]; agentes: AgenteSala[]; nome: (uid: string | null) => string;
  salvar: (titulo: string, resp: string, prazo: string) => Promise<string | null>; cancelar: () => void; botao: string;
}) {
  const [titulo, setTitulo] = useState(inicial.titulo);
  const [resp, setResp] = useState(inicial.responsavel);
  const [prazo, setPrazo] = useState(inicial.prazo);
  const [erro, setErro] = useState("");
  const [indo, setIndo] = useState(false);
  return (
    <form className="tarefa-form" onSubmit={async (e) => {
      e.preventDefault();
      if (!titulo.trim()) return;
      setIndo(true);
      const r = await salvar(titulo.trim(), resp, prazo);
      setIndo(false);
      if (r) setErro(r);
    }} onKeyDown={(e) => e.key === "Escape" && cancelar()}>
      <label className="sr" htmlFor="tf-titulo">{t("O que precisa ser feito", "What needs to be done")}</label>
      <input id="tf-titulo" autoFocus value={titulo} maxLength={200} placeholder={t("O que precisa ser feito", "What needs to be done")} onChange={(e) => setTitulo(e.target.value)} />
      <div className="tarefa-campos">
        <label><span className="rotulo">{t("Quem faz", "Assignee")}</span>
          <select value={resp} onChange={(e) => setResp(e.target.value)}>
            <option value="">{t("Ninguém ainda", "No one yet")}</option>
            <optgroup label={t("Pessoas", "People")}>
              {membros.map((m) => <option key={m.user_id} value={valorResp(m.user_id, null)}>{m.perfis?.nome}</option>)}
            </optgroup>
            {agentes.length > 0 && (
              <optgroup label={t("Agentes", "Agents")}>
                {agentes.map((a) => <option key={`${a.nome}${a.uid}`} value={valorResp(a.uid, a.nome)}>{t(`${a.nome} de ${nome(a.uid).split(" ")[0]}`, `${nome(a.uid).split(" ")[0]}'s ${a.nome}`)}</option>)}
              </optgroup>
            )}
          </select>
        </label>
        <label><span className="rotulo">{t("Prazo", "Due date")}</span>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} title={t("vale até as 18h", "due by 6 pm")} />
          {prazo && <span className="nota">{t("vale até as 18h", "due by 6 pm")}</span>}
        </label>
      </div>
      {erro && <p className="nota erro" role="alert">{erro}</p>}
      <div className="linha">
        <button className="btn btn-pequeno btn-cheio" disabled={!titulo.trim() || indo}>{botao}</button>
        <button type="button" className="btn btn-pequeno btn-texto" onClick={cancelar}>{t("Cancelar", "Cancel")}</button>
      </div>
    </form>
  );
}

// Tarefas da sala: o que está aberto, com quem e até quando; o que já foi entregue.
export function Tarefas({ salaId, tarefas, membros, agentes, eu, nome, rascunho, limparRascunho, irPara, fechar }: Props) {
  const [nova, setNova] = useState(false);
  const [editando, setEditando] = useState<number | null>(null);
  const [concluindo, setConcluindo] = useState<number | null>(null);
  const [resultado, setResultado] = useState("");
  const [so, setSo] = useState<"todas" | "minhas">("todas");

  useEffect(() => { if (rascunho) { setNova(true); setEditando(null); } }, [rascunho]);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && !nova && editando === null && concluindo === null && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar, nova, editando, concluindo]);

  const quem = (tf: Tarefa) => (tf.responsavel_agente ? t(`${tf.responsavel_agente} de ${nome(tf.responsavel).split(" ")[0]}`, `${nome(tf.responsavel).split(" ")[0]}'s ${tf.responsavel_agente}`) : tf.responsavel ? (tf.responsavel === eu ? t("Você", "You") : nome(tf.responsavel)) : t("Sem responsável", "Unassigned"));
  const minha = (tf: Tarefa) => tf.responsavel === eu;
  const lista = (tarefas ?? []).filter((tf) => tf.estado !== "cancelada" && (so === "todas" || minha(tf)));
  const abertas = lista.filter((tf) => tf.estado === "aberta")
    .sort((a, b) => (a.prazo ? new Date(a.prazo).getTime() : Infinity) - (b.prazo ? new Date(b.prazo).getTime() : Infinity) || b.id - a.id);
  const feitas = lista.filter((tf) => tf.estado === "feita").sort((a, b) => (b.concluida_em ?? "").localeCompare(a.concluida_em ?? "")).slice(0, 30);

  const criar = async (titulo: string, resp: string, prazo: string) => {
    const r = lerResp(resp);
    const { error } = await sb.rpc("criar_tarefa", {
      sala: salaId, titulo, origem: rascunho?.origem ?? null, responsavel: r.responsavel, responsavel_agente: r.responsavel_agente, prazo: doInput(prazo),
    });
    if (error) return msgErro(error);
    setNova(false); limparRascunho();
    return null;
  };

  const salvar = (tf: Tarefa) => async (titulo: string, resp: string, prazo: string) => {
    const r = lerResp(resp);
    const { error } = await sb.rpc("editar_tarefa", { tarefa: tf.id, titulo, responsavel: r.responsavel, responsavel_agente: r.responsavel_agente, prazo: doInput(prazo), estado: "aberta" });
    if (error) return msgErro(error);
    setEditando(null);
    return null;
  };

  const concluir = async (tf: Tarefa) => {
    const { error } = await sb.rpc("concluir_tarefa", { tarefa: tf.id, resultado: resultado.trim() || null });
    if (error) return alert(msgErro(error));
    setConcluindo(null); setResultado("");
  };

  const cancelarTarefa = async (tf: Tarefa) => {
    if (!confirm(t(`Cancelar a tarefa "${tf.titulo}"? Ela sai da lista.`, `Cancel the task "${tf.titulo}"? It will be removed from the list.`))) return;
    const { error } = await sb.rpc("editar_tarefa", { tarefa: tf.id, titulo: tf.titulo, responsavel: tf.responsavel, responsavel_agente: tf.responsavel_agente, prazo: tf.prazo, estado: "cancelada" });
    if (error) alert(msgErro(error));
  };

  const reabrir = async (tf: Tarefa) => {
    const { error } = await sb.rpc("editar_tarefa", { tarefa: tf.id, titulo: tf.titulo, responsavel: tf.responsavel, responsavel_agente: tf.responsavel_agente, prazo: tf.prazo, estado: "aberta", reabrir: true });
    if (error) alert(msgErro(error));
  };

  return (
    <aside className="painel" aria-label={t("Tarefas da sala", "Room tasks")}>
      <header className="painel-topo">
        <h2>{t("Tarefas", "Tasks")}</h2>
        <button className="btn-icone" onClick={fechar} aria-label={t("Fechar tarefas", "Close tasks")}><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <div className="linha linha-entre">
          <div className="abas abas-mini" role="tablist" aria-label={t("Filtrar", "Filter")}>
            <button role="tab" aria-selected={so === "todas"} className={so === "todas" ? "aba ativa" : "aba"} onClick={() => setSo("todas")}>{t("Todas", "All")}</button>
            <button role="tab" aria-selected={so === "minhas"} className={so === "minhas" ? "aba ativa" : "aba"} onClick={() => setSo("minhas")}>{t("Minhas", "Mine")}</button>
          </div>
          {!nova && <button className="btn btn-pequeno" onClick={() => { setNova(true); setEditando(null); }}><IconeMais tamanho={16} /> {t("Nova tarefa", "New task")}</button>}
        </div>
        {nova && (
          <Formulario key={rascunho?.origem ?? "nova"} membros={membros} agentes={agentes} nome={nome} botao={t("Criar tarefa", "Create task")}
            inicial={{ titulo: rascunho?.titulo ?? "", responsavel: rascunho?.responsavel ?? valorResp(eu, null), prazo: rascunho?.prazo ?? "" }}
            salvar={criar} cancelar={() => { setNova(false); limparRascunho(); }} />
        )}
      </section>

      {tarefas === null && <div className="painel-secao"><div className="esqueleto" /><div className="esqueleto" /></div>}

      {tarefas && !abertas.length && !feitas.length && !nova && (
        <section className="painel-secao painel-vazio">
          <IconeTarefa />
          <p><strong>{so === "minhas" ? t("Nada com você agora.", "Nothing assigned to you right now.") : t("Nenhuma tarefa ainda.", "No tasks yet.")}</strong></p>
          <p className="nota">{t("Toda proposta aprovada vira tarefa de quem propôs. Para transformar qualquer mensagem em tarefa, use o botão de tarefa na própria mensagem.", "Every approved proposal becomes a task for whoever proposed it. To turn any message into a task, use the task button on the message.")}</p>
        </section>
      )}

      {abertas.length > 0 && (
        <section className="painel-secao">
          <span className="rotulo">{t("Abertas", "Open")} · {abertas.length}</span>
          <ul className="tarefas">
            {abertas.map((tf) => (
              <li key={tf.id} className={atrasada(tf) ? "tarefa-atrasada" : ""}>
                {editando === tf.id ? (
                  <Formulario membros={membros} agentes={agentes} nome={nome} botao={t("Salvar", "Save")}
                    inicial={{ titulo: tf.titulo, responsavel: valorResp(tf.responsavel, tf.responsavel_agente), prazo: paraInput(tf.prazo) }}
                    salvar={salvar(tf)} cancelar={() => setEditando(null)} />
                ) : (
                  <>
                    <div className="tarefa-linha">
                      <button className="tarefa-marca" onClick={() => { setConcluindo(tf.id); setResultado(""); }} aria-label={t(`Concluir: ${tf.titulo}`, `Complete: ${tf.titulo}`)} title={t("Concluir", "Complete")}>
                        <IconeCaixa tamanho={20} />
                      </button>
                      <div className="tarefa-texto">
                        <strong>{tf.titulo}</strong>
                        <span className="nota">
                          {tf.responsavel_agente && <IconeAgente tamanho={12} />} {quem(tf)}
                          {tf.prazo && <> · <span className={atrasada(tf) ? "atrasada" : ""}>{atrasada(tf) ? t("Atrasada · era ", "Overdue · was due ") : t("até ", "due ")}{prazoCurto(tf.prazo)}</span></>}
                          {tf.origem && <> · <button className="link" onClick={() => irPara(tf.origem!)}>{t("ver na conversa", "view in chat")}</button></>}
                        </span>
                      </div>
                    </div>
                    {concluindo === tf.id ? (
                      <form className="tarefa-form" onSubmit={(e) => { e.preventDefault(); concluir(tf); }}>
                        <label className="sr" htmlFor={`res${tf.id}`}>{t("Resultado", "Result")}</label>
                        <input id={`res${tf.id}`} autoFocus value={resultado} maxLength={4000} placeholder={t("O que foi feito? Link, número… (opcional)", "What was done? Link, number… (optional)")}
                          onChange={(e) => setResultado(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setConcluindo(null)} />
                        <div className="linha">
                          <button className="btn btn-pequeno btn-cheio">{t("Concluir", "Complete")}</button>
                          <button type="button" className="btn btn-pequeno btn-texto" onClick={() => setConcluindo(null)}>{t("Voltar", "Back")}</button>
                        </div>
                      </form>
                    ) : (
                      <div className="tarefa-acoes">
                        <button className="link nota" onClick={() => { setEditando(tf.id); setNova(false); }}>{t("Editar", "Edit")}</button>
                        <button className="link nota" onClick={() => cancelarTarefa(tf)}>{t("Cancelar tarefa", "Cancel task")}</button>
                      </div>
                    )}
                  </>
                )}
              </li>
            ))}
          </ul>
        </section>
      )}

      {feitas.length > 0 && (
        <section className="painel-secao">
          <span className="rotulo">{t("Feitas", "Done")} · {feitas.length}</span>
          <ul className="tarefas">
            {feitas.map((tf) => (
              <li key={tf.id} className="tarefa-feita">
                <div className="tarefa-linha">
                  <span className="tarefa-marca feita" aria-hidden><IconeTarefa tamanho={20} /></span>
                  <div className="tarefa-texto">
                    <strong>{tf.titulo}</strong>
                    <span className="nota">
                      {t("Feita por", "Done by")} {tf.concluida_por_agente ? t(`${tf.concluida_por_agente} de ${nome(tf.concluida_por).split(" ")[0]}`, `${nome(tf.concluida_por).split(" ")[0]}'s ${tf.concluida_por_agente}`) : tf.concluida_por === eu ? t("você", "you") : nome(tf.concluida_por)}
                      {tf.concluida_em && ` · ${prazoCurto(tf.concluida_em)}`}
                    </span>
                    {tf.resultado && <span className="tarefa-resultado">{tf.resultado}</span>}
                    <span className="tarefa-acoes">
                      {tf.origem && <button className="link nota" onClick={() => irPara(tf.origem!)}>{t("ver na conversa", "view in chat")}</button>}
                      <button className="link nota" onClick={() => reabrir(tf)}>{t("Reabrir", "Reopen")}</button>
                    </span>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
