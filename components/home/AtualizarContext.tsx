'use client'

// AtualizarContext — ponte entre a página atual e o botão "atualizar" do
// header, agora que o AppLayout vive num layout.tsx persistente (só é
// instanciado uma vez, não por página). A página que quiser oferecer
// pull-to-refresh chama useRegistrarAtualizar(fn, atualizando); o
// AppLayout/HeaderUsuario lê via useAtualizarContext().
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from 'react'

interface AtualizarContextValue {
  onAtualizar: () => void
  atualizando: boolean
  registrar: (fn: (() => void) | null, atualizando: boolean) => void
}

const AtualizarContext = createContext<AtualizarContextValue | null>(null)

export function AtualizarProvider({ children }: { children: ReactNode }) {
  const [handler, setHandler] = useState<(() => void) | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  const registrar = useCallback((fn: (() => void) | null, at: boolean) => {
    setHandler(() => fn)
    setAtualizando(at)
  }, [])

  return (
    <AtualizarContext.Provider value={{ onAtualizar: () => handler?.(), atualizando, registrar }}>
      {children}
    </AtualizarContext.Provider>
  )
}

function useAtualizarContext() {
  const ctx = useContext(AtualizarContext)
  if (!ctx) throw new Error('useAtualizarContext precisa estar dentro de <AtualizarProvider>')
  return ctx
}

/** Usado pelo AppLayout — lê o handler registrado pela página atual (se houver). */
export function useAtualizarHeader() {
  const { onAtualizar, atualizando } = useAtualizarContext()
  return { onAtualizar, atualizando }
}

/** Usado pela página (ex: HomeReal) — registra sua função de atualizar. */
export function useRegistrarAtualizar(fn: (() => void) | null, atualizando: boolean) {
  const { registrar } = useAtualizarContext()
  useEffect(() => {
    registrar(fn, atualizando)
    return () => registrar(null, false)
  }, [fn, atualizando, registrar])
}
