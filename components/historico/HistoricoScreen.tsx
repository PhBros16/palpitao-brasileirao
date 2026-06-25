'use client'

// HistoricoScreen — rodadas encerradas empilhadas (mais recente no topo). Cada
// rodada: número + ranking (#, Nome, Pts). Seletor para ir direto a uma rodada
// (rola até a seção). Mobile-first, tudo via tokens.

import { useRef, useState } from 'react'

export interface HistRankLinha {
  nome: string
  pts: number
}

export interface RodadaHist {
  numero: number
  /** Ranking da rodada, já ordenado (1º no topo). */
  ranking: HistRankLinha[]
}

function posIcon(i: number): string {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
}

export function HistoricoScreen({ rodadas }: { rodadas: RodadaHist[] }) {
  // Mais recente no topo.
  const ordenadas = [...rodadas].sort((a, b) => b.numero - a.numero)
  const refs = useRef<Record<number, HTMLDivElement | null>>({})
  const [alvo, setAlvo] = useState<number | null>(null)

  function irPara(numero: number) {
    setAlvo(numero)
    refs.current[numero]?.scrollIntoView({ behavior: 'smooth', block: 'start' })
  }

  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <header className="mb-4">
          <h1 className="font-display text-2xl font-bold text-tinta-300">Histórico</h1>
          <p className="font-sans text-sm text-tinta-100">Rodadas encerradas — toque para ir direto</p>
        </header>

        {/* Seletor de busca */}
        <div className="sticky top-2 z-10 mb-4 flex items-center gap-2 rounded-lg border border-papel-borda-300 bg-papel-100/95 px-3 py-2 backdrop-blur-sm">
          <label htmlFor="ir-rodada" className="font-mono text-[10px] uppercase tracking-wider text-tinta-100">
            Ir para
          </label>
          <select
            id="ir-rodada"
            value={alvo ?? ''}
            onChange={(e) => irPara(Number(e.target.value))}
            className="flex-1 rounded-md border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
          >
            <option value="" disabled>
              Selecione a rodada…
            </option>
            {ordenadas.map((r) => (
              <option key={r.numero} value={r.numero}>
                Rodada {r.numero}
              </option>
            ))}
          </select>
        </div>

        {/* Rodadas empilhadas */}
        <div className="flex flex-col gap-4">
          {ordenadas.map((r) => (
            <div
              key={r.numero}
              ref={(el) => {
                refs.current[r.numero] = el
              }}
              className="scroll-mt-20 overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50"
            >
              <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-200 px-4 py-2.5">
                <h2 className="font-display text-base font-bold text-tinta-300">Rodada {r.numero}</h2>
                <span className="font-mono text-[10px] uppercase tracking-wider text-tinta-100">Encerrada</span>
              </div>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="font-mono text-[9px] uppercase tracking-wider text-tinta-100">
                    <th className="w-10 px-3 py-1.5 text-center">#</th>
                    <th className="px-2 py-1.5 text-left">Nome</th>
                    <th className="px-3 py-1.5 text-right">Pts</th>
                  </tr>
                </thead>
                <tbody>
                  {r.ranking.map((l, i) => (
                    <tr key={l.nome} className="border-t border-papel-borda-200/50">
                      <td className="px-3 py-1.5 text-center font-mono text-xs text-tinta-200">{posIcon(i)}</td>
                      <td className="px-2 py-1.5 font-sans text-xs text-tinta-300">{l.nome}</td>
                      <td className="px-3 py-1.5 text-right font-mono text-xs font-bold text-tinta-300">{l.pts}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ))}
        </div>
      </div>
    </main>
  )
}
