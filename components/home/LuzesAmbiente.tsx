'use client'

// LuzesAmbiente — Sistema completo de iluminação do "estádio".
//
// Fluxo:
// 1. Estado inicial: overlay escuro global (~65%) — tela fica "meio apagada"
// 2. 3 refletores cartoon descem do topo (SVG desenhado)
// 3. Refletores piscam em cascata (cada um libera um HALO de luz radial)
// 4. Halos dissipam o overlay escuro nas regiões que iluminam
// 5. Refletores sobem e somem
// 6. Loop contínuo: a cada 20-30s, um halo qualquer pisca/apaga/reacende
//
// O overlay escuro NÃO bloqueia cliques (pointer-events-none em tudo).

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState } from 'react'

interface Halo {
  id: number
  x: string
  y: string
  raio: number
  intensidade: number
}

// 3 halos orgânicos cobrindo a tela
const HALOS: Halo[] = [
  { id: 0, x: '20%', y: '25%', raio: 700, intensidade: 1 },
  { id: 1, x: '50%', y: '55%', raio: 850, intensidade: 1 },
  { id: 2, x: '80%', y: '28%', raio: 700, intensidade: 1 },
]

// ─── Refletor cartoon SVG ──────────────────────────────────────────────

function Refletor({ ligado, delay }: { ligado: boolean; delay: number }) {
  return (
    <div className="relative" style={{ width: 90, height: 100 }}>
      <svg viewBox="0 0 90 100" width="90" height="100">
        {/* Haste (segurando o refletor por cima) */}
        <line x1="45" y1="0" x2="45" y2="30" stroke="#3a2a1a" strokeWidth="3" />
        <circle cx="45" cy="30" r="3" fill="#3a2a1a" />

        {/* Corpo do refletor (retângulo cinza escuro) */}
        <rect
          x="10"
          y="30"
          width="70"
          height="40"
          rx="4"
          fill="#4a3a2a"
          stroke="#2a1e10"
          strokeWidth="2"
        />

        {/* Detalhe de textura (linhas horizontais) */}
        <line x1="14" y1="38" x2="76" y2="38" stroke="#3a2a1a" strokeWidth="0.8" opacity="0.5" />
        <line x1="14" y1="42" x2="76" y2="42" stroke="#5a4a3a" strokeWidth="0.6" opacity="0.6" />

        {/* Grade frontal (protetora) */}
        <line x1="14" y1="55" x2="76" y2="55" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />
        <line x1="14" y1="60" x2="76" y2="60" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />
        <line x1="14" y1="65" x2="76" y2="65" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />

        {/* 3 lâmpadas */}
        {[22, 45, 68].map((cx, i) => (
          <g key={i}>
            {/* Base da lâmpada */}
            <circle cx={cx} cy="50" r="9" fill="#1a1408" stroke="#0a0804" strokeWidth="1.5" />
            {/* Lâmpada em si */}
            <motion.circle
              cx={cx}
              cy="50"
              r="7"
              fill={ligado ? '#FFF4B8' : '#3a2e1a'}
              animate={{
                fill: ligado ? '#FFF4B8' : '#3a2e1a',
                filter: ligado ? 'brightness(1.3)' : 'brightness(0.6)',
              }}
              transition={{ duration: 0.2, delay: delay + i * 0.05 }}
            />
            {/* Brilho central (aparece quando ligada) */}
            {ligado && (
              <motion.circle
                cx={cx}
                cy="49"
                r="3"
                fill="#FFFFFF"
                initial={{ opacity: 0 }}
                animate={{ opacity: 0.9 }}
                transition={{ duration: 0.3, delay: delay + i * 0.05 }}
              />
            )}
          </g>
        ))}

        {/* Sombra por baixo (dá volume) */}
        <ellipse cx="45" cy="72" rx="35" ry="3" fill="#1a1408" opacity="0.4" />

        {/* Glow externo quando ligado */}
        {ligado && (
          <motion.ellipse
            cx="45"
            cy="55"
            rx="45"
            ry="20"
            fill="url(#refletorGlow)"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.7 }}
            transition={{ duration: 0.4, delay }}
          />
        )}

        <defs>
          <radialGradient id="refletorGlow">
            <stop offset="0%" stopColor="rgba(255, 240, 180, 0.6)" />
            <stop offset="100%" stopColor="rgba(255, 240, 180, 0)" />
          </radialGradient>
        </defs>
      </svg>
    </div>
  )
}

// ─── Componente principal ──────────────────────────────────────────────

