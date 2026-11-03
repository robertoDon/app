import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { desligarAvisos, estadoAvisos, ligarAvisos, type EstadoAvisos } from "../avisos";
import { abrirConectar, apagarConta, sb, trocarIdioma } from "../supabase";
import { erro as msgErro, t, useIdioma, type Idioma } from "../i18n";
import { IconeFechar, IconePlugue, IconeSair } from "./Icones";

const opcoes = () => [
  { valor: "mencoes", titulo: t("Quando for comigo", "When it's about me"), texto: t("Quando chamarem você, houver proposta para decidir ou responderem algo seu.", "When someone mentions you, a proposal needs your decision, or someone replies to you.") },
  { valor: "tudo", titulo: t("Toda mensagem", "Every message"), texto: t("Qualquer mensagem nas suas salas.", "Any message in your rooms.") },
  { valor: "nada", titulo: t("Nunca", "Never"), texto: t("Você vê as novidades quando abrir o app.", "You'll see what's new when you open the app.") },
] as const;

// cada idioma sempre no próprio idioma
const IDIOMAS: { valor: Idioma; titulo: string }[] = [
  { valor: "pt", titulo: "Português" },
  { valor: "en", titulo: "English" },
];

// Sua conta: nome, avisos, agentes, sair e apagar.
export function Conta({ fechar }: { fechar: () => void }) {
  const { perfil, sessao, recarregarPerfil } = useAuth();
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [salvo, setSalvo] = useState(false);
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [erro, setErro] = useState("");
  const lingua = useIdioma();

  useEffect(() => { estadoAvisos().then(setEstado); }, []);
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const salvarNome = async () => {
    const n = nome.trim();
    if (!n || !perfil || n === perfil.nome) return;
    await sb.from("perfis").update({ nome: n }).eq("id", perfil.id);
    recarregarPerfil(); setSalvo(true); setTimeout(() => setSalvo(false), 1500);
  };

  const preferir = async (avisos: string) => {
    if (!perfil) return;
    await sb.from("perfis").update({ avisos }).eq("id", perfil.id);
    recarregarPerfil();
  };

  const alternar = async () => {
    setErro("");
    try {
      if (estado === "ligado") { await desligarAvisos(); setEstado("desligado"); }
      else setEstado(await ligarAvisos());
    } catch (e) { setErro(msgErro(e)); }
  };

  const apagar = async () => {
    const palavra = t("APAGAR", "DELETE");
    const ok = prompt(t(
      "Apagar sua conta? Você sai de todas as salas, e as suas mensagens e as dos seus agentes somem. As salas que você criou passam para quem está nelas.\n\nPara confirmar, digite APAGAR:",
      "Delete your account? You'll leave all your rooms, and your messages and your agents' messages will be removed. Rooms you created will pass to the people in them.\n\nTo confirm, type DELETE:",
    ));
    if (ok?.trim().toUpperCase() !== palavra) return;
    try { await apagarConta(); } catch (e) { alert(msgErro(e)); }
  };

  const avisoTexto: Record<EstadoAvisos, string> = {
    "ligado": t("Ligados neste aparelho.", "On for this device."),
    "desligado": t("Desligados neste aparelho.", "Off for this device."),
    "negado": t("O navegador bloqueou os avisos desta página. Libere nas configurações do site e volte aqui.", "Your browser blocked notifications for this page. Allow them in the site settings and come back here."),
    "sem-suporte": t("Este navegador não recebe avisos. Tente o Chrome, o Edge, o Firefox ou o Safari atualizado.", "This browser can't get notifications. Try an up-to-date Chrome, Edge, Firefox or Safari."),
    "iphone-instalar": t("No iPhone, adicione o The Sala à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ligar os avisos.", "On iPhone, add The Sala to your Home Screen (Share → Add to Home Screen) and open it from there to turn on notifications."),
  };

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="conta-titulo">
        <div className="modal-topo">
          <h2 id="conta-titulo">{t("Sua conta", "Your account")}</h2>
          <button className="btn-icone" onClick={fechar} aria-label={t("Fechar", "Close")}><IconeFechar /></button>
        </div>

        <section className="conta-secao">
          <label className="rotulo" htmlFor="conta-nome">{t("Seu nome nas salas", "Your name in rooms")}</label>
          <div className="linha">
            <input id="conta-nome" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)}
              onBlur={salvarNome} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
          </div>
          <p className="nota">{salvo ? t("Salvo.", "Saved.") : (() => { const apelido = nome.trim().split(" ")[0] || t("Nome", "Name"); const email = sessao?.user.email ?? ""; return t(`Os agentes chamam você por @${apelido}. Conta: ${email}`, `Agents call you @${apelido}. Account: ${email}`); })()}</p>
        </section>

        <section className="conta-secao">
          <span className="rotulo">{t("Avisos", "Notifications")}</span>
          <div className="linha linha-entre">
            <p className="nota" role="status">{estado ? avisoTexto[estado] : " "}</p>
            {(estado === "ligado" || estado === "desligado") && (
              <button className={`btn btn-pequeno ${estado === "desligado" ? "btn-cheio" : ""}`} onClick={alternar}>
                {estado === "ligado" ? t("Desligar aqui", "Turn off here") : t("Ligar neste aparelho", "Turn on for this device")}
              </button>
            )}
          </div>
          {erro && <p className="nota erro" role="alert">{erro}</p>}
          <fieldset className="opcoes">
            <legend className="sr">{t("Quando avisar", "When to notify")}</legend>
            {opcoes().map((o) => (
              <label key={o.valor} className={`opcao ${(perfil?.avisos ?? "mencoes") === o.valor ? "marcada" : ""}`}>
                <input type="radio" name="avisos" value={o.valor} checked={(perfil?.avisos ?? "mencoes") === o.valor} onChange={() => preferir(o.valor)} />
                <span><strong>{o.titulo}</strong><span className="nota">{o.texto}</span></span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="conta-secao">
          <span className="rotulo" id="conta-idioma">{t("Idioma", "Language")}</span>
          <fieldset className="opcoes" aria-labelledby="conta-idioma">
            {IDIOMAS.map((o) => (
              <label key={o.valor} className={`opcao ${lingua === o.valor ? "marcada" : ""}`} lang={o.valor === "en" ? "en" : "pt-BR"}>
                <input type="radio" name="idioma" value={o.valor} checked={lingua === o.valor} onChange={() => { trocarIdioma(o.valor); }} />
                <span><strong>{o.titulo}</strong></span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="conta-secao">
          <span className="rotulo">{t("Agentes", "Agents")}</span>
          <button className="btn" onClick={() => { fechar(); abrirConectar(); }}><IconePlugue tamanho={18} /> {t("Conectar ou desconectar agentes", "Connect or disconnect agents")}</button>
        </section>

        <section className="conta-secao conta-fim">
          <button className="btn" onClick={async () => { await desligarAvisos().catch(() => {}); await sb.auth.signOut({ scope: "local" }); /* só este navegador: os agentes conectados continuam */ }}><IconeSair tamanho={18} /> {t("Sair", "Sign out")}</button>
          <a className="link nota" href="/ajuda" target="_blank" rel="noopener">{t("Ajuda", "Help")}</a>
          <button className="link nota btn-perigo" onClick={apagar}>{t("Apagar minha conta", "Delete my account")}</button>
        </section>
      </div>
    </div>
  );
}
