'use client'

// Evolução — gráfico de linhas SVG com pontos acumulados por rodada.
//
// Toggle de escopo: Top 3+eu / Top 5+eu / Todos.
// "Eu" = participante logado (localStorage 'palpitao_sessao'), sempre
// incluído mesmo quando fora do top.
//
// SVG puro (sem biblioteca) — tema Panini fica coerente e evita bundle
// extra. Eixo X: labels de rodada (R1, R2..., E1, E2). Eixo Y: pontos
// acumulados. Legenda destacando "você" em dourado.

import { useEffect, useMemo, useState } from 'react'
import { buscarEvolucao, type EvolucaoSerie, type DadosEvolucao } from '@/lib/evolucaoReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Escopo = 'top3' | 'top5' | 'todos'

const OPCOES_ESCOPO: Array<[Escopo, string]> = [
  ['top3', 'Top 3 + eu'],
  ['top5', 'Top 5 + eu'],
  ['todos', 'Todos'],
]

// Paleta pras linhas — vibrantes e distintas, com dourado reservado pra "você"
const CORES_SERIE = [
  '#c0392b', // vermelho
  '#2980b9', // azul
  '#27ae60', // verde
  '#8e44ad', // roxo
  '#e67e22', // laranja
  '#16a085', // teal
  '#d35400', // laranja escuro
  '#2c3e50', // azul escuro
  '#c0392b', // vermelho de novo pra 9+
  '#7f8c8d', // cinza
  '#f39c12', // amarelo
  '#1abc9c', // ciano
  '#e74c3c', // vermelho claro
]
const COR_VOCE = '#B8860B' // dourado (destaque)

