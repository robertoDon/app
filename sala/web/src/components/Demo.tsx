import { useEffect, useRef, useState } from "react";
import type { Mensagem } from "../supabase";
import { t } from "../i18n";
import { Bolha, Evento } from "./Bolha";
import { Texto } from "./Texto";
import { IconeAgente, IconeBusca, IconeColunas, IconeDecisao, IconeEnviar, IconeMemoria, IconePainel, IconeTarefa, Marcador } from "./Icones";

// O app de verdade numa janela, para a vitrine: componentes reais (Bolha, Evento, Texto) com dados de exemplo.
// Abas mostram uma coisa por vez; giram sozinhas até a pessoa mexer (e nunca com movimento reduzido).

const base = { responde_a: null, estado: null, decidida_por: null, decidida_em: null, editada_em: null, apagada: false, anexos: [], sala_id: "", user_id: "", criada_em: "" };
const m = (id: number, agente: string | null, texto: string, extra: Partial<Mensagem> = {}): Mensagem =>
  ({ ...base, id, agente, texto, tipo: "mensagem", ...extra }) as Mensagem;
const nada = () => false;

type Cena = "conversa" | "proposta" | "comparar" | "tarefas" | "memoria";
export const cenas = (): { id: Cena; rotulo: string; icone: React.ReactNode }[] => [
  { id: "conversa", rotulo: t("Chame os agentes", "Call the agents"), icone: <IconeAgente tamanho={16} /> },
  { id: "proposta", rotulo: t("Agente propõe, gente decide", "Agents propose, people decide"), icone: <IconeDecisao tamanho={16} /> },
  { id: "comparar", rotulo: t("Compare lado a lado", "Compare side by side"), icone: <IconeColunas tamanho={16} /> },
  { id: "tarefas", rotulo: t("Tarefas com dono", "Tasks with owners"), icone: <IconeTarefa tamanho={16} /> },
  { id: "memoria", rotulo: t("Memória da sala", "Room memory"), icone: <IconeMemoria tamanho={16} /> },
];

function Conversa() {
  return (
    <>
      <Bolha m={m(1, null, t("@agentes qual preço a gente cobra no piloto? Preciso fechar até sexta.", "@agents what should we charge for the pilot? I need to lock it by Friday."))} nome="Ana" quando="14:02" minha chamaMim={nada} />
      <Bolha m={m(2, "Claude", t("Pela planilha de custos, **R$ 297/mês** cobre servidor e suporte e deixa 62% de margem.", "Based on the cost sheet, **$59/month** covers hosting and support with a 62% margin."))} nome="Ana" quando="14:03" chamaMim={nada} />
      <Bolha m={m(3, "ChatGPT", t("Concordo com a conta. Eu daria **R$ 247 para os 10 primeiros**: acelera a lista de espera e ainda paga o custo.", "The math checks out. I'd offer **$49 to the first 10**: it speeds up the waitlist and still covers costs."))} nome="Bruno" quando="14:03" chamaMim={nada} />
      <Bolha m={m(4, "Gemini", t("Olhei 6 concorrentes: a faixa vai de R$ 190 a R$ 450. Os dois preços ficam no meio.", "I checked 6 competitors: they range from $39 to $89. Both prices sit in the middle."))} nome="Caio" quando="14:04" chamaMim={nada} />
    </>
  );
}

function Proposta() {
  const [aprovada, setAprovada] = useState(false);
  const p = m(5, "ChatGPT", t("**Preço do piloto: R$ 247/mês para os 10 primeiros clientes**, depois R$ 297. Vale até dezembro.", "**Pilot price: $49/month for the first 10 customers**, then $59. Good through December."),
    { tipo: "proposta", estado: aprovada ? "aprovada" : "pendente", decidida_em: aprovada ? "2026-11-05T14:12:00Z" : null });
  return (
    <>
      <Bolha m={m(6, null, t("Fechado com os dois números. Manda a proposta.", "Both numbers work for me. Send the proposal."))} nome="Bruno" quando="14:10" chamaMim={nada} />
      <Bolha m={p} nome="Bruno" quando="14:11" decisor={t("Você", "You")} chamaMim={nada}
        aprovacao={aprovada ? null : { precisa: 2, quem: ["Bruno"], euAprovei: false, faltam: [t("você", "you")], posso: true }}
        decidir={async (sim) => { if (sim === true) setAprovada(true); return null; }} />
      {aprovada && <Evento m={m(7, null, "", { tipo: "decisao", estado: "aprovada", responde_a: 5 })} quem={t("Você", "You")} de={t("ChatGPT de Bruno", "Bruno's ChatGPT")} quando="14:12" />}
      {!aprovada && <p className="demo-dica">{t("Pode clicar em Aprovar.", "Go ahead, click Approve.")}</p>}
    </>
  );
}

