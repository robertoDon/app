import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { abrirConectar, copiarTexto, sb, type Membro, type Sala } from "../supabase";
import type { AgenteSala } from "../pages/Sala";
import { IconeAgente, IconeFechar } from "./Icones";
import { Integracoes } from "./Integracoes";
import { erro, gravado, locale, t } from "../i18n";

type Historico = { id: number; quem: string | null; agente: string | null; acao: string; detalhe: string | null; em: string };

type Props = { sala: Sala; membros: Membro[]; agentes: AgenteSala[]; eu: string; fechar: () => void; recarregar: () => void; foco?: "contexto" };

export function Ajustes({ sala, membros, agentes, eu, fechar, recarregar, foco }: Props) {
  const dono = sala.papel === "dono";
  const nav = useNavigate();
  const [nome, setNome] = useState(sala.nome);
  const [contexto, setContexto] = useState(sala.contexto);
  const [salvo, setSalvo] = useState("");
  const [copiado, setCopiado] = useState(false);
  const link = sala.convite ? `${window.location.origin}/c/${sala.convite}` : "";
  const linkLeitura = sala.convite_leitura ? `${window.location.origin}/c/${sala.convite_leitura}` : "";
  const [copiadoLeitura, setCopiadoLeitura] = useState(false);
  const [historico, setHistorico] = useState<Historico[] | null>(null);
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
    setSalvo(rotulo); setTimeout(() => setSalvo(""), 1500);
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
    if (!confirm(t(`${m.perfis?.nome} também passa a cuidar da sala: muda nome e contexto, convida, tira pessoas e pode apagar a sala.`, `${m.perfis?.nome} will also become an owner: they can change the name and context, invite and remove people, and delete the room.`))) return;
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
    if (prompt(t(`Apagar a sala e todas as mensagens, para todos? Digite o nome da sala para confirmar:\n${sala.nome}`, `Delete the room and all its messages, for everyone? Type the room name to confirm:\n${sala.nome}`)) !== sala.nome) return;
    const { error } = await sb.from("salas").delete().eq("id", sala.id);
    if (error) return alert(erro(error));
    recarregar(); nav("/");
  };

  return (
    <aside className="painel" aria-label={t("Ajustes da sala", "Room settings")}>
      <header className="painel-topo">
        <h2>{t("Ajustes da sala", "Room settings")}</h2>
        <button className="btn-icone" onClick={fechar} aria-label={t("Fechar ajustes", "Close settings")}><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <label htmlFor="aj-nome" className="rotulo">{t("Nome", "Name")}</label>
        <input id="aj-nome" value={nome} maxLength={80} disabled={!dono}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => nome.trim() && nome !== sala.nome && salvar({ nome: nome.trim() }, "nome")}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        {salvo === "nome" && <p className="nota" role="status">{t("Nome salvo.", "Name saved.")}</p>}
      </section>

      <section className="painel-secao">
        <label htmlFor="aj-contexto" className="rotulo">{t("Contexto para os agentes", "Context for agents")}</label>
        <p className="nota">{t("Todo agente lê isto antes de responder: o objetivo da sala, prazos, o que importa, o tom.", "Every agent reads this before replying: the room's goal, deadlines, what matters, the tone.")}</p>
        <textarea id="aj-contexto" rows={6} maxLength={4000} value={contexto} disabled={!dono} autoFocus={foco === "contexto"}
          placeholder={t("Ex.: Lançamento do piloto pago de novembro. Decisões de preço são da Ana; respostas curtas, com números.", "E.g.: Launch of the paid pilot in November. Ana makes the pricing calls; keep replies short, with numbers.")}
          onChange={(e) => setContexto(e.target.value)} />
        {dono && (
          <div className="linha">
            <button className="btn btn-pequeno" disabled={contexto === sala.contexto} onClick={() => salvar({ contexto: contexto.trim() }, "contexto")}>{t("Salvar contexto", "Save context")}</button>
            {salvo === "contexto" && <span className="nota" role="status">{t("Salvo. Os agentes já leem a versão nova.", "Saved. Agents now read the new version.")}</span>}
          </div>
        )}
      </section>

      <section className="painel-secao">
        <span className="rotulo">{t("Pessoas", "People")} · {membros.length}</span>
        <ul className="pessoas">
          {membros.map((m) => (
            <li key={m.user_id}>
              {m.perfis?.avatar ? <img className="avatar" src={m.perfis.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{m.perfis?.nome?.[0]}</span>}
              <span className="pessoa-nome">{m.perfis?.nome}{m.user_id === eu && t(" (você)", " (you)")}
                <span className="presenca">{m.papel === "dono" ? t("cuida da sala", "owner") : m.papel === "leitor" ? t("convidado, só lê", "viewer, view only") : t("participa", "member")}</span>
              </span>
              {m.papel !== "dono" && dono && (
                <span className="linha">
                  {m.papel === "leitor"
                    ? <button className="btn btn-pequeno btn-texto" onClick={() => mudarPapel(m, "membro")}>{t("Liberar para escrever", "Allow writing")}</button>
                    : <>
                        <button className="btn btn-pequeno btn-texto" onClick={() => mudarPapel(m, "leitor")} title={t("A pessoa e os agentes dela só leem", "This person and their agents can only read")}>{t("Só ler", "View only")}</button>
                        <button className="btn btn-pequeno btn-texto" onClick={() => tornarDono(m)}>{t("Tornar dono", "Make owner")}</button>
                      </>}
                  <button className="btn btn-pequeno" onClick={() => remover(m)}>{t("Tirar", "Remove")}</button>
                </span>
              )}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel-secao">
        <span className="rotulo">{t("Agentes", "Agents")} · {agentes.length}</span>
        {agentes.length ? (
          <ul className="pessoas">
            {agentes.map((a) => (
              <li key={`${a.nome}|${a.uid}`}>
                <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                <span className="pessoa-nome">{(() => { const de = membros.find((m) => m.user_id === a.uid)?.perfis?.nome?.split(" ")[0] ?? "?"; return t(`${a.nome} de ${de}`, `${de}'s ${a.nome}`); })()}
                  {a.presenca && <span className={`presenca ${a.presenca.ativo ? "presenca-ativa" : ""}`}>{a.presenca.ativo && <span className="ponto ponto-mini" aria-hidden />}{a.presenca.texto}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="nota">{t("Nenhum agente ainda. Cada pessoa conecta o seu, com a assinatura que já tem.", "No agents yet. Each person connects their own, with the subscription they already have.")}</p>}
        <button className="btn btn-pequeno" onClick={abrirConectar}>{t("Conectar o meu agente", "Connect my agent")}</button>
      </section>

      {link && (
        <section className="painel-secao">
          <span className="rotulo">{t("Convite para participar", "Invite link")}</span>
          <p className="nota">{t("Quem entrar por este link escreve, decide e conecta os próprios agentes.", "Anyone who joins with this link can write, decide and connect their own agents.")}</p>
          <div className="linha">
            <input readOnly value={link} aria-label={t("Link do convite para participar", "Invite link")} onFocus={(e) => e.target.select()} />
            <button className="btn btn-pequeno" onClick={async () => {
              if (await copiarTexto(link)) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
            }}>{copiado ? t("Copiado", "Copied") : t("Copiar", "Copy")}</button>
          </div>
          {linkLeitura && (
            <>
              <span className="rotulo">{t("Convite para acompanhar", "View-only invite link")}</span>
              <p className="nota">{t("Para clientes ou quem só precisa ver. Lê tudo, mas não escreve, não decide e não traz agentes.", "For clients or anyone who just needs to see. They can read everything, but can't write, decide or bring agents.")}</p>
              <div className="linha">
                <input readOnly value={linkLeitura} aria-label={t("Link do convite para acompanhar", "View-only invite link")} onFocus={(e) => e.target.select()} />
                <button className="btn btn-pequeno" onClick={async () => {
                  if (await copiarTexto(linkLeitura)) { setCopiadoLeitura(true); setTimeout(() => setCopiadoLeitura(false), 1500); }
                }}>{copiadoLeitura ? t("Copiado", "Copied") : t("Copiar", "Copy")}</button>
              </div>
            </>
          )}
          {dono ? <button className="link nota" onClick={trocarConvite}>{t("Trocar os links de convite", "Replace invite links")}</button>
            : <p className="nota">{t("Quem cuida da sala pode trocar este link.", "The room owner can replace this link.")}</p>}
        </section>
      )}

      {dono && <Integracoes salaId={sala.id} />}

      <section className="painel-secao">
        <span className="rotulo">{t("Histórico", "History")}</span>
        {historico === null ? (
          <>
            <p className="nota">{t("Quem entrou, saiu, aprovou, apagou, criou e concluiu tarefas. Fica registrado para todos da sala.", "Who joined, left, approved, deleted, created and completed tasks. It's on record for everyone in the room.")}</p>
            <button className="btn btn-pequeno" onClick={verHistorico}>{t("Ver histórico", "View history")}</button>
          </>
        ) : historico.length ? (
          <ol className="historico">
            {historico.map((h) => (
              <li key={h.id}>
                <span><strong>{h.agente ? t(`${h.agente} de ${nomeDe(h.quem).split(" ")[0]}`, `${nomeDe(h.quem).split(" ")[0]}'s ${h.agente}`) : nomeDe(h.quem)}</strong> {gravado(h.acao)}{h.detalhe ? <> <span className="historico-detalhe">{h.detalhe}</span></> : null}</span>
                <time className="nota">{new Date(h.em).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "")}</time>
              </li>
            ))}
          </ol>
        ) : <p className="nota">{t("Nada registrado ainda.", "Nothing on record yet.")}</p>}
      </section>

      <section className="painel-secao painel-fim">
        <div className="linha">
          <button className="btn" onClick={sair}>{t("Sair da sala", "Leave room")}</button>
          {dono && <button className="btn btn-perigo" onClick={apagar}>{t("Apagar a sala", "Delete room")}</button>}
        </div>
      </section>
    </aside>
  );
}
