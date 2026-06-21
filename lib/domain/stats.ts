// Estatísticas pessoais de um jogador ao longo da temporada — função pura,
// sem dependência de UI nem do estado global.
//
// PRESERVA LÓGICA (CLAUDE.md §6): esta é a `calcPlayerStats` do Copa, extraída
// do monolito e tipada. Revisei a função inteira: ela NÃO tem resíduo de
// mata-mata (sem PHASE_MULTIPLIERS, sem Quem Avança / Pênaltis). Foi extração
// pura — nenhuma regra precisou ser reescrita para liga (Regra 9: nada a
// sinalizar como "mata-mata → virou liga" aqui).

import { type Placar, type RodadaHistorico } from './types.ts'

/** Estatísticas pessoais consolidadas de um jogador na temporada. */
export interface PlayerStats {
  /** Placares cravados (exatos) na temporada. */
  exatos: number
  /** Acertos de vencedor sem ter cravado (correct − exact). */
  vencedor: number
  /** Acertos de saldo de gols. */
  saldo: number
  /** Rodadas em que o jogador pontuou. */
  rodadas: number
  totalPts: number
  /** Média de pontos por rodada (0 quando não pontuou em nenhuma). */
  mediaPts: number
  /** Maior subida de posição entre duas rodadas consecutivas. */
  maxSaltoPos: number
  /** Maior sequência de rodadas sem zerar. */
  maxSeriaSemZero: number
  rodadasTop3: number
  /** Rodadas em último lugar — insumo do "Frango" (CLAUDE.md §4/§10). */
  rodadasUltimo: number
  rodadasPrimeiro: number
  /** Palpites de empate apostados. */
  empatesApostados: number
  /** Total de palpites preenchidos. */
  totalApostados: number
  /** empatesApostados / totalApostados (0 quando não apostou nada). */
  pctEmpate: number
  /** Palpites de goleada apostados (h + a ≥ 5). */
  goleadasApostadas: number
  /** Goleadas apostadas que foram cravadas. */
  goleadasAcertadas: number
  /** Rodadas em que o jogador não palpitou. */
  faltouPalpitar: number
}

/** Normaliza um gol vindo de input (string), número, ou vazio. */
function parseGol(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

/** Ranqueia os jogadores de uma rodada por pontos (desc) e devolve a ordem.
 *  ⚠️ Fiel ao Copa: empate de pontuação NÃO tem critério de desempate — é
 *  decisão de produto em aberto (mantido propositalmente). */
function ordemPorPontos(scores: Record<string, number>): string[] {
  return Object.entries(scores)
    .sort((a, b) => b[1] - a[1])
    .map(([name]) => name)
}

export function calcPlayerStats(player: string, history: RodadaHistorico[]): PlayerStats {
  let exatos = 0
  let vencedor = 0
  let saldo = 0
  let rodadas = 0
  let totalPts = 0
  let maxSaltoPos = 0
  let seriaSemZero = 0
  let maxSeriaSemZero = 0
  let rodadasTop3 = 0
  let rodadasUltimo = 0
  let rodadasPrimeiro = 0
  let empatesApostados = 0
  let totalApostados = 0
  let goleadasApostadas = 0
  let goleadasAcertadas = 0
  let faltouPalpitar = 0

  history.forEach((r, ri) => {
    const pts = r.scores?.[player]
    if (pts === undefined) {
      faltouPalpitar++
      seriaSemZero = 0
      return
    }
    rodadas++
    totalPts += pts

    const t = r.tiebreak?.[player]
    if (t) {
      exatos += t.exact || 0
      // `correct` inclui as cravadas; isolamos quem acertou só o vencedor.
      vencedor += Math.max((t.correct || 0) - (t.exact || 0), 0)
      saldo += t.saldo || 0
    }

    // Posição nesta rodada.
    const ordem = ordemPorPontos(r.scores || {})
    const pos = ordem.indexOf(player)
    if (pos === 0) rodadasPrimeiro++
    if (pos <= 2) rodadasTop3++
    if (pos === ordem.length - 1) rodadasUltimo++

    // Salto de posição (precisa da rodada anterior).
    if (ri > 0) {
      const prevOrdem = ordemPorPontos(history[ri - 1].scores || {})
      const prevPos = prevOrdem.indexOf(player)
      const salto = prevPos - pos
      if (salto > maxSaltoPos) maxSaltoPos = salto
    }

    // Série sem zerar.
    if (pts > 0) {
      seriaSemZero++
      if (seriaSemZero > maxSeriaSemZero) maxSeriaSemZero = seriaSemZero
    } else {
      seriaSemZero = 0
    }

    // Empates e goleadas apostadas (via palpites guardados na rodada).
    // Limpeza fiel: o Copa achava o matchId por igualdade de referência dentro
    // de Object.values; aqui iteramos [matchId, pal] direto — mesmo resultado.
    const palpitesRodada = r.palpites?.[player]
    if (palpitesRodada) {
      Object.entries(palpitesRodada).forEach(([matchId, pal]) => {
        // Fiel ao Copa: conta como "apostado" todo palpite com o MANDANTE
        // preenchido — não exige o visitante. É uma peculiaridade que infla o
        // denominador de pctEmpate com palpites pela metade; preservada de
        // propósito (limpar isso é decisão de produto futura, não decido aqui).
        if (!pal || pal.h === '' || pal.h === null || pal.h === undefined) return
        totalApostados++
        const h = parseGol(pal.h)
        const a = parseGol(pal.a)
        if (h === null || a === null) return
        if (h === a) empatesApostados++
        if (h + a >= 5) {
          goleadasApostadas++
          const res = r.results?.[matchId]
          if (res && parseGol(res.h) === h && parseGol(res.a) === a) goleadasAcertadas++
        }
      })
    }
  })

  const mediaPts = rodadas > 0 ? totalPts / rodadas : 0
  const pctEmpate = totalApostados > 0 ? empatesApostados / totalApostados : 0

  return {
    exatos,
    vencedor,
    saldo,
    rodadas,
    totalPts,
    mediaPts,
    maxSaltoPos,
    maxSeriaSemZero,
    rodadasTop3,
    rodadasUltimo,
    rodadasPrimeiro,
    empatesApostados,
    totalApostados,
    pctEmpate,
    goleadasApostadas,
    goleadasAcertadas,
    faltouPalpitar,
  }
}
