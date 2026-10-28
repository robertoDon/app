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
        "confianca_empresa": {"type": "string", "enum": ["alta", "media", "baixa"]},
        "site": {"type": ["string", "null"]},
        "instagram": {"type": ["string", "null"]},
        "telefone_comercial": {"type": ["string", "null"]},
        "nota_google": {"type": ["number", "null"]},
        "avaliacoes_google": {"type": ["integer", "null"]},
        "vaga_aberta": {"type": ["string", "null"]},
        "noticia_recente": {"type": ["string", "null"]},
        "sinal_data": {"type": ["string", "null"]},
        "sinal_fonte": {"type": ["string", "null"]},
        "por_que_agora": {"type": ["string", "null"]},
        "por_que_agora_tipo": {"anyOf": [{"type": "string", "enum": ["fato", "hipotese"]}, {"type": "null"}]},
        "fontes": {"type": "array", "items": {"type": "string"}},
    },
    "required": ["confianca_empresa", "site", "instagram", "telefone_comercial", "nota_google",
                 "avaliacoes_google", "vaga_aberta", "noticia_recente", "sinal_data", "sinal_fonte",
                 "por_que_agora", "por_que_agora_tipo", "fontes"],
    "additionalProperties": False,
}

HOJE = date.today()
# O "por que agora" depende do que o usuário da Dalva vende. Na Caçada, vem da frase dele.
OFERTA = os.environ.get("OFERTA", "consultoria que estrutura o comercial (prospecção, funil e proposta) de agências e software houses pequenas")
VAGAS = ("gupy.io", "geekhunter", "linkedin.com/jobs", "programathor", "solides", "vagas.com", "indeed",
         "infojobs", "catho", "trampos.co", "jobleads", "99jobs", "kenoby", "inhire")

INSTRUCAO = f"""Você monta o card de uma empresa para um dono de pequena empresa que quer vender para ela. Hoje é {HOJE:%d/%m/%Y}.
Quem vai abordar vende: {OFERTA}.
Use só o que está no material abaixo (cadastro da Receita, verificação do site e resultados de busca). Se um dado não aparece, devolva null. Nunca invente.

1. Primeiro confira se é a mesma empresa. confianca_empresa:
   - alta: o site ou a fonte mostra o mesmo CNPJ, o mesmo endereço ou o mesmo telefone da Receita.
   - media: mesmo nome, mesma cidade e mesmo ramo, sem CNPJ, endereço ou telefone para confirmar.
   - baixa: só o nome parece. Outra cidade, outro ramo ou CNPJ diferente é outra empresa: nesse caso devolva baixa e todos os campos null.
2. site: só o domínio próprio da empresa. Nunca diretório, agregador de CNPJ, rede social ou página vazia.
3. instagram: só o endereço do perfil (instagram.com/usuario). Nunca um post, reel ou perfil de outra empresa que cita esta.
4. telefone_comercial: só telefone publicado no site ou no Google que seja DIFERENTE do telefone da Receita. Se for igual, null.
5. vaga_aberta e noticia_recente: uma frase curta com o fato e a data, só se for dos últimos 12 meses.
6. por_que_agora: um gancho de venda para quem vende a oferta acima, numa frase, em português simples. Dois tipos:
   - fato: um acontecimento dos últimos 12 meses que mostra mudança na empresa: vaga aberta ou contratação (vaga confirmada
     aberta numa página de vagas vale mesmo sem data), sócio que entrou no último ano (campo socio_entrou_ultimo_ano, fonte
     "Receita Federal"), empresa aberta no último ano (campo aberta_no_ultimo_ano, fonte "Receita Federal"), nova sede ou filial, produto ou serviço novo, contrato ou cliente novo, prêmio, investimento, expansão.
     Leia com cuidado: prorrogação de contrato não é contrato novo.
   - hipotese: uma leitura que liga um dado VERIFICADO acima à oferta de quem vai abordar (ex.: "contratou dev e não tem
     ninguém de vendas: o comercial deve estar no fundador"). Diga o dado em que ela se apoia. Nunca uma frase genérica.
   Prefira fato. Rotina, post comum, convênio genérico ou "a empresa está ativa" não valem. Sem base: null.
   sinal_data (mês/ano, ou "aberta hoje" para vaga confirmada) e sinal_fonte (URL ou "Receita Federal") são obrigatórios.
7. fontes: as URLs que você usou."""


