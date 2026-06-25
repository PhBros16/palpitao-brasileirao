// Conferência visual da Tabela da Rodada. Rota: /rodada-teste.
// Mock: 14 participantes × 10 jogos, gerado deterministicamente (sem random,
// pra não variar entre SSR e cliente).

import { TabelaRodada, type DadosRodada, type JogoCol, type LinhaParticipante } from '@/components/rodada'

const JOGOS: JogoCol[] = [
  { id: 'g1', home: 'Flamengo', away: 'Vasco' },
  { id: 'g2', home: 'Palmeiras', away: 'São Paulo' },
  { id: 'g3', home: 'Grêmio', away: 'Internacional' },
  { id: 'g4', home: 'Atlético-MG', away: 'Cruzeiro' },
  { id: 'g5', home: 'Corinthians', away: 'Santos' },
  { id: 'g6', home: 'Bahia', away: 'Vitória' },
  { id: 'g7', home: 'Fluminense', away: 'Botafogo' },
  { id: 'g8', home: 'Fortaleza', away: 'Ceará' },
  { id: 'g9', home: 'Athletico-PR', away: 'Coritiba' },
  { id: 'g10', home: 'Bragantino', away: 'Cuiabá' },
]

const NOMES = [
  'Marcos Viní', 'Pedro Sá', 'Diego Alves', 'Tiago Lopes', 'Léo Castro', 'Bruno Dias', 'Hugo Lima',
  'Caio Reis', 'Igor Pena', 'João Neto', 'Rafael Mota', 'Vitor Hugo', 'Felipe Aro', 'André Sousa',
]

// Resultado real de cada jogo (índice fixo).
const RESULTADOS = [
  { h: 2, a: 1 }, { h: 1, a: 1 }, { h: 0, a: 2 }, { h: 3, a: 0 }, { h: 1, a: 0 },
  { h: 2, a: 2 }, { h: 0, a: 1 }, { h: 1, a: 2 }, { h: 2, a: 0 }, { h: 1, a: 1 },
]

function ptsDe(p: { h: number; a: number }, r: { h: number; a: number }): number {
  if (p.h === r.h && p.a === r.a) return 5 // cravada
  if (p.h - p.a === r.h - r.a) return 3 // saldo
  const sinal = (x: number) => Math.sign(x)
  if (sinal(p.h - p.a) === sinal(r.h - r.a)) return 1 // vencedor
  return 0
}

function buildDados(): DadosRodada {
  const linhas: LinhaParticipante[] = NOMES.map((nome, pi) => {
    const celulas: Record<string, { palpite: { h: number; a: number } | null; pts: number | null }> = {}
    let total = 0
    JOGOS.forEach((j, gi) => {
      // "Não palpitou" determinístico em alguns casos (participante 5 no jogo 4, etc.)
      const naoPalpitou = (pi + gi) % 17 === 3
      if (naoPalpitou) {
        celulas[j.id] = { palpite: null, pts: null }
        return
      }
      const h = (pi + gi) % 4
      const a = (pi * 2 + gi) % 3
      const pts = ptsDe({ h, a }, RESULTADOS[gi])
      total += pts
      celulas[j.id] = { palpite: { h, a }, pts }
    })
    const hh = String(16 + (pi % 4)).padStart(2, '0')
    const mm = String((pi * 7) % 60).padStart(2, '0')
    return { id: `p${pi}`, nome, ehVoce: pi === 0, hora: `${hh}:${mm}`, totalRodada: total, celulas }
  })

  // Ordena por total desc, mantendo "você" visível.
  linhas.sort((a, b) => b.totalRodada - a.totalRodada)

  return { rodadaNome: 'Brasileirão', rodadaNumero: 12, jogos: JOGOS, linhas }
}

export default function RodadaTestePage() {
  return <TabelaRodada dados={buildDados()} />
}
