'use client'

// LuzesAmbiente — 4 focos de luz permanentes nos cantos da tela.
// Cada um pode "queimar" aleatoriamente (pisca, apaga, escurece região,
// pisca de volta e reacende).

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
  { id: 0, x: '12%', y: '10%', cor: 'rgba(255, 210, 100, 1)', tamanho: 650, intensidade: 1 },
  { id: 1, x: '88%', y: '12%', cor: 'rgba(255, 215, 110, 1)', tamanho: 600, intensidade: 0.95 },
  { id: 2, x: '10%', y: '88%', cor: 'rgba(255, 200, 90, 1)', tamanho: 620, intensidade: 0.9 },
  { id: 3, x: '90%', y: '85%', cor: 'rgba(255, 220, 120, 1)', tamanho: 640, intensidade: 1 },
]

export function LuzesAmbiente() {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    FOCOS.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )

  useEffect(() => {
    let mounted = true

    async function loop() {
      await new Promise((r) => setTimeout(r, 5000))

      while (mounted) {
        const espera = 15000 + Math.random() * 15000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FOCOS.length)
        const foco = FOCOS[idx]

        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [foco.id]: 0.15 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [foco.id]: 0.85 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        setEstados((s) => ({ ...s, [foco.id]: 0 }))
        await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000))
        if (!mounted) return

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
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {/* Luzes (mix-blend-mode overlay pra realçar sobre o fundo) */}
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
              background: `radial-gradient(circle, ${f.cor} 0%, ${f.cor.replace(/1\)$/, '0.3)')} 30%, transparent 65%)`,
              filter: 'blur(40px)',
              mixBlendMode: 'overlay',
              opacity: brilhoAtual * 0.9,
            }}
            animate={{ opacity: brilhoAtual * 0.9 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
          />
        )
      })}

      {/* Segunda camada de luz (soft-light pra dar realce dourado extra) */}
      {FOCOS.map((f) => {
        const brilhoAtual = (estados[f.id] ?? 1) * f.intensidade
        return (
          <motion.div
            key={`luz-extra-${f.id}`}
            className="absolute rounded-full"
            style={{
              left: f.x,
              top: f.y,
              width: f.tamanho * 0.7,
              height: f.tamanho * 0.7,
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, rgba(255, 235, 160, 0.6) 0%, transparent 60%)`,
              filter: 'blur(25px)',
              opacity: brilhoAtual * 0.7,
            }}
            animate={{ opacity: brilhoAtual * 0.7 }}
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
              width: f.tamanho,
              height: f.tamanho,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(20, 15, 8, 0.55) 0%, rgba(20, 15, 8, 0.28) 40%, transparent 65%)',
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
