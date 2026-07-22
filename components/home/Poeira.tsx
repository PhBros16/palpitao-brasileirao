'use client'

// Poeira — partículas caindo do topo, variedade grande de tamanho/cor/vel.
// 3 tipos: pequenas amarelas (rápidas), médias douradas (médias),
// grandes marrons (lentas, opacas). Balanço lateral natural.

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Grao {
  id: number
  tipo: 'peq' | 'med' | 'grd'
  x: number
  size: number
  duracao: number
  delay: number
  wobble: number
  opacidade: number
  cor: string
}

const CORES = {
  peq: ['#F5DC82', '#FCEBA7', '#E8C97A', '#F4DC84'],
  med: ['#D4A544', '#E3C268', '#C89844', '#B8860B'],
  grd: ['#8B6110', '#A97A22', '#7A5716', '#8A6428'],
}

function pickCor(tipo: 'peq' | 'med' | 'grd'): string {
  const paleta = CORES[tipo]
  return paleta[Math.floor(Math.random() * paleta.length)]
}

function gerarPoeira(qtdPeq: number, qtdMed: number, qtdGrd: number): Grao[] {
  let id = 0
  const graos: Grao[] = []

  // Pequenas: rápidas, muitas, opacidade média
  for (let i = 0; i < qtdPeq; i++) {
    graos.push({
      id: id++,
      tipo: 'peq',
      x: Math.random() * 100,
      size: 1 + Math.random() * 1.5, // 1-2.5px
      duracao: 8 + Math.random() * 6, // 8-14s
      delay: Math.random() * 12,
      wobble: 3 + Math.random() * 4,
      opacidade: 0.35 + Math.random() * 0.35,
      cor: pickCor('peq'),
    })
  }

  // Médias: velocidade média
  for (let i = 0; i < qtdMed; i++) {
    graos.push({
      id: id++,
      tipo: 'med',
      x: Math.random() * 100,
      size: 2 + Math.random() * 2, // 2-4px
      duracao: 14 + Math.random() * 8, // 14-22s
      delay: Math.random() * 18,
      wobble: 5 + Math.random() * 7,
      opacidade: 0.4 + Math.random() * 0.3,
      cor: pickCor('med'),
    })
  }

  // Grandes: lentas, opacas, poucas
  for (let i = 0; i < qtdGrd; i++) {
    graos.push({
      id: id++,
      tipo: 'grd',
      x: Math.random() * 100,
      size: 3 + Math.random() * 2.5, // 3-5.5px
      duracao: 20 + Math.random() * 10, // 20-30s
      delay: Math.random() * 25,
      wobble: 8 + Math.random() * 10,
      opacidade: 0.45 + Math.random() * 0.3,
      cor: pickCor('grd'),
    })
  }

  return graos
}

export function Poeira() {
  const graos = useMemo(() => gerarPoeira(20, 14, 8), [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
      {graos.map((g) => (
        <motion.div
          key={g.id}
          initial={{
            x: `${g.x}vw`,
            y: '-5vh',
            opacity: 0,
          }}
          animate={{
            y: '110vh',
            opacity: [0, g.opacidade, g.opacidade, 0],
            x: [
              `${g.x}vw`,
              `${g.x + g.wobble}vw`,
              `${g.x - g.wobble * 0.7}vw`,
              `${g.x + g.wobble * 0.5}vw`,
              `${g.x - g.wobble * 0.4}vw`,
            ],
          }}
          transition={{
            duration: g.duracao,
            delay: g.delay,
            repeat: Infinity,
            ease: 'linear',
            x: {
              duration: g.duracao,
              delay: g.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            opacity: {
              duration: g.duracao,
              delay: g.delay,
              repeat: Infinity,
              times: [0, 0.1, 0.9, 1],
              ease: 'easeInOut',
            },
          }}
          style={{
            position: 'absolute',
            width: g.size,
            height: g.size,
            borderRadius: '50%',
            background: `radial-gradient(circle, ${g.cor} 0%, ${g.cor}CC 40%, transparent 100%)`,
            boxShadow: g.tipo === 'peq'
              ? `0 0 ${g.size * 1.5}px ${g.cor}80`
              : g.tipo === 'med'
                ? `0 0 ${g.size * 2}px ${g.cor}66`
                : `0 0 ${g.size * 2.5}px ${g.cor}44`,
          }}
        />
      ))}
    </div>
  )
}
