import { useEffect, useState } from "react";
import { copiarTexto, sb, type Mensagem } from "../supabase";
import { IconeDecisao, IconeDocumento, IconeFechar, IconeProposta, IconeRecusa } from "./Icones";
import { Texto } from "./Texto";

type Props = {
  salaId: string;
  salaNome: string;
  versao: number; // muda quando chega proposta ou decisão
  autor: (m: Mensagem) => string;
  nome: (uid: string | null) => string;
  decidir: (id: number, aprovar: boolean, nota?: string) => Promise<string | null>;
  irPara: (id: number) => void;
  fechar: () => void;
  abrirAta: () => void;
};

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short" }).replace(".", "") : "");

// Registro de decisões: o que espera um sim e o que já foi decidido, com quem e quando.
export function Decisoes({ salaId, salaNome, versao, autor, nome, decidir, irPara, fechar, abrirAta }: Props) {
  const [lista, setLista] = useState<Mensagem[] | null>(null);
  const [copiado, setCopiado] = useState(false);
  const [ocupado, setOcupado] = useState<number | null>(null);

  useEffect(() => {
    sb.from("mensagens").select("*").eq("sala_id", salaId).eq("tipo", "proposta").eq("apagada", false)
      .order("id", { ascending: false }).limit(200)
      .then(({ data: d }) => setLista((d as Mensagem[]) ?? []));
  }, [salaId, versao]);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const pendentes = lista?.filter((p) => p.estado === "pendente") ?? [];
  const decididas = lista?.filter((p) => p.estado !== "pendente") ?? [];

  const copiar = async () => {
    const linhas = [`# Decisões · ${salaNome}`, ""];
    decididas.forEach((p) => linhas.push(`- ${p.estado === "aprovada" ? "Aprovada" : "Recusada"} por ${nome(p.decidida_por)} em ${data(p.decidida_em)} · proposta de ${autor(p)}: ${p.texto.replace(/\s+/g, " ")}`));
    if (pendentes.length) linhas.push("", "## Aguardando decisão", ...pendentes.map((p) => `- ${autor(p)}: ${p.texto.replace(/\s+/g, " ")}`));
    if (await copiarTexto(linhas.join("\n"))) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
  };

  const agir = async (id: number, aprovar: boolean) => {
    setOcupado(id);
    const erro = await decidir(id, aprovar);
    setOcupado(null);
    if (erro) alert(erro);
  };

  return (
    <aside className="painel" aria-label="Decisões da sala">
      <header className="painel-topo">
        <h2>Decisões</h2>
        <button className="btn-icone" onClick={fechar} aria-label="Fechar decisões"><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <button className="btn btn-pequeno" onClick={abrirAta}><IconeDocumento tamanho={16} /> Ata da sala</button>
        <p className="nota">Decisões e tarefas de um período, para imprimir, salvar em PDF ou mandar ao cliente.</p>
      </section>

      {lista === null && <div className="painel-secao"><div className="esqueleto" /><div className="esqueleto" /></div>}

      {lista && !lista.length && (
        <section className="painel-secao painel-vazio">
          <IconeProposta />
          <p><strong>Nenhuma proposta ainda.</strong></p>
          <p className="nota">Quando um agente ou pessoa precisar de um sim, ela aparece aqui com Aprovar e Recusar. O que for decidido fica registrado, e os agentes leem antes de responder.</p>
          <p className="nota">Para propor, use o botão <strong>Propor</strong> na barra de escrever.</p>
        </section>
      )}

      {pendentes.length > 0 && (
        <section className="painel-secao">
          <span className="rotulo">Aguardando decisão · {pendentes.length}</span>
          <ul className="decisoes">
            {pendentes.map((p) => (
              <li key={p.id}>
                <button className="decisao-texto" onClick={() => irPara(p.id)} title="Ver na conversa">
                  <span className="nota">{autor(p)} · {data(p.criada_em)}</span>
                  <Texto texto={p.texto} chamaMim={() => false} />
                </button>
                <div className="linha">
                  <button className="btn btn-pequeno btn-cheio" disabled={ocupado === p.id} onClick={() => agir(p.id, true)}><IconeDecisao tamanho={16} /> Aprovar</button>
                  <button className="btn btn-pequeno" onClick={() => irPara(p.id)}><IconeRecusa tamanho={16} /> Recusar…</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {decididas.length > 0 && (
        <section className="painel-secao">
          <div className="linha linha-entre">
            <span className="rotulo">Decididas · {decididas.length}</span>
            <button className="btn btn-pequeno" onClick={copiar}>{copiado ? "Copiado" : "Copiar registro"}</button>
          </div>
          <ul className="decisoes">
            {decididas.map((p) => (
              <li key={p.id} className={`decisao-${p.estado}`}>
                <button className="decisao-texto" onClick={() => irPara(p.id)} title="Ver na conversa">
                  <span className={`decidida decidida-${p.estado}`}>
                    {p.estado === "aprovada" ? <IconeDecisao tamanho={16} /> : <IconeRecusa tamanho={16} />}
                    {p.estado === "aprovada" ? "Aprovada" : "Recusada"} por {nome(p.decidida_por)} · {data(p.decidida_em)}
                  </span>
                  <Texto texto={p.texto} chamaMim={() => false} />
                  <span className="nota">Proposta de {autor(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
