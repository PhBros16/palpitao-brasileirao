'use client'

// CortinaTransicao — cortina de teatro estética cartoon/ilustração.
// Vermelho vinho profundo, dobras grandes desenhadas, cordão dourado
// com borla no rodapé. Limitada à largura do app (max-w-md).
//
// Fluxo:
//   ORIGEM (AberturaScreen): dispara CortinaDescendo
//   → cortina desce (900ms) → onProntoParaNavegar → router.push
//   → sessionStorage flag 'palpitao_cortina_subir' = '1'
//   DESTINO (LogadoLayout): CortinaSubindo detecta flag
//   → aparece coberta → sobe (1400ms) → luzes acendem sincronizadas

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir'
const DUR_DESCE = 900
const DUR_SUBE = 1400

// Número de dobras verticais grandes (cartoon)
const NUM_DOBRAS = 7

function CortinaTeatro({ deslocamento, duracao }: { deslocamento: string; duracao: number }) {
  return (
    <>
      {/* Fundo escuro cobrindo a tela toda (pra PC) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.9)',
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
          transform: `translateX(-50%) translateY(${deslocamento})`,
          transition: `transform ${duracao}ms cubic-bezier(0.5, 0, 0.2, 1)`,
        }}
      >
        {/* SVG da cortina — desenho cartoon de dobras */}
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
            {/* Gradiente base do vermelho vinho */}
            <linearGradient id="cortina-base" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#2a0505" />
              <stop offset="30%" stopColor="#4a0808" />
              <stop offset="70%" stopColor="#5a0f0f" />
              <stop offset="100%" stopColor="#3a0505" />
            </linearGradient>

            {/* Gradiente das dobras (sombra suave) */}
            <linearGradient id="dobra-sombra" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(0,0,0,0)" />
              <stop offset="50%" stopColor="rgba(0,0,0,0.45)" />
              <stop offset="100%" stopColor="rgba(0,0,0,0)" />
            </linearGradient>

            {/* Gradiente do brilho das dobras (destaque) */}
            <linearGradient id="dobra-brilho" x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="rgba(255,180,150,0)" />
              <stop offset="50%" stopColor="rgba(255,180,150,0.15)" />
              <stop offset="100%" stopColor="rgba(255,180,150,0)" />
            </linearGradient>

            {/* Gradiente dourado da barra */}
            <linearGradient id="ouro" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f4d484" />
              <stop offset="35%" stopColor="#d4a017" />
              <stop offset="70%" stopColor="#b8860b" />
              <stop offset="100%" stopColor="#6b510a" />
            </linearGradient>

            <radialGradient id="borla-grad" cx="0.5" cy="0.3" r="0.7">
              <stop offset="0%" stopColor="#f4d484" />
              <stop offset="60%" stopColor="#d4a017" />
              <stop offset="100%" stopColor="#8b6510" />
            </radialGradient>
          </defs>

          {/* Base vermelha */}
          <rect x="0" y="0" width="100" height="200" fill="url(#cortina-base)" />

          {/* Dobras grandes cartoon — sombras alternadas com brilhos */}
          {Array.from({ length: NUM_DOBRAS }).map((_, i) => {
            const larguraDobra = 100 / NUM_DOBRAS
            const x = i * larguraDobra
            const cx = x + larguraDobra / 2
            return (
              <g key={i}>
                {/* Sombra na "vala" entre dobras */}
                <rect
                  x={x}
                  y={0}
                  width={larguraDobra}
                  height={200}
                  fill="url(#dobra-sombra)"
                  opacity={0.7}
                />
                {/* Brilho no "pico" da dobra */}
                <ellipse
                  cx={cx}
                  cy={100}
                  rx={larguraDobra * 0.35}
                  ry={110}
                  fill="url(#dobra-brilho)"
                />
              </g>
            )
          })}

          {/* Vinheta escura nas bordas laterais (dá profundidade) */}
          <rect
            x={0}
            y={0}
            width={100}
            height={200}
            fill="url(#cortina-base)"
            opacity="0"
          />
          <linearGradient id="vinheta-esq" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0.6)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0)" />
          </linearGradient>
          <linearGradient id="vinheta-dir" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.6)" />
          </linearGradient>
          <rect x="0" y="0" width="6" height="200" fill="url(#vinheta-esq)" />
          <rect x="94" y="0" width="6" height="200" fill="url(#vinheta-dir)" />
        </svg>

        {/* Barra dourada horizontal na base */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 12,
            background: `
              linear-gradient(180deg,
                #f4d484 0%,
                #d4a017 40%,
                #a37a08 80%,
                #6b510a 100%
              )
            `,
            boxShadow: '0 3px 12px rgba(0, 0, 0, 0.7), inset 0 1px 0 rgba(255,255,255,0.4)',
          }}
        />

        {/* Cordão dourado com borla no centro */}
        <div
          style={{
            position: 'absolute',
            left: '50%',
            bottom: -6,
            transform: 'translateX(-50%)',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            gap: 0,
          }}
        >
          {/* Corda torçal (2 linhas) */}
          <div
            style={{
              width: 3,
              height: 22,
              background: `
                repeating-linear-gradient(45deg,
                  #d4a017 0 2px,
                  #a37a08 2px 4px
                )
              `,
              boxShadow: '0 0 4px rgba(0,0,0,0.5)',
            }}
          />
          {/* Nó */}
          <div
            style={{
              width: 12,
              height: 10,
              borderRadius: '50%',
              background: 'radial-gradient(circle at 40% 30%, #f4d484, #a37a08)',
              boxShadow: '0 2px 4px rgba(0,0,0,0.5)',
            }}
          />
          {/* Borla (fios pendentes) */}
          <div
            style={{
              display: 'flex',
              gap: 1,
            }}
          >
            {Array.from({ length: 5 }).map((_, i) => (
              <div
                key={i}
                style={{
                  width: 2,
                  height: 12 + (i === 2 ? 3 : i === 0 || i === 4 ? -2 : 0),
                  background: 'linear-gradient(180deg, #d4a017 0%, #6b510a 100%)',
                  borderRadius: '0 0 2px 2px',
                }}
              />
            ))}
          </div>
        </div>
      </div>
    </>
  )
}

/**
 * Componente pra usar na página de ORIGEM (AberturaScreen).
 * Chama onProntoParaNavegar quando a cortina cobriu totalmente a tela.
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
    const t1 = setTimeout(() => setDescendo(true), 20)
    const t2 = setTimeout(() => {
      try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
      onProntoParaNavegar()
    }, DUR_DESCE + 40)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
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
 * Se detectar a flag no sessionStorage, aparece coberta e sobe.
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
    const t1 = setTimeout(() => setSubindo(true), 20)
    const t2 = setTimeout(() => setAtiva(false), DUR_SUBE + 60)
    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
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
