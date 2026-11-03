import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { Layout, useSalas } from "../components/Layout";
import { Bolha } from "../components/Bolha";
import { Ajustes } from "../components/Ajustes";
import { handle } from "../components/Texto";
import { IconeAjustes, IconeAgente, IconeCheck, IconeConvite, IconeEnviar, IconePlugue, IconeVoltar } from "../components/Icones";
import { abrirConectar, sb, ultimaSala, type Membro, type Mensagem } from "../supabase";

const hora = (iso: string) => new Date(iso).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
const completo = (iso: string) => new Date(iso).toLocaleString("pt-BR", { dateStyle: "long", timeStyle: "short" });
const dia = (iso: string) => {
  const d = new Date(iso);
  const hoje = new Date();
  const ontem = new Date(hoje); ontem.setDate(hoje.getDate() - 1);
  if (d.toDateString() === hoje.toDateString()) return "Hoje";
  if (d.toDateString() === ontem.toDateString()) return "Ontem";
  return d.toLocaleDateString("pt-BR", { day: "numeric", month: "long", year: d.getFullYear() === hoje.getFullYear() ? undefined : "numeric" });
};

type Sugestao = { handle: string; rotulo: string; agente?: boolean };

export default function SalaPage() {
  const { id = "" } = useParams();
  const { sessao, perfil } = useAuth();
  const eu = sessao!.user.id;
  const { salas, recarregar } = useSalas();
  const sala = salas?.find((s) => s.id === id);

  const [membros, setMembros] = useState<Membro[]>([]);
  const [msgs, setMsgs] = useState<Mensagem[] | null>(null);
  const [texto, setTexto] = useState("");
  const [convite, setConvite] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [ajustes, setAjustes] = useState<false | true | "contexto">(false);
  const [busca, setBusca] = useState<string | null>(null); // texto depois do @ que está sendo digitado
  const [escolha, setEscolha] = useState(0);
  const feed = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const noFim = useRef(true);
  const lido = useRef(0);
  const cursorPendente = useRef<number | null>(null);

  // depois de escolher uma @menção, o cursor vai para logo depois dela, no mesmo ciclo da tela
  useLayoutEffect(() => {
    const c = caixa.current;
    if (c && cursorPendente.current !== null) {
      c.focus();
      c.setSelectionRange(cursorPendente.current, cursorPendente.current);
      cursorPendente.current = null;
    }
  }, [texto]);

  const nomes = useMemo(() => new Map(membros.map((m) => [m.user_id, m.perfis?.nome ?? "Alguém"])), [membros]);
  const primeiro = (uid: string) => (nomes.get(uid) ?? "Alguém").split(" ")[0];

  // agentes que já falaram aqui (Claude de Ana, ChatGPT de Bruno...)
  const agentes = useMemo(() => {
    const vistos = new Map<string, { agente: string; uid: string }>();
    msgs?.forEach((m) => m.agente && vistos.set(`${m.agente}|${m.user_id}`, { agente: m.agente, uid: m.user_id }));
    return [...vistos.values()];
  }, [msgs]);

  const meuPrimeiro = handle((perfil?.nome ?? "").split(" ")[0]);
  const chamaMim = useCallback((mencao: string) => {
    const h = handle(mencao.slice(1).split("-")[0]);
    return h === "todos" || (!!meuPrimeiro && h === meuPrimeiro);
  }, [meuPrimeiro]);

  const sugestoes = useMemo<Sugestao[]>(() => {
    if (busca === null) return [];
    const todas: Sugestao[] = [
      { handle: "agentes", rotulo: "Todos os agentes da sala", agente: true },
      ...agentes.map((a) => ({ handle: `${a.agente.replace(/\s/g, "")}-${primeiro(a.uid)}`, rotulo: `${a.agente} de ${nomes.get(a.uid) ?? "?"}`, agente: true })),
      ...membros.filter((m) => m.user_id !== eu).map((m) => ({ handle: (m.perfis?.nome ?? "").split(" ")[0], rotulo: m.perfis?.nome ?? "" })),
      { handle: "todos", rotulo: "Todo mundo, pessoas e agentes" },
    ];
    const b = handle(busca);
    return todas.filter((s) => s.handle && handle(s.handle).startsWith(b)).slice(0, 6);
  }, [busca, agentes, membros, eu, nomes]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- carregar e ouvir

  useEffect(() => {
    if (!id) return;
    ultimaSala.set(id);
    setMsgs(null); setAjustes(false); setConvite(false);
    noFim.current = true; lido.current = 0;

    const carregarMembros = () =>
      sb.from("membros").select("user_id, papel, perfis(id, nome, avatar)").eq("sala_id", id).order("entrou_em")
        .then(({ data }) => setMembros((data as unknown as Membro[]) ?? []));
    carregarMembros();

    sb.from("mensagens").select("*").eq("sala_id", id).order("id", { ascending: false }).limit(200)
      .then(({ data }) => setMsgs(((data as Mensagem[]) ?? []).reverse()));

    const canal = sb.channel(`sala:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `sala_id=eq.${id}` }, (p) => {
        const m = p.new as Mensagem;
        setMsgs((atual) => {
          if (!atual || atual.some((x) => x.id === m.id)) return atual;
          const i = atual.findIndex((x) => x.pendente && x.texto === m.texto && x.user_id === m.user_id && !m.agente);
          if (i >= 0) { const c = [...atual]; c[i] = m; return c; }
          return [...atual, m];
        });
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "membros", filter: `sala_id=eq.${id}` }, carregarMembros)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "membros" }, carregarMembros)
      .subscribe();
    return () => { sb.removeChannel(canal); };
  }, [id]);

  useLayoutEffect(() => {
    const f = feed.current;
    if (f && noFim.current) f.scrollTop = f.scrollHeight;
  }, [msgs]);

  // marca como lida o que está na tela
  useEffect(() => {
    const marcar = () => {
      const ultimo = msgs?.reduce((n, m) => (m.id > n ? m.id : n), 0) ?? 0;
      if (document.hidden || !ultimo || ultimo <= lido.current) return;
      lido.current = ultimo;
      sb.rpc("marcar_lida", { sala: id, ate: ultimo }).then(() => recarregar());
    };
    marcar();
    document.addEventListener("visibilitychange", marcar);
    return () => document.removeEventListener("visibilitychange", marcar);
  }, [msgs, id]); // eslint-disable-line react-hooks/exhaustive-deps

  // ---------------------------------------------------------------- enviar

  const mandar = async (t: string, tempId: number) => {
    const { data, error } = await sb.from("mensagens").insert({ sala_id: id, user_id: eu, texto: t }).select("*").single();
    setMsgs((a) => {
      if (!a) return a;
      if (error) return a.map((x) => (x.id === tempId ? { ...x, pendente: false, falhou: true } : x));
      if (a.some((x) => x.id === data.id)) return a.filter((x) => x.id !== tempId);
      return a.map((x) => (x.id === tempId ? (data as Mensagem) : x));
    });
  };

  const enviar = () => {
    const t = texto.trim();
    if (!t) return;
    setTexto(""); setBusca(null);
    if (caixa.current) caixa.current.style.height = "auto";
    noFim.current = true;
    const temp: Mensagem = { id: -Date.now(), sala_id: id, user_id: eu, agente: null, texto: t, criada_em: new Date().toISOString(), pendente: true };
    setMsgs((a) => [...(a ?? []), temp]);
    mandar(t, temp.id);
  };

  const tentarDeNovo = (m: Mensagem) => {
    setMsgs((a) => a?.map((x) => (x.id === m.id ? { ...x, pendente: true, falhou: false } : x)) ?? a);
    mandar(m.texto, m.id);
  };

  // ---------------------------------------------------------------- @menção

  const acharBusca = (valor: string, cursor: number) => {
    const m = valor.slice(0, cursor).match(/(?:^|\s)@([\p{L}\p{N}_-]*)$/u);
    setBusca(m ? m[1] : null);
    setEscolha(0);
  };

  const escolher = (s: Sugestao) => {
    const c = caixa.current;
    if (!c) return;
    const cursor = c.selectionStart;
    const antes = texto.slice(0, cursor).replace(/@([\p{L}\p{N}_-]*)$/u, `@${s.handle} `);
    const novo = antes + texto.slice(cursor);
    cursorPendente.current = antes.length;
    setTexto(novo); setBusca(null);
  };

  // ---------------------------------------------------------------- tela

  const link = sala ? `${window.location.origin}/c/${sala.convite}` : "";
  const copiar = async () => {
    try { await navigator.clipboard.writeText(link); setCopiado(true); setTimeout(() => setCopiado(false), 1500); } catch { /* sem clipboard */ }
  };

  if (salas && !sala) {
    return (
      <Layout salas={salas} recarregar={recarregar} foco>
        <section className="vazio">
          <h1 className="display">Sala não encontrada.</h1>
          <p className="sub">Ela pode ter sido apagada, ou você saiu dela. Para entrar, peça um convite a quem está lá.</p>
          <Link to="/" className="btn">Ver minhas salas</Link>
        </section>
      </Layout>
    );
  }

  const passos = [
    { feito: membros.length > 1, titulo: "Chame as pessoas", texto: "Mande o link do convite.", acao: () => setConvite(true), botao: "Copiar convite", icone: <IconeConvite tamanho={18} /> },
    { feito: agentes.some((a) => a.uid === eu), titulo: "Conecte o seu agente", texto: "Claude, ChatGPT, Claude Code ou outro.", acao: abrirConectar, botao: "Conectar agente", icone: <IconePlugue tamanho={18} /> },
    { feito: !!sala?.contexto, titulo: "Conte do que se trata", texto: "Todo agente lê o contexto antes de responder.", acao: () => setAjustes("contexto"), botao: "Escrever contexto", icone: <IconeAjustes tamanho={18} /> },
  ];

  return (
    <Layout salas={salas} recarregar={recarregar} foco>
      <div className="sala">
        <div className="sala-principal">
          <header className="sala-topo">
            <Link to="/" className="btn-icone so-celular" aria-label="Voltar para as salas"><IconeVoltar /></Link>
            <div className="sala-titulo">
              <h1>{sala?.nome ?? " "}</h1>
              <p className="quem">
                {membros.map((m) => m.perfis?.nome?.split(" ")[0]).filter(Boolean).join(", ")}
                {agentes.length > 0 && <> · <IconeAgente tamanho={12} /> {agentes.map((a) => `${a.agente} de ${primeiro(a.uid)}`).join(", ")}</>}
              </p>
            </div>
            <button className="btn" onClick={() => setConvite((v) => !v)} aria-expanded={convite}>
              <IconeConvite tamanho={18} /> <span className="some-celular">Convidar</span>
            </button>
            <button className="btn-icone" onClick={() => setAjustes((v) => (v ? false : true))} aria-expanded={!!ajustes} aria-label="Ajustes da sala" title="Ajustes da sala">
              <IconeAjustes />
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

          <div className="feed" ref={feed} role="log" aria-live="polite" aria-label={`Conversa em ${sala?.nome ?? "sala"}`}
            onScroll={(e) => { const f = e.currentTarget; noFim.current = f.scrollHeight - f.scrollTop - f.clientHeight < 80; }}>
            {msgs === null && <div className="feed-esqueleto" aria-hidden><span /><span /><span /></div>}

            {msgs !== null && passos.some((p) => !p.feito) && (msgs.length < 4) && (
              <section className="passos-sala" aria-label="Próximos passos">
                <h2>{msgs.length ? "Para a sala render mais" : "Sala pronta. Três passos e ela ganha vida."}</h2>
                <ol>
                  {passos.map((p) => (
                    <li key={p.titulo} className={p.feito ? "feito" : ""}>
                      <span className="passo-icone" aria-hidden>{p.feito ? <IconeCheck tamanho={18} /> : p.icone}</span>
                      <span className="passo-texto"><strong>{p.titulo}</strong><span>{p.feito ? "Feito." : p.texto}</span></span>
                      {!p.feito && <button className="btn btn-pequeno" onClick={p.acao}>{p.botao}</button>}
                    </li>
                  ))}
                </ol>
              </section>
            )}

            {msgs?.map((m, i) => {
              const ant = msgs[i - 1];
              const novoDia = !ant || new Date(ant.criada_em).toDateString() !== new Date(m.criada_em).toDateString();
              const continua = !novoDia && !!ant && ant.user_id === m.user_id && ant.agente === m.agente && !ant.falhou &&
                new Date(m.criada_em).getTime() - new Date(ant.criada_em).getTime() < 5 * 60_000;
              return (
                <div key={m.id} className="msg-bloco">
                  {novoDia && <div className="dia" role="separator"><span>{dia(m.criada_em)}</span></div>}
                  <Bolha nome={nomes.get(m.user_id) ?? "Alguém"} agente={m.agente} texto={m.texto}
                    quando={hora(m.criada_em)} quandoCompleto={completo(m.criada_em)}
                    minha={m.user_id === eu && !m.agente} pendente={m.pendente} falhou={m.falhou} continua={continua}
                    chamaMim={chamaMim} tentarDeNovo={() => tentarDeNovo(m)} />
                </div>
              );
            })}
          </div>

          <form className="compor" onSubmit={(e) => { e.preventDefault(); enviar(); }}>
            {sugestoes.length > 0 && (
              <ul className="sugestoes" role="listbox" aria-label="Mencionar">
                {sugestoes.map((s, i) => (
                  <li key={s.handle} role="option" aria-selected={i === escolha}>
                    <button type="button" className={i === escolha ? "ativa" : ""} onMouseDown={(e) => { e.preventDefault(); escolher(s); }}>
                      {s.agente ? <IconeAgente tamanho={16} /> : <span className="avatar avatar-mini">{s.handle[0]?.toUpperCase()}</span>}
                      <span className="sug-handle">@{s.handle}</span>
                      <span className="sug-rotulo">{s.rotulo}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
            <div className="compor-caixa" onClick={() => caixa.current?.focus()}>
              <label className="sr" htmlFor="texto">Mensagem</label>
              <textarea id="texto" ref={caixa} rows={1} value={texto} placeholder="Escreva aqui · @ chama alguém"
                onChange={(e) => {
                  setTexto(e.target.value);
                  acharBusca(e.target.value, e.target.selectionStart);
                  e.target.style.height = "auto"; e.target.style.height = `${Math.min(e.target.scrollHeight, 200)}px`;
                }}
                onBlur={() => setBusca(null)}
                onKeyDown={(e) => {
                  if (sugestoes.length) {
                    if (e.key === "ArrowDown") { e.preventDefault(); setEscolha((i) => (i + 1) % sugestoes.length); return; }
                    if (e.key === "ArrowUp") { e.preventDefault(); setEscolha((i) => (i - 1 + sugestoes.length) % sugestoes.length); return; }
                    if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); escolher(sugestoes[escolha]); return; }
                    if (e.key === "Escape") { e.preventDefault(); setBusca(null); return; }
                  }
                  if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); enviar(); }
                }} />
              <button className="btn-enviar" disabled={!texto.trim()} title="Enviar (Enter)" aria-label="Enviar">
                <IconeEnviar tamanho={18} />
              </button>
            </div>
            <p className="compor-dica" aria-hidden>
              <kbd>@</kbd> chama alguém · <kbd>Enter</kbd> envia · <kbd>Shift</kbd> + <kbd>Enter</kbd> quebra linha
            </p>
          </form>
        </div>

        {ajustes && sala && (
          <Ajustes sala={sala} membros={membros} eu={eu} fechar={() => setAjustes(false)} recarregar={recarregar}
            foco={ajustes === "contexto" ? "contexto" : undefined} />
        )}
      </div>
    </Layout>
  );
}
