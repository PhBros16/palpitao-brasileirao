'use client'

// LuzesAmbiente — 3 feixes verticais vindos do topo cobrindo toda a tela.
// Sem cor própria: apenas realçam (blend overlay) o fundo existente.
// Quando um pisca/queima, aquele terço da tela escurece uniformemente.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Feixe {
  id: number
  esquerda: string
  largura: string
}

// 3 feixes cobrindo a tela em 3 colunas iguais
const FEIXES: Feixe[] = [
  { id: 0, esquerda: '0%',    largura: '33.33%' },
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
      await new Promise((r) => setTimeout(r, 8000))

      while (mounted) {
        const espera = 20000 + Math.random() * 20000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FEIXES.length)

        // Piscar 3x (fluorescente falhando)
        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.2 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.9 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // Apaga (fica em 0.35 pra ainda dar pra ler)
        setEstados((s) => ({ ...s, [idx]: 0.35 }))
        await new Promise((r) => setTimeout(r, 4500 + Math.random() * 2000))
        if (!mounted) return

        // Volta piscando 2x
        for (let i = 0; i < 2; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.5 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 0.15 }))
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
      {FEIXES.map((f) => {
        const brilho = estados[f.id] ?? 1
        // brilho vai de 0.35 (apagado) até 1 (aceso)
        // opacity do "escurecedor" fica maior quanto menor o brilho
        const escurecedor = (1 - brilho) * 0.55

        return (
          <motion.div
            key={f.id}
            className="absolute top-0 bottom-0"
            style={{
              left: f.esquerda,
              width: f.largura,
            }}
          >
            {/* Feixe de luz (realce sutil no topo, dissipa em baixo) */}
            <div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg,
                  rgba(255, 255, 255, 0.15) 0%,
                  rgba(255, 255, 255, 0.08) 40%,
                  rgba(255, 255, 255, 0.02) 100%
                )`,
                mixBlendMode: 'overlay',
                opacity: brilho,
                transition: 'opacity 0.25s ease-out',
              }}
            />

            {/* Escurecedor (aparece quando feixe apaga) */}
            <motion.div
              className="absolute inset-0"
              style={{
                background: `linear-gradient(180deg,
                  rgba(20, 12, 5, 0.6) 0%,
                  rgba(20, 12, 5, 0.4) 50%,
                  rgba(20, 12, 5, 0.25) 100%
                )`,
                mixBlendMode: 'multiply',
              }}
              animate={{ opacity: escurecedor }}
              transition={{ duration: 0.3, ease: 'easeInOut' }}
            />
          </motion.div>
        )
      })}
    </div>
  )
}
