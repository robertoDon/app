import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { abrirConectar, copiarTexto, sb, type Membro, type Sala } from "../supabase";
import type { AgenteSala } from "../pages/Sala";
import { IconeAgente, IconeFechar } from "./Icones";

type Props = { sala: Sala; membros: Membro[]; agentes: AgenteSala[]; eu: string; fechar: () => void; recarregar: () => void; foco?: "contexto" };

export function Ajustes({ sala, membros, agentes, eu, fechar, recarregar, foco }: Props) {
  const dono = sala.papel === "dono";
  const nav = useNavigate();
  const [nome, setNome] = useState(sala.nome);
  const [contexto, setContexto] = useState(sala.contexto);
  const [salvo, setSalvo] = useState("");
  const [copiado, setCopiado] = useState(false);
  const link = `${window.location.origin}/c/${sala.convite}`;

  useEffect(() => { setNome(sala.nome); setContexto(sala.contexto); }, [sala.id]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const salvar = async (campos: Partial<Pick<Sala, "nome" | "contexto">>, rotulo: string) => {
    const { error } = await sb.from("salas").update(campos).eq("id", sala.id);
    if (error) return alert(error.message);
    setSalvo(rotulo); setTimeout(() => setSalvo(""), 1500);
    recarregar();
  };

  const trocarConvite = async () => {
    if (!confirm("Trocar o link? O link antigo para de funcionar. Quem já está na sala continua.")) return;
    await sb.rpc("trocar_convite", { sala: sala.id });
    recarregar();
  };

  const remover = async (m: Membro) => {
    if (!confirm(`Tirar ${m.perfis?.nome} da sala? Os agentes dessa pessoa também saem.`)) return;
    await sb.from("membros").delete().eq("sala_id", sala.id).eq("user_id", m.user_id);
  };

  const tornarDono = async (m: Membro) => {
    if (!confirm(`${m.perfis?.nome} também passa a cuidar da sala: muda nome e contexto, convida, tira pessoas e pode apagar a sala.`)) return;
    const { error } = await sb.rpc("tornar_dono", { sala: sala.id, pessoa: m.user_id });
    if (error) alert(error.message);
  };

  const outrosDonos = membros.some((m) => m.user_id !== eu && m.papel === "dono");
  const sair = async () => {
    const aviso = dono && !outrosDonos && membros.length > 1
      ? `Sair de "${sala.nome}"? Como você é quem cuida da sala, ${membros.find((m) => m.user_id !== eu)?.perfis?.nome ?? "a próxima pessoa"} passa a cuidar dela.`
      : membros.length === 1 ? `Você é a única pessoa aqui. Sair apaga a sala "${sala.nome}".` : `Sair de "${sala.nome}"? Para voltar, você vai precisar de um convite.`;
    if (!confirm(aviso)) return;
    const { error } = await sb.rpc("sair_da_sala", { sala: sala.id });
    if (error) return alert(error.message);
    recarregar(); nav("/");
  };

  const apagar = async () => {
    if (prompt(`Apagar a sala e todas as mensagens, para todos? Digite o nome da sala para confirmar:\n${sala.nome}`) !== sala.nome) return;
    await sb.from("salas").delete().eq("id", sala.id);
    recarregar(); nav("/");
  };

  return (
    <aside className="painel" aria-label="Ajustes da sala">
      <header className="painel-topo">
        <h2>Ajustes da sala</h2>
        <button className="btn-icone" onClick={fechar} aria-label="Fechar ajustes"><IconeFechar /></button>
      </header>

      <section className="painel-secao">
        <label htmlFor="aj-nome" className="rotulo">Nome</label>
        <input id="aj-nome" value={nome} maxLength={80} disabled={!dono}
          onChange={(e) => setNome(e.target.value)}
          onBlur={() => nome.trim() && nome !== sala.nome && salvar({ nome: nome.trim() }, "nome")}
          onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
        {salvo === "nome" && <p className="nota" role="status">Nome salvo.</p>}
      </section>

      <section className="painel-secao">
        <label htmlFor="aj-contexto" className="rotulo">Contexto para os agentes</label>
        <p className="nota">Todo agente lê isto antes de responder: o objetivo da sala, prazos, o que importa, o tom.</p>
        <textarea id="aj-contexto" rows={6} maxLength={4000} value={contexto} disabled={!dono} autoFocus={foco === "contexto"}
          placeholder="Ex.: Lançamento do piloto pago de novembro. Decisões de preço são da Ana; respostas curtas, com números."
          onChange={(e) => setContexto(e.target.value)} />
        {dono && (
          <div className="linha">
            <button className="btn btn-pequeno" disabled={contexto === sala.contexto} onClick={() => salvar({ contexto: contexto.trim() }, "contexto")}>Salvar contexto</button>
            {salvo === "contexto" && <span className="nota" role="status">Salvo. Os agentes já leem a versão nova.</span>}
          </div>
        )}
      </section>

      <section className="painel-secao">
        <span className="rotulo">Pessoas · {membros.length}</span>
        <ul className="pessoas">
          {membros.map((m) => (
            <li key={m.user_id}>
              {m.perfis?.avatar ? <img className="avatar" src={m.perfis.avatar} alt="" referrerPolicy="no-referrer" /> : <span className="avatar">{m.perfis?.nome?.[0]}</span>}
              <span className="pessoa-nome">{m.perfis?.nome}{m.user_id === eu && " (você)"}</span>
              {m.papel === "dono" ? <span className="nota">cuida da sala</span>
                : dono && (
                  <span className="linha">
                    <button className="btn btn-pequeno btn-texto" onClick={() => tornarDono(m)}>Tornar dono</button>
                    <button className="btn btn-pequeno" onClick={() => remover(m)}>Tirar</button>
                  </span>
                )}
            </li>
          ))}
        </ul>
      </section>

      <section className="painel-secao">
        <span className="rotulo">Agentes · {agentes.length}</span>
        {agentes.length ? (
          <ul className="pessoas">
            {agentes.map((a) => (
              <li key={`${a.nome}|${a.uid}`}>
                <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                <span className="pessoa-nome">{a.nome} de {membros.find((m) => m.user_id === a.uid)?.perfis?.nome?.split(" ")[0] ?? "?"}
                  {a.presenca && <span className={`presenca ${a.presenca.ativo ? "presenca-ativa" : ""}`}>{a.presenca.ativo && <span className="ponto ponto-mini" aria-hidden />}{a.presenca.texto}</span>}
                </span>
              </li>
            ))}
          </ul>
        ) : <p className="nota">Nenhum agente ainda. Cada pessoa conecta o seu, com a assinatura que já tem.</p>}
        <button className="btn btn-pequeno" onClick={abrirConectar}>Conectar o meu agente</button>
      </section>

      <section className="painel-secao">
        <span className="rotulo">Convite</span>
        <div className="linha">
          <input readOnly value={link} aria-label="Link do convite" onFocus={(e) => e.target.select()} />
          <button className="btn btn-pequeno" onClick={async () => {
            if (await copiarTexto(link)) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); }
          }}>{copiado ? "Copiado" : "Copiar"}</button>
        </div>
        {dono && <button className="link nota" onClick={trocarConvite}>Trocar o link do convite</button>}
        {!dono && <p className="nota">Quem cuida da sala pode trocar este link.</p>}
      </section>

      <section className="painel-secao painel-fim">
        <div className="linha">
          <button className="btn" onClick={sair}>Sair da sala</button>
          {dono && <button className="btn btn-perigo" onClick={apagar}>Apagar a sala</button>}
        </div>
      </section>
    </aside>
  );
}