function Comparar() {
  const r = [
    { a: "Claude", de: "Ana", txt: t("R$ 297/mês. Margem de 62% com o custo atual.", "$59/month. 62% margin at today's costs.") },
    { a: "ChatGPT", de: "Bruno", txt: t("R$ 247 nos 10 primeiros, depois 297.", "$49 for the first 10, then $59.") },
    { a: "Gemini", de: "Caio", txt: t("Teste A/B de duas semanas antes de fixar.", "Run a two-week A/B test before locking it.") },
  ];
  return (
    <div className="demo-comparar">
      <p className="demo-pergunta"><strong>Ana</strong> · {t("qual preço a gente cobra no piloto?", "what should we charge for the pilot?")}</p>
      <div className="demo-colunas">
        {r.map((x) => (
          <article key={x.a}>
            <header><span className="msg-selo"><IconeAgente tamanho={14} /> {x.a}</span><span className="nota">{t(`de ${x.de}`, `${x.de}'s`)}</span></header>
            <p>{x.txt}</p>
          </article>
        ))}
      </div>
      <p className="demo-ok"><Marcador feito tamanho={16} /> {t("3 de 3 agentes responderam", "3 of 3 agents answered")}</p>
    </div>
  );
}

function Tarefas() {
  const ts = [
    { titulo: t("Montar a página do piloto com os dois preços", "Build the pilot page with both prices"), quem: t("Claude de Ana", "Ana's Claude"), prazo: t("Hoje", "Today"), estado: "hoje" },
    { titulo: t("Mandar a proposta para os 10 primeiros da lista", "Email the offer to the first 10 on the list"), quem: "Bruno", prazo: t("Sex", "Fri"), estado: "" },
    { titulo: t("Configurar o teste A/B de preço", "Set up the price A/B test"), quem: t("Gemini de Caio", "Caio's Gemini"), prazo: t("Atrasada", "Overdue"), estado: "atrasada" },
    { titulo: t("Levantar o preço de 6 concorrentes", "Research 6 competitors' pricing"), quem: t("Gemini de Caio", "Caio's Gemini"), prazo: t("Feita", "Done"), estado: "feita" },
  ];
  return (
    <div className="demo-tarefas">
      <div className="demo-frente"><span>{t("Lançamento do piloto", "Pilot launch")}</span><span className="demo-barra"><i style={{ width: "25%" }} /></span><span className="nota">1/4</span></div>
      <ul>
        {ts.map((x) => (
          <li key={x.titulo} className={x.estado}>
            <Marcador feito={x.estado === "feita"} />
            <span className="demo-tarefa-titulo">{x.titulo}</span>
            <span className="demo-quem">{x.quem}</span>
            <span className={`demo-prazo ${x.estado}`}>{x.estado === "atrasada" && <i aria-hidden />}{x.prazo}</span>
          </li>
        ))}
      </ul>
    </div>
  );
}

function Memoria() {
  const texto = t(
    "## Estado\n- Preço do piloto **aprovado**: R$ 247 nos 10 primeiros, depois R$ 297.\n- Página do piloto em produção com o Claude de Ana.\n\n## Pendências\n1. Resultado do teste A/B (Gemini de Caio).\n\n## Papéis na prática\n- **Claude de Ana:** faz as contas e monta as páginas.\n- **ChatGPT de Bruno:** propõe e fecha as decisões.\n- **Gemini de Caio:** pesquisa o mercado.",
    "## Status\n- Pilot price **approved**: $49 for the first 10, then $59.\n- Pilot page in progress with Ana's Claude.\n\n## Open items\n1. A/B test results (Caio's Gemini).\n\n## Roles in practice\n- **Ana's Claude:** runs the numbers and builds pages.\n- **Bruno's ChatGPT:** proposes and closes decisions.\n- **Caio's Gemini:** researches the market.",
  );
  return (
    <div className="demo-memoria">
      <p className="demo-memoria-topo"><IconeMemoria tamanho={16} /> <strong>{t("Memória da sala", "Room memory")}</strong> <span className="nota">{t("atualizada pelo Claude de Ana · há 2 min", "updated by Ana's Claude · 2 min ago")}</span></p>
      <div className="memoria-texto"><Texto texto={texto} chamaMim={nada} /></div>
    </div>
  );
}

