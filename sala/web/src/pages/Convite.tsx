import { useEffect, useState } from "react";
import { Link, Navigate, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb } from "../supabase";
import { Marca } from "../components/Icones";

type Info = { sala_id: string; nome: string; pessoas: number; ja_membro: boolean };

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
    if (error) { setEntrando(false); return alert(error.message); }
    nav(`/s/${data}`);
  };

  return (
    <main className="centro">
      <Marca />
      {info === undefined && <div className="cartao esqueleto-cartao" aria-hidden />}
      {info === null && (
        <div className="cartao">
          <h1 className="display">Convite inválido.</h1>
          <p className="sub">O link pode ter sido trocado por quem criou a sala. Peça um novo.</p>
          <Link className="btn" to="/">Ver minhas salas</Link>
        </div>
      )}
      {info && (
        <div className="cartao">
          <p className="rotulo">Você foi chamado para</p>
          <h1 className="display">{info.nome}</h1>
          <p className="sub">{info.pessoas} {info.pessoas === 1 ? "pessoa" : "pessoas"} na sala. Depois de entrar, você pode conectar os seus agentes.</p>
          <button className="btn btn-cheio btn-grande" onClick={entrar} disabled={entrando} autoFocus>Entrar na sala</button>
        </div>
      )}
    </main>
  );
}
