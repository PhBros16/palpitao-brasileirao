'use client'

// LuzesAmbiente — Sistema completo de iluminação "estádio velho".
//
// Features:
// 1. Sequência inicial (1x/sessão): overlay escuro → refletores descem →
//    ligam em cascata → halos clareiam → refletores sobem → dissipa.
// 2. Loop de queima ocasional (15-30s): região escurece brevemente.
// 3. Lâmpada "cansada": halos que já queimaram têm chance maior + gaguejam mais.
// 4. Rajada de vento (2-4min): todos halos piscam sincronizados + escuridão breve.
// 5. Momento de silêncio (1x/sessão): tudo escurece 0.6s.
// 6. 20% de chance de 1 lâmpada nascer queimada (não liga na inicialização).
//
// Cliques nunca são bloqueados.

import { motion, AnimatePresence } from 'framer-motion'
import { useEffect, useState, useRef } from 'react'

interface Halo {
  id: number
  x: string
  y: string
  raio: number
}

const HALOS: Halo[] = [
  { id: 0, x: '15%', y: '20%', raio: 600 },
  { id: 1, x: '50%', y: '45%', raio: 750 },
  { id: 2, x: '85%', y: '22%', raio: 600 },
]

const CHAVE_SESSAO = 'palpitao_luzes_ligadas'
const CHAVE_SILENCIO = 'palpitao_silencio_ocorreu'
const CHAVE_CANSACO = 'palpitao_cansaco_halos'
const CHAVE_LAMPADA_QUEIMADA = 'palpitao_lampada_queimada'

// ─── Refletor cartoon ──────────────────────────────────────────────

function Refletor({
  lampadas,
  scale = 1,
}: {
  lampadas: [boolean, boolean, boolean]
  scale?: number
}) {
  const size = 80 * scale
  return (
    <svg viewBox="0 0 90 100" width={size} height={size * (100 / 90)}>
      <line x1="45" y1="0" x2="45" y2="30" stroke="#3a2a1a" strokeWidth="3" />
      <circle cx="45" cy="30" r="3" fill="#3a2a1a" />
      <rect x="10" y="30" width="70" height="40" rx="4" fill="#4a3a2a" stroke="#2a1e10" strokeWidth="2" />
      <line x1="14" y1="38" x2="76" y2="38" stroke="#3a2a1a" strokeWidth="0.8" opacity="0.5" />
      <line x1="14" y1="42" x2="76" y2="42" stroke="#5a4a3a" strokeWidth="0.6" opacity="0.6" />
      <line x1="14" y1="55" x2="76" y2="55" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />
      <line x1="14" y1="60" x2="76" y2="60" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />
      <line x1="14" y1="65" x2="76" y2="65" stroke="#2a1e10" strokeWidth="0.6" opacity="0.7" />

      {[22, 45, 68].map((cx, i) => (
        <g key={i}>
          <circle cx={cx} cy="50" r="9" fill="#1a1408" stroke="#0a0804" strokeWidth="1.5" />
          <motion.circle
            cx={cx}
            cy="50"
            r="7"
            animate={{
              fill: lampadas[i] ? '#FFF4B8' : '#3a2e1a',
            }}
            transition={{ duration: 0.15 }}
          />
          {lampadas[i] && (
            <motion.circle
              cx={cx}
              cy="49"
              r="3"
              fill="#FFFFFF"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.9 }}
              transition={{ duration: 0.2 }}
            />
          )}
        </g>
      ))}

      <ellipse cx="45" cy="72" rx="35" ry="3" fill="#1a1408" opacity="0.4" />

      {lampadas.some(Boolean) && (
        <motion.ellipse
          cx="45"
          cy="55"
          rx="45"
          ry="20"
          fill="url(#refletorGlow)"
          initial={{ opacity: 0 }}
          animate={{ opacity: 0.6 }}
          transition={{ duration: 0.3 }}
        />
      )}

      <defs>
        <radialGradient id="refletorGlow">
          <stop offset="0%" stopColor="rgba(255, 240, 180, 0.6)" />
          <stop offset="100%" stopColor="rgba(255, 240, 180, 0)" />
        </radialGradient>
      </defs>
    </svg>
  )
}

