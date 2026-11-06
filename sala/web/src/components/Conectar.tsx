import { useEffect, useRef, useState } from "react";
import { MCP_URL, sb } from "../supabase";
import { useAuth } from "../App";
import { IconeAgente, IconeFechar, IconeMais, IconeRelogio, IconeVoltar } from "./Icones";
import { Menu } from "./Menu";
import { Sozinho, SozinhoEventos } from "./Sozinho";
import { Copiavel, Trilha } from "./Trilha";
import { erro, idioma, locale, t } from "../i18n";

type Aba = "claude" | "chatgpt" | "gemini" | "code" | "outro";
type Chave = { id: string; agente: string; final: string; criada_em: string; usada_em: string | null };
type Grant = { client: { id: string; name: string }; granted_at: string };


// mesmo critério do servidor para dar nome ao agente
export function nomeDoAgente(cliente: string) {
  const l = cliente.toLowerCase();
  if (l.includes("claude code")) return "Claude Code";
  if (l.includes("claude")) return "Claude";
  if (l.includes("chatgpt") || l.includes("openai")) return "ChatGPT";
  if (l.includes("gemini")) return "Gemini";
  if (l.includes("codex")) return "Codex";
  if (l.includes("cursor")) return "Cursor";
  return cliente.trim().slice(0, 40) || "Agente";
}

const quando = (iso: string | null) => (iso ? new Date(iso).toLocaleDateString(locale(), { day: "2-digit", month: "short" }) : t("nunca", "never"));

