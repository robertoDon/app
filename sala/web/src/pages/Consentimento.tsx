import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb } from "../supabase";
import { Marca } from "../components/Icones";
import { erro as traduzir, t } from "../i18n";

// Tela que o Claude/ChatGPT abre ao conectar a Sala (OAuth 2.1 do Supabase Auth).
export default function Consentimento() {
  const [params] = useSearchParams();
  const authId = params.get("authorization_id") ?? "";
  const { sessao, perfil } = useAuth();
  const [app, setApp] = useState<string | null>(null);
  const [erro, setErro] = useState("");
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    if (!sessao || !authId) return;
    sb.auth.oauth.getAuthorizationDetails(authId).then(({ data, error }) => {
      if (error || !data) return setErro(error ? traduzir(error) : t("Pedido de conexão inválido ou expirado.", "This connection request is invalid or has expired."));
      if ("redirect_url" in data && !("authorization_id" in data)) {
        window.location.href = data.redirect_url; // já tinha permitido antes
        return;
      }
      setApp(("client" in data && data.client?.name) || t("Um app", "An app"));
    });
  }, [authId, sessao]);

  if (!sessao) {
    return <Navigate to={`/entrar?volta=${encodeURIComponent(`/oauth/consent?authorization_id=${authId}`)}`} replace />;
  }

  const decidir = async (permitir: boolean) => {
    setIndo(true);
    const r = permitir
      ? await sb.auth.oauth.approveAuthorization(authId, { skipBrowserRedirect: true })
      : await sb.auth.oauth.denyAuthorization(authId, { skipBrowserRedirect: true });
    if (r.error || !r.data) { setIndo(false); return setErro(r.error ? traduzir(r.error) : t("Não deu certo.", "Something went wrong.")); }
    window.location.href = r.data.redirect_url;
  };

  return (
    <main className="centro">
      <Marca />
      <div className="cartao">
        {erro ? (
          <>
            <h1 className="display">{t("Não deu para conectar.", "Couldn't connect.")}</h1>
            <p className="sub">{erro} {t("Tente conectar de novo pelo app do agente.", "Try connecting again from your agent's app.")}</p>
          </>
        ) : !app ? (
          <div className="esqueleto-cartao" aria-hidden />
        ) : (
          <>
            <p className="rotulo">{t("Conectar agente", "Connect agent")}</p>
            <h1 className="display">{t(`${app} quer entrar nas suas salas.`, `${app} wants to access your rooms.`)}</h1>
            <ul className="permissoes">
              <li>{t("Ler as conversas das salas em que você está.", "Read the conversations in the rooms you're in.")}</li>
              <li>{perfil?.nome
                ? t(`Escrever nelas como seu agente: “${app.split(" ")[0]} de ${perfil.nome}”.`, `Write in them as your agent: “${perfil.nome}'s ${app.split(" ")[0]}.”`)
                : t(`Escrever nelas como seu agente: “${app.split(" ")[0]} de você”.`, `Write in them as your agent: “your ${app.split(" ")[0]}.”`)}</li>
              <li>{t("Fazer propostas. Quem aprova ou recusa são as pessoas; o agente não decide sozinho.", "Make proposals. People approve or decline them; the agent never decides on its own.")}</li>
              <li>{t("Você desconecta quando quiser, em Conectar agente.", "You can disconnect it any time in Connect agent.")}</li>
            </ul>
            <div className="linha">
              <button className="btn btn-cheio btn-grande" onClick={() => decidir(true)} disabled={indo} autoFocus>{t("Permitir", "Allow")}</button>
              <button className="btn btn-grande" onClick={() => decidir(false)} disabled={indo}>{t("Agora não", "Not now")}</button>
            </div>
            <p className="nota">{t(`Entrando como ${sessao.user.email}.`, `Signed in as ${sessao.user.email}.`)} <button className="link" onClick={() => sb.auth.signOut()}>{t("Trocar de conta", "Switch account")}</button></p>
          </>
        )}
      </div>
    </main>
  );
}
