'use client'

// CortinaTransicao — 2 metades de couro do álbum que se fecham no centro
// (na saída da abertura) e se abrem lateralmente (na chegada da Home).
// Mesma paleta e textura da capa do álbum — mantém coerência visual.
// Limitada à largura do app (max-w-md), lados escuros no PC.

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir' // mantém nome pra compatibilidade
const DUR_FECHA = 900
const DUR_ABRE = 1400

// Meia capa de couro (esquerda ou direita).
// viewBox 50x200 projetado por width/height 100%.
function MeiaCouro({ lado }: { lado: 'esq' | 'dir' }) {
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
        {/* Base couro — mesmo gradiente da capa (couro-300 → couro-600) */}
        <radialGradient id={`${idPrefix}couro-base`} cx="0.5" cy="0.3" r="1.2">
          <stop offset="0%" stopColor="#a06a3f" />
          <stop offset="45%" stopColor="#8B5A2B" />
          <stop offset="100%" stopColor="#5a3a1a" />
        </radialGradient>

        {/* Sombra profunda no lado interno (onde as 2 metades se encontram) */}
        <linearGradient id={`${idPrefix}sombra-centro`} x1="0" y1="0" x2="1" y2="0">
          {lado === 'esq' ? (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(20,10,3,0.75)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="rgba(20,10,3,0.75)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </>
          )}
        </linearGradient>

        {/* Vinheta externa */}
        <linearGradient id={`${idPrefix}vinheta-ext`} x1="0" y1="0" x2="1" y2="0">
          {lado === 'esq' ? (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0.45)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </>
          ) : (
            <>
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0.45)" />
            </>
          )}
        </linearGradient>

        {/* Ouro pra bordas — dourado gasto do app */}
        <linearGradient id={`${idPrefix}ouro`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#d4a017" />
          <stop offset="50%" stopColor="#b8860b" />
          <stop offset="100%" stopColor="#8b6510" />
        </linearGradient>

        {/* Textura de grão de couro (fractal noise sutil) */}
        <filter id={`${idPrefix}grao-couro`} x="0" y="0" width="100%" height="100%">
          <feTurbulence type="fractalNoise" baseFrequency="0.85" numOctaves="2" seed={lado === 'esq' ? 3 : 11} />
          <feColorMatrix values="0 0 0 0 0.08
                                 0 0 0 0 0.04
                                 0 0 0 0 0.02
                                 0 0 0 0.2 0" />
        </filter>

        {/* Manchas de envelhecimento */}
        <radialGradient id={`${idPrefix}mancha1`} cx="0.35" cy="0.25" r="0.4">
          <stop offset="0%" stopColor="rgba(40,20,8,0.3)" />
          <stop offset="100%" stopColor="rgba(40,20,8,0)" />
        </radialGradient>
        <radialGradient id={`${idPrefix}mancha2`} cx="0.6" cy="0.7" r="0.4">
          <stop offset="0%" stopColor="rgba(80,45,20,0.22)" />
          <stop offset="100%" stopColor="rgba(80,45,20,0)" />
        </radialGradient>
      </defs>

      {/* Base couro */}
      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}couro-base)`} />

      {/* Manchas */}
      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}mancha1)`} />
      <rect x="0" y="0" width="50" height="200" fill={`url(#${idPrefix}mancha2)`} />

      {/* Textura de grão */}
      <rect x="0" y="0" width="50" height="200" filter={`url(#${idPrefix}grao-couro)`} opacity="0.55" />

      {/* Moldura dourada — só nas bordas superior/inferior/externa (não no centro) */}
      {/* Borda superior */}
      <rect x="0" y="0" width="50" height="1.5" fill={`url(#${idPrefix}ouro)`} />
      {/* Borda inferior */}
      <rect x="0" y="198.5" width="50" height="1.5" fill={`url(#${idPrefix}ouro)`} />
      {/* Borda externa (lateral) */}
      <rect
        x={lado === 'esq' ? 0 : 48.5}
        y={0}
        width={1.5}
        height={200}
        fill={`url(#${idPrefix}ouro)`}
      />

      {/* Segunda moldura interna (linha dourada fina paralela) */}
      <rect x={lado === 'esq' ? 2.5 : 46} y="3" width="1.5" height="0" opacity="0" />
      {/* Linha dourada interna decorativa */}
      <rect
        x={lado === 'esq' ? 3 : 45.5}
        y={4}
        width={1.5}
        height={192}
        fill={`url(#${idPrefix}ouro)`}
        opacity="0.55"
      />
      <rect x="4" y="4" width="42" height="0" opacity="0" />
      {/* Filete horizontal interno (topo e base) */}
      <rect
        x={lado === 'esq' ? 4 : 4}
        y={4}
        width={lado === 'esq' ? 44 : 42}
        height={0.8}
        fill={`url(#${idPrefix}ouro)`}
        opacity="0.55"
      />
      <rect
        x={lado === 'esq' ? 4 : 4}
        y={195.2}
        width={lado === 'esq' ? 44 : 42}
        height={0.8}
        fill={`url(#${idPrefix}ouro)`}
        opacity="0.55"
      />

      {/* Sombra profunda no vinco central (onde as metades se encontram) */}
      <rect
        x={lado === 'esq' ? 35 : 0}
        y={0}
        width={15}
        height={200}
        fill={`url(#${idPrefix}sombra-centro)`}
      />

      {/* Vinheta lateral externa */}
      <rect
        x={lado === 'esq' ? 0 : 42}
        y={0}
        width={8}
        height={200}
        fill={`url(#${idPrefix}vinheta-ext)`}
      />
    </svg>
  )
}

function CortinaAlbum({ aberta, duracao }: { aberta: boolean; duracao: number }) {
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
            boxShadow: aberta ? 'none' : '2px 0 12px rgba(0,0,0,0.4)',
          }}
        >
          <MeiaCouro lado="esq" />
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
            boxShadow: aberta ? 'none' : '-2px 0 12px rgba(0,0,0,0.4)',
          }}
        >
          <MeiaCouro lado="dir" />
        </div>
      </div>
    </>
  )
}

/**
 * Componente pra usar na página de ORIGEM (AberturaScreen).
 * As metades começam abertas (fora da tela) e fecham no centro.
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
      <CortinaAlbum aberta={!fechada} duracao={DUR_FECHA} />
    </div>
  )
}

/**
 * Componente pra usar na página de DESTINO (LogadoLayout).
 * Aparece fechada e abre lateralmente.
 */
export function CortinaSubindo() {
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
      <CortinaAlbum aberta={aberta} duracao={DUR_ABRE} />
    </div>
  )
}
