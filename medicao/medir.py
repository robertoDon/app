"""Mede o custo real de enriquecer uma empresa na Caçada da Dalva.

Para cada CNPJ de empresas.csv:
  1. Receita via BrasilAPI (grátis): razão social, setor, cidade, idade, sócio-administrador.
  2. Até 2 buscas na web (Serper): site, Google, vagas e notícias.
  3. Uma chamada à IA que lê só o que as buscas trouxeram e monta o card + o "por que agora".

Grava resultados/<data>.csv (uma linha por empresa, com colunas para conferir à mão)
e resultados/<data>-resumo.md (custo por empresa, taxa de acerto, tempo).

Uso:
  python medicao/medir.py                 # roda tudo
  python medicao/medir.py --so-receita    # só o passo 1, sem gastar nada
  python medicao/medir.py --limite 5      # só as 5 primeiras

Chaves (variáveis de ambiente, nunca no código): SEARCH_API_KEY (Serper) e DALVA_ANTHROPIC_KEY.
O nome ANTHROPIC_API_KEY é reservado pelo Claude Code no ambiente da nuvem e não chega ao script.
"""

import argparse
import csv
import json
import os
import re
import statistics
import sys
import time
from datetime import date
from pathlib import Path

import requests

AQUI = Path(__file__).parent

# Preços: confira antes de rodar. Dólar como no capítulo 4 do canvas.
DOLAR = float(os.environ.get("DOLAR", "5.10"))
MODELO = os.environ.get("MODELO", "claude-haiku-5-5")
# US$ por 1M de tokens (entrada, saída), tabela de 06/10/2026
PRECO_IA = {
    "claude-haiku-5-5": (0.10, 0.50),
    "claude-sonnet-5-5": (2.00, 10.00),
    "claude-opus-5-5": (4.00, 20.00),
}
# US$ por busca. Serper Starter: US$ 50 por 50.000 buscas (serper.dev, 28/10/2026).
# Os planos maiores chegam a US$ 0,0003. As 2.500 buscas grátis da conta nova não entram na conta.
PRECO_BUSCA = float(os.environ.get("PRECO_BUSCA_USD", "0.001"))