def receita(cnpj):
    # A BrasilAPI limita chamadas seguidas; espera e tenta de novo.
    for tentativa in range(5):
        r = requests.get(f"https://brasilapi.com.br/api/cnpj/v1/{cnpj}", timeout=30)
        if r.status_code != 429:
            break
        time.sleep(4 * (tentativa + 1))
    r.raise_for_status()
    d = r.json()
    um_ano = f"{date.today().year - 1}{date.today():-%m-%d}"
    novos = [s["nome_socio"] for s in d.get("qsa") or [] if (s.get("data_entrada_sociedade") or "") >= um_ano]
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
        "telefone_receita": d.get("ddd_telefone_1") or "",
        "endereco": " ".join(x for x in (d.get("logradouro"), d.get("numero"), d.get("bairro")) if x),
        "cep": d.get("cep") or "",
        "socio_entrou_ultimo_ano": ", ".join(novos),
        "aberta_no_ultimo_ano": (d.get("data_inicio_atividade") or "") >= um_ano,
    }


def nome_curto(emp):
    nome = emp["nome_fantasia"] or emp["razao_social"]
    return re.sub(r"\b(LTDA|ME|EPP|EIRELI|S/?A|SOCIEDADE UNIPESSOAL)\b\.?", "", nome, flags=re.I).strip(" -.")


# Sites que só repetem o cadastro da Receita: não trazem dado novo e confundem a IA.
AGREGADORES = ("cnpj.biz", "econodata", "cnpja", "casadosdados", "cnpj.info", "cnpj.ws", "cnpjs.rocks",
               "serasa", "solutudo", "empresasdobrasil", "consultasocio", "informecadastral", "cylex",
               "apontador", "listamais", "telelistas", "empresaqui", "guiamais", "jusbrasil", "transparencia.cc",
               "cadastroempresa", "cnpjcheck", "speedio", "b2bleads", "dadosmarket", "empresas.org")
SEM_AGREGADORES = " ".join(f"-site:{d}" for d in ("cnpj.biz", "econodata.com.br", "cnpja.com", "casadosdados.com.br", "solutudo.com.br"))


def eh_agregador(url):
    return any(a in (url or "") for a in AGREGADORES)


def buscar(q, recente=False):
    corpo = {"q": q, "gl": "br", "hl": "pt-br", "num": 10}
    if recente:
        corpo["tbs"] = "qdr:y"  # só o último ano
    r = requests.post("https://google.serper.dev/search",
                      headers={"X-API-KEY": os.environ["SEARCH_API_KEY"]}, json=corpo, timeout=30)
    r.raise_for_status()
    d = r.json()
    partes, links = [], []
    kg = d.get("knowledgeGraph")
    if kg:
        partes.append("Painel do Google: " + json.dumps(kg, ensure_ascii=False))
    for o in d.get("organic", []):
        if eh_agregador(o.get("link")):
            continue
        partes.append(f"- {o.get('title')} | {o.get('link')} | {o.get('snippet')} {o.get('date', '')}")
        links.append(o.get("link") or "")
        if len(links) == 8:
            break
    return "\n".join(partes), links


SOCIAIS = ("instagram.", "facebook.", "linkedin.", "youtube.", "tiktok.", "twitter.", "x.com", "wa.me",
           "google.", "gupy", "indeed", "glassdoor", "vagas.com", "infojobs", "catho", "reclameaqui")


def so_digitos(t):
    return re.sub(r"\D", "", t or "")


