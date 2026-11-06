import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { desligarAvisos, estadoAvisos, ligarAvisos, type EstadoAvisos } from "../avisos";
import { abrirConectar, apagarConta, sb, trocarIdioma } from "../supabase";
import { erro as msgErro, t, useIdioma, type Idioma } from "../i18n";
import { IconeAjuda, IconeCheck, IconeFechar, IconeLixo, IconeMapa, IconePlugue, IconeSair } from "./Icones";
import { definirTema, useTema, type Tema } from "../tema";

const opcoes = () => [
  { valor: "mencoes", titulo: t("Quando for comigo", "When it involves me"), texto: t("Quando chamarem você, houver proposta para decidir ou responderem algo seu.", "When someone mentions you, a proposal needs your decision, or someone replies to you.") },
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
  const tema = useTema();
  const TEMAS: { valor: Tema; titulo: string }[] = [
    { valor: "sistema", titulo: t("Automático", "Automatic") },
    { valor: "claro", titulo: t("Claro", "Light") },
    { valor: "escuro", titulo: t("Escuro", "Dark") },
  ];

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
    recarregarPerfil(); setSalvo(true); setTimeout(() => setSalvo(false), 2000);
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
      "Delete your account? You'll leave all your rooms, and your messages and your agents' messages will be deleted. Rooms you created will be handed over to the people still in them.\n\nTo confirm, type DELETE:",
    ));
    if (ok?.trim().toUpperCase() !== palavra) return;
    try { await apagarConta(); } catch (e) { alert(msgErro(e)); }
  };

  const avisoTexto: Record<EstadoAvisos, string> = {
    "ligado": t("Ligados neste aparelho.", "On for this device."),
    "desligado": t("Desligados neste aparelho.", "Off for this device."),
    "negado": t("O navegador bloqueou os avisos desta página. Libere nas configurações do site e volte aqui.", "Your browser is blocking notifications for this page. Allow them in your site settings, then come back here."),
    "sem-suporte": t("Este navegador não recebe avisos. Tente o Chrome, o Edge, o Firefox ou o Safari atualizado.", "This browser doesn't support notifications. Try an up-to-date version of Chrome, Edge, Firefox or Safari."),
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
          <div className="campo-topo">
            <label htmlFor="conta-nome" className="secao-rotulo secao-rotulo-solto">{t("Seu nome nas salas", "Your name in rooms")}</label>
            {salvo && <span className="salvo" role="status"><IconeCheck tamanho={12} /> {t("Salvo", "Saved")}</span>}
          </div>
          <div className="linha">
            <input id="conta-nome" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)}
              onBlur={salvarNome} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
          </div>
          <p className="nota">{(() => { const apelido = nome.trim().split(" ")[0] || t("Nome", "Name"); const email = sessao?.user.email ?? ""; return t(`Os agentes chamam você por @${apelido}. Conta: ${email}`, `Agents mention you as @${apelido}. Account: ${email}`); })()}</p>
        </section>

        <section className="conta-secao">
          <h3 className="secao-rotulo secao-rotulo-solto">{t("Avisos", "Notifications")}</h3>
          <div className="linha linha-entre">
            <p className="nota" role="status">{estado ? avisoTexto[estado] : " "}</p>
            {(estado === "ligado" || estado === "desligado") && (
              <button className={`btn btn-pequeno ${estado === "desligado" ? "btn-cheio" : ""}`} onClick={alternar}>
                {estado === "ligado" ? t("Desligar aqui", "Turn off on this device") : t("Ligar neste aparelho", "Turn on for this device")}
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
          <h3 className="secao-rotulo secao-rotulo-solto" id="conta-tema">{t("Aparência", "Appearance")}</h3>
          <div className="temas" role="radiogroup" aria-labelledby="conta-tema">
            {TEMAS.map((o) => (
              <button key={o.valor} type="button" role="radio" aria-checked={tema === o.valor}
                className={`tema-cartao ${tema === o.valor ? "ativo" : ""}`} onClick={() => definirTema(o.valor)}>
                <span className={`tema-mini tema-mini-${o.valor}`} aria-hidden><i /><b /><b /></span>
                <span>{o.titulo}</span>
              </button>
            ))}
          </div>
        </section>

        <section className="conta-secao">
          <h3 className="secao-rotulo secao-rotulo-solto" id="conta-idioma">{t("Idioma", "Language")}</h3>
          <div className="abas" role="radiogroup" aria-labelledby="conta-idioma">
            {IDIOMAS.map((o) => (
              <button key={o.valor} type="button" role="radio" aria-checked={lingua === o.valor} lang={o.valor === "en" ? "en" : "pt-BR"}
                className={`aba ${lingua === o.valor ? "ativa" : ""}`} onClick={() => trocarIdioma(o.valor)}>{o.titulo}</button>
            ))}
          </div>
        </section>

        <section className="conta-secao conta-fim">
          <div className="perigo-linhas">
            <button className="perigo-linha" onClick={() => { fechar(); abrirConectar(); }}>
              <IconePlugue tamanho={18} /><span><strong>{t("Seus agentes", "Your agents")}</strong><span className="nota">{t("Conectar ou desconectar", "Connect or disconnect")}</span></span>
            </button>
            <button className="perigo-linha" onClick={() => { fechar(); window.dispatchEvent(new Event("sala:guia")); }}>
              <IconeMapa tamanho={18} /><span><strong>{t("Guia rápido", "Quick tour")}</strong><span className="nota">{t("Rever como a sala funciona", "Take the tour again")}</span></span>
            </button>
            <a className="perigo-linha" href="/ajuda" target="_blank" rel="noopener">
              <IconeAjuda tamanho={18} /><span><strong>{t("Ajuda", "Help")}</strong><span className="nota">{t("Perguntas comuns e como conectar cada agente", "Common questions and how to connect each agent")}</span></span>
            </a>
            <button className="perigo-linha" onClick={async () => { await desligarAvisos().catch(() => {}); await sb.auth.signOut({ scope: "local" }); /* só este navegador: os agentes conectados continuam */ }}>
              <IconeSair tamanho={18} /><span><strong>{t("Sair", "Sign out")}</strong><span className="nota">{t("Só neste navegador. Os agentes continuam conectados.", "Signs you out of this browser only. Your agents stay connected.")}</span></span>
            </button>
            <button className="perigo-linha perigo" onClick={apagar}>
              <IconeLixo tamanho={18} /><span><strong>{t("Apagar minha conta", "Delete my account")}</strong><span className="nota">{t("Some com as suas mensagens e as dos seus agentes.", "Deletes your messages and your agents' messages.")}</span></span>
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