SCHEMA = {
    "type": "object",
    "properties": {
        "site": {"type": ["string", "null"]},
        "instagram": {"type": ["string", "null"]},
        "telefone_comercial": {"type": ["string", "null"]},
        "nota_google": {"type": ["number", "null"]},
        "avaliacoes_google": {"type": ["integer", "null"]},
        "vaga_aberta": {"type": ["string", "null"]},
        "noticia_recente": {"type": ["string", "null"]},
        "por_que_agora": {"type": ["string", "null"]},
        "fontes": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["site", "instagram", "telefone_comercial", "nota_google", "avaliacoes_google",
                 "vaga_aberta", "noticia_recente", "por_que_agora", "fontes"],
    "additionalProperties": False,
}

INSTRUCAO = """Você monta o card de uma empresa para um dono de pequena empresa que quer vender para ela.
Use só o que está nos resultados de busca abaixo. Se um campo não aparece neles, devolva null. Nunca invente.
Ignore resultados que sejam de outra empresa com nome parecido (confira cidade e setor).
telefone_comercial: só telefone da empresa publicado no site ou no Google. Nunca celular pessoal de sócio.
vaga_aberta e noticia_recente: uma frase curta, só se for dos últimos 6 meses.
por_que_agora: uma frase, em português simples, com o motivo para abordar agora, apoiado num sinal acima. Se não houver sinal, null.
fontes: as URLs que você usou."""


def receita(cnpj):
    # A BrasilAPI limita chamadas seguidas; espera e tenta de novo.
    for tentativa in range(5):
        r = requests.get(f"https://brasilapi.com.br/api/cnpj/v1/{cnpj}", timeout=30)
        if r.status_code != 429:
            break
        time.sleep(4 * (tentativa + 1))
    r.raise_for_status()
    d = r.json()
    adm = next((s["nome_socio"] for s in d.get("qsa") or []
                if "administrador" in (s.get("qualificacao_socio") or "").lower()), None)
    return {
        "razao_social": d.get("razao_social"),
        "nome_fantasia": d.get("nome_fantasia") or "",
        "setor": d.get("cnae_fiscal_descricao"),
        "cidade": (d.get("municipio") or "").title(),
        "uf": d.get("uf"),
        "desde": (d.get("data_inicio_atividade") or "")[:4],
        "porte": d.get("porte"),
        "situacao": d.get("descricao_situacao_cadastral"),
        "socio_adm": adm,
    }


def nome_curto(emp):
    nome = emp["nome_fantasia"] or emp["razao_social"]
    return re.sub(r"\b(LTDA|ME|EPP|EIRELI|S/?A|SOCIEDADE UNIPESSOAL)\b\.?", "", nome, flags=re.I).strip(" -.")


def buscar(q):
    r = requests.post("https://google.serper.dev/search",
                      headers={"X-API-KEY": os.environ["SEARCH_API_KEY"]},
                      json={"q": q, "gl": "br", "hl": "pt-br", "num": 10}, timeout=30)
    r.raise_for_status()
    d = r.json()
    partes = []
    kg = d.get("knowledgeGraph")
    if kg:
        partes.append("Painel do Google: " + json.dumps(kg, ensure_ascii=False))
    for o in d.get("organic", [])[:8]:
        partes.append(f"- {o.get('title')} | {o.get('link')} | {o.get('snippet')} {o.get('date', '')}")
    return "\n".join(partes)


def resumir(cliente, emp, achados):
    texto = (f"Empresa (Receita Federal): {json.dumps(emp, ensure_ascii=False)}\n\n"
             f"Resultados de busca:\n{achados}")
    resp = cliente.messages.create(
        model=MODELO,
        max_tokens=2000,
        output_config={"effort": "low", "format": {"type": "json_schema", "schema": SCHEMA}},
        system=INSTRUCAO,
        messages=[{"role": "user", "content": texto}],
    )
    if resp.stop_reason == "refusal":
        return None, resp.usage
    txt = next(b.text for b in resp.content if b.type == "text")
    return json.loads(txt), resp.usage


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entrada", default=AQUI / "empresas.csv")
    ap.add_argument("--so-receita", action="store_true")
    ap.add_argument("--limite", type=int)
    a = ap.parse_args()

    with open(a.entrada, newline="") as f:
        cnpjs = [re.sub(r"\D", "", l["cnpj"]) for l in csv.DictReader(f) if l.get("cnpj")]
    cnpjs = cnpjs[: a.limite] if a.limite else cnpjs

    cliente = None
    if not a.so_receita:
        faltam = [k for k in ("SEARCH_API_KEY", "DALVA_ANTHROPIC_KEY") if not os.environ.get(k)]
        if faltam:
            sys.exit(f"Falta configurar no ambiente: {', '.join(faltam)}. Ou rode com --so-receita.")
        import anthropic
        cliente = anthropic.Anthropic(api_key=os.environ["DALVA_ANTHROPIC_KEY"])
    ent, sai = PRECO_IA[MODELO] if not a.so_receita else (0, 0)

    linhas = []
    for i, cnpj in enumerate(cnpjs, 1):
        t0 = time.time()
        linha = {"cnpj": cnpj}
        try:
            emp = receita(cnpj)
        except requests.RequestException as e:
            print(f"{i:>3} {cnpj} Receita falhou: {e}")
            continue
        linha.update(emp)
        if cliente:
            nome = nome_curto(emp)
            achados = buscar(f'"{nome}" {emp["cidade"]}')
            buscas = 1
            # Segunda busca só para os sinais (vaga, notícia), que dão o "por que agora".
            achados += "\n\n" + buscar(f'"{nome}" vaga OR contratando OR notícia')
            buscas += 1
            card, uso = resumir(cliente, emp, achados)
            custo_ia = (uso.input_tokens * ent + uso.output_tokens * sai) / 1e6
            custo = (custo_ia + buscas * PRECO_BUSCA) * DOLAR
            card = card or {}
            sinais = [k for k in ("site", "instagram", "telefone_comercial", "nota_google",
                                  "vaga_aberta", "noticia_recente") if card.get(k) is not None]
            linha.update({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, list) else v)
                          for k, v in card.items()})
            linha.update({
                "achou_algo": "sim" if sinais else "não",
                "buscas": buscas,
                "tokens_entrada": uso.input_tokens,
                "tokens_saida": uso.output_tokens,
                "custo_rs": round(custo, 4),
                # Para o Roberto e o David preencherem à mão:
                "empresa_certa (s/n)": "",
                "dados_corretos (s/n)": "",
                "por_que_agora_serve (s/n)": "",
            })
        linha["segundos"] = round(time.time() - t0, 1)
        linhas.append(linha)
        print(f"{i:>3} {emp['razao_social'][:40]:<40} {linha.get('custo_rs', '-')} R$ {linha['segundos']}s")

    if not linhas:
        sys.exit("Nenhuma empresa processada.")
    pasta = AQUI / "resultados"
    pasta.mkdir(exist_ok=True)
    base = pasta / f"{date.today()}{'-receita' if a.so_receita else ''}"
    campos = list(dict.fromkeys(k for l in linhas for k in l))
    with open(f"{base}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(linhas)

    n = len(linhas)
    res = [f"# Medição {date.today()}", "", f"Empresas: {n}"]
    res.append(f"Com sócio-administrador na Receita: {sum(1 for l in linhas if l.get('socio_adm'))} de {n}")
    if cliente:
        custos = [l["custo_rs"] for l in linhas]
        achou = [l for l in linhas if l["achou_algo"] == "sim"]
        res += [
            f"Modelo: {MODELO} · busca a US$ {PRECO_BUSCA} · dólar R$ {DOLAR}",
            f"Custo médio por empresa: R$ {statistics.mean(custos):.4f}",
            f"Custo mais alto: R$ {max(custos):.4f}",
            f"Achou algum sinal: {len(achou)} de {n}",
            f"Custo por empresa com sinal (o que viraria 1 crédito cobrado): R$ {sum(custos) / max(len(achou), 1):.4f}",
            f"Tempo médio: {statistics.mean(l['segundos'] for l in linhas):.1f}s",
            "",
            "Falta a conferência manual: preencher as 3 colunas (s/n) no CSV.",
        ]
    Path(f"{base}-resumo.md").write_text("\n".join(res) + "\n")
    print("\n".join(res))


if __name__ == "__main__":
    main()
