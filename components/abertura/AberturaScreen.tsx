'use client'

// AberturaScreen — sequência cinematográfica de 4 beats via CSS + Framer Motion.
//
// REGRA CRÍTICA: todos os 4 beats vivem no DOM ao mesmo tempo (position:absolute
// sobrepostos). Transições EXCLUSIVAMENTE por opacity crossfade (Framer Motion),
// nunca desmontando/montando. Duration 700ms garante zero "pisca".

import { useState } from 'react'
import { motion } from 'framer-motion'
import type { LoginPlayer } from '@/components/login'
import { BeatCapa } from './BeatCapa'
import { BeatVirada } from './BeatVirada'
import { BeatRefletores } from './BeatRefletores'
import { BeatGramado } from './BeatGramado'

export type Beat = 'capa' | 'virada' | 'refletores' | 'gramado'

const FADE = { duration: 0.7, ease: 'easeInOut' as const }

export function AberturaScreen({ players }: { players: LoginPlayer[] }) {
  const [beat, setBeat] = useState<Beat>('capa')

  return (
    <div
      className="relative overflow-hidden bg-campo-noturno"
      style={{ width: '100dvw', height: '100dvh' }}
    >
      {/* Beat 1 — Capa fechada */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 10, pointerEvents: beat === 'capa' ? 'auto' : 'none' }}
        initial={false}
        animate={{ opacity: beat === 'capa' ? 1 : 0 }}
        transition={FADE}
      >
        <BeatCapa onAbrir={() => setBeat('virada')} />
      </motion.div>

      {/* Beat 2 — Virada (CSS perspective + rotateY) */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 11, pointerEvents: 'none' }}
        initial={false}
        animate={{ opacity: beat === 'virada' ? 1 : 0 }}
        transition={FADE}
      >
        <BeatVirada
          active={beat === 'virada'}
          onComplete={() => setBeat('refletores')}
        />
      </motion.div>

      {/* Beat 3 — Refletores (permanece visível como base iluminada do gramado) */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 12, pointerEvents: 'none' }}
        initial={false}
        animate={{ opacity: beat === 'refletores' || beat === 'gramado' ? 1 : 0 }}
        transition={FADE}
      >
        <BeatRefletores
          active={beat === 'refletores'}
          onComplete={() => setBeat('gramado')}
        />
      </motion.div>

      {/* Beat 4 — Gramado (LoginGramado reutilizado, showRarity=false) */}
      <motion.div
        className="absolute inset-0"
        style={{ zIndex: 13, pointerEvents: beat === 'gramado' ? 'auto' : 'none' }}
        initial={false}
        animate={{ opacity: beat === 'gramado' ? 1 : 0 }}
        transition={FADE}
      >
        <BeatGramado players={players} />
      </motion.div>
    </div>
  )
}
