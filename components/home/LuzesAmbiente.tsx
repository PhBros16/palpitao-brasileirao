'use client'

// LuzesAmbiente — 4 focos de luz permanentes nos cantos da tela.
// Cada um pode "queimar" aleatoriamente (pisca, apaga, região escurece
// por alguns segundos, pisca de volta e reacende).
// Blend mode 'screen' pra somar luz ao fundo em vez de sobrepor.

import { motion, useAnimation } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

interface Foco {
  id: number
  x: string
  y: string
  cor: string
  tamanho: number
  intensidade: number
}

const FOCOS: Foco[] = [
  { id: 0, x: '20%', y: '15%', cor: 'rgba(255, 225, 150, 0.55)', tamanho: 550, intensidade: 1 },
  { id: 1, x: '80%', y: '18%', cor: 'rgba(255, 230, 160, 0.50)', tamanho: 500, intensidade: 0.95 },
  { id: 2, x: '18%', y: '82%', cor: 'rgba(255, 215, 140, 0.50)', tamanho: 520, intensidade: 0.9 },
  { id: 3, x: '82%', y: '78%', cor: 'rgba(255, 235, 165, 0.55)', tamanho: 540, intensidade: 1 },
]

// Curva de piscar de lâmpada fluorescente (não linear).
const PISCAR_KEYFRAMES = [1, 0.1, 0.9, 0.15, 0.85, 0.05, 1]
const PISCAR_TIMES = [0, 0.1, 0.2, 0.35, 0.5, 0.7, 1]

// Sequência de queima: pisca -> apaga -> espera -> pisca -> volta
function useQueimaAleatoria(focos: Foco[]) {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    focos.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )

  useEffect(() => {
    let mounted = true

    async function loop() {
      while (mounted) {
        // Espera aleatória entre 22 e 45 segundos
        const espera = 22000 + Math.random() * 23000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        // Escolhe uma lâmpada aleatória (mas não repete a última)
        const idx = Math.floor(Math.random() * focos.length)
        const foco = focos[idx]

        // Piscar rápido (3x)
        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [foco.id]: 0.15 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [foco.id]: 0.85 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // Apaga (fica 4-6 segundos apagada)
        setEstados((s) => ({ ...s, [foco.id]: 0 }))
        await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000))
        if (!mounted) return

        // Volta piscando (2x rápido)
        for (let i = 0; i < 2; i++) {
          setEstados((s) => ({ ...s, [foco.id]: 0.5 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setEstados((s) => ({ ...s, [foco.id]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        // Estabiliza
        setEstados((s) => ({ ...s, [foco.id]: 1 }))
      }
    }

    loop()
    return () => {
      mounted = false
    }
  }, [focos])

  return estados
}

export function LuzesAmbiente() {
  const estadosQueima = useQueimaAleatoria(FOCOS)

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
      style={{ mixBlendMode: 'screen' }}
    >
      {FOCOS.map((f) => {
        const brilhoAtual = (estadosQueima[f.id] ?? 1) * f.intensidade

        return (
          <motion.div
            key={f.id}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: f.tamanho,
              height: f.tamanho,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${f.cor} 0%, ${f.cor.replace(/[\d.]+\)$/, '0.15)')} 30%, transparent 65%)`,
              filter: 'blur(30px)',
            }}
            animate={{
              opacity: brilhoAtual,
              scale: brilhoAtual > 0.5 ? [1, 1.02, 1] : 1,
            }}
            transition={{
              opacity: { duration: 0.25, ease: 'easeOut' },
              scale: {
                duration: 4 + f.id * 0.5,
                repeat: Infinity,
                ease: 'easeInOut',
              },
            }}
          />
        )
      })}

      {/* Sombras que aparecem quando as lâmpadas apagam */}
      {FOCOS.map((f) => {
        const brilho = estadosQueima[f.id] ?? 1
        const escuridao = 1 - brilho

        return (
          <motion.div
            key={`sombra-${f.id}`}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: f.tamanho * 0.9,
              height: f.tamanho * 0.9,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(30, 20, 10, 0.35) 0%, rgba(30, 20, 10, 0.15) 40%, transparent 65%)',
              filter: 'blur(40px)',
              mixBlendMode: 'multiply',
            }}
            animate={{
              opacity: escuridao,
            }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        )
      })}
    </div>
  )
}
