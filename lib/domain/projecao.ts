// Projeção de campeão em % — função pura, sem dependência de UI.
//
// PRESERVA LÓGICA, ADAPTA CASCA (CLAUDE.md §1 e §3): o algoritmo do Copa
// (média × rodadas restantes → normaliza para %) é sólido para pontos corridos
// e foi mantido. O que mudou foi a CASCA:
//   • windowSize removido — média sobre toda a temporada (Opção A, decisão do
//     produto). Se a Fase 4 precisar de "forma recente", o parâmetro entra de
//     forma aditiva sem quebrar esta assinatura.
//   • rodadasRestantes corrigido (ver comentário abaixo).
//   • players e totalPoints chegam por parâmetro, não via PLAYERS hardcoded.

import { type RodadaHistorico } from './types.ts'

/**
 * Calcula a projeção de campeão de cada jogador como porcentagem do "bolo
 * total projetado" ao final da temporada.
 *
 * Algoritmo:
 *   1. Média de pontos por rodada (todas as rodadas do histórico).
 *   2. Projeção bruta: totalAtual + média × rodadasRestantes.
 *   3. Normaliza para %: projeção do jogador / soma de todas as projeções × 100.
 *
 * Retorna {} quando há menos de 2 rodadas — sem dados suficientes para projetar
 * (comportamento preservado do Copa).
 *
 * ⚠️ era mata-mata → virou liga (CLAUDE.md §3, Regra 9):
 * No Copa: `rodadasRestantes = Math.max(hist.length, 2)` — usava as rodadas
 * JÁ JOGADAS como estimativa das que faltam. Era uma gambiarra aceitável num
 * torneio curto (~7 rodadas), mas semanticamente errada e catastrófica numa
 * temporada de 38 rodadas (na R10 projetaria como se faltassem 10, quando
 * faltam 28). Na liga: `rodadasRestantes = totalRodadas - history.length`,
 * exato e configurável.
 */
export function calcProjecaoPct(input: {
  players: string[]
  totalPoints: Record<string, number>
  history: RodadaHistorico[]
  /** Total de rodadas da temporada. Padrão 38 (Brasileirão Série A).
   *  Passe um valor maior para temporadas com rodadas extras (jogos remarcados). */
  totalRodadas?: number
}): Record<string, number> {
  const { players, totalPoints, history, totalRodadas = 38 } = input

  if (history.length < 2) return {}

  // ⚠️ era mata-mata → virou liga: rodadas restantes agora é exato.
  const rodadasRestantes = Math.max(totalRodadas - history.length, 0)

  const projecoes: Record<string, number> = {}
  players.forEach((p) => {
    const media = history.reduce((acc, r) => acc + (r.scores?.[p] || 0), 0) / history.length
    projecoes[p] = (totalPoints[p] || 0) + media * rodadasRestantes
  })

  const total = Object.values(projecoes).reduce((a, b) => a + b, 0)
  if (total === 0) return {}

  const result: Record<string, number> = {}
  players.forEach((p) => {
    result[p] = Math.round((projecoes[p] / total) * 100)
  })
  return result
}
