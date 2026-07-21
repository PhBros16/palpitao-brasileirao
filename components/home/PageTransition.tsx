'use client'

// PageTransition — wrapper que anima entrada/saída de cada página.
// Estilo Apple: fade suave + slide vertical mínimo (8px).

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -4 }}
        transition={{
          duration: 0.28,
          ease: [0.32, 0.72, 0, 1], // curva Apple (aproxima do easeOutExpo)
        }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  )
}
