'use client'

// CampoFlipOverlay — continua a animação de "virar o campo" na página de
// destino. Ao ler o sinal do sessionStorage, dispara um evento global
// 'palpitao:transicao-iniciada' pra que a Home suspenda suas próprias
// animações até o flip terminar (evita duplicações e flashes).
//
// Fase 1: cobre a tela com o campo (opaco, sem virar) - dá tempo pra Home
//         montar por baixo, sem revelar nada.
// Fase 2: gira -180° em 1200ms revelando a Home já pronta.

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_flip_transicao'
const DUR_FLIP = 1200
const ATRASO_MONTAGEM = 80 // ms — dá tempo pra Home montar antes de girar

export function CampoFlipOverlay() {
  const [ativo, setAtivo] = useState(false)
  const [virando, setVirando] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(CHAVE) !== '1') return
    sessionStorage.removeItem(CHAVE)

    // Sinaliza pra Home suspender suas animações
    window.dispatchEvent(new CustomEvent('palpitao:transicao-iniciada'))

    setAtivo(true)

    // Espera Home montar → começa a girar
    const t1 = setTimeout(() => setVirando(true), ATRASO_MONTAGEM)

    // Fim da virada → esconde overlay e sinaliza pra Home continuar
    const t2 = setTimeout(() => {
      setAtivo(false)
      window.dispatchEvent(new CustomEvent('palpitao:transicao-terminada'))
    }, ATRASO_MONTAGEM + DUR_FLIP + 60)

    return () => {
      clearTimeout(t1)
      clearTimeout(t2)
    }
  }, [])

  if (!ativo) return null

  return (
    <div
      className="pointer-events-none fixed inset-0 z-[300]"
      style={{ perspective: 1700, perspectiveOrigin: '52% 45%' }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transformOrigin: 'left center',
          transformStyle: 'preserve-3d',
          transition: `transform ${DUR_FLIP}ms cubic-bezier(0.62,0,0.38,1)`,
          transform: virando ? 'rotateY(-180deg)' : 'rotateY(0deg)',
          backfaceVisibility: 'hidden',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            backfaceVisibility: 'hidden',
            background:
              'radial-gradient(ellipse at 35% 20%, var(--campo-50) 0%, var(--campo-200) 55%, var(--campo-300) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 42px, rgba(0,0,0,0.06) 42px 84px)',
            boxShadow: 'inset 0 0 60px rgba(0,0,0,0.4)',
          }}
        >
          <div
            className="absolute rounded-full border border-white/25"
            style={{ left: '50%', top: '50%', width: '38%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
          />
          <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
        </div>
      </div>
    </div>
  )
}