export function Evolucao(_props: { series?: any; totalRodadas?: number }) {
  const [dados, setDados] = useState<DadosEvolucao | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [escopo, setEscopo] = useState<Escopo>('top3')

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        setMeuId(sessao.id)
      }
    } catch { /* ignora */ }

    buscarEvolucao()
      .then(setDados)
      .catch((e) => setErro((e as Error).message))
  }, [])

  // Filtra as séries de acordo com o escopo escolhido
  const seriesFiltradas = useMemo(() => {
    if (!dados) return []
    const marcadas = dados.series.map((s) => ({ ...s, ehVoce: s.participantId === meuId }))
    const ordenadas = [...marcadas].sort((a, b) => a.posicaoFinal - b.posicaoFinal)
    if (escopo === 'todos') return ordenadas

    const N = escopo === 'top3' ? 3 : 5
    const topN = ordenadas.slice(0, N)
    // Garante que "eu" apareço mesmo se estiver fora do top
    if (meuId && !topN.some((s) => s.participantId === meuId)) {
      const eu = ordenadas.find((s) => s.participantId === meuId)
      if (eu) return [...topN, eu]
    }
    return topN
  }, [dados, meuId, escopo])

  if (erro) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-raridade-frango-selo">{erro}</div>
  }
  if (!dados) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-100">Carregando evolução...</div>
  }
  if (dados.series.length === 0 || dados.labelsRodadas.length === 0) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-200">Sem rodadas finalizadas ainda.</div>
  }

  return (
    <div className="flex flex-col gap-3">
      {/* Toggle de escopo */}
      <div className="flex gap-1 rounded-lg border border-papel-borda-200 bg-papel-100 p-1">
        {OPCOES_ESCOPO.map(([val, label]) => (
          <button
            key={val}
            type="button"
            onClick={() => setEscopo(val)}
            className={cx(
              'flex-1 rounded-md px-2 py-1.5 font-mono text-[11px] font-bold uppercase tracking-wider transition-colors',
              escopo === val ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <GraficoSVG series={seriesFiltradas} labels={dados.labelsRodadas} />
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2">
        {seriesFiltradas.map((s, i) => (
          <div key={s.participantId} className="flex items-center gap-1.5">
            <span className="h-0.5 w-4 rounded-full" style={{ background: corDaSerie(s, i, seriesFiltradas) }} />
            <span className={cx('font-sans text-[11px]', s.ehVoce ? 'font-bold text-dourado-700' : 'text-tinta-200')}>
              {s.nome}{s.ehVoce && ' (você)'}
            </span>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Gráfico SVG ─────────────────────────────────────────────────────────────

const W = 600
const H = 260
const PADDING = { top: 16, right: 24, bottom: 32, left: 40 }

function GraficoSVG({ series, labels }: { series: EvolucaoSerie[]; labels: string[] }) {
  const chartW = W - PADDING.left - PADDING.right
  const chartH = H - PADDING.top - PADDING.bottom

  const maxPts = Math.max(1, ...series.flatMap((s) => s.acumulado))
  const nRodadas = labels.length

  // Escalas
  function xAt(i: number): number {
    if (nRodadas <= 1) return PADDING.left + chartW / 2
    return PADDING.left + (i / (nRodadas - 1)) * chartW
  }
  function yAt(pts: number): number {
    return PADDING.top + chartH - (pts / maxPts) * chartH
  }

  // Grid horizontal (linhas de referência) — 5 divisões
  const gridTicks = [0, 0.25, 0.5, 0.75, 1].map((t) => ({
    y: PADDING.top + chartH * (1 - t),
    valor: Math.round(maxPts * t),
  }))

  // Labels do eixo X: escolhe até 8 pra não empilhar
  const passo = Math.max(1, Math.ceil(nRodadas / 8))
  const xTicks = labels
    .map((label, i) => ({ label, i }))
    .filter(({ i }) => i % passo === 0 || i === nRodadas - 1)

  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full">
      {/* Fundo do gráfico (levemente destacado) */}
      <rect
        x={PADDING.left}
        y={PADDING.top}
        width={chartW}
        height={chartH}
        fill="rgba(255, 250, 235, 0.4)"
      />

      {/* Grid horizontal */}
      {gridTicks.map((t, i) => (
        <g key={i}>
          <line
            x1={PADDING.left}
            y1={t.y}
            x2={PADDING.left + chartW}
            y2={t.y}
            stroke="rgba(120, 90, 60, 0.15)"
            strokeWidth={1}
            strokeDasharray={i === 0 || i === gridTicks.length - 1 ? '' : '3 3'}
          />
          <text
            x={PADDING.left - 6}
            y={t.y + 3}
            textAnchor="end"
            fontSize={9}
            fill="rgba(80, 60, 40, 0.7)"
            fontFamily="monospace"
          >
            {t.valor}
          </text>
        </g>
      ))}

      {/* Labels eixo X */}
      {xTicks.map(({ label, i }) => (
        <text
          key={i}
          x={xAt(i)}
          y={H - PADDING.bottom + 14}
          textAnchor="middle"
          fontSize={9}
          fill="rgba(80, 60, 40, 0.7)"
          fontFamily="monospace"
        >
          {label}
        </text>
      ))}

      {/* Linhas das séries */}
      {series.map((s, idx) => {
        const cor = corDaSerie(s, idx, series)
        const pontos = s.acumulado.map((pts, i) => `${xAt(i)},${yAt(pts)}`).join(' ')
        return (
          <g key={s.participantId}>
            <polyline
              points={pontos}
              fill="none"
              stroke={cor}
              strokeWidth={s.ehVoce ? 2.5 : 1.5}
              strokeLinejoin="round"
              strokeLinecap="round"
              opacity={s.ehVoce ? 1 : 0.85}
            />
            {/* Bolinha no último ponto */}
            <circle
              cx={xAt(nRodadas - 1)}
              cy={yAt(s.acumulado[s.acumulado.length - 1] ?? 0)}
              r={s.ehVoce ? 4 : 3}
              fill={cor}
              stroke="white"
              strokeWidth={1.5}
            />
          </g>
        )
      })}
    </svg>
  )
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

function corDaSerie(serie: EvolucaoSerie, idx: number, todas: EvolucaoSerie[]): string {
  if (serie.ehVoce) return COR_VOCE
  // Distribui as cores excluindo o índice do "eu" (se houver) pra não pular
  // uma cor da paleta
  const indicesExcetoVoce = todas.map((s, i) => (s.ehVoce ? -1 : i)).filter((i) => i >= 0)
  const posicaoNaPaleta = indicesExcetoVoce.indexOf(idx)
  return CORES_SERIE[posicaoNaPaleta % CORES_SERIE.length]
}
