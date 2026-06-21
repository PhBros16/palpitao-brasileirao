// Ranking geral e parcial da rodada — funções puras, sem dependência de UI.
//
// PRESERVA LÓGICA (CLAUDE.md §6): o desempate cravadas → vencedor → saldo é o do
// Copa. A casca mudou: nada de `PLAYERS` hardcoded nem leitura do estado global
// inteiro — os dados entram como parâmetros explícitos (data-driven, Regra 2).

import { type RodadaHistorico } from './types.ts'

/** Uma linha do ranking parcial (rodada em andamento). */
export interface ParcialEntry {
  name: string
  /** Pontos do jogador na rodada atual (soma de `correctedScores`). */
  roundPts: number
  /** Pontos acumulados na temporada. */
  total: number
  /** Se o jogador já registrou ao menos um palpite na rodada. */
  hasPal: boolean
}

/** Uma linha do ranking geral (temporada). */
export interface RankingEntry {
  name: string
  total: number
  /** Rodadas em que o jogador pontuou. */
  rodadas: number
  /** Total de placares cravados na temporada. */
  exact: number
  /** Acertos de vencedor sem ter cravado (correct − exact). */
  vencedor: number
  /** Acertos de saldo na temporada. */
  saldo: number
}

/**
 * Ranking PARCIAL: a foto da rodada em andamento.
 * Ordena por pontos da rodada, desempatando pelo total acumulado.
 *
 * Sem resíduo de mata-mata aqui — só o desacoplamento de estado/UI e a
 * eliminação do `PLAYERS` hardcoded (agora `players` vem do chamador).
 */
export function parcialData(input: {
  players: string[]
  correctedScores: Record<string, Record<string, number>>
  totalPoints: Record<string, number>
  palpites: Record<string, Record<string, unknown>>
}): ParcialEntry[] {
  const { players, correctedScores, totalPoints, palpites } = input
  return players
    .map((name) => ({
      name,
      roundPts: Object.values(correctedScores[name] || {}).reduce((a, b) => a + b, 0),
      total: totalPoints[name] || 0,
      hasPal: !!(palpites[name] && Object.keys(palpites[name]).length > 0),
    }))
    .sort((a, b) => (b.roundPts !== a.roundPts ? b.roundPts - a.roundPts : b.total - a.total))
}

/**
 * Ranking GERAL: a classificação da temporada.
 * Ordena por total → cravadas → vencedor (desempate do Copa, CLAUDE.md §6).
 */
export function rankingData(input: {
  players: string[]
  totalPoints: Record<string, number>
  history: RodadaHistorico[]
}): RankingEntry[] {
  const { players, totalPoints, history } = input
  return players
    .map((name) => ({
      name,
      total: totalPoints[name] || 0,
      rodadas: history.filter((r) => r.scores && r.scores[name] !== undefined).length,
      exact: history.reduce((acc, r) => acc + (r.tiebreak?.[name]?.exact || 0), 0),
      // `correct` inclui as cravadas; aqui isolamos quem acertou só o vencedor.
      vencedor: history.reduce(
        (acc, r) => acc + Math.max((r.tiebreak?.[name]?.correct || 0) - (r.tiebreak?.[name]?.exact || 0), 0),
        0,
      ),
      saldo: history.reduce((acc, r) => acc + (r.tiebreak?.[name]?.saldo || 0), 0),
    }))
    .sort((a, b) => {
      if (b.total !== a.total) return b.total - a.total
      if (b.exact !== a.exact) return b.exact - a.exact
      return b.vencedor - a.vencedor
    })
}
