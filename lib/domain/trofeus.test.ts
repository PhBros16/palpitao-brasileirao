// Teste de sanidade de calcTrofeus — roda no test runner nativo do Node:
//   node --test lib/domain/trofeus.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcTrofeus, type Trofeu } from './trofeus.ts'
import { type PlayerStats } from './stats.ts'
import { type RodadaHistorico } from './types.ts'

const PLAYERS = ['ana', 'bia', 'theo', 'davi']

function rodada(scores: Record<string, number>): RodadaHistorico {
  return { scores, tiebreak: {} }
}

function makeStats(o: Partial<PlayerStats> = {}): PlayerStats {
  return {
    exatos: 0, vencedor: 0, saldo: 0, rodadas: 0, totalPts: 0,
    mediaPts: 0, maxSaltoPos: 0, maxSeriaSemZero: 0, rodadasTop3: 0,
    rodadasUltimo: 0, rodadasPrimeiro: 0, empatesApostados: 0,
    totalApostados: 0, pctEmpate: 0, goleadasApostadas: 0,
    goleadasAcertadas: 0, faltouPalpitar: 0,
    ...o,
  }
}

function find(trofeus: Trofeu[], id: string): Trofeu {
  const t = trofeus.find((t) => t.id === id)
  assert.ok(t, `troféu "${id}" não encontrado`)
  return t!
}

// ─── Estrutura do retorno ─────────────────────────────────────────────────────

test('retorna exatamente 34 troféus', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [], totalPoints: {},
  })
  assert.equal(r.length, 34)
})

test('todos os ids são únicos', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [], totalPoints: {},
  })
  const ids = r.map((t) => t.id)
  assert.equal(new Set(ids).size, 34)
})

test('sem histórico todos ficam unlocked: false', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [], totalPoints: {},
  })
  assert.ok(r.every((t) => !t.unlocked), 'algum troféu desbloqueado sem dados')
})

test('tiers válidos (1-4) em todos os troféus', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [], totalPoints: {},
  })
  assert.ok(r.every((t) => t.tier >= 1 && t.tier <= 4))
  assert.equal(r.filter((t) => t.tier === 1).length, 13)
  assert.equal(r.filter((t) => t.tier === 2).length, 9)
  assert.equal(r.filter((t) => t.tier === 3).length, 11)
  assert.equal(r.filter((t) => t.tier === 4).length, 1)
})

// ─── TIER 1 ──────────────────────────────────────────────────────────────────

test('Veterano: unlocked com 5+ rodadas', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadas: 5 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'veterano').unlocked, true)
})

test('Veterano: locked com 4 rodadas', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadas: 4 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'veterano').unlocked, false)
})

test('Dormiu no Ponto: unlocked com 3+ faltas', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ faltouPalpitar: 3 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'dormiu-no-ponto').unlocked, true)
})

test('Resistente: unlocked quando faltouPalpitar === 0 e history.length > 0', () => {
  const h = [rodada({ ana: 5, bia: 3, theo: 2, davi: 1 })]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ faltouPalpitar: 0 }),
    history: h, totalPoints: {},
  })
  assert.equal(find(r, 'resistente').unlocked, true)
})

test('Resistente: locked com histórico vazio mesmo que faltouPalpitar === 0', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ faltouPalpitar: 0 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'resistente').unlocked, false)
})

test('Zero a Zero: unlocked com 3+ apostas 0×0', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 0, bia: 1, theo: 2, davi: 3 },
      tiebreak: {},
      palpites: { ana: { m1: { h: 0, a: 0 }, m2: { h: 0, a: 0 }, m3: { h: 0, a: 0 } } },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'zero-a-zero').unlocked, true)
})

test('Virada de Mesa: subiu 3+ posições entre duas rodadas', () => {
  const h = [
    rodada({ bia: 10, theo: 8, davi: 6, ana: 4 }), // ana em 4º
    rodada({ ana: 20, bia: 1, theo: 1, davi: 1 }),  // ana em 1º: +3
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'virada-de-mesa').unlocked, true)
})

test('O Pacifista: 60%+ empates em uma rodada', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 3, bia: 5, theo: 2, davi: 1 },
      tiebreak: {},
      palpites: {
        ana: {
          m1: { h: 1, a: 1 }, // empate
          m2: { h: 1, a: 1 }, // empate
          m3: { h: 1, a: 1 }, // empate
          m4: { h: 2, a: 0 }, // não empate — 3/4 = 75% ≥ 60%
        },
      },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'o-pacifista').unlocked, true)
})

