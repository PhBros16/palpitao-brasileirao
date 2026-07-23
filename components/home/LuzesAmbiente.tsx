'use client'

// LuzesAmbiente — 4 focos de luz permanentes nos cantos da tela.
// Cada um pode "queimar" aleatoriamente.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Foco {
  id: number
  x: string
  y: string
  cor: string
  tamanho: number
  intensidade: number
}

const FOCOS: Foco[] = [
  { id: 0, x: '15%', y: '12%', cor: 'rgba(255, 220, 130, 0.85)', tamanho: 600, intensidade: 1 },
  { id: 1, x: '85%', y: '15%', cor: 'rgba(255, 225, 140, 0.80)', tamanho: 550, intensidade: 0.95 },
  { id: 2, x: '15%', y: '85%', cor: 'rgba(255, 215, 125, 0.80)', tamanho: 570, intensidade: 0.9 },
  { id: 3, x: '85%', y: '82%', cor: 'rgba(255, 230, 145, 0.85)', tamanho: 590, intensidade: 1 },
]

export function LuzesAmbiente() {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    FOCOS.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )

  useEffect(() => {
    let mounted = true

    async function loop() {
      // Espera 5s antes de começar (pra dar tempo de ver o estado normal)
      await new Promise((r) => setTimeout(r, 5000))

      while (mounted) {
        // Espera aleatória entre 15 e 30 segundos
        const espera = 15000 + Math.random() * 15000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FOCOS.length)
        const foco = FOCOS[idx]

        // Piscar rápido (3x)
        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [foco.id]: 0.15 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [foco.id]: 0.85 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // Apaga
        setEstados((s) => ({ ...s, [foco.id]: 0 }))
        await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000))
        if (!mounted) return

        // Volta piscando
        for (let i = 0; i < 2; i++) {
          setEstados((s) => ({ ...s, [foco.id]: 0.5 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setEstados((s) => ({ ...s, [foco.id]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        setEstados((s) => ({ ...s, [foco.id]: 1 }))
      }
    }

    loop()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Luzes (aditivo) */}
      {FOCOS.map((f) => {
        const brilhoAtual = (estados[f.id] ?? 1) * f.intensidade
        return (
          <motion.div
            key={`luz-${f.id}`}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: f.tamanho,
              height: f.tamanho,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${f.cor} 0%, ${f.cor.replace(/[\d.]+\)$/, '0.25)')} 30%, transparent 65%)`,
              filter: 'blur(35px)',
              mixBlendMode: 'plus-lighter',
            }}
            animate={{ opacity: brilhoAtual }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )
      })}

      {/* Sombra quando lâmpada apaga */}
      {FOCOS.map((f) => {
        const brilho = estados[f.id] ?? 1
        const escuridao = 1 - brilho
        return (
          <motion.div
            key={`sombra-${f.id}`}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: f.tamanho * 0.85,
              height: f.tamanho * 0.85,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(20, 15, 8, 0.5) 0%, rgba(20, 15, 8, 0.25) 40%, transparent 65%)',
              filter: 'blur(45px)',
              mixBlendMode: 'multiply',
            }}
            animate={{ opacity: escuridao }}
            transition={{ duration: 0.3, ease: 'easeInOut' }}
          />
        )
      })}
    </div>
  )
}
