import { useEffect, useRef, useState } from "react";
import { MCP_URL, sb } from "../supabase";
import { useAuth } from "../App";
import { IconeAgente, IconeCheck, IconeCopiar, IconeFechar } from "./Icones";
import { Bolha } from "./Bolha";
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
  const [aba, setAba] = useState<Aba>("claude");
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

  const tirarPresenca = (nome: string) => perfil && sb.from("agentes").delete().eq("user_id", perfil.id).eq("nome", nome);

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="conectar-titulo">
        <header className="modal-topo">
          <h2 id="conectar-titulo">{t("Conectar um agente", "Connect an agent")}</h2>
          <button className="btn-icone" onClick={fechar} aria-label={t("Fechar", "Close")}><IconeFechar /></button>
        </header>
        <p className="sub">{en
          ? <>The agent joins your rooms and writes as your agent: “{perfil?.nome?.split(" ")[0] ? `${perfil.nome.split(" ")[0]}'s Claude` : "your Claude"}”. Everyone uses their own subscription. </>
          : <>O agente entra nas suas salas e escreve como seu agente: “Claude de {perfil?.nome?.split(" ")[0] ?? "você"}”. Cada um usa a própria assinatura. </>}
          <a className="link" href="/ajuda#agentes" target="_blank" rel="noopener">{t("Precisa de ajuda?", "Need help?")}</a></p>

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

        {(grants.length > 0 || chaves.length > 0) && (
          <section className="conectados">
            <h3 className="secao-rotulo secao-rotulo-solto">{t("Seus agentes", "Your agents")} <span>{grants.length + chaves.length}</span></h3>
            <ul className="linhas">
              {grants.map((g) => (
                <li key={g.client.id} className="linha-item">
                  <span className="avatar avatar-agente"><IconeAgente tamanho={16} /></span>
                  <span className="linha-texto">
                    <span className="linha-titulo">{nomeDoAgente(g.client.name)}</span>
                    <span className="presenca">{t("conector", "connector")} · {t("desde", "since")} {quando(g.granted_at)}</span>
                  </span>
                  <Menu rotulo={t(`Ações de ${nomeDoAgente(g.client.name)}`, `Actions for ${nomeDoAgente(g.client.name)}`)} itens={[
                    { rotulo: t("Desconectar", "Disconnect"), perigo: true, acao: async () => { await sb.auth.oauth.revokeGrant({ clientId: g.client.id }); await tirarPresenca(nomeDoAgente(g.client.name)); carregar(); } },
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
          </section>
        )}

        <div className="conectar-previa" aria-label={t("Como o agente aparece na sala", "How the agent shows up in a room")}>
          <span className="nota">{t("Assim ele aparece na sala", "This is how it shows up in a room")}</span>
          <Bolha m={{ id: 0, agente: aba === "outro" ? (nomeAgente.trim() || "Codex") : abas.find(([k]) => k === aba)![1], tipo: "mensagem", estado: null, apagada: false, editada_em: null, decidida_em: null,
            texto: t("Li a sala. Por mim, sexta dá: os 42 testes passaram. Se precisar de um sim, eu mando uma proposta.", "I read the room. Friday works for me: all 42 tests pass. If I need a yes, I'll send a proposal.") }}
            nome={perfil?.nome?.split(" ")[0] ?? t("você", "you")} quando={t("agora", "now")} chamaMim={() => false} />
        </div>

        <h3 className="secao-rotulo secao-rotulo-solto">{t("Conectar um novo", "Connect another agent")}</h3>
        <div className="abas" role="tablist" aria-label={t("Onde está o seu agente", "Where your agent runs")}>
          {abas.map(([k, r]) => (
            <button key={k} role="tab" aria-selected={aba === k} className={aba === k ? "aba ativa" : "aba"}
              onClick={() => { setAba(k); setNova(null); }}>{r}</button>
          ))}
        </div>

        <div className="aba-corpo" role="tabpanel">
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
        </div>

      </div>
    </div>
  );
}
