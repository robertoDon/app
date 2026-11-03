import { useEffect, useState } from "react";
import { estadoAvisos, ligarAvisos, lembrete, type EstadoAvisos } from "../avisos";
import { IconeFechar, IconeSino } from "./Icones";
import { erro, t } from "../i18n";

// Faixa discreta acima da barra de escrever: "Quer saber quando chamarem você?" Some para sempre ao dispensar.
export function Avisos() {
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [fora, setFora] = useState(lembrete.dispensado());
  const [falha, setFalha] = useState("");

  useEffect(() => { estadoAvisos().then(setEstado); }, []);
  if (fora || !estado || (estado !== "desligado" && estado !== "iphone-instalar")) return null;

  const dispensar = () => { lembrete.dispensar(); setFora(true); };
  const ligar = async () => {
    try { const e = await ligarAvisos(); setEstado(e); if (e === "ligado") dispensar(); }
    catch (e) { setFalha(erro(e)); }
  };

  return (
    <div className="faixa-avisos" role="region" aria-label={t("Avisos", "Notifications")}>
      <IconeSino tamanho={18} />
      {estado === "iphone-instalar" ? (
        <p>{t("No iPhone, os avisos chegam com o The Sala na Tela de Início: toque em ", "On iPhone, notifications work once The Sala is on your Home Screen: tap ")}<strong>{t("Compartilhar", "Share")}</strong>{t(" e depois em ", ", then ")}<strong>{t("Adicionar à Tela de Início", "Add to Home Screen")}</strong>.</p>
      ) : (
        <p>{falha || t("Saiba quando chamarem você ou quando houver uma proposta para decidir.", "Get notified when someone mentions you or a proposal needs your decision.")}</p>
      )}
      {estado === "desligado" && <button className="btn btn-pequeno btn-cheio" onClick={ligar}>{t("Ativar avisos", "Turn on notifications")}</button>}
      <button className="btn-acao" onClick={dispensar} aria-label={t("Agora não", "Not now")} title={t("Agora não", "Not now")}><IconeFechar tamanho={16} /></button>
    </div>
  );
}
