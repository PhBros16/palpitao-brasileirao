// Troféus do Palpitão Brasileirão — função pura, sem dependência de UI.
//
// PRESERVA LÓGICA, ADAPTA CASCA (CLAUDE.md §1 e §3): mecânica de desbloqueio
// preservada do Copa (4 tiers, condições numéricas, confronto de dados históricos).
// Casca adaptada: 5 troféus de mata-mata excluídos, thresholds recalibrados para
// temporada de 38 rodadas, "Rei dos Clássicos" substitui "Sangue Frio".
// Fonte de verdade: TROFEUS.md (34 troféus, fechado para implementação).

import type { PlayerStats } from './stats.ts'
import type { RodadaHistorico } from './types.ts'

export interface Trofeu {
  id: string
  tier: 1 | 2 | 3 | 4
  label: string
  desc: string
  unlocked: boolean
}

// Clássicos regionais oficiais da Série A (lista fechada — TROFEUS.md).
// O confronto só conta se ambos os clubes estiverem na elite naquela temporada
// (se não estiverem, o jogo simplesmente não ocorre e não é contabilizado).
const CLASSICOS: Array<[string, string]> = [
  ['Grêmio', 'Internacional'],       // Grenal
  ['Corinthians', 'Palmeiras'],      // Choque-Rei
  ['São Paulo', 'Corinthians'],      // Majestoso
  ['São Paulo', 'Palmeiras'],        // Derby Paulista
  ['Flamengo', 'Fluminense'],        // Fla-Flu
  ['Vasco da Gama', 'Flamengo'],     // Clássico dos Milhões
  ['Atlético-PR', 'Coritiba'],       // Atletiba
  ['Bahia', 'Vitória'],              // Ba-Vi
  ['Atlético-MG', 'Cruzeiro'],       // Clássico Mineiro
]

function isClassico(home: string, away: string): boolean {
  return CLASSICOS.some(([a, b]) => (home === a && away === b) || (home === b && away === a))
}

// Posição 1-based do jogador em cada rodada, por pontos da rodada (não acumulado).
// Fiel ao mesmo critério de calcPlayerStats e calcSequencia.
function getPositions(player: string, history: RodadaHistorico[], players: string[]): number[] {
  return history.map((r) => {
    const sorted = [...players].sort((a, b) => (r.scores?.[b] || 0) - (r.scores?.[a] || 0))
    return sorted.indexOf(player) + 1
  })
}

function maxConsecTop3(positions: number[]): number {
  let max = 0, cur = 0
  for (const pos of positions) {
    cur = pos <= 3 ? cur + 1 : 0
    if (cur > max) max = cur
  }
  return max
}

// Fênix: esteve em último por 2+ rodadas consecutivas e depois saiu.
function checkFenix(positions: number[], lastPlace: number): boolean {
  let streak = 0, qualified = false
  for (const pos of positions) {
    if (pos === lastPlace) {
      streak++
      if (streak >= 2) qualified = true
    } else {
      if (qualified) return true
      streak = 0
    }
  }
  return false
}

function pctEmpateFor(p: string, history: RodadaHistorico[]): { pct: number; rodadas: number } {
  let empates = 0, total = 0, rodadas = 0
  for (const r of history) {
    const bets = r.palpites?.[p]
    if (!bets) continue
    rodadas++
    for (const b of Object.values(bets)) {
      const h = Number(b.h), a = Number(b.a)
      if (b.h !== '' && b.a !== '' && !isNaN(h) && !isNaN(a)) {
        total++
        if (h === a) empates++
      }
    }
  }
  return { pct: total > 0 ? empates / total : 0, rodadas }
}

function rankCountsFor(
  history: RodadaHistorico[],
  players: string[],
): Record<string, { first: number; top3: number }> {
  const counts: Record<string, { first: number; top3: number }> = {}
  for (const p of players) counts[p] = { first: 0, top3: 0 }
  for (const r of history) {
    const sorted = [...players].sort((a, b) => (r.scores?.[b] || 0) - (r.scores?.[a] || 0))
    sorted.forEach((p, i) => {
      if (i === 0) counts[p].first++
      if (i < 3) counts[p].top3++
    })
  }
  return counts
}

