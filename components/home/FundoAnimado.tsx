'use client'

// FundoAnimado — camada global de partículas + shimmer.
// Partículas douradas grandes/visíveis subindo pela tela com brilho radial.
// Faixas de luz diagonais que atravessam a tela ocasionalmente.
// Fica atrás de todo conteúdo.

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particula {
  id: number
  x: number
  size: number
  duracao: number
  delay: number
  opacityMax: number
  wobble: number
}

function gerarParticulas(qtd: number): Particula[] {
  return Array.from({ length: qtd }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 4 + Math.random() * 8, // 4-12px (era 2-5)
    duracao: 14 + Math.random() * 14,
    delay: (i / qtd) * 20 + Math.random() * 3,
    opacityMax: 0.5 + Math.random() * 0.4, // muito mais visível
    wobble: 8 + Math.random() * 12,
  }))
}

interface Faixa {
  id: number
  delay: number
  duracao: number
  posY: number
  altura: number
}

function gerarFaixas(qtd: number): Faixa[] {
  return Array.from({ length: qtd }).map((_, i) => ({
    id: i,
    delay: i * 8 + Math.random() * 5,
    duracao: 4 + Math.random() * 2,
    posY: Math.random() * 100,
    altura: 60 + Math.random() * 80,
  }))
}

export function FundoAnimado() {
  const particulas = useMemo(() => gerarParticulas(28), [])
  const faixas = useMemo(() => gerarFaixas(3), [])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Textura de papel envelhecido com respiração */}
      <motion.div
        className="absolute inset-0"
        animate={{ opacity: [0.25, 0.4, 0.25] }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='500' height='500' viewBox='0 0 500 500'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.75' numOctaves='4' seed='12' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.36 0 0 0 0 0.17 0 0 0 0.8 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '500px 500px',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Manchas douradas grandes flutuantes */}
      <motion.div
        className="absolute -left-1/4 top-1/4 h-[500px] w-[500px] rounded-full"
        animate={{
          x: [0, 60, -30, 0],
          y: [0, -40, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.35) 0%, rgba(184,134,11,0.12) 40%, transparent 70%)',
          filter: 'blur(40px)',
        }}
      />
      <motion.div
        className="absolute -right-1/4 top-2/3 h-[600px] w-[600px] rounded-full"
        animate={{
          x: [0, -80, 40, 0],
          y: [0, 50, -30, 0],
          scale: [1, 0.9, 1.15, 1],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: 'easeInOut', delay: 3 }}
        style={{
          background: 'radial-gradient(circle, rgba(139,90,43,0.28) 0%, rgba(184,134,11,0.10) 45%, transparent 70%)',
          filter: 'blur(50px)',
        }}
      />
      <motion.div
        className="absolute left-1/3 -top-1/4 h-[450px] w-[450px] rounded-full"
        animate={{
          x: [0, 40, -60, 0],
          y: [0, 60, 30, 0],
          scale: [1, 1.05, 0.9, 1],
        }}
        transition={{ duration: 22, repeat: Infinity, ease: 'easeInOut', delay: 6 }}
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.30) 0%, rgba(184,134,11,0.08) 50%, transparent 75%)',
          filter: 'blur(45px)',
        }}
      />

      {/* Faixas de luz diagonais que passam ocasionalmente */}
      {faixas.map((f) => (
        <motion.div
          key={f.id}
          className="absolute -left-[30%] w-[60%]"
          style={{
            top: `${f.posY}%`,
            height: `${f.altura}px`,
            transform: 'rotate(-25deg)',
            transformOrigin: 'center',
            background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.35), transparent)',
            filter: 'blur(20px)',
          }}
          initial={{ x: '-100%', opacity: 0 }}
          animate={{ x: '250%', opacity: [0, 1, 1, 0] }}
          transition={{
            duration: f.duracao,
            delay: f.delay,
            repeat: Infinity,
            repeatDelay: 15,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Partículas douradas grandes e brilhantes */}
      {particulas.map((p) => (
        <motion.div
          key={p.id}
          initial={{ x: `${p.x}vw`, y: '110vh', opacity: 0 }}
          animate={{
            y: '-15vh',
            x: [
              `${p.x}vw`,
              `${p.x + p.wobble}vw`,
              `${p.x - p.wobble}vw`,
              `${p.x + p.wobble * 0.5}vw`,
            ],
            opacity: [0, p.opacityMax, p.opacityMax, 0],
          }}
          transition={{
            duration: p.duracao,
            delay: p.delay,
            repeat: Infinity,
            repeatDelay: 0,
            ease: 'linear',
            x: {
              duration: p.duracao,
              delay: p.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            },
            opacity: {
              duration: p.duracao,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.12, 0.88, 1],
              ease: 'easeInOut',
            },
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(255,240,150,1) 0%, rgba(244,220,132,0.9) 30%, rgba(184,134,11,0.5) 65%, transparent 100%)',
            boxShadow: `
              0 0 ${p.size * 2}px rgba(244,220,132,0.7),
              0 0 ${p.size * 4}px rgba(244,220,132,0.4),
              0 0 ${p.size * 6}px rgba(184,134,11,0.2)
            `,
          }}
        />
      ))}
    </div>
  )
}
