// Minhas Estatísticas — heatmap de pts por rodada + cartões + sequências.

import type { MinhasEstatisticas } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Bucket de cor do heatmap por pts da rodada. */
function heatClasse(pts: number): string {
  if (pts <= 0) return 'bg-papel-300 text-tinta-100'
  if (pts <= 5) return 'bg-dourado-100 text-tinta-300'
  if (pts <= 10) return 'bg-dourado-300 text-tinta-300'
  return 'bg-verde-badge text-papel-50'
}

export function Estatisticas({ e }: { e: MinhasEstatisticas }) {
  return (
    <div className="flex flex-col gap-5">
      {/* Cartões */}
      <div className="grid grid-cols-4 gap-2">
        <Card label="Cravadas" valor={e.cravadas} />
        <Card label="Vencedor" valor={e.vencedor} />
        <Card label="Saldo" valor={e.saldo} />
        <Card label="Média" valor={e.mediaPts.toFixed(1)} />
      </div>

      {/* Heatmap */}
      <div>
        <h3 className="mb-2 font-display text-sm font-bold text-tinta-300">Performance por Rodada</h3>
        <div className="flex flex-wrap gap-1.5">
          {e.ptsPorRodada.map((pts, i) => (
            <div
              key={i}
              title={`Rodada ${i + 1}: ${pts} pts`}
              className={cx(
                'flex h-9 w-9 flex-col items-center justify-center rounded-md',
                heatClasse(pts),
              )}
            >
              <span className="font-mono text-[11px] font-bold leading-none">{pts}</span>
              <span className="font-mono text-[7px] leading-none opacity-70">R{i + 1}</span>
            </div>
          ))}
        </div>
        <div className="mt-2 flex flex-wrap gap-x-3 font-mono text-[9px] text-tinta-100">
          <Leg cor="bg-papel-300" txt="0" />
          <Leg cor="bg-dourado-100" txt="1–5" />
          <Leg cor="bg-dourado-300" txt="6–10" />
          <Leg cor="bg-verde-badge" txt="11+" />
        </div>
      </div>

      {/* Sequências */}
      <div>
        <h3 className="mb-2 font-display text-sm font-bold text-tinta-300">Sequências</h3>
        <div className="flex flex-col gap-1.5">
          {e.sequencias.map((s, i) => (
            <div
              key={i}
              className="flex items-center justify-between rounded-md border border-papel-borda-200 bg-papel-50 px-3 py-2"
            >
              <span className="font-sans text-xs text-tinta-200">{s.label}</span>
              <span className="font-mono text-sm font-bold text-tinta-300">{s.valor}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function Card({ label, valor }: { label: string; valor: number | string }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-papel-borda-200 bg-papel-50 py-2">
      <span className="font-display text-xl font-bold leading-none text-tinta-300">{valor}</span>
      <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-tinta-100">{label}</span>
    </div>
  )
}

function Leg({ cor, txt }: { cor: string; txt: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cx('h-2.5 w-2.5 rounded-sm', cor)} />
      {txt}
    </span>
  )
}
