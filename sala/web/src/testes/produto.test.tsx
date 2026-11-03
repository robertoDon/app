// Testes das partes que não podem quebrar sem ninguém ver: nomes de arquivo, pedido ao agente,
// menções, markdown seguro, presença e tarefas atrasadas.
import { describe, expect, test } from "vitest";
import { renderToStaticMarkup } from "react-dom/server";
import { atrasada, chaveDoNome, pedidoPara, presenca, type Tarefa } from "../supabase";
import { Texto, handle } from "../components/Texto";

const CHAVE_VALIDA = /^[A-Za-z0-9._-]{1,120}$/; // a mesma regra do banco (preparar_mensagem)

describe("chave do arquivo no armazenamento", () => {
  test.each([
    ["Orçamento às 10.00.00.png", "Orcamento-as-10.00.00.png"],
    ["Proposta #2.pdf", "Proposta-2.pdf"],
    ["relatório final.md", "relatorio-final.md"],
  ])("%s vira %s", (nome, chave) => expect(chaveDoNome(nome)).toBe(chave));

  test("nunca deixa .. nem barra", () => {
    for (const nome of ["../../segredo.pdf", "a/../b.txt", "..", "...pdf", " print.png", "😀.png", ""]) {
      const c = chaveDoNome(nome);
      expect(c).toMatch(CHAVE_VALIDA);
      expect(c.includes("..")).toBe(false);
    }
  });

  test("nome enorme cabe no limite", () => expect(chaveDoNome(`${"a".repeat(300)}.pdf`)).toMatch(CHAVE_VALIDA));
});

describe("pedir ao meu agente", () => {
  const m = { id: 45 };
  test("Claude e ChatGPT abrem com o pedido escrito", () => {
    const c = pedidoPara("Claude", "Follou", m, "Roberto");
    expect(c.url).toMatch(/^https:\/\/claude\.ai\/new\?q=/);
    expect(decodeURIComponent(c.url!)).toContain("#45");
    expect(pedidoPara("ChatGPT", "Follou", m, "Roberto").url).toMatch(/^https:\/\/chatgpt\.com\/\?q=/);
  });
  test("os outros copiam o texto", () => {
    const g = pedidoPara("Gemini", "Follou", m, "Roberto");
    expect(g.url).toBeNull();
    expect(g.texto).toContain("responde_a=45");
  });
});

describe("menções", () => {
  test("acento e símbolo não importam", () => {
    expect(handle("José")).toBe("jose");
    expect(handle("Claude Code")).toBe("claudecode");
  });
});

describe("markdown seguro", () => {
  const html = (t: string) => renderToStaticMarkup(<Texto texto={t} chamaMim={(x) => x === "@Ana"} />);
  test("formata negrito, link e menção", () => {
    const h = html("**oi** @Ana veja https://exemplo.com/a");
    expect(h).toContain("<strong>oi</strong>");
    expect(h).toContain("mencao-eu");
    expect(h).toContain('href="https://exemplo.com/a"');
  });
  test("não injeta HTML nem javascript:", () => {
    const h = html('<img src=x onerror=alert(1)> [x](javascript:alert(1)) <script>alert(1)</script>');
    expect(h).not.toContain("<img");
    expect(h).not.toContain("<script");
    expect(h).not.toContain('href="javascript:');
  });
});

describe("presença e prazos", () => {
  const agora = new Date();
  test("ouvindo agora", () => {
    const p = presenca({ user_id: "u", nome: "Claude Code", visto_em: agora.toISOString(), ouvindo_ate: new Date(+agora + 30_000).toISOString() });
    expect(p).toEqual({ ativo: true, texto: "ouvindo agora" });
  });
  test("visto há horas", () => {
    const p = presenca({ user_id: "u", nome: "Claude", visto_em: new Date(+agora - 3 * 3600_000).toISOString(), ouvindo_ate: null });
    expect(p.ativo).toBe(false);
    expect(p.texto).toBe("visto há 3 h");
  });
  const tarefa = (prazo: string | null, estado: Tarefa["estado"] = "aberta") => ({ prazo, estado } as Tarefa);
  test("atrasada só se aberta e com prazo vencido", () => {
    expect(atrasada(tarefa(new Date(+agora - 1000).toISOString()))).toBe(true);
    expect(atrasada(tarefa(new Date(+agora + 86_400_000).toISOString()))).toBe(false);
    expect(atrasada(tarefa(new Date(+agora - 1000).toISOString(), "feita"))).toBe(false);
    expect(atrasada(tarefa(null))).toBe(false);
  });
});
