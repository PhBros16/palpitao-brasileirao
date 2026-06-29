'use client'

import { motion } from 'framer-motion'
import { useEffect, useRef } from 'react'

// Três raios de luz (divs triangulares) que acendem em stagger sobre campo-noturno.
// O usuário especificou opacity 0→0.25 para manter o efeito dramático e sutil.

const BEAMS = [
  { centerPct: '18%', rotate: '-13deg' },
  { centerPct: '50%', rotate: '0deg' },
  { centerPct: '82%', rotate: '13deg' },
] as const

export function BeatRefletores({ active, onComplete }: {
  active: boolean
  onComplete: () => void
}) {
  const onCompleteRef = useRef(onComplete)
  useEffect(() => { onCompleteRef.current = onComplete }, [onComplete])

  useEffect(() => {
    if (!active) return
    const t = setTimeout(() => onCompleteRef.current(), 1800)
    return () => clearTimeout(t)
  }, [active])

  return (
    <div className="relative h-full w-full overflow-hidden bg-campo-noturno">
      {BEAMS.map((beam, i) => (
        <motion.div
          key={i}
          className="absolute top-0 h-full"
          style={{
            left: beam.centerPct,
            width: '55%',
            transform: `translateX(-50%) rotate(${beam.rotate})`,
            transformOrigin: 'top center',
            clipPath: 'polygon(38% 0%, 62% 0%, 96% 100%, 4% 100%)',
            background:
              'linear-gradient(180deg, rgba(245,236,208,0.85) 0%, rgba(245,236,208,0.15) 55%, rgba(245,236,208,0) 100%)',
          }}
          initial={{ opacity: 0 }}
          animate={active ? { opacity: 0.25 } : { opacity: 0 }}
          transition={{
            duration: 0.55,
            delay: active ? i * 0.3 : 0,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
