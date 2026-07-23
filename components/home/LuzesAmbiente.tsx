'use client'

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Feixe {
  id: number
  esquerda: string
  largura: string
}

const FEIXES: Feixe[] = [
  { id: 0, esquerda: '0%', largura: '33.33%' },
  { id: 1, esquerda: '33.33%', largura: '33.33%' },
  { id: 2, esquerda: '66.66%', largura: '33.33%' },
]

export function LuzesAmbiente() {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    FEIXES.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )

  useEffect(() => {
    let mounted = true

    async function loop() {
      await new Promise((r) => setTimeout(r, 5000))

      while (mounted) {
        const espera = 10000 + Math.random() * 8000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FEIXES.length)

        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.2 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.9 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // APAGA DE VERDADE (0 = escurecedor no máximo)
        setEstados((s) => ({ ...s, [idx]: 0 }))
        await new Promise((r) => setTimeout(r, 5000))
        if (!mounted) return

        for (let i = 0; i < 2; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.4 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        setEstados((s) => ({ ...s, [idx]: 1 }))
      }
    }

    loop()
    return () => { mounted = false }
  }, [])

  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 0 }}
      aria-hidden="true"
    >
      {FEIXES.map((f) => {
        const brilho = estados[f.id] ?? 1
        // Escurecedor forte agora — chega em 75% quando totalmente apagada
        const escurecedor = (1 - brilho) * 0.75

        return (
          <div
            key={f.id}
            className="absolute top-0 bottom-0"
            style={{
              left: f.esquerda,
              width: f.largura,
            }}
          >
            {/* Escurecedor bem visível */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: 'rgba(15, 8, 3, 0.85)',
                mixBlendMode: 'multiply',
              }}
              animate={{ opacity: escurecedor }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </div>
        )
      })}
    </div>
  )
}
