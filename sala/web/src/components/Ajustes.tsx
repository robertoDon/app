import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { abrirConectar, copiarTexto, sb, type Membro, type Sala } from "../supabase";
import type { AgenteSala } from "../pages/Sala";
import { IconeAgente, IconeCheck, IconeFechar, IconeVoltar } from "./Icones";
import { Menu } from "./Menu";
import { Integracoes } from "./Integracoes";
import { erro, gravado, locale, t } from "../i18n";

type Historico = { id: number; quem: string | null; agente: string | null; acao: string; detalhe: string | null; em: string };

type Props = { sala: Sala; membros: Membro[]; agentes: AgenteSala[]; eu: string; fechar: () => void; recarregar: () => void; foco?: "contexto"; abrirMemoria?: () => void };

export function Ajustes({ sala, membros, agentes, eu, fechar, recarregar, foco, abrirMemoria }: Props) {
  const dono = sala.papel === "dono";
  const nav = useNavigate();
  const [nome, setNome] = useState(sala.nome);
  const [contexto, setContexto] = useState(sala.contexto);
  const [salvo, setSalvo] = useState("");
  const link = sala.convite ? `${window.location.origin}/c/${sala.convite}` : "";
  const linkLeitura = sala.convite_leitura ? `${window.location.origin}/c/${sala.convite_leitura}` : "";
  const [historico, setHistorico] = useState<Historico[] | null>(null);
  const [aprovacoes, setAprovacoes] = useState<number | null>(null);
  useEffect(() => { sb.from("salas").select("aprovacoes").eq("id", sala.id).maybeSingle().then(({ data }) => setAprovacoes((data as { aprovacoes: number } | null)?.aprovacoes ?? 1)); }, [sala.id]);
  const mudarAprovacoes = async (n: number) => {
    const antes = aprovacoes; setAprovacoes(n);
    const { error } = await sb.from("salas").update({ aprovacoes: n }).eq("id", sala.id);
    if (error) { setAprovacoes(antes); return alert(erro(error)); }
    setSalvo("aprovacoes"); setTimeout(() => setSalvo(""), 2000);
  };
  const verHistorico = async () => {
    const { data } = await sb.from("historico").select("*").eq("sala_id", sala.id).order("id", { ascending: false }).limit(60);
    setHistorico((data as Historico[]) ?? []);
  };
  const nomeDe = (uid: string | null) => membros.find((m) => m.user_id === uid)?.perfis?.nome ?? t("Alguém", "Someone");

  useEffect(() => { setNome(sala.nome); setContexto(sala.contexto); }, [sala.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const salvar = async (campos: Partial<Pick<Sala, "nome" | "contexto">>, rotulo: string) => {
    const { error } = await sb.from("salas").update(campos).eq("id", sala.id);
    if (error) return alert(erro(error));
    setSalvo(rotulo); setTimeout(() => setSalvo(""), 2000);
    recarregar();
  };

  const trocarConvite = async () => {
    if (!confirm(t("Trocar o link? O link antigo para de funcionar. Quem já está na sala continua.", "Replace the links? The old links will stop working. People already in the room stay."))) return;
    const { error } = await sb.rpc("trocar_convite", { sala: sala.id });
    if (error) alert(erro(error));
    recarregar();
  };

  const remover = async (m: Membro) => {
    if (!confirm(t(`Tirar ${m.perfis?.nome} da sala? Os agentes dessa pessoa também saem.`, `Remove ${m.perfis?.nome} from the room? Their agents will leave too.`))) return;
    await sb.from("membros").delete().eq("sala_id", sala.id).eq("user_id", m.user_id);
  };

  const mudarPapel = async (m: Membro, papel: "membro" | "leitor") => {
    const { error } = await sb.rpc("mudar_papel", { sala: sala.id, pessoa: m.user_id, papel });
    if (error) alert(erro(error));
  };

  const tornarDono = async (m: Membro) => {
    if (!confirm(t(`${m.perfis?.nome} também passa a cuidar da sala: muda nome e instruções, convida, tira pessoas e pode apagar a sala.`, `${m.perfis?.nome} will also become an owner: they can change the name and instructions, invite and remove people, and delete the room.`))) return;
    const { error } = await sb.rpc("tornar_dono", { sala: sala.id, pessoa: m.user_id });
    if (error) alert(erro(error));
  };

  const outrosDonos = membros.some((m) => m.user_id !== eu && m.papel === "dono");
  const sair = async () => {
    const aviso = dono && !outrosDonos && membros.length > 1
      ? t(`Sair de "${sala.nome}"? Como você é quem cuida da sala, ${membros.find((m) => m.user_id !== eu)?.perfis?.nome ?? "a próxima pessoa"} passa a cuidar dela.`,
        `Leave "${sala.nome}"? You're the owner, so ${membros.find((m) => m.user_id !== eu)?.perfis?.nome ?? "the next person"} will become the owner.`)
      : membros.length === 1 ? t(`Você é a única pessoa aqui. Sair apaga a sala "${sala.nome}".`, `You're the only person here. Leaving deletes the room "${sala.nome}".`)
        : t(`Sair de "${sala.nome}"? Para voltar, você vai precisar de um convite.`, `Leave "${sala.nome}"? You'll need an invite to come back.`);
    if (!confirm(aviso)) return;
    const { error } = await sb.rpc("sair_da_sala", { sala: sala.id });
    if (error) return alert(erro(error));
    recarregar(); nav("/");
  };

  const apagar = async () => {
    if (prompt(t(`Apagar a sala "${sala.nome}" e todas as mensagens, para todos? Para confirmar, digite o nome da sala: ${sala.nome}`,
      `Delete the room "${sala.nome}" and all its messages, for everyone? To confirm, type the room name: ${sala.nome}`))?.trim() !== sala.nome) return;
    const { error } = await sb.from("salas").delete().eq("id", sala.id);
    if (error) return alert(erro(error));
    recarregar(); nav("/");
  };

  const papelDe = (m: Membro) => m.papel === "dono" ? <span className="pilula pilula-acento">{t("Cuida da sala", "Owner")}</span>
    : m.papel === "leitor" ? <span className="pilula">{t("Só lê", "View only")}</span> : null;
  const contextoMudou = contexto.trim() !== sala.contexto.trim();

  return (
    <aside className="painel" aria-label={t("Ajustes da sala", "Room settings")}>
      <header className="painel-topo">
        <h2>{t("Ajustes da sala", "Room settings")}</h2>
        <button className="btn-icone" onClick={fechar} aria-label={t("Fechar ajustes", "Close settings")}><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <h3 className="secao-rotulo secao-rotulo-solto">{t("Sala", "Room")}</h3>
        <div className="campo">
          <div className="campo-topo">
            <label htmlFor="aj-nome">{t("Nome", "Name")}</label>
            {salvo === "nome" && <span className="salvo" role="status"><IconeCheck tamanho={12} /> {t("Salvo", "Saved")}</span>}
          </div>
          <input id="aj-nome" value={nome} maxLength={80} disabled={!dono}
            onChange={(e) => setNome(e.target.value)}
            onBlur={() => nome.trim() && nome !== sala.nome && salvar({ nome: nome.trim() }, "nome")}
            onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        </div>
        <div className="campo">
          <div className="campo-topo">
            <label htmlFor="aj-contexto">{t("Instruções da sala", "Room instructions")}</label>
            {salvo === "contexto" ? <span className="salvo" role="status"><IconeCheck tamanho={12} /> {t("Salvo", "Saved")}</span>
              : <span className="nota">{contexto.length.toLocaleString(locale())}/{(10000).toLocaleString(locale())}</span>}
          </div>
          <textarea id="aj-contexto" rows={6} maxLength={Math.max(10000, sala.contexto.length)} value={contexto} disabled={!dono} autoFocus={foco === "contexto"}
            placeholder={t("Ex.: Piloto pago de novembro. Ana decide preço, Bruno decide produto. Respostas curtas, com números e fonte.", "E.g.: Paid pilot in November. Ana decides pricing, Bruno decides product. Short replies, with numbers and sources.")}
            onChange={(e) => setContexto(e.target.value)} />
          <p className="nota">{t("Curtas, escritas por vocês: o objetivo, quem decide o quê, o tom e as regras que não mudam. O estado do projeto os agentes guardam sozinhos na ", "Short, written by you: the goal, who decides what, the tone and the rules that don't change. Agents keep the project's state by themselves in the ")}{abrirMemoria ? <button type="button" className="link-texto" onClick={abrirMemoria}>{t("memória da sala", "room memory")}</button> : t("memória da sala", "room memory")}.</p>
          {dono && contextoMudou && (
            <div className="linha campo-acoes">
              <button className="btn btn-pequeno btn-texto" onClick={() => setContexto(sala.contexto)}>{t("Descartar", "Discard")}</button>
              <button className="btn btn-pequeno btn-cheio" onClick={() => salvar({ contexto: contexto.trim() }, "contexto")}>{t("Salvar instruções", "Save instructions")}</button>
            </div>
          )}
        </div>
        <div className="campo">
          <div className="campo-topo">
            <span id="aj-aprov" className="campo-rotulo">{t("Aprovações para uma proposta passar", "Approvals for a proposal to pass")}</span>
            {salvo === "aprovacoes" && <span className="salvo" role="status"><IconeCheck tamanho={12} /> {t("Salvo", "Saved")}</span>}
          </div>
          <div className="abas" role="radiogroup" aria-labelledby="aj-aprov">
            {[[1, t("1 pessoa", "1 person")], [2, t("2 pessoas", "2 people")], [20, t("Todos", "Everyone")]].map(([n, rot]) => (
              <button key={n} type="button" role="radio" aria-checked={aprovacoes === n} disabled={!dono || aprovacoes === null}
                className={`aba ${aprovacoes === n ? "ativa" : ""}`} onClick={() => mudarAprovacoes(n as number)}>{rot}</button>
            ))}
          </div>
          <p className="nota">{t("Um “Recusar” encerra a proposta na hora. “Todos” conta quem escreve na sala, não quem só acompanha.", "One “Decline” closes the proposal right away. “Everyone” counts people who write in the room, not viewers.")}</p>
        </div>
      </section>

      <section className="painel-lista">
        <h3 className="secao-rotulo">{t("Pessoas", "People")} <span>{membros.length}</span></h3>
        <ul className="linhas">
          {membros.map((m) => (
            <li key={m.user_id} className="linha-item">
              {m.perfis?.avatar ? <img className="avatar" src={m.perfis.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{m.perfis?.nome?.[0]}</span>}
              <span className="linha-texto">
                <span className="linha-titulo">{m.perfis?.nome}</span>
                {m.user_id === eu && <span className="presenca">{t("você", "you")}</span>}
              </span>
              {papelDe(m)}
              {dono && m.papel !== "dono" ? (
                <Menu rotulo={t(`Ações para ${m.perfis?.nome}`, `Actions for ${m.perfis?.nome}`)} itens={[
                  m.papel === "leitor" ? { rotulo: t("Liberar para escrever", "Allow writing"), acao: () => mudarPapel(m, "membro") }
                    : { rotulo: t("Deixar só ler", "Make view only"), acao: () => mudarPapel(m, "leitor") },
                  m.papel !== "leitor" && { rotulo: t("Tornar dono", "Make owner"), acao: () => tornarDono(m) },
                  { rotulo: t("Tirar da sala", "Remove from room"), acao: () => remover(m), perigo: true },
                ]} />
              ) : <span className="menu-vazio" aria-hidden />}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel-lista">
        <div className="secao-rotulo secao-rotulo-acao">
          <h3>{t("Agentes", "Agents")} <span>{agentes.length}</span></h3>
          <button className="link nota" onClick={abrirConectar}>{t("Conectar o meu", "Connect mine")}</button>
        </div>
        {agentes.length ? (
          <ul className="linhas">
            {agentes.map((a) => (
              <li key={`${a.nome}|${a.uid}`} className="linha-item">
                <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                <span className="linha-texto">
                  <span className="linha-titulo">{(() => { const de = membros.find((m) => m.user_id === a.uid)?.perfis?.nome?.split(" ")[0] ?? "?"; return t(`${a.nome} de ${de}`, `${de}'s ${a.nome}`); })()}</span>
                  {a.presenca && <span className={`presenca ${a.presenca.ativo ? "presenca-ativa" : ""}`}>{a.presenca.ativo && <span className="ponto ponto-mini" aria-hidden />}{a.presenca.texto}</span>}
                </span>
                {a.sozinho && <span className="pilula" title={t("Responde sozinho quando chamado", "Replies on its own when called")}>{t("Automático", "Automatic")}</span>}
              </li>
            ))}
          </ul>
        ) : <p className="nota secao-nota">{t("Nenhum agente ainda. Cada pessoa conecta o seu, com a assinatura que já tem.", "No agents yet. Each person connects their own, with the subscription they already have.")}</p>}
      </section>

      {link && (
        <section className="painel-lista">
          <div className="secao-rotulo secao-rotulo-acao">
            <h3>{t("Convites", "Invites")}</h3>
            {dono && <button className="link nota" onClick={trocarConvite}>{t("Trocar links", "Replace links")}</button>}
          </div>
          <div className="convites">
            <Convite titulo={t("Participar", "Join")} texto={t("Escreve, decide e traz os próprios agentes.", "Can write, decide and bring their own agents.")} link={link} />
            {linkLeitura && <Convite titulo={t("Só acompanhar", "View only")} texto={t("Para clientes: lê tudo, não escreve nem decide.", "For clients: reads everything, can't write or decide.")} link={linkLeitura} />}
          </div>
        </section>
      )}

      {dono && <Integracoes salaId={sala.id} />}

      <section className="painel-lista">
        <button className="secao-rotulo secao-dobra" aria-expanded={historico !== null} onClick={() => (historico === null ? verHistorico() : setHistorico(null))}>
          <IconeVoltar tamanho={14} /> {t("Histórico", "History")}
        </button>
        {historico !== null && (historico.length ? (
          <ol className="historico">
            {historico.map((h) => (
              <li key={h.id}>
                <span><strong>{h.agente ? t(`${h.agente} de ${nomeDe(h.quem).split(" ")[0]}`, `${nomeDe(h.quem).split(" ")[0]}'s ${h.agente}`) : nomeDe(h.quem)}</strong> {gravado(h.acao)}{h.detalhe ? <> <span className="historico-detalhe">{h.detalhe}</span></> : null}</span>
                <time className="nota">{new Date(h.em).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "")}</time>
              </li>
            ))}
          </ol>
        ) : <p className="nota secao-nota">{t("Nada registrado ainda.", "Nothing on record yet.")}</p>)}
      </section>

      <section className="painel-lista painel-fim">
        <h3 className="secao-rotulo">{t("Sair", "Leave")}</h3>
        <div className="perigo-linhas">
          <button className="perigo-linha" onClick={sair}>
            <span><strong>{t("Sair da sala", "Leave room")}</strong><span className="nota">{t("Para voltar, precisa de um convite.", "You'll need an invite to come back.")}</span></span>
          </button>
          {dono && (
            <button className="perigo-linha perigo" onClick={apagar}>
              <span><strong>{t("Apagar a sala", "Delete room")}</strong><span className="nota">{t("Some para todos, com todas as mensagens.", "Gone for everyone, with all messages.")}</span></span>
            </button>
          )}
        </div>
      </section>
    </aside>
  );
}

// link de convite: o endereço numa caixa com o Copiar dentro
function Convite({ titulo, texto, link }: { titulo: string; texto: string; link: string }) {
  const [copiado, setCopiado] = useState(false);
  return (
    <div className="convite-item">
      <div className="convite-cab"><strong>{titulo}</strong><span className="nota">{texto}</span></div>
      <div className="copiar-campo">
        <input readOnly value={link.replace(/^https?:\/\//, "")} aria-label={t(`Link: ${titulo}`, `Link: ${titulo}`)} onFocus={(e) => e.target.select()} />
        <button className={`btn btn-pequeno ${copiado ? "" : "btn-cheio"}`} onClick={async () => {
          if (await copiarTexto(link)) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
        }}>{copiado ? <><IconeCheck tamanho={14} /> {t("Copiado", "Copied")}</> : t("Copiar", "Copy")}</button>
      </div>
    </div>
  );
}
