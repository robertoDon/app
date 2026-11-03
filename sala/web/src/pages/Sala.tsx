import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { Layout, useSalas } from "../components/Layout";
import { Bolha } from "../components/Bolha";
import { IconeConvite, IconeEnviar, IconeVoltar } from "../components/Icones";
import { sb, ultimaSala, type Membro, type Mensagem } from "../supabase";

const hora = (iso: string) => {
  const d = new Date(iso);
  const hoje = d.toDateString() === new Date().toDateString();
  return d.toLocaleString("pt-BR", hoje ? { hour: "2-digit", minute: "2-digit" } : { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
};

export default function SalaPage() {
  const { id = "" } = useParams();
  const { sessao } = useAuth();
  const eu = sessao!.user.id;
  const { salas, recarregar } = useSalas();
  const sala = salas?.find((s) => s.id === id);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [msgs, setMsgs] = useState<Mensagem[] | null>(null);
  const [texto, setTexto] = useState("");
  const [convite, setConvite] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const feed = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const noFim = useRef(true);

  const nomes = useMemo(() => new Map(membros.map((m) => [m.user_id, m.perfis?.nome ?? "Alguém"])), [membros]);
  const agentes = useMemo(() => {
    const vistos = new Map<string, string>();
    msgs?.forEach((m) => m.agente && vistos.set(`${m.agente}|${m.user_id}`, `${m.agente} de ${nomes.get(m.user_id) ?? "?"}`));
    return [...vistos.values()];
  }, [msgs, nomes]);

  useEffect(() => {
    if (!id) return;
    ultimaSala.set(id);
    setMsgs(null);
    noFim.current = true;

    const carregarMembros = () =>
      sb.from("membros").select("user_id, papel, perfis(id, nome, avatar)").eq("sala_id", id)
        .then(({ data }) => setMembros((data as unknown as Membro[]) ?? []));
    carregarMembros();

    sb.from("mensagens").select("*").eq("sala_id", id).order("id", { ascending: false }).limit(200)
      .then(({ data }) => setMsgs(((data as Mensagem[]) ?? []).reverse()));

    const canal = sb.channel(`sala:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `sala_id=eq.${id}` }, (p) => {
        const m = p.new as Mensagem;
        setMsgs((atual) => {
          if (!atual) return atual;
          if (atual.some((x) => x.id === m.id)) return atual;
          // troca a mensagem otimista correspondente pela real
          const i = atual.findIndex((x) => x.pendente && x.texto === m.texto && x.user_id === m.user_id && !m.agente);
          if (i >= 0) { const c = [...atual]; c[i] = m; return c; }
          return [...atual, m];
        });
      })
      .on("postgres_changes", { event: "*", schema: "public", table: "membros", filter: `sala_id=eq.${id}` }, carregarMembros)
      .subscribe();
    return () => { sb.removeChannel(canal); };
  }, [id]);

  useLayoutEffect(() => {
    const f = feed.current;
    if (f && noFim.current) f.scrollTop = f.scrollHeight;
  }, [msgs]);

  const enviar = async () => {
    const t = texto.trim();
    if (!t) return;
    setTexto("");
    if (caixa.current) caixa.current.style.height = "auto";
    noFim.current = true;
    const temp: Mensagem = { id: -Date.now(), sala_id: id, user_id: eu, agente: null, texto: t, criada_em: new Date().toISOString(), pendente: true };
    setMsgs((a) => [...(a ?? []), temp]);
    const { data, error } = await sb.from("mensagens").insert({ sala_id: id, user_id: eu, texto: t }).select("*").single();
    setMsgs((a) => {
      if (!a) return a;
      if (error) return a.filter((x) => x.id !== temp.id);
      if (a.some((x) => x.id === data.id)) return a.filter((x) => x.id !== temp.id);
      return a.map((x) => (x.id === temp.id ? (data as Mensagem) : x));
    });
    if (error) { setTexto(t); alert(`Não enviou: ${error.message}`); }
  };

  const link = sala ? `${window.location.origin}/c/${sala.convite}` : "";
  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sem clipboard */ }
  };

  if (salas && !sala) {
    return (
      <Layout salas={salas} recarregar={recarregar} foco>
        <section className="vazio">
          <h1 className="display">Sala não encontrada.</h1>
          <p className="sub">Ela pode ter sido apagada, ou você ainda não entrou nela. Peça o convite para quem criou.</p>
          <Link to="/" className="btn">Ver minhas salas</Link>
        </section>
      </Layout>
    );
  }

  return (
    <Layout salas={salas} recarregar={recarregar} foco>
      <header className="sala-topo">
        <Link to="/" className="btn-icone so-celular" aria-label="Voltar para as salas"><IconeVoltar /></Link>
        <div className="sala-titulo">
          <h1>{sala?.nome ?? " "}</h1>
          <p className="quem">
            {membros.map((m) => m.perfis?.nome).filter(Boolean).join(", ")}
            {agentes.length > 0 && <> · {agentes.join(", ")}</>}
          </p>
        </div>
        <button className="btn" onClick={() => setConvite((v) => !v)} aria-expanded={convite}>
          <IconeConvite tamanho={18} /> <span className="some-celular">Convidar</span>
        </button>
      </header>

      {convite && sala && (
        <div className="convite" role="region" aria-label="Convite">
          <p>Quem abrir este link entra na sala e pode conectar os próprios agentes.</p>
          <div className="linha">
            <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link do convite" />
            <button className="btn btn-cheio" onClick={copiar}>{copiado ? "Copiado" : "Copiar link"}</button>
          </div>
        </div>
      )}

      <div className="feed" ref={feed} onScroll={(e) => {
        const f = e.currentTarget;
        noFim.current = f.scrollHeight - f.scrollTop - f.clientHeight < 80;
      }}>
        {msgs === null && <div className="feed-esqueleto" aria-hidden><span /><span /><span /></div>}
        {msgs?.length === 0 && (
          <div className="vazio vazio-feed">
            <p className="sub">Aqui aparece a conversa de vocês e dos agentes. Escreva a primeira mensagem, convide alguém ou conecte um agente.</p>
          </div>
        )}
        {msgs?.map((m, i) => {
          const ant = msgs[i - 1];
          const continua = !!ant && ant.user_id === m.user_id && ant.agente === m.agente &&
            new Date(m.criada_em).getTime() - new Date(ant.criada_em).getTime() < 5 * 60_000;
          return (
            <Bolha key={m.id} nome={nomes.get(m.user_id) ?? "Alguém"} agente={m.agente} texto={m.texto}
              quando={hora(m.criada_em)} minha={m.user_id === eu && !m.agente} pendente={m.pendente} continua={continua} />
          );
        })}
      </div>

      <form className="compor" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
        <label className="sr" htmlFor="texto">Mensagem</label>
        <textarea id="texto" ref={caixa} rows={1} value={texto} placeholder={`Escreva para ${sala?.nome ?? "a sala"}`}
          onChange={(e) => { setTexto(e.target.value); e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`; }}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(); }
          }} />
        <button className="btn btn-cheio btn-enviar" disabled={!texto.trim()} title="Enviar (Enter)" aria-label="Enviar">
          <IconeEnviar />
        </button>
      </form>
    </Layout>
  );
}
