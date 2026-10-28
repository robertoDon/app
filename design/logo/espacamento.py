"""Espaçamento ótico: mede o perfil lateral de cada glifo e iguala a área de branco entre pares.

Para cada linha da faixa 0..altura-x, mede a distância da tinta até o extremo do glifo
(limitada a uma profundidade máxima, como o olho faz com a contraforma aberta).
O espaço de cada par é escolhido para que espaço + profundidade média = alvo.
"""
from letras import *

PASSO = 6
PROF = 0.22 * X   # profundidade máxima que o olho considera


def perfil(g, y0=0, y1=X):
    """Devolve (esq, dir): listas de distância da tinta ao extremo, por linha."""
    xmin, _, xmax, _ = g.bounds
    esq, dir_ = [], []
    y = y0 + PASSO / 2
    while y < y1:
        fatia = op(g, rect(xmin - 10, y, xmax + 10, y + 1), I_)
        if fatia.bounds is None or fatia.bounds == (0, 0, 0, 0):
            esq.append(PROF); dir_.append(PROF)
        else:
            a, _, b, _ = fatia.bounds
            esq.append(min(a - xmin, PROF)); dir_.append(min(xmax - b, PROF))
        y += PASSO
    return esq, dir_


def espaco_otico(gL, gR, alvo):
    _, dL = perfil(gL)
    eR, _ = perfil(gR)
    media = sum(a + b for a, b in zip(dL, eR)) / len(dL)
    return alvo - media
