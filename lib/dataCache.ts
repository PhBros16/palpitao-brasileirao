// dataCache — cache genérico em localStorage, mesmo padrão já usado em
// lib/perfilCache.ts pro perfil do header, generalizado pra qualquer tela.
//
// Como funciona (stale-while-revalidate):
//   1. Ao montar a tela, lê o cache e mostra na hora — sem "Carregando...".
//   2. Em paralelo, busca os dados de verdade no Supabase.
//   3. Quando a resposta chega, atualiza a tela e o cache, em silêncio.
//
// Resultado: só a PRIMEIRA visita de cada dispositivo mostra loading de
// verdade. Todas as visitas seguintes (troca de aba, reabrir o app) mostram
// o último dado conhecido na hora, e corrigem sozinhas se algo mudou.

const PREFIXO = 'palpitao_cache_'

interface Envelope<T> {
  value: T
  savedAt: number
}

/**
 * Lê um valor do cache. Retorna null se não existir ou se estiver mais
 * velho que `ttlMs`. O TTL aqui não é "por quanto tempo o dado é válido"
 * (a revalidação em background acontece sempre) — é só "a partir de quando
 * esse cache é velho demais pra sequer mostrar como primeira impressão".
 */
export function lerCache<T>(chave: string, ttlMs: number): T | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(PREFIXO + chave)
    if (!raw) return null
    const env = JSON.parse(raw) as Envelope<T>
    if (Date.now() - env.savedAt > ttlMs) return null
    return env.value
  } catch {
    return null
  }
}

export function salvarCache<T>(chave: string, value: T): void {
  if (typeof window === 'undefined') return
  try {
    const env: Envelope<T> = { value, savedAt: Date.now() }
    localStorage.setItem(PREFIXO + chave, JSON.stringify(env))
  } catch {
    /* localStorage cheio ou indisponível — segue sem cache, sem quebrar a tela */
  }
}

export function limparCache(chave: string): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(PREFIXO + chave)
  } catch { /* silencioso */ }
}

/** TTLs sugeridos — o dado real é sempre revalidado; isso só decide se um
 * cache muito antigo (app fechado há dias) ainda vale a pena mostrar de
 * primeira ou se é melhor já nascer no estado de loading. */
export const CACHE_TTL = {
  // 2 min era curto demais pro uso real: navegar por algumas abas e voltar
  // pra Home já passava disso, fazendo o cache "nunca ajudar" na prática.
  // A revalidação em segundo plano continua rodando em TODA visita, TTL só
  // decide se o retrato salvo ainda é bom o bastante pra mostrar de cara —
  // subir esse número não deixa o dado mais desatualizado na tela, só reduz
  // quantas vezes a pessoa vê "Carregando..." à toa.
  CURTO: 15 * 60 * 1000, // 15 min — dados que mudam com o jogo (palpites, rodada ativa)
  MEDIO: 10 * 60 * 1000, // 10 min — tabela, ranking, campeonato
} as const
