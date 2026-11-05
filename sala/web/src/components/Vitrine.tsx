import type { Mensagem } from "../supabase";
import { t } from "../i18n";
import { Bolha, Evento } from "./Bolha";
import { IconeCheck, IconeColunas } from "./Icones";

// O produto de verdade, com componentes reais, para a vitrine (entrada e página pública).
const base = { responde_a: null, estado: null, decidida_por: null, decidida_em: null, editada_em: null, apagada: false, anexos: [], sala_id: "", user_id: "", criada_em: "" };
const m = (id: number, agente: string | null, texto: string, extra: Partial<Mensagem> = {}): Mensagem =>
  ({ ...base, id, agente, texto, tipo: "mensagem", ...extra }) as Mensagem;

const conversa = (): { nome: string; m: Mensagem }[] => [
  { nome: "Ana", m: m(1, null, t("@agentes dá para lançar a 2.0 na sexta?", "@agents can we ship 2.0 on Friday?")) },
  { nome: "Ana", m: m(2, "Claude", t("Rodei os testes: **42 de 42 passaram.** Só falta revisar o texto da página.", "Ran the tests: **42 of 42 passed.** All that's left is reviewing the page copy.")) },
  { nome: "Bruno", m: m(3, "ChatGPT", t("**Lançar a 2.0 na sexta, às 10h.** Revisei o texto e corrigi dois links.", "**Ship 2.0 on Friday at 10 AM.** I reviewed the copy and fixed two links."), { tipo: "proposta", estado: "aprovada", decidida_em: "2026-11-03T15:42:00Z" }) },
];

export function Vitrine({ compacta }: { compacta?: boolean }) {
  return (
    <div className={`vitrine-camadas ${compacta ? "vitrine-compacta" : ""}`} aria-label={t("Exemplo de conversa no The Sala", "Example conversation in The Sala")}>
      <div className="vitrine-card">
        <div className="vitrine-topo"><span className="ponto" aria-hidden /> {t("Lançamento 2.0", "2.0 launch")} <span className="nota">{t("Ana, Bruno · 2 agentes", "Ana, Bruno · 2 agents")}</span></div>
        <div className="vitrine-feed">
          {conversa().map(({ nome, m: x }) => (
            <Bolha key={x.id} m={x} nome={nome} quando="" minha={nome === "Ana" && !x.agente} decisor="Ana" />
          ))}
          <Evento m={m(4, null, t("Fechado. Sexta às 10h.", "Agreed. Friday at 10 AM."), { tipo: "decisao", estado: "aprovada", responde_a: 3 })}
            quem="Ana" de={t("ChatGPT de Bruno", "Bruno's ChatGPT")} quando={t("15:42", "3:42 PM")} />
        </div>
      </div>
      {!compacta && (
        <div className="vitrine-card vitrine-flutua" aria-hidden>
          <p className="vitrine-rotulo"><IconeColunas tamanho={16} /> {t("Respostas lado a lado", "Side-by-side answers")}</p>
          <div className="vitrine-colunas">
            <div><strong>{t("Claude de Ana", "Ana's Claude")}</strong><span>{t("Sexta: testes ok.", "Friday: tests pass.")}</span></div>
            <div><strong>{t("ChatGPT de Bruno", "Bruno's ChatGPT")}</strong><span>{t("Sexta, depois da revisão.", "Friday, after review.")}</span></div>
            <div><strong>{t("Gemini de Caio", "Caio's Gemini")}</strong><span>{t("Segunda, com mais folga.", "Monday, to leave some buffer.")}</span></div>
          </div>
          <p className="vitrine-rotulo vitrine-ok"><IconeCheck tamanho={16} /> {t("3 de 3 responderam", "3 of 3 answered")}</p>
        </div>
      )}
    </div>
  );
}
