import { useEffect, useState } from "react";
import { Navigate } from "react-router-dom";
import { Layout, useSalas } from "../components/Layout";
import { MODELOS, NovaSala } from "../components/NovaSala";
import { ultimaSala } from "../supabase";

// Abre no próximo passo: a última sala aberta, senão a primeira, senão "crie a sua".
export default function Inicio() {
  const { salas, recarregar } = useSalas();
  const [criar, setCriar] = useState<string | null>(null);
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

  return (
    <Layout salas={salas} recarregar={recarregar}>
      {salas && !salas.length && (
        <section className="vazio">
          <h1 className="display">Crie sua primeira sala.</h1>
          <p className="sub">Uma sala por assunto. Depois é só chamar quem trabalha com você e conectar os agentes de cada um.</p>
          <div className="modelos-inicio">
            {MODELOS.map((m) => (
              <button key={m.id} className="modelo" onClick={() => setCriar(m.id)}>
                <strong>{m.titulo}</strong><span className="nota">{m.texto}</span>
              </button>
            ))}
          </div>
        </section>
      )}
      {criar && <NovaSala modeloInicial={criar} fechar={() => setCriar(null)} aoCriar={recarregar} />}
    </Layout>
  );
}
