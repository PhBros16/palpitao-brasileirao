'use client'

// Confete — partículas douradas que caem com física.
// Usa em conquistas (troféu novo desbloqueado).

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Particula {
  id: number
  x: number       // posição horizontal inicial (%)
  cor: string
  rotacao: number // rotação inicial em graus
  delay: number   // segundos
  duracao: number
  largura: number
  altura: number
}

const CORES = [
  '#F4DC84', // dourado claro
  '#E3C268', // dourado
  '#B8860B', // dourado escuro
  '#FFFFFF', // branco
  '#C8963A', // bronze dourado
  '#FCEBA7', // creme dourado
]

function gerarParticulas(qtd: number): Particula[] {
  return Array.from({ length: qtd }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    cor: CORES[Math.floor(Math.random() * CORES.length)],
    rotacao: Math.random() * 360,
    delay: Math.random() * 0.4,
    duracao: 2.2 + Math.random() * 1.5,
    largura: 6 + Math.random() * 8,
    altura: 10 + Math.random() * 8,
  }))
}

export function Confete({
  ativo,
  quantidade = 60,
  duracao = 3500,
  onFim,
}: {
  ativo: boolean
  quantidade?: number
  duracao?: number
  onFim?: () => void
}) {
  const [particulas, setParticulas] = useState<Particula[]>([])

  useEffect(() => {
    if (!ativo) return
    setParticulas(gerarParticulas(quantidade))
    const t = setTimeout(() => {
      setParticulas([])
      onFim?.()
    }, duracao)
    return () => clearTimeout(t)
  }, [ativo, quantidade, duracao, onFim])

  return (
    <div className="pointer-events-none fixed inset-0 z-[300] overflow-hidden">
      <AnimatePresence>
        {particulas.map((p) => (
          <motion.div
            key={p.id}
            initial={{
              x: `${p.x}vw`,
              y: '-20px',
              rotate: p.rotacao,
              opacity: 1,
            }}
            animate={{
              y: '110vh',
              rotate: p.rotacao + 720,
              x: `${p.x + (Math.random() * 30 - 15)}vw`,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: p.duracao,
              delay: p.delay,
              ease: [0.32, 0.72, 0.35, 1],
            }}
            style={{
              position: 'absolute',
              width: p.largura,
              height: p.altura,
              backgroundColor: p.cor,
              borderRadius: '2px',
              boxShadow: `0 0 4px ${p.cor}80`,
            }}
          />
        ))}
      </AnimatePresence>
    </div>
  )
}
