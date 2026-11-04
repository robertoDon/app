import { useEffect, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { sb, type Sala } from "../supabase";
import { gravado, locale, t } from "../i18n";
import { IconeAgente, IconeCaixa, IconeMais, IconePlugue, IconeProposta, Marca } from "./Icones";
import { Conectar } from "./Conectar";
import { Conta } from "./Conta";
import { NovaSala } from "./NovaSala";
import { Guia } from "./Guia";

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
    document.title = total ? `(${total}) The Sala` : "The Sala";
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
  if (d.toDateString() === hoje.toDateString()) return d.toLocaleTimeString(locale(), { hour: "2-digit", minute: "2-digit" });
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === ontem.toDateString()) return t("ontem", "yesterday");
  return d.toLocaleDateString(locale(), { day: "2-digit", month: "short" }).replace(".", "");
};

export function Layout({ children, salas, recarregar, foco }: {
  children: React.ReactNode;
  salas: Sala[] | null;
  recarregar: () => void;
  foco?: boolean; // no celular, mostra só o conteúdo (a sala aberta)
}) {
  const { perfil } = useAuth();
  const { id } = useParams();
  const [criando, setCriando] = useState(false);
  const [conectar, setConectar] = useState(false);
  const [conta, setConta] = useState(false);

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

  return (
    <div className={`app ${foco ? "app-foco" : ""}`}>
      <nav className="lateral" aria-label={t("Salas", "Rooms")}>
        <div className="lateral-topo"><Link to="/" aria-label={t("Início", "Home")}><Marca /></Link></div>

        <div className="lateral-titulo" data-guia="salas">
          <span>{t("Salas", "Rooms")}</span>
          <button className="btn-icone" onClick={() => setCriando(true)} title={t("Nova sala (N)", "New room (N)")} aria-label={t("Nova sala", "New room")}>
            <IconeMais tamanho={18} />
          </button>
        </div>

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
                          <>{s.ultima_agente && <IconeAgente tamanho={12} />}{s.ultima_agente ?? s.ultima_nome?.split(" ")[0]}
                            {s.ultima_tipo === "proposta" ? t(" propôs", " proposed") : s.ultima_tipo === "decisao" ? t(" decidiu", " decided") : ""}: {gravado(s.ultima_texto).replace(/\*\*|__|`|^#+\s/gm, "")}</>
                        ) : t("Sem mensagens ainda", "No messages yet")}
                      </span>
                      {Number(s.minhas_tarefas) > 0 && (
                        <span className="sala-pendentes" title={`${s.minhas_tarefas} ${Number(s.minhas_tarefas) === 1 ? t("tarefa sua aberta", "open task assigned to you") : t("tarefas suas abertas", "open tasks assigned to you")}`} aria-label={`${s.minhas_tarefas} ${Number(s.minhas_tarefas) === 1 ? t("tarefa sua", "task for you") : t("tarefas suas", "tasks for you")}`}>
                          <IconeCaixa tamanho={12} />{s.minhas_tarefas}
                        </span>
                      )}
                      {Number(s.pendentes) > 0 && (
                        <span className="sala-pendentes" title={`${s.pendentes} ${Number(s.pendentes) === 1 ? t("proposta aguardando decisão", "proposal awaiting a decision") : t("propostas aguardando decisão", "proposals awaiting a decision")}`} aria-label={`${s.pendentes} ${t("para decidir", "to decide")}`}>
                          <IconeProposta tamanho={12} />{s.pendentes}
                        </span>
                      )}
                      {novas > 0 && !ativa && <span className="sala-novas" aria-label={`${novas} ${novas === 1 ? t("não lida", "unread") : t("não lidas", "unread")}`}>{novas > 99 ? "99+" : novas}</span>}
                    </span>
                  </span>
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="lateral-base">
          <button className="btn btn-largo" data-guia="conectar" onClick={() => setConectar(true)} title={t("Conectar agente (A)", "Connect agent (A)")}>
            <IconePlugue tamanho={18} /> {t("Conectar agente", "Connect agent")}
          </button>
          <button className="eu" data-guia="conta" onClick={() => setConta(true)} title={t("Sua conta, avisos e sair", "Your account, notifications and sign out")}>
            {perfil?.avatar ? <img src={perfil.avatar} alt="" className="avatar" referrerPolicy="no-referrer" /> : <span className="avatar">{perfil?.nome?.[0]}</span>}
            <span className="eu-nome">{perfil?.nome}</span>
            <span className="nota">{t("Conta", "Account")}</span>
          </button>
        </div>
      </nav>

      <div className="conteudo">{children}</div>

      {conectar && <Conectar fechar={() => setConectar(false)} />}
      {conta && <Conta fechar={() => setConta(false)} />}
      <Guia pronto={salas !== null} emSala={!!id} />
      {criando && <NovaSala fechar={() => setCriando(false)} aoCriar={recarregar} />}
    </div>
  );
}
