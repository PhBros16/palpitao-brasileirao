'use client'

// CortinaTransicao — cortina estilo desenho/ilustração vetorial.
// Cores chapadas, bordas grossas pretas, dobras cartoon simples.
// Limitada à largura do app (max-w-md).

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir'
const DUR_DESCE = 900
const DUR_SUBE = 1400

const NUM_DOBRAS = 5

function CortinaTeatro({ deslocamento, duracao }: { deslocamento: string; duracao: number }) {
  const larguraDobra = 100 / NUM_DOBRAS

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
        {/* SVG cartoon da cortina */}
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
          {/* Base vermelho chapado */}
          <rect x="0" y="0" width="100" height="200" fill="#5c0a0a" />

          {/* Dobras — alternam vermelho médio (pico) e vermelho escuro (vala) */}
          {Array.from({ length: NUM_DOBRAS }).map((_, i) => {
            const x = i * larguraDobra
            const isPico = i % 2 === 0
            return (
              <rect
                key={i}
                x={x}
                y={0}
                width={larguraDobra}
                height={200}
                fill={isPico ? '#7a1010' : '#3a0505'}
              />
            )
          })}

          {/* Linhas pretas separando as dobras (contorno cartoon) */}
          {Array.from({ length: NUM_DOBRAS + 1 }).map((_, i) => (
            <line
              key={i}
              x1={i * larguraDobra}
              y1={0}
              x2={i * larguraDobra}
              y2={200}
              stroke="#1a0000"
              strokeWidth={0.8}
            />
          ))}

          {/* Barra dourada base — chapada com contorno preto */}
          <rect x="0" y="192" width="100" height="8" fill="#d4a017" />
          <rect x="0" y="192" width="100" height="1" fill="#f4d484" />
          <rect x="0" y="199" width="100" height="1" fill="#8b6510" />
          <line x1="0" y1="192" x2="100" y2="192" stroke="#1a0000" strokeWidth={1} />

          {/* Contorno preto lateral esquerdo */}
          <line x1="0.4" y1="0" x2="0.4" y2="200" stroke="#1a0000" strokeWidth={0.8} />
          {/* Contorno preto lateral direito */}
          <line x1="99.6" y1="0" x2="99.6" y2="200" stroke="#1a0000" strokeWidth={0.8} />
        </svg>
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
