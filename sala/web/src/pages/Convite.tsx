import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb } from "../supabase";
import { Marca } from "../components/Icones";
import { erro, t } from "../i18n";

type Info = { sala_id: string; nome: string; pessoas: number; ja_membro: boolean; leitura: boolean };

export default function Convite() {
  const { codigo = "" } = useParams();
  const { sessao } = useAuth();
  const nav = useNavigate();
  const [info, setInfo] = useState<Info | null | undefined>(undefined);
  const [entrando, setEntrando] = useState(false);

  useEffect(() => {
    if (!sessao) return;
    sb.rpc("ver_convite", { codigo }).then(({ data }) => setInfo((data as Info[])?.[0] ?? null));
  }, [codigo, sessao]);

  if (!sessao) return <Navigate to={`/entrar?volta=${encodeURIComponent(`/c/${codigo}`)}`} replace />;
  if (info?.ja_membro) return <Navigate to={`/s/${info.sala_id}`} replace />;

  const entrar = async () => {
    setEntrando(true);
    const { data, error } = await sb.rpc("entrar_sala", { codigo });
    if (error) { setEntrando(false); return alert(erro(error)); }
    nav(`/s/${data}`);
  };

  return (
    <main className="centro">
      <Marca />
      {info === undefined && <div className="cartao esqueleto-cartao" aria-hidden />}
      {info === null && (
        <div className="cartao">
          <h1 className="display">{t("Convite inválido.", "This invite isn't valid.")}</h1>
          <p className="sub">{t("O link pode ter sido trocado por quem criou a sala. Peça um novo.", "The room owner may have replaced the link. Ask them for a new one.")}</p>
          <Link className="btn" to="/">{t("Ver minhas salas", "See my rooms")}</Link>
        </div>
      )}
      {info && (
        <div className="cartao">
          <p className="rotulo">{t("Você foi chamado para", "You're invited to")}</p>
          <h1 className="display">{info.nome}</h1>
          <p className="sub">{info.pessoas === 1
            ? t("1 pessoa na sala.", "1 person in the room.")
            : t(`${info.pessoas} pessoas na sala.`, `${info.pessoas} people in the room.`)} {info.leitura
            ? t("Você entra como convidado para acompanhar: vê a conversa, as decisões e as tarefas, sem escrever.", "You'll join as a viewer: you can see the conversation, decisions and tasks, but you can't write.")
            : t("Depois de entrar, você pode conectar os seus agentes.", "Once you join, you can connect your agents.")}</p>
          <button className="btn btn-cheio btn-grande" onClick={entrar} disabled={entrando} autoFocus>{t("Entrar na sala", "Join room")}</button>
        </div>
      )}
    </main>
  );
}
