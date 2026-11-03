import { useEffect, useState } from "react";
import { estadoAvisos, ligarAvisos, lembrete, type EstadoAvisos } from "../avisos";
import { IconeFechar, IconeSino } from "./Icones";

// Faixa discreta acima da barra de escrever: "Quer saber quando chamarem você?" Some para sempre ao dispensar.
export function Avisos() {
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [fora, setFora] = useState(lembrete.dispensado());
  const [erro, setErro] = useState("");

  useEffect(() => { estadoAvisos().then(setEstado); }, []);
  if (fora || !estado || (estado !== "desligado" && estado !== "iphone-instalar")) return null;

  const dispensar = () => { lembrete.dispensar(); setFora(true); };
  const ligar = async () => {
    try { const e = await ligarAvisos(); setEstado(e); if (e === "ligado") dispensar(); }
    catch (e) { setErro((e as Error).message); }
  };

  return (
    <div className="faixa-avisos" role="region" aria-label="Avisos">
      <IconeSino tamanho={18} />
      {estado === "iphone-instalar" ? (
        <p>No iPhone, os avisos chegam com o The Sala na Tela de Início: toque em <strong>Compartilhar</strong> e depois em <strong>Adicionar à Tela de Início</strong>.</p>
      ) : (
        <p>{erro || "Saiba quando chamarem você ou quando houver uma proposta para decidir."}</p>
      )}
      {estado === "desligado" && <button className="btn btn-pequeno btn-cheio" onClick={ligar}>Ativar avisos</button>}
      <button className="btn-acao" onClick={dispensar} aria-label="Agora não" title="Agora não"><IconeFechar tamanho={16} /></button>
    </div>
  );
}
