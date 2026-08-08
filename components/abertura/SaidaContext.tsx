'use client'

// SaidaContext — ponte entre a AberturaScreen (rota "/") e o SaidaCampoOverlay
// (montado no layout raiz, fora da árvore de qualquer rota). Existe porque o
// overlay de saída precisa SOBREVIVER ao router.push que troca "/" por
// "/inicio" — se ele vivesse dentro da árvore da AberturaScreen, seria
// desmontado junto no exato momento em que a navegação acontece.
//
// Fluxo: PIN certo -> AberturaScreen chama iniciarSaida() (monta o overlay,
// que começa a animar o rasgo por cima) -> AberturaScreen chama router.push()
// quase na sequência (a Home real já monta por trás, de verdade, desde já) ->
// o overlay termina sua animação e chama finalizarSaida() sozinho, revelando
// a Home que já estava lá o tempo todo.

import { createContext, useCallback, useContext, useState, type ReactNode } from 'react'

interface SaidaContextValue {
  saindo: boolean
  iniciarSaida: () => void
  finalizarSaida: () => void
}

const SaidaContext = createContext<SaidaContextValue | null>(null)

export function SaidaProvider({ children }: { children: ReactNode }) {
  const [saindo, setSaindo] = useState(false)
  const iniciarSaida = useCallback(() => setSaindo(true), [])
  const finalizarSaida = useCallback(() => setSaindo(false), [])

  return (
    <SaidaContext.Provider value={{ saindo, iniciarSaida, finalizarSaida }}>
      {children}
    </SaidaContext.Provider>
  )
}

export function useSaida() {
  const ctx = useContext(SaidaContext)
  if (!ctx) throw new Error('useSaida precisa estar dentro de um SaidaProvider (ver app/layout.tsx)')
  return ctx
}
