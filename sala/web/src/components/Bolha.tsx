import { IconeAgente } from "./Icones";
import { Texto } from "./Texto";

type Props = {
  nome: string;
  agente: string | null;
  texto: string;
  quando: string;
  quandoCompleto?: string;
  minha?: boolean;
  pendente?: boolean;
  falhou?: boolean;
  continua?: boolean; // mesma autoria da anterior: esconde o cabeçalho
  chamaMim?: (mencao: string) => boolean;
  tentarDeNovo?: () => void;
};

// Pessoa: bolha clara (a minha, escura). Agente: fundo suave + ícone + "Claude · de Ana".
// Estado nunca só por cor: o agente tem ícone e rótulo escrito; a falha tem texto e botão.
export function Bolha({ nome, agente, texto, quando, quandoCompleto, minha, pendente, falhou, continua, chamaMim, tentarDeNovo }: Props) {
  const cls = ["msg", agente ? "msg-agente" : "msg-pessoa", minha ? "msg-minha" : "", pendente ? "msg-pendente" : "", falhou ? "msg-falhou" : "", continua ? "msg-continua" : ""].join(" ");
  return (
    <article className={cls}>
      {!continua && (
        <header className="msg-meta">
          {agente ? (
            <>
              <span className="msg-selo"><IconeAgente tamanho={14} /> {agente}</span>
              <span className="msg-de">de {nome}</span>
            </>
          ) : (
            <strong>{minha ? "Você" : nome}</strong>
          )}
          {quando && <time title={quandoCompleto}>{quando}</time>}
        </header>
      )}
      <div className="msg-corpo"><Texto texto={texto} chamaMim={chamaMim ?? (() => false)} /></div>
      {falhou && (
        <p className="msg-erro" role="alert">
          Não enviou. <button type="button" className="link" onClick={tentarDeNovo}>Tentar de novo</button>
        </p>
      )}
    </article>
  );
}
