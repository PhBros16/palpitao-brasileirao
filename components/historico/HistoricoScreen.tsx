'use client'

// HistoricoScreen — rodadas encerradas empilhadas (mais recente no topo). Cada
// rodada: número + ranking (#, Nome, Pts). Seletor para ir direto a uma rodada.
//
// Toggle "Jogos desta rodada": só aparece quando a rodada CARREGA os jogos com
// resultado (campo `jogos`). É data-driven de propósito — no real, as rodadas
// migradas (1–18) não guardam resultado por jogo (já computado no ranking),
// e as jogadas no app (19+) guardam. O componente não hardcoda número nenhum.

import { useRef, useState } from 'react'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export interface HistRankLinha {
  nome: string
  pts: number
}

export interface JogoResultado {
  home: string
  away: string
  placar: { h: number; a: number }
}

export interface RodadaHist {
  numero: number
  /** Ranking da rodada, já ordenado (1º no topo). */
  ranking: HistRankLinha[]
  /** Jogos com resultado. Ausente nas rodadas sem resultado por jogo (migradas). */
  jogos?: JogoResultado[]
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
            <CardRodada
              key={r.numero}
              rodada={r}
              setRef={(el) => {
                refs.current[r.numero] = el
              }}
            />
          ))}
        </div>
      </div>
    </main>
  )
}

function CardRodada({
  rodada,
  setRef,
}: {
  rodada: RodadaHist
  setRef: (el: HTMLDivElement | null) => void
}) {
  const [aberto, setAberto] = useState(false)
  const temJogos = !!rodada.jogos && rodada.jogos.length > 0

  return (
    <div ref={setRef} className="scroll-mt-20 overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50">
      <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-200 px-4 py-2.5">
        <h2 className="font-display text-base font-bold text-tinta-300">Rodada {rodada.numero}</h2>
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
          {rodada.ranking.map((l, i) => (
            <tr key={l.nome} className="border-t border-papel-borda-200/50">
              <td className="px-3 py-1.5 text-center font-mono text-xs text-tinta-200">{posIcon(i)}</td>
              <td className="px-2 py-1.5 font-sans text-xs text-tinta-300">{l.nome}</td>
              <td className="px-3 py-1.5 text-right font-mono text-xs font-bold text-tinta-300">{l.pts}</td>
            </tr>
          ))}
        </tbody>
      </table>

      {temJogos && (
        <>
          <button
            type="button"
            onClick={() => setAberto((o) => !o)}
            aria-expanded={aberto}
            className="flex w-full items-center justify-between border-t border-papel-borda-200 bg-papel-100 px-4 py-2.5 text-left transition-colors hover:bg-papel-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
          >
            <span className="font-sans text-xs font-semibold text-tinta-300">Jogos desta rodada</span>
            <span className={cx('font-mono text-xs text-tinta-100 transition-transform duration-300', aberto && 'rotate-180')} aria-hidden>
              ▼
            </span>
          </button>
          <div className={cx('grid transition-all duration-300 ease-out', aberto ? 'grid-rows-[1fr]' : 'grid-rows-[0fr]')}>
            <div className="overflow-hidden">
              <ul className="divide-y divide-papel-borda-200/50 px-4 py-1">
                {rodada.jogos!.map((j, i) => (
                  <li key={i} className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 py-2">
                    <span className="truncate text-right font-sans text-xs text-tinta-300">{j.home}</span>
                    <span className="rounded bg-papel-200 px-2 py-0.5 font-mono text-sm font-bold text-tinta-300">
                      {j.placar.h} <span className="text-tinta-100">×</span> {j.placar.a}
                    </span>
                    <span className="truncate text-left font-sans text-xs text-tinta-300">{j.away}</span>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </>
      )}
    </div>
  )
}
