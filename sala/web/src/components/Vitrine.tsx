import type { Mensagem } from "../supabase";
import { Bolha, Evento } from "./Bolha";
import { IconeCheck, IconeColunas } from "./Icones";

// O produto de verdade, com componentes reais, para a vitrine (entrada e página pública).
const base = { responde_a: null, estado: null, decidida_por: null, decidida_em: null, editada_em: null, apagada: false, sala_id: "", user_id: "", criada_em: "" };
const m = (id: number, agente: string | null, texto: string, extra: Partial<Mensagem> = {}): Mensagem =>
  ({ ...base, id, agente, texto, tipo: "mensagem", ...extra }) as Mensagem;

const CONVERSA: { nome: string; m: Mensagem }[] = [
  { nome: "Ana", m: m(1, null, "@agentes precisamos fechar o preço do piloto até sexta.") },
  { nome: "Ana", m: m(2, "Claude", "Pelos números da planilha, **R$ 297/mês** cobre o custo e deixa 62% de margem.") },
  { nome: "Bruno", m: m(3, "ChatGPT", "Proponho **R$ 247** nos 10 primeiros clientes, para acelerar a lista. Depois, 297.", { tipo: "proposta", estado: "aprovada", decidida_em: "2026-11-03T15:42:00Z" }) },
];

export function Vitrine({ compacta }: { compacta?: boolean }) {
  return (
    <div className={`vitrine-camadas ${compacta ? "vitrine-compacta" : ""}`} aria-label="Exemplo de conversa no The Sala">
      <div className="vitrine-card">
        <div className="vitrine-topo"><span className="ponto" aria-hidden /> Preço do piloto <span className="nota">Ana, Bruno · 2 agentes</span></div>
        <div className="vitrine-feed">
          {CONVERSA.map(({ nome, m: x }) => (
            <Bolha key={x.id} m={x} nome={nome} quando="" minha={nome === "Ana" && !x.agente} decisor="Ana" />
          ))}
          <Evento m={m(4, null, "Fechado. Vale até dezembro.", { tipo: "decisao", estado: "aprovada", responde_a: 3 })} quem="Ana" de="ChatGPT de Bruno" quando="15:42" />
        </div>
      </div>
      {!compacta && (
        <div className="vitrine-card vitrine-flutua" aria-hidden>
          <p className="vitrine-rotulo"><IconeColunas tamanho={16} /> Respostas lado a lado</p>
          <div className="vitrine-colunas">
            <div><strong>Claude de Ana</strong><span>R$ 297, margem de 62%.</span></div>
            <div><strong>ChatGPT de Bruno</strong><span>R$ 247 nos 10 primeiros.</span></div>
            <div><strong>Gemini de Caio</strong><span>Teste A/B por 2 semanas.</span></div>
          </div>
          <p className="vitrine-rotulo vitrine-ok"><IconeCheck tamanho={16} /> 3 de 3 responderam</p>
        </div>
      )}
    </div>
  );
}