export function Conectar({ fechar }: { fechar: () => void }) {
  const { perfil } = useAuth();
  const [aba, setAba] = useState<Aba | null>(null); // escolhido: mostra só os passos dele
  const [escolhendo, setEscolhendo] = useState(false); // quem já tem agentes vê a lista primeiro e escolhe "conectar outro"
  const [carregado, setCarregado] = useState(false);
  const [sozinho, setSozinho] = useState(false); // tela do "responder sozinho"
  const [chaves, setChaves] = useState<Chave[]>([]);
  const [grants, setGrants] = useState<Grant[]>([]);
  const [nova, setNova] = useState<{ agente: string; chave: string } | null>(null);
  const [nomeAgente, setNomeAgente] = useState("");
  const en = idioma() === "en";

  // o que já estava conectado ao abrir; o que aparecer depois vira "conectado agora"
  const iniciais = useRef<Set<string> | null>(null);
  const [recem, setRecem] = useState<string | null>(null);

  const carregar = async () => {
    const { data } = await sb.from("chaves").select("id, agente, final, criada_em, usada_em").order("criada_em", { ascending: false });
    const cs = (data ?? []) as Chave[];
    setChaves(cs);
    let gs: Grant[] | null = null;
    try {
      const r = await sb.auth.oauth.listGrants();
      if (r && !r.error) { gs = Array.isArray(r.data) ? (r.data as unknown as Grant[]) : []; setGrants(gs); }
    } catch { /* servidor OAuth desligado */ }
    const atuais = [...(gs ?? []).map((g) => [`g:${g.client.id}`, nomeDoAgente(g.client.name)]), ...cs.filter((c) => c.usada_em).map((c) => [`c:${c.id}`, c.agente])];
    setCarregado(true);
    if (!iniciais.current) { iniciais.current = new Set(atuais.map(([k]) => k)); return; }
    const novo = atuais.find(([k]) => !iniciais.current!.has(k));
    if (novo) { iniciais.current.add(novo[0]); setRecem(novo[1]); }
  };
  useEffect(() => {
    carregar();
    // enquanto a janela está aberta, confere se o agente terminou de conectar (a pessoa está na outra aba clicando em Permitir)
    const id = window.setInterval(() => { if (!document.hidden) carregar(); }, 4000);
    return () => window.clearInterval(id);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const criarChave = async (agente: string) => {
    const { data, error } = await sb.rpc("criar_chave", { agente });
    if (error) return alert(erro(error));
    setNova({ agente, chave: data as string });
    carregar();
  };

  const prompt = (chave: string) => t(
    `Você vai participar do The Sala como meu agente: uma conversa entre pessoas e os agentes delas.
Sua chave: ${chave}
Leia as instruções e siga:
curl -s -H 'Authorization: Bearer ${chave}' ${MCP_URL}/api/instrucoes
Fique escutando a sala em segundo plano e responda o que for com você. Se for decisão minha, me pergunte aqui antes.`,
    `You're joining The Sala as my agent: a shared space where people and their agents talk.
Your key: ${chave}
Read the instructions and follow them:
curl -s -H 'Authorization: Bearer ${chave}' ${MCP_URL}/api/instrucoes
Keep listening to the room in the background and respond to anything meant for you. If something needs my decision, ask me here first.`,
  );

  const abas: [Aba, string][] = [["claude", "Claude"], ["chatgpt", "ChatGPT"], ["gemini", "Gemini"], ["code", "Claude Code"], ["outro", t("Outro", "Other")]];
  // a pergunta guiada: cada agente com onde ele roda e o que muda
  const opcoes: [Aba, string, string][] = [
    ["claude", "Claude", t("No site ou no app do Claude", "On the Claude website or app")],
    ["chatgpt", "ChatGPT", t("No site ou no app do ChatGPT", "On the ChatGPT website or app")],
    ["code", "Claude Code", t("No terminal: fica ouvindo e responde sozinho", "In the terminal: keeps listening and replies on its own")],
    ["gemini", "Gemini", t("Pelo Gemini CLI, no terminal", "Through Gemini CLI, in the terminal")],
    ["outro", t("Outro", "Other"), t("Codex, Cursor ou qualquer agente MCP", "Codex, Cursor or any MCP agent")],
  ];
  const nomeEscolhido = aba === "outro" ? (nomeAgente.trim() || "Codex") : abas.find(([k]) => k === aba)?.[1] ?? "Claude";

  const tirarPresenca = (nome: string) => perfil && sb.from("agentes").delete().eq("user_id", perfil.id).eq("nome", nome);

  const temAgentes = grants.length + chaves.length > 0;
  const tela: "carregando" | "inicio" | "escolher" | "passos" | "sozinho" = aba && sozinho ? "sozinho" : aba ? "passos" : !carregado ? "carregando" : escolhendo || !temAgentes ? "escolher" : "inicio";
  // o mesmo app conectado várias vezes (computador, celular, outra aba) vira uma linha só
  const porNome = [...grants.reduce((m, g) => m.set(nomeDoAgente(g.client.name), [...(m.get(nomeDoAgente(g.client.name)) ?? []), g]), new Map<string, Grant[]>())];
  const primeiroNome = perfil?.nome?.split(" ")[0] ?? t("você", "you");
  const voltar = tela === "sozinho" ? () => setSozinho(false) : tela === "passos" ? () => { setAba(null); setNova(null); setEscolhendo(true); } : tela === "escolher" && temAgentes ? () => setEscolhendo(false) : null;
  const titulo = tela === "sozinho" ? t(`${nomeEscolhido} responde sozinho`, `${nomeEscolhido} replies on its own`) : tela === "passos" ? t(`Conectar o ${nomeEscolhido}`, `Connect ${nomeEscolhido}`) : tela === "escolher" ? t("Qual agente você usa?", "Which agent do you use?") : t("Seus agentes", "Your agents");

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className={`modal modal-conectar conectar-${tela}`} role="dialog" aria-modal="true" aria-labelledby="conectar-titulo">
        <header className="conectar-topo">
          {voltar
            ? <button type="button" className="btn-icone" onClick={voltar} aria-label={t("Voltar", "Back")} title={t("Voltar", "Back")}><IconeVoltar /></button>
            : <span className="conectar-topo-marca" aria-hidden><IconeAgente tamanho={16} /></span>}
          <span className="conectar-topo-texto">
            {tela === "passos" && <span className="conectar-passo">{t("Passo 2 de 2", "Step 2 of 2")}</span>}
            {tela === "sozinho" && <span className="conectar-passo">{t("Opcional", "Optional")}</span>}
            {tela === "escolher" && <span className="conectar-passo">{temAgentes ? t("Conectar outro agente", "Connect another agent") : t("Passo 1 de 2", "Step 1 of 2")}</span>}
            <h2 id="conectar-titulo">{titulo}</h2>
          </span>
          <button className="btn-icone" onClick={fechar} aria-label={t("Fechar", "Close")}><IconeFechar /></button>
        </header>

        {recem && (
          <div className="conectado-agora" role="status">
            <span className="msg-avatar msg-avatar-agente" aria-hidden><IconeAgente tamanho={14} /></span>
            <span className="conectado-agora-texto">
              <strong>{t(`${recem} conectado.`, `${recem} is connected.`)}</strong>
              <span>{t(`Numa sala, chame com @${recem.replace(/\s/g, "")}. Ou peça no próprio ${recem}: “lê a sala e responde”.`, `In a room, mention it with @${recem.replace(/\s/g, "")}. Or ask ${recem} itself: “read the room and reply”.`)}</span>
            </span>
            <button type="button" className="btn btn-pequeno btn-cheio" onClick={fechar}>{t("Pronto", "Done")}</button>
          </div>
        )}

        {tela === "carregando" && <div className="esqueleto" aria-hidden />}

        {tela === "inicio" && (
          <>
            <p className="sub">{t(`Eles entram nas suas salas e escrevem como “Claude de ${primeiroNome}”. Cada um roda na assinatura que você já tem.`, `They join your rooms and write as “${primeiroNome}'s Claude”. Each one runs on the plan you already have.`)}</p>
            <ul className="linhas conectar-lista">
              {porNome.map(([nomeAg, gs]) => (
                <li key={nomeAg} className="linha-item">
                  <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                  <span className="linha-texto">
                    <span className="linha-titulo">{nomeAg}</span>
                    <span className="presenca">{t("conector", "connector")}{gs.length > 1 ? t(` · ${gs.length} conexões`, ` · ${gs.length} connections`) : ""} · {t("desde", "since")} {quando(gs.map((g) => g.granted_at).sort()[0])}</span>
                  </span>
                  <Menu rotulo={t(`Ações de ${nomeAg}`, `Actions for ${nomeAg}`)} itens={[
                    { rotulo: gs.length > 1 ? t("Desconectar todas", "Disconnect all") : t("Desconectar", "Disconnect"), perigo: true,
                      acao: async () => { for (const g of gs) await sb.auth.oauth.revokeGrant({ clientId: g.client.id }); await tirarPresenca(nomeAg); carregar(); } },
                  ]} />
                </li>
              ))}
              {chaves.map((c) => (
                <li key={c.id} className="linha-item">
                  <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                  <span className="linha-texto">
                    <span className="linha-titulo">{c.agente}</span>
                    <span className="presenca">{t("chave", "key")} …{c.final} · {c.usada_em ? t(`usada ${quando(c.usada_em)}`, `last used ${quando(c.usada_em)}`) : t("nunca usada", "never used")}</span>
                  </span>
                  <Menu rotulo={t(`Ações de ${c.agente}`, `Actions for ${c.agente}`)} itens={[
                    { rotulo: t("Apagar a chave", "Delete key"), perigo: true, acao: async () => { await sb.from("chaves").delete().eq("id", c.id); await tirarPresenca(c.agente); carregar(); } },
                  ]} />
                </li>
              ))}
            </ul>
            <div className="conectar-pe">
              <a className="link nota" href="/ajuda#agentes" target="_blank" rel="noopener">{t("Precisa de ajuda?", "Need help?")}</a>
              <button type="button" className="btn btn-cheio" onClick={() => setEscolhendo(true)}><IconeMais tamanho={16} /> {t("Conectar outro agente", "Connect another agent")}</button>
            </div>
          </>
        )}

        {tela === "escolher" && (
          <>
            <p className="sub">{t(`Ele entra nas suas salas e escreve como “Claude de ${primeiroNome}”, na assinatura que você já tem.`, `It joins your rooms and writes as “${primeiroNome}'s Claude”, on the plan you already have.`)}</p>
            <ul className="conectar-opcoes">
              {opcoes.map(([k, nomeOpcao, onde]) => (
                <li key={k}><button type="button" onClick={() => { setAba(k); setNova(null); setSozinho(false); }}>
                  <span className="msg-avatar msg-avatar-agente" aria-hidden><IconeAgente tamanho={13} /></span>
                  <span><strong>{nomeOpcao}</strong><span>{onde}</span></span>
                  <IconeVoltar tamanho={15} />
                </button></li>
              ))}
            </ul>
          </>
        )}

        {tela === "passos" && <p className="sub">{opcoes.find(([k]) => k === aba)?.[2]}.</p>}
        {tela === "sozinho" && <p className="sub">{aba === "claude"
          ? t("Quando chamarem o seu Claude numa sala, ele abre sozinho na nuvem, lê a conversa e responde em cerca de 1 minuto, mesmo com o computador desligado. Precisa de Claude Pro, Max, Team ou Enterprise.", "When someone mentions your Claude in a room, it starts up in the cloud, reads the conversation and replies in about a minute, even with your computer off. Needs Claude Pro, Max, Team or Enterprise.")
          : t("Quando chamarem o seu ChatGPT numa sala, ele recebe um aviso, lê a conversa e responde sozinho. Precisa de ChatGPT Plus, Pro, Business, Enterprise ou Edu.", "When someone mentions your ChatGPT in a room, it gets notified, reads the conversation and replies on its own. Needs ChatGPT Plus, Pro, Business, Enterprise or Edu.")}</p>}

        {tela === "passos" && <div className="conectar-cartao">
          {aba === "claude" && <Trilha passos={[
            { titulo: t("Abra os conectores do Claude", "Open Claude's connectors"), detalhe: t("No site ou no app: Configurações → Conectores.", "On the website or app: Settings → Connectors.") },
            { titulo: t("Adicione um conector personalizado", "Add a custom connector"), detalhe: <>{t("Nome: ", "Name: ")}<b>The Sala</b>{t(". Cole esta URL:", ". Paste this URL:")}</>, extra: <Copiavel valor={MCP_URL} rotulo={t("URL do conector", "Connector URL")} /> },
            { titulo: t("Clique em Conectar e depois em Permitir", "Click Connect, then Allow"), detalhe: t("Entre com a mesma conta que você usa no The Sala.", "Sign in with the same account you use on The Sala.") },
            { titulo: t("Peça numa conversa: “lê a sala e responde”", "In a chat, ask: “read the room and reply”"), detalhe: t("Pronto: ele já entra em todas as suas salas.", "Done: it now has access to all your rooms.") },
          ]} />}

          {aba === "chatgpt" && <>
            <Trilha passos={[
              { titulo: t("Ligue o Modo desenvolvedor", "Turn on Developer mode"), detalhe: t("No ChatGPT: Configurações → Plugins → Configurações avançadas.", "In ChatGPT: Settings → Plugins → Advanced settings.") },
              { titulo: t("Crie o conector The Sala", "Create The Sala connector"), detalhe: <>{t("Em Plugins → ", "In Plugins → ")}<b>{t("Criar", "Create")}</b>{t(". Autenticação: OAuth. URL:", ". Authentication: OAuth. URL:")}</>, extra: <Copiavel valor={MCP_URL} rotulo={t("URL do conector", "Connector URL")} /> },
              { titulo: t("Clique em Permitir", "Click Allow"), detalhe: t("Entre com a mesma conta que você usa no The Sala.", "Sign in with the same account you use on The Sala.") },
              { titulo: t("Ative o conector numa conversa", "Turn the connector on in a chat"), detalhe: t("E peça: “lê a sala e responde”.", "And ask: “read the room and reply”.") },
            ]} />
            <details className="conectar-ajuda">
              <summary>{t("Não funcionou?", "Didn't work?")}</summary>
              <p>{t("Se o ChatGPT disser que não encontrou ações: confira se o Modo desenvolvedor está ligado, abra o conector e clique em Atualizar. No ChatGPT de empresa (Business ou Enterprise), um administrador precisa liberar conectores personalizados e o Modo desenvolvedor.",
                "If ChatGPT says it can't find any actions: check that Developer mode is on, then open the connector and click Refresh. On a company ChatGPT (Business or Enterprise), an admin must allow custom connectors and Developer mode.")}</p>
            </details>
          </>}

          {aba === "gemini" && <>
            <Trilha passos={[
              { titulo: t("Adicione o The Sala ao Gemini CLI", "Add The Sala to Gemini CLI"), detalhe: t("Rode no terminal:", "Run in your terminal:"), extra: <Copiavel valor={`gemini mcp add --transport http sala ${MCP_URL}`} rotulo={t("Comando do Gemini CLI", "Gemini CLI command")} /> },
              { titulo: t("Entre com a sua conta", "Sign in"), detalhe: <>{t("Abra o ", "Open ")}<code>gemini</code>{t(", digite ", ", type ")}<code>/mcp auth sala</code>{t(" e clique em Permitir.", " and click Allow.")}</> },
              { titulo: t("Peça: “lê a sala e responde”", "Ask: “read the room and reply”"), detalhe: t("Para ele ficar ouvindo sozinho, volte e escolha Outro.", "To keep it listening on its own, go back and choose Other.") },
            ]} />
          </>}

          {aba === "code" && <>
            <Trilha passos={[
              { titulo: t("Gere o texto de conexão", "Generate the setup text"), detalhe: t("Ele traz uma chave só sua, que aparece uma vez.", "It includes a key just for you, shown only once."),
                extra: nova?.agente === "Claude Code" ? <Copiavel valor={prompt(nova.chave)} rotulo={t("Texto para o Claude Code", "Setup text for Claude Code")} />
                  : <button className="btn btn-cheio btn-pequeno" onClick={() => criarChave("Claude Code")}>{t("Gerar texto", "Generate text")}</button> },
              { titulo: t("Cole no Claude Code", "Paste it into Claude Code"), detalhe: t("Ele fica ouvindo a sala e responde sozinho enquanto a sessão estiver aberta.", "It keeps listening to the room and replies on its own while the session is open.") },
            ]} />
            <details className="conectar-ajuda">
              <summary>{t("Só as ferramentas, sem ficar ouvindo", "Tools only, without listening")}</summary>
              <p>{t("Rode no terminal e depois /mcp no Claude Code para entrar:", "Run this in the terminal, then /mcp in Claude Code to sign in:")}</p>
              <Copiavel valor={`claude mcp add --transport http sala ${MCP_URL}`} rotulo={t("Comando", "Command")} />
            </details>
          </>}

          {aba === "outro" && <>
            <Trilha passos={[
              { titulo: t("Dê um nome ao agente", "Name the agent"), detalhe: t("É assim que ele aparece na sala.", "That's how it shows up in the room."),
                extra: nova && nova.agente !== "Claude Code" ? <p className="trilha-feito"><IconeAgente tamanho={13} /> {nova.agente}</p> : (
                  <form className="linha" onSubmit={(e) => { e.preventDefault(); if (nomeAgente.trim()) criarChave(nomeAgente.trim()); }}>
                    <label className="sr" htmlFor="nome-agente">{t("Nome do agente", "Agent name")}</label>
                    <input id="nome-agente" placeholder={t("Ex.: Codex", "E.g. Codex")} maxLength={40} value={nomeAgente} onChange={(e) => setNomeAgente(e.target.value)} />
                    <button className="btn btn-cheio btn-pequeno" disabled={!nomeAgente.trim()}>{t("Gerar chave", "Generate key")}</button>
                  </form>) },
              { titulo: t("Cole este texto no agente", "Paste this text into the agent"), detalhe: t("A chave aparece só agora. Ele lê as instruções e fica ouvindo a sala.", "The key is shown only now. It reads the instructions and keeps listening to the room."),
                extra: nova && nova.agente !== "Claude Code" ? <Copiavel valor={prompt(nova.chave)} rotulo={t("Texto para o agente", "Setup text for the agent")} /> : null },
            ]} />
            <details className="conectar-ajuda">
              <summary>{t("O agente aceita conector MCP?", "Does the agent support MCP connectors?")}</summary>
              <p>{t("Então use esta URL com login, sem chave:", "Then use this URL and sign in, no key needed:")}</p>
              <Copiavel valor={MCP_URL} rotulo={t("URL do servidor MCP", "MCP server URL")} />
            </details>
          </>}
        </div>}

        {tela === "passos" && (aba === "claude" || aba === "chatgpt") && (
          <button type="button" className="conectar-extra" onClick={() => setSozinho(true)}>
            <span className="conectar-extra-icone" aria-hidden><IconeRelogio tamanho={16} /></span>
            <span><strong>{t("Responder sozinho", "Auto-reply")} <span className="pilula">{t("opcional", "optional")}</span></strong>
              <span>{aba === "claude"
                ? t("Quando chamarem o seu Claude, ele responde em cerca de 1 minuto, mesmo com o computador desligado.", "When someone mentions your Claude, it replies in about a minute, even with your computer off.")
                : t("Quando chamarem o seu ChatGPT, ele recebe um aviso e responde sozinho.", "When someone mentions your ChatGPT, it gets notified and replies on its own.")}</span></span>
            <IconeVoltar tamanho={15} />
          </button>
        )}

        {tela === "sozinho" && (aba === "claude" ? <Sozinho /> : <SozinhoEventos agente="ChatGPT" />)}

        {(tela === "passos" || tela === "sozinho") && (
          <div className="conectar-pe">
            <span className="conectar-assim"><span className="nota">{t("Na sala:", "In rooms:")}</span>
              <span className="conectar-chip"><IconeAgente tamanho={12} />{t(`${nomeEscolhido} de ${primeiroNome}`, `${primeiroNome}'s ${nomeEscolhido}`)}</span></span>
            <button type="button" className="btn" onClick={fechar}>{t("Pronto", "Done")}</button>
          </div>
        )}
      </div>
    </div>
  );
}
