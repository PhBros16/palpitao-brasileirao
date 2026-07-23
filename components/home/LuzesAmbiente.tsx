'use client'

// LuzesAmbiente — focos posicionados pra funcionar em mobile e desktop.
// Cor quente discreta (não amarela chapada), animações de queima aleatórias.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Foco {
  id: number
  x: string
  y: string
  tamanho: number
}

// Posições em % — funcionam em qualquer viewport (mobile e desktop)
const FOCOS: Foco[] = [
  { id: 0, x: '25%', y: '20%', tamanho: 500 },
  { id: 1, x: '75%', y: '25%', tamanho: 480 },
  { id: 2, x: '30%', y: '75%', tamanho: 520 },
  { id: 3, x: '70%', y: '80%', tamanho: 500 },
]

export function LuzesAmbiente() {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    FOCOS.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )

  useEffect(() => {
    let mounted = true

    async function loop() {
      await new Promise((r) => setTimeout(r, 8000))

      while (mounted) {
        const espera = 20000 + Math.random() * 20000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FOCOS.length)

        // Piscar rápido (3x — efeito lâmpada fluorescente falhando)
        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.2 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.9 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // Apaga por 4-6 segundos
        setEstados((s) => ({ ...s, [idx]: 0 }))
        await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000))
        if (!mounted) return

        // Volta piscando (2x tentando ligar)
        for (let i = 0; i < 2; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.4 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        // Estabiliza
        setEstados((s) => ({ ...s, [idx]: 1 }))
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
      {/* Luzes principais — quentes e sutis */}
      {FOCOS.map((f) => {
        const brilho = estados[f.id] ?? 1
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
              background: 'radial-gradient(circle, rgba(255, 195, 100, 0.4) 0%, rgba(255, 180, 80, 0.15) 35%, transparent 65%)',
              filter: 'blur(45px)',
              mixBlendMode: 'overlay',
              opacity: brilho,
            }}
            animate={{ opacity: brilho }}
            transition={{ duration: 0.25, ease: 'easeOut' }}
          />
        )
      })}

      {/* Sombra quando apaga (região escurece sutilmente) */}
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
              width: f.tamanho * 0.9,
              height: f.tamanho * 0.9,
              transform: 'translate(-50%, -50%)',
              background: 'radial-gradient(circle, rgba(30, 20, 10, 0.35) 0%, rgba(30, 20, 10, 0.15) 40%, transparent 65%)',
              filter: 'blur(50px)',
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
