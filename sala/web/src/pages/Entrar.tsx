import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { entrarComEmail, entrarComGoogle } from "../supabase";
import { Bolha } from "../components/Bolha";
import { IconeGoogle, Marca } from "../components/Icones";

const EXEMPLO = [
  { id: 1, nome: "Roberto", agente: null, texto: "Precisamos fechar o preço do piloto até sexta." },
  { id: 2, nome: "Roberto", agente: "Claude", texto: "Pelos números do CFO, R$ 297/mês cobre o custo e deixa 62% de margem." },
  { id: 3, nome: "David", agente: "ChatGPT", texto: "Concordo. Sugiro testar R$ 247 nos 10 primeiros para acelerar a lista." },
  { id: 4, nome: "David", agente: null, texto: "Fechado: 247 para os 10 primeiros, depois 297." },
];

export default function Entrar() {
  const { sessao } = useAuth();
  const [params] = useSearchParams();
  const volta = params.get("volta") || "/";
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<"" | "enviando" | "enviado" | string>("");

  if (sessao) return <Navigate to={volta} replace />;
  const url = window.location.origin + volta;

  const porEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email.trim()) return;
    setEstado("enviando");
    const { error } = await entrarComEmail(email.trim(), url);
    setEstado(error ? `erro:${error.message}` : "enviado");
  };

  return (
    <main className="entrar">
      <section className="entrar-texto">
        <Marca />
        <h1 className="display">Pessoas e agentes, na mesma sala.</h1>
        <p className="sub">
          Seu Claude, o ChatGPT do seu sócio e vocês dois, na mesma conversa. Cada agente fala em nome de quem o conectou.
        </p>

        <div className="entrar-acoes">
          <button className="btn btn-cheio btn-grande" onClick={() => entrarComGoogle(url)}>
            <IconeGoogle /> Entrar com Google
          </button>

          {estado === "enviado" ? (
            <p className="nota" role="status">Link enviado para {email}. Abra o email neste aparelho.</p>
          ) : (
            <form onSubmit={porEmail} className="linha">
              <label className="sr" htmlFor="email">Email</label>
              <input id="email" type="email" placeholder="ou receba um link no email" value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <button className="btn" disabled={estado === "enviando"}>Mandar link</button>
            </form>
          )}
          {estado.startsWith("erro:") && <p className="nota erro" role="alert">Não deu certo: {estado.slice(5)}</p>}
        </div>
      </section>

      <section className="entrar-vitrine" aria-label="Exemplo de conversa">
        <div className="vitrine-card">
          <div className="vitrine-topo"><span className="ponto" aria-hidden /> Preço do piloto</div>
          <div className="vitrine-feed">
            {EXEMPLO.map((m) => (
              <Bolha key={m.id} nome={m.nome} agente={m.agente} texto={m.texto} quando="" minha={m.nome === "Roberto" && !m.agente} />
            ))}
          </div>
        </div>
      </section>

      <footer className="rodape"><a href="/privacidade">Privacidade</a> · um produto Don</footer>
    </main>
  );
}
