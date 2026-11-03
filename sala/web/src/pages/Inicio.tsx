import { useEffect, useState } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { Layout, novaSala, useSalas } from "../components/Layout";
import { ultimaSala } from "../supabase";

// Abre no próximo passo: a última sala aberta, senão a primeira, senão "crie a sua".
export default function Inicio() {
  const { salas, recarregar } = useSalas();
  const nav = useNavigate();
  const [nome, setNome] = useState("");
  const [celular, setCelular] = useState(() => window.matchMedia("(max-width: 720px)").matches);

  useEffect(() => {
    const mq = window.matchMedia("(max-width: 720px)");
    const f = () => setCelular(mq.matches);
    mq.addEventListener("change", f);
    return () => mq.removeEventListener("change", f);
  }, []);

  if (salas && salas.length && !celular) {
    const u = ultimaSala.get();
    return <Navigate to={`/s/${salas.find((s) => s.id === u)?.id ?? salas[0].id}`} replace />;
  }

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    nav(`/s/${await novaSala(nome.trim())}`);
  };

  return (
    <Layout salas={salas} recarregar={recarregar}>
      {salas && !salas.length && (
        <section className="vazio">
          <h1 className="display">Crie sua primeira sala.</h1>
          <p className="sub">Depois é só chamar quem trabalha com você e conectar os agentes de cada um.</p>
          <form className="linha" onSubmit={criar}>
            <label className="sr" htmlFor="primeira">Nome da sala</label>
            <input id="primeira" autoFocus placeholder="Ex.: Lançamento do piloto" value={nome} maxLength={80}
              onChange={(e) => setNome(e.target.value)} />
            <button className="btn btn-cheio">Criar sala</button>
          </form>
        </section>
      )}
    </Layout>
  );
}
