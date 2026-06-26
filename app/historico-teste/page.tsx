// Conferência visual do Histórico. Rota: /historico-teste.
// Mock: 20 rodadas. As 1–18 (migradas) NÃO têm jogos por resultado → sem botão.
// As 19+ (jogadas no app) carregam os jogos → botão "Jogos desta rodada".

import { HistoricoScreen, type JogoResultado, type RodadaHist } from '@/components/historico'

const NOMES = [
  'Marcos Viní', 'Pedro Sá', 'Diego Alves', 'Tiago Lopes', 'Léo Castro', 'Bruno Dias', 'Hugo Lima',
  'Caio Reis', 'Igor Pena', 'João Neto', 'Rafael Mota', 'Vitor Hugo', 'Felipe Aro', 'André Sousa',
]

// 10 confrontos-base para as rodadas com resultado.
const CONFRONTOS: [string, string][] = [
  ['Flamengo', 'Vasco'],
  ['Palmeiras', 'São Paulo'],
  ['Grêmio', 'Internacional'],
  ['Atlético-MG', 'Cruzeiro'],
  ['Corinthians', 'Santos'],
  ['Bahia', 'Vitória'],
  ['Fluminense', 'Botafogo'],
  ['Fortaleza', 'Ceará'],
  ['Athletico-PR', 'Coritiba'],
  ['Bragantino', 'Cuiabá'],
]

function jogosDaRodada(numero: number): JogoResultado[] {
  return CONFRONTOS.map(([home, away], gi) => ({
    home,
    away,
    placar: { h: (numero + gi) % 4, a: (numero * 2 + gi) % 3 },
  }))
}

function buildRodadas(): RodadaHist[] {
  return Array.from({ length: 20 }, (_, ri) => {
    const numero = ri + 1
    const ranking = NOMES.map((nome, pi) => ({
      nome,
      pts: 3 + ((pi * 3 + numero * 7) % 16),
    })).sort((a, b) => b.pts - a.pts)
    // Só as rodadas 19+ carregam os jogos com resultado.
    const jogos = numero >= 19 ? jogosDaRodada(numero) : undefined
    return { numero, ranking, jogos }
  })
}

export default function HistoricoTestePage() {
  return <HistoricoScreen rodadas={buildRodadas()} />
}
