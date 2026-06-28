'use client'

// Evolução — gráfico de linha dos pts acumulados por rodada, com filtros
// Top 3 + eu / Top 5 + eu / Todos. SVG puro (sem lib de chart); cores via
// utilitárias stroke-*/bg-* dos tokens — nada de inline-style.

import { useMemo, useState } from 'react'
import type { EvolucaoSerie } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Filtro = 'top3' | 'top5' | 'todos'

// Paleta literal (o JIT precisa ver as classes inteiras).
const CORES: { stroke: string; bg: string }[] = [
  { stroke: 'stroke-campo-100', bg: 'bg-campo-100' },
  { stroke: 'stroke-couro-300', bg: 'bg-couro-300' },
  { stroke: 'stroke-raridade-frango-selo', bg: 'bg-raridade-frango-selo' },
  { stroke: 'stroke-prata-200', bg: 'bg-prata-200' },
  { stroke: 'stroke-tinta-200', bg: 'bg-tinta-200' },
  { stroke: 'stroke-madeira-100', bg: 'bg-madeira-100' },
]

const W = 320
const H = 180
const PAD = { left: 26, right: 8, top: 8, bottom: 18 }

export function Evolucao({ series, totalRodadas }: { series: EvolucaoSerie[]; totalRodadas: number }) {
  const [filtro, setFiltro] = useState<Filtro>('top3')

  const visiveis = useMemo(() => {
    if (filtro === 'todos') return series
    const limite = filtro === 'top3' ? 3 : 5
    return series.filter((s) => s.posicao <= limite || s.ehVoce)
  }, [series, filtro])

  const maxY = useMemo(() => {
    const m = Math.max(1, ...series.map((s) => s.acumulado[s.acumulado.length - 1] ?? 0))
    return Math.ceil(m / 50) * 50
  }, [series])

  const n = totalRodadas
  const plotW = W - PAD.left - PAD.right
  const plotH = H - PAD.top - PAD.bottom
  const x = (i: number) => PAD.left + (n <= 1 ? 0 : (i / (n - 1)) * plotW)
  const y = (v: number) => PAD.top + (1 - v / maxY) * plotH

  return (
    <div className="flex flex-col gap-3">
      {/* Filtros */}
      <div className="flex gap-2">
        {([
          ['top3', 'Top 3 + eu'],
          ['top5', 'Top 5 + eu'],
          ['todos', 'Todos'],
        ] as [Filtro, string][]).map(([f, label]) => (
          <button
            key={f}
            type="button"
            onClick={() => setFiltro(f)}
            className={cx(
              'rounded-full px-3 py-1 font-mono text-[10px] uppercase tracking-wider transition-colors',
              filtro === f
                ? 'bg-couro-300 text-dourado-50'
                : 'bg-papel-200 text-tinta-200 hover:bg-papel-300',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {/* Gráfico */}
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
        <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label="Evolução de pontos por rodada">
          {/* Grades horizontais */}
          {[0, 0.25, 0.5, 0.75, 1].map((t) => (
            <g key={t}>
              <line
                x1={PAD.left}
                x2={W - PAD.right}
                y1={PAD.top + t * plotH}
                y2={PAD.top + t * plotH}
                className="stroke-papel-borda-200"
                strokeWidth={0.5}
              />
              <text
                x={PAD.left - 3}
                y={PAD.top + t * plotH + 3}
                textAnchor="end"
                className="fill-tinta-100 font-mono"
                fontSize={7}
              >
                {Math.round(maxY * (1 - t))}
              </text>
            </g>
          ))}
          {/* Linhas */}
          {visiveis.map((s, idx) => {
            const cor = s.ehVoce ? 'stroke-dourado-600' : CORES[idx % CORES.length].stroke
            const pts = s.acumulado.map((v, i) => `${x(i)},${y(v)}`).join(' ')
            return (
              <polyline
                key={s.nome}
                points={pts}
                fill="none"
                className={cor}
                strokeWidth={s.ehVoce ? 2.5 : 1.5}
                strokeLinejoin="round"
                strokeLinecap="round"
              />
            )
          })}
          {/* Eixo X: rótulos de algumas rodadas */}
          {Array.from({ length: n }).map((_, i) =>
            i % 3 === 0 || i === n - 1 ? (
              <text
                key={i}
                x={x(i)}
                y={H - 5}
                textAnchor="middle"
                className="fill-tinta-100 font-mono"
                fontSize={7}
              >
                R{i + 1}
              </text>
            ) : null,
          )}
        </svg>
      </div>

      {/* Legenda */}
      <div className="flex flex-wrap gap-x-3 gap-y-1">
        {visiveis.map((s, idx) => (
          <span key={s.nome} className="flex items-center gap-1.5 font-mono text-[10px] text-tinta-200">
            <span
              className={cx('h-2.5 w-2.5 rounded-full', s.ehVoce ? 'bg-dourado-600' : CORES[idx % CORES.length].bg)}
            />
            {s.nome}
            {s.ehVoce && <span className="text-dourado-600">(você)</span>}
          </span>
        ))}
      </div>
    </div>
  )
}