test('Na Sorte: apostou 1 jogo e cravou', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 5, bia: 3, theo: 2, davi: 1 },
      tiebreak: { ana: { exact: 1, correct: 1, saldo: 0 } },
      palpites: { ana: { m1: { h: 2, a: 1 } } }, // só 1 jogo
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'na-sorte').unlocked, true)
})

test('Colado na Média: empatou pontos 3x', () => {
  // ana e bia sempre empatam
  const h = [
    rodada({ ana: 5, bia: 5, theo: 3, davi: 1 }),
    rodada({ ana: 3, bia: 3, theo: 6, davi: 2 }),
    rodada({ ana: 7, bia: 7, theo: 4, davi: 2 }),
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'colado-na-media').unlocked, true)
})

// ─── TIER 2 ──────────────────────────────────────────────────────────────────

test('Em Chamas: unlocked com 4+ rodadas no top 3 (total, não consecutivo)', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadasTop3: 4 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'em-chamas').unlocked, true)
})

test('Em Chamas: locked com 3 rodadas no top 3', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadasTop3: 3 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'em-chamas').unlocked, false)
})

test('Hat-trick: unlocked com 4 exatos numa rodada', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 20, bia: 5, theo: 3, davi: 1 },
      tiebreak: { ana: { exact: 4, correct: 4, saldo: 0 } },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'hat-trick').unlocked, true)
})

test('Fênix: 2+ rodadas em último depois saiu', () => {
  // ana: 4º → 4º → 1º
  const h = [
    rodada({ bia: 10, theo: 8, davi: 6, ana: 1 }), // 4º (último)
    rodada({ bia: 10, theo: 8, davi: 6, ana: 1 }), // 4º (último) — streak de 2
    rodada({ ana: 20, bia: 1, theo: 1, davi: 1 }),  // 1º — saiu → Fênix!
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'fenix').unlocked, true)
})

test('Fênix: locked se saiu antes de completar 2 rodadas em último', () => {
  const h = [
    rodada({ bia: 10, theo: 8, davi: 6, ana: 1 }), // 4º (único round em último)
    rodada({ ana: 20, bia: 1, theo: 1, davi: 1 }),  // 1º — saiu cedo, não conta
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'fenix').unlocked, false)
})

test('Lanterninha: 3+ rodadas em último', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadasUltimo: 3 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'lanterninha').unlocked, true)
})

test('O Showman: cravou placar com 5+ gols', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 5, bia: 1, theo: 0, davi: 0 },
      tiebreak: { ana: { exact: 1, correct: 1, saldo: 0 } },
      palpites: { ana: { m1: { h: 3, a: 2 } } },
      results: { m1: { h: 3, a: 2 } }, // 5 gols, cravada
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'o-showman').unlocked, true)
})

test('Rei dos Clássicos: 6+ clássicos com vencedor acertado', () => {
  const makeClassico = (idx: number): RodadaHistorico => ({
    scores: { ana: 1, bia: 0, theo: 0, davi: 0 },
    tiebreak: { ana: { exact: 0, correct: 1, saldo: 0 } },
    palpites: { ana: { [`c${idx}`]: { h: 2, a: 0 } } }, // aposta: Grenal casa ganha
    results: { [`c${idx}`]: { h: 2, a: 0 } },            // resultado: casa ganhou (acertou vencedor)
    matches: [{ id: `c${idx}`, home: 'Grêmio', away: 'Internacional' }],
  })
  const h = Array.from({ length: 6 }, (_, i) => makeClassico(i))
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'rei-dos-classicos').unlocked, true)
})

test('Rei dos Clássicos: locked com 5 acertos (precisa de 6)', () => {
  const makeClassico = (idx: number): RodadaHistorico => ({
    scores: { ana: 1, bia: 0, theo: 0, davi: 0 },
    tiebreak: {},
    palpites: { ana: { [`c${idx}`]: { h: 2, a: 0 } } },
    results: { [`c${idx}`]: { h: 2, a: 0 } },
    matches: [{ id: `c${idx}`, home: 'Grêmio', away: 'Internacional' }],
  })
  const h = Array.from({ length: 5 }, (_, i) => makeClassico(i))
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'rei-dos-classicos').unlocked, false)
})

// ─── TIER 3 ──────────────────────────────────────────────────────────────────

test('Estrela Cadente: unlocked com 7+ exatos', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ exatos: 7 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'estrela-cadente').unlocked, true)
})

test('Estrela Cadente: locked com 6 exatos', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ exatos: 6 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'estrela-cadente').unlocked, false)
})

test('Jamais Terão: nunca ficou em último', () => {
  const h = [
    rodada({ ana: 10, bia: 8, theo: 5, davi: 3 }),
    rodada({ ana: 6, bia: 9, theo: 4, davi: 2 }),
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadas: 2, rodadasUltimo: 0 }),
    history: h, totalPoints: {},
  })
  assert.equal(find(r, 'jamais-terao').unlocked, true)
})

