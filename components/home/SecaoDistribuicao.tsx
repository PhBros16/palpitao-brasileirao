// Distribuição de Palpites — donut por jogo com a % que apostou em casa /
// empate / fora. O donut é SVG (stroke-dasharray como ATRIBUTO, cores via
// utilitárias stroke-* dos tokens) — nada de inline-style.

import type { Distribuicao, JogoResumo } from './tipos'

function Donut({ d }: { d: Distribuicao }) {
  const size = 76
  const stroke = 13
  const r = (size - stroke) / 2
  const C = 2 * Math.PI * r
  const segs = [
    { pct: d.casa, cls: 'stroke-campo-100' },
    { pct: d.empate, cls: 'stroke-dourado-300' },
    { pct: d.fora, cls: 'stroke-couro-300' },
  ]
  let acc = 0
  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} className="-rotate-90 shrink-0">
      <circle cx={size / 2} cy={size / 2} r={r} fill="none" strokeWidth={stroke} className="stroke-papel-300" />
      {segs.map((s, i) => {
        const len = (s.pct / 100) * C
        const offset = C - acc
        acc += len
        return (
          <circle
            key={i}
            cx={size / 2}
            cy={size / 2}
            r={r}
            fill="none"
            strokeWidth={stroke}
            strokeDasharray={`${len} ${C - len}`}
            strokeDashoffset={offset}
            className={s.cls}
          />
        )
      })}
    </svg>
  )
}

function Legenda({ cor, label, pct }: { cor: string; label: string; pct: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={`h-2.5 w-2.5 rounded-full ${cor}`} />
      <span className="font-mono text-[10px] text-tinta-200">
        {label} <span className="font-bold text-tinta-300">{pct}%</span>
      </span>
    </div>
  )
}

export function SecaoDistribuicao({ jogos }: { jogos: JogoResumo[] }) {
  return (
    <div className="flex flex-col gap-4">
      {jogos.map((j) => (
        <div key={j.id} className="flex items-center gap-4">
          <Donut d={j.distrib} />
          <div className="min-w-0 flex-1">
            <div className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">
              {j.home} <span className="text-tinta-100">×</span> {j.away}
            </div>
            <div className="flex flex-col gap-1">
              <Legenda cor="bg-campo-100" label={`Casa (${j.home})`} pct={j.distrib.casa} />
              <Legenda cor="bg-dourado-300" label="Empate" pct={j.distrib.empate} />
              <Legenda cor="bg-couro-300" label={`Fora (${j.away})`} pct={j.distrib.fora} />
            </div>
          </div>
        </div>
      ))}
    </div>
  )
}