// ─── Componente principal ──────────────────────────────────────────────

type EstadoLampadas = [boolean, boolean, boolean]

// Helpers pra sessionStorage — sempre com fallback
function lerCansaco(): Record<number, number> {
  if (typeof window === 'undefined') return { 0: 0, 1: 0, 2: 0 }
  try {
    const raw = sessionStorage.getItem(CHAVE_CANSACO)
    if (!raw) return { 0: 0, 1: 0, 2: 0 }
    return JSON.parse(raw)
  } catch {
    return { 0: 0, 1: 0, 2: 0 }
  }
}

function salvarCansaco(cansaco: Record<number, number>): void {
  if (typeof window === 'undefined') return
  try {
    sessionStorage.setItem(CHAVE_CANSACO, JSON.stringify(cansaco))
  } catch { /* ignora */ }
}

function lerLampadaQueimada(): [number, number] {
  if (typeof window === 'undefined') return [-1, -1]
  try {
    const raw = sessionStorage.getItem(CHAVE_LAMPADA_QUEIMADA)
    if (raw) return JSON.parse(raw)
  } catch { /* ignora */ }

  // Não tem salvo — sorteia agora
  let sorteio: [number, number] = [-1, -1]
  if (Math.random() < 0.2) {
    sorteio = [Math.floor(Math.random() * 3), Math.floor(Math.random() * 3)]
  }
  try {
    sessionStorage.setItem(CHAVE_LAMPADA_QUEIMADA, JSON.stringify(sorteio))
  } catch { /* ignora */ }
  return sorteio
}