test('Jamais Terão: locked se ficou em último uma vez', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadas: 3, rodadasUltimo: 1 }),
    history: [], totalPoints: {},
  })
  assert.equal(find(r, 'jamais-terao').unlocked, false)
})

test('Líder Absoluto: mais rodadas em 1º do que qualquer outro', () => {
  const h = [
    rodada({ ana: 10, bia: 5, theo: 3, davi: 1 }), // ana 1º
    rodada({ ana: 10, bia: 5, theo: 3, davi: 1 }), // ana 1º
    rodada({ bia: 10, ana: 5, theo: 3, davi: 1 }), // bia 1º
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats({ rodadasPrimeiro: 2 }),
    history: h, totalPoints: {},
  })
  assert.equal(find(r, 'lider-absoluto').unlocked, true)
})

test('Implacável: 5 rodadas consecutivas no top 3', () => {
  const h = [
    rodada({ ana: 10, bia: 9, theo: 8, davi: 1 }), // ana 1º (top3)
    rodada({ ana: 10, bia: 9, theo: 8, davi: 1 }), // ana 1º (top3)
    rodada({ bia: 10, ana: 9, theo: 8, davi: 1 }), // ana 2º (top3)
    rodada({ bia: 10, theo: 9, ana: 8, davi: 1 }), // ana 3º (top3)
    rodada({ bia: 10, theo: 9, ana: 8, davi: 1 }), // ana 3º (top3) — 5 consecutivas!
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'implacavel').unlocked, true)
})

test('O Monólito: mesmo placar em todos os jogos da rodada', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 3, bia: 5, theo: 2, davi: 1 },
      tiebreak: {},
      palpites: {
        ana: { m1: { h: 1, a: 0 }, m2: { h: 1, a: 0 }, m3: { h: 1, a: 0 } },
      },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'o-monolito').unlocked, true)
})

test('Perfeição: acertou resultado em todos os jogos apostados da rodada', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 9, bia: 5, theo: 3, davi: 1 },
      tiebreak: { ana: { exact: 1, correct: 3, saldo: 0 } }, // 3 apostas, 3 corretas
      palpites: { ana: { m1: { h: 1, a: 0 }, m2: { h: 2, a: 1 }, m3: { h: 2, a: 2 } } },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'perfeicao').unlocked, true)
})

test('Diplomata: maior pctEmpate entre jogadores com ≥3 rodadas', () => {
  const makeRodada = (anaEmpate: boolean): RodadaHistorico => ({
    scores: { ana: 1, bia: 1, theo: 1, davi: 1 },
    tiebreak: {},
    palpites: {
      ana: { m1: anaEmpate ? { h: 1, a: 1 } : { h: 2, a: 0 } },
      bia: { m1: { h: 2, a: 0 } }, // bia nunca aposta empate
    },
  })
  // ana: 3/3 empates (100%), bia: 0/3 (0%)
  const h = [makeRodada(true), makeRodada(true), makeRodada(true)]
  const r = calcTrofeus({
    player: 'ana', players: ['ana', 'bia'],
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'diplomata').unlocked, true)
})

// ─── TIER 4 ──────────────────────────────────────────────────────────────────

test('CAMPEÃO!: maior pontuação total', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [],
    totalPoints: { ana: 150, bia: 120, theo: 100, davi: 80 },
  })
  assert.equal(find(r, 'campeao').unlocked, true)
})

test('CAMPEÃO!: locked se não for o maior', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [],
    totalPoints: { ana: 120, bia: 150, theo: 100, davi: 80 },
  })
  assert.equal(find(r, 'campeao').unlocked, false)
})

test('CAMPEÃO!: locked se empate (precisa ser estritamente maior)', () => {
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: [],
    totalPoints: { ana: 150, bia: 150, theo: 100, davi: 80 },
  })
  assert.equal(find(r, 'campeao').unlocked, false)
})

// ─── O Mágico (Tier 3) ───────────────────────────────────────────────────────

test('O Mágico: 5 cravadas em uma única rodada', () => {
  const h: RodadaHistorico[] = [
    {
      scores: { ana: 25, bia: 5, theo: 3, davi: 1 },
      tiebreak: { ana: { exact: 5, correct: 5, saldo: 0 } },
    },
  ]
  const r = calcTrofeus({
    player: 'ana', players: PLAYERS,
    stats: makeStats(), history: h, totalPoints: {},
  })
  assert.equal(find(r, 'o-magico').unlocked, true)
})
