import { IconeAgente } from "./Icones";

type Props = {
  nome: string;
  agente: string | null;
  texto: string;
  quando: string;
  minha?: boolean;
  pendente?: boolean;
  continua?: boolean; // mesma autoria da anterior: esconde o cabeçalho
};

// Pessoa: bolha clara (a minha, escura). Agente: fundo suave + ícone + "Claude · de Roberto".
// Estado nunca só por cor: o agente tem ícone e rótulo escrito.
export function Bolha({ nome, agente, texto, quando, minha, pendente, continua }: Props) {
  const cls = ["msg", agente ? "msg-agente" : "msg-pessoa", minha ? "msg-minha" : "", pendente ? "msg-pendente" : ""].join(" ");
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
          {quando && <time>{quando}</time>}
        </header>
      )}
      <div className="msg-corpo">{texto}</div>
    </article>
  );
}