def conferir_vagas(links):
    """Abre anúncios de vaga (de graça) e devolve o começo do texto: a IA vê se está aberta e a data."""
    saida = []
    for url in [u for u in links if any(v in u for v in VAGAS)][:2]:
        try:
            v = requests.get(url, timeout=8, headers={"User-Agent": "DalvaBot/0.1 (medição de enriquecimento)"})
        except requests.RequestException:
            continue
        if v.status_code != 200:
            saida.append(f"Anúncio {url}: não abriu (HTTP {v.status_code}).")
            continue
        t = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<(script|style).*?</\1>", " ", v.text)))
        saida.append(f"Anúncio {url}: {t[:700]}")
    return "\n".join(saida)


def conferir_site(emp, links):
    """Abre o primeiro site candidato (de graça) e diz se ele bate com a Receita."""
    for url in links:
        if not url or eh_agregador(url) or any(s in url for s in SOCIAIS):
            continue
        dominio = re.sub(r"^https?://(www\.)?", "", url).split("/")[0]
        try:
            r = requests.get(f"https://{dominio}", timeout=8, headers={"User-Agent": "DalvaBot/0.1 (medição de enriquecimento)"})
        except requests.RequestException:
            continue
        html = r.text
        texto = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<(script|style).*?</\1>", " ", html)))
        dig = so_digitos(texto)
        tel = so_digitos(emp["telefone_receita"])[-8:]
        confere = {
            "cnpj": emp["cnpj"] in dig,
            "cep": bool(emp["cep"]) and emp["cep"] in dig,
            "telefone": bool(tel) and tel in dig,
            "cidade": emp["cidade"].lower() in texto.lower(),
        }
        vagas = sorted({m for m in re.findall(r'href="([^"]*(?:vaga|carreira|trabalhe|careers|jobs)[^"]*)"', html, re.I)})[:1]
        pagina_vagas = ""
        if vagas:
            link = vagas[0] if vagas[0].startswith("http") else f"https://{dominio}/{vagas[0].lstrip('/')}"
            try:
                v = requests.get(link, timeout=8, headers={"User-Agent": "DalvaBot/0.1 (medição de enriquecimento)"}).text
                v = re.sub(r"\s+", " ", re.sub(r"<[^>]+>", " ", re.sub(r"(?s)<(script|style).*?</\1>", " ", v)))
                pagina_vagas = f"\nPágina de vagas ({link}): {v[:800]}"
            except requests.RequestException:
                pass
        anos = [int(a) for a in re.findall(r"(?:©|copyright|&copy;)\s*(?:\d{4}\s*[-–]\s*)?(20\d\d)", html, re.I)]
        return (f"Verificação do site {dominio}: mostra o CNPJ: {confere['cnpj']}; o CEP: {confere['cep']}; "
                f"o telefone da Receita: {confere['telefone']}; a cidade: {confere['cidade']}; "
                f"ano do copyright: {max(anos) if anos else 'não aparece'}."
                f"\nTrecho do site: {texto[:1200]}{pagina_vagas}")
    return "Verificação do site: nenhum site próprio encontrado nos resultados."


def resumir(cliente, emp, achados):
    texto = f"Empresa (Receita Federal): {json.dumps(emp, ensure_ascii=False)}\n\n{achados}"
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