export function LuzesAmbiente() {
  const [fase, setFase] = useState<'esperando' | 'inicial' | 'refletoresDescendo' | 'refletoresLigando' | 'refletoresSubindo' | 'operando'>(() => {
    if (typeof window === 'undefined') return 'esperando'
    try {
      return sessionStorage.getItem(CHAVE_SESSAO) === '1' ? 'operando' : 'esperando'
    } catch {
      return 'esperando'
    }
  })

  // Ref pra qual lâmpada nasce queimada (persiste na sessão)
  const lampadaQueimada = useRef<[number, number]>(lerLampadaQueimada())

  const [refletores, setRefletores] = useState<{ 0: EstadoLampadas; 1: EstadoLampadas; 2: EstadoLampadas }>({
    0: [false, false, false],
    1: [false, false, false],
    2: [false, false, false],
  })

  const [halosBrilho, setHalosBrilho] = useState<Record<number, number>>({ 0: 0, 1: 0, 2: 0 })

  const [escuridaoGlobal, setEscuridaoGlobal] = useState(() => {
    if (typeof window === 'undefined') return 0
    try {
      return sessionStorage.getItem(CHAVE_SESSAO) === '1' ? 0 : 0.65
    } catch {
      return 0.65
    }
  })

  // Flag pra prevenir dois eventos raros ao mesmo tempo
  const eventoAtivo = useRef(false)

  // Contador de cansaço por halo
  const cansacoHalos = useRef<Record<number, number>>(lerCansaco())

  async function ligarRefletorGradual(
    idxRefletor: 0 | 1 | 2,
    mounted: () => boolean,
  ) {
    for (let l = 0; l < 3; l++) {
      // Se essa lâmpada está queimada, pula (fica apagada)
      if (
        lampadaQueimada.current[0] === idxRefletor &&
        lampadaQueimada.current[1] === l
      ) {
        continue
      }

      if (Math.random() > 0.4) {
        setRefletores((r) => {
          const novo = [...r[idxRefletor]] as EstadoLampadas
          novo[l] = true
          return { ...r, [idxRefletor]: novo }
        })
        await new Promise((res) => setTimeout(res, 60))
        if (!mounted()) return
        setRefletores((r) => {
          const novo = [...r[idxRefletor]] as EstadoLampadas
          novo[l] = false
          return { ...r, [idxRefletor]: novo }
        })
        await new Promise((res) => setTimeout(res, 80))
        if (!mounted()) return
      }
      setRefletores((r) => {
        const novo = [...r[idxRefletor]] as EstadoLampadas
        novo[l] = true
        return { ...r, [idxRefletor]: novo }
      })
      await new Promise((res) => setTimeout(res, 180 + Math.random() * 200))
      if (!mounted()) return
    }
  }

  // Calcula estado final das lâmpadas do refletor considerando queimada
  function estadoFinalRefletor(idx: number): EstadoLampadas {
    const base: EstadoLampadas = [true, true, true]
    if (lampadaQueimada.current[0] === idx) {
      const l = lampadaQueimada.current[1]
      if (l >= 0 && l < 3) base[l] = false
    }
    return base
  }

  // Sequência inicial
  useEffect(() => {
    if (fase !== 'esperando') return

    let alive = true
    const isMounted = () => alive

    async function sequenciaInicial() {
      setFase('inicial')

      await new Promise((r) => setTimeout(r, 800))
      if (!alive) return

      setFase('refletoresDescendo')
      await new Promise((r) => setTimeout(r, 1600))
      if (!alive) return

      setFase('refletoresLigando')

      await ligarRefletorGradual(0, isMounted)
      if (!alive) return
      setHalosBrilho((h) => ({ ...h, 0: 1 }))
      setEscuridaoGlobal(0.5)
      await new Promise((r) => setTimeout(r, 400))
      if (!alive) return

      await ligarRefletorGradual(2, isMounted)
      if (!alive) return
      setHalosBrilho((h) => ({ ...h, 2: 1 }))
      setEscuridaoGlobal(0.3)
      await new Promise((r) => setTimeout(r, 400))
      if (!alive) return

      await ligarRefletorGradual(1, isMounted)
      if (!alive) return
      setHalosBrilho((h) => ({ ...h, 1: 1 }))
      setEscuridaoGlobal(0.15)
      await new Promise((r) => setTimeout(r, 900))
      if (!alive) return

      setFase('refletoresSubindo')
      await new Promise((r) => setTimeout(r, 1800))
      if (!alive) return

      setHalosBrilho({ 0: 0, 1: 0, 2: 0 })
      setEscuridaoGlobal(0)
      await new Promise((r) => setTimeout(r, 2000))
      if (!alive) return

      try {
        sessionStorage.setItem(CHAVE_SESSAO, '1')
      } catch { /* ignora */ }

      setFase('operando')
    }

    sequenciaInicial()
    return () => { alive = false }
  }, [fase])

  // Loop de queima com "cansaço"
  useEffect(() => {
    if (fase !== 'operando') return

    let alive = true

    setHalosBrilho({ 0: 0, 1: 0, 2: 0 })
    setEscuridaoGlobal(0)

    async function loopQueima() {
      await new Promise((r) => setTimeout(r, 8000))
      if (!alive) return

      while (alive) {
        const espera = 15000 + Math.random() * 15000
        await new Promise((r) => setTimeout(r, espera))
        if (!alive) return

        if (eventoAtivo.current) continue

        // Sorteio com pesos (halos cansados têm mais chance)
        const pesos = HALOS.map((h) => 1 + (cansacoHalos.current[h.id] ?? 0) * 0.5)
        const total = pesos.reduce((s, p) => s + p, 0)
        let sorteio = Math.random() * total
        let idx = 0
        for (let i = 0; i < pesos.length; i++) {
          sorteio -= pesos[i]
          if (sorteio <= 0) {
            idx = i
            break
          }
        }

        cansacoHalos.current[idx] = (cansacoHalos.current[idx] ?? 0) + 1
        salvarCansaco(cansacoHalos.current)

        const piscadasExtras = Math.min(cansacoHalos.current[idx], 3)
        const totalPiscadas = 3 + piscadasExtras

        for (let i = 0; i < totalPiscadas; i++) {
          setHalosBrilho((h) => ({ ...h, [idx]: -0.6 }))
          await new Promise((r) => setTimeout(r, 90))
          if (!alive) return
          setHalosBrilho((h) => ({ ...h, [idx]: 0 }))
          await new Promise((r) => setTimeout(r, 110))
          if (!alive) return
        }

        setHalosBrilho((h) => ({ ...h, [idx]: -1 }))
        await new Promise((r) => setTimeout(r, 4000 + Math.random() * 2000))
        if (!alive) return

        for (let i = 0; i < 2; i++) {
          setHalosBrilho((h) => ({ ...h, [idx]: -0.3 }))
          await new Promise((r) => setTimeout(r, 80))
          if (!alive) return
          setHalosBrilho((h) => ({ ...h, [idx]: -0.8 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!alive) return
        }

        setHalosBrilho((h) => ({ ...h, [idx]: 0 }))
      }
    }

    loopQueima()

    return () => {
      alive = false
      setHalosBrilho({ 0: 0, 1: 0, 2: 0 })
      setEscuridaoGlobal(0)
    }
  }, [fase])

  // Rajada de vento (a cada 2-4 min)
  useEffect(() => {
    if (fase !== 'operando') return

    let alive = true

    async function loopRajada() {
      await new Promise((r) => setTimeout(r, 120000 + Math.random() * 120000))
      if (!alive) return

      while (alive) {
        while (alive && eventoAtivo.current) {
          await new Promise((r) => setTimeout(r, 500))
        }
        if (!alive) return

        eventoAtivo.current = true

        for (let i = 0; i < 3; i++) {
          setHalosBrilho({ 0: -0.5, 1: -0.5, 2: -0.5 })
          await new Promise((r) => setTimeout(r, 120))
          if (!alive) { eventoAtivo.current = false; return }
          setHalosBrilho({ 0: 0, 1: 0, 2: 0 })
          await new Promise((r) => setTimeout(r, 100))
          if (!alive) { eventoAtivo.current = false; return }
        }

        setEscuridaoGlobal(0.25)
        await new Promise((r) => setTimeout(r, 400))
        if (!alive) { eventoAtivo.current = false; return }
        setEscuridaoGlobal(0)

        eventoAtivo.current = false

        await new Promise((r) => setTimeout(r, 120000 + Math.random() * 120000))
        if (!alive) return
      }
    }

    loopRajada()

    return () => { alive = false }
  }, [fase])

  // Momento de silêncio — 1x/sessão
  useEffect(() => {
    if (fase !== 'operando') return

    let alive = true

    let jaOcorreu = false
    try {
      jaOcorreu = sessionStorage.getItem(CHAVE_SILENCIO) === '1'
    } catch { /* ignora */ }

    if (jaOcorreu) return

    async function eventoSilencio() {
      const espera = 60000 + Math.random() * 240000
      await new Promise((r) => setTimeout(r, espera))
      if (!alive) return

      while (alive && eventoAtivo.current) {
        await new Promise((r) => setTimeout(r, 500))
      }
      if (!alive) return

      eventoAtivo.current = true

      setEscuridaoGlobal(0.75)
      setHalosBrilho({ 0: -0.9, 1: -0.9, 2: -0.9 })

      await new Promise((r) => setTimeout(r, 600))
      if (!alive) { eventoAtivo.current = false; return }

      setEscuridaoGlobal(0)
      setHalosBrilho({ 0: 0, 1: 0, 2: 0 })

      try {
        sessionStorage.setItem(CHAVE_SILENCIO, '1')
      } catch { /* ignora */ }

      await new Promise((r) => setTimeout(r, 1500))
      eventoAtivo.current = false
    }

    eventoSilencio()

    return () => { alive = false }
  }, [fase])

  return (
    <>
      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 1 }}
        aria-hidden="true"
      >
        <motion.div
          className="absolute inset-0"
          animate={{
            background: `rgba(10, 6, 2, ${escuridaoGlobal})`,
          }}
          transition={{ duration: 1.2, ease: 'easeInOut' }}
          style={{
            mixBlendMode: 'multiply',
          }}
        />

        {HALOS.map((h) => {
          const brilho = halosBrilho[h.id] ?? 0

          if (brilho >= 0) {
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
                  background: 'radial-gradient(circle, rgba(255, 245, 210, 1) 0%, rgba(255, 235, 180, 0.5) 30%, transparent 65%)',
                  filter: 'blur(30px)',
                  mixBlendMode: 'screen',
                }}
                animate={{ opacity: brilho }}
                transition={{ duration: 1.5, ease: 'easeOut' }}
              />
            )
          } else {
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
                  background: 'radial-gradient(circle, rgba(5, 3, 1, 0.7) 0%, rgba(5, 3, 1, 0.35) 40%, transparent 70%)',
                  filter: 'blur(30px)',
                  mixBlendMode: 'multiply',
                }}
                animate={{ opacity: Math.abs(brilho) }}
                transition={{ duration: 0.3, ease: 'easeInOut' }}
              />
            )
          }
        })}
      </div>

      <AnimatePresence>
        {(fase === 'refletoresDescendo' || fase === 'refletoresLigando') && (
          <motion.div
            className="pointer-events-none fixed left-0 right-0 top-0 z-[10] flex items-start justify-around px-2"
            style={{ maxWidth: '100vw' }}
            initial={{ y: -140 }}
            animate={{ y: 0 }}
            exit={{ y: -140 }}
            transition={{ y: { duration: 1.5, ease: [0.32, 0.72, 0, 1] } }}
          >
            <div className="block sm:hidden"><Refletor lampadas={refletores[0]} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={refletores[0]} scale={1} /></div>
            <div className="block sm:hidden"><Refletor lampadas={refletores[1]} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={refletores[1]} scale={1} /></div>
            <div className="block sm:hidden"><Refletor lampadas={refletores[2]} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={refletores[2]} scale={1} /></div>
          </motion.div>
        )}

        {fase === 'refletoresSubindo' && (
          <motion.div
            className="pointer-events-none fixed left-0 right-0 top-0 z-[10] flex items-start justify-around px-2"
            style={{ maxWidth: '100vw' }}
            initial={{ y: 0 }}
            animate={{ y: -160 }}
            transition={{ y: { duration: 1.8, ease: [0.62, 0, 0.38, 1] } }}
          >
            <div className="block sm:hidden"><Refletor lampadas={estadoFinalRefletor(0)} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={estadoFinalRefletor(0)} scale={1} /></div>
            <div className="block sm:hidden"><Refletor lampadas={estadoFinalRefletor(1)} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={estadoFinalRefletor(1)} scale={1} /></div>
            <div className="block sm:hidden"><Refletor lampadas={estadoFinalRefletor(2)} scale={0.45} /></div>
            <div className="hidden sm:block"><Refletor lampadas={estadoFinalRefletor(2)} scale={1} /></div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  )
}
/* ─── Overlay escuro inicial (evita flash antes das luzes React) ─── */

body::before {
  content: '';
  position: fixed;
  inset: 0;
  background: rgba(10, 6, 2, 0.65);
  pointer-events: none;
  z-index: 1;
  mix-blend-mode: multiply;
  transition: opacity 1s ease-out;
}

body.luzes-ligadas::before {
  opacity: 0;
}
