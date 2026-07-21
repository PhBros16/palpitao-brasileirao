'use client'

// Accordion — header clicável (título + chevron) e conteúdo com abertura suave.
// Agora com Framer Motion: altura animada + fade do conteúdo + chevron rotação spring.

import { useEffect, useState, type ReactNode } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export function Accordion({
  titulo,
  storageKey,
  defaultOpen = false,
  children,
}: {
  titulo: string
  storageKey: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen
    const v = window.sessionStorage.getItem(storageKey)
    return v === null ? defaultOpen : v === '1'
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, open ? '1' : '0')
    } catch {
      /* sessionStorage indisponível — ignora */
    }
  }, [open, storageKey])

  return (
    <section className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50">
      <motion.button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        whileTap={{ scale: 0.995 }}
        transition={{ duration: 0.12 }}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-papel-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
      >
        <span className="font-display text-base font-bold text-tinta-300">{titulo}</span>
        <motion.span
          className="font-mono text-xs text-tinta-100"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{
            type: 'spring',
            stiffness: 260,
            damping: 22,
          }}
          aria-hidden
        >
          ▼
        </motion.span>
      </motion.button>

      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            key="content"
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{
              height: { duration: 0.32, ease: [0.32, 0.72, 0, 1] },
              opacity: { duration: 0.25, ease: [0.32, 0.72, 0, 1] },
            }}
            style={{ overflow: 'hidden' }}
          >
            <div className="px-4 pb-4 pt-1">{children}</div>
          </motion.div>
        )}
      </AnimatePresence>
    </section>
  )
}
