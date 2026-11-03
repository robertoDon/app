import type { ReactNode } from "react";

// Markdown leve, montado como elementos React (nunca innerHTML): parágrafos, listas, citação,
// bloco de código, `código`, **negrito**, *itálico*, links e @menções.

export const handle = (s: string) =>
  s.normalize("NFD").replace(/[̀-ͯ]/g, "").replace(/[^A-Za-z0-9]/g, "").toLowerCase();

// Menções coletivas, em português e em inglês: @agentes = @agents; @todos = @everyone = @all.
export const AGENTES = ["agentes", "agents"];
export const TODOS = ["todos", "everyone", "all"];
/** O handle (já normalizado) chama todos os agentes da sala. */
export const chamaAgentes = (h: string) => AGENTES.includes(h);
/** O handle (já normalizado) chama todo mundo, pessoas e agentes. */
export const chamaTodos = (h: string) => TODOS.includes(h);
/** Texto com @agentes/@todos (ou @agents/@everyone/@all) como menção inteira. */
export const MENCAO_COLETIVA = new RegExp(`@(${[...AGENTES, ...TODOS].join("|")})(?![\\p{L}\\p{N}_])`, "iu");

const INLINE =
  /(`[^`\n]+`)|(\*\*[^*\n]+\*\*)|(\*[^*\s\n][^*\n]*\*|_[^_\s\n][^_\n]*_)|(https?:\/\/[^\s<]+[^\s<.,;:!?)\]'"])|(@[\p{L}\p{N}_]+(?:-[\p{L}\p{N}_]+)?)/gu;

function inline(texto: string, chamaMim: (m: string) => boolean, chave: string): ReactNode[] {
  const out: ReactNode[] = [];
  let ultimo = 0;
  let i = 0;
  for (const m of texto.matchAll(INLINE)) {
    const ini = m.index ?? 0;
    if (ini > ultimo) out.push(texto.slice(ultimo, ini));
    const k = `${chave}-${i++}`;
    const [tudo, codigo, negrito, italico, link, mencao] = m;
    if (codigo) out.push(<code key={k}>{codigo.slice(1, -1)}</code>);
    else if (negrito) out.push(<strong key={k}>{inline(negrito.slice(2, -2), chamaMim, k)}</strong>);
    else if (italico) out.push(<em key={k}>{italico.slice(1, -1)}</em>);
    else if (link) out.push(<a key={k} href={link} target="_blank" rel="noopener noreferrer">{link.replace(/^https?:\/\//, "")}</a>);
    else if (mencao) out.push(<span key={k} className={chamaMim(mencao) ? "mencao mencao-eu" : "mencao"}>{mencao}</span>);
    else out.push(tudo);
    ultimo = ini + tudo.length;
  }
  if (ultimo < texto.length) out.push(texto.slice(ultimo));
  return out;
}

type Bloco =
  | { tipo: "p" | "quote"; linhas: string[] }
  | { tipo: "ul" | "ol"; itens: string[] }
  | { tipo: "code"; texto: string }
  | { tipo: "h"; texto: string };

function blocos(texto: string): Bloco[] {
  const out: Bloco[] = [];
  const linhas = texto.replace(/\r/g, "").split("\n");
  for (let i = 0; i < linhas.length; i++) {
    const l = linhas[i];
    if (/^\s*```/.test(l)) {
      const corpo: string[] = [];
      for (i++; i < linhas.length && !/^\s*```/.test(linhas[i]); i++) corpo.push(linhas[i]);
      out.push({ tipo: "code", texto: corpo.join("\n") });
      continue;
    }
    const ul = l.match(/^\s*[-*•]\s+(.*)$/);
    const ol = l.match(/^\s*\d+[.)]\s+(.*)$/);
    const ult = out[out.length - 1];
    if (ul) { ult?.tipo === "ul" ? ult.itens.push(ul[1]) : out.push({ tipo: "ul", itens: [ul[1]] }); continue; }
    if (ol) { ult?.tipo === "ol" ? ult.itens.push(ol[1]) : out.push({ tipo: "ol", itens: [ol[1]] }); continue; }
    const h = l.match(/^#{1,4}\s+(.*)$/);
    if (h) { out.push({ tipo: "h", texto: h[1] }); continue; }
    const q = l.match(/^>\s?(.*)$/);
    if (q) { ult?.tipo === "quote" ? ult.linhas.push(q[1]) : out.push({ tipo: "quote", linhas: [q[1]] }); continue; }
    if (!l.trim()) { out.push({ tipo: "p", linhas: [] }); continue; }
    if (ult?.tipo === "p" && ult.linhas.length) ult.linhas.push(l);
    else out.push({ tipo: "p", linhas: [l] });
  }
  return out.filter((b) => !(b.tipo === "p" && !b.linhas.length));
}

export function Texto({ texto, chamaMim }: { texto: string; chamaMim: (mencao: string) => boolean }) {
  return (
    <>
      {blocos(texto).map((b, i) => {
        const k = `b${i}`;
        const linhas = (ls: string[]) => ls.flatMap((l, j) => (j ? [<br key={`${k}br${j}`} />, ...inline(l, chamaMim, `${k}l${j}`)] : inline(l, chamaMim, `${k}l${j}`)));
        switch (b.tipo) {
          case "code": return <pre key={k}><code>{b.texto}</code></pre>;
          case "ul": return <ul key={k}>{b.itens.map((t, j) => <li key={j}>{inline(t, chamaMim, `${k}i${j}`)}</li>)}</ul>;
          case "ol": return <ol key={k}>{b.itens.map((t, j) => <li key={j}>{inline(t, chamaMim, `${k}i${j}`)}</li>)}</ol>;
          case "h": return <p key={k}><strong>{inline(b.texto, chamaMim, k)}</strong></p>;
          case "quote": return <blockquote key={k}>{linhas(b.linhas)}</blockquote>;
          default: return <p key={k}>{linhas(b.linhas)}</p>;
        }
      })}
    </>
  );
}
