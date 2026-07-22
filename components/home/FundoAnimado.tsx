'use client'

// FundoAnimado — camada de fundo global do app.
// Textura de papel envelhecido (estática com respiração sutil) +
// partículas douradas flutuando pra cima com opacidade oscilante.
// Fica atrás de todo conteúdo, pointer-events-none.

import { motion } from 'framer-motion'
import { useMemo } from 'react'

interface Particula {
  id: number
  x: number       // posição horizontal (%)
  size: number    // 2-5px
  duracao: number // 12-24s
  delay: number   // 0-15s
  opacityMax: number
}

function gerarParticulas(qtd: number): Particula[] {
  return Array.from({ length: qtd }).map((_, i) => ({
    id: i,
    x: Math.random() * 100,
    size: 2 + Math.random() * 3,
    duracao: 12 + Math.random() * 12,
    delay: Math.random() * 15,
    opacityMax: 0.15 + Math.random() * 0.25,
  }))
}

export function FundoAnimado() {
  const particulas = useMemo(() => gerarParticulas(18), [])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Camada 1 — Textura de papel envelhecido */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.12, 0.18, 0.12],
        }}
        transition={{
          duration: 6,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          backgroundImage: `
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400' viewBox='0 0 400 400'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' seed='7' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.545 0 0 0 0 0.353 0 0 0 0 0.169 0 0 0 0 0.169 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E"),
            url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='800' height='800'%3E%3Cfilter id='b'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='2' seed='42'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.27 0 0 0 0 0.11 0 0 0 0.35 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23b)'/%3E%3C/svg%3E")
          `,
          backgroundSize: '400px 400px, 800px 800px',
          mixBlendMode: 'multiply',
        }}
      />

      {/* Camada 2 — Manchas amarronzadas grandes (dá profundidade extra) */}
      <div
        className="absolute inset-0 opacity-40"
        style={{
          background: `
            radial-gradient(ellipse at 15% 20%, rgba(139,90,43,0.12), transparent 45%),
            radial-gradient(ellipse at 85% 75%, rgba(184,134,11,0.10), transparent 50%),
            radial-gradient(ellipse at 50% 100%, rgba(139,90,43,0.08), transparent 55%)
          `,
        }}
      />

      {/* Camada 3 — Partículas douradas flutuantes */}
      {particulas.map((p) => (
        <motion.div
          key={p.id}
          initial={{
            x: `${p.x}vw`,
            y: '105vh',
            opacity: 0,
          }}
          animate={{
            y: '-10vh',
            opacity: [0, p.opacityMax, p.opacityMax, 0],
            x: [
              `${p.x}vw`,
              `${p.x + (Math.random() * 6 - 3)}vw`,
              `${p.x + (Math.random() * 6 - 3)}vw`,
              `${p.x + (Math.random() * 6 - 3)}vw`,
            ],
          }}
          transition={{
            duration: p.duracao,
            delay: p.delay,
            repeat: Infinity,
            ease: 'linear',
            opacity: {
              duration: p.duracao,
              delay: p.delay,
              repeat: Infinity,
              times: [0, 0.15, 0.85, 1],
              ease: 'easeInOut',
            },
          }}
          style={{
            position: 'absolute',
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: 'radial-gradient(circle, rgba(244,220,132,0.9) 0%, rgba(184,134,11,0.5) 60%, transparent 100%)',
            boxShadow: '0 0 4px rgba(244,220,132,0.6)',
          }}
        />
      ))}
    </div>
  )
}
