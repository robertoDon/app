import type { DadosPainel } from "../supabase";
import { locale, t } from "../i18n";

// Linha do tempo das tarefas com prazo: uma barra da criação até a entrega (ou o prazo), a marca do previsto
// no plano e a linha de hoje. Fica num arquivo só para sair fácil se não for útil.
const DIA = 864e5;
const diaMes = (ms: number) => new Date(ms).toLocaleDateString(locale(), { day: "numeric", month: "short" }).replace(".", "");

export function LinhaDoTempo({ tarefas, agora }: { tarefas: DadosPainel["tarefas"]; agora: string }) {
  const hoje = new Date(agora).getTime();
  // abertas primeiro (pelo prazo), depois as feitas mais recentes; no máximo 24 linhas
  const linhas = [...tarefas].filter((x) => x.estado !== "feita" || (x.concluida_em && hoje - new Date(x.concluida_em).getTime() < 30 * DIA))
    .sort((a, b) => Number(a.estado === "feita") - Number(b.estado === "feita")
      || new Date(a.prazo ?? a.prazo_previsto ?? 0).getTime() - new Date(b.prazo ?? b.prazo_previsto ?? 0).getTime())
    .slice(0, 24);
  if (!linhas.length) return null;

  const fim = (x: (typeof linhas)[number]) => new Date(x.concluida_em ?? x.prazo ?? x.prazo_previsto!).getTime();
  const ini = Math.min(hoje - 7 * DIA, ...linhas.map((x) => Math.min(new Date(x.criada_em).getTime(), fim(x))));
  const ate = Math.max(hoje + 7 * DIA, ...linhas.map((x) => Math.max(fim(x), x.prazo_previsto ? new Date(x.prazo_previsto).getTime() : 0)));
  const pos = (ms: number) => `${((ms - ini) / (ate - ini)) * 100}%`;

  return (
    <section className="painel-lista" aria-labelledby="pn-tempo">
      <h3 className="secao-rotulo" id="pn-tempo">{t("Linha do tempo", "Timeline")}</h3>
      <div className="lt">
        <div className="lt-escala" aria-hidden><span>{diaMes(ini)}</span><span>{diaMes(ate)}</span></div>
        <ul className="lt-linhas">
          {linhas.map((x) => {
            const a = new Date(x.criada_em).getTime();
            const b = fim(x);
            const atrasada = x.estado === "aberta" && !!x.prazo && new Date(x.prazo).getTime() < hoje;
            const cor = x.estado === "feita" ? "lt-feita" : atrasada ? "lt-atrasada" : "";
            return (
              <li key={x.id} className="lt-linha">
                <span className="lt-nome" title={x.titulo}>{x.frente ? `${x.frente} · ` : ""}{x.titulo}</span>
                <span className="lt-trilho">
                  <span className={`lt-barra ${cor}`} style={{ left: pos(Math.min(a, b)), width: `max(4px, calc(${pos(Math.max(a, b))} - ${pos(Math.min(a, b))}))` }}
                    title={`${diaMes(a)} → ${diaMes(b)}`} />
                  {x.prazo_previsto && <span className="lt-previsto" style={{ left: pos(new Date(x.prazo_previsto).getTime()) }} title={t(`previsto ${diaMes(new Date(x.prazo_previsto).getTime())}`, `planned ${diaMes(new Date(x.prazo_previsto).getTime())}`)} />}
                  <span className="lt-hoje" style={{ left: pos(hoje) }} aria-hidden />
                </span>
              </li>
            );
          })}
        </ul>
        <p className="nota lt-legenda">
          <span className="lt-chave" /> {t("aberta", "open")} <span className="lt-chave lt-feita" /> {t("feita", "done")} <span className="lt-chave lt-atrasada" /> {t("atrasada", "overdue")}
          <span className="lt-chave-previsto" /> {t("previsto no plano", "planned")}
        </p>
      </div>
    </section>
  );
}
