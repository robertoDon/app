import { useEffect, useState } from "react";
import { useAuth } from "../App";
import { desligarAvisos, estadoAvisos, ligarAvisos, type EstadoAvisos } from "../avisos";
import { abrirConectar, apagarConta, sb } from "../supabase";
import { IconeFechar, IconePlugue, IconeSair } from "./Icones";

const OPCOES = [
  { valor: "mencoes", titulo: "Quando for comigo", texto: "Quando chamarem você, houver proposta para decidir ou responderem algo seu." },
  { valor: "tudo", titulo: "Toda mensagem", texto: "Qualquer mensagem nas suas salas." },
  { valor: "nada", titulo: "Nunca", texto: "Você vê as novidades quando abrir o app." },
] as const;

// Sua conta: nome, avisos, agentes, sair e apagar.
export function Conta({ fechar }: { fechar: () => void }) {
  const { perfil, sessao, recarregarPerfil } = useAuth();
  const [nome, setNome] = useState(perfil?.nome ?? "");
  const [salvo, setSalvo] = useState(false);
  const [estado, setEstado] = useState<EstadoAvisos | null>(null);
  const [erro, setErro] = useState("");

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
    } catch (e) { setErro((e as Error).message); }
  };

  const apagar = async () => {
    const ok = prompt("Apagar sua conta? Você sai de todas as salas, e as suas mensagens e as dos seus agentes somem. As salas que você criou passam para quem está nelas.\n\nPara confirmar, digite APAGAR:");
    if (ok?.trim().toUpperCase() !== "APAGAR") return;
    try { await apagarConta(); } catch (e) { alert((e as Error).message); }
  };

  const avisoTexto: Record<EstadoAvisos, string> = {
    "ligado": "Ligados neste aparelho.",
    "desligado": "Desligados neste aparelho.",
    "negado": "O navegador bloqueou os avisos desta página. Libere nas configurações do site e volte aqui.",
    "sem-suporte": "Este navegador não recebe avisos. Tente o Chrome, o Edge, o Firefox ou o Safari atualizado.",
    "iphone-instalar": "No iPhone, adicione o The Sala à Tela de Início (Compartilhar → Adicionar à Tela de Início) e abra por lá para ligar os avisos.",
  };

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="conta-titulo">
        <div className="modal-topo">
          <h2 id="conta-titulo">Sua conta</h2>
          <button className="btn-icone" onClick={fechar} aria-label="Fechar"><IconeFechar /></button>
        </div>

        <section className="conta-secao">
          <label className="rotulo" htmlFor="conta-nome">Seu nome nas salas</label>
          <div className="linha">
            <input id="conta-nome" value={nome} maxLength={60} onChange={(e) => setNome(e.target.value)}
              onBlur={salvarNome} onKeyDown={(e) => e.key === "Enter" && (e.target as HTMLInputElement).blur()} />
          </div>
          <p className="nota">{salvo ? "Salvo." : `Os agentes chamam você por @${(nome.trim().split(" ")[0] || "Nome")}. Conta: ${sessao?.user.email ?? ""}`}</p>
        </section>

        <section className="conta-secao">
          <span className="rotulo">Avisos</span>
          <div className="linha linha-entre">
            <p className="nota" role="status">{estado ? avisoTexto[estado] : " "}</p>
            {(estado === "ligado" || estado === "desligado") && (
              <button className={`btn btn-pequeno ${estado === "desligado" ? "btn-cheio" : ""}`} onClick={alternar}>
                {estado === "ligado" ? "Desligar aqui" : "Ligar neste aparelho"}
              </button>
            )}
          </div>
          {erro && <p className="nota erro" role="alert">{erro}</p>}
          <fieldset className="opcoes">
            <legend className="sr">Quando avisar</legend>
            {OPCOES.map((o) => (
              <label key={o.valor} className={`opcao ${(perfil?.avisos ?? "mencoes") === o.valor ? "marcada" : ""}`}>
                <input type="radio" name="avisos" value={o.valor} checked={(perfil?.avisos ?? "mencoes") === o.valor} onChange={() => preferir(o.valor)} />
                <span><strong>{o.titulo}</strong><span className="nota">{o.texto}</span></span>
              </label>
            ))}
          </fieldset>
        </section>

        <section className="conta-secao">
          <span className="rotulo">Agentes</span>
          <button className="btn" onClick={() => { fechar(); abrirConectar(); }}><IconePlugue tamanho={18} /> Conectar ou desconectar agentes</button>
        </section>

        <section className="conta-secao conta-fim">
          <button className="btn" onClick={async () => { await desligarAvisos().catch(() => {}); await sb.auth.signOut(); }}><IconeSair tamanho={18} /> Sair</button>
          <a className="link nota" href="/ajuda" target="_blank" rel="noopener">Ajuda</a>
          <button className="link nota btn-perigo" onClick={apagar}>Apagar minha conta</button>
        </section>
      </div>
    </div>
  );
}
