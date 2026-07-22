'use client'

// PageTransition — virada de página 3D estilo álbum vintage.
// Quando muda de rota, a página atual gira pra esquerda como se virasse,
// e a nova aparece por baixo. Efeito coeso com a capa→campinho da abertura.

import { motion, AnimatePresence } from 'framer-motion'
import { usePathname } from 'next/navigation'

export function PageTransition({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()

  return (
    <div style={{ perspective: '1600px', perspectiveOrigin: '50% 30%' }}>
      <AnimatePresence mode="wait">
        <motion.div
          key={pathname}
          initial={{
            rotateY: 90,
            opacity: 0,
            transformOrigin: 'left center',
          }}
          animate={{
            rotateY: 0,
            opacity: 1,
            transformOrigin: 'left center',
          }}
          exit={{
            rotateY: -90,
            opacity: 0,
            transformOrigin: 'left center',
          }}
          transition={{
            rotateY: { duration: 0.55, ease: [0.62, 0, 0.38, 1] },
            opacity: { duration: 0.35, ease: [0.32, 0.72, 0, 1] },
          }}
          style={{
            transformStyle: 'preserve-3d',
            backfaceVisibility: 'hidden',
            willChange: 'transform, opacity',
          }}
        >
          {children}
        </motion.div>
      </AnimatePresence>
    </div>
  )
}
