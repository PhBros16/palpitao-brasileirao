'use client'

// CortinaTransicao — cortina de teatro antigo que abre lateralmente (2 metades).
// Veludo bordô envelhecido com dourado gasto. Estética casa com o app vintage.
// Limitada à largura do app (max-w-md), lados escuros no PC.
//
// Fluxo:
//   ORIGEM (AberturaScreen): dispara CortinaFechando
//   → 2 metades vêm dos lados e fecham no centro (900ms)
//   → onProntoParaNavegar → router.push + flag no sessionStorage
//   DESTINO (LogadoLayout): CortinaAbrindo detecta flag
//   → aparece fechada → abre lateralmente (1400ms)

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir' // mantém o nome pra não quebrar refs
const DUR_FECHA = 900
const DUR_ABRE = 1400

const NUM_DOBRAS = 4 // por metade

// SVG de meia cortina (esquerda ou direita).
// A meia cortina é desenhada com viewBox 50x200 e projetada por transform.
function MeiaCortina({ lado }: { lado: 'esq' | 'dir' }) {
  const larguraDobra = 50 / NUM_DOBRAS
  const idPrefix = `${lado}-`

  return (
    <svg
      viewBox="0 0 50 200"
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
        <linearGradient id={`${idPrefix}veludo-base`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#4a1a14" />
          <stop offset="35%" stopColor="#5c1e18" />
          <stop offset="70%" stopColor="#4a1610" />
          <stop offset="100%" stopColor="#2e0d08" />
        </linearGradient>

        <linearGradient id={`${idPrefix}vala-sombra`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(0,0,0,0)" />
          <stop offset="50%" stopColor="rgba(15,5,3,0.7)" />
          <stop offset="100%" stopColor="rgba(0,0,0,0)" />
        </linearGradient>

        <linearGradient id={`${idPrefix}pico-luz`} x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="rgba(180,90,60,0)" />
          <stop offset="50%" stopColor="rgba(180,90,60,0.18)" />
          <stop offset="100%" stopColor="rgba(180,90,60,0)" />
        </linearGradient>

        <linearGradient id={`${idPrefix}ouro-gasto`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#c9a355" />
          <stop offset="40%" stopColor="#a37f2c" />
          <stop offset="80%" stopColor="#6d5316" />
          <stop offset="100%" stopColor="#3d2f0d" />
        </linearGradient>

        <filter id={`${idPrefix}ruido-veludo`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.9" numOctaves="2" seed={lado === 'esq' ? 7 : 13} />
          <feColorMatrix values="0 0 0 0 0.05
                                 0 0 0 0 0.02
                                 0 0 0 0 0.01
                                 0 0 0 0.15 0" />
        </filter>

        <radialGradient id={`${idPrefix}mancha1`} cx="0.3" cy="0.25" r="0.4">
          <stop offset="0%" stopColor="rgba(30,15,8,0.35)" />
          <stop offset="100%" stopColor="rgba(30,15,8,0)" />
        </radialGradient>
        <radialGradient id={`${idPrefix}mancha2`} cx="0.7" cy="0.6" r="0.35">
          <stop offset="0%" stopColor="rgba(60,25,15,0.25)" />
          <stop offset="100%" stopColor="rgba(60,25,15,0)" />
        </radialGradient>
        <radialGradient id={`${idPrefix}mancha3`} cx="0.5" cy="0.85" r="0.5">
          <stop offset="0%" stopColor="rgba(20,10,5,0.4)" />
          <stop offset="100%" stopColor="rgba(20,10,5,0)" />
        </radialGradient>

        {/* Vinheta interna (borda do centro — onde as 2 metades se encontram) */}
        <linearGradient id={`${idPrefix}vinheta-centro`} x1="0" y1="0" x2="1" y2="0">
          {lado === 'esq' ? (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.65)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0.65)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </>
          )}
        </linearGradient>

        {/* Vinheta lateral externa */}
        <linearGradient id={`${idPrefix}vinheta-externa`} x1="0" y1="0" x2="1" y2="0">
          {lado === 'esq' ? (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0.55)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.55)" />
            </>
          )}
        </linearGradient>
      </defs>

      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}veludo-base)`} />

      {Array.from({ length: NUM_DOBRAS }).map((_, i) => {
        const x = i * larguraDobra
        return (
          <rect
            key={`vala-${i}`}
            x={x}
            y={0}
            width={larguraDobra}
            height={200}
            fill={`url(#${idPrefix}vala-sombra)`}
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
            fill={`url(#${idPrefix}pico-luz)`}
          />
        )
      })}

      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}mancha1)`} />
      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}mancha2)`} />
      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}mancha3)`} />

      <rect x="0" y="0" width="50" height="200" filter={`url(#${idPrefix}ruido-veludo)`} opacity="0.5" />

      {/* Vinheta lateral externa (5px) */}
      <rect
        x={lado === 'esq' ? 0 : 45}
        y={0}
        width={5}
        height={200}
        fill={`url(#${idPrefix}vinheta-externa)`}
      />
      {/* Vinheta lateral interna (10px, mais forte — encosto das metades) */}
      <rect
        x={lado === 'esq' ? 40 : 0}
        y={0}
        width={10}
        height={200}
        fill={`url(#${idPrefix}vinheta-centro)`}
      />

      {/* Barra dourada gasta na base */}
      <rect x="0" y="190" width="50" height="10" fill={`url(#${idPrefix}ouro-gasto)`} />
      <rect x="0" y="190" width="50" height="0.5" fill="#e0b870" opacity="0.6" />
      <rect x="0" y="199.5" width="50" height="0.5" fill="#2a1f0a" opacity="0.8" />
      <rect x="0" y="190" width="50" height="10" fill={`url(#${idPrefix}mancha2)`} opacity="0.4" />
    </svg>
  )
}

