import { useEffect, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb, type Sala } from "../supabase";
import { IconeMais, IconePlugue, IconeSair, Marca } from "./Icones";
import { Conectar } from "./Conectar";

export function useSalas() {
  const [salas, setSalas] = useState<Sala[] | null>(null);
  const carregar = async () => {
    const { data } = await sb.from("salas").select("id, nome, convite, criada_por").order("criada_em");
    setSalas(data ?? []);
  };
  useEffect(() => { carregar(); }, []);
  return { salas, recarregar: carregar };
}

export async function novaSala(nome: string) {
  const { data, error } = await sb.rpc("criar_sala", { nome });
  if (error) throw error;
  return data as string;
}

export function Layout({ children, salas, recarregar, foco }: {
  children: React.ReactNode;
  salas: Sala[] | null;
  recarregar: () => void;
  foco?: boolean; // no celular, mostra só o conteúdo (a sala aberta)
}) {
  const { perfil } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [conectar, setConectar] = useState(false);

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const digitando = (e.target as HTMLElement)?.closest("input, textarea");
      if (digitando) return;
      if (e.key === "n") { e.preventDefault(); setCriando(true); }
      if (e.key === "a") { e.preventDefault(); setConectar(true); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const sid = await novaSala(nome.trim());
    setNome(""); setCriando(false);
    recarregar();
    nav(`/s/${sid}`);
  };

  return (
    <div className={`app ${foco ? "app-foco" : ""}`}>
      <nav className="lateral" aria-label="Salas">
        <div className="lateral-topo"><Marca /></div>

        <div className="lateral-titulo">
          <span>Salas</span>
          <button className="btn-icone" onClick={() => setCriando(true)} title="Nova sala (N)" aria-label="Nova sala">
            <IconeMais tamanho={18} />
          </button>
        </div>

        {criando && (
          <form className="nova-sala" onSubmit={criar}>
            <label className="sr" htmlFor="nova">Nome da sala</label>
            <input id="nova" autoFocus placeholder="Nome da sala" value={nome} maxLength={80}
              onChange={(e) => setNome(e.target.value)} onKeyDown={(e) => e.key === "Escape" && setCriando(false)} />
          </form>
        )}

        <ul className="lista-salas">
          {salas === null && [0, 1, 2].map((i) => <li key={i} className="esqueleto" aria-hidden />)}
          {salas?.map((s) => (
            <li key={s.id}>
              <Link to={`/s/${s.id}`} className={s.id === id ? "ativa" : ""} aria-current={s.id === id ? "page" : undefined}>
                <span className="sala-inicial" aria-hidden>{s.nome.slice(0, 1).toUpperCase()}</span>
                <span className="sala-nome">{s.nome}</span>
              </Link>
            </li>
          ))}
        </ul>

        <div className="lateral-base">
          <button className="btn btn-largo" onClick={() => setConectar(true)} title="Conectar agente (A)">
            <IconePlugue tamanho={18} /> Conectar agente
          </button>
          <div className="eu">
            {perfil?.avatar ? <img src={perfil.avatar} alt="" className="avatar" /> : <span className="avatar">{perfil?.nome?.[0]}</span>}
            <span className="eu-nome">{perfil?.nome}</span>
            <button className="btn-icone" onClick={() => sb.auth.signOut()} title="Sair" aria-label="Sair">
              <IconeSair tamanho={18} />
            </button>
          </div>
        </div>
      </nav>

      <div className="conteudo">{children}</div>

      {conectar && <Conectar fechar={() => setConectar(false)} />}
    </div>
  );
}