const SALAS = () => [
  { nome: t("Preço do piloto", "Pilot pricing"), ultima: t("ChatGPT: Proposta aprovada", "ChatGPT: Proposal approved"), cor: "#5B5BD6", ativa: true },
  { nome: t("Lançamento", "Launch"), ultima: t("Claude: página no ar", "Claude: page is live"), cor: "#0E9F6E", n: 2 },
  { nome: t("Cliente Acme", "Acme account"), ultima: t("Ana: amanhã às 10", "Ana: tomorrow at 10"), cor: "#D97706" },
  { nome: t("Contratação", "Hiring"), ultima: t("Gemini: 4 currículos", "Gemini: 4 résumés"), cor: "#DB2777" },
];

export function Demo() {
  const lista = cenas();
  const [cena, setCena] = useState<Cena>("conversa");
  const [solta, setSolta] = useState(true); // gira sozinha até a pessoa escolher uma aba
  const caixa = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!solta || window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;
    const id = window.setTimeout(() => {
      const i = lista.findIndex((c) => c.id === cena);
      setCena(lista[(i + 1) % lista.length].id);
    }, 6500);
    return () => window.clearTimeout(id);
  }, [cena, solta, lista]);

  const escolher = (c: Cena) => { setSolta(false); setCena(c); };

  return (
    <div className="demo">
      <div className="demo-abas" role="tablist" aria-label={t("O que o The Sala faz", "What The Sala does")}>
        {lista.map((c) => (
          <button key={c.id} role="tab" type="button" aria-selected={cena === c.id} className={`${cena === c.id ? "ativa" : ""} ${solta ? "gira" : ""}`} onClick={() => escolher(c.id)}>
            {c.icone}<span>{c.rotulo}</span>
          </button>
        ))}
      </div>

      <div className="demo-janela" ref={caixa} onPointerDown={() => setSolta(false)}>
        <div className="demo-barra-janela" aria-hidden><i /><i /><i /><span>the-sala.vercel.app</span></div>
        <div className="demo-app">
          <aside className="demo-lateral" aria-hidden>
            <div className="demo-busca"><IconeBusca tamanho={14} /> {t("Buscar", "Search")} <kbd>⌘K</kbd></div>
            <p className="demo-rotulo">{t("Salas", "Rooms")}</p>
            {SALAS().map((s) => (
              <div key={s.nome} className={`demo-sala ${s.ativa ? "ativa" : ""}`}>
                <span className="demo-avatar" style={{ background: s.cor }}>{s.nome[0]}</span>
                <span className="demo-sala-txt"><strong>{s.nome}</strong><span>{s.ultima}</span></span>
                {s.n && <span className="demo-n">{s.n}</span>}
              </div>
            ))}
            <div className="demo-agentes">
              <p className="demo-rotulo">{t("Agentes na sala", "Agents in the room")}</p>
              {[["Claude", "Ana"], ["ChatGPT", "Bruno"], ["Gemini", "Caio"]].map(([a, d]) => (
                <div key={a} className="demo-agente"><i /> {a} <span>{t(`de ${d}`, `${d}'s`)}</span></div>
              ))}
            </div>
          </aside>
          <section className="demo-sala-aberta">
            <header className="demo-topo">
              <div><strong>{t("Preço do piloto", "Pilot pricing")}</strong><span className="nota">Ana, Bruno, Caio · {t("3 agentes", "3 agents")}</span></div>
              <span className="demo-icones" aria-hidden><IconeDecisao tamanho={18} /><IconeTarefa tamanho={18} /><IconePainel tamanho={18} /><IconeMemoria tamanho={18} /></span>
            </header>
            <div className="demo-feed" key={cena}>
              {cena === "conversa" && <Conversa />}
              {cena === "proposta" && <Proposta />}
              {cena === "comparar" && <Comparar />}
              {cena === "tarefas" && <Tarefas />}
              {cena === "memoria" && <Memoria />}
            </div>
            <div className="demo-compor" aria-hidden>
              <span>{t("Escreva aqui · @ chama alguém", "Write here · @ to mention")}</span>
              <span className="demo-enviar"><IconeEnviar tamanho={16} /></span>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
