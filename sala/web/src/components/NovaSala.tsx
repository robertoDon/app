import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { sb } from "../supabase";
import { IconeFechar } from "./Icones";

// Modelos: um ponto de partida para o contexto que os agentes leem. Tudo editável depois.
export const MODELOS = [
  { id: "branco", titulo: "Em branco", texto: "Você escreve o contexto depois.", nome: "", contexto: "" },
  {
    id: "lancamento", titulo: "Lançamento", texto: "Produto, data, preço e o que falta.", nome: "Lançamento",
    contexto: "Objetivo: lançar [o quê] até [data].\nO que já está decidido: [preço, público, canais].\nQuem decide: [nomes]. Preço, data e qualquer publicação passam por proposta.\nAgentes: respostas curtas, com números e o próximo passo de cada um.",
  },
  {
    id: "cliente", titulo: "Cliente ou projeto", texto: "Escopo, prazo e o que pode sair para o cliente.", nome: "Projeto",
    contexto: "Cliente: [nome]. Projeto: [o que será entregue].\nPrazo: [data]. Orçamento: [valor].\nTom com o cliente: [formal, direto...].\nNada sai para o cliente sem proposta aprovada aqui.\nAgentes: tragam riscos cedo e digam o que precisam de cada pessoa.",
  },
  {
    id: "contratacao", titulo: "Contratação", texto: "Vaga, critérios e avaliação dos candidatos.", nome: "Contratação",
    contexto: "Vaga: [cargo], [modelo de trabalho], [faixa salarial].\nCritérios, em ordem de peso: [1], [2], [3].\nAgentes: resumam cada candidato numa tabela com os critérios e uma nota de 1 a 5. Nada de dado pessoal além do necessário.\nAvançar ou recusar alguém é decisão das pessoas, por proposta.",
  },
  {
    id: "decisao", titulo: "Decisão", texto: "Uma pergunta, opções lado a lado, uma escolha.", nome: "Decisão",
    contexto: "Pergunta: [o que precisamos decidir].\nPrazo: [data].\nO que importa: [custo, prazo, risco...].\nAgentes: tragam de 2 a 4 opções com prós, contras e fontes. Usem @agentes para que todos respondam e comparem lado a lado.\nUma pessoa decide por proposta.",
  },
];

export function NovaSala({ fechar, aoCriar, modeloInicial = "branco" }: { fechar: () => void; aoCriar?: () => void; modeloInicial?: string }) {
  const nav = useNavigate();
  const [modelo, setModelo] = useState(modeloInicial);
  const [nome, setNome] = useState(MODELOS.find((m) => m.id === modeloInicial)?.nome ?? "");
  const [erro, setErro] = useState("");
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const escolher = (id: string) => {
    const atual = MODELOS.find((m) => m.id === modelo);
    const novo = MODELOS.find((m) => m.id === id)!;
    if (!nome.trim() || nome === atual?.nome) setNome(novo.nome);
    setModelo(id);
  };

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    setIndo(true); setErro("");
    const { data, error } = await sb.rpc("criar_sala", { nome: nome.trim() });
    if (error) { setIndo(false); return setErro(error.message); }
    const m = MODELOS.find((x) => x.id === modelo)!;
    if (m.contexto) await sb.from("salas").update({ contexto: m.contexto }).eq("id", data as string);
    aoCriar?.();
    fechar();
    nav(`/s/${data}${m.contexto ? "?contexto=1" : ""}`);
  };

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <form className="modal" role="dialog" aria-modal="true" aria-labelledby="nova-titulo" onSubmit={criar}>
        <div className="modal-topo">
          <h2 id="nova-titulo">Nova sala</h2>
          <button type="button" className="btn-icone" onClick={fechar} aria-label="Fechar"><IconeFechar /></button>
        </div>
        <fieldset className="modelos">
          <legend className="rotulo">Comece de um modelo</legend>
          {MODELOS.map((m) => (
            <label key={m.id} className={`modelo ${modelo === m.id ? "marcado" : ""}`}>
              <input type="radio" name="modelo" value={m.id} checked={modelo === m.id} onChange={() => escolher(m.id)} />
              <strong>{m.titulo}</strong>
              <span className="nota">{m.texto}</span>
            </label>
          ))}
        </fieldset>
        <label className="rotulo" htmlFor="nova-nome">Nome da sala</label>
        <input id="nova-nome" autoFocus value={nome} maxLength={80} placeholder="Ex.: Lançamento do piloto" onChange={(e) => setNome(e.target.value)} />
        {modelo !== "branco" && <p className="nota">O contexto do modelo abre em seguida para você completar o que está entre colchetes.</p>}
        {erro && <p className="nota erro" role="alert">{erro}</p>}
        <div className="linha">
          <button className="btn btn-cheio" disabled={!nome.trim() || indo}>Criar sala</button>
          <button type="button" className="btn btn-texto" onClick={fechar}>Cancelar</button>
        </div>
      </form>
    </div>
  );
}
