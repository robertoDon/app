import { forwardRef, useImperativeHandle, useLayoutEffect, useMemo, useRef, useState } from "react";
import { handle } from "./Texto";
import { IconeAgente, IconeEnviar, IconeFechar, IconeProposta, IconeResponder } from "./Icones";
import type { Citacao } from "./Bolha";

export type Sugestao = { handle: string; rotulo: string; agente?: boolean };
export type ComporApi = { focar: () => void; inserir: (t: string) => void };

type Props = {
  sugestoesBase: Sugestao[];
  respondendo: Citacao;
  cancelarResposta: () => void;
  enviar: (texto: string, proposta: boolean) => void;
};

// Barra de escrever: @menção com sugestões, responder a uma mensagem e "fazer proposta".
export const Compor = forwardRef<ComporApi, Props>(function Compor({ sugestoesBase, respondendo, cancelarResposta, enviar }, ref) {
  const [texto, setTexto] = useState("");
  const [proposta, setProposta] = useState(false);
  const [busca, setBusca] = useState<string | null>(null); // texto depois do @ que está sendo digitado
  const [escolha, setEscolha] = useState(0);
  const caixa = useRef<HTMLTextAreaElement>(null);
  const cursorPendente = useRef<number | null>(null);

  const ajustarAltura = () => {
    const c = caixa.current;
    if (c) { c.style.height = "auto"; c.style.height = `${Math.min(c.scrollHeight, 200)}px`; }
  };

  useImperativeHandle(ref, () => ({
    focar: () => caixa.current?.focus(),
    inserir: (t: string) => {
      const novo = texto && !texto.endsWith(" ") ? `${texto} ${t}` : texto + t;
      cursorPendente.current = novo.length;
      setTexto(novo);
    },
  }), [texto]);

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
    return sugestoesBase.filter((s) => s.handle && handle(s.handle).startsWith(b)).slice(0, 6);
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
    if (!t) return;
    enviar(t, proposta);
    setTexto(""); setBusca(null); setProposta(false);
  };

  return (
    <form className="compor" onSubmit={(e) => { e.preventDefault(); mandar(); }}>
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

      <div className={`compor-caixa ${proposta ? "compor-proposta" : ""}`} onClick={() => caixa.current?.focus()}>
        {(respondendo || proposta) && (
          <div className="compor-topo">
            {respondendo && (
              <span className="compor-chip">
                <IconeResponder tamanho={14} /> Respondendo a <strong>{respondendo.autor}</strong>
                <span className="compor-chip-texto">{respondendo.texto}</span>
                <button type="button" className="btn-acao" onClick={(e) => { e.stopPropagation(); cancelarResposta(); }} aria-label="Não responder"><IconeFechar tamanho={14} /></button>
              </span>
            )}
            {proposta && (
              <span className="compor-chip">
                <IconeProposta tamanho={14} /> <strong>Proposta</strong> · as pessoas da sala aprovam ou recusam
              </span>
            )}
          </div>
        )}
        <div className="compor-linha">
          <label className="sr" htmlFor="texto">Mensagem</label>
          <textarea id="texto" ref={caixa} rows={1} value={texto}
            placeholder={proposta ? "O que você propõe? Diga o que muda." : "Escreva aqui · @ chama alguém"}
            onChange={(e) => { setTexto(e.target.value); acharBusca(e.target.value, e.target.selectionStart); }}
            onBlur={() => setBusca(null)}
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
          <button type="button" className={`btn-acao btn-propor ${proposta ? "ativo" : ""}`} aria-pressed={proposta}
            onClick={(e) => { e.stopPropagation(); setProposta((v) => !v); caixa.current?.focus(); }}
            title={proposta ? "Voltar a mensagem comum" : "Fazer uma proposta: pedir que as pessoas aprovem ou recusem"}>
            <IconeProposta tamanho={18} /><span className="some-celular">{proposta ? "Proposta" : "Propor"}</span>
          </button>
          <button className="btn-enviar" disabled={!texto.trim()} title={proposta ? "Propor (Enter)" : "Enviar (Enter)"} aria-label={proposta ? "Enviar proposta" : "Enviar"}>
            <IconeEnviar tamanho={18} />
          </button>
        </div>
      </div>
      <p className="compor-dica" aria-hidden>
        <kbd>@</kbd> chama alguém · <kbd>@agentes</kbd> pergunta a todos · <kbd>Enter</kbd> envia · <kbd>Shift</kbd> + <kbd>Enter</kbd> quebra linha
      </p>
    </form>
  );
});
