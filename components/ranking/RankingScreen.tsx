'use client'

// RankingScreen — orquestra as 4 sub-abas: Classificação, Evolução, Minhas
// Estatísticas e Sala de Troféus.
//
// Este componente é renderizado DENTRO do AppLayout, então NÃO deve ter
// <main>, fundo próprio, max-w-md ou padding — tudo isso vem do layout.

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

export function RankingScreen({ dados, onClickLinha }: { dados: DadosRanking; onClickLinha?: (nome: string) => void }) {
  const [sub, setSub] = useState<Sub>('classificacao')

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-tinta-300">Ranking</h1>

      {/* Sub-abas */}
      <div className="flex gap-1 rounded-lg border border-papel-borda-200 bg-papel-50 p-1">
        {ABAS.map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cx(
              'flex-1 rounded-md px-2 py-1.5 font-sans text-xs font-semibold transition-colors',
              sub === s ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'classificacao' && <Classificacao linhas={dados.classificacao} onClickLinha={onClickLinha ? (l) => onClickLinha(l.nome) : undefined} />}
      {sub === 'evolucao' && <Evolucao series={dados.evolucao} totalRodadas={dados.totalRodadas} />}
      {sub === 'stats' && <Estatisticas e={dados.estatisticas} />}
      {sub === 'trofeus' && <SalaTrofeus trofeus={dados.trofeus} total={dados.totalTrofeus} />}
    </>
  )
}
