// Narrativa de sequência de um jogador — função pura, sem dependência de UI.
//
// PRESERVA LÓGICA (CLAUDE.md §6): extração fiel do Copa. Sem resíduo de
// mata-mata (a função nunca usou multiplicador de fase nem extras). Regra 9:
// nada a sinalizar como "era mata-mata → virou liga" aqui.

import { type RodadaHistorico } from './types.ts'

/**
 * Piso de posição (1-based) para disparar a narrativa de "queda livre".
 * Com 14 participantes, só aciona se o jogador estiver em 9º ou pior —
 * i.e., já saiu do campo competitivo e continua caindo. Em grupos menores
 * o efeito é mais raro, o que é o comportamento esperado.
 */
const LIMIAR_QUEDA_LIVRE = 8

/**
 * Sorteia um item de forma determinística: dado o mesmo `player` e o mesmo
 * comprimento de `history`, o resultado é sempre o mesmo — sem aleatoriedade
 * a cada render. Fiel ao Copa.
 */
function pick(arr: string[], player: string, historyLen: number): string {
  return arr[Math.floor(Math.abs(Math.sin(player.length * historyLen)) * arr.length)]
}

/**
 * Retorna uma frase narrativa sobre a sequência recente do jogador, ou `null`
 * quando nenhum padrão se aplica (menos de 2 rodadas ou situação neutra).
 *
 * Padrões verificados em ordem de prioridade:
 *  1. firstStreak ≥ 2  → liderando há N rodadas
 *  2. topStreak ≥ 3    → grudado no top 3 há N rodadas
 *  3. fallStreak ≥ 2 E posição > LIMIAR_QUEDA_LIVRE → em queda livre
 *  4. posição anterior > 5 E posição atual ≤ 3 → subida brusca
 *  5. posição atual = último → lanterna
 *
 * O copy das frases fica dentro desta função de propósito: é uma cápsula
 * completa, fiel ao Copa. Quando o Guia/copy for reescrito para o contexto do
 * Brasileirão (CLAUDE.md §6.5, Fase 3), este arquivo é o lugar certo.
 */
export function calcSequencia(
  player: string,
  history: RodadaHistorico[],
  allPlayers: string[],
): string | null {
  if (history.length < 2) return null

  // Posição 1-based do jogador em cada rodada, ordenada por pontos desc.
  // ⚠️ Fiel ao Copa: empate de pontuação sem critério de desempate (decisão
  // de produto em aberto — ver stats.ts).
  const positions = history.map((r) => {
    const sorted = [...allPlayers].sort((a, b) => (r.scores?.[b] || 0) - (r.scores?.[a] || 0))
    return sorted.indexOf(player) + 1
  })

  const last = positions[positions.length - 1]
  const prev = positions[positions.length - 2]

  // Rodadas consecutivas em 1º (do fim para o início).
  let firstStreak = 0
  for (let i = positions.length - 1; i >= 0; i--) {
    if (positions[i] === 1) firstStreak++
    else break
  }

  // Rodadas consecutivas no top 3 (do fim para o início).
  let topStreak = 0
  for (let i = positions.length - 1; i >= 0; i--) {
    if (positions[i] <= 3) topStreak++
    else break
  }

  // Rodadas consecutivas CAINDO de posição (posição piorou vs rodada anterior).
  let fallStreak = 0
  for (let i = positions.length - 1; i >= 1; i--) {
    if (positions[i] > positions[i - 1]) fallStreak++
    else break
  }

  const n = history.length

  const FTOP1 = [
    'invicto no topo 🔥',
    'dominando sem dó 💪',
    'sem concorrência 👑',
    'é o rei da rodada 🏆',
    'tá na beira do abismo 👑',
  ]
  const FTOP3 = [
    'grudado no top 3 🔥',
    'não sai do pódio 🏅',
    'vício em top 3 😤',
    'dando trabalho pro líder 👀',
    'colado no pódio 🤝',
  ]
  const FQUEDA = [
    'em queda livre 📉',
    'escorregando na tabela 😬',
    'descendo mais rápido do que apostou 💀',
    'saindo do top 📣',
    'alguém chama ele 🤦',
  ]
  const FSUBIDA = [
    'recuperando o fôlego 📈',
    'voltando com força 💪',
    'subindo na tabela 🚀',
    'parece que acordou 👀',
    'resolveu jogar sério 😏',
  ]
  const FLANTERNA = [
    'lanterna... alguém acorda esse cara 😴',
    'digno do troféu de último 💩',
    'nem palpitou direito 🤡',
  ]

  if (firstStreak >= 2) return `${firstStreak} rodadas liderando — ${pick(FTOP1, player, n)}`
  if (topStreak >= 3) return `${topStreak} rodadas no top 3 — ${pick(FTOP3, player, n)}`
  if (fallStreak >= 2 && last > LIMIAR_QUEDA_LIVRE) return `${fallStreak} rodadas caindo — ${pick(FQUEDA, player, n)}`
  if (prev > 5 && last <= 3) return `subiu ${prev - last} posições — ${pick(FSUBIDA, player, n)}`
  if (last === allPlayers.length) return pick(FLANTERNA, player, n)
  return null
}
