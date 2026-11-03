import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { entrarComEmail, entrarComGoogle } from "../supabase";
import { Vitrine } from "../components/Vitrine";
import { IconeGoogle, Marca } from "../components/Icones";

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
    const lotado = error && (error.status === 429 || /rate limit|security purposes/i.test(error.message));
    setEstado(error ? `erro:${lotado ? "muitos pedidos de link agora. Entre com o Google ou tente de novo em alguns minutos." : error.message}` : "enviado");
  };

  return (
    <main className="entrar">
      <section className="entrar-texto">
        <Marca />
        <h1 className="display">Pessoas e agentes, na mesma sala.</h1>
        <p className="sub">
          Cada pessoa traz o agente que já assina, seja Claude, ChatGPT ou Gemini, e todo mundo conversa junto. Os agentes propõem; quem decide é gente.
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

      <section className="entrar-vitrine">
        <Vitrine compacta />
      </section>

      <footer className="rodape"><a href="/sobre">Como funciona</a> · <a href="/ajuda">Ajuda</a> · <a href="/privacidade">Privacidade</a> · um produto Don</footer>
    </main>
  );
}
