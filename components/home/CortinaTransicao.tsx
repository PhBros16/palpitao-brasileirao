'use client'

// CortinaTransicao — fade cross-dissolve simples entre abertura e Home.
// Nome mantido pra compatibilidade de imports.
//
// Fluxo:
//   ORIGEM (AberturaScreen): dispara FadeSaindo
//   → tela escurece em 350ms
//   → onProntoParaNavegar → router.push + flag no sessionStorage
//   DESTINO (LogadoLayout): FadeEntrando detecta flag
//   → aparece coberto de escuro → clareia em 500ms

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir' // mantém nome pra compatibilidade
const DUR_SAI = 350
const DUR_ENTRA = 500

/**
 * Componente pra usar na página de ORIGEM (AberturaScreen).
 * Escurece a tela e chama onProntoParaNavegar quando totalmente escura.
 */
export function CortinaDescendo({
  ativa,
  onProntoParaNavegar,
}: {
  ativa: boolean
  onProntoParaNavegar: () => void
}) {
  const [escuro, setEscuro] = useState(false)

  useEffect(() => {
    if (!ativa) return
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setEscuro(true))
    })
    const t = setTimeout(() => {
      try { sessionStorage.setItem(CHAVE, '1') } catch { /* ignora */ }
      onProntoParaNavegar()
    }, DUR_SAI + 40)
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
      style={{
        zIndex: 9999,
        background: '#0a0503',
        opacity: escuro ? 1 : 0,
        transition: `opacity ${DUR_SAI}ms ease-in-out`,
      }}
      aria-hidden="true"
    />
  )
}

/**
 * Componente pra usar na página de DESTINO (LogadoLayout).
 * Aparece coberto de escuro e clareia revelando a Home.
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
  const [claro, setClaro] = useState(false)

  useEffect(() => {
    if (!ativa) return
    let raf1: number
    let raf2: number
    raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setClaro(true))
    })
    const t = setTimeout(() => setAtiva(false), DUR_ENTRA + 100)
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
      style={{
        zIndex: 9999,
        background: '#0a0503',
        opacity: claro ? 0 : 1,
        transition: `opacity ${DUR_ENTRA}ms ease-in-out`,
      }}
      aria-hidden="true"
    />
  )
}
