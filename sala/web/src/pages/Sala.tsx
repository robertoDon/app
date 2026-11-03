import { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useAuth } from "../App";
import { Layout, useSalas } from "../components/Layout";
import { Bolha, Evento, type Citacao } from "../components/Bolha";
import { Ajustes } from "../components/Ajustes";
import { Compor, type ComporApi, type Sugestao } from "../components/Compor";
import { Decisoes } from "../components/Decisoes";
import { Comparar, type Esperando } from "../components/Comparar";
import { Busca } from "../components/Busca";
import { Avisos } from "../components/Avisos";
import { handle } from "../components/Texto";
import {
  IconeAjustes, IconeAgente, IconeBusca, IconeCheck, IconeColunas, IconeConvite, IconeDecisao, IconePlugue, IconeProposta, IconeVoltar,
} from "../components/Icones";
import { abrirConectar, copiarTexto, presenca, sb, ultimaSala, type Agente, type Membro, type Mensagem } from "../supabase";

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
const umaLinha = (t: string, n = 90) => { const l = t.replace(/\s+/g, " ").trim(); return l.length > n ? `${l.slice(0, n - 1)}…` : l; };
const perguntaATodos = (m: Mensagem) => !m.agente && m.tipo === "mensagem" && !m.apagada && /@(agentes|todos)(?![\p{L}\p{N}_])/iu.test(m.texto);
const PAGINA = 200;

export type AgenteSala = { nome: string; uid: string; presenca: { ativo: boolean; texto: string } | null };
type Painel = null | "ajustes" | "contexto" | "decisoes" | "busca";

