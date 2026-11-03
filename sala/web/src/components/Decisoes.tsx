import { useEffect, useState } from "react";
import { copiarTexto, sb, type Mensagem } from "../supabase";
import { IconeDecisao, IconeDocumento, IconeFechar, IconeProposta, IconeRecusa } from "./Icones";
import { Texto } from "./Texto";
import { erro as msgErro, locale, t } from "../i18n";

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

const data = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: "numeric", month: "short" }).replace(".", "") : "");

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
    const linhas = [`# ${t("Decisões", "Decisions")} · ${salaNome}`, ""];
    decididas.forEach((p) => {
      const quem = nome(p.decidida_por), quando = data(p.decidida_em), de = autor(p), texto = p.texto.replace(/\s+/g, " ");
      linhas.push(p.estado === "aprovada"
        ? t(`- Aprovada por ${quem} em ${quando} · proposta de ${de}: ${texto}`, `- Approved by ${quem} on ${quando} · proposed by ${de}: ${texto}`)
        : t(`- Recusada por ${quem} em ${quando} · proposta de ${de}: ${texto}`, `- Declined by ${quem} on ${quando} · proposed by ${de}: ${texto}`));
    });
    if (pendentes.length) linhas.push("", t("## Aguardando decisão", "## Awaiting decision"), ...pendentes.map((p) => `- ${autor(p)}: ${p.texto.replace(/\s+/g, " ")}`));
    if (await copiarTexto(linhas.join("\n"))) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
  };

  const agir = async (id: number, aprovar: boolean) => {
    setOcupado(id);
    const erro = await decidir(id, aprovar);
    setOcupado(null);
    if (erro) alert(msgErro(erro));
  };

  return (
    <aside className="painel" aria-label={t("Decisões da sala", "Room decisions")}>
      <header className="painel-topo">
        <h2>{t("Decisões", "Decisions")}</h2>
        <button className="btn-icone" onClick={fechar} aria-label={t("Fechar decisões", "Close decisions")}><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <button className="btn btn-pequeno" onClick={abrirAta}><IconeDocumento tamanho={16} /> {t("Ata da sala", "Room minutes")}</button>
        <p className="nota">{t("Decisões e tarefas de um período, para imprimir, salvar em PDF ou mandar ao cliente.", "Decisions and tasks for a period, to print, save as PDF or send to a client.")}</p>
      </section>

      {lista === null && <div className="painel-secao"><div className="esqueleto" /><div className="esqueleto" /></div>}

      {lista && !lista.length && (
        <section className="painel-secao painel-vazio">
          <IconeProposta />
          <p><strong>{t("Nenhuma proposta ainda.", "No proposals yet.")}</strong></p>
          <p className="nota">{t("Quando um agente ou pessoa precisar de um sim, ela aparece aqui com Aprovar e Recusar. O que for decidido fica registrado, e os agentes leem antes de responder.", "When an agent or person needs a yes, it shows up here with Approve and Decline. Every decision is kept on record, and agents read it before replying.")}</p>
          <p className="nota">{t("Para propor, use o botão ", "To make a proposal, use the ")}<strong>{t("Propor", "Propose")}</strong>{t(" na barra de escrever.", " button in the message bar.")}</p>
        </section>
      )}

      {pendentes.length > 0 && (
        <section className="painel-secao">
          <span className="rotulo">{t("Aguardando decisão", "Awaiting decision")} · {pendentes.length}</span>
          <ul className="decisoes">
            {pendentes.map((p) => (
              <li key={p.id}>
                <button className="decisao-texto" onClick={() => irPara(p.id)} title={t("Ver na conversa", "View in chat")}>
                  <span className="nota">{autor(p)} · {data(p.criada_em)}</span>
                  <Texto texto={p.texto} chamaMim={() => false} />
                </button>
                <div className="linha">
                  <button className="btn btn-pequeno btn-cheio" disabled={ocupado === p.id} onClick={() => agir(p.id, true)}><IconeDecisao tamanho={16} /> {t("Aprovar", "Approve")}</button>
                  <button className="btn btn-pequeno" onClick={() => irPara(p.id)}><IconeRecusa tamanho={16} /> {t("Recusar…", "Decline…")}</button>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}

      {decididas.length > 0 && (
        <section className="painel-secao">
          <div className="linha linha-entre">
            <span className="rotulo">{t("Decididas", "Decided")} · {decididas.length}</span>
            <button className="btn btn-pequeno" onClick={copiar}>{copiado ? t("Copiado", "Copied") : t("Copiar registro", "Copy record")}</button>
          </div>
          <ul className="decisoes">
            {decididas.map((p) => (
              <li key={p.id} className={`decisao-${p.estado}`}>
                <button className="decisao-texto" onClick={() => irPara(p.id)} title={t("Ver na conversa", "View in chat")}>
                  <span className={`decidida decidida-${p.estado}`}>
                    {p.estado === "aprovada" ? <IconeDecisao tamanho={16} /> : <IconeRecusa tamanho={16} />}
                    {p.estado === "aprovada" ? t("Aprovada por", "Approved by") : t("Recusada por", "Declined by")} {nome(p.decidida_por)} · {data(p.decidida_em)}
                  </span>
                  <Texto texto={p.texto} chamaMim={() => false} />
                  <span className="nota">{t("Proposta de", "Proposed by")} {autor(p)}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}
    </aside>
  );
}
