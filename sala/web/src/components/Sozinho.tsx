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
          {ligado.ultimo_status === 401 || ligado.ultimo_status === 404 ? (
            <p className="nota">{t("A chave não vale mais (a tarefa foi apagada ou gerou chave nova). Desligue e ligue de novo com a chave atual.", "The key is no longer valid (the task was deleted or a new key was generated). Turn it off and on again with the current key.")}</p>
          ) : null}
        </div>
      ) : (
        <>
          <ol className="passos">
            <li>{en ? <>First connect Claude to The Sala (steps above).</> : <>Primeiro conecte o Claude ao The Sala (passos acima).</>}</li>
            <li>{en ? <>Open </> : <>Abra </>}<a className="link" href="https://claude.ai/code/routines" target="_blank" rel="noopener noreferrer">claude.ai/code/routines <IconeAbrir tamanho={14} /></a>
              {en ? <> and create a <b>new task</b> named <b>The Sala</b>.</> : <> e crie uma <b>nova tarefa</b> com o nome <b>The Sala</b>.</>}</li>
            <li>{en ? <>In <b>Instructions</b>, paste this text:</> : <>Em <b>Instruções</b>, cole este texto:</>}{" "}
              <Copiar valor={instrucaoTarefa()} rotulo={t("Copiar instruções", "Copy instructions")} /></li>
            <li>{en ? <>In <b>Connectors</b>, keep <b>The Sala</b> and remove the others. You don't need a repository.</> : <>Em <b>Conectores</b>, deixe o <b>The Sala</b> e tire os outros. Não precisa de repositório.</>}</li>
            <li>{en ? <>In <b>Select a trigger</b>, choose <b>API</b> and click <b>Create</b>. Copy the <b>URL</b> and the <b>token</b> it shows (the token appears only once).</> : <>Em <b>Gatilho</b>, escolha <b>API</b> e clique em <b>Criar</b>. Copie a <b>URL</b> e o <b>token</b> que aparecem (o token só aparece uma vez).</>}</li>
            <li>{en ? <>Paste both here:</> : <>Cole os dois aqui:</>}</li>
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