export function LuzesAmbiente() {
  const [fase, setFase] = useState<'inicial' | 'refletoresDescendo' | 'refletoresLigando' | 'refletoresSubindo' | 'operando'>('inicial')
  const [refletoresLigados, setRefletoresLigados] = useState<[boolean, boolean, boolean]>([false, false, false])
  const [halosBrilho, setHalosBrilho] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 })

  // Sequência de abertura: escuro → refletores descem → ligam → halos acendem → refletores sobem
  useEffect(() => {
    let mounted = true

    async function sequenciaInicial() {
      // 1. Aguarda 400ms com tela escura
      await new Promise((r) => setTimeout(r, 400))
      if (!mounted) return

      // 2. Refletores descem (dura 900ms via CSS)
      setFase('refletoresDescendo')
      await new Promise((r) => setTimeout(r, 1100))
      if (!mounted) return

      // 3. Ligam em cascata (400ms cada) e halos correspondentes acendem
      setFase('refletoresLigando')

      // Refletor 0 liga
      setRefletoresLigados([true, false, false])
      setHalosBrilho((h) => ({ ...h, 0: 1 }))
      await new Promise((r) => setTimeout(r, 500))
      if (!mounted) return

      // Refletor 2 liga (pula o do meio, cria assimetria)
      setRefletoresLigados([true, false, true])
      setHalosBrilho((h) => ({ ...h, 2: 1 }))
      await new Promise((r) => setTimeout(r, 500))
      if (!mounted) return

      // Refletor 1 pisca antes de ligar (efeito fluorescente)
      for (let i = 0; i < 3; i++) {
        setRefletoresLigados([true, true, true])
        await new Promise((r) => setTimeout(r, 80))
        if (!mounted) return
        setRefletoresLigados([true, false, true])
        await new Promise((r) => setTimeout(r, 100))
        if (!mounted) return
      }
      setRefletoresLigados([true, true, true])
      setHalosBrilho((h) => ({ ...h, 1: 1 }))
      await new Promise((r) => setTimeout(r, 800))
      if (!mounted) return

      // 4. Refletores sobem e somem
      setFase('refletoresSubindo')
      await new Promise((r) => setTimeout(r, 1200))
      if (!mounted) return

      // 5. Estado operando (loop de queima começa)
      setFase('operando')
    }

    sequenciaInicial()
    return () => { mounted = false }
  }, [])

  // Loop de queima aleatória (só depois que entrou em "operando")
  useEffect(() => {
    if (fase !== 'operando') return

    let mounted = true

    async function loopQueima() {
      while (mounted) {
        const espera = 20000 + Math.random() * 15000
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * HALOS.length)

        // Piscar 3x
        for (let i = 0; i < 3; i++) {
          setHalosBrilho((h) => ({ ...h, [idx]: 0.15 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!mounted) return
          setHalosBrilho((h) => ({ ...h, [idx]: 0.9 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!mounted) return
        }

        // Apaga (fica 0 = escuridão máxima naquela região)
        setHalosBrilho((h) => ({ ...h, [idx]: 0 }))
        await new Promise((r) => setTimeout(r, 4500 + Math.random() * 2000))
        if (!mounted) return

        // Volta piscando
        for (let i = 0; i < 2; i++) {
          setHalosBrilho((h) => ({ ...h, [idx]: 0.5 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!mounted) return
          setHalosBrilho((h) => ({ ...h, [idx]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        setHalosBrilho((h) => ({ ...h, [idx]: 1 }))
      }
    }

    loopQueima()
    return () => { mounted = false }
  }, [fase])

  return (
    <>
      {/* ─── Overlay escuro global (por trás dos halos, cobre tudo) ─── */}
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        {/* Camada escura base — sempre presente */}
        <div
          className="absolute inset-0"
          style={{
            background: 'rgba(10, 6, 2, 0.55)',
            mixBlendMode: 'multiply',
          }}
        />

        {/* Halos de luz (dissipam o escuro nas regiões iluminadas) */}
        {HALOS.map((h) => {
          const brilho = halosBrilho[h.id] ?? 0
          return (
            <motion.div
              key={h.id}
              className="absolute rounded-full"
              style={{
                left: h.x,
                top: h.y,
                width: h.raio,
                height: h.raio,
                transform: 'translate(-50%, -50%)',
                background: 'radial-gradient(circle, rgba(255, 245, 210, 1) 0%, rgba(255, 235, 180, 0.7) 25%, rgba(255, 220, 150, 0.3) 55%, transparent 80%)',
                filter: 'blur(20px)',
                mixBlendMode: 'screen',
              }}
              animate={{ opacity: brilho * h.intensidade }}
              transition={{ duration: 0.3, ease: 'easeOut' }}
            />
          )
        })}
      </div>

      {/* ─── Refletores cartoon ─── */}
      <AnimatePresence>
        {(fase === 'refletoresDescendo' || fase === 'refletoresLigando') && (
          <motion.div
            className="pointer-events-none fixed left-0 right-0 top-0 flex justify-around px-8"
            style={{ zIndex: 10 }}
            initial={{ y: -120 }}
            animate={{ y: 0 }}
            exit={{ y: -120 }}
            transition={{
              y: { duration: 0.9, ease: [0.32, 0.72, 0, 1] },
            }}
          >
            <Refletor ligado={refletoresLigados[0]} delay={0} />
            <Refletor ligado={refletoresLigados[1]} delay={0.1} />
            <Refletor ligado={refletoresLigados[2]} delay={0.05} />
          </motion.div>
        )}

        {fase === 'refletoresSubindo' && (
          <motion.div
            className="pointer-events-none fixed left-0 right-0 top-0 flex justify-around px-8"
            style={{ zIndex: 10 }}
            initial={{ y: 0 }}
            animate={{ y: -140 }}
            transition={{
              y: { duration: 1.1, ease: [0.62, 0, 0.38, 1] },
            }}
          >
            <Refletor ligado={true} delay={0} />
            <Refletor ligado={true} delay={0} />
            <Refletor ligado={true} delay={0} />
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
