// Cache do perfil do usuário no localStorage.
// Estratégia: mostra do cache imediatamente + revalida em background.

const CHAVE = 'palpitao_perfil_cache'
const TTL_MS = 5 * 60 * 1000 // 5 minutos

export interface PerfilCache {
  participantId: string
  nome: string
  isAdmin: boolean
  avatar: string | null
  emoji: string | null
  savedAt: number
}

/** Lê o cache. Retorna null se não existir, se for de outro user, ou se estiver expirado. */
export function lerPerfilCache(participantId: string): PerfilCache | null {
  if (typeof window === 'undefined') return null
  try {
    const raw = localStorage.getItem(CHAVE)
    if (!raw) return null
    const cache = JSON.parse(raw) as PerfilCache
    if (cache.participantId !== participantId) return null
    if (Date.now() - cache.savedAt > TTL_MS) return null
    return cache
  } catch {
    return null
  }
}

/** Salva o perfil no cache. */
export function salvarPerfilCache(perfil: Omit<PerfilCache, 'savedAt'>): void {
  if (typeof window === 'undefined') return
  try {
    const cache: PerfilCache = { ...perfil, savedAt: Date.now() }
    localStorage.setItem(CHAVE, JSON.stringify(cache))
  } catch {
    // Silencioso — cache é otimização, não deve quebrar app
  }
}

/** Limpa o cache (útil ao trocar de usuário ou logout). */
export function limparPerfilCache(): void {
  if (typeof window === 'undefined') return
  try {
    localStorage.removeItem(CHAVE)
  } catch { /* silencioso */ }
}
