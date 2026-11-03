import { useEffect, useState } from "react";
import { sb, type Mensagem, type Tarefa } from "../supabase";
import { IconeFechar } from "./Icones";

type Props = { salaId: string; salaNome: string; autor: (m: Mensagem) => string; nome: (uid: string | null) => string; fechar: () => void };

const dia = (iso: string) => new Date(iso).toLocaleDateString("pt-BR", { day: "numeric", month: "short", year: "numeric" }).replace(".", "");
const diaHora = (iso: string) => new Date(iso).toLocaleString("pt-BR", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" }).replace(".", "");
const limpa = (t: string) => t.replace(/\s+/g, " ").trim();
const esc = (t: string) => t.replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]!);

type Dados = { propostas: Mensagem[]; notas: Map<number, string>; tarefas: Tarefa[]; conversa: Mensagem[] | null; desde: string | null };

// Ata da sala: decisões e tarefas de um período (e a conversa, se quiser), em .md ou para imprimir/PDF.
export function Ata({ salaId, salaNome, autor, nome, fechar }: Props) {
  const [dias, setDias] = useState<7 | 30 | 0>(7);
  const [incluirConversa, setConversa] = useState(false);
  const [indo, setIndo] = useState(false);

  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && fechar();
    window.addEventListener("keydown", esc);
    return () => window.removeEventListener("keydown", esc);
  }, [fechar]);

  const juntar = async (): Promise<Dados> => {
    const desde = dias ? new Date(Date.now() - dias * 864e5).toISOString() : null;
    // propostas: criadas ou decididas no período, e todas as que ainda esperam decisão
    let qp = sb.from("mensagens").select("*").eq("sala_id", salaId).eq("tipo", "proposta").eq("apagada", false).order("id");
    if (desde) qp = qp.or(`criada_em.gte.${desde},decidida_em.gte.${desde},estado.eq.pendente`);
    let qd = sb.from("mensagens").select("*").eq("sala_id", salaId).eq("tipo", "decisao").order("id");
    if (desde) qd = qd.gte("criada_em", desde);
    let qt = sb.from("tarefas").select("*").eq("sala_id", salaId).neq("estado", "cancelada").order("id");
    if (desde) qt = qt.or(`criada_em.gte.${desde},concluida_em.gte.${desde},estado.eq.aberta`);
    const [p, dec, t] = await Promise.all([qp, qd, qt]);
    let conversa: Mensagem[] | null = null;
    if (incluirConversa) {
      conversa = [];
      for (let de = 0; de < 10000; de += 1000) { // o servidor entrega no máximo 1.000 por vez
        let q = sb.from("mensagens").select("*").eq("sala_id", salaId).eq("apagada", false).order("id").range(de, de + 999);
        if (desde) q = q.gte("criada_em", desde);
        const { data } = await q;
        conversa.push(...((data as Mensagem[]) ?? []));
        if (!data || data.length < 1000) break;
      }
    }
    const notas = new Map<number, string>();
    ((dec.data as Mensagem[]) ?? []).filter((m) => m.responde_a && m.texto !== "Aprovada." && m.texto !== "Recusada.").forEach((m) => notas.set(m.responde_a!, m.texto));
    return { propostas: (p.data as Mensagem[]) ?? [], notas, tarefas: (t.data as Tarefa[]) ?? [], conversa, desde };
  };

  const quemFaz = (t: Tarefa) => (t.responsavel_agente ? `${t.responsavel_agente} de ${nome(t.responsavel).split(" ")[0]}` : t.responsavel ? nome(t.responsavel) : "sem responsável");
  const periodo = (d: Dados) => (d.desde ? `${dia(d.desde)} a ${dia(new Date().toISOString())}` : `todo o histórico, até ${dia(new Date().toISOString())}`);

  const markdown = (d: Dados) => {
    const decididas = d.propostas.filter((p) => p.estado !== "pendente");
    const pendentes = d.propostas.filter((p) => p.estado === "pendente");
    const abertas = d.tarefas.filter((t) => t.estado === "aberta");
    const feitas = d.tarefas.filter((t) => t.estado === "feita");
    const l = [`# Ata · ${salaNome}`, "", `Período: ${periodo(d)}. Gerada pelo The Sala em ${diaHora(new Date().toISOString())}.`, ""];
    l.push(`## Decisões (${decididas.length})`, "");
    if (!decididas.length) l.push("Nenhuma decisão no período.", "");
    decididas.forEach((p) => {
      l.push(`- **${p.estado === "aprovada" ? "Aprovada" : "Recusada"}** por ${nome(p.decidida_por)} em ${dia(p.decidida_em!)}. Proposta de ${autor(p)}: ${limpa(p.texto)}`);
      if (d.notas.get(p.id)) l.push(`  - Comentário: ${limpa(d.notas.get(p.id)!)}`);
    });
    if (pendentes.length) l.push("", `## Aguardando decisão (${pendentes.length})`, "", ...pendentes.map((p) => `- Proposta de ${autor(p)}: ${limpa(p.texto)}`));
    l.push("", `## Tarefas abertas (${abertas.length})`, "");
    if (!abertas.length) l.push("Nenhuma tarefa aberta.");
    abertas.forEach((t) => l.push(`- [ ] ${t.titulo} · ${quemFaz(t)}${t.prazo ? ` · até ${dia(t.prazo)}` : ""}`));
    l.push("", `## Tarefas feitas (${feitas.length})`, "");
    if (!feitas.length) l.push("Nenhuma tarefa concluída no período.");
    feitas.forEach((t) => l.push(`- [x] ${t.titulo} · feita por ${t.concluida_por_agente ? `${t.concluida_por_agente} de ${nome(t.concluida_por).split(" ")[0]}` : nome(t.concluida_por)}${t.concluida_em ? ` em ${dia(t.concluida_em)}` : ""}${t.resultado ? ` · ${limpa(t.resultado)}` : ""}`));
    if (d.conversa) {
      l.push("", `## Conversa (${d.conversa.length} mensagens)`, "");
      d.conversa.forEach((m) => l.push(`**${autor(m)}** · ${diaHora(m.criada_em)}${m.tipo === "proposta" ? " · proposta" : m.tipo === "decisao" ? " · decisão" : ""}`, "", m.texto || "(arquivo)", ...(m.anexos ?? []).map((a) => `📎 ${a.nome}`), ""));
    }
    return l.join("\n");
  };

  const html = (d: Dados) => {
    const md = markdown(d);
    const corpo = md.split("\n").map((linha) => {
      const t = esc(linha).replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>");
      if (linha.startsWith("# ")) return `<h1>${t.slice(2)}</h1>`;
      if (linha.startsWith("## ")) return `<h2>${t.slice(3)}</h2>`;
      if (linha.startsWith("  - ")) return `<p class="sub">${t.slice(4)}</p>`;
      if (linha.startsWith("- [ ] ")) return `<p class="item">☐ ${t.slice(6)}</p>`;
      if (linha.startsWith("- [x] ")) return `<p class="item">☑ ${t.slice(6)}</p>`;
      if (linha.startsWith("- ")) return `<p class="item">• ${t.slice(2)}</p>`;
      return linha ? `<p>${t}</p>` : "";
    }).join("\n");
    return `<!doctype html><html lang="pt-BR"><head><meta charset="utf-8"><title>Ata · ${esc(salaNome)}</title>
<style>body{font:14px/1.55 "IBM Plex Sans",system-ui,sans-serif;color:#18181B;max-width:720px;margin:40px auto;padding:0 24px}
h1{font:600 26px/1.2 Archivo,system-ui,sans-serif;margin:0 0 8px}h2{font:600 16px/1.3 Archivo,system-ui,sans-serif;margin:28px 0 8px;padding-top:12px;border-top:1px solid #E7E6E3}
p{margin:0 0 8px}.item{padding-left:4px}.sub{padding-left:24px;color:#5F5F66}@media print{body{margin:0}}</style></head><body>${corpo}
<p style="margin-top:32px;color:#5F5F66;font-size:12px">The Sala · um produto Don</p></body></html>`;
  };

  const nomeArquivo = `ata-${salaNome.toLowerCase().normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")}-${new Date().toISOString().slice(0, 10)}`;

  const baixar = async () => {
    setIndo(true);
    const d = await juntar();
    setIndo(false);
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([markdown(d)], { type: "text/markdown;charset=utf-8" }));
    a.download = `${nomeArquivo}.md`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  const imprimir = async () => {
    const janela = window.open("", "_blank"); // abre já no clique, para o navegador não bloquear
    setIndo(true);
    const d = await juntar();
    setIndo(false);
    if (!janela) return alert("O navegador bloqueou a nova janela. Libere janelas para esta página e tente de novo.");
    janela.document.write(html(d));
    janela.document.close();
    janela.focus();
    setTimeout(() => janela.print(), 300);
  };

  return (
    <div className="modal-fundo" onMouseDown={(e) => e.target === e.currentTarget && fechar()}>
      <div className="modal" role="dialog" aria-modal="true" aria-labelledby="ata-titulo">
        <div className="modal-topo">
          <h2 id="ata-titulo">Ata da sala</h2>
          <button className="btn-icone" onClick={fechar} aria-label="Fechar"><IconeFechar /></button>
        </div>
        <p className="sub">Decisões, o que aguarda decisão e as tarefas do período. Boa para mandar ao cliente ou levar para a reunião.</p>
        <fieldset className="opcoes">
          <legend className="rotulo">Período</legend>
          {([[7, "Últimos 7 dias"], [30, "Últimos 30 dias"], [0, "Tudo"]] as const).map(([v, r]) => (
            <label key={v} className={`opcao ${dias === v ? "marcada" : ""}`}>
              <input type="radio" name="periodo" checked={dias === v} onChange={() => setDias(v)} /><span><strong>{r}</strong></span>
            </label>
          ))}
        </fieldset>
        <label className="opcao">
          <input type="checkbox" checked={incluirConversa} onChange={(e) => setConversa(e.target.checked)} />
          <span><strong>Incluir a conversa inteira</strong><span className="nota">Fica bem mais longa. Sem ela, a ata tem só o que foi decidido e combinado.</span></span>
        </label>
        <div className="linha">
          <button className="btn btn-cheio" onClick={imprimir} disabled={indo}>Imprimir ou salvar PDF</button>
          <button className="btn" onClick={baixar} disabled={indo}>Baixar .md</button>
        </div>
      </div>
    </div>
  );
}
