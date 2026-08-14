'use client'

// CampoFlipOverlay — cobre a tela com o "campo" (mesmo estilo da abertura)
// enquanto a Home monta por baixo. Depois gira 180° revelando a Home real.
//
// Enquanto ativo, dispara eventos globais pra outros componentes (LuzesAmbiente,
// HomeReal com stagger) suspenderem suas animações e não brigarem pela tela.
//
// Fase 1: cobre a tela opacamente (dá tempo pra Home montar por baixo)
// Fase 2: gira 180° em 1200ms (mesma curva/duração da capa do álbum)
// Fase 3: some — Home fica visível, componentes retomam suas animações

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_flip_transicao'
const ATRASO_MONTAGEM = 120  // ms — Home terminar de montar antes do flip
const DUR_FLIP = 1200         // ms — mesma da capa do álbum
const MARGEM_FIM = 80         // ms — pequena folga antes de desmontar

export function CampoFlipOverlay() {
  const [ativo, setAtivo] = useState(false)
  const [virando, setVirando] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(CHAVE) !== '1') return
    sessionStorage.removeItem(CHAVE)

    // Sinaliza pra outros componentes suspenderem suas animações
    window.dispatchEvent(new CustomEvent('palpitao:transicao-iniciada'))

    setAtivo(true)

    // Fase 2: começa a girar depois da Home montar
    const t1 = setTimeout(() => setVirando(true), ATRASO_MONTAGEM)

    // Fase 3: fim da virada — desmonta overlay e sinaliza pra Home retomar
    const t2 = setTimeout(() => {
      setAtivo(false)
      window.dispatchEvent(new CustomEvent('palpitao:transicao-terminada'))
    }, ATRASO_MONTAGEM + DUR_FLIP + MARGEM_FIM)

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
          willChange: 'transform',
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
