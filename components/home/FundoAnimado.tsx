'use client'

// FundoAnimado — "Álbum de Figurinhas Vivo"
// - Fumaça de charuto dourada (nuvens grandes borradas em diagonal, 40s)
// - Cromos/figurinhas fantasmas caindo e girando (25s cada)
// - Marcas de café no papel (posições fixas, opacidade pulsando 12s)
// - Aura dourada central (brilho pulsando 8s)

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Cromo {
  id: number
  x: number
  size: number
  duracao: number
  delay: number
  rotacaoIni: number
  rotacaoFim: number
}

function gerarCromos(qtd: number): Cromo[] {
  return Array.from({ length: qtd }).map((_, i) => ({
    id: i,
    x: (i / qtd) * 100 + (Math.random() * 10 - 5),
    size: 60 + Math.random() * 50,
    duracao: 22 + Math.random() * 10,
    delay: (i / qtd) * 25 + Math.random() * 4,
    rotacaoIni: Math.random() * 360,
    rotacaoFim: Math.random() * 720 - 360,
  }))
}

const MANCHAS_CAFE = [
  { top: '12%', left: '8%', size: 90, delay: 0 },
  { top: '68%', left: '82%', size: 120, delay: 3 },
  { top: '38%', left: '72%', size: 70, delay: 6 },
  { top: '82%', left: '18%', size: 100, delay: 9 },
  { top: '22%', left: '48%', size: 60, delay: 1.5 },
]

export function FundoAnimado() {
  const cromos = useMemo(() => gerarCromos(6), [])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Aura dourada central — pulsa lentamente */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[900px] w-[900px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          opacity: [0.35, 0.55, 0.35],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 8, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.30) 0%, rgba(184,134,11,0.10) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />

      {/* Fumaça de charuto dourada — 3 nuvens em diagonal */}
      <motion.div
        className="absolute h-[500px] w-[500px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.28) 0%, rgba(184,134,11,0.10) 40%, transparent 75%)',
          filter: 'blur(50px)',
        }}
        initial={{ x: '-30vw', y: '90vh' }}
        animate={{
          x: ['−30vw', '110vw'],
          y: ['90vh', '-20vh'],
          scale: [0.8, 1.3, 0.9],
          opacity: [0, 0.9, 0.9, 0],
        }}
        transition={{
          duration: 40,
          repeat: Infinity,
          ease: 'linear',
          opacity: {
            duration: 40,
            repeat: Infinity,
            times: [0, 0.15, 0.85, 1],
            ease: 'easeInOut',
          },
          scale: {
            duration: 40,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
      <motion.div
        className="absolute h-[600px] w-[600px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(139,90,43,0.22) 0%, rgba(184,134,11,0.08) 45%, transparent 75%)',
          filter: 'blur(60px)',
        }}
        initial={{ x: '90vw', y: '110vh' }}
        animate={{
          x: ['90vw', '-40vw'],
          y: ['110vh', '-30vh'],
          scale: [0.9, 1.4, 1],
          opacity: [0, 0.85, 0.85, 0],
        }}
        transition={{
          duration: 45,
          delay: 12,
          repeat: Infinity,
          ease: 'linear',
          opacity: {
            duration: 45,
            delay: 12,
            repeat: Infinity,
            times: [0, 0.15, 0.85, 1],
            ease: 'easeInOut',
          },
          scale: {
            duration: 45,
            delay: 12,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />
      <motion.div
        className="absolute h-[450px] w-[450px] rounded-full"
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.25) 0%, rgba(184,134,11,0.08) 45%, transparent 75%)',
          filter: 'blur(55px)',
        }}
        initial={{ x: '-20vw', y: '-20vh' }}
        animate={{
          x: ['-20vw', '110vw'],
          y: ['-20vh', '100vh'],
          scale: [1, 1.2, 0.85],
          opacity: [0, 0.8, 0.8, 0],
        }}
        transition={{
          duration: 50,
          delay: 25,
          repeat: Infinity,
          ease: 'linear',
          opacity: {
            duration: 50,
            delay: 25,
            repeat: Infinity,
            times: [0, 0.15, 0.85, 1],
            ease: 'easeInOut',
          },
          scale: {
            duration: 50,
            delay: 25,
            repeat: Infinity,
            ease: 'easeInOut',
          },
        }}
      />

      {/* Marcas de café/vinho no papel — posições fixas, opacidade pulsando */}
      {MANCHAS_CAFE.map((m, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full"
          style={{
            top: m.top,
            left: m.left,
            width: m.size,
            height: m.size,
            background: 'radial-gradient(circle, rgba(139,90,43,0.18) 0%, rgba(139,90,43,0.10) 40%, rgba(139,90,43,0.04) 70%, transparent 100%)',
            filter: 'blur(3px)',
          }}
          animate={{
            opacity: [0.5, 0.9, 0.5],
            scale: [1, 1.05, 1],
          }}
          transition={{
            duration: 12,
            delay: m.delay,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        />
      ))}

      {/* Cromos/figurinhas fantasmas caindo e girando */}
      {cromos.map((c) => (
        <motion.div
          key={c.id}
          className="absolute"
          style={{
            width: c.size,
            height: c.size * 1.4, // proporção de card Panini
            background: `
              linear-gradient(135deg,
                rgba(244,220,132,0.12) 0%,
                rgba(184,134,11,0.08) 50%,
                rgba(139,90,43,0.06) 100%
              )
            `,
            border: '1px solid rgba(184,134,11,0.15)',
            borderRadius: '4px',
            boxShadow: '0 0 20px rgba(184,134,11,0.1)',
          }}
          initial={{
            x: `${c.x}vw`,
            y: '-20vh',
            rotate: c.rotacaoIni,
            opacity: 0,
          }}
          animate={{
            y: '120vh',
            rotate: c.rotacaoIni + c.rotacaoFim,
            opacity: [0, 0.7, 0.7, 0],
            x: [
              `${c.x}vw`,
              `${c.x + (Math.random() * 8 - 4)}vw`,
              `${c.x + (Math.random() * 8 - 4)}vw`,
            ],
          }}
          transition={{
            duration: c.duracao,
            delay: c.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: {
              duration: c.duracao,
              delay: c.delay,
              repeat: Infinity,
              times: [0, 0.15, 0.85, 1],
              ease: 'easeInOut',
            },
            x: {
              duration: c.duracao,
              delay: c.delay,
              repeat: Infinity,
              ease: 'easeInOut',
            },
          }}
        >
          {/* Detalhe interno do "cromo" — linhas horizontais fantasmas */}
          <div
            className="absolute inset-2 flex flex-col justify-between"
            style={{ opacity: 0.4 }}
          >
            <div className="h-[1px] w-3/4 self-center bg-dourado-500/30" />
            <div className="h-[1px] w-1/2 self-center bg-dourado-500/30" />
            <div className="flex justify-center">
              <div
                className="h-4 w-4 rounded-full border border-dourado-500/40"
              />
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  )
}
