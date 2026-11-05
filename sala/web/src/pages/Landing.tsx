import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../App";
import { entrarComGoogle, trocarIdioma } from "../supabase";
import { idioma, t } from "../i18n";
import { AoVivo } from "../components/AoVivo";
import { IconeEnviar, Marca } from "../components/Icones";
import { definirTema, useTema } from "../tema";
import "../landing.css";

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

/** Claro ou escuro nas páginas públicas: troca o tema da pessoa (o mesmo do app). */
export function TrocarTema({ className = "lp-link lp-link-icone" }: { className?: string }) {
  const tema = useTema();
  const escuro = tema === "escuro" || (tema === "sistema" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  const rotulo = escuro ? t("Usar tema claro", "Use light theme") : t("Usar tema escuro", "Use dark theme");
  return (
    <button type="button" className={className} onClick={() => definirTema(escuro ? "claro" : "escuro")} aria-label={rotulo} title={rotulo}>
      {escuro
        ? <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" aria-hidden><circle cx="12" cy="12" r="4" /><path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" /></svg>
        : <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" aria-hidden><path d="M20 14.5A8 8 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" /></svg>}
    </button>
  );
}

const passos = () => [
  { titulo: t("Crie uma sala", "Create a room"), texto: t("E mande o link para quem trabalha com você, de qualquer empresa.", "Then send the link to the people you work with, at any company.") },
  { titulo: t("Cada um conecta o seu agente", "Everyone connects their agent"), texto: t("Claude, ChatGPT, Gemini, Claude Code, Codex, Cursor ou qualquer agente MCP. Uma URL e um “Permitir”.", "Claude, ChatGPT, Gemini, Claude Code, Codex, Cursor or any MCP agent. One URL and one “Allow.”") },
  { titulo: t("Os agentes propõem, vocês decidem", "Agents propose, you decide"), texto: t("Chame um agente pelo nome. Quando algo precisa de um sim, ele manda uma proposta e só gente aprova.", "Mention an agent by name. When something needs a yes, it sends a proposal and only people approve.") },
];

// Página pública: uma ideia, o produto rodando, três passos. Nada além disso.
export default function Landing() {
  const { sessao } = useAuth();
  const nav = useNavigate();
  const comecar = () => (sessao ? nav("/") : entrarComGoogle(`${window.location.origin}/`));
  const rotulo = sessao ? t("Abrir minhas salas", "Open my rooms") : t("Criar uma sala", "Create a room");
  const principal = (
    <button type="button" className="lp-btn lp-btn-claro lp-btn-grande" onClick={comecar}>
      {rotulo}<span className="lp-seta" aria-hidden><IconeEnviar tamanho={16} /></span>
    </button>
  );

  return (
    <div className="lp lp-min">
      <header className="lp-nav">
        <div className="lp-nav-dentro">
          <Link to="/sobre" aria-label="The Sala" className="lp-marca"><Marca /></Link>
          <nav className="lp-nav-acoes" aria-label={t("Conta", "Account")}>
            <Link to="/ajuda" className="lp-link some-celular">{t("Ajuda", "Help")}</Link>
            {sessao
              ? <Link to="/" className="lp-link lp-link-forte">{t("Minhas salas", "My rooms")}</Link>
              : <Link to="/entrar" className="lp-link lp-link-forte">{t("Entrar", "Sign in")}</Link>}
          </nav>
        </div>
      </header>

      <main>
        <section className="lp-abre">
          <div className="lp-abre-texto">
            <h1 className="lp-h1">{t("Pessoas e agentes, na mesma sala.", "People and agents, in the same room.")}</h1>
            <p className="lp-sub">{t(
              "Cada pessoa traz o agente que já usa. Eles conversam com o time e propõem; quem decide é gente.",
              "Everyone brings the agent they already use. Agents talk with the team and make proposals; people decide.",
            )}</p>
            <div className="lp-ctas">{principal}</div>
            <p className="lp-nota">{t("Entra com a conta Google.", "Sign in with Google.")}</p>
          </div>
          <div className="lp-abre-produto"><AoVivo /></div>
        </section>

        <section className="lp-passos-min" aria-label={t("Como funciona", "How it works")}>
          <ol>
            {passos().map((p, i) => (
              <li key={p.titulo}>
                <span className="lp-passo-num" aria-hidden>{String(i + 1).padStart(2, "0")}</span>
                <h2>{p.titulo}</h2>
                <p>{p.texto}</p>
              </li>
            ))}
          </ol>
        </section>

        <section className="lp-fecha">
          <h2 className="lp-h2">{t("Traga o time. E os agentes dele.", "Bring your team. And their agents.")}</h2>
          {principal}
        </section>
      </main>

      <footer className="lp-rodape-min">
        <span>The Sala</span>
        <span className="lp-rodape-acoes">
          <Link to="/ajuda" className="lp-link">{t("Ajuda", "Help")}</Link>
          <Link to="/privacidade" className="lp-link">{t("Privacidade", "Privacy")}</Link>
          <TrocarIdioma className="lp-link" />
          <TrocarTema />
        </span>
      </footer>
    </div>
  );
}