function CortinaTeatro({
  aberta,
  duracao,
}: {
  aberta: boolean
  duracao: number
}) {
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

      {/* Container centrado, limitado à largura do app */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          width: '100%',
          maxWidth: '448px',
          height: '100%',
          transform: 'translateX(-50%)',
        }}
      >
        {/* Metade ESQUERDA */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            top: 0,
            width: '50%',
            height: '100%',
            transform: `translate3d(${aberta ? '-105%' : '0%'}, 0, 0)`,
            transition: `transform ${duracao}ms cubic-bezier(0.5, 0, 0.2, 1)`,
            willChange: 'transform',
          }}
        >
          <MeiaCortina lado="esq" />
        </div>

        {/* Metade DIREITA */}
        <div
          style={{
            position: 'absolute',
            right: 0,
            top: 0,
            width: '50%',
            height: '100%',
            transform: `translate3d(${aberta ? '105%' : '0%'}, 0, 0)`,
            transition: `transform ${duracao}ms cubic-bezier(0.5, 0, 0.2, 1)`,
            willChange: 'transform',
          }}
        >
          <MeiaCortina lado="dir" />
        </div>
      </div>
    </>
  )
}

/**
 * Componente pra usar na página de ORIGEM (AberturaScreen).
 * As metades começam abertas (fora da tela) e fecham no centro.
 * Chama onProntoParaNavegar quando a cortina cobriu totalmente a tela.
 */
export function CortinaDescendo({
  ativa,
  onProntoParaNavegar,
}: {
  ativa: boolean
  onProntoParaNavegar: () => void
}) {
  const [fechada, setFechada] = useState(false)

  useEffect(() => {
    if (!ativa) return
    // rAF duplo garante que o browser pinte o estado "aberta" antes de fechar
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setFechada(true))
    })
    const t = setTimeout(() => {
      try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
      onProntoParaNavegar()
    }, DUR_FECHA + 40)
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
      <CortinaTeatro aberta={!fechada} duracao={DUR_FECHA} />
    </div>
  )
}

/**
 * Componente pra usar na página de DESTINO (LogadoLayout).
 * Aparece fechada e abre lateralmente (metades saem pros lados).
 * Fica no DOM +300ms depois de abrir pra evitar pisca.
 */
export function CortinaSubindo() {
  // Lê o flag SÍNCRONO no useState — evita render "sem cortina" antes do useEffect
  const [ativa, setAtiva] = useState<boolean>(() => {
    if (typeof window === 'undefined') return false
    try {
      const flag = sessionStorage.getItem(CHAVE) === '1'
      if (flag) sessionStorage.removeItem(CHAVE)
      return flag
    } catch {
      return false
    }
  })
  const [aberta, setAberta] = useState(false)

  useEffect(() => {
    if (!ativa) return
    // rAF duplo pra pintar estado "fechada" antes de abrir
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setAberta(true))
    })
    const t = setTimeout(() => setAtiva(false), DUR_ABRE + 300)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(t)
    }
  }, [ativa])

  if (!ativa) return null

  return (
    <div
      className="pointer-events-none fixed inset-0"
      style={{ zIndex: 9999, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <CortinaTeatro aberta={aberta} duracao={DUR_ABRE} />
    </div>
  )
}
