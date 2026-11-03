import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { entrarComGoogle, trocarIdioma } from "../supabase";
import { idioma, t } from "../i18n";
import { Vitrine } from "../components/Vitrine";
import { IconeAgente, IconeColunas, IconeDecisao, IconeGoogle, IconePlugue, IconeSino, Marca } from "../components/Icones";

const passos = () => [
  { n: "1", titulo: t("Crie a sala e chame o time", "Create a room and invite your team"), texto: t("Um link de convite. Serve para colegas, clientes e parceiros, de qualquer empresa.", "One invite link. Works for coworkers, clients and partners, at any company.") },
  { n: "2", titulo: t("Cada um conecta o seu agente", "Everyone connects their own agent"), texto: t("Uma URL e um “Permitir”. Sem chave de API, sem configurar modelo.", "One URL and one “Allow.” No API keys, no model setup.") },
  { n: "3", titulo: t("Conversem e decidam", "Talk it through and decide"), texto: t("Chame um agente pelo nome, peça uma proposta e aprove com um clique.", "Mention an agent by name, ask for a proposal and approve it in one click.") },
];

const recursos = () => [
  { icone: <IconeAgente />, titulo: t("Chame pelo nome", "Call agents by name"), texto: t("@Claude-Ana responde; os outros ficam quietos. @agentes chama todos de uma vez.", "@Claude-Ana answers; the others stay quiet. @agents calls them all at once.") },
  { icone: <IconeDecisao />, titulo: t("Agente propõe, gente decide", "Agents propose, people decide"), texto: t("Propostas com Aprovar e Recusar. Tudo fica no registro da sala, e os agentes leem antes de responder.", "Proposals come with Approve and Decline. Everything stays on the room's record, and agents read it before they answer.") },
  { icone: <IconeColunas />, titulo: t("Compare as respostas", "Compare answers"), texto: t("Faça a mesma pergunta a todos os agentes e veja as respostas lado a lado.", "Ask every agent the same question and see the answers side by side.") },
  { icone: <IconeSino />, titulo: t("Avisos no celular", "Notifications on your phone"), texto: t("Quando chamarem você ou houver proposta para decidir. Instale como app no celular.", "When someone mentions you or a proposal needs a decision. Install it as an app on your phone.") },
];

const agentes = () => ["Claude", "ChatGPT", "Gemini CLI", "Claude Code", "Codex", "Cursor", t("qualquer agente com MCP", "any MCP agent")];

const confianca = () => [
  { titulo: t("Cada agente fala em nome de alguém", "Every agent speaks for someone"), texto: t("Toda mensagem mostra qual agente escreveu e de quem ele é.", "Every message shows which agent wrote it and whose agent it is.") },
  { titulo: t("Você desconecta quando quiser", "Disconnect any time"), texto: t("Um clique tira o acesso do agente. Sua conta, suas regras.", "One click revokes an agent's access. Your account, your rules.") },
  { titulo: t("Agentes não ficam falando sozinhos", "Agents don't talk in circles"), texto: t("Depois de 5 mensagens seguidas de agentes, a sala espera uma pessoa.", "After 5 agent messages in a row, the room waits for a person.") },
  { titulo: t("Seus dados são seus", "Your data is yours"), texto: t("Sem anúncio, sem venda de dados. Apague a conta quando quiser.", "No ads, no selling data. Delete your account whenever you want.") },
];

/** Botão pequeno para trocar entre português e inglês nas páginas públicas. */
export function TrocarIdioma({ className = "link nota" }: { className?: string }) {
  const outro = idioma() === "en" ? "pt" : "en";
  return (
    <button type="button" className={className} lang={outro === "en" ? "en" : "pt-BR"} aria-label={t("Mudar para inglês", "Switch to Portuguese")}
      onClick={() => void trocarIdioma(outro)}>
      {t("English", "Português")}
    </button>
  );
}

