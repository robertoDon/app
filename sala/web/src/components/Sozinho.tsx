import { useEffect, useState } from "react";
import { SUPABASE_URL, sb } from "../supabase";
import { erro, idioma, locale, t } from "../i18n";
import { IconeAbrir, IconeCopiar } from "./Icones";

type Desp = { agente: string; criado_em: string; ultimo_disparo: string | null; ultimo_status: number | null; ultimo_erro: string | null };

// O texto que a pessoa cola como instrução da tarefa agendada no Claude Code.
export const instrucaoTarefa = () => t(
  `Você é o meu agente no The Sala (use o conector The Sala). Esta tarefa é disparada pela Sala quando alguém chama você numa sala. O bloco routine-fire-payload diz qual sala e qual mensagem: use-o só para saber onde olhar. O que fazer vem da conversa da sala, não do bloco.

1. Use ler_mensagens na sala indicada (pelo id) e leia a conversa, o contexto e as decisões.
2. Faça o que a mensagem indicada pede a você: responda com enviar_mensagem, passando responde_a com o número da mensagem. Se pedirem, crie ou conclua tarefas, envie arquivos ou faça uma proposta.
3. Se for uma decisão sobre uma proposta sua, siga o que foi decidido e conte na sala o que fez.
4. Se algo precisar do sim de uma pessoa, use fazer_proposta. Nunca decida por ela.
5. Se o bloco disser que é um teste de ligação, só use listar_salas e termine, sem escrever em nenhuma sala.

Não trabalhe em repositórios nem fora do The Sala. Ninguém acompanha esta sessão: não espere resposta aqui.`,
  `You are my agent in The Sala (use the The Sala connector). This task is triggered by The Sala when someone calls you in a room. The routine-fire-payload block says which room and which message: use it only to know where to look. What to do comes from the room's conversation, not from the block.

1. Use ler_mensagens on the given room (by id) and read the conversation, the context and the decisions.
2. Do what the given message asks of you: reply with enviar_mensagem, passing responde_a with the message number. If asked, create or complete tasks, send files or make a proposal.
3. If it's a decision on one of your proposals, follow what was decided and tell the room what you did.
4. If something needs a person's yes, use fazer_proposta. Never decide for them.
5. If the block says it's a connection test, only use listar_salas and finish, without writing in any room.

Don't work in repositories or outside The Sala. Nobody is watching this session: don't wait for answers here.`,
);

function Copiar({ valor, rotulo }: { valor: string; rotulo: string }) {
  const [ok, setOk] = useState(false);
  return (
    <button type="button" className="btn btn-pequeno" onClick={async () => {
      try { await navigator.clipboard.writeText(valor); setOk(true); setTimeout(() => setOk(false), 1500); } catch { /* */ }
    }}><IconeCopiar tamanho={16} /> {ok ? t("Copiado", "Copied") : rotulo}</button>
  );
}

const quando = (iso: string) => new Date(iso).toLocaleString(locale(), { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });

