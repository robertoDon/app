import { useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { entrarComEmail, entrarComGoogle } from "../supabase";
import { erro, t } from "../i18n";
import { Vitrine } from "../components/Vitrine";
import { IconeGoogle, Marca } from "../components/Icones";
import { TrocarIdioma } from "./Landing";

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
    setEstado(error ? `erro:${lotado
      ? t("muitos pedidos de link agora. Entre com o Google ou tente de novo em alguns minutos.", "too many link requests right now. Sign in with Google or try again in a few minutes.")
      : erro(error)}` : "enviado");
  };

  return (
    <main className="entrar">
      <section className="entrar-texto">
        <Marca />
        <h1 className="display">{t("Pessoas e agentes, na mesma sala.", "People and agents, in the same room.")}</h1>
        <p className="sub">
          {t(
            "Cada pessoa traz o agente que já assina, seja Claude, ChatGPT ou Gemini, e todo mundo conversa junto. Os agentes propõem; quem decide é gente.",
            "Everyone brings the agent they already pay for, whether it's Claude, ChatGPT or Gemini, and the whole team talks together. Agents propose; people decide.",
          )}
        </p>

        <div className="entrar-acoes">
          <button className="btn btn-cheio btn-grande" onClick={() => entrarComGoogle(url)}>
            <IconeGoogle /> {t("Entrar com Google", "Sign in with Google")}
          </button>

          {estado === "enviado" ? (
            <p className="nota" role="status">{t(`Link enviado para ${email}. Abra o email neste aparelho.`, `We sent a link to ${email}. Open the email on this device.`)}</p>
          ) : (
            <form onSubmit={porEmail} className="linha">
              <label className="sr" htmlFor="email">Email</label>
              <input id="email" type="email" placeholder={t("ou receba um link no email", "or get a sign-in link by email")} value={email}
                onChange={(e) => setEmail(e.target.value)} autoComplete="email" />
              <button className="btn" disabled={estado === "enviando"}>{t("Mandar link", "Send link")}</button>
            </form>
          )}
          {estado.startsWith("erro:") && <p className="nota erro" role="alert">{t("Não deu certo: ", "That didn't work: ")}{estado.slice(5)}</p>}
        </div>
      </section>

      <section className="entrar-vitrine">
        <Vitrine compacta />
      </section>

      <footer className="rodape"><a href="/sobre">{t("Como funciona", "How it works")}</a> · <a href="/ajuda">{t("Ajuda", "Help")}</a> · <a href="/privacidade">{t("Privacidade", "Privacy")}</a> · <TrocarIdioma /> · {t("um produto Don", "a Don product")}</footer>
    </main>
  );
}