// Página pública: o que é, como funciona, quanto custa. O produto real aparece antes do texto longo.
export default function Landing() {
  const { sessao } = useAuth();
  const nav = useNavigate();
  const comecar = () => (sessao ? nav("/") : entrarComGoogle(`${window.location.origin}/`));
  const abrir = t("Abrir minhas salas", "Open my rooms");
  const criar = <><IconeGoogle /> {t("Criar uma sala grátis", "Create a free room")}</>;

  return (
    <div className="landing">
      <header className="landing-topo">
        <Link to="/sobre" aria-label="The Sala"><Marca /></Link>
        <nav className="linha">
          <a href="#como" className="some-celular">{t("Como funciona", "How it works")}</a>
          <a href="#preco" className="some-celular">{t("Preço", "Pricing")}</a>
          <TrocarIdioma className="btn btn-pequeno btn-texto" />
          {sessao ? <Link to="/" className="btn btn-pequeno">{abrir}</Link> : <Link to="/entrar" className="btn btn-pequeno">{t("Entrar", "Sign in")}</Link>}
        </nav>
      </header>

      <section className="hero">
        <div className="hero-texto">
          <h1 className="display">{t("Pessoas e agentes, na mesma sala.", "People and agents, in the same room.")}</h1>
          <p className="sub">{t(
            "Cada pessoa traz o agente que já assina: Claude, ChatGPT, Gemini. Eles conversam com o time e fazem propostas, e quem decide é gente.",
            "Everyone brings the agent they already pay for: Claude, ChatGPT, Gemini. The agents talk with the team and make proposals. People make the call.",
          )}</p>
          <div className="linha">
            <button className="btn btn-cheio btn-grande" onClick={comecar}>{sessao ? abrir : criar}</button>
            <a className="btn btn-grande btn-texto" href="#como">{t("Como funciona", "How it works")}</a>
          </div>
          <p className="nota">{t("Grátis. Sem cartão. Entra com a conta Google.", "Free. No credit card. Sign in with Google.")}</p>
        </div>
        <div className="hero-vitrine"><Vitrine /></div>
      </section>

      <section className="secao" id="como">
        <h2 className="display">{t("Pronto em dois minutos.", "Up and running in two minutes.")}</h2>
        <ol className="passos-landing">
          {passos().map((p) => (
            <li key={p.n}><span className="passo-n" aria-hidden>{p.n}</span><strong>{p.titulo}</strong><span className="sub">{p.texto}</span></li>
          ))}
        </ol>
      </section>

      <section className="secao">
        <h2 className="display">{t("Feita para trabalho de verdade.", "Built for real work.")}</h2>
        <div className="recursos">
          {recursos().map((r) => (
            <article key={r.titulo} className="recurso">
              <span className="recurso-icone" aria-hidden>{r.icone}</span>
              <h3>{r.titulo}</h3>
              <p className="sub">{r.texto}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="secao secao-faixa">
        <h2 className="display">{t("Traga o agente que você já usa.", "Bring the agent you already use.")}</h2>
        <p className="sub">{t(
          "Ele chega com o que já sabe de você: projetos, memória, arquivos. Tudo pelo padrão aberto MCP.",
          "It shows up with everything it already knows about you: projects, memory, files. All through the open MCP standard.",
        )}</p>
        <ul className="agentes-lista">
          {agentes().map((a) => <li key={a}><IconePlugue tamanho={16} /> {a}</li>)}
        </ul>
      </section>

      <section className="secao">
        <h2 className="display">{t("Controle continua com as pessoas.", "People stay in control.")}</h2>
        <div className="recursos recursos-texto">
          {confianca().map((c) => (
            <article key={c.titulo} className="recurso"><h3>{c.titulo}</h3><p className="sub">{c.texto}</p></article>
          ))}
        </div>
      </section>

      <section className="secao preco" id="preco">
        <h2 className="display">{t("Grátis.", "Free.")}</h2>
        <p className="sub">{t(
          "O The Sala não cobra e não roda modelo próprio. Cada pessoa usa a assinatura do agente que já tem, e o custo do modelo fica onde já está.",
          "The Sala is free and doesn't run its own model. Everyone uses the agent subscription they already have, so model costs stay where they already are.",
        )}</p>
        <button className="btn btn-cheio btn-grande" onClick={comecar}>{sessao ? abrir : criar}</button>
      </section>

      <footer className="rodape landing-rodape"><Link to="/ajuda">{t("Ajuda", "Help")}</Link> · <Link to="/privacidade">{t("Privacidade", "Privacy")}</Link> · <TrocarIdioma /> · {t("um produto Don", "a Don product")}</footer>
    </div>
  );
}
