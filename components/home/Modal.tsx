'use client'

// Modal — wrapper animado padrão do app.
// Backdrop fade + card scale-in + slide up. Fecha no ESC ou clique no backdrop.

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect } from 'react'

interface ModalProps {
  aberto: boolean
  onFechar: () => void
  children: React.ReactNode
  /** Se true, fecha ao clicar no backdrop. Default true. */
  fecharNoBackdrop?: boolean
  /** Classe extra pro card interno */
  className?: string
  /** Cor da borda (dourado / vermelho / etc.) — passa a classe Tailwind border-* */
  borda?: string
}

export function Modal({
  aberto,
  onFechar,
  children,
  fecharNoBackdrop = true,
  className = '',
  borda = 'border-dourado-300',
}: ModalProps) {
  useEffect(() => {
    if (!aberto) return
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [aberto, onFechar])

  return (
    <AnimatePresence>
      {aberto && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
          className="fixed inset-0 z-[150] flex items-center justify-center bg-tinta-300/70 p-4 backdrop-blur-sm"
          onClick={fecharNoBackdrop ? onFechar : undefined}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 8 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: 4 }}
            transition={{ duration: 0.26, ease: [0.32, 0.72, 0, 1] }}
            onClick={(e) => e.stopPropagation()}
            className={`w-full max-w-sm rounded-lg border-2 ${borda} bg-papel-50 p-5 shadow-2xl ${className}`}
          >
            {children}
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
