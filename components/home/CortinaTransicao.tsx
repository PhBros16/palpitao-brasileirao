'use client'

// CortinaTransicao — cortina de teatro vermelho vinho com franja dourada.
// Coberta na largura do app (max-w-md), lados pretos no PC.
//
// Fluxo:
//   ORIGEM (AberturaScreen): dispara CortinaDescendo
//   → cortina desce (600ms) → onProntoParaNavegar → router.push
//   → sessionStorage flag 'palpitao_cortina_subir' = '1'
//   DESTINO (LogadoLayout): CortinaSubindo detecta flag
//   → aparece coberta → sobe (1000ms, mais fluida)
//   → durante subida, LuzesAmbiente acende sincronizado

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir'
const DUR_DESCE = 600
const DUR_SUBE = 1000

// Cortina de veludo vermelho com dobras verticais + franja dourada.
// SVG puro pra ficar leve e responsivo.
function CortinaTeatro({ deslocamento }: { deslocamento: string }) {
  return (
    <>
      {/* Fundo escuro cobrindo a tela toda (pra PC) */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.85)',
        }}
      />

      {/* Cortina centrada, limitada à largura do app */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: 0,
          transform: `translateX(-50%) translateY(${deslocamento})`,
          width: '100%',
          maxWidth: '448px',
          height: '100%',
          transition: `transform var(--cortina-dur) cubic-bezier(0.5, 0, 0.2, 1)`,
        }}
      >
        {/* Corpo da cortina — veludo vermelho vinho */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            background: `
              linear-gradient(180deg,
                #4a0e0e 0%,
                #6b1414 25%,
                #7a1818 55%,
                #5a1010 100%
              )
            `,
            boxShadow: `
              inset 0 8px 24px rgba(0, 0, 0, 0.6),
              0 12px 40px rgba(0, 0, 0, 0.6)
            `,
          }}
        >
          {/* Dobras verticais de veludo — vincos alternados claros e escuros */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              background: `
                repeating-linear-gradient(90deg,
                  rgba(0, 0, 0, 0) 0,
                  rgba(0, 0, 0, 0.25) 22px,
                  rgba(0, 0, 0, 0) 44px,
                  rgba(255, 200, 180, 0.06) 60px,
                  rgba(0, 0, 0, 0) 76px
                )
              `,
            }}
          />

          {/* Textura fina de veludo (noise sutil) */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              opacity: 0.3,
              backgroundImage:
                "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%20opacity%3D%220.5%22%2F%3E%3C%2Fsvg%3E')",
              backgroundSize: '120px 120px',
              mixBlendMode: 'overlay',
            }}
          />

          {/* Barra dourada na base */}
          <div
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: 0,
              height: 10,
              background: `
                linear-gradient(180deg,
                  #f4d484 0%,
                  #d4a017 30%,
                  #b8860b 70%,
                  #8b6510 100%
                )
              `,
              boxShadow: '0 2px 12px rgba(0, 0, 0, 0.6)',
            }}
          />

          {/* Franja dourada (pontas triangulares) */}
          <svg
            style={{
              position: 'absolute',
              left: 0,
              right: 0,
              bottom: -14,
              width: '100%',
              height: 14,
              display: 'block',
            }}
            preserveAspectRatio="none"
            viewBox="0 0 100 14"
          >
            <defs>
              <linearGradient id="franja-grad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#d4a017" />
                <stop offset="100%" stopColor="#8b6510" />
              </linearGradient>
            </defs>
            {/* 40 triângulos ao longo da largura */}
            {Array.from({ length: 40 }).map((_, i) => {
              const x = (i / 40) * 100
              const w = 100 / 40
              return (
                <polygon
                  key={i}
                  points={`${x},0 ${x + w},0 ${x + w / 2},14`}
                  fill="url(#franja-grad)"
                />
              )
            })}
          </svg>
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
    // Pequeno delay pra o setDescendo(true) rodar em outro frame
    const t1 = setTimeout(() => setDescendo(true), 20)
    const t2 = setTimeout(() => {
      // Marca pra próxima página saber que precisa subir a cortina
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
      style={{
        zIndex: 9999,
        overflow: 'hidden',
        // custom prop lida pela transition da cortina
        ['--cortina-dur' as string]: `${DUR_DESCE}ms`,
      }}
      aria-hidden="true"
    >
      <CortinaTeatro deslocamento={descendo ? '0%' : '-100%'} />
    </div>
  )
}

/**
 * Componente pra usar na página de DESTINO (LogadoLayout).
 * Se detectar a flag no sessionStorage, aparece coberta e sobe.
 * Duração maior pra ser mais fluida — sincroniza com o acender das luzes.
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
    // Sem delay — assim que monta, começa a subir. Home aparece por trás
    // acompanhando o movimento
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
      style={{
        zIndex: 9999,
        overflow: 'hidden',
        ['--cortina-dur' as string]: `${DUR_SUBE}ms`,
      }}
      aria-hidden="true"
    >
      <CortinaTeatro deslocamento={subindo ? '-100%' : '0%'} />
    </div>
  )
}
