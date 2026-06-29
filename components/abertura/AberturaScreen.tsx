'use client'

// AberturaScreen — sequência cinematográfica de 4 beats (CLAUDE.md §5).
// Orquestra o beat state; renderiza HTML overlay; delega 3D a AberturaCena
// importada dinamicamente (SSR=false, Three.js é client-only).

import { useState } from 'react'
import dynamic from 'next/dynamic'
import type { JogadorAbertura } from './tipos'

const AberturaCena = dynamic(() => import('./AberturaCena'), { ssr: false })

export type { JogadorAbertura }

export type Beat = 'capa' | 'virada' | 'refletores' | 'gramado'

export function AberturaScreen({
  players,
  onLogin,
}: {
  players: JogadorAbertura[]
  onLogin: (nome: string) => void
}) {
  const [beat, setBeat] = useState<Beat>('capa')

  return (
    <div className="relative overflow-hidden bg-[#06180f]" style={{ width: '100dvw', height: '100dvh' }}>
      {/* Canvas 3D — ocupa toda a tela */}
      <div className="absolute inset-0">
        <AberturaCena
          beat={beat}
          onViradaComplete={() => setBeat('refletores')}
          onRefletoresComplete={() => setBeat('gramado')}
          players={players}
          onLogin={onLogin}
        />
      </div>

      {/* ── Beat 1: botão "ABRIR O ÁLBUM" ── */}
      {beat === 'capa' && (
        <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-end pb-20">
          <button
            type="button"
            onClick={() => setBeat('virada')}
            className="pointer-events-auto rounded-lg border-2 border-[#d4af37] bg-[#d4af37]/10 px-10 py-3.5 font-sans text-lg font-bold uppercase tracking-[0.2em] text-[#d4af37] backdrop-blur-sm transition-all hover:bg-[#d4af37]/20 active:scale-95"
          >
            Abrir o Álbum
          </button>
          <p className="mt-3 font-mono text-[10px] uppercase tracking-widest text-[#d4af37]/40">
            Toque para começar
          </p>
        </div>
      )}

      {/* ── Beat 4: instrução de login ── */}
      {beat === 'gramado' && (
        <div className="pointer-events-none absolute left-0 right-0 top-8 flex justify-center">
          <p className="rounded-full bg-black/40 px-4 py-1.5 font-mono text-[10px] uppercase tracking-widest text-[#d4af37]/70 backdrop-blur-sm">
            Toque no seu nome para entrar
          </p>
        </div>
      )}

      {/* ── Loading indicator para refletores ── */}
      {beat === 'refletores' && (
        <div className="pointer-events-none absolute left-0 right-0 top-1/2 flex -translate-y-1/2 justify-center">
          <p className="animate-pulse font-mono text-xs uppercase tracking-[0.3em] text-[#d4af37]/30">
            ···
          </p>
        </div>
      )}
    </div>
  )
}
