// Teste de sanidade de calcPlayerStats — roda no test runner nativo do Node:
//   node --test lib/domain/stats.test.ts
// (Node 22+ faz type-stripping de TS nativamente; nenhuma dependência nova.)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcPlayerStats } from './stats.ts'
import { type RodadaHistorico } from './types.ts'

// Cenário compartilhado com 3 rodadas para "ana" e armadilhas de borda.
//  R1: ana 5 (1º), bia 1, theo 0           -> ana cravou 1, goleada cravada
//  R2: ana 0 (último), bia 3, theo 1       -> ana zera, despenca de posição
//  R3: ana 6 (1º de novo), bia 1, theo AUSENTE -> ana sobe 2 posições; theo faltou
const history: RodadaHistorico[] = [
  {
    scores: { ana: 5, bia: 1, theo: 0 },
    tiebreak: {
      ana: { exact: 1, correct: 1, saldo: 0 },
      bia: { exact: 0, correct: 1, saldo: 0 },
      theo: { exact: 0, correct: 0, saldo: 0 },
    },
    palpites: {
      ana: {
        m1: { h: 3, a: 2 }, // goleada (5 gols) E cravada do resultado abaixo
        m2: { h: 1, a: 1 }, // empate apostado
        m3: { h: 2, a: '' }, // pela metade: conta em totalApostados (fiel ao Copa)
      },
    },
    results: { m1: { h: 3, a: 2 } },
  },
  {
    scores: { ana: 0, bia: 3, theo: 1 },
    tiebreak: { ana: { exact: 0, correct: 0, saldo: 0 } },
    palpites: { ana: { m1: { h: 0, a: 0 } } }, // outro empate apostado
  },
  {
    scores: { ana: 6, bia: 1 }, // theo ausente nesta rodada
    tiebreak: { ana: { exact: 1, correct: 2, saldo: 0 } },
  },
]

test('totais agregam ao longo da temporada', () => {
  const s = calcPlayerStats('ana', history)
  assert.equal(s.rodadas, 3)
  assert.equal(s.totalPts, 11)
  assert.equal(s.mediaPts, 11 / 3)
  assert.equal(s.exatos, 2) // R1:1 + R3:1
  assert.equal(s.vencedor, 1) // R3: correct 2 - exact 1
  assert.equal(s.saldo, 0)
})

test('posições por rodada: primeiro, top3, último', () => {
  const s = calcPlayerStats('ana', history)
  assert.equal(s.rodadasPrimeiro, 2) // R1 e R3
  assert.equal(s.rodadasTop3, 3) // ana sempre no top 3 (só 3 jogadores)
  assert.equal(s.rodadasUltimo, 1) // R2
})

test('maior salto de posição entre rodadas consecutivas', () => {
  const s = calcPlayerStats('ana', history)
  // R2 ana em último (pos 2) -> R3 ana em 1º (pos 0): salto = 2
  assert.equal(s.maxSaltoPos, 2)
})

test('maior série sem zerar quebra no zero da R2', () => {
  const s = calcPlayerStats('ana', history)
  // R1 pontua (série 1), R2 zera (reset), R3 pontua (série 1) -> máx 1
  assert.equal(s.maxSeriaSemZero, 1)
})

test('empates e goleadas apostadas', () => {
  const s = calcPlayerStats('ana', history)
  assert.equal(s.empatesApostados, 2) // R1 m2 (1x1) + R2 m1 (0x0)
  assert.equal(s.goleadasApostadas, 1) // R1 m1 (3+2=5)
  assert.equal(s.goleadasAcertadas, 1) // R1 m1 cravada no results
})

test('palpite pela metade conta em totalApostados (fiel ao Copa)', () => {
  const s = calcPlayerStats('ana', history)
  // R1: m1, m2, m3(pela metade) = 3 ; R2: m1 = 1 ; total = 4
  assert.equal(s.totalApostados, 4)
  assert.equal(s.pctEmpate, 2 / 4)
})

test('faltouPalpitar conta rodadas sem score e zera a série', () => {
  // theo: pontua R1 e R2, mas some da R3 (sem score) -> faltou 1
  const s = calcPlayerStats('theo', history)
  assert.equal(s.rodadas, 2)
  assert.equal(s.faltouPalpitar, 1)
})

test('jogador sem histórico retorna zeros sem dividir por zero', () => {
  const s = calcPlayerStats('ninguem', history)
  assert.equal(s.rodadas, 0)
  assert.equal(s.mediaPts, 0)
  assert.equal(s.pctEmpate, 0)
  assert.equal(s.faltouPalpitar, 3)
})
