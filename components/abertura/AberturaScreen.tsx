'use client'

// AberturaScreen — sequência cinematográfica da capa do álbum. Book-flip real
// (perspective + rotateY) com a cena do estádio já viva por trás, revelada
// conforme a capa gira. Áudio sintetizado (somKit) dispara no toque de
// "Abrir o Álbum" — único gesto que libera som no navegador (CLAUDE.md
// Seção 4, "Sobre a música tema").
//
// Fases: capa (fechada) → abrindo (flip 0→-180°) → refletores (acendem em
// sequência, torcida entra) → revelado (elenco aparece, capa já totalmente
// aberta).

import { useCallback, useRef, useState } from 'react'
import { motion } from 'framer-motion'
import { CapaAlbum } from './CapaAlbum'
import { CenaEstadio } from './CenaEstadio'
import { somKit } from './somKit'
import type { Beat } from './tipos'

export function AberturaScreen() {
  const [beat, setBeat] = useState<Beat>('capa')
  const [acesos, setAcesos] = useState(0)
  const iniciado = useRef(false)

  const handleAbrir = useCallback(() => {
    if (iniciado.current) return
    iniciado.current = true
    somKit.playTheme()
    setBeat('abrindo')

    setTimeout(() => {
      setBeat('refletores')
      somKit.startCrowd(2.4, 0.22)
      ;[0, 0.55, 1.1].forEach((atraso, i) => {
        setTimeout(() => {
          somKit.playSpotlightClack(0)
          setAcesos(i + 1)
        }, atraso * 1000)
      })
      setTimeout(() => setBeat('revelado'), 1700)
    }, 1100)
  }, [])

  const capaAberta = beat !== 'capa'

  return (
    <div
      className="relative flex h-full w-full items-center justify-center overflow-hidden bg-campo-noturno"
      style={{ width: '100dvw', height: '100dvh' }}
    >
      {/* Estádio por trás de tudo */}
      <CenaEstadio acesos={acesos} jogadoresVisiveis={beat === 'revelado'} />

      {/* Livro: metade esquerda é a lombada fixa, direita gira ao abrir */}
      <div
        className="absolute inset-0 flex items-center justify-center p-4"
        style={{ perspective: '1200px', pointerEvents: beat === 'capa' ? 'auto' : 'none' }}
      >
        <div
          className="relative"
          style={{ width: 'min(92vw, 420px)', height: 'min(85vh, 720px)', transformStyle: 'preserve-3d' }}
        >
          {/* Lombada fixa (borda esquerda) */}
          <div
            className="absolute inset-y-0 left-0 bg-lombada-200 transition-opacity duration-300"
            style={{
              width: 22,
              borderRight: '2px solid var(--couro-600)',
              backgroundImage:
                'repeating-linear-gradient(0deg, var(--dourado-300) 0 6px, transparent 6px 14px)',
              backgroundSize: '2px 100%',
              backgroundRepeat: 'no-repeat',
              backgroundPosition: '10px 0',
              boxShadow: '2px 0 6px rgba(0,0,0,0.5)',
              zIndex: 3,
              opacity: beat === 'capa' || beat === 'abrindo' ? 1 : 0,
            }}
          />

          {/* Painel da capa — dobradiça na lombada */}
          <motion.div
            className="absolute inset-y-0"
            style={{ left: 22, right: 0, transformOrigin: 'left center', transformStyle: 'preserve-3d' }}
            animate={{ rotateY: capaAberta ? -180 : 0 }}
            transition={{ duration: 1.1, ease: [0.5, 0.05, 0.25, 1.05] }}
          >
            {/* Frente */}
            <div
              className="absolute inset-0 bg-couro-200"
              style={{
                backfaceVisibility: 'hidden',
                backgroundImage:
                  'radial-gradient(circle at 22% 16%, color-mix(in srgb, var(--papel-100) 16%, transparent) 0 1px, transparent 1px), ' +
                  'radial-gradient(circle at 76% 72%, color-mix(in srgb, var(--couro-600) 24%, transparent) 0 1px, transparent 1px), ' +
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.08) 0px, rgba(0,0,0,0.08) 1px, transparent 1px, transparent 4px), ' +
                  'repeating-linear-gradient(90deg, color-mix(in srgb, var(--papel-100) 2.5%, transparent) 0px, color-mix(in srgb, var(--papel-100) 2.5%, transparent) 1px, transparent 1px, transparent 7px)',
                backgroundSize: '19px 19px, 23px 23px, auto, auto',
                boxShadow:
                  '8px 8px 0 var(--couro-600), 0 24px 50px rgba(0,0,0,0.7), inset 0 0 85px color-mix(in srgb, var(--couro-500) 42%, transparent)',
              }}
            >
              <CapaAlbum onAbrir={handleAbrir} />
            </div>
            {/* Verso — visível na metade do flip */}
            <div
              className="absolute inset-0 bg-lombada-300"
              style={{
                backfaceVisibility: 'hidden',
                transform: 'rotateY(180deg)',
                backgroundImage:
                  'repeating-linear-gradient(0deg, rgba(0,0,0,0.2) 0px, rgba(0,0,0,0.2) 1px, transparent 1px, transparent 5px)',
                boxShadow: 'inset 0 0 60px rgba(0,0,0,0.8)',
              }}
            >
              <div
                className="absolute inset-8 flex items-center justify-center border border-dashed font-mono opacity-50"
                style={{
                  borderColor: 'var(--dourado-700)',
                  color: 'var(--dourado-700)',
                  fontSize: '0.7rem',
                  letterSpacing: '0.3em',
                }}
              >
                — 2026 —
              </div>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  )
}
