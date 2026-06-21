// Teste de sanidade de calcSequencia — roda no test runner nativo do Node:
//   node --test lib/domain/sequencia.test.ts

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcSequencia } from './sequencia.ts'
import { type RodadaHistorico } from './types.ts'

const PLAYERS = ['ana', 'bia', 'theo', 'davi', 'eli', 'fabi', 'guto', 'hugo', 'igor', 'julia']
// 10 jogadores: LIMIAR_QUEDA_LIVRE=8 → lanterna está em pos 10, queda ativa em pos 9+

function rodada(scores: Record<string, number>): RodadaHistorico {
  return { scores, tiebreak: {} }
}

// ─── Retorno null ────────────────────────────────────────────────────────────

test('retorna null com menos de 2 rodadas', () => {
  const h = [rodada({ ana: 5, bia: 3 })]
  assert.equal(calcSequencia('ana', h, PLAYERS), null)
})

test('retorna null em histórico vazio', () => {
  assert.equal(calcSequencia('ana', [], PLAYERS), null)
})

test('retorna null em situação neutra (sem padrão)', () => {
  // ana oscila sem streak e nem está na lanterna
  const h = [
    rodada({ ana: 5, bia: 8, theo: 6, davi: 4, eli: 3, fabi: 2, guto: 1, hugo: 0, igor: 0, julia: 0 }),
    rodada({ ana: 6, bia: 4, theo: 3, davi: 7, eli: 5, fabi: 2, guto: 1, hugo: 0, igor: 0, julia: 0 }),
  ]
  assert.equal(calcSequencia('ana', h, PLAYERS), null)
})

// ─── firstStreak ≥ 2 ─────────────────────────────────────────────────────────

