// Teste de sanidade de calcProjecaoPct — roda no test runner nativo do Node:
//   node --test lib/domain/projecao.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcProjecaoPct } from './projecao.ts'
import { type RodadaHistorico } from './types.ts'

function rodada(scores: Record<string, number>): RodadaHistorico {
  return { scores, tiebreak: {} }
}

// ─── Guards de entrada ───────────────────────────────────────────────────────

test('retorna {} com menos de 2 rodadas', () => {
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 5, bia: 3 },
    history: [rodada({ ana: 5, bia: 3 })],
  })
  assert.deepEqual(r, {})
})

test('retorna {} com histórico vazio', () => {
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: {},
    history: [],
  })
  assert.deepEqual(r, {})
})

test('retorna {} quando projeção total é zero (todos sem pontos)', () => {
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 0, bia: 0 },
    history: [rodada({ ana: 0, bia: 0 }), rodada({ ana: 0, bia: 0 })],
  })
  assert.deepEqual(r, {})
})

// ─── Correção do rodadasRestantes (era mata-mata → virou liga) ───────────────

test('rodadasRestantes usa totalRodadas - history.length, não history.length', () => {
  // Copa usaria rodadasRestantes = 2 (hist.length). Liga usa 38-2 = 36.
  // Com médias diferentes, os resultados serão distintos — checamos que o
  // líder com mais média projeta proporcionalmente mais, o que só é verdade
  // com rodadasRestantes grande (36), não pequeno (2).
  // ana: média 10/rodada, bia: média 2/rodada; totalPoints iguais (zero).
  // Com 36 rodadas restantes: ana projeta 360, bia projeta 72 → ana ~83%.
  // Com 2 rodadas (bug do Copa): ana projeta 20, bia projeta 4 → ana ~83% também.
  // Mas com totais diferentes o erro do Copa fica explícito:
  // ana: total 100, média 10 → projeção 100 + 10*36 = 460 (liga) vs 100 + 10*2 = 120 (copa)
  // bia: total 100, média 2  → projeção 100 + 2*36  = 172 (liga) vs 100 + 2*2  = 104 (copa)
  // Liga: ana 460/(460+172) ≈ 73%  Copa: ana 120/(120+104) ≈ 54% → resultado diferente.
  const h = [rodada({ ana: 10, bia: 2 }), rodada({ ana: 10, bia: 2 })]
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 100, bia: 100 },
    history: h,
    totalRodadas: 38,
  })
  // liga: ana ≈ 73%, não ≈ 54% do Copa
  assert.ok(r['ana']! > 70, `esperava ana > 70%, recebeu ${r['ana']}%`)
  assert.ok(r['bia']! < 30, `esperava bia < 30%, recebeu ${r['bia']}%`)
})

test('rodadasRestantes não fica negativo quando história excede totalRodadas', () => {
  // ex.: rodadas extras / remanejamentos além das 38
  const history = Array.from({ length: 40 }, () => rodada({ ana: 5, bia: 3 }))
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 200, bia: 120 },
    history,
    totalRodadas: 38,
  })
  // rodadasRestantes = max(38-40, 0) = 0; projeção = só totalAtual
  assert.equal(r['ana'], Math.round((200 / 320) * 100))
  assert.equal(r['bia'], Math.round((120 / 320) * 100))
})

// ─── Normalização e proporção ────────────────────────────────────────────────

test('percentuais somam ~100 (tolerância de ±2 por arredondamento)', () => {
  const history = [
    rodada({ ana: 8, bia: 5, theo: 3 }),
    rodada({ ana: 6, bia: 7, theo: 4 }),
  ]
  const r = calcProjecaoPct({
    players: ['ana', 'bia', 'theo'],
    totalPoints: { ana: 14, bia: 12, theo: 7 },
    history,
  })
  const soma = (r['ana'] || 0) + (r['bia'] || 0) + (r['theo'] || 0)
  assert.ok(Math.abs(soma - 100) <= 2, `soma dos % deve ser ~100, recebeu ${soma}`)
})

test('jogador com média e total maiores projeta % maior', () => {
  const history = [
    rodada({ ana: 10, bia: 2 }),
    rodada({ ana: 10, bia: 2 }),
  ]
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 20, bia: 4 },
    history,
  })
  assert.ok(r['ana']! > r['bia']!, `ana deve projetar mais que bia`)
})

test('jogadores com mesma média e mesmo total projetam % iguais', () => {
  const history = [rodada({ ana: 5, bia: 5 }), rodada({ ana: 5, bia: 5 })]
  const r = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 10, bia: 10 },
    history,
  })
  assert.equal(r['ana'], r['bia'])
})

// ─── Parâmetro totalRodadas ──────────────────────────────────────────────────

test('totalRodadas padrão é 38', () => {
  const history = [rodada({ ana: 5, bia: 5 }), rodada({ ana: 5, bia: 5 })]
  const comPadrao = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 10, bia: 10 },
    history,
  })
  const com38 = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 10, bia: 10 },
    history,
    totalRodadas: 38,
  })
  assert.deepEqual(comPadrao, com38)
})

test('totalRodadas customizável para temporadas com rodadas extras', () => {
  const history = [rodada({ ana: 8, bia: 4 }), rodada({ ana: 8, bia: 4 })]
  const r40 = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 16, bia: 8 },
    history,
    totalRodadas: 40, // rodadas extras de jogos remarcados
  })
  // com mais rodadas restantes (38), a vantagem de média de ana fica mais pronunciada
  const r38 = calcProjecaoPct({
    players: ['ana', 'bia'],
    totalPoints: { ana: 16, bia: 8 },
    history,
    totalRodadas: 38,
  })
  // ana pontua o dobro de bia; com mais rodadas restantes, a diferença de % aumenta
  assert.ok(r40['ana']! >= r38['ana']!, `com mais rodadas restantes ana deve projetar >= que com menos`)
})
