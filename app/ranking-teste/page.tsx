// Conferência visual do Ranking. Rota: /ranking-teste. Mock determinístico.

import { RankingScreen, type DadosRanking, type ClassificacaoLinha, type EvolucaoSerie } from '@/components/ranking'

const NOMES = [
  'Marcos Viní', 'Pedro Sá', 'Diego Alves', 'Tiago Lopes', 'Léo Castro', 'Bruno Dias', 'Hugo Lima',
  'Caio Reis', 'Igor Pena', 'João Neto', 'Rafael Mota', 'Vitor Hugo', 'Felipe Aro', 'André Sousa',
]
const TOTAL_RODADAS = 12

function buildDados(): DadosRanking {
  // Classificação determinística (decrescente).
  const classificacao: ClassificacaoLinha[] = NOMES.map((nome, i) => {
    const pontos = 312 - i * 14 - (i % 3) * 3
    return {
      nome,
      pontos,
      cravadas: 28 - i * 2 + (i % 2),
      vencedor: 40 - i,
      saldo: 22 - i + (i % 2),
      projecao: 0, // preenchido abaixo
    }
  })
  // Projeção como fração do "bolo" de pontos (simplificação de exibição).
  const bolo = classificacao.reduce((acc, c) => acc + c.pontos, 0)
  classificacao.forEach((c) => {
    c.projecao = Math.round((c.pontos / bolo) * 100)
  })

  // Evolução: acumulado por rodada (crescente, ritmos diferentes).
  const evolucao: EvolucaoSerie[] = NOMES.map((nome, i) => {
    const ritmo = 26 - i * 1.4
    const acumulado = Array.from({ length: TOTAL_RODADAS }, (_, r) =>
      Math.round((r + 1) * ritmo + Math.sin(r + i) * 6),
    )
    return { nome, acumulado, ehVoce: i === 0, posicao: i + 1 }
  })

  return {
    classificacao,
    evolucao,
    totalRodadas: TOTAL_RODADAS,
    estatisticas: {
      ptsPorRodada: [12, 8, 0, 15, 6, 11, 3, 18, 9, 5, 14, 7],
      cravadas: 28,
      vencedor: 40,
      saldo: 22,
      mediaPts: 9.8,
      sequencias: [
        { label: 'Maior série no top 3', valor: '5 rodadas' },
        { label: 'Maior série sem zerar', valor: '7 rodadas' },
        { label: 'Rodadas em 1º', valor: '4' },
        { label: 'Maior salto de posição', valor: '+6' },
      ],
    },
    trofeus: [
      { id: 'veterano', nome: 'Veterano', tier: 1 },
      { id: 'o-contador', nome: 'O Contador', tier: 1 },
      { id: 'o-muralha', nome: 'O Muralha', tier: 1 },
      { id: 'em-chamas', nome: 'Em Chamas', tier: 2 },
      { id: 'hat-trick', nome: 'Hat-trick', tier: 2 },
      { id: 'estrela-cadente', nome: 'Estrela Cadente', tier: 3 },
      { id: 'implacavel', nome: 'Implacável', tier: 3 },
      { id: 'campeao', nome: 'CAMPEÃO!', tier: 4 },
    ],
    totalTrofeus: 34,
  }
}

export default function RankingTestePage() {
  return <RankingScreen dados={buildDados()} />
}
