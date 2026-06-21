// Motor de pontuação da liga — função pura, sem dependência de UI nem de estado.
//
// PRESERVA LÓGICA, RECONSTRÓI CASCA (CLAUDE.md §1): a regra de pontuação abaixo
// é a do Copa, testada em produção. O que mudou foi a CASCA — os parâmetros de
// mata-mata saíram (ver "era mata-mata → virou liga" abaixo).

import { type Placar, type RegrasPontuacao, REGRAS_PADRAO } from './types.ts'

/** Normaliza um gol vindo de input (string), número, ou vazio. */
function parseGol(v: number | string | null | undefined): number | null {
  if (v === null || v === undefined || v === '') return null
  const n = typeof v === 'number' ? v : parseInt(v, 10)
  return Number.isNaN(n) ? null : n
}

/**
 * Calcula os pontos de um palpite contra um resultado.
 *
 * Retorna:
 *  - `null`  quando palpite OU resultado está incompleto/ inválido
 *            (na UI isso significa "ainda sem pontuação"; comportamento de
 *            produção preservado do Copa);
 *  - `0`     quando errou tudo (nem vencedor);
 *  - os pontos da regra correspondente caso contrário (cravada > saldo > vencedor).
 *
 * ⚠️ era mata-mata → virou liga (CLAUDE.md §3, Regra 9). A assinatura do Copa
 * era `calcPoints(pal, res, phase, mult, m, extraRes, scoreMult)`. Saíram:
 *   • `mult` (PHASE_MULTIPLIERS por fase eliminatória) — em liga não há
 *     multiplicador de fase; o total é o ponto-base, sem `base * mult`.
 *   • `m`, `extraRes`, `scoreMult` — eram os extras "Quem Avança" (`hasQuemAvanca`)
 *     e "Pênaltis" (`hasPenaltis`), exclusivos do mata-mata. Removidos por inteiro.
 *   • `phase` (objeto com `.rules` em array indexado) virou `regras` nomeado.
 *
 * Costura de extensão (NÃO implementar agora — decisão de produto em aberto):
 * extras de liga ("clássico vale mais", rodada decisiva) entrariam aqui como um
 * parâmetro opcional adicional (ex.: `multiplicadorJogo = 1`) sem quebrar as
 * chamadas atuais. A aposta de artilheiro é uma função à parte, não cabe aqui.
 */
export function calcPoints(
  palpite: Placar,
  resultado: Placar,
  regras: RegrasPontuacao = REGRAS_PADRAO,
): number | null {
  const ph = parseGol(palpite?.h)
  const pa = parseGol(palpite?.a)
  const rh = parseGol(resultado?.h)
  const ra = parseGol(resultado?.a)

  if (ph === null || pa === null || rh === null || ra === null) return null

  // Cravada: placar exato.
  if (ph === rh && pa === ra) return regras.exato
  // Saldo de gols correto.
  if (ph - pa === rh - ra) return regras.saldo
  // Mesmo vencedor (ou ambos empate).
  if (Math.sign(ph - pa) === Math.sign(rh - ra)) return regras.vencedor
  // Errou tudo.
  return 0
}
