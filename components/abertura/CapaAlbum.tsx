'use client'

import { motion } from 'framer-motion'

// CapaAlbum — face frontal da capa de couro: moldura dourada, selo circular
// com bola, título "PALPITÃO BRASILEIRÃO" e botão "ABRIR O ÁLBUM".
//
// Fase 1 (atual): estático, sem stickers ilustrados. Linguagem visual flat,
// consistente com o resto do app (ver SecaoPodio/SalaTrofeus/EscudoTime) —
// formas simples + tokens de couro/dourado, decoração mínima via emoji no
// mesmo espírito das medalhas (🥇🥈🥉) e do placeholder de troféu (🏆) já
// usados em components/home e components/ranking. Nada de ilustração/PNG
// realista.
export function CapaAlbum({ onAbrir }: { onAbrir: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
      {/* Sheen sutil do couro (gradiente, não ilustração) */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'linear-gradient(180deg, color-mix(in srgb, var(--papel-100) 12%, transparent), transparent 28%, color-mix(in srgb, var(--couro-600) 22%, transparent)), ' +
            'radial-gradient(circle at 50% 42%, color-mix(in srgb, var(--papel-100) 7%, transparent), transparent 36%)',
          mixBlendMode: 'soft-light',
          zIndex: 1,
        }}
      />
      {/* Moldura dourada interna */}
      <div
        className="pointer-events-none absolute inset-4 border-2 border-dourado-300"
        style={{
          boxShadow: 'inset 0 0 0 3px var(--couro-200), inset 0 0 0 4px var(--dourado-300)',
        }}
      />

      {/* Conteúdo central */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center px-4 text-center"
        style={{ top: '44%', transform: 'translateY(-50%)', zIndex: 6 }}
      >
        {/* Selo — círculo + emoji, mesmo padrão do placeholder de troféu (SalaTrofeus) */}
        <span className="mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dourado-300 bg-dourado-300/10 text-2xl shadow-inner">
          ⚽
        </span>

        <div
          className="font-display font-black uppercase leading-[0.95] text-dourado-300"
          style={{
            fontSize: 'clamp(2rem, 11vw, 3rem)',
            letterSpacing: '0.01em',
            textShadow: '2px 2px 0 var(--couro-600), 4px 4px 0 rgba(0,0,0,0.4)',
            whiteSpace: 'nowrap',
          }}
        >
          PALPITÃO
        </div>
        <div
          className="mt-1.5 font-display font-bold uppercase text-dourado-300"
          style={{
            fontSize: 'clamp(1rem, 5.2vw, 1.5rem)',
            letterSpacing: '0.14em',
            textShadow: '1px 1px 0 var(--couro-600)',
            whiteSpace: 'nowrap',
          }}
        >
          BRASILEIRÃO
        </div>

        <div className="mt-4 flex items-center gap-3">
          <div className="h-px w-8 bg-dourado-300/40" />
          <span className="font-mono text-[10px] uppercase tracking-[0.3em] text-dourado-300/85">
            Edição 2026
          </span>
          <div className="h-px w-8 bg-dourado-300/40" />
        </div>
      </div>

      {/* Botão */}
      <div className="absolute left-0 right-0 flex justify-center" style={{ bottom: '9%', zIndex: 3 }}>
        <motion.button
          type="button"
          whileHover={{ scale: 1.04 }}
          whileTap={{ scale: 0.96 }}
          onClick={onAbrir}
          className="border-2 border-couro-600 bg-dourado-300 font-display text-sm font-black uppercase text-couro-600"
          style={{
            letterSpacing: '0.2em',
            padding: '12px 24px',
            boxShadow: '3px 3px 0 var(--couro-600)',
          }}
        >
          Abrir o Álbum
        </motion.button>
      </div>
    </div>
  )
}
