import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { useAuth } from "../App";
import { abrirConectar, sb } from "../supabase";
import { t } from "../i18n";
import { IconeAgente, IconeDecisao, IconeTarefa } from "./Icones";
import { Vitrine } from "./Vitrine";

// Guia do primeiro acesso, no padrão dos apps de mercado:
// 1. boas-vindas com o produto de verdade ao lado; 2. balões que apontam para cada parte, um de cada vez;
// 3. na primeira sala aberta, o tour da sala (chamar com @, decisões, tarefas, convidar).
// Cada parte aparece uma vez por pessoa (perfis.guia_visto, perfis.guia_sala_visto) e pode ser revista em Conta.

type Passo = { alvo: string; titulo: string; texto: string; parte: "app" | "sala" };
type Lado = "direita" | "baixo" | "cima" | "centro";

const passosApp = (): Passo[] => [
  { parte: "app", alvo: "salas", titulo: t("Suas salas", "Your rooms"),
    texto: t("Uma sala por assunto ou projeto. Crie com o + e chame quem trabalha com você.",
      "One room per topic or project. Create one with + and bring in the people you work with.") },
  { parte: "app", alvo: "conectar", titulo: t("Conecte seu agente", "Connect your agent"),
    texto: t("Claude ou ChatGPT, na sua própria assinatura. Conecte uma vez e ele entra em todas as suas salas.",
      "Claude or ChatGPT, on your own subscription. Connect once and it joins all your rooms.") },
  { parte: "app", alvo: "conta", titulo: t("Sua conta", "Your account"),
    texto: t("Avisos no celular, tema, fonte, som, idioma e este guia, quando quiser rever.",
      "Phone notifications, theme, font, sound, language, and this tour if you want to see it again.") },
];

const passosSala = (): Passo[] => [
  { parte: "sala", alvo: "compor", titulo: t("Chame com @", "Mention with @"),
    texto: t("Escreva @Claude para chamar um agente, ou @agentes para todos. Eles leem a conversa e respondem aqui.",
      "Type @Claude to bring in an agent, or @agents to ask all of them. They read the conversation and reply here.") },
  { parte: "sala", alvo: "decisoes", titulo: t("Agentes propõem, pessoas decidem", "Agents propose, people decide"),
    texto: t("Quando um agente quer gastar, publicar ou mudar o plano, vira proposta. Uma pessoa aprova ou recusa, e fica registrado aqui.",
      "When an agent wants to spend money, publish or change the plan, it makes a proposal. A person approves or declines it, and the decision is recorded here.") },
  { parte: "sala", alvo: "tarefas", titulo: t("Tarefas", "Tasks"),
    texto: t("Divida o trabalho entre pessoas e agentes. Quem conclui diz o resultado.",
      "Split the work between people and agents. Whoever finishes a task reports the result.") },
  { parte: "sala", alvo: "convidar", titulo: t("Chame o time", "Bring your team"),
    texto: t("Mande o link de convite. Cada pessoa entra e conecta o próprio agente.",
      "Send the invite link. Everyone joins and connects their own agent.") },
];

// o primeiro elemento visível com data-guia=nome (há alvos com versão de computador e de celular)
const achar = (nome: string) =>
  Array.from(document.querySelectorAll<HTMLElement>(`[data-guia="${nome}"]`)).find((el) => {
    const r = el.getBoundingClientRect();
    return r.width > 0 && r.height > 0;
  }) ?? null;

const outroModalAberto = () => !!document.querySelector(".modal-fundo");

