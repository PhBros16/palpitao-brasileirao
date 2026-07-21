'use client'

// Barra de progresso fininha no topo (estilo YouTube/GitHub).
// Uso: <ProgressBar carregando={true} />

import { motion, AnimatePresence } from 'framer-motion'

export function ProgressBar({ carregando }: { carregando: boolean }) {
  return (
    <AnimatePresence>
      {carregando && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2 }}
          className="fixed inset-x-0 top-0 z-[201] h-[3px] overflow-hidden bg-dourado-100"
        >
          <motion.div
            className="h-full bg-gradient-to-r from-dourado-400 via-dourado-500 to-dourado-400"
            initial={{ x: '-100%' }}
            animate={{ x: '100%' }}
            transition={{
              duration: 1.2,
              repeat: Infinity,
              ease: 'linear',
            }}
            style={{ width: '40%' }}
          />
        </motion.div>
      )}
    </AnimatePresence>
  )
}