export default function SalaPage() {
  const { id = "" } = useParams();
  const { sessao, perfil } = useAuth();
  const eu = sessao!.user.id;
  const { salas, recarregar } = useSalas();
  const sala = salas?.find((s) => s.id === id);
  const dono = sala?.papel === "dono";

  const [membros, setMembros] = useState<Membro[]>([]);
  const [presencas, setPresencas] = useState<Agente[]>([]);
  const [msgs, setMsgs] = useState<Mensagem[] | null>(null);
  const [temAnteriores, setTemAnteriores] = useState(false);
  const [temPosteriores, setTemPosteriores] = useState(false); // depois de pular para uma mensagem antiga
  const [convite, setConvite] = useState(false);
  const [copiado, setCopiado] = useState(false);
  const [painel, setPainel] = useState<Painel>(null);
  const [respondendo, setRespondendo] = useState<Citacao>(null);
  const [comparar, setComparar] = useState<number | null>(null);
  const [destaque, setDestaque] = useState<number | null>(null);
  const [versaoDecisoes, setVersaoDecisoes] = useState(0);
  const [, setRelogio] = useState(0); // refaz "visto há…" de tempos em tempos
  const feed = useRef<HTMLDivElement>(null);
  const compor = useRef<ComporApi>(null);
  const noFim = useRef(true);
  const lido = useRef(0);
  const manterRolagem = useRef<number | null>(null);
  const rolarPara = useRef<number | null>(null);
  const salaAtual = useRef(id); // respostas atrasadas de outra sala são ignoradas
  const longe = useRef(false);  // vendo uma janela antiga: o que chega ao vivo não entra no meio

  const nomes = useMemo(() => new Map(membros.map((m) => [m.user_id, m.perfis?.nome ?? "Alguém"])), [membros]);
  const nome = useCallback((uid: string | null) => (uid && nomes.get(uid)) || "Alguém", [nomes]);
  const primeiro = useCallback((uid: string) => nome(uid).split(" ")[0], [nome]);
  const autor = useCallback((m: Mensagem) => (m.agente ? `${m.agente} de ${primeiro(m.user_id)}` : nome(m.user_id)), [nome, primeiro]);

  // agentes da sala: os conectados de quem está aqui (com presença) e os que já falaram
  const agentes = useMemo<AgenteSala[]>(() => {
    const mapa = new Map<string, AgenteSala>();
    const ids = new Set(membros.map((m) => m.user_id));
    presencas.filter((a) => ids.has(a.user_id) && Date.now() - new Date(a.visto_em).getTime() < 30 * 864e5)
      .forEach((a) => mapa.set(`${a.nome}|${a.user_id}`, { nome: a.nome, uid: a.user_id, presenca: presenca(a) }));
    msgs?.forEach((m) => m.agente && ids.has(m.user_id) && !mapa.has(`${m.agente}|${m.user_id}`) &&
      mapa.set(`${m.agente}|${m.user_id}`, { nome: m.agente, uid: m.user_id, presenca: null }));
    return [...mapa.values()];
  }, [presencas, msgs, membros]);

  const meuPrimeiro = handle((perfil?.nome ?? "").split(" ")[0]);
  const chamaMim = useCallback((mencao: string) => {
    const h = handle(mencao.slice(1).split("-")[0]);
    return h === "todos" || (!!meuPrimeiro && h === meuPrimeiro);
  }, [meuPrimeiro]);

  const sugestoes = useMemo<Sugestao[]>(() => [
    { handle: "agentes", rotulo: "Todos os agentes da sala respondem", agente: true },
    ...agentes.map((a) => ({ handle: `${a.nome.replace(/\s/g, "")}-${primeiro(a.uid)}`, rotulo: `${a.nome} de ${nome(a.uid)}`, agente: true })),
    ...membros.filter((m) => m.user_id !== eu).map((m) => ({ handle: (m.perfis?.nome ?? "").split(" ")[0], rotulo: m.perfis?.nome ?? "" })),
    { handle: "todos", rotulo: "Todo mundo, pessoas e agentes" },
  ], [agentes, membros, eu, nome, primeiro]);

  const porId = useMemo(() => new Map((msgs ?? []).map((m) => [m.id, m])), [msgs]);
  const respostas = useMemo(() => {
    const r = new Map<number, Mensagem[]>();
    msgs?.forEach((m) => { if (m.agente && m.responde_a && !m.apagada) r.set(m.responde_a, [...(r.get(m.responde_a) ?? []), m]); });
    return r;
  }, [msgs]);

  // ---------------------------------------------------------------- carregar e ouvir

  const carregarRecentes = useCallback(async (sid: string, buffer: Mensagem[] = []) => {
    const { data } = await sb.from("mensagens").select("*").eq("sala_id", sid).order("id", { ascending: false }).limit(PAGINA);
    if (salaAtual.current !== sid) return;
    const d = (data as Mensagem[]) ?? [];
    const mapa = new Map<number, Mensagem>();
    [...d, ...buffer].forEach((m) => mapa.set(m.id, { ...mapa.get(m.id), ...m }));
    setTemAnteriores(d.length === PAGINA);
    setTemPosteriores(false); longe.current = false;
    noFim.current = true;
    setMsgs([...mapa.values()].sort((a, b) => a.id - b.id));
  }, []);

  useEffect(() => {
    if (!id) return;
    salaAtual.current = id;
    ultimaSala.set(id);
    setMsgs(null); setPainel(null); setConvite(false); setRespondendo(null); setComparar(null);
    setTemAnteriores(false); setTemPosteriores(false); longe.current = false;
    noFim.current = true; lido.current = 0;
    let carregado = false;
    const buffer: Mensagem[] = []; // o que chega ao vivo antes da primeira leitura terminar

    const carregarMembros = () =>
      sb.from("membros").select("user_id, papel, perfis(id, nome, avatar)").eq("sala_id", id).order("entrou_em")
        .then(({ data }) => { if (salaAtual.current === id) setMembros((data as unknown as Membro[]) ?? []); });
    sb.from("agentes").select("*").then(({ data }) => setPresencas((data as Agente[]) ?? []));
    carregarMembros();

    const chegou = (m: Mensagem) => {
      if (m.tipo !== "mensagem") setVersaoDecisoes((v) => v + 1);
      if (longe.current) { setTemPosteriores(true); return; }
      setMsgs((atual) => {
        if (!atual) { buffer.push(m); return atual; }
        if (atual.some((x) => x.id === m.id)) return atual;
        const i = atual.findIndex((x) => x.pendente && x.texto === m.texto && x.user_id === m.user_id && !m.agente && x.tipo === m.tipo);
        if (i >= 0) { const c = [...atual]; c[i] = m; return c; }
        return [...atual, m];
      });
    };
    const primeira = () => { if (!carregado) { carregado = true; carregarRecentes(id, buffer); } };

    const canal = sb.channel(`sala:${id}`)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "mensagens", filter: `sala_id=eq.${id}` }, (p) => chegou(p.new as Mensagem))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "mensagens", filter: `sala_id=eq.${id}` }, (p) => {
        const m = p.new as Mensagem;
        if (m.tipo === "proposta") setVersaoDecisoes((v) => v + 1);
        setMsgs((atual) => atual?.map((x) => (x.id === m.id ? { ...x, ...m } : x)) ?? atual);
      })
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "membros", filter: `sala_id=eq.${id}` }, carregarMembros)
      .on("postgres_changes", { event: "DELETE", schema: "public", table: "membros" }, carregarMembros)
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "agentes" }, (p) => atualizarPresenca(p.new as Agente))
      .on("postgres_changes", { event: "UPDATE", schema: "public", table: "agentes" }, (p) => atualizarPresenca(p.new as Agente))
      // assina antes de ler: nada que chegue no meio se perde
      .subscribe((status) => { if (status === "SUBSCRIBED" || status === "CHANNEL_ERROR" || status === "TIMED_OUT") primeira(); });
    const reserva = window.setTimeout(primeira, 4000);
    const t = window.setInterval(() => setRelogio((n) => n + 1), 60_000);
    return () => { sb.removeChannel(canal); window.clearInterval(t); window.clearTimeout(reserva); };
  }, [id, carregarRecentes]);

  const atualizarPresenca = (a: Agente) =>
    setPresencas((ps) => [...ps.filter((x) => !(x.user_id === a.user_id && x.nome === a.nome)), a]);

  // rolagem: grudada no fim; mantém o lugar ao carregar anteriores; vai até a mensagem pedida
  useLayoutEffect(() => {
    const f = feed.current;
    if (!f) return;
    if (manterRolagem.current !== null) { f.scrollTop = f.scrollHeight - manterRolagem.current; manterRolagem.current = null; return; }
    if (rolarPara.current !== null) {
      const alvo = document.getElementById(`m${rolarPara.current}`);
      rolarPara.current = null;
      if (alvo) { alvo.scrollIntoView({ block: "center" }); return; }
    }
    if (noFim.current) f.scrollTop = f.scrollHeight;
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

  // atalhos: / busca, D decisões
  useEffect(() => {
    const tecla = (e: KeyboardEvent) => {
      const digitando = (e.target as HTMLElement)?.closest("input, textarea, [contenteditable]");
      if (digitando || e.metaKey || e.ctrlKey || e.altKey) return;
      if (e.key === "/") { e.preventDefault(); setPainel("busca"); }
      if (e.key === "d") { e.preventDefault(); setPainel((p) => (p === "decisoes" ? null : "decisoes")); }
    };
    window.addEventListener("keydown", tecla);
    return () => window.removeEventListener("keydown", tecla);
  }, []);

  const carregarAnteriores = async () => {
    if (!msgs?.length) return;
    const sid = id;
    const { data } = await sb.from("mensagens").select("*").eq("sala_id", sid).lt("id", msgs[0].id).order("id", { ascending: false }).limit(PAGINA);
    if (salaAtual.current !== sid) return;
    const d = ((data as Mensagem[]) ?? []).reverse();
    setTemAnteriores(d.length === PAGINA);
    const f = feed.current;
    if (f) manterRolagem.current = f.scrollHeight - f.scrollTop;
    setMsgs((a) => [...d, ...(a ?? [])]);
  };

  const irPara = useCallback(async (alvo: number) => {
    if (window.matchMedia("(max-width: 720px)").matches) setPainel(null);
    setDestaque(alvo); window.setTimeout(() => setDestaque((d) => (d === alvo ? null : d)), 1600);
    const el = document.getElementById(`m${alvo}`);
    if (el) { noFim.current = false; el.scrollIntoView({ block: "center", behavior: "smooth" }); return; }
    // fora do que está carregado: abre uma janela em volta dela
    const sid = id;
    const [antes, depois] = await Promise.all([
      sb.from("mensagens").select("*").eq("sala_id", sid).lt("id", alvo).order("id", { ascending: false }).limit(50),
      sb.from("mensagens").select("*").eq("sala_id", sid).gte("id", alvo).order("id").limit(PAGINA),
    ]);
    if (salaAtual.current !== sid) return;
    const a = ((antes.data as Mensagem[]) ?? []).reverse();
    const d = (depois.data as Mensagem[]) ?? [];
    noFim.current = false; rolarPara.current = alvo;
    setTemAnteriores(a.length === 50);
    const recortada = d.length === PAGINA;
    setTemPosteriores(recortada); longe.current = recortada;
    setMsgs([...a, ...d]);
  }, [id]);

  // ---------------------------------------------------------------- enviar e agir

  const mandar = async (temp: Mensagem) => {
    const { data, error } = await sb.from("mensagens")
      .insert({ sala_id: id, user_id: eu, texto: temp.texto, tipo: temp.tipo, estado: temp.estado, responde_a: temp.responde_a })
      .select("*").single();
    setMsgs((a) => {
      if (!a) return a;
      if (error) return a.map((x) => (x.id === temp.id ? { ...x, pendente: false, falhou: true } : x));
      if (a.some((x) => x.id === data.id)) return a.filter((x) => x.id !== temp.id);
      return a.map((x) => (x.id === temp.id ? (data as Mensagem) : x));
    });
  };

  const enviar = (texto: string, proposta: boolean) => {
    if (longe.current) carregarRecentes(id);
    noFim.current = true;
    const temp: Mensagem = {
      id: -Date.now(), sala_id: id, user_id: eu, agente: null, texto, criada_em: new Date().toISOString(),
      tipo: proposta ? "proposta" : "mensagem", estado: proposta ? "pendente" : null, responde_a: respondendo?.id ?? null,
      decidida_por: null, decidida_em: null, editada_em: null, apagada: false, pendente: true,
    };
    setRespondendo(null);
    setMsgs((a) => [...(a ?? []), temp]);
    mandar(temp);
  };

  const tentarDeNovo = (m: Mensagem) => {
    setMsgs((a) => a?.map((x) => (x.id === m.id ? { ...x, pendente: true, falhou: false } : x)) ?? a);
    mandar(m);
  };

  const decidir = async (pid: number, aprovar: boolean, nota?: string) => {
    const { error } = await sb.rpc("decidir", { proposta: pid, aprovar, nota: nota ?? null });
    if (error) return error.message;
    setMsgs((a) => a?.map((x) => (x.id === pid ? { ...x, estado: aprovar ? "aprovada" : "recusada", decidida_por: eu, decidida_em: new Date().toISOString() } : x)) ?? a);
    recarregar();
    return null;
  };

  const editar = async (mid: number, texto: string) => {
    const { error } = await sb.rpc("editar_mensagem", { mensagem: mid, texto });
    if (error) return error.message;
    setMsgs((a) => a?.map((x) => (x.id === mid ? { ...x, texto, editada_em: new Date().toISOString() } : x)) ?? a);
    return null;
  };

  const apagar = async (m: Mensagem) => {
    const de = m.user_id === eu ? (m.agente ? `do seu ${m.agente}` : "sua") : `de ${autor(m)}`;
    if (!confirm(`Apagar esta mensagem ${de}? O texto some para todos, pessoas e agentes.`)) return;
    const { error } = await sb.rpc("apagar_mensagem", { mensagem: m.id });
    if (error) return alert(error.message);
    setMsgs((a) => a?.map((x) => (x.id === m.id ? { ...x, apagada: true, texto: "Mensagem apagada." } : x)) ?? a);
  };

  const responder = (m: Mensagem) => {
    setRespondendo({ id: m.id, autor: autor(m), texto: umaLinha(m.texto) });
    compor.current?.focar();
  };

  // ---------------------------------------------------------------- tela

  const link = sala ? `${window.location.origin}/c/${sala.convite}` : "";
  const copiarConvite = async () => { if (await copiarTexto(link)) { setCopiado(true); setTimeout(() => setCopiado(false), 1500); } };

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
    { feito: !!sala?.contexto, titulo: "Conte do que se trata", texto: "Todo agente lê o contexto antes de responder.", acao: () => setPainel("contexto"), botao: "Escrever contexto", icone: <IconeAjustes tamanho={18} /> },
  ];
  const pendentes = Number(sala?.pendentes ?? 0);
  const ouvindo = agentes.filter((a) => a.presenca?.texto === "ouvindo agora");

  const esperandoDe = (q: Mensagem): Esperando[] => {
    const ja = new Set((respostas.get(q.id) ?? []).map((r) => `${r.agente}|${r.user_id}`));
    return agentes.filter((a) => !ja.has(`${a.nome}|${a.uid}`) && a.presenca)
      .map((a) => ({ nome: a.nome, dono: nome(a.uid), status: a.presenca!.texto }));
  };
  const comparando = comparar !== null ? porId.get(comparar) : undefined;

  return (
    <Layout salas={salas} recarregar={recarregar} foco>
      <div className="sala">
        <div className="sala-principal">
          <header className="sala-topo">
            <Link to="/" className="btn-icone so-celular" aria-label="Voltar para as salas"><IconeVoltar /></Link>
            <div className="sala-titulo">
              <h1>{sala?.nome ?? " "}</h1>
              <p className="quem">
                {membros.map((m) => m.perfis?.nome?.split(" ")[0]).filter(Boolean).join(", ")}
                {agentes.length > 0 && <> · <IconeAgente tamanho={12} /> {agentes.length} {agentes.length === 1 ? "agente" : "agentes"}</>}
                {ouvindo.length > 0 && <> · <span className="ponto ponto-mini" aria-hidden /> {ouvindo.length === 1 ? `${ouvindo[0].nome} de ${primeiro(ouvindo[0].uid)} ouvindo` : `${ouvindo.length} ouvindo`}</>}
              </p>
            </div>
            <button className={`btn-icone ${painel === "decisoes" ? "ativo" : ""}`} onClick={() => setPainel((p) => (p === "decisoes" ? null : "decisoes"))}
              aria-expanded={painel === "decisoes"} aria-label={pendentes ? `Decisões, ${pendentes} aguardando` : "Decisões"} title="Decisões (D)">
              <IconeDecisao />
              {pendentes > 0 && <span className="selo-num" aria-hidden>{pendentes}</span>}
            </button>
            <button className={`btn-icone ${painel === "busca" ? "ativo" : ""}`} onClick={() => setPainel((p) => (p === "busca" ? null : "busca"))}
              aria-expanded={painel === "busca"} aria-label="Buscar na sala" title="Buscar (/)">
              <IconeBusca />
            </button>
            <button className="btn btn-convidar" onClick={() => setConvite((v) => !v)} aria-expanded={convite} aria-label="Convidar pessoas" title="Convidar pessoas">
              <IconeConvite tamanho={18} /> <span className="some-celular">Convidar</span>
            </button>
            <button className={`btn-icone ${painel === "ajustes" || painel === "contexto" ? "ativo" : ""}`} onClick={() => setPainel((p) => (p === "ajustes" || p === "contexto" ? null : "ajustes"))}
              aria-expanded={painel === "ajustes"} aria-label="Ajustes da sala" title="Ajustes da sala">
              <IconeAjustes />
            </button>
          </header>

          {convite && sala && (
            <div className="convite" role="region" aria-label="Convite">
              <p>Quem abrir este link entra na sala e pode conectar os próprios agentes. Serve para gente de qualquer empresa.</p>
              <div className="linha">
                <input readOnly value={link} onFocus={(e) => e.target.select()} aria-label="Link do convite" />
                <button className="btn btn-cheio" onClick={copiarConvite}>{copiado ? "Copiado" : "Copiar link"}</button>
              </div>
            </div>
          )}

          <div className="feed" ref={feed} role="log" aria-live="polite" aria-label={`Conversa em ${sala?.nome ?? "sala"}`}
            onScroll={(e) => { const f = e.currentTarget; noFim.current = f.scrollHeight - f.scrollTop - f.clientHeight < 80; }}>
            {msgs === null && <div className="feed-esqueleto" aria-hidden><span /><span /><span /></div>}

            {temAnteriores && msgs && (
              <div className="anteriores"><button className="btn btn-pequeno" onClick={carregarAnteriores}>Mostrar mensagens anteriores</button></div>
            )}

            {msgs !== null && passos.some((p) => !p.feito) && msgs.length < 4 && (
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

            {msgs !== null && msgs.length > 0 && msgs.length < 12 && !msgs.some((m) => m.tipo !== "mensagem") && agentes.length > 0 && (
              <p className="dica-sala"><IconeProposta tamanho={16} /> Peça uma decisão com <strong>Propor</strong>, ou pergunte a todos os agentes com <strong>@agentes</strong> e compare as respostas.</p>
            )}

            {msgs?.map((m, i) => {
              const ant = msgs[i - 1];
              const novoDia = !ant || new Date(ant.criada_em).toDateString() !== new Date(m.criada_em).toDateString();
              if (m.tipo === "decisao") {
                const p = m.responde_a ? porId.get(m.responde_a) : undefined;
                return (
                  <div key={m.id} className="msg-bloco">
                    {novoDia && <div className="dia" role="separator"><span>{dia(m.criada_em)}</span></div>}
                    <Evento m={m} quem={m.user_id === eu ? "Você" : nome(m.user_id)} de={p ? autor(p) : ""} quando={hora(m.criada_em)} irPara={irPara} />
                  </div>
                );
              }
              const continua = !novoDia && !!ant && ant.user_id === m.user_id && ant.agente === m.agente && !ant.falhou &&
                ant.tipo === "mensagem" && !m.responde_a && new Date(m.criada_em).getTime() - new Date(ant.criada_em).getTime() < 5 * 60_000;
              const citada = m.responde_a ? porId.get(m.responde_a) : undefined;
              // respostas seguidas à mesma pergunta não repetem a citação: a pergunta está logo acima
              const emSequencia = !!m.responde_a && msgs.slice(msgs.findIndex((x) => x.id === m.responde_a) + 1, i)
                .every((x) => x.responde_a === m.responde_a) && porId.has(m.responde_a);
              const minhaPessoa = m.user_id === eu && !m.agente;
              const rs = perguntaATodos(m) ? respostas.get(m.id) ?? [] : null;
              const esperando = rs ? esperandoDe(m) : [];
              return (
                <div key={m.id} className="msg-bloco">
                  {novoDia && <div className="dia" role="separator"><span>{dia(m.criada_em)}</span></div>}
                  <Bolha m={m} nome={nome(m.user_id)} quando={hora(m.criada_em)} quandoCompleto={completo(m.criada_em)}
                    minha={minhaPessoa} continua={continua} chamaMim={chamaMim} destaque={destaque === m.id}
                    decisor={m.decidida_por ? (m.decidida_por === eu ? "você" : nome(m.decidida_por)) : undefined}
                    citacao={m.responde_a && !emSequencia ? { id: m.responde_a, autor: citada ? autor(citada) : "Mensagem anterior", texto: citada ? umaLinha(citada.texto, 120) : "" } : null}
                    responder={m.id > 0 ? () => responder(m) : undefined}
                    copiar={() => copiarTexto(m.texto)}
                    editar={minhaPessoa && m.tipo === "mensagem" && m.id > 0 ? (t) => editar(m.id, t) : undefined}
                    apagar={(m.user_id === eu || dono) && m.id > 0 ? () => apagar(m) : undefined}
                    decidir={m.tipo === "proposta" && m.id > 0 ? (a, n) => decidir(m.id, a, n) : undefined}
                    tentarDeNovo={() => tentarDeNovo(m)} irPara={irPara} />
                  {rs && (rs.length > 0 || esperando.length > 0) && (
                    <div className={`respostas ${minhaPessoa ? "respostas-minha" : ""}`} aria-label="Respostas dos agentes">
                      {rs.map((r) => (
                        <button key={r.id} className="resp-chip" onClick={() => irPara(r.id)}>
                          <IconeCheck tamanho={14} /> {r.agente} de {primeiro(r.user_id)}
                        </button>
                      ))}
                      {esperando.map((e) => (
                        <span key={`${e.nome}${e.dono}`} className="resp-chip resp-esperando" title={e.status}>
                          <span className="resp-anel" aria-hidden /> {e.nome} de {e.dono.split(" ")[0]} · {e.status.startsWith("ouvindo") ? "pensando" : "sem resposta"}
                        </span>
                      ))}
                      {rs.length > 0 && (
                        <button className="btn btn-pequeno" onClick={() => setComparar(m.id)}>
                          <IconeColunas tamanho={16} /> {rs.length > 1 ? "Comparar lado a lado" : "Ver resposta"}
                        </button>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>

          <Avisos />
          {temPosteriores && (
            <div className="anteriores"><button className="btn btn-pequeno" onClick={() => carregarRecentes(id)}>Ir para as mensagens mais recentes</button></div>
          )}
          <Compor key={id} ref={compor} sugestoesBase={sugestoes} respondendo={respondendo} cancelarResposta={() => setRespondendo(null)} enviar={enviar} />
        </div>

        {(painel === "ajustes" || painel === "contexto") && sala && (
          <Ajustes sala={sala} membros={membros} agentes={agentes} eu={eu} fechar={() => setPainel(null)} recarregar={recarregar}
            foco={painel === "contexto" ? "contexto" : undefined} />
        )}
        {painel === "decisoes" && sala && (
          <Decisoes salaId={sala.id} salaNome={sala.nome} versao={versaoDecisoes} autor={autor} nome={nome}
            decidir={decidir} irPara={irPara} fechar={() => setPainel(null)} />
        )}
        {painel === "busca" && sala && <Busca salaId={sala.id} autor={autor} irPara={irPara} fechar={() => setPainel(null)} />}
      </div>

      {comparando && (
        <Comparar pergunta={comparando} autorPergunta={comparando.user_id === eu ? "Você" : nome(comparando.user_id)}
          respostas={respostas.get(comparando.id) ?? []} autor={autor} esperando={esperandoDe(comparando)} fechar={() => setComparar(null)} />
      )}
    </Layout>
  );
}