def limpar(card, emp):
    """Regras que não dependem da IA."""
    if card.get("confianca_empresa") == "baixa":
        return {k: ([] if k == "fontes" else None) for k in card} | {"confianca_empresa": "baixa"}
    ig = card.get("instagram")
    if ig and not re.fullmatch(r"(https?://)?(www\.)?instagram\.com/[A-Za-z0-9_.]+/?", ig):
        card["instagram"] = None
    if card.get("site") and (eh_agregador(card["site"]) or any(s in card["site"] for s in SOCIAIS)):
        card["site"] = None
    tel = so_digitos(card.get("telefone_comercial"))
    if tel and (tel[-8:] == so_digitos(emp["telefone_receita"])[-8:] or len(set(tel[-8:])) <= 2):
        card["telefone_comercial"] = None
    if card.get("por_que_agora") and not (card.get("sinal_data") and card.get("sinal_fonte")):
        card["por_que_agora"] = None
    if not card.get("por_que_agora"):
        card["por_que_agora_tipo"] = None
    return card


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("--entrada", default=AQUI / "empresas.csv")
    ap.add_argument("--so-receita", action="store_true")
    ap.add_argument("--limite", type=int)
    ap.add_argument("--nome", help="nome dos arquivos de saída (padrão: a data de hoje)")
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
        emp["cnpj"] = cnpj
        linha.update(emp)
        if cliente:
            nome = nome_curto(emp)
            achados, links = buscar(f'"{nome}" {emp["cidade"]} {SEM_AGREGADORES}')
            buscas = 1
            # Segunda busca só para os sinais do último ano, que dão o "por que agora".
            sinais, links2 = buscar(f'"{nome}" (vaga OR contrata OR lança OR inaugura OR "novo cliente" OR prêmio OR expansão)', recente=True)
            buscas += 1
            achados = conferir_site(emp, links + links2) + "\n" + conferir_vagas(links + links2) + "\n\nResultados de busca:\n" + achados + "\n\nSinais do último ano:\n" + sinais
            card, uso = resumir(cliente, emp, achados)
            custo_ia = (uso.input_tokens * ent + uso.output_tokens * sai) / 1e6
            custo = (custo_ia + buscas * PRECO_BUSCA) * DOLAR
            card = limpar(card or {}, emp)
            # Só conta o que é novo: telefone e cadastro da Receita não entram.
            novos = [k for k in ("site", "instagram", "telefone_comercial", "vaga_aberta", "noticia_recente")
                     if card.get(k) is not None]
            linha.update({k: (json.dumps(v, ensure_ascii=False) if isinstance(v, list) else v)
                          for k, v in card.items()})
            linha.update({
                "achou_algo": "sim" if novos else "não",
                "tem_por_que_agora": card.get("por_que_agora_tipo") or "não",
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
    base = pasta / (a.nome or f"{date.today()}{'-receita' if a.so_receita else ''}")
    campos = list(dict.fromkeys(k for l in linhas for k in l))
    with open(f"{base}.csv", "w", newline="") as f:
        w = csv.DictWriter(f, fieldnames=campos)
        w.writeheader()
        w.writerows(linhas)

    n = len(linhas)
    res = [f"# Medição {base.name}", "", f"Empresas: {n}"]
    res.append(f"Com sócio-administrador na Receita: {sum(1 for l in linhas if l.get('socio_adm'))} de {n}")
    if cliente:
        custos = [l["custo_rs"] for l in linhas]
        achou = [l for l in linhas if l["achou_algo"] == "sim"]
        gancho = [l for l in linhas if l["tem_por_que_agora"] != "não"]
        fatos = [l for l in linhas if l["tem_por_que_agora"] == "fato"]
        res += [
            f"Modelo: {MODELO} · busca a US$ {PRECO_BUSCA} · dólar R$ {DOLAR}",
            f"Custo médio por empresa: R$ {statistics.mean(custos):.4f}",
            f"Custo mais alto: R$ {max(custos):.4f}",
            f"Com dado novo (site, Instagram, telefone novo, vaga ou notícia): {len(achou)} de {n}",
            f"Com por que agora: {len(gancho)} de {n} ({len(fatos)} fato, {len(gancho) - len(fatos)} hipótese)",
            f"Custo por empresa com dado novo: R$ {sum(custos) / max(len(achou), 1):.4f}",
            f"Custo por empresa com por que agora: R$ {sum(custos) / max(len(gancho), 1):.4f}",
            f"Tempo médio: {statistics.mean(l['segundos'] for l in linhas):.1f}s",
            "",
            "Falta a conferência manual: preencher as 3 colunas (s/n) no CSV.",
        ]
    Path(f"{base}-resumo.md").write_text("\n".join(res) + "\n")
    print("\n".join(res))


if __name__ == "__main__":
    main()
