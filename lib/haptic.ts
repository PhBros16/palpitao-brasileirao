// Wrapper simples pra vibração — silencioso se não suportado.

type HapticIntensity = 'leve' | 'medio' | 'forte' | 'sucesso' | 'erro'

const DURATIONS: Record<HapticIntensity, number | number[]> = {
  leve: 8,
  medio: 15,
  forte: 25,
  sucesso: [10, 40, 10],
  erro: [30, 30, 30],
}

export function vibrar(intensidade: HapticIntensity = 'leve'): void {
  if (typeof window === 'undefined') return
  if (!('vibrate' in navigator)) return
  try {
    navigator.vibrate(DURATIONS[intensidade])
  } catch {
    // silencioso
  }
}
