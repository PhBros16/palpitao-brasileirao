'use client'

// RankingScreen — orquestra as 4 sub-abas: Classificação, Evolução, Minhas
// Estatísticas e Sala de Troféus. Mobile-first, tudo via tokens.

import { useState } from 'react'
import { Classificacao } from './Classificacao'
import { Estatisticas } from './Estatisticas'
import { Evolucao } from './Evolucao'
import { SalaTrofeus } from './SalaTrofeus'
import type { DadosRanking } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Sub = 'classificacao' | 'evolucao' | 'stats' | 'trofeus'

const ABAS: [Sub, string][] = [
  ['classificacao', 'Classificação'],
  ['evolucao', 'Evolução'],
  ['stats', 'Estatísticas'],
  ['trofeus', 'Troféus'],
]

export function RankingScreen({ dados }: { dados: DadosRanking }) {
  const [sub, setSub] = useState<Sub>('classificacao')

  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <div className="mx-auto max-w-md">
        <h1 className="mb-3 font-display text-2xl font-bold text-tinta-300">Ranking</h1>

        {/* Sub-abas */}
        <div className="mb-4 flex gap-1 overflow-x-auto rounded-lg border border-papel-borda-200 bg-papel-50 p-1">
          {ABAS.map(([s, label]) => (
            <button
              key={s}
              type="button"
              onClick={() => setSub(s)}
              className={cx(
                'shrink-0 rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors',
                sub === s ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {sub === 'classificacao' && <Classificacao linhas={dados.classificacao} />}
        {sub === 'evolucao' && <Evolucao series={dados.evolucao} totalRodadas={dados.totalRodadas} />}
        {sub === 'stats' && <Estatisticas e={dados.estatisticas} />}
        {sub === 'trofeus' && <SalaTrofeus trofeus={dados.trofeus} total={dados.totalTrofeus} />}
      </div>
    </main>
  )
}
