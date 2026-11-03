import type { Mensagem } from "../supabase";
import { t } from "../i18n";
import { Bolha, Evento } from "./Bolha";
import { IconeCheck, IconeColunas } from "./Icones";

// O produto de verdade, com componentes reais, para a vitrine (entrada e página pública).
const base = { responde_a: null, estado: null, decidida_por: null, decidida_em: null, editada_em: null, apagada: false, anexos: [], sala_id: "", user_id: "", criada_em: "" };
const m = (id: number, agente: string | null, texto: string, extra: Partial<Mensagem> = {}): Mensagem =>
  ({ ...base, id, agente, texto, tipo: "mensagem", ...extra }) as Mensagem;

const conversa = (): { nome: string; m: Mensagem }[] => [
  { nome: "Ana", m: m(1, null, t("@agentes precisamos fechar o preço do piloto até sexta.", "@agents we need to lock in the pilot price by Friday.")) },
  { nome: "Ana", m: m(2, "Claude", t("Pelos números da planilha, **R$ 297/mês** cobre o custo e deixa 62% de margem.", "Based on the spreadsheet, **$59/month** covers our costs with a 62% margin.")) },
  { nome: "Bruno", m: m(3, "ChatGPT", t("Proponho **R$ 247** nos 10 primeiros clientes, para acelerar a lista. Depois, 297.", "I propose **$49** for the first 10 customers to build the list faster. Then $59."), { tipo: "proposta", estado: "aprovada", decidida_em: "2026-11-03T15:42:00Z" }) },
];

export function Vitrine({ compacta }: { compacta?: boolean }) {
  return (
    <div className={`vitrine-camadas ${compacta ? "vitrine-compacta" : ""}`} aria-label={t("Exemplo de conversa no The Sala", "Example conversation in The Sala")}>
      <div className="vitrine-card">
        <div className="vitrine-topo"><span className="ponto" aria-hidden /> {t("Preço do piloto", "Pilot pricing")} <span className="nota">{t("Ana, Bruno · 2 agentes", "Ana, Bruno · 2 agents")}</span></div>
        <div className="vitrine-feed">
          {conversa().map(({ nome, m: x }) => (
            <Bolha key={x.id} m={x} nome={nome} quando="" minha={nome === "Ana" && !x.agente} decisor="Ana" />
          ))}
          <Evento m={m(4, null, t("Fechado. Vale até dezembro.", "Done. Good through December."), { tipo: "decisao", estado: "aprovada", responde_a: 3 })}
            quem="Ana" de={t("ChatGPT de Bruno", "Bruno's ChatGPT")} quando={t("15:42", "3:42 PM")} />
        </div>
      </div>
      {!compacta && (
        <div className="vitrine-card vitrine-flutua" aria-hidden>
          <p className="vitrine-rotulo"><IconeColunas tamanho={16} /> {t("Respostas lado a lado", "Side-by-side answers")}</p>
          <div className="vitrine-colunas">
            <div><strong>{t("Claude de Ana", "Ana's Claude")}</strong><span>{t("R$ 297, margem de 62%.", "$59, 62% margin.")}</span></div>
            <div><strong>{t("ChatGPT de Bruno", "Bruno's ChatGPT")}</strong><span>{t("R$ 247 nos 10 primeiros.", "$49 for the first 10.")}</span></div>
            <div><strong>{t("Gemini de Caio", "Caio's Gemini")}</strong><span>{t("Teste A/B por 2 semanas.", "A/B test for 2 weeks.")}</span></div>
          </div>
          <p className="vitrine-rotulo vitrine-ok"><IconeCheck tamanho={16} /> {t("3 de 3 responderam", "3 of 3 answered")}</p>
        </div>
      )}
    </div>
  );
}
