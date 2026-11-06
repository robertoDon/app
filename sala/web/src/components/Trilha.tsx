import { useState, type ReactNode } from "react";
import { IconeCheck, IconeCopiar } from "./Icones";
import { t } from "../i18n";

// Passo a passo: cada passo com um título curto, uma linha de detalhe e, quando precisa, o que copiar ou preencher.
export type Passo = { titulo: ReactNode; detalhe?: ReactNode; extra?: ReactNode };

export function Trilha({ passos }: { passos: Passo[] }) {
  return (
    <ol className="trilha">
      {passos.map((p, i) => (
        <li key={i}>
          <span className="trilha-num" aria-hidden>{i + 1}</span>
          <div className="trilha-corpo">
            <p className="trilha-titulo">{p.titulo}</p>
            {p.detalhe && <p className="trilha-detalhe">{p.detalhe}</p>}
            {p.extra && <div className="trilha-extra">{p.extra}</div>}
          </div>
        </li>
      ))}
    </ol>
  );
}

/** Valor em mono numa caixa, com Copiar dentro. */
export function Copiavel({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="copiavel">
      <code aria-label={rotulo}>{valor}</code>
      <button type="button" className="btn btn-pequeno" onClick={async () => {
        try { await navigator.clipboard.writeText(valor); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* */ }
      }}>
        {ok ? <><IconeCheck tamanho={14} /> {t("Copiado", "Copied")}</> : <><IconeCopiar tamanho={14} /> {t("Copiar", "Copy")}</>}
      </button>
    </div>
  );
}

/** Botão que copia um texto longo (instruções, mensagem) sem mostrar o texto. */
export function BotaoCopiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn btn-pequeno" onClick={async () => {
      try { await navigator.clipboard.writeText(valor); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* */ }
    }}>{ok ? <><IconeCheck tamanho={14} /> {t("Copiado", "Copied")}</> : <><IconeCopiar tamanho={14} /> {rotulo}</>}</button>
  );
}
