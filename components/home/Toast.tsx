'use client'

// Sistema de toasts globais.
// Uso: chamar showToast() de qualquer lugar do app.

import { createContext, useContext, useState, useCallback, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export type ToastTipo = 'sucesso' | 'erro' | 'info' | 'aviso'

interface Toast {
  id: string
  tipo: ToastTipo
  mensagem: string
  duracao?: number
}

interface ToastContextValue {
  showToast: (mensagem: string, tipo?: ToastTipo, duracao?: number) => void
}

const ToastContext = createContext<ToastContextValue | null>(null)

// Fallback pra chamar showToast fora de React (ex: em callbacks)
let toastGlobal: ((msg: string, tipo?: ToastTipo, dur?: number) => void) | null = null

export function showToast(mensagem: string, tipo: ToastTipo = 'info', duracao = 3000) {
  if (toastGlobal) toastGlobal(mensagem, tipo, duracao)
}

const ICONES: Record<ToastTipo, string> = {
  sucesso: '✓',
  erro: '✕',
  info: 'ℹ',
  aviso: '⚠',
}

const CORES: Record<ToastTipo, { bg: string; border: string; icon: string }> = {
  sucesso: { bg: 'bg-green-50', border: 'border-green-500', icon: 'text-green-600' },
  erro: { bg: 'bg-red-50', border: 'border-red-500', icon: 'text-red-600' },
  info: { bg: 'bg-blue-50', border: 'border-blue-500', icon: 'text-blue-600' },
  aviso: { bg: 'bg-dourado-50', border: 'border-dourado-500', icon: 'text-dourado-700' },
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([])

  const showToastFn = useCallback((mensagem: string, tipo: ToastTipo = 'info', duracao = 3000) => {
    const id = `${Date.now()}-${Math.random()}`
    setToasts((prev) => [...prev, { id, tipo, mensagem, duracao }])
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id))
    }, duracao)
  }, [])

  useEffect(() => {
    toastGlobal = showToastFn
    return () => { toastGlobal = null }
  }, [showToastFn])

  return (
    <ToastContext.Provider value={{ showToast: showToastFn }}>
      {children}
      <div
        className="pointer-events-none fixed inset-x-0 z-[200] flex flex-col items-center gap-2 px-4"
        style={{ top: 'max(env(safe-area-inset-top), 72px)' }}
      >
        <AnimatePresence>
          {toasts.map((t) => {
            const cor = CORES[t.tipo]
            return (
              <motion.div
                key={t.id}
                layout
                initial={{ opacity: 0, y: -20, scale: 0.9 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                exit={{ opacity: 0, y: -12, scale: 0.95 }}
                transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
                className={`pointer-events-auto flex items-center gap-3 rounded-lg border-2 ${cor.border} ${cor.bg} px-4 py-2.5 shadow-lg backdrop-blur-sm`}
                style={{ maxWidth: '90vw', minWidth: '240px' }}
              >
                <span className={`flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border-2 ${cor.border} ${cor.icon} font-mono text-sm font-bold`}>
                  {ICONES[t.tipo]}
                </span>
                <span className="font-sans text-sm font-medium text-tinta-300">
                  {t.mensagem}
                </span>
              </motion.div>
            )
          })}
        </AnimatePresence>
      </div>
    </ToastContext.Provider>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast precisa estar dentro de ToastProvider')
  return ctx
}
