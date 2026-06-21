// Teste de sanidade de calcPoints — roda com o test runner nativo do Node:
//   node --test lib/domain/pontuacao.test.ts
// (Node 22+ faz type-stripping de TS nativamente; nenhuma dependência nova.)

import { test } from 'node:test'
import assert from 'node:assert/strict'
import { calcPoints } from './pontuacao.ts'
import { REGRAS_PADRAO } from './types.ts'

test('cravada (placar exato) vale 5', () => {
  assert.equal(calcPoints({ h: 2, a: 1 }, { h: 2, a: 1 }), REGRAS_PADRAO.exato)
})

test('saldo correto (sem cravar) vale 3', () => {
  // palpite 2x1 (saldo +1), resultado 3x2 (saldo +1) — mesmo saldo, placar diferente
  assert.equal(calcPoints({ h: 2, a: 1 }, { h: 3, a: 2 }), REGRAS_PADRAO.saldo)
})

test('empate com placar diferente cai no saldo (saldo 0 dos dois)', () => {
  // 1x1 vs 2x2: saldo 0 nos dois → regra de saldo, não vencedor
  assert.equal(calcPoints({ h: 1, a: 1 }, { h: 2, a: 2 }), REGRAS_PADRAO.saldo)
})

test('só o vencedor (saldo diferente) vale 1', () => {
  // palpite 3x0 (saldo +3), resultado 1x0 (saldo +1) — mesmo vencedor, saldo diferente
  assert.equal(calcPoints({ h: 3, a: 0 }, { h: 1, a: 0 }), REGRAS_PADRAO.vencedor)
})

test('errou tudo vale 0 (não null)', () => {
  // palpite vitória da casa, resultado vitória do visitante
  assert.equal(calcPoints({ h: 2, a: 0 }, { h: 0, a: 1 }), 0)
})

test('palpite incompleto retorna null', () => {
  assert.equal(calcPoints({ h: '', a: '' }, { h: 1, a: 0 }), null)
  assert.equal(calcPoints({ h: 1, a: null }, { h: 1, a: 0 }), null)
})

test('resultado ainda não lançado retorna null', () => {
  assert.equal(calcPoints({ h: 1, a: 0 }, { h: '', a: '' }), null)
})

test('gols como string (vindos de input) são parseados', () => {
  assert.equal(calcPoints({ h: '2', a: '1' }, { h: '2', a: '1' }), REGRAS_PADRAO.exato)
})

test('regras customizadas são respeitadas (preparando extras de liga)', () => {
  const regras = { vencedor: 2, saldo: 4, exato: 7 }
  assert.equal(calcPoints({ h: 1, a: 0 }, { h: 1, a: 0 }, regras), 7)
  assert.equal(calcPoints({ h: 2, a: 1 }, { h: 3, a: 2 }, regras), 4)
  assert.equal(calcPoints({ h: 3, a: 0 }, { h: 1, a: 0 }, regras), 2)
})
