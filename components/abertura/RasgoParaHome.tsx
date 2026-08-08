'use client'

// RasgoParaHome — só o flash de luz + o timer de navegação. NÃO desenha mais
// uma "página falsa" saindo de cena: quem rasga e sai de verdade agora é o
// próprio campo (CenaEstadio + BancoReservas), direto no AberturaScreen.tsx
// (ver `bordaRasgo` + clipPath por lá, borda esquerda, translateX(-115%)).
//
// Esse componente virou puramente um efeito de luz por cima, sincronizado
// com a duração real da transição do campo (950ms) + folga.

import { motion } from 'framer-motion'
import { useEffect } from 'react'

interface Props {
  onCompleto: () => void
}

const DURACAO_MS = 1050 // 950ms da transição do campo (AberturaScreen) + folga

export function RasgoParaHome({ onCompleto }: Props) {
  useEffect(() => {
    const t = setTimeout(() => onCompleto(), DURACAO_MS)
    return () => clearTimeout(t)
  }, [onCompleto])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Flash dourado — luz "por trás" no instante em que o campo rasga.
          Emana da esquerda (30% 50%) porque é o lado por onde o campo sai. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 30% 50%, #FFF4C4 0%, #FFD870 30%, #E8A020 70%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0.85, 0.4, 0] }}
        transition={{ duration: DURACAO_MS / 1000, times: [0, 0.18, 0.5, 1], ease: 'easeOut' }}
      />
    </div>
  )
}
