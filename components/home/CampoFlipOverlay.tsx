'use client'

// CampoFlipOverlay — continua a animação de "virar o campo" já na página de
// destino (Home real), fora de qualquer árvore 3D aninhada (mesmo truque já
// comprovado com o botão "abrir álbum" da abertura). O AberturaScreen, ao
// confirmar o PIN, grava um sinal no sessionStorage e navega direto pra
// /inicio — a Home real já monta, funcional, por baixo, imediatamente. Este
// overlay só cobre a tela com a "lasca" do campo virando por cima dela,
// revelando a Home real que já estava lá o tempo todo (não é preview nem
// duplicata — é a Home de verdade, só temporariamente coberta).
import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_flip_transicao'
const DUR_FLIP = 1200

export function CampoFlipOverlay() {
  const [ativo, setAtivo] = useState(false)
  const [virando, setVirando] = useState(false)

  useEffect(() => {
    if (typeof window === 'undefined') return
    if (sessionStorage.getItem(CHAVE) !== '1') return
    sessionStorage.removeItem(CHAVE)
    setAtivo(true)
    const raf = requestAnimationFrame(() => setVirando(true))
    const t = setTimeout(() => setAtivo(false), DUR_FLIP + 60)
    return () => {
      cancelAnimationFrame(raf)
      clearTimeout(t)
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
