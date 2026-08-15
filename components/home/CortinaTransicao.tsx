'use client'

// CortinaTransicao — cortina de couro que desce cobrindo a tela, permite
// navegação silenciosa por trás, e sobe revelando a Home já pronta.
//
// Fluxo:
//   1. AberturaScreen dispara handlePinSucesso
//   2. Set sessionStorage 'palpitao_cortina_descer' = '1'
//   3. Cortina lê o flag e desce (500ms)
//   4. Ao terminar de descer, dispara router.push (via callback)
//   5. Home monta atrás
//   6. LogadoLayout monta esta cortina já descida, e ela sobe (600ms)
//
// Como coordena entre 2 páginas: usa sessionStorage flag + evento window.
// Renderiza SÓ enquanto necessário (descendo/subindo/coberta).

import { useEffect, useState } from 'react'

const CHAVE = 'palpitao_cortina_subir'
const DUR_DESCE = 500
const DUR_SUBE = 600

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
    // Pequeno delay pra garantir que o setDescendo(true) rode em outro frame
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
      style={{ zIndex: 9999, overflow: 'hidden' }}
      aria-hidden="true"
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: descendo ? 'translateY(0)' : 'translateY(-100%)',
          transition: `transform ${DUR_DESCE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          background: `
            linear-gradient(180deg,
              #6b3f1e 0%,
              #8B5A2B 50%,
              #6b3f1e 100%
            )
          `,
          boxShadow: descendo ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        {/* Textura de couro sutil */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            background:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.05) 2px 3px), ' +
              'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.06) 3px 4px)',
          }}
        />
        {/* Filete dourado no rodapé (a "barra" da cortina) */}
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background: 'linear-gradient(180deg, #d4a017 0%, #b8860b 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
      </div>
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
    // Delay pra Home terminar de montar antes de começar a subir
    const t1 = setTimeout(() => setSubindo(true), 120)
    const t2 = setTimeout(() => setAtiva(false), 120 + DUR_SUBE + 60)
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
      <div
        style={{
          position: 'absolute',
          inset: 0,
          transform: subindo ? 'translateY(-100%)' : 'translateY(0)',
          transition: `transform ${DUR_SUBE}ms cubic-bezier(0.4, 0, 0.2, 1)`,
          background: `
            linear-gradient(180deg,
              #6b3f1e 0%,
              #8B5A2B 50%,
              #6b3f1e 100%
            )
          `,
          boxShadow: subindo ? '0 12px 40px rgba(0,0,0,0.5)' : 'none',
        }}
      >
        <div
          style={{
            position: 'absolute',
            inset: 0,
            opacity: 0.4,
            background:
              'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.05) 2px 3px), ' +
              'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.06) 3px 4px)',
          }}
        />
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 6,
            background: 'linear-gradient(180deg, #d4a017 0%, #b8860b 100%)',
            boxShadow: '0 2px 8px rgba(0,0,0,0.4)',
          }}
        />
      </div>
    </div>
  )
}
