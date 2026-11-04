import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { handle } from "./Texto";
import { IconeAgente, IconeArquivo, IconeClipe, IconeEnviar, IconeFechar, IconeProposta, IconeResponder } from "./Icones";
import type { Citacao } from "./Bolha";
import { sb, tamanhoLegivel, type Anexo } from "../supabase";
import { erro, t as tr } from "../i18n";

type Subindo = { id: string; nome: string; tamanho: number; previa?: string; anexo?: Anexo; erro?: string };

export type Sugestao = { handle: string; rotulo: string; agente?: boolean; apelidos?: string[] }; // apelidos: "@all" também acha "@everyone"
export type ComporApi = { focar: () => void; inserir: (t: string) => void; anexar: (fs: File[]) => void };

type Props = {
  sugestoesBase: Sugestao[];
  respondendo: Citacao;
  cancelarResposta: () => void;
  enviar: (texto: string, proposta: boolean, anexos: Anexo[]) => void;
  subir: (f: File) => Promise<Anexo>;
};

// Barra de escrever: @menção com sugestões, responder a uma mensagem e "fazer proposta".
export const Compor = forwardRef<ComporApi, Props>(function Compor({ sugestoesBase, respondendo, cancelarResposta, enviar, subir }, ref) {
  const [texto, setTexto] = useState("");
  const [proposta, setProposta] = useState(false);
  const [busca, setBusca] = useState<string | null>(null); // texto depois do @ que está sendo digitado
  const [escolha, setEscolha] = useState(0);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const cursorPendente = useRef<number | null>(null);
  const seletor = useRef<HTMLInputElement>(null);
  const [arquivos, setArquivos] = useState<Subindo[]>([]);
  const [estreito] = useState(() => window.matchMedia("(max-width: 480px)").matches);
  const enviando = arquivos.some((a) => !a.anexo && !a.erro);
  const prontos = arquivos.filter((a) => a.anexo).map((a) => a.anexo!);

  const anexar = (fs: File[]) => {
    const novos = fs.slice(0, 10 - arquivos.length).map((f) => ({
      id: crypto.randomUUID(), nome: f.name || tr("arquivo", "file"), tamanho: f.size,
      previa: f.type.startsWith("image/") ? URL.createObjectURL(f) : undefined, f,
    }));
    setArquivos((a) => [...a, ...novos.map(({ f: _f, ...x }) => x)]); // eslint-disable-line @typescript-eslint/no-unused-vars
    novos.forEach(({ id, f }) => subir(f)
      .then((anexo) => setArquivos((a) => a.map((x) => (x.id === id ? { ...x, anexo } : x))))
      .catch((e) => setArquivos((a) => a.map((x) => (x.id === id ? { ...x, erro: erro(e) } : x)))));
    caixa.current?.focus();
  };

  const ajustarAltura = () => {
    const c = caixa.current;
    if (c) { c.style.height = "auto"; c.style.height = `${Math.min(c.scrollHeight, 200)}px`; }
  };

  useImperativeHandle(ref, () => ({
    anexar,
    focar: () => caixa.current?.focus(),
    inserir: (t: string) => {
      const novo = texto && !texto.endsWith(" ") ? `${texto} ${t}` : texto + t;
      cursorPendente.current = novo.length;
      setTexto(novo);
    },
  }), [texto, arquivos]); // eslint-disable-line react-hooks/exhaustive-deps

  // depois de escolher uma @menção, o cursor vai para logo depois dela, no mesmo ciclo da tela
  useLayoutEffect(() => {
    const c = caixa.current;
    if (c && cursorPendente.current !== null) {
      c.focus();
      c.setSelectionRange(cursorPendente.current, cursorPendente.current);
      cursorPendente.current = null;
    }
    ajustarAltura();
  }, [texto]);

  const sugestoes = useMemo(() => {
    if (busca === null) return [];
    const b = handle(busca);
    return sugestoesBase.filter((s) => s.handle && [s.handle, ...(s.apelidos ?? [])].some((h) => handle(h).startsWith(b))).slice(0, 6);
  }, [busca, sugestoesBase]);

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
    cursorPendente.current = antes.length;
    setTexto(antes + texto.slice(cursor)); setBusca(null);
  };

  const mandar = () => {
    const t = texto.trim();
    if ((!t && !prontos.length) || enviando) return;
    enviar(t, proposta, prontos);
    arquivos.forEach((a) => a.previa && URL.revokeObjectURL(a.previa));
    setTexto(""); setBusca(null); setProposta(false); setArquivos([]);
  };

  return (
    <form className="compor" data-guia="compor" onSubmit={(e) => { e.preventDefault(); mandar(); }}>
      {sugestoes.length > 0 && (
        <ul className="sugestoes" role="listbox" aria-label={tr("Mencionar", "Mention")}>
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

      <div className={`compor-caixa ${proposta ? "compor-proposta" : ""}`} onClick={() => caixa.current?.focus()}>
        {arquivos.length > 0 && (
          <ul className="compor-arquivos" aria-label={tr("Arquivos para enviar", "Files to send")}>
            {arquivos.map((a) => (
              <li key={a.id} className={a.erro ? "erro" : a.anexo ? "" : "subindo"} title={a.erro ?? a.nome}>
                {a.previa ? <img src={a.previa} alt="" /> : <span className="anexo-icone" aria-hidden><IconeArquivo tamanho={16} /></span>}
                <span className="anexo-info"><strong>{a.nome}</strong>
                  <span className="nota">{a.erro ? tr("Não enviou", "Upload failed") : a.anexo ? tamanhoLegivel(a.tamanho) : tr("Enviando…", "Uploading…")}</span></span>
                <button type="button" className="btn-acao" aria-label={tr(`Tirar ${a.nome}`, `Remove ${a.nome}`)}
                  onClick={(e) => {
                    e.stopPropagation();
                    if (a.anexo) sb.storage.from("arquivos").remove([a.anexo.path]); // não fica guardado sem uso
                    setArquivos((x) => x.filter((y) => y.id !== a.id));
                  }}><IconeFechar tamanho={14} /></button>
              </li>
            ))}
          </ul>
        )}
        {(respondendo || proposta) && (
          <div className="compor-topo">
            {respondendo && (
              <span className="compor-chip">
                <IconeResponder tamanho={14} /> {tr("Respondendo a", "Replying to")} <strong>{respondendo.autor}</strong>
                <span className="compor-chip-texto">{respondendo.texto}</span>
                <button type="button" className="btn-acao" onClick={(e) => { e.stopPropagation(); cancelarResposta(); }} aria-label={tr("Não responder", "Cancel reply")}><IconeFechar tamanho={14} /></button>
              </span>
            )}
            {proposta && (
              <span className="compor-chip">
                <IconeProposta tamanho={14} /> <strong>{tr("Proposta", "Proposal")}</strong> · {tr("as pessoas da sala aprovam ou recusam", "people in the room approve or decline")}
              </span>
            )}
          </div>
        )}
        <div className="compor-linha">
          <label className="sr" htmlFor="texto">{tr("Mensagem", "Message")}</label>
          <textarea id="texto" ref={caixa} rows={1} value={texto}
            placeholder={proposta
              ? (estreito ? tr("O que você propõe?", "What do you propose?") : tr("O que você propõe? Diga o que muda.", "What do you propose? Say what changes."))
              : (estreito ? tr("Escreva aqui", "Write a message") : tr("Escreva aqui · @ chama alguém", "Write a message · @ to mention someone"))}
            onChange={(e) => { setTexto(e.target.value); acharBusca(e.target.value, e.target.selectionStart); }}
            onBlur={() => setBusca(null)}
            onPaste={(e) => { const fs = [...e.clipboardData.files]; if (fs.length) { e.preventDefault(); anexar(fs); } }}
            onKeyDown={(e) => {
              if (sugestoes.length) {
                if (e.key === "ArrowDown") { e.preventDefault(); setEscolha((i) => (i + 1) % sugestoes.length); return; }
                if (e.key === "ArrowUp") { e.preventDefault(); setEscolha((i) => (i - 1 + sugestoes.length) % sugestoes.length); return; }
                if (e.key === "Enter" || e.key === "Tab") { e.preventDefault(); escolher(sugestoes[escolha]); return; }
                if (e.key === "Escape") { e.preventDefault(); setBusca(null); return; }
              }
              if (e.key === "Escape" && (respondendo || proposta)) { e.preventDefault(); cancelarResposta(); setProposta(false); return; }
              if (e.key === "Enter" && !e.shiftKey && !e.nativeEvent.isComposing) { e.preventDefault(); mandar(); }
            }} />
          <input ref={seletor} type="file" multiple hidden onChange={(e) => { anexar([...(e.target.files ?? [])]); e.target.value = ""; }} />
          <button type="button" className="btn-acao btn-clipe" title={tr("Anexar arquivo (até 10 MB) · também dá para colar ou arrastar", "Attach file (up to 10 MB) · you can also paste or drag it in")} aria-label={tr("Anexar arquivo", "Attach file")}
            onClick={(e) => { e.stopPropagation(); seletor.current?.click(); }}><IconeClipe tamanho={18} /></button>
          <button type="button" className={`btn-acao btn-propor ${proposta ? "ativo" : ""}`} aria-pressed={proposta}
            onClick={(e) => { e.stopPropagation(); setProposta((v) => !v); caixa.current?.focus(); }}
            title={proposta ? tr("Voltar a mensagem comum", "Back to a regular message") : tr("Fazer uma proposta: pedir que as pessoas aprovem ou recusem", "Make a proposal: ask people to approve or decline")}>
            <IconeProposta tamanho={18} /><span className="some-celular">{proposta ? tr("Proposta", "Proposal") : tr("Propor", "Propose")}</span>
          </button>
          <button className="btn-enviar" disabled={(!texto.trim() && !prontos.length) || enviando} title={proposta ? tr("Propor (Enter)", "Propose (Enter)") : tr("Enviar (Enter)", "Send (Enter)")} aria-label={proposta ? tr("Enviar proposta", "Send proposal") : tr("Enviar", "Send")}>
            <IconeEnviar tamanho={18} />
          </button>
        </div>
      </div>
      <p className="compor-dica" aria-hidden>
        <kbd>@</kbd> {tr("chama alguém", "mentions someone")} · <kbd>{tr("@agentes", "@agents")}</kbd> {tr("pergunta a todos", "asks all agents")} · <kbd>Enter</kbd> {tr("envia", "sends")} · <kbd>Shift</kbd> + <kbd>Enter</kbd> {tr("quebra linha", "new line")}
      </p>
    </form>
  );
});
