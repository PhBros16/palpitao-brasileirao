// Tipos compartilhados da lógica de domínio (funções puras, sem dependência de UI).
//
// Origem: extraídos do `app/page.tsx` do Palpitão Copa, onde tudo era `any`.
// Aqui a lógica de domínio ganha shape tipado. Nada aqui depende de React,
// Supabase ou do estado global — são apenas os contratos de dados que as
// funções de domínio consomem.

/**
 * Um placar — serve tanto para um palpite quanto para um resultado.
 *
 * Aceita `string | number | null | undefined` de propósito: no Copa os gols
 * vinham de inputs de texto e podiam ser `''`. As funções de domínio
 * normalizam internamente e tratam valor incompleto/ inválido como "sem
 * pontuação" (retornando `null`), em vez de espalhar os `?? ''` defensivos
 * que existiam no monolito.
 */
export interface Placar {
  h: number | string | null | undefined
  a: number | string | null | undefined
}

/**
 * Regras de pontuação da liga.
 *
 * ⚠️ era mata-mata → virou liga: no Copa as regras viviam dentro de
 * `scoringPhases` — uma lista por fase eliminatória (grupos, oitavas, ...) —
 * e eram acessadas por índice de array (`rules[0]` vencedor, `rules[1]` saldo,
 * `rules[2]` exato). Na liga não há fases: existe UM conjunto de regras válido
 * para toda a temporada, e cada acerto vira um campo nomeado.
 *
 * Costura de extensão (NÃO implementar agora — decisão de produto em aberto,
 * ver CLAUDE.md §3 e §4): extras de liga como "clássico vale mais" entram como
 * campos OPCIONAIS adicionais aqui (ex.: `bonusClassico?: number`) e/ou um
 * multiplicador por jogo como parâmetro opcional de `calcPoints`. A aposta de
 * artilheiro será uma função de domínio à parte, não um campo deste objeto.
 * Por serem aditivos, nenhum desses cresce exige refatorar as chamadas atuais.
 */
export interface RegrasPontuacao {
  /** Acertar quem venceu (ou o empate). Copa: `rules[0]`, padrão 1. */
  vencedor: number
  /** Acertar o saldo de gols. Copa: `rules[1]`, padrão 3. */
  saldo: number
  /** Cravar o placar exato. Copa: `rules[2]`, padrão 5. */
  exato: number
}

/** Regras padrão da casa (1 / 3 / 5), iguais às do Copa. */
export const REGRAS_PADRAO: RegrasPontuacao = { vencedor: 1, saldo: 3, exato: 5 }

/** Estatísticas de desempate de um jogador numa rodada. */
export interface TiebreakStats {
  /** Placares cravados (exatos). */
  exact: number
  /** Acertos de resultado — inclui os cravados. */
  correct: number
  /** Acertos de saldo de gols. */
  saldo: number
}

/**
 * Subconjunto de uma rodada já finalizada relevante para o ranking.
 *
 * O `roundHistory` do estado guarda mais coisa (nome da rodada, jogos,
 * palpites, resultados), mas o ranking só precisa dos pontos e do desempate.
 * O campo `phase` do Copa (rótulo de mata-mata) não entra aqui de propósito:
 * o ranking nunca dependeu dele.
 *
 * `palpites` e `results` são OPCIONAIS: o ranking não os usa, mas as
 * estatísticas pessoais (`calcPlayerStats`) sim. Mantê-los opcionais preserva
 * o contrato mínimo do ranking e deixa cada consumidor ler só o que precisa
 * (de forma defensiva, como o Copa fazia com `r.palpites?.[player]`). Os campos
 * de mata-mata que viviam dentro de palpite/resultado no Copa (`quemAvanca`,
 * `penaltis`, `extra`) não são tipados nem lidos — somem naturalmente.
 */
export interface RodadaHistorico {
  scores: Record<string, number>
  tiebreak: Record<string, TiebreakStats>
  /** Palpites de cada jogador na rodada: por nome → por id de jogo. */
  palpites?: Record<string, Record<string, Placar>>
  /** Resultados lançados na rodada: por id de jogo. */
  results?: Record<string, Placar>
}