export function Guia({ pronto, emSala }: { pronto: boolean; emSala: boolean }) {
  const { perfil, recarregarPerfil } = useAuth();
  const [boasVindas, setBoasVindas] = useState(false);
  const [lista, setLista] = useState<Passo[] | null>(null);
  const [i, setI] = useState(0);
  const [foco, setFoco] = useState<DOMRect | null>(null);
  const [pos, setPos] = useState<{ top: number; left: number; lado: Lado; seta: number } | null>(null);
  const balao = useRef<HTMLDivElement>(null);
  const caixa = useRef<HTMLDivElement>(null);

  const marcar = useCallback(async (campos: ("guia_visto" | "guia_sala_visto")[]) => {
    if (!perfil) return;
    const falta = campos.filter((c) => !perfil[c]);
    if (!falta.length) return;
    const agora = new Date().toISOString();
    await sb.from("perfis").update(Object.fromEntries(falta.map((c) => [c, agora]))).eq("id", perfil.id);
    recarregarPerfil();
  }, [perfil, recarregarPerfil]);

  // monta o tour com o que está na tela agora (no celular, a lista de salas e a sala não aparecem juntas)
  const comecarTour = useCallback((partes: ("app" | "sala")[]) => {
    const l = [...(partes.includes("app") ? passosApp() : []), ...(partes.includes("sala") ? passosSala() : [])]
      .filter((p) => achar(p.alvo));
    if (!l.length) { marcar(partes.includes("sala") ? ["guia_visto", "guia_sala_visto"] : ["guia_visto"]); return; }
    setI(0); setLista(l);
  }, [marcar]);

  // primeira vez: espera a tela assentar e nenhum outro modal aberto
  useEffect(() => {
    if (!pronto || !perfil || lista || boasVindas) return;
    const appFalta = !perfil.guia_visto;
    const salaFalta = emSala && !perfil.guia_sala_visto;
    if (!appFalta && !salaFalta) return;
    let tentativas = 0;
    const h = window.setInterval(() => {
      tentativas++;
      if (outroModalAberto()) return;
      if (appFalta) { window.clearInterval(h); setBoasVindas(true); return; }
      // tour da sala: espera a sala carregar (caixa de escrever na tela)
      if (achar("compor") || tentativas > 12) { window.clearInterval(h); comecarTour(["sala"]); }
    }, 500);
    return () => window.clearInterval(h);
  }, [pronto, perfil, emSala, lista, boasVindas, comecarTour]);

  useEffect(() => {
    const rever = () => { setLista(null); setBoasVindas(true); };
    window.addEventListener("sala:guia", rever);
    return () => window.removeEventListener("sala:guia", rever);
  }, []);

  const passo = lista?.[i];
  const partesDoTour = (lista ?? []).some((p) => p.parte === "sala") ? ["guia_visto", "guia_sala_visto"] as const : ["guia_visto"] as const;
  const encerrar = useCallback(() => { setLista(null); marcar([...partesDoTour]); }, [marcar, partesDoTour]);

  // posiciona o destaque e o balão; a seta aponta para o meio do alvo
  useLayoutEffect(() => {
    if (!passo) return;
    const medir = () => {
      const r = achar(passo.alvo)?.getBoundingClientRect() ?? null;
      setFoco(r);
      const b = balao.current;
      const w = b?.offsetWidth ?? 320, h = b?.offsetHeight ?? 180, m = 16, folga = 14;
      const lim = (v: number, a: number, z: number) => Math.min(Math.max(v, a), z);
      if (!r) { setPos({ top: (innerHeight - h) / 2, left: (innerWidth - w) / 2, lado: "centro", seta: 0 }); return; }
      if (r.left < innerWidth / 3 && r.right + folga + w + m <= innerWidth) {
        const top = lim(r.top + r.height / 2 - h / 2, m, innerHeight - h - m);
        setPos({ top, left: r.right + folga, lado: "direita", seta: lim(r.top + r.height / 2 - top, 20, h - 20) });
        return;
      }
      const left = lim(r.left + r.width / 2 - w / 2, m, innerWidth - w - m);
      const seta = lim(r.left + r.width / 2 - left, 20, w - 20);
      if (r.bottom + folga + h + m <= innerHeight) setPos({ top: r.bottom + folga, left, lado: "baixo", seta });
      else setPos({ top: Math.max(m, r.top - folga - h), left, lado: "cima", seta });
    };
    medir();
    const raf = requestAnimationFrame(medir);
    addEventListener("resize", medir);
    return () => { cancelAnimationFrame(raf); removeEventListener("resize", medir); };
  }, [passo]);

  // teclado: setas andam, Esc fecha; o foco fica dentro do guia
  useEffect(() => {
    if (!lista && !boasVindas) return;
    const tecla = (e: KeyboardEvent) => {
      if (e.key === "Escape") { e.preventDefault(); if (boasVindas) { setBoasVindas(false); marcar(["guia_visto"]); } else encerrar(); return; }
      if (lista && e.key === "ArrowRight") { e.preventDefault(); setI((n) => Math.min(n + 1, lista.length - 1)); }
      if (lista && e.key === "ArrowLeft") { e.preventDefault(); setI((n) => Math.max(0, n - 1)); }
      if (e.key === "Tab") {
        const els = Array.from(caixa.current?.querySelectorAll<HTMLElement>("button") ?? []);
        if (!els.length) return;
        const at = els.indexOf(document.activeElement as HTMLElement);
        const prox = e.shiftKey ? (at <= 0 ? els.length - 1 : at - 1) : (at + 1) % els.length;
        e.preventDefault(); els[prox].focus();
      }
    };
    addEventListener("keydown", tecla);
    return () => removeEventListener("keydown", tecla);
  }, [lista, boasVindas, encerrar, marcar]);

  useEffect(() => { caixa.current?.querySelector<HTMLButtonElement>(".guia-principal")?.focus(); }, [i, lista, boasVindas]);

  if (boasVindas) {
    const primeiroNome = perfil?.nome?.split(" ")[0];
    const sozinho = () => { setBoasVindas(false); marcar(["guia_visto"]); };
    return (
      <div className="guia guia-vindas-fundo" ref={caixa}>
        <div className="guia-vindas" role="dialog" aria-modal="true" aria-labelledby="guia-vindas-titulo">
          <div className="guia-vindas-vitrine" aria-hidden><Vitrine compacta /></div>
          <div className="guia-vindas-texto">
            <span className="guia-marca">The Sala</span>
            <h1 id="guia-vindas-titulo" className="display">{primeiroNome ? t(`Boas-vindas, ${primeiroNome}.`, `Welcome, ${primeiroNome}.`) : t("Boas-vindas.", "Welcome.")}</h1>
            <p className="sub">{t("Pessoas e os agentes de IA de cada uma, trabalhando na mesma conversa.", "People and their AI agents, working in the same conversation.")}</p>
            <ul className="guia-vindas-lista">
              <li><span className="guia-vindas-icone"><IconeAgente tamanho={18} /></span>
                <div><strong>{t("Cada um traz o seu agente", "Everyone brings their own agent")}</strong>
                  <span className="nota">{t("Claude ou ChatGPT, na sua própria assinatura.", "Claude or ChatGPT, on your own subscription.")}</span></div></li>
              <li><span className="guia-vindas-icone"><IconeDecisao tamanho={18} /></span>
                <div><strong>{t("Agentes propõem, pessoas decidem", "Agents propose, people decide")}</strong>
                  <span className="nota">{t("Nada de gastar ou publicar sem o sim de alguém.", "Nothing gets spent or published without a person's yes.")}</span></div></li>
              <li><span className="guia-vindas-icone"><IconeTarefa tamanho={18} /></span>
                <div><strong>{t("Trabalho dividido", "Shared work")}</strong>
                  <span className="nota">{t("Tarefas para pessoas e agentes, com o resultado na sala.", "Tasks for people and agents, with results in the room.")}</span></div></li>
            </ul>
            <div className="guia-vindas-acoes">
              <button className="btn btn-cheio btn-grande guia-principal" onClick={() => { setBoasVindas(false); comecarTour(emSala ? ["app", "sala"] : ["app"]); }}>
                {t("Mostrar como funciona", "Show me around")}
              </button>
              <button className="link nota" onClick={sozinho}>{t("Explorar por conta própria", "I'll explore on my own")}</button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (!lista || !passo) return null;
  const ultimo = i === lista.length - 1;
  const p = 6;
  const terminaNoApp = ultimo && passo.parte === "app";

  return (
    <div className="guia" ref={caixa}>
      <div className="guia-bloqueio" onClick={(e) => e.stopPropagation()} />
      {foco
        ? <div className="guia-foco" style={{ top: foco.top - p, left: foco.left - p, width: foco.width + 2 * p, height: foco.height + 2 * p }} />
        : <div className="guia-fundo" />}
      <div ref={balao} key={i} className={`guia-balao guia-${pos?.lado ?? "centro"}`} role="dialog" aria-modal="true" aria-labelledby="guia-titulo" aria-describedby="guia-texto"
        style={pos ? { top: pos.top, left: pos.left, ["--seta" as string]: `${pos.seta}px` } : { visibility: "hidden" }}>
        <h2 id="guia-titulo">{passo.titulo}</h2>
        <p id="guia-texto">{passo.texto}</p>
        <div className="guia-acoes">
          <div className="guia-pontos" aria-label={t(`Passo ${i + 1} de ${lista.length}`, `Step ${i + 1} of ${lista.length}`)}>
            {lista.map((_, n) => <span key={n} className={n === i ? "atual" : n < i ? "feito" : ""} />)}
          </div>
          {!ultimo && <button className="link nota" onClick={encerrar}>{t("Pular", "Skip")}</button>}
          {i > 0 && <button className="btn btn-pequeno" onClick={() => setI(i - 1)}>{t("Voltar", "Back")}</button>}
          {!ultimo && <button className="btn btn-pequeno btn-cheio guia-principal" onClick={() => setI(i + 1)}>{t("Próximo", "Next")}</button>}
          {ultimo && !terminaNoApp && <button className="btn btn-pequeno btn-cheio guia-principal" onClick={encerrar}>{t("Concluir", "Done")}</button>}
          {terminaNoApp && <button className="btn btn-pequeno btn-cheio guia-principal" onClick={() => { encerrar(); abrirConectar(); }}>{t("Conectar agente", "Connect agent")}</button>}
        </div>
        {terminaNoApp && <button className="link nota guia-depois" onClick={encerrar}>{t("Conectar depois", "Connect later")}</button>}
      </div>
    </div>
  );
}
