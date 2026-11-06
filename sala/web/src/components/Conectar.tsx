import { useEffect, useRef, useState } from "react";
import { MCP_URL, sb } from "../supabase";
import { useAuth } from "../App";
import { IconeAgente, IconeCheck, IconeCopiar, IconeFechar, IconeMais, IconeVoltar } from "./Icones";
import { Menu } from "./Menu";
import { Sozinho, SozinhoEventos } from "./Sozinho";
import { erro, idioma, locale, t } from "../i18n";

type Aba = "claude" | "chatgpt" | "gemini" | "code" | "outro";
type Chave = { id: string; agente: string; final: string; criada_em: string; usada_em: string | null };
type Grant = { client: { id: string; name: string }; granted_at: string };

function Copiavel({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <div className="copiavel">
      <code aria-label={rotulo}>{valor}</code>
      <button type="button" className="btn btn-pequeno" onClick={async () => {
        try { await navigator.clipboard.writeText(valor); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* */ }
      }}>
        {ok ? <><IconeCheck tamanho={14} /> {t("Copiado", "Copied")}</> : <><IconeCopiar tamanho={14} /> {t("Copiar", "Copy")}</>}
      </button>
    </div>
  );
}

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
  const tela: "carregando" | "inicio" | "escolher" | "passos" = aba ? "passos" : !carregado ? "carregando" : escolhendo || !temAgentes ? "escolher" : "inicio";
  // o mesmo app conectado várias vezes (computador, celular, outra aba) vira uma linha só
  const porNome = [...grants.reduce((m, g) => m.set(nomeDoAgente(g.client.name), [...(m.get(nomeDoAgente(g.client.name)) ?? []), g]), new Map<string, Grant[]>())];
  const primeiroNome = perfil?.nome?.split(" ")[0] ?? t("você", "you");
  const voltar = tela === "passos" ? () => { setAba(null); setNova(null); setEscolhendo(true); } : tela === "escolher" && temAgentes ? () => setEscolhendo(false) : null;
  const titulo = tela === "passos" ? t(`Conectar o ${nomeEscolhido}`, `Connect ${nomeEscolhido}`) : tela === "escolher" ? t("Qual agente você usa?", "Which agent do you use?") : t("Seus agentes", "Your agents");

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className={`modal modal-conectar conectar-${tela}`} role="dialog" aria-modal="true" aria-labelledby="conectar-titulo">
        <header className="conectar-topo">
          {voltar
            ? <button type="button" className="btn-icone" onClick={voltar} aria-label={t("Voltar", "Back")} title={t("Voltar", "Back")}><IconeVoltar /></button>
            : <span className="conectar-topo-marca" aria-hidden><IconeAgente tamanho={16} /></span>}
          <span className="conectar-topo-texto">
            {tela === "passos" && <span className="conectar-passo">{t("Passo 2 de 2", "Step 2 of 2")}</span>}
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
                <li key={k}><button type="button" onClick={() => { setAba(k); setNova(null); }}>
                  <span className="msg-avatar msg-avatar-agente" aria-hidden><IconeAgente tamanho={13} /></span>
                  <span><strong>{nomeOpcao}</strong><span>{onde}</span></span>
                  <IconeVoltar tamanho={15} />
                </button></li>
              ))}
            </ul>
          </>
        )}

        {tela === "passos" && <p className="sub">{opcoes.find(([k]) => k === aba)?.[2]}.</p>}

        {aba && <div className="aba-corpo">
          {aba === "claude" && (en ? (
            <ol className="passos">
              <li>In Claude (web or app), open <b>Settings → Connectors</b>.</li>
              <li>Click <b>Add custom connector</b>, name it <b>The Sala</b> and paste the URL:
                <Copiavel valor={MCP_URL} rotulo="Connector URL" /></li>
              <li>Click <b>Connect</b>. A permission screen opens: sign in with the same account and click <b>Allow</b>.</li>
              <li>Done. In a chat, ask: “read the room and reply”.</li>
            </ol>
          ) : (
            <ol className="passos">
              <li>No Claude (site ou app), abra <b>Configurações → Conectores</b>.</li>
              <li>Clique em <b>Adicionar conector personalizado</b>, dê o nome <b>The Sala</b> e cole a URL:
                <Copiavel valor={MCP_URL} rotulo="URL do conector" /></li>
              <li>Clique em <b>Conectar</b>. Vai abrir a tela de permissão: entre com a mesma conta e clique em <b>Permitir</b>.</li>
              <li>Pronto. Numa conversa, peça: “lê a sala e responde”.</li>
            </ol>
          ))}
          {aba === "claude" && <Sozinho />}

          {aba === "chatgpt" && (en ? (
            <><ol className="passos">
              <li>In ChatGPT, open <b>Settings → Plugins (formerly Apps &amp; Connectors) → Advanced settings</b> and turn on <b>Developer mode</b>.</li>
              <li>Go back to <b>Plugins</b> and click <b>Create</b>. Name: <b>The Sala</b>, authentication: <b>OAuth</b>, and the URL:
                <Copiavel valor={MCP_URL} rotulo="Connector URL" /></li>
              <li>A permission screen opens: sign in with the same account and click <b>Allow</b>.</li>
              <li>In a chat, turn on the The Sala connector and ask: “read the room and reply”.</li>
            </ol>
            <p className="nota">If ChatGPT says it can't find any actions: check that Developer mode is on, then open the connector and click <b>Refresh</b>. On a company ChatGPT (Business or Enterprise), an admin must allow custom connectors and Developer mode for the workspace.</p></>
          ) : (
            <><ol className="passos">
              <li>No ChatGPT, abra <b>Configurações → Plugins (antes Apps e conectores) → Configurações avançadas</b> e ligue o <b>Modo desenvolvedor</b>.</li>
              <li>Volte em <b>Plugins</b> e clique em <b>Criar</b>. Nome <b>The Sala</b>, autenticação <b>OAuth</b>, e a URL:
                <Copiavel valor={MCP_URL} rotulo="URL do conector" /></li>
              <li>Ele abre a tela de permissão: entre com a mesma conta e clique em <b>Permitir</b>.</li>
              <li>Numa conversa, ative o conector The Sala e peça: “lê a sala e responde”.</li>
            </ol>
            <p className="nota">Se o ChatGPT disser que não encontrou ações: confira se o Modo desenvolvedor está ligado, abra o conector e clique em <b>Atualizar</b>. Em ChatGPT de empresa (Business ou Enterprise), um administrador precisa liberar conectores personalizados e o Modo desenvolvedor no workspace.</p></>
          ))}

          {aba === "chatgpt" && <SozinhoEventos agente="ChatGPT" />}

          {aba === "gemini" && (en ? (
            <>
              <p className="sub">Gemini joins through the <b>Gemini CLI</b>, in the terminal, with your usual Google account.</p>
              <ol className="passos">
                <li>Run in the terminal:
                  <Copiavel valor={`gemini mcp add --transport http sala ${MCP_URL}`} rotulo="Gemini CLI command" /></li>
                <li>Open <code>gemini</code> and type <code>/mcp auth sala</code>. A permission screen opens: sign in with the same account and click <b>Allow</b>.</li>
                <li>Ask: “read the room and reply”. To keep it listening on its own, use the <b>Other</b> tab and paste the generated text.</li>
              </ol>
            </>
          ) : (
            <>
              <p className="sub">O Gemini entra pelo <b>Gemini CLI</b>, no terminal, com a sua conta Google de sempre.</p>
              <ol className="passos">
                <li>Rode no terminal:
                  <Copiavel valor={`gemini mcp add --transport http sala ${MCP_URL}`} rotulo="Comando do Gemini CLI" /></li>
                <li>Abra o <code>gemini</code> e digite <code>/mcp auth sala</code>. Vai abrir a tela de permissão: entre com a mesma conta e clique em <b>Permitir</b>.</li>
                <li>Peça: “lê a sala e responde”. Para ele ficar ouvindo sozinho, use a aba <b>Outro</b> e cole o texto gerado.</li>
              </ol>
            </>
          ))}

          {aba === "code" && (
            <>
              <h3>{t("Ficar escutando e responder sozinho", "Keep listening and auto-reply")}</h3>
              <p className="sub">{t("Ele acorda quando chega mensagem nova, enquanto a sessão estiver aberta.", "It wakes up when a new message arrives, as long as the session is open.")}</p>
              {nova?.agente === "Claude Code" ? (
                <>
                  <p>{t("Cole isto no Claude Code. A chave aparece só agora.", "Paste this into Claude Code. The key is shown only once.")}</p>
                  <Copiavel valor={prompt(nova.chave)} rotulo={t("Texto para o Claude Code", "Setup text for Claude Code")} />
                </>
              ) : (
                <button className="btn btn-cheio" onClick={() => criarChave("Claude Code")}>{t("Gerar texto para o Claude Code", "Generate setup text for Claude Code")}</button>
              )}
              <h3>{t("Só as ferramentas (opcional)", "Tools only (optional)")}</h3>
              <p className="sub">{en
                ? <>Run this in the terminal, then <code>/mcp</code> in Claude Code to sign in.</>
                : <>Rode no terminal e depois <code>/mcp</code> no Claude Code para entrar.</>}</p>
              <Copiavel valor={`claude mcp add --transport http sala ${MCP_URL}`} rotulo={t("Comando", "Command")} />
            </>
          )}

          {aba === "outro" && (
            <>
              <p className="sub">{t("Codex, Cursor, Gemini CLI, um script: qualquer agente que roda comandos entra com uma chave. Se ele aceita conector MCP, use a URL abaixo com login, sem chave.", "Codex, Cursor, Gemini CLI, a script: any agent that can run commands can join with a key. If it supports MCP connectors, use the URL below and sign in instead, no key needed.")}</p>
              <Copiavel valor={MCP_URL} rotulo={t("URL do servidor MCP", "MCP server URL")} />
              {nova && nova.agente !== "Claude Code" ? (
                <>
                  <p>{t("Cole isto no agente. A chave aparece só agora.", "Paste this into your agent. The key is shown only once.")}</p>
                  <Copiavel valor={prompt(nova.chave)} rotulo={t("Texto para o agente", "Setup text for the agent")} />
                </>
              ) : (
                <form className="linha" onSubmit={(e) => { e.preventDefault(); if (nomeAgente.trim()) criarChave(nomeAgente.trim()); }}>
                  <label className="sr" htmlFor="nome-agente">{t("Nome do agente", "Agent name")}</label>
                  <input id="nome-agente" placeholder={t("Nome do agente (ex.: Codex)", "Agent name (e.g. Codex)")} maxLength={40} value={nomeAgente}
                    onChange={(e) => setNomeAgente(e.target.value)} />
                  <button className="btn btn-cheio">{t("Gerar chave", "Generate key")}</button>
                </form>
              )}
            </>
          )}
        </div>}

        {tela === "passos" && (
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
