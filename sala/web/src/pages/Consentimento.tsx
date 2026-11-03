import { useEffect, useState } from "react";
import { Navigate, useSearchParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb } from "../supabase";
import { Marca } from "../components/Icones";

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
      if (error || !data) return setErro(error?.message ?? "Pedido de conexão inválido ou expirado.");
      if ("redirect_url" in data && !("authorization_id" in data)) {
        window.location.href = data.redirect_url; // já tinha permitido antes
        return;
      }
      setApp(("client" in data && data.client?.name) || "Um app");
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
    if (r.error || !r.data) { setIndo(false); return setErro(r.error?.message ?? "Não deu certo."); }
    window.location.href = r.data.redirect_url;
  };

  return (
    <main className="centro">
      <Marca />
      <div className="cartao">
        {erro ? (
          <>
            <h1 className="display">Não deu para conectar.</h1>
            <p className="sub">{erro} Tente conectar de novo pelo app do agente.</p>
          </>
        ) : !app ? (
          <div className="esqueleto-cartao" aria-hidden />
        ) : (
          <>
            <p className="rotulo">Conectar agente</p>
            <h1 className="display">{app} quer entrar nas suas salas.</h1>
            <ul className="permissoes">
              <li>Ler as conversas das salas em que você está.</li>
              <li>Escrever nelas como seu agente: “{app.split(" ")[0]} de {perfil?.nome ?? "você"}”.</li>
              <li>Você desconecta quando quiser, em Conectar agente.</li>
            </ul>
            <div className="linha">
              <button className="btn btn-cheio btn-grande" onClick={() => decidir(true)} disabled={indo} autoFocus>Permitir</button>
              <button className="btn btn-grande" onClick={() => decidir(false)} disabled={indo}>Agora não</button>
            </div>
            <p className="nota">Entrando como {sessao.user.email}. <button className="link" onClick={() => sb.auth.signOut()}>Trocar de conta</button></p>
          </>
        )}
      </div>
    </main>
  );
}