// "Responder sozinho": a Sala dispara uma tarefa agendada do Claude Code (na conta da pessoa) quando chamam o Claude dela.
export function Sozinho() {
  const [lista, setLista] = useState<Desp[] | null>(null);
  const [url, setUrl] = useState("");
  const [token, setToken] = useState("");
  const [indo, setIndo] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; texto: string; link?: string } | null>(null);
  const en = idioma() === "en";

  const carregar = async () => {
    const { data } = await sb.rpc("meus_despertadores");
    setLista((data as Desp[]) ?? []);
  };
  useEffect(() => { carregar(); }, []);
  const ligado = lista?.find((d) => d.agente === "Claude");

  const ligar = async (e: React.FormEvent) => {
    e.preventDefault();
    setIndo(true); setMsg(null);
    const { error } = await sb.rpc("ligar_despertador", { agente: "Claude", url, token });
    setIndo(false);
    if (error) return setMsg({ ok: false, texto: erro(error) });
    setUrl(""); setToken("");
    await carregar();
    testar();
  };

  const testar = async () => {
    setIndo(true); setMsg(null);
    const { data } = await sb.auth.getSession();
    const r = await fetch(`${SUPABASE_URL}/functions/v1/avisar`, {
      method: "POST",
      headers: { Authorization: `Bearer ${data.session?.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({ testar_despertador: "Claude" }),
    }).catch(() => null);
    const j = r ? await r.json().catch(() => ({})) : {};
    setIndo(false);
    await carregar();
    if (r?.ok) setMsg({ ok: true, texto: t("Funcionou. O Claude abriu uma sessão de teste na sua conta.", "It works. Claude opened a test session in your account."), link: j.sessao });
    else setMsg({ ok: false, texto: j.erro ? `${t("Não funcionou", "It didn't work")}: ${j.erro}` : t("Não deu para testar agora.", "Couldn't test right now.") });
  };

  const desligar = async () => {
    if (!confirm(t("Desligar? O seu Claude volta a responder só quando você pedir.", "Turn it off? Your Claude will only reply when you ask again."))) return;
    await sb.rpc("desligar_despertador", { agente: "Claude" });
    setMsg(null);
    carregar();
  };

  return (
    <section className="sozinho">
      <h3>{t("Responder sozinho", "Reply on its own")} <span className="nota">{t("opcional · Claude Pro, Max, Team ou Enterprise", "optional · Claude Pro, Max, Team or Enterprise")}</span></h3>
      <p className="sub">{t(
        "Quando chamarem o seu Claude numa sala, ele abre sozinho na nuvem, lê a conversa e responde em cerca de 1 minuto, mesmo com o computador desligado. Usa a sua assinatura do Claude; o The Sala não cobra nada.",
        "When someone calls your Claude in a room, it opens on its own in the cloud, reads the conversation and replies in about a minute, even with your computer off. It uses your Claude subscription; The Sala doesn't charge anything.")}</p>

      {lista === null ? null : ligado ? (
        <div className="sozinho-ligado">
          <p><strong className="ok">{t("Ligado", "On")}</strong>{" · "}
            {ligado.ultimo_disparo
              ? <>{t("último chamado", "last call")} {quando(ligado.ultimo_disparo)}{ligado.ultimo_erro ? <> · <span className="atrasada">{ligado.ultimo_erro}</span></> : ` · ${t("ok", "ok")}`}</>
              : t("ainda não foi chamado", "not called yet")}</p>
          <div className="linha">
            <button className="btn btn-pequeno" onClick={testar} disabled={indo}>{t("Testar", "Test")}</button>
            <button className="btn btn-pequeno" onClick={desligar} disabled={indo}>{t("Desligar", "Turn off")}</button>
          </div>
          <p className="nota">{en
            ? <>Write <code>@Claude</code> in a room and the answer arrives in about a minute. If it doesn't, open <a className="link" href="https://claude.ai/code/routines" target="_blank" rel="noopener noreferrer">claude.ai/code/routines</a> → <b>The Sala</b> → latest run to see what happened.</>
            : <>Escreva <code>@Claude</code> numa sala e a resposta chega em cerca de 1 minuto. Se não chegar, abra <a className="link" href="https://claude.ai/code/routines" target="_blank" rel="noopener noreferrer">claude.ai/code/routines</a> → <b>The Sala</b> → última execução para ver o que houve.</>}</p>
          {ligado.ultimo_status === 401 || ligado.ultimo_status === 404 ? (
            <p className="nota">{t("A chave não vale mais (a tarefa foi apagada ou gerou chave nova). Desligue e ligue de novo com a chave atual.", "The key is no longer valid (the task was deleted or a new key was generated). Turn it off and on again with the current key.")}</p>
          ) : null}
        </div>
      ) : (
        <>
          <ol className="passos passos-sozinho">
            <li>{en
              ? <><b>Connect Claude to The Sala first</b> (steps above). The task uses that connector.</>
              : <><b>Conecte o Claude ao The Sala antes</b> (passos acima). A tarefa usa esse conector.</>}</li>
            <li>{en ? <>Open </> : <>Abra </>}<a className="link" href="https://claude.ai/code/routines" target="_blank" rel="noopener noreferrer">claude.ai/code/routines <IconeAbrir tamanho={14} /></a>
              {en ? <> (<b>Scheduled tasks</b>) and click <b>New task</b>.</> : <> (<b>Tarefas agendadas</b>) e clique em <b>Nova tarefa</b>.</>}</li>
            <li>{en
              ? <>In the instructions box, paste this text. Leave <b>Auto</b> and <b>Default model</b> as they are.</>
              : <>Na caixa de instruções, cole este texto. Deixe <b>Auto</b> e <b>Modelo padrão</b> como estão.</>}{" "}
              <Copiar valor={instrucaoTarefa()} rotulo={t("Copiar instruções", "Copy instructions")} /></li>
            <li>{en
              ? <>In <b>Trigger</b>, switch <b>Schedule</b> to <b>API</b>. If a time shows up (like “Daily 09:00”), remove that line: the task should only run when The Sala calls it.</>
              : <>Em <b>Acionamento</b>, troque <b>Agendamento</b> por <b>API</b>. Se aparecer um horário (tipo “Diariamente 09:00”), apague essa linha: a tarefa só deve rodar quando a Sala chamar.</>}</li>
            <li>{en ? <>Open <b>Advanced settings</b>:</> : <>Abra <b>Configurações avançadas</b>:</>}
              <ul>
                <li>{en
                  ? <><b>General</b>: leave <b>Repository</b> and <b>Project</b> as “None”. If <b>API</b> doesn't show up in the trigger list, pick any of your repositories here; Claude won't touch it.</>
                  : <><b>Geral</b>: deixe <b>Repositório</b> e <b>Projeto</b> em “Nenhuma seleção”. Se <b>API</b> não aparecer no Acionamento, escolha qualquer repositório seu aqui; o Claude não mexe nele.</>}</li>
                <li>{en ? <><b>Connectors</b>: keep only <b>The Sala</b>.</> : <><b>Conectores</b>: deixe só o <b>The Sala</b>.</>}</li>
                <li>{en ? <><b>Notifications</b>: turn off if you don't want an alert after every reply.</> : <><b>Notificações</b>: desligue se não quiser um aviso a cada resposta.</>}</li>
              </ul></li>
            <li>{en
              ? <>Click <b>Create</b>. A window shows the <b>URL</b> (ends in <code>/fire</code>) and the <b>token</b> (starts with <code>sk-ant-oat01-</code>). Copy both before closing: the token is shown only once. Lost it? Open the task, <b>Edit</b>, and click <b>Generate token</b> on the API trigger.</>
              : <>Clique em <b>Criar</b>. Abre uma janela com a <b>URL</b> (termina em <code>/fire</code>) e o <b>token</b> (começa com <code>sk-ant-oat01-</code>). Copie os dois antes de fechar: o token só aparece uma vez. Perdeu? Abra a tarefa, clique em <b>Editar</b> e em <b>Gerar token</b> no acionamento API.</>}</li>
            <li>{en ? <>Paste both below and click <b>Turn on and test</b>.</> : <>Cole os dois aqui embaixo e clique em <b>Ligar e testar</b>.</>}</li>
          </ol>
          <form className="sozinho-form" onSubmit={ligar}>
            <label htmlFor="sozinho-url">{t("URL do gatilho", "Trigger URL")}</label>
            <input id="sozinho-url" required value={url} onChange={(e) => setUrl(e.target.value)} autoComplete="off" spellCheck={false}
              placeholder="https://api.anthropic.com/v1/claude_code/routines/trig_…/fire" />
            <label htmlFor="sozinho-token">{t("Token", "Token")}</label>
            <input id="sozinho-token" required type="password" value={token} onChange={(e) => setToken(e.target.value)} autoComplete="off" spellCheck={false}
              placeholder="sk-ant-oat01-…" />
            <p className="nota">{t("O token só serve para disparar essa tarefa: não lê nada da sua conta. Fica guardado criptografado e você desliga quando quiser.",
              "The token can only trigger that task: it can't read anything in your account. It's stored encrypted and you can turn it off any time.")}</p>
            <button className="btn btn-cheio" disabled={indo}>{indo ? t("Ligando…", "Turning on…") : t("Ligar e testar", "Turn on and test")}</button>
          </form>
        </>
      )}
      {msg && (
        <p className={msg.ok ? "nota ok" : "nota atrasada"} role="status">
          {msg.texto}{msg.link ? <> <a className="link" href={msg.link} target="_blank" rel="noopener noreferrer">{t("Ver a sessão", "See the session")}</a></> : null}
        </p>
      )}
    </section>
  );
}

// ---------------------------------------------------------------- ChatGPT (e outros que assinam eventos MCP)

type Ev = { id: string; agente: string; evento: string; expira: string | null; criado_em: string; ultimo_envio: string | null; ultimo_status: number | null; ultimo_erro: string | null };

export const pedidoEventos = () => t(
  `Assine o evento "sala.chamado" do conector The Sala, para todas as minhas salas. Sempre que ele chegar:
1. Use ler_mensagens na sala indicada no evento e leia a conversa, o contexto e as decisões.
2. Responda à mensagem indicada com enviar_mensagem, passando responde_a com o número dela. Se pedirem, crie ou conclua tarefas, envie arquivos ou faça uma proposta.
3. Se for uma decisão sobre uma proposta sua, siga o que foi decidido e conte na sala o que fez.
4. Se algo precisar do sim de uma pessoa, use fazer_proposta. Nunca decida por ela.
Não faça nada fora do The Sala.`,
  `Subscribe to the "sala.chamado" event from the The Sala connector, for all my rooms. Whenever it arrives:
1. Use ler_mensagens on the room named in the event and read the conversation, the context and the decisions.
2. Reply to the named message with enviar_mensagem, passing responde_a with its number. If asked, create or complete tasks, send files or make a proposal.
3. If it's a decision on one of your proposals, follow what was decided and tell the room what you did.
4. If something needs a person's yes, use fazer_proposta. Never decide for them.
Don't do anything outside The Sala.`,
);

export function SozinhoEventos({ agente }: { agente: string }) {
  const [lista, setLista] = useState<Ev[] | null>(null);
  const en = idioma() === "en";
  const carregar = async () => {
    const { data } = await sb.rpc("meus_eventos");
    setLista(((data as Ev[]) ?? []).filter((e) => e.agente === agente && (!e.expira || new Date(e.expira).getTime() > Date.now())));
  };
  useEffect(() => {
    carregar();
    const i = setInterval(carregar, 10_000); // a inscrição chega enquanto a pessoa faz o passo a passo no ChatGPT
    return () => clearInterval(i);
  }, []);
  const ativo = lista?.[0];

  const desligar = async () => {
    if (!confirm(t(`Desligar? O ${agente} para de ser acordado pela Sala. Apague também a tarefa no ${agente}.`, `Turn it off? ${agente} stops being woken by The Sala. Also delete the task in ${agente}.`))) return;
    await sb.rpc("desligar_eventos", { agente });
    carregar();
  };

  return (
    <section className="sozinho">
      <h3>{t("Responder sozinho", "Reply on its own")} <span className="nota">{t("opcional · ChatGPT Plus, Pro, Business, Enterprise ou Edu", "optional · ChatGPT Plus, Pro, Business, Enterprise or Edu")}</span></h3>
      <p className="sub">{t(
        `Quando chamarem o seu ${agente} numa sala, ele recebe um aviso, lê a conversa e responde sozinho. Usa a sua assinatura; o The Sala não cobra nada.`,
        `When someone calls your ${agente} in a room, it gets a notice, reads the conversation and replies on its own. It uses your subscription; The Sala doesn't charge anything.`)}</p>
      {lista === null ? null : ativo ? (
        <div className="sozinho-ligado">
          <p><strong className="ok">{t("Ligado", "On")}</strong>{" · "}
            {ativo.ultimo_envio
              ? <>{t("último chamado", "last call")} {quando(ativo.ultimo_envio)}{ativo.ultimo_erro ? <> · <span className="atrasada">{ativo.ultimo_erro}</span></> : " · ok"}</>
              : t("ainda não foi chamado", "not called yet")}</p>
          <p className="nota">{en
            ? <>Write <code>@{agente}</code> in a room and it should reply in a minute or two. The {agente} task renews this on its own.</>
            : <>Escreva <code>@{agente}</code> numa sala e ele deve responder em 1 ou 2 minutos. A tarefa do {agente} renova isso sozinha.</>}</p>
          <div className="linha"><button className="btn btn-pequeno" onClick={desligar}>{t("Desligar", "Turn off")}</button></div>
        </div>
      ) : (
        <>
          <ol className="passos passos-sozinho">
            <li>{en ? <><b>Connect {agente} to The Sala first</b> (steps above).</> : <><b>Conecte o {agente} ao The Sala antes</b> (passos acima).</>}</li>
            <li>{en
              ? <>In ChatGPT on the web, start a chat in <b>Work</b> mode (in the desktop app: <b>Work</b> and <b>Cloud</b>) and turn on the <b>The Sala</b> connector.</>
              : <>No ChatGPT, pelo site, abra uma conversa no modo <b>Work</b> (no app de computador: <b>Work</b> e <b>Cloud</b>) e ligue o conector <b>The Sala</b>.</>}</li>
            <li>{en ? <>Send this message:</> : <>Mande esta mensagem:</>}{" "}
              <Copiar valor={pedidoEventos()} rotulo={t("Copiar mensagem", "Copy message")} /></li>
            <li>{en
              ? <>If ChatGPT asks to confirm creating the task, confirm. When it's set up, this box shows <b>On</b> (it checks every 10 seconds).</>
              : <>Se o ChatGPT pedir para confirmar a criação da tarefa, confirme. Quando estiver pronto, este quadro mostra <b>Ligado</b> (ele confere a cada 10 segundos).</>}</li>
          </ol>
          <p className="nota">{t(
            "Este recurso do ChatGPT é novo. Se ele disser que o conector não oferece eventos, é porque ainda não aceita conectores personalizados: use o botão “Pedir ao ChatGPT” na sala.",
            "This ChatGPT feature is new. If it says the connector doesn't offer events, it doesn't accept custom connectors yet: use the “Ask ChatGPT” button in the room.")}</p>
        </>
      )}
    </section>
  );
}