test('2 rodadas liderando → narrativa de liderança', () => {
  const h = [
    rodada({ ana: 10, bia: 5, theo: 3, davi: 2, eli: 1, fabi: 0, guto: 0, hugo: 0, igor: 0, julia: 0 }),
    rodada({ ana: 12, bia: 6, theo: 4, davi: 3, eli: 2, fabi: 1, guto: 0, hugo: 0, igor: 0, julia: 0 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result?.startsWith('2 rodadas liderando'), `esperava "2 rodadas liderando", recebeu: "${result}"`)
})

test('firstStreak tem prioridade sobre topStreak', () => {
  // 4 rodadas em 1º → deve reportar firstStreak, não topStreak
  const make1st = (n: number) => rodada(
    Object.fromEntries(PLAYERS.map((p, i) => [p, p === 'ana' ? 100 : 10 - i]))
  )
  const h = [make1st(0), make1st(1), make1st(2), make1st(3)]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result?.startsWith('4 rodadas liderando'), `esperava "4 rodadas liderando", recebeu: "${result}"`)
})

// ─── topStreak ≥ 3 ───────────────────────────────────────────────────────────

test('3 rodadas no top 3 (sem liderar) → narrativa de top 3', () => {
  // ana sempre 2ª (bia na frente)
  const h = [
    rodada({ bia: 15, ana: 10, theo: 5, davi: 4, eli: 3, fabi: 2, guto: 1, hugo: 0, igor: 0, julia: 0 }),
    rodada({ bia: 12, ana: 11, theo: 6, davi: 5, eli: 4, fabi: 3, guto: 2, hugo: 1, igor: 0, julia: 0 }),
    rodada({ bia: 14, ana: 13, theo: 7, davi: 6, eli: 5, fabi: 4, guto: 3, hugo: 2, igor: 1, julia: 0 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result?.startsWith('3 rodadas no top 3'), `esperava "3 rodadas no top 3", recebeu: "${result}"`)
})

test('topStreak < 3 não dispara narrativa de top 3', () => {
  const h = [
    rodada({ bia: 15, ana: 10, theo: 5, davi: 4, eli: 3, fabi: 2, guto: 1, hugo: 0, igor: 0, julia: 0 }),
    rodada({ bia: 12, ana: 11, theo: 6, davi: 5, eli: 4, fabi: 3, guto: 2, hugo: 1, igor: 0, julia: 0 }),
  ]
  // só 2 rodadas em top3 → null (sem outros padrões)
  assert.equal(calcSequencia('ana', h, PLAYERS), null)
})

// ─── fallStreak + LIMIAR_QUEDA_LIVRE ─────────────────────────────────────────

test('2+ rodadas caindo E abaixo do limiar → queda livre', () => {
  // ana: pos 7 → 8 → 9 (caindo e abaixo do limiar 8)
  const h = [
    rodada({ bia: 20, theo: 18, davi: 16, eli: 14, fabi: 12, guto: 10, ana: 8, hugo: 6, igor: 4, julia: 2 }),
    rodada({ bia: 22, theo: 20, davi: 18, eli: 16, fabi: 14, guto: 12, hugo: 10, ana: 8, igor: 6, julia: 4 }),
    rodada({ bia: 24, theo: 22, davi: 20, eli: 18, fabi: 16, guto: 14, hugo: 12, igor: 10, ana: 8, julia: 6 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result?.startsWith('2 rodadas caindo'), `esperava "2 rodadas caindo", recebeu: "${result}"`)
})

test('caindo mas acima do limiar (pos ≤ 8) → não dispara queda livre', () => {
  // ana: pos 6 → 7 → 8 (caindo mas dentro do limiar — pos 8 não é > LIMIAR_QUEDA_LIVRE=8)
  const h = [
    rodada({ bia: 20, theo: 18, davi: 16, eli: 14, fabi: 12, ana: 10, guto: 8, hugo: 6, igor: 4, julia: 2 }),
    rodada({ bia: 22, theo: 20, davi: 18, eli: 16, fabi: 14, guto: 12, ana: 10, hugo: 8, igor: 6, julia: 4 }),
    rodada({ bia: 24, theo: 22, davi: 20, eli: 18, fabi: 16, guto: 14, hugo: 12, ana: 10, igor: 8, julia: 6 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.equal(result, null)
})

// ─── subida brusca ────────────────────────────────────────────────────────────

test('saiu do fundo (pos > 5) para o top 3 (pos ≤ 3) → subida', () => {
  const h = [
    // R1: ana em 8º
    rodada({ bia: 20, theo: 18, davi: 16, eli: 14, fabi: 12, guto: 10, hugo: 8, ana: 6, igor: 4, julia: 2 }),
    // R2: ana sobe para 2º
    rodada({ bia: 22, ana: 20, theo: 10, davi: 8, eli: 6, fabi: 4, guto: 3, hugo: 2, igor: 1, julia: 0 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result?.startsWith('subiu'), `esperava "subiu X posições", recebeu: "${result}"`)
  assert.ok(result?.includes('6'), `esperava mencionar 6 posições (8→2), recebeu: "${result}"`)
})

// ─── lanterna ────────────────────────────────────────────────────────────────

test('último colocado → narrativa de lanterna', () => {
  const h = [
    rodada({ bia: 20, theo: 18, davi: 16, eli: 14, fabi: 12, guto: 10, hugo: 8, igor: 6, julia: 4, ana: 2 }),
    rodada({ bia: 22, theo: 20, davi: 18, eli: 16, fabi: 14, guto: 12, hugo: 10, igor: 8, julia: 6, ana: 4 }),
  ]
  const result = calcSequencia('ana', h, PLAYERS)
  assert.ok(result !== null, 'deve retornar uma narrativa de lanterna')
  // A lanterna NÃO começa com número de rodadas — é uma frase avulsa
  assert.ok(!/^\d/.test(result!), `narrativa de lanterna não deve começar com número, recebeu: "${result}"`)
})

// ─── determinismo ────────────────────────────────────────────────────────────

test('pick é determinístico: mesmo jogador + mesmo histórico → mesma frase', () => {
  const h = [
    rodada({ ana: 10, bia: 5, theo: 3, davi: 2, eli: 1, fabi: 0, guto: 0, hugo: 0, igor: 0, julia: 0 }),
    rodada({ ana: 12, bia: 6, theo: 4, davi: 3, eli: 2, fabi: 1, guto: 0, hugo: 0, igor: 0, julia: 0 }),
  ]
  const r1 = calcSequencia('ana', h, PLAYERS)
  const r2 = calcSequencia('ana', h, PLAYERS)
  assert.equal(r1, r2)
})
