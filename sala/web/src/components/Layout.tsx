import { useEffect, useRef, useState } from "react";
import { Link, useNavigate, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb, type Sala } from "../supabase";
import { IconeAgente, IconeMais, IconePlugue, IconeSair, Marca } from "./Icones";
import { Conectar } from "./Conectar";

// Lista de salas com não lidas e prévia, ao vivo. Também mantém o contador na aba do navegador.
export function useSalas() {
  const [salas, setSalas] = useState<Sala[] | null>(null);
  const espera = useRef<number | undefined>(undefined);

  const carregar = async () => {
    const { data } = await sb.rpc("minhas_salas");
    setSalas((data as Sala[]) ?? []);
  };

  useEffect(() => {
    carregar();
    const depois = () => { window.clearTimeout(espera.current); espera.current = window.setTimeout(carregar, 250); };
    const canal = sb.channel("minhas-salas")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens" }, depois)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "membros" }, depois)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "membros" }, depois)
      .subscribe();
    return () => { sb.removeChannel(canal); window.clearTimeout(espera.current); };
  }, []);

  useEffect(() => {
    const total = (salas ?? []).reduce((n, s) => n + Number(s.nao_lidas), 0);
    document.title = total ? `(${total}) Sala` : "Sala";
  }, [salas]);

  return { salas, recarregar: carregar };
}

export async function novaSala(nome: string) {
  const { data, error } = await sb.rpc("criar_sala", { nome });
  if (error) throw error;
  return data as string;
}

const quando = (iso: string | null) => {
  if (!iso) return "";
  const d = new Date(iso);
  const hoje = new Date();
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return "ontem";
  return d.toLocaleDateString("pt-BR", { day: "2-digit", month: "short" }).replace(".", "");
};

export function Layout({ children, salas, recarregar, foco }: {
  children: React.ReactNode;
  salas: Sala[] | null;
  recarregar: () => void;
  foco?: boolean; // no celular, mostra só o conteúdo (a sala aberta)
}) {
  const { perfil, recarregarPerfil } = useAuth();
  const { id } = useParams();
  const nav = useNavigate();
  const [criando, setCriando] = useState(false);
  const [nome, setNome] = useState("");
  const [conectar, setConectar] = useState(false);
  const [editandoNome, setEditandoNome] = useState(false);
  const [meuNome, setMeuNome] = useState("");

  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const digitando = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if (digitando || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "n") { e.preventDefault(); setCriando(true); }
      if (e.key === "a") { e.preventDefault(); setConectar(true); }
    };
    const abrir = () => setConectar(true);
    window.addEventListener("keydown", tecla);
    window.addEventListener("sala:conectar", abrir);
    return () => { window.removeEventListener("keydown", tecla); window.removeEventListener("sala:conectar", abrir); };
  }, []);

  const criar = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome.trim()) return;
    const sid = await novaSala(nome.trim());
    setNome(""); setCriando(false);
    recarregar();
    nav(`/s/${sid}`);
  };

  const salvarNome = async () => {
    const n = meuNome.trim();
    setEditandoNome(false);
    if (!n || !perfil || n === perfil.nome) return;
    await sb.from("perfis").update({ nome: n }).eq("id", perfil.id);
    recarregarPerfil();
  };

  return (
    <div className={`app ${foco ? "app-foco" : ""}`}>
      <nav className="lateral" aria-label="Salas">
        <div className="lateral-topo"><Link to="/" aria-label="Início"><Marca /></Link></div>

        <div className="lateral-titulo">
          <span>Salas</span>
          <button className="btn-icone" onClick={() => setCriando(true)} title="Nova sala (N)" aria-label="Nova sala">
            <IconeMais tamanho={18} />
          </button>
        </div>

        {criando && (
          <form className="nova-sala" onSubmit={criar}>
            <label className="sr" htmlFor="nova">Nome da nova sala</label>
            <input id="nova" autoFocus placeholder="Nome da sala e Enter" value={nome} maxLength={80}
              onChange={(e) => setNome(e.target.value)} onBlur={() => !nome && setCriando(false)}
              onKeyDown={(e) => e.key === "Escape" && setCriando(false)} />
          </form>
        )}

        <ul className="lista-salas">
          {salas === null && [0, 1, 2].map((i) => <li key={i} className="esqueleto" aria-hidden />)}
          {salas?.map((s) => {
            const novas = Number(s.nao_lidas);
            const ativa = s.id === id;
            return (
              <li key={s.id}>
                <Link to={`/s/${s.id}`} className={`${ativa ? "ativa" : ""} ${novas && !ativa ? "tem-novas" : ""}`} aria-current={ativa ? "page" : undefined}>
                  <span className="sala-inicial" aria-hidden>{s.nome.slice(0, 1).toUpperCase()}</span>
                  <span className="sala-info">
                    <span className="sala-linha">
                      <span className="sala-nome">{s.nome}</span>
                      <time className="sala-quando">{quando(s.ultima_em)}</time>
                    </span>
                    <span className="sala-linha">
                      <span className="sala-previa">
                        {s.ultima_texto ? (
                          <>{s.ultima_agente && <IconeAgente tamanho={12} />}{s.ultima_agente ?? s.ultima_nome?.split(" ")[0]}: {s.ultima_texto}</>
                        ) : "Sem mensagens ainda"}
                      </span>
                      {novas > 0 && !ativa && <span className="sala-novas" aria-label={`${novas} não lidas`}>{novas > 99 ? "99+" : novas}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="lateral-base">
          <button className="btn btn-largo" onClick={() => setConectar(true)} title="Conectar agente (A)">
            <IconePlugue tamanho={18} /> Conectar agente
          </button>
          <div className="eu">
            {perfil?.avatar ? <img src={perfil.avatar} alt="" className="avatar" referrerPolicy="no-referrer" /> : <span className="avatar">{perfil?.nome?.[0]}</span>}
            {editandoNome ? (
              <input className="eu-input" autoFocus value={meuNome} maxLength={60} aria-label="Seu nome"
                onChange={(e) => setMeuNome(e.target.value)} onBlur={salvarNome}
                onKeyDown={(e) => { if (e.key === "Enter") salvarNome(); if (e.key === "Escape") setEditandoNome(false); }} />
            ) : (
              <button className="eu-nome" title="Mudar seu nome" onClick={() => { setMeuNome(perfil?.nome ?? ""); setEditandoNome(true); }}>
                {perfil?.nome}
              </button>
            )}
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
