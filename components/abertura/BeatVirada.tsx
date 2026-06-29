'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef, useState } from 'react'

// Beat 2 — Virada: a capa gira em Y ao redor da lombada (esquerda) revelando o
// verso verde. O crossfade para o beat seguinte começa na metade da animação
// (quando o verde começa a aparecer).
//
// Timing:
//   0-700ms  → fade-in do beat (controlado pelo AberturaScreen)
//   700ms    → flip começa
//   700+500ms → onComplete dispara (≈metade da rotação, verde aparece)
//   1200ms+  → beat fades out enquanto o flip ainda está terminando

export function BeatVirada({ active, onComplete }: {
  active: boolean
  onComplete: () => void
}) {
  const [flipping, setFlipping] = useState(false)
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (!active) return
    let innerTimer: ReturnType<typeof setTimeout> | undefined
    // Aguarda o fade-in (700ms) antes de iniciar o flip
    const outerTimer = setTimeout(() => {
      setFlipping(true)
      // Dispara onComplete no ponto médio do flip (500ms de 1000ms)
      innerTimer = setTimeout(() => onCompleteRef.current(), 500)
    }, 700)
    return () => {
      clearTimeout(outerTimer)
      if (innerTimer !== undefined) clearTimeout(innerTimer)
    }
  }, [active])

  return (
    // Container de perspectiva — não animado, apenas cria o contexto 3D
    <div className="h-full w-full" style={{ perspective: '1400px' }}>
      <motion.div
        className="relative h-full w-full"
        style={{
          transformStyle: 'preserve-3d',
          transformOrigin: 'left center',
        }}
        // Uma vez iniciado o flip, fica em -180° (não volta atrás)
        animate={{ rotateY: flipping ? -180 : 0 }}
        transition={{ duration: 1.0, ease: [0.4, 0, 0.2, 1] }}
      >
        {/* Frente — couro (mesma identidade da BeatCapa) */}
        <div
          className="absolute inset-0 flex flex-col items-center justify-center gap-3 bg-gradient-to-br from-couro-100 via-couro-300 to-couro-500"
          style={{ backfaceVisibility: 'hidden' }}
        >
          <div className="absolute inset-y-0 left-0 w-5 bg-couro-500 shadow-[inset_-6px_0_14px_rgba(0,0,0,0.45)]" />
          <h1 className="font-display text-5xl font-bold uppercase leading-none tracking-widest text-dourado-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            PALPITÃO
          </h1>
          <h2 className="font-display text-3xl font-bold uppercase leading-none tracking-widest text-dourado-300 drop-shadow-[0_2px_6px_rgba(0,0,0,0.6)]">
            BRASILEIRÃO
          </h2>
        </div>

        {/* Verso — verde do gramado */}
        <div
          className="absolute inset-0 bg-campo-100"
          style={{
            backfaceVisibility: 'hidden',
            transform: 'rotateY(180deg)',
          }}
        />
      </motion.div>
    </div>
  )
}
