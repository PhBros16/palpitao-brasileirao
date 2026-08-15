'use client'

// CortinaTransicao — cortina de teatro antigo, veludo bordô envelhecido
// com dourado gasto. Estética casa com o app "álbum vintage" (couro,
// dourado desgastado, papel envelhecido). Limitada à largura do app.

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir'
const DUR_DESCE = 900
const DUR_SUBE = 1400

const NUM_DOBRAS = 7

function CortinaTeatro({ deslocamento, duracao }: { deslocamento: string; duracao: number }) {
  const larguraDobra = 100 / NUM_DOBRAS

  return (
    <>
      {/* Fundo escuro cobrindo a tela toda (pra PC) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'linear-gradient(180deg, #1a0f08 0%, #0a0503 100%)',
        }}
      />

      {/* Cortina centrada, limitada à largura do app */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '100%',
          maxWidth: '448px',
          height: '100%',
          transform: `translate3d(-50%, ${deslocamento}, 0)`,
          transition: `transform ${duracao}ms cubic-bezier(0.5, 0, 0.2, 1)`,
          willChange: 'transform',
        }}
      >
        <svg
          viewBox="0 0 100 200"
          preserveAspectRatio="none"
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            display: 'block',
          }}
        >
          <defs>
            <linearGradient id="veludo-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#4a1a14" />
              <stop offset="35%" stopColor="#5c1e18" />
              <stop offset="70%" stopColor="#4a1610" />
              <stop offset="100%" stopColor="#2e0d08" />
            </linearGradient>

            <linearGradient id="vala-sombra" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="50%" stopColor="rgba(15,5,3,0.7)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>

            <linearGradient id="pico-luz" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(180,90,60,0)" />
              <stop offset="50%" stopColor="rgba(180,90,60,0.18)" />
              <stop offset="100%" stopColor="rgba(180,90,60,0)" />
            </linearGradient>

            <linearGradient id="ouro-gasto" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#c9a355" />
              <stop offset="40%" stopColor="#a37f2c" />
              <stop offset="80%" stopColor="#6d5316" />
              <stop offset="100%" stopColor="#3d2f0d" />
            </linearGradient>

            <filter id="ruido-veludo" x="0" y="0" width="100%" height="100%">
              <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed="7" />
              <feColorMatrix values="0 0 0 0 0.05
                                     0 0 0 0 0.02
                                     0 0 0 0 0.01
                                     0 0 0 0.15 0" />
            </filter>

            <radialGradient id="mancha1" cx="0.3" cy="0.25" r="0.4">
              <stop offset="0%" stopColor="rgba(30,15,8,0.35)" />
              <stop offset="100%" stopColor="rgba(30,15,8,0)" />
            </radialGradient>
            <radialGradient id="mancha2" cx="0.7" cy="0.6" r="0.35">
              <stop offset="0%" stopColor="rgba(60,25,15,0.25)" />
              <stop offset="100%" stopColor="rgba(60,25,15,0)" />
            </radialGradient>
            <radialGradient id="mancha3" cx="0.5" cy="0.85" r="0.5">
              <stop offset="0%" stopColor="rgba(20,10,5,0.4)" />
              <stop offset="100%" stopColor="rgba(20,10,5,0)" />
            </radialGradient>

            <linearGradient id="vinheta-esq" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>
            <linearGradient id="vinheta-dir" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </linearGradient>
          </defs>

          <rect x="0" y="0" width="100" height="200" fill="url(#veludo-base)" />

          {Array.from({ length: NUM_DOBRAS }).map((_, i) => {
            const x = i * larguraDobra
            return (
              <rect
                key={`vala-${i}`}
                x={x}
                y={0}
                width={larguraDobra}
                height={200}
                fill="url(#vala-sombra)"
                opacity={0.8}
              />
            )
          })}

          {Array.from({ length: NUM_DOBRAS }).map((_, i) => {
            const cx = i * larguraDobra + larguraDobra / 2
            return (
              <ellipse
                key={`luz-${i}`}
                cx={cx}
                cy={100}
                rx={larguraDobra * 0.32}
                ry={120}
                fill="url(#pico-luz)"
              />
            )
          })}

          <rect x="0" y="0" width="100" height="200" fill="url(#mancha1)" />
          <rect x="0" y="0" width="100" height="200" fill="url(#mancha2)" />
          <rect x="0" y="0" width="100" height="200" fill="url(#mancha3)" />

          <rect x="0" y="0" width="100" height="200" filter="url(#ruido-veludo)" opacity="0.5" />

          <rect x="0" y="0" width="10" height="200" fill="url(#vinheta-esq)" />
          <rect x="90" y="0" width="10" height="200" fill="url(#vinheta-dir)" />

          <rect x="0" y="190" width="100" height="10" fill="url(#ouro-gasto)" />
          <rect x="0" y="190" width="100" height="0.5" fill="#e0b870" opacity="0.6" />
          <rect x="0" y="199.5" width="100" height="0.5" fill="#2a1f0a" opacity="0.8" />
          <rect x="0" y="190" width="100" height="10" fill="url(#mancha2)" opacity="0.4" />
        </svg>
      </div>
    </>
  )
}

/**
 * Componente pra usar na página de ORIGEM (AberturaScreen).
 * Renderiza SEMPRE (mesmo antes de "ativa") pra evitar pisca de primeiro paint.
 * Só quando ativa=true começa a descer.
 */
export function CortinaDescendo({
  ativa,
  onProntoParaNavegar,
}: {
  ativa: boolean
  onProntoParaNavegar: () => void
}) {
  const [descendo, setDescendo] = useState(false)

  useEffect(() => {
    if (!ativa) return
    // requestAnimationFrame duplo garante que o browser pinte o estado
    // inicial (-105%) antes de animar pra 0%
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setDescendo(true))
    })
    const t = setTimeout(() => {
      try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
      onProntoParaNavegar()
    }, DUR_DESCE + 40)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t)
    }
  }, [ativa, onProntoParaNavegar])

  if (!ativa) return null

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9999, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <CortinaTeatro deslocamento={descendo ? '0%' : '-105%'} duracao={DUR_DESCE} />
    </div>
  )
}

/**
 * Componente pra usar na página de DESTINO (LogadoLayout).
 * Aparece coberta e sobe. Fica no DOM mais tempo do que precisaria pra
 * evitar pisca ao desmontar antes da Home terminar de pintar.
 */
export function CortinaSubindo() {
  const [ativa, setAtiva] = useState(false)
  const [subindo, setSubindo] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    try {
      if (sessionStorage.getItem(CHAVE) !== '1') return
      sessionStorage.removeItem(CHAVE)
    } catch {
      return
    }

    setAtiva(true)
    // requestAnimationFrame duplo garante pintar '0%' antes de animar pra '-105%'
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setSubindo(true))
    })
    // Fica no DOM 300ms extras depois de subir completamente pra evitar pisca
    const t = setTimeout(() => setAtiva(false), DUR_SUBE + 300)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t)
    }
  }, [])

  if (!ativa) return null

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9999, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <CortinaTeatro deslocamento={subindo ? '-105%' : '0%'} duracao={DUR_SUBE} />
    </div>
  )
}