/**
 * Calcula quais troféus o jogador desbloqueou dado o estado atual da temporada.
 *
 * Retorna sempre os 34 troféus (TROFEUS.md), com `unlocked` true/false. Sem
 * `icon` (UI) nem `newlyUnlocked` (diff entre estados — responsabilidade do
 * chamador comparar duas chamadas consecutivas se precisar animar).
 *
 * ⚠️ era mata-mata → virou liga: 5 troféus do Copa excluídos (Galinha,
 * O Otimista Trágico, O Consistente, Fênix antigo, Vidente). Thresholds
 * recalibrados para 38 rodadas. "Rei dos Clássicos" substitui "Sangue Frio".
 */
export function calcTrofeus(input: {
  player: string
  players: string[]
  stats: PlayerStats
  history: RodadaHistorico[]
  totalPoints: Record<string, number>
}): Trofeu[] {
  const { player, players, stats, history, totalPoints } = input
  const n = players.length
  const others = players.filter((p) => p !== player)
  const positions = getPositions(player, history, players)

  // ── per-round scan (scores + ranking) ──────────────────────────────────────
  let viradaDeMesa = false
  let rodadasBelowTop10 = 0
  let rank2Rounds = 0
  let totalSemZero = 0
  let tiedRounds = 0
  let rodadasAboveMean = 0

  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    const myScore = r.scores?.[player] || 0
    const pos = positions[i]

    if (myScore > 0) totalSemZero++
    if (pos === 2) rank2Rounds++
    if (pos > 10) rodadasBelowTop10++
    if (i > 0 && positions[i - 1] - pos >= 3) viradaDeMesa = true

    if (players.some((p) => p !== player && (r.scores?.[p] || 0) === myScore)) tiedRounds++

    if (players.length > 0) {
      const mean = players.reduce((acc, p) => acc + (r.scores?.[p] || 0), 0) / players.length
      if (myScore > mean) rodadasAboveMean++
    }
  }

  // ── per-round scan (palpites) ───────────────────────────────────────────────
  let totalBets = 0
  let homeBets = 0
  let zerozeroGames = 0
  let hasPacifista = false
  let hasMonolito = false
  let hasNaSorte = false
  let showmanUnlocked = false
  let perfeicaoUnlocked = false
  let papagaioUnlocked = false
  let hatTrickUnlocked = false
  let magicoUnlocked = false
  let reiClassicos = 0

  for (const r of history) {
    const exact = r.tiebreak?.[player]?.exact || 0
    if (exact >= 4) hatTrickUnlocked = true
    if (exact >= 5) magicoUnlocked = true

    const myBets = r.palpites?.[player] || {}
    const betEntries = Object.entries(myBets)
    const betCount = betEntries.length

    for (const [, b] of betEntries) {
      const h = Number(b.h), a = Number(b.a)
      if (b.h !== '' && b.a !== '' && !isNaN(h) && !isNaN(a)) {
        totalBets++
        if (h > a) homeBets++
        if (h === 0 && a === 0) zerozeroGames++
      }
    }

    // O Pacifista: 60%+ empates numa rodada
    if (betCount > 0) {
      let re = 0, rt = 0
      for (const [, b] of betEntries) {
        const h = Number(b.h), a = Number(b.a)
        if (b.h !== '' && b.a !== '' && !isNaN(h) && !isNaN(a)) {
          rt++
          if (h === a) re++
        }
      }
      if (rt > 0 && re / rt >= 0.6) hasPacifista = true
    }

    // O Monólito: mesmo placar em todos os jogos da rodada
    if (betCount > 1) {
      const [, first] = betEntries[0]
      if (betEntries.every(([, b]) => b.h === first.h && b.a === first.a)) hasMonolito = true
    }

    // Na Sorte: apostou em só 1 jogo E cravou
    if (betCount === 1 && exact >= 1) hasNaSorte = true

    // O Showman: cravou placar com 5+ gols
    if (r.results) {
      for (const [id, b] of betEntries) {
        const res = r.results[id]
        if (!res) continue
        const bH = Number(b.h), bA = Number(b.a), rH = Number(res.h), rA = Number(res.a)
        if (!isNaN(bH) && !isNaN(bA) && !isNaN(rH) && !isNaN(rA) && bH === rH && bA === rA && bH + bA >= 5)
          showmanUnlocked = true
      }
    }

    // Perfeição: acertou ao menos resultado em TODOS os jogos apostados
    const tbCorrect = r.tiebreak?.[player]?.correct || 0
    if (betCount > 0 && tbCorrect >= betCount) perfeicaoUnlocked = true

    // O Papagaio: apostou idêntico a um outro participante em todos os jogos
    if (betCount > 0 && !papagaioUnlocked) {
      const gameIds = betEntries.map(([id]) => id)
      for (const other of others) {
        const ob = r.palpites?.[other]
        if (!ob || Object.keys(ob).length !== gameIds.length) continue
        if (gameIds.every((id) => ob[id] && ob[id].h === myBets[id].h && ob[id].a === myBets[id].a)) {
          papagaioUnlocked = true
          break
        }
      }
    }

    // Rei dos Clássicos: acertou vencedor em clássico
    if (r.matches && r.results) {
      for (const m of r.matches) {
        if (!isClassico(m.home, m.away)) continue
        const bet = myBets[m.id], res = r.results[m.id]
        if (!bet || !res) continue
        const bH = Number(bet.h), bA = Number(bet.a), rH = Number(res.h), rA = Number(res.a)
        if (isNaN(bH) || isNaN(bA) || isNaN(rH) || isNaN(rA)) continue
        const bW = bH > bA ? 'H' : bA > bH ? 'A' : 'D'
        const rW = rH > rA ? 'H' : rA > rH ? 'A' : 'D'
        if (bW === rW) reiClassicos++
      }
    }
  }

  // ── cross-player (lazy) ────────────────────────────────────────────────────
  let _rc: ReturnType<typeof rankCountsFor> | null = null
  const rc = () => { _rc ??= rankCountsFor(history, players); return _rc! }

  const myFirst = () => rc()[player]?.first || 0
  const myTop3C = () => rc()[player]?.top3 || 0
  const liderAbsoluto = others.length === 0
    ? myFirst() > 0
    : myFirst() > Math.max(...others.map((p) => rc()[p]?.first || 0))
  const predador = others.length === 0
    ? myTop3C() > 0
    : myTop3C() > Math.max(...others.map((p) => rc()[p]?.top3 || 0))

  const myEmpate = pctEmpateFor(player, history)
  const diplomatUnlocked = myEmpate.rodadas >= 3 &&
    others.every((p) => { const e = pctEmpateFor(p, history); return e.rodadas < 3 || myEmpate.pct > e.pct })

  const myTotal = totalPoints[player] || 0
  const campeoUnlocked = myTotal > 0 && others.every((p) => (totalPoints[p] || 0) < myTotal)

  return [
    // ── TIER 1 ─────────────────────────────────────────────────────────────────
    {
      id: 'veterano',
      tier: 1,
      label: 'Veterano',
      desc: 'Participou de 5 ou mais rodadas.',
      unlocked: stats.rodadas >= 5,
    },
    {
      id: 'virada-de-mesa',
      tier: 1,
      label: 'Virada de Mesa',
      desc: 'Subiu 3 ou mais posições no ranking em uma única rodada.',
      unlocked: viradaDeMesa,
    },
    {
      id: 'resistente',
      tier: 1,
      label: 'Resistente',
      desc: 'Palpitou em todas as rodadas da temporada, sem faltar nenhuma.',
      unlocked: history.length > 0 && stats.faltouPalpitar === 0,
    },
    {
      id: 'o-pacifista',
      tier: 1,
      label: 'O Pacifista',
      desc: 'Apostou empate em 60% ou mais dos jogos de uma rodada.',
      unlocked: hasPacifista,
    },
    {
      id: 'zero-a-zero',
      tier: 1,
      label: 'Zero a Zero',
      desc: 'Apostou 0×0 em 3 ou mais jogos ao longo da temporada.',
      unlocked: zerozeroGames >= 3,
    },
    {
      id: 'dormiu-no-ponto',
      tier: 1,
      label: 'Dormiu no Ponto',
      desc: 'Perdeu o prazo de palpite em 3 ou mais rodadas.',
      unlocked: stats.faltouPalpitar >= 3,
    },
    {
      id: 'o-contador',
      tier: 1,
      label: 'O Contador',
      desc: 'Acertou o saldo de gols em 5 ou mais jogos (sem cravar o placar).',
      unlocked: stats.saldo >= 5,
    },
    {
      id: 'o-mandante',
      tier: 1,
      label: 'O Mandante',
      desc: 'Apostou vitória do time da casa em mais de 50% dos jogos da temporada.',
      unlocked: totalBets > 0 && homeBets / totalBets > 0.5,
    },
    {
      id: 'o-eterno-vice',
      tier: 1,
      label: 'O Eterno Vice',
      desc: 'Ficou 5 ou mais vezes em 2º lugar e nunca chegou ao 1º.',
      unlocked: rank2Rounds >= 5 && stats.rodadasPrimeiro === 0,
    },
    {
      id: 'mosca-magra',
      tier: 1,
      label: 'Mosca Magra',
      desc: 'Ficou 5 ou mais rodadas fora do top 10.',
      unlocked: rodadasBelowTop10 >= 5,
    },
    {
      id: 'na-sorte',
      tier: 1,
      label: 'Na Sorte',
      desc: 'Apostou em apenas 1 jogo na rodada e cravou.',
      unlocked: hasNaSorte,
    },
    {
      id: 'colado-na-media',
      tier: 1,
      label: 'Colado na Média',
      desc: 'Empatou em pontos com outro participante em 3 ou mais rodadas.',
      unlocked: tiedRounds >= 3,
    },
    {
      id: 'o-muralha',
      tier: 1,
      label: 'O Muralha',
      desc: 'Pontuou (não zerou) em 30 ou mais rodadas da temporada.',
      unlocked: totalSemZero >= 30,
    },
    // ── TIER 2 ─────────────────────────────────────────────────────────────────
    {
      id: 'em-chamas',
      tier: 2,
      label: 'Em Chamas',
      // ⚠️ era mata-mata → virou liga: "seguidas" no TROFEUS.md foi erro de
      // redação — condição confirmada é TOTAL de rodadas no top 3, não consecutivo.
      desc: 'Ficou no top 3 em 4 ou mais rodadas da temporada.',
      unlocked: stats.rodadasTop3 >= 4,
    },
    {
      id: 'hat-trick',
      tier: 2,
      label: 'Hat-trick',
      desc: 'Cravou 4 placares na mesma rodada.',
      unlocked: hatTrickUnlocked,
    },
    {
      id: 'o-analista',
      tier: 2,
      label: 'O Analista',
      desc: 'Ficou acima da média do grupo em mais de 15 rodadas.',
      unlocked: rodadasAboveMean > 15,
    },
    {
      id: 'rei-dos-classicos',
      tier: 2,
      // ⚠️ era mata-mata → virou liga: substitui "Sangue Frio" (cravada em
      // mata-mata). Agora conta acerto de vencedor nos 9 clássicos regionais
      // oficiais. Requer RodadaHistorico.matches para identificar os times.
      label: 'Rei dos Clássicos',
      desc: 'Acertou o vencedor em 6 ou mais clássicos regionais na temporada.',
      unlocked: reiClassicos >= 6,
    },
    {
      id: 'o-papagaio',
      tier: 2,
      label: 'O Papagaio',
      desc: 'Apostou idêntico a outro participante em todos os jogos de uma rodada.',
      unlocked: papagaioUnlocked,
    },
    {
      id: 'fenix',
      tier: 2,
      label: 'Fênix',
      desc: 'Ficou 2 ou mais rodadas consecutivas em último e depois saiu.',
      unlocked: checkFenix(positions, n),
    },
    {
      id: 'o-showman',
      tier: 2,
      label: 'O Showman',
      desc: 'Cravou um placar com 5 ou mais gols no total.',
      unlocked: showmanUnlocked,
    },
    {
      id: 'lanterninha',
      tier: 2,
      label: 'Lanterninha',
      desc: 'Ficou em último lugar em 3 ou mais rodadas.',
      unlocked: stats.rodadasUltimo >= 3,
    },
    {
      id: 'olho-de-aguia',
      tier: 2,
      label: 'Olho de Águia',
      desc: 'Cravou 30 ou mais placares na temporada.',
      unlocked: stats.exatos >= 30,
    },
    // ── TIER 3 ─────────────────────────────────────────────────────────────────
    {
      id: 'perfeicao',
      tier: 3,
      label: 'Perfeição',
      // ⚠️ era mata-mata → virou liga: rebaixado de "cravou todos" para
      // "acertou ao menos o resultado em todos", pois cravar 100% dos jogos
      // de uma rodada é estatisticamente quase impossível (recorde do grupo: ~50%).
      desc: 'Acertou ao menos o resultado em todos os jogos apostados de uma rodada.',
      unlocked: perfeicaoUnlocked,
    },
    {
      id: 'lider-absoluto',
      tier: 3,
      label: 'Líder Absoluto',
      desc: 'Ficou mais vezes em 1º lugar do que qualquer outro participante.',
      unlocked: liderAbsoluto,
    },
    {
      id: 'estrela-cadente',
      tier: 3,
      label: 'Estrela Cadente',
      desc: 'Cravou 7 ou mais placares na temporada.',
      unlocked: stats.exatos >= 7,
    },
    {
      id: 'o-predador',
      tier: 3,
      label: 'O Predador',
      desc: 'Ficou mais vezes no top 3 do que qualquer outro participante.',
      unlocked: predador,
    },
    {
      id: 'jamais-terao',
      tier: 3,
      label: 'Jamais Terão',
      desc: 'Nunca ficou em último lugar em nenhuma rodada da temporada.',
      unlocked: stats.rodadas > 0 && stats.rodadasUltimo === 0,
    },
    {
      id: 'saldo-perfeito',
      tier: 3,
      label: 'Saldo Perfeito',
      desc: 'Acertou o saldo de gols em 20 ou mais jogos na temporada.',
      unlocked: stats.saldo >= 20,
    },
    {
      id: 'implacavel',
      tier: 3,
      label: 'Implacável',
      desc: 'Ficou 5 ou mais rodadas consecutivas no top 3.',
      unlocked: maxConsecTop3(positions) >= 5,
    },
    {
      id: 'franco-atirador',
      tier: 3,
      label: 'Franco Atirador',
      desc: 'Cravou 25 ou mais placares na temporada.',
      unlocked: stats.exatos >= 25,
    },
    {
      id: 'o-monolito',
      tier: 3,
      label: 'O Monólito',
      desc: 'Apostou o mesmo placar em todos os jogos de uma rodada.',
      unlocked: hasMonolito,
    },
    {
      id: 'diplomata',
      tier: 3,
      label: 'Diplomata',
      desc: 'Apostou mais empates (em %) do que qualquer outro participante (mínimo 3 rodadas).',
      unlocked: diplomatUnlocked,
    },
    {
      id: 'o-magico',
      tier: 3,
      label: 'O Mágico',
      desc: 'Cravou 5 placares em uma única rodada.',
      unlocked: magicoUnlocked,
    },
    // ── TIER 4 ─────────────────────────────────────────────────────────────────
    {
      id: 'campeao',
      tier: 4,
      label: 'CAMPEÃO!',
      desc: 'O maior pontuador de toda a temporada. Eterno.',
      unlocked: campeoUnlocked,
    },
  ]
}
