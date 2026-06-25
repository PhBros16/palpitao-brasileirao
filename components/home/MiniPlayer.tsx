'use client'

// MiniPlayer — player de música em miniatura (VISUAL apenas, sem áudio real).
// Disco que gira quando "tocando", prev/play/next e nome da faixa. O áudio real
// (música tema no toque) é tema da abertura cinematográfica, não desta tela.

import { useState } from 'react'
import type { Faixa } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function MiniPlayer({ faixas }: { faixas: Faixa[] }) {
  const [idx, setIdx] = useState(0)
  const [tocando, setTocando] = useState(false)

  const faixa = faixas[idx] ?? { titulo: '—', artista: '' }
  const prev = () => setIdx((i) => (i - 1 + faixas.length) % faixas.length)
  const next = () => setIdx((i) => (i + 1) % faixas.length)

  return (
    <section className="flex items-center gap-3 rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
      {/* Disco */}
      <span
        className={cx(
          'relative flex h-12 w-12 shrink-0 items-center justify-center rounded-full border-2 border-tinta-300 bg-tinta-300',
          tocando && '[animation:spin_4s_linear_infinite]',
        )}
        aria-hidden
      >
        <span className="h-3 w-3 rounded-full bg-papel-100" />
        <span className="absolute h-px w-full bg-papel-50/20" />
      </span>

      {/* Faixa */}
      <div className="min-w-0 flex-1">
        <p className="truncate font-sans text-sm font-semibold text-tinta-300">{faixa.titulo}</p>
        <p className="truncate font-sans text-xs text-tinta-100">{faixa.artista}</p>
      </div>

      {/* Controles */}
      <div className="flex shrink-0 items-center gap-1">
        <BotaoCtrl label="Anterior" onClick={prev}>⏮</BotaoCtrl>
        <BotaoCtrl label={tocando ? 'Pausar' : 'Tocar'} onClick={() => setTocando((t) => !t)} destaque>
          {tocando ? '⏸' : '▶'}
        </BotaoCtrl>
        <BotaoCtrl label="Próxima" onClick={next}>⏭</BotaoCtrl>
      </div>
    </section>
  )
}

function BotaoCtrl({
  children,
  label,
  onClick,
  destaque,
}: {
  children: React.ReactNode
  label: string
  onClick: () => void
  destaque?: boolean
}) {
  return (
    <button
      type="button"
      aria-label={label}
      onClick={onClick}
      className={cx(
        'flex h-9 w-9 items-center justify-center rounded-full text-sm transition-colors focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300',
        destaque
          ? 'bg-couro-300 text-dourado-50 hover:bg-couro-200'
          : 'bg-papel-200 text-tinta-200 hover:bg-papel-300',
      )}
    >
      {children}
    </button>
  )
}
