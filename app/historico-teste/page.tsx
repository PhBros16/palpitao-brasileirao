// Conferência visual do Histórico. Rota: /historico-teste. Mock: 18 rodadas.

import { HistoricoScreen, type RodadaHist } from '@/components/historico'

const NOMES = [
  'Marcos Viní', 'Pedro Sá', 'Diego Alves', 'Tiago Lopes', 'Léo Castro', 'Bruno Dias', 'Hugo Lima',
  'Caio Reis', 'Igor Pena', 'João Neto', 'Rafael Mota', 'Vitor Hugo', 'Felipe Aro', 'André Sousa',
]

function buildRodadas(): RodadaHist[] {
  return Array.from({ length: 18 }, (_, ri) => {
    const numero = ri + 1
    // Ranking determinístico por rodada: pts variam por jogador e rodada.
    const ranking = NOMES.map((nome, pi) => ({
      nome,
      pts: 3 + ((pi * 3 + numero * 7) % 16),
    })).sort((a, b) => b.pts - a.pts)
    return { numero, ranking }
  })
}

export default function HistoricoTestePage() {
  return <HistoricoScreen rodadas={buildRodadas()} />
}
