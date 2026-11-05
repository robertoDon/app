import { useEffect, useState } from "react";
import type { Mensagem } from "../supabase";
import { t } from "../i18n";
import { Bolha, Evento } from "./Bolha";

// Uma conversa de verdade tocando sozinha: a pessoa chama os agentes, eles respondem, um propõe e a pessoa aprova.
// Componentes reais do app (Bolha, Evento). Dá para clicar em Aprovar. Com movimento reduzido, mostra o fim direto.

const base = { responde_a: null, estado: null, decidida_por: null, decidida_em: null, editada_em: null, apagada: false, anexos: [], sala_id: "", user_id: "", criada_em: "" };
const m = (id: number, agente: string | null, texto: string, extra: Partial<Mensagem> = {}): Mensagem =>
  ({ ...base, id, agente, texto, tipo: "mensagem", ...extra }) as Mensagem;
const nada = () => false;

// passo: o que já apareceu. Os tempos são do passo anterior até este.
const TEMPOS = [600, 1400, 1600, 1500, 1800, 2600]; // 1 pergunta, 2 escrevendo, 3 Claude, 4 ChatGPT, 5 proposta, 6 aprovada
const FIM = 6;

export function AoVivo() {
  const parado = typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  const [passo, setPasso] = useState(parado ? FIM : 0);

  useEffect(() => {
    if (parado) return;
    if (passo >= FIM) { const id = window.setTimeout(() => setPasso(0), 5000); return () => window.clearTimeout(id); }
    if (passo === 5) return; // espera a aprovação (sozinha logo abaixo ou pelo clique)
    const id = window.setTimeout(() => setPasso((p) => p + 1), TEMPOS[passo]);
    return () => window.clearTimeout(id);
  }, [passo, parado]);

  // a pessoa "aprova" sozinha se ninguém clicar
  useEffect(() => {
    if (passo !== 5 || parado) return;
    const id = window.setTimeout(() => setPasso(6), TEMPOS[5]);
    return () => window.clearTimeout(id);
  }, [passo, parado]);

  const aprovada = passo >= 6;
  const proposta = m(4, "ChatGPT", t("**Lançar a versão 2.0 na sexta, às 10h.** A lista de espera recebe o aviso no mesmo horário.", "**Launch version 2.0 on Friday at 10am.** The waitlist gets the announcement at the same time."),
    { tipo: "proposta", estado: aprovada ? "aprovada" : "pendente", decidida_em: aprovada ? "2026-11-05T14:12:00Z" : null });

  return (
    <div className="aovivo" aria-label={t("Exemplo de conversa no The Sala", "Example conversation in The Sala")}>
      <header className="aovivo-topo">
        <span className="aovivo-sala"><span className="aovivo-inicial" aria-hidden>L</span><span><strong>{t("Lançamento 2.0", "Launch 2.0")}</strong><span className="nota">Ana, Bruno · {t("2 agentes", "2 agents")}</span></span></span>
        <span className="aovivo-ao-vivo"><i aria-hidden />{t("ao vivo", "live")}</span>
      </header>
      <div className="aovivo-feed" aria-live="off">
        {passo >= 1 && <div className="aovivo-entra"><Bolha m={m(1, null, t("@agentes dá para lançar a 2.0 na sexta?", "@agents can we ship 2.0 on Friday?"))} nome="Ana" quando="14:02" minha chamaMim={nada} /></div>}
        {passo === 2 && <p className="aovivo-escrevendo aovivo-entra"><span aria-hidden><i /><i /><i /></span>{t("Claude de Ana está escrevendo", "Ana's Claude is typing")}</p>}
        {passo >= 3 && <div className="aovivo-entra"><Bolha m={m(2, "Claude", t("Rodei os testes: **42 de 42 passaram.** Do meu lado só falta revisar o texto da página.", "I ran the tests: **42 of 42 passed.** On my side, only the page copy is left to review."))} nome="Ana" quando="14:03" chamaMim={nada} /></div>}
        {passo >= 4 && <div className="aovivo-entra"><Bolha m={m(3, "ChatGPT", t("Revisei o texto agora e corrigi dois links. Por mim, sexta às 10h.", "I just reviewed the copy and fixed two links. Friday at 10am works for me."))} nome="Bruno" quando="14:03" chamaMim={nada} /></div>}
        {passo >= 5 && (
          <div className="aovivo-entra">
            <Bolha m={proposta} nome="Bruno" quando="14:04" decisor={t("Você", "You")} chamaMim={nada}
              decidir={async (sim) => { if (sim === true) setPasso(6); return null; }} />
          </div>
        )}
        {aprovada && <div className="aovivo-entra"><Evento m={m(5, null, "", { tipo: "decisao", estado: "aprovada", responde_a: 4 })} quem={t("Você", "You")} de={t("ChatGPT de Bruno", "Bruno's ChatGPT")} quando="14:05" /></div>}
      </div>
    </div>
  );
}
