import { useEffect, useState } from "react";
import { sb } from "../supabase";

type Integracao = { id: number; url: string; eventos: string[]; criada_em: string };

const EVENTOS = [
  { id: "decisao", rotulo: "Decisões" },
  { id: "proposta", rotulo: "Propostas novas" },
  { id: "tarefa_nova", rotulo: "Tarefas novas" },
  { id: "tarefa_feita", rotulo: "Tarefas concluídas" },
  { id: "mensagem", rotulo: "Toda mensagem" },
];

const servico = (url: string) => {
  const h = url.split("/")[2] ?? "";
  if (h.includes("slack.com")) return "Slack";
  if (h.includes("discord")) return "Discord";
  if (h.includes("chat.googleapis.com")) return "Google Chat";
  if (/office\.com|logic\.azure\.com|powerplatform\.com/.test(h)) return "Teams";
  return h;
};

// Leva decisões e tarefas da sala para onde o time já está (Slack, Teams, Discord, Google Chat ou um sistema seu).
export function Integracoes({ salaId }: { salaId: string }) {
  const [lista, setLista] = useState<Integracao[] | null>(null);
  const [url, setUrl] = useState("");
  const [eventos, setEventos] = useState<string[]>(["decisao", "tarefa_feita"]);
  const [erro, setErro] = useState("");
  const [testado, setTestado] = useState<number | null>(null);
  const [abrindo, setAbrindo] = useState(false);

  const carregar = () => sb.from("integracoes").select("id, url, eventos, criada_em").eq("sala_id", salaId).order("id")
    .then(({ data }) => setLista((data as Integracao[]) ?? []));
  useEffect(() => { carregar(); }, [salaId]); // eslint-disable-line react-hooks/exhaustive-deps

  const salvar = async (e: React.FormEvent) => {
    e.preventDefault();
    setErro("");
    const { error } = await sb.rpc("criar_integracao", { sala: salaId, url: url.trim(), eventos });
    if (error) return setErro(error.message.includes("check constraint") ? "Confira o endereço: precisa começar com https://" : error.message);
    setUrl(""); setAbrindo(false); carregar();
  };

  const testar = async (i: Integracao) => {
    const { error } = await sb.rpc("testar_integracao", { integracao: i.id });
    if (error) return alert(error.message);
    setTestado(i.id); setTimeout(() => setTestado(null), 2500);
  };

  const apagar = async (i: Integracao) => {
    if (!confirm(`Desligar a integração com ${servico(i.url)}?`)) return;
    await sb.rpc("apagar_integracao", { integracao: i.id });
    carregar();
  };

  return (
    <section className="painel-secao">
      <span className="rotulo">Integrações</span>
      <p className="nota">Avise o Slack, o Teams, o Discord, o Google Chat ou um sistema seu quando algo acontecer aqui.</p>
      {lista && lista.length > 0 && (
        <ul className="integracoes">
          {lista.map((i) => (
            <li key={i.id}>
              <span className="pessoa-nome"><strong>{servico(i.url)}</strong>
                <span className="presenca">{i.eventos.map((e) => EVENTOS.find((x) => x.id === e)?.rotulo).join(", ")}</span>
              </span>
              <span className="linha">
                <button className="btn btn-pequeno btn-texto" onClick={() => testar(i)}>{testado === i.id ? "Enviado" : "Testar"}</button>
                <button className="btn btn-pequeno" onClick={() => apagar(i)}>Desligar</button>
              </span>
            </li>
          ))}
        </ul>
      )}
      {abrindo ? (
        <form className="tarefa-form" onSubmit={salvar}>
          <label className="sr" htmlFor="int-url">Endereço do webhook</label>
          <input id="int-url" autoFocus type="url" placeholder="https://hooks.slack.com/services/…" value={url} onChange={(e) => setUrl(e.target.value)} />
          <fieldset className="eventos">
            <legend className="sr">Quando avisar</legend>
            {EVENTOS.map((ev) => (
              <label key={ev.id} className="evento-opcao">
                <input type="checkbox" checked={eventos.includes(ev.id)}
                  onChange={(e) => setEventos((x) => (e.target.checked ? [...x, ev.id] : x.filter((y) => y !== ev.id)))} />
                {ev.rotulo}
              </label>
            ))}
          </fieldset>
          <details className="nota">
            <summary>Onde pego esse endereço?</summary>
            <p><b>Slack:</b> api.slack.com/apps → crie um app → Incoming Webhooks → Add New Webhook. <b>Teams:</b> no canal, Fluxos de trabalho → “Postar em um canal quando uma solicitação de webhook for recebida”. <b>Discord:</b> configurações do canal → Integrações → Webhooks. <b>Google Chat:</b> no espaço, Apps e integrações → Webhooks. Qualquer outro sistema recebe um JSON com o evento.</p>
          </details>
          {erro && <p className="nota erro" role="alert">{erro}</p>}
          <div className="linha">
            <button className="btn btn-pequeno btn-cheio" disabled={!url.trim() || !eventos.length}>Ligar</button>
            <button type="button" className="btn btn-pequeno btn-texto" onClick={() => { setAbrindo(false); setErro(""); }}>Cancelar</button>
          </div>
        </form>
      ) : (
        (lista?.length ?? 0) < 5 && <button className="btn btn-pequeno" onClick={() => setAbrindo(true)}>Ligar integração</button>
      )}
    </section>
  );
}
