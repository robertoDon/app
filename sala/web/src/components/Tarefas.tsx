import { useEffect, useState } from "react";
import { atrasada, sb, type Membro, type Tarefa } from "../supabase";
import type { AgenteSala } from "../pages/Sala";
import { IconeAgente, IconeCaixa, IconeFechar, IconeMais, IconeTarefa } from "./Icones";

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
  const [t, uid, ...ag] = v.split(":");
  return { responsavel: uid, responsavel_agente: t === "a" ? ag.join(":") : null };
};
const paraInput = (iso: string | null) => (iso ? new Date(new Date(iso).getTime() - new Date().getTimezoneOffset() * 60000).toISOString().slice(0, 10) : "");
const doInput = (d: string) => (d ? new Date(`${d}T18:00:00`).toISOString() : null); // prazo: fim do dia útil
export const prazoCurto = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date(); const amanha = new Date(); amanha.setDate(hoje.getDate() + 1);
  if (d.toDateString() === hoje.toDateString()) return "hoje";
  if (d.toDateString() === amanha.toDateString()) return "amanhã";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "");
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
      <label className="sr" htmlFor="tf-titulo">O que precisa ser feito</label>
      <input id="tf-titulo" autoFocus value={titulo} maxLength={200} placeholder="O que precisa ser feito" onChange={(e) => setTitulo(e.target.value)} />
      <div className="tarefa-campos">
        <label><span className="rotulo">Quem faz</span>
          <select value={resp} onChange={(e) => setResp(e.target.value)}>
            <option value="">Ninguém ainda</option>
            <optgroup label="Pessoas">
              {membros.map((m) => <option key={m.user_id} value={valorResp(m.user_id, null)}>{m.perfis?.nome}</option>)}
            </optgroup>
            {agentes.length > 0 && (
              <optgroup label="Agentes">
                {agentes.map((a) => <option key={`${a.nome}${a.uid}`} value={valorResp(a.uid, a.nome)}>{a.nome} de {nome(a.uid).split(" ")[0]}</option>)}
              </optgroup>
            )}
          </select>
        </label>
        <label><span className="rotulo">Prazo</span>
          <input type="date" value={prazo} onChange={(e) => setPrazo(e.target.value)} />
        </label>
      </div>
      {erro && <p className="nota erro" role="alert">{erro}</p>}
      <div className="linha">
        <button className="btn btn-pequeno btn-cheio" disabled={!titulo.trim() || indo}>{botao}</button>
        <button type="button" className="btn btn-pequeno btn-texto" onClick={cancelar}>Cancelar</button>
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

  const quem = (t: Tarefa) => (t.responsavel_agente ? `${t.responsavel_agente} de ${nome(t.responsavel).split(" ")[0]}` : t.responsavel ? (t.responsavel === eu ? "Você" : nome(t.responsavel)) : "Sem responsável");
  const minha = (t: Tarefa) => t.responsavel === eu;
  const lista = (tarefas ?? []).filter((t) => t.estado !== "cancelada" && (so === "todas" || minha(t)));
  const abertas = lista.filter((t) => t.estado === "aberta")
    .sort((a, b) => (a.prazo ? new Date(a.prazo).getTime() : Infinity) - (b.prazo ? new Date(b.prazo).getTime() : Infinity) || b.id - a.id);
  const feitas = lista.filter((t) => t.estado === "feita").sort((a, b) => (b.concluida_em ?? "").localeCompare(a.concluida_em ?? "")).slice(0, 30);

  const criar = async (titulo: string, resp: string, prazo: string) => {
    const r = lerResp(resp);
    const { error } = await sb.rpc("criar_tarefa", {
      sala: salaId, titulo, origem: rascunho?.origem ?? null, responsavel: r.responsavel, responsavel_agente: r.responsavel_agente, prazo: doInput(prazo),
    });
    if (error) return error.message;
    setNova(false); limparRascunho();
    return null;
  };

  const salvar = (t: Tarefa) => async (titulo: string, resp: string, prazo: string) => {
    const r = lerResp(resp);
    const { error } = await sb.rpc("editar_tarefa", { tarefa: t.id, titulo, responsavel: r.responsavel, responsavel_agente: r.responsavel_agente, prazo: doInput(prazo), estado: "aberta" });
    if (error) return error.message;
    setEditando(null);
    return null;
  };

  const concluir = async (t: Tarefa) => {
    const { error } = await sb.rpc("concluir_tarefa", { tarefa: t.id, resultado: resultado.trim() || null });
    if (error) return alert(error.message);
    setConcluindo(null); setResultado("");
  };

  const cancelarTarefa = async (t: Tarefa) => {
    if (!confirm(`Cancelar a tarefa "${t.titulo}"? Ela sai da lista.`)) return;
    const { error } = await sb.rpc("editar_tarefa", { tarefa: t.id, titulo: t.titulo, responsavel: t.responsavel, responsavel_agente: t.responsavel_agente, prazo: t.prazo, estado: "cancelada" });
    if (error) alert(error.message);
  };

  const reabrir = async (t: Tarefa) => {
    const { error } = await sb.rpc("editar_tarefa", { tarefa: t.id, titulo: t.titulo, responsavel: t.responsavel, responsavel_agente: t.responsavel_agente, prazo: t.prazo, estado: "aberta" });
    if (error) alert(error.message);
  };

  return (
    <aside className="painel" aria-label="Tarefas da sala">
      <header className="painel-topo">
        <h2>Tarefas</h2>
        <button className="btn-icone" onClick={fechar} aria-label="Fechar tarefas"><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <div className="linha linha-entre">
          <div className="abas abas-mini" role="tablist" aria-label="Filtrar">
            <button role="tab" aria-selected={so === "todas"} className={so === "todas" ? "aba ativa" : "aba"} onClick={() => setSo("todas")}>Todas</button>
            <button role="tab" aria-selected={so === "minhas"} className={so === "minhas" ? "aba ativa" : "aba"} onClick={() => setSo("minhas")}>Minhas</button>
          </div>
          {!nova && <button className="btn btn-pequeno" onClick={() => { setNova(true); setEditando(null); }}><IconeMais tamanho={16} /> Nova tarefa</button>}
        </div>
        {nova && (
          <Formulario key={rascunho?.origem ?? "nova"} membros={membros} agentes={agentes} nome={nome} botao="Criar tarefa"
            inicial={{ titulo: rascunho?.titulo ?? "", responsavel: rascunho?.responsavel ?? valorResp(eu, null), prazo: rascunho?.prazo ?? "" }}
            salvar={criar} cancelar={() => { setNova(false); limparRascunho(); }} />
        )}
      </section>

      {tarefas === null && <div className="painel-secao"><div className="esqueleto" /><div className="esqueleto" /></div>}

      {tarefas && !abertas.length && !feitas.length && !nova && (
        <section className="painel-secao painel-vazio">
          <IconeTarefa />
          <p><strong>{so === "minhas" ? "Nada com você agora." : "Nenhuma tarefa ainda."}</strong></p>
          <p className="nota">Toda proposta aprovada vira tarefa de quem propôs. Para transformar qualquer mensagem em tarefa, use o botão de tarefa na própria mensagem.</p>
        </section>
      )}

      {abertas.length > 0 && (
        <section className="painel-secao">
          <span className="rotulo">Abertas · {abertas.length}</span>
          <ul className="tarefas">
            {abertas.map((t) => (
              <li key={t.id} className={atrasada(t) ? "tarefa-atrasada" : ""}>
                {editando === t.id ? (
                  <Formulario membros={membros} agentes={agentes} nome={nome} botao="Salvar"
                    inicial={{ titulo: t.titulo, responsavel: valorResp(t.responsavel, t.responsavel_agente), prazo: paraInput(t.prazo) }}
                    salvar={salvar(t)} cancelar={() => setEditando(null)} />
                ) : (
                  <>
                    <div className="tarefa-linha">
                      <button className="tarefa-marca" onClick={() => { setConcluindo(t.id); setResultado(""); }} aria-label={`Concluir: ${t.titulo}`} title="Concluir">
                        <IconeCaixa tamanho={20} />
                      </button>
                      <div className="tarefa-texto">
                        <strong>{t.titulo}</strong>
                        <span className="nota">
                          {t.responsavel_agente && <IconeAgente tamanho={12} />} {quem(t)}
                          {t.prazo && <> · <span className={atrasada(t) ? "atrasada" : ""}>{atrasada(t) ? "Atrasada · era " : "até "}{prazoCurto(t.prazo)}</span></>}
                          {t.origem && <> · <button className="link" onClick={() => irPara(t.origem!)}>ver na conversa</button></>}
                        </span>
                      </div>
                    </div>
                    {concluindo === t.id ? (
                      <form className="tarefa-form" onSubmit={(e) => { e.preventDefault(); concluir(t); }}>
                        <label className="sr" htmlFor={`res${t.id}`}>Resultado</label>
                        <input id={`res${t.id}`} autoFocus value={resultado} maxLength={4000} placeholder="O que foi feito? Link, número… (opcional)"
                          onChange={(e) => setResultado(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setConcluindo(null)} />
                        <div className="linha">
                          <button className="btn btn-pequeno btn-cheio">Concluir</button>
                          <button type="button" className="btn btn-pequeno btn-texto" onClick={() => setConcluindo(null)}>Voltar</button>
                        </div>
                      </form>
                    ) : (
                      <div className="tarefa-acoes">
                        <button className="link nota" onClick={() => { setEditando(t.id); setNova(false); }}>Editar</button>
                        <button className="link nota" onClick={() => cancelarTarefa(t)}>Cancelar</button>
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
          <span className="rotulo">Feitas · {feitas.length}</span>
          <ul className="tarefas">
            {feitas.map((t) => (
              <li key={t.id} className="tarefa-feita">
                <div className="tarefa-linha">
                  <span className="tarefa-marca feita" aria-hidden><IconeTarefa tamanho={20} /></span>
                  <div className="tarefa-texto">
                    <strong>{t.titulo}</strong>
                    <span className="nota">
                      Feita por {t.concluida_por_agente ? `${t.concluida_por_agente} de ${nome(t.concluida_por).split(" ")[0]}` : t.concluida_por === eu ? "você" : nome(t.concluida_por)}
                      {t.concluida_em && ` · ${prazoCurto(t.concluida_em)}`}
                    </span>
                    {t.resultado && <span className="tarefa-resultado">{t.resultado}</span>}
                    <span className="tarefa-acoes">
                      {t.origem && <button className="link nota" onClick={() => irPara(t.origem!)}>ver na conversa</button>}
                      <button className="link nota" onClick={() => reabrir(t)}>Reabrir</button>
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
