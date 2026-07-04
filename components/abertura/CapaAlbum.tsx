'use client'

import { motion } from 'framer-motion'
import { StickerCapa, FigurinhaDieCut } from './FigurinhaCapa'

// CapaAlbum — face frontal da capa de couro: moldura dourada, título
// "PALPITÃO BRASILEIRÃO", selo de edição, botão "ABRIR O ÁLBUM" e figurinhas
// soltas decorativas (die-cut) espalhadas como um caderno de colecionador.
//
// Composição das figurinhas — simétrica em espelho esquerda/direita:
//   topo:  2 grandes nos cantos (Ronaldinho/Neymar) + 2 pequenas mais para
//          dentro (Vasco/Flamengo), enquadrando o título sem tocá-lo.
//   base:  2 médias nos cantos (Pelezinho/Fred) + 1 centralizada (Troféu),
//          formando um trio acima do botão.
export function CapaAlbum({ onAbrir }: { onAbrir: () => void }) {
  return (
    <div className="absolute inset-0 overflow-hidden">
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

      {/* Bloco de título — centralizado, sempre cabe */}
      <div
        className="absolute left-0 right-0 flex flex-col items-center px-4 text-center"
        style={{ top: '41%', transform: 'translateY(-50%)', zIndex: 6 }}
      >
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
        <div
          className="mt-3 font-mono text-dourado-300/85"
          style={{ fontSize: '0.65rem', letterSpacing: '0.3em' }}
        >
          — EDIÇÃO 2026 —
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

      {/* Figurinhas — topo: par grande nos cantos + par pequeno mais interno */}
      <StickerCapa top="4%" left="5%" rotate={-10} zIndex={4}>
        <FigurinhaDieCut src="/stickers/clean-ronaldinho.png" altura={94} />
      </StickerCapa>
      <StickerCapa top="4%" right="5%" rotate={10} zIndex={4}>
        <FigurinhaDieCut src="/stickers/clean-neymar.png" altura={94} />
      </StickerCapa>
      <StickerCapa top="15%" left="28%" rotate={-6} zIndex={3}>
        <FigurinhaDieCut src="/stickers/clean-vasco.png" altura={64} />
      </StickerCapa>
      <StickerCapa top="15%" right="28%" rotate={6} zIndex={3}>
        <FigurinhaDieCut src="/stickers/clean-flamengo.png" altura={64} />
      </StickerCapa>

      {/* Figurinhas — base: par nos cantos + selo centralizado, trio acima do botão */}
      <StickerCapa bottom="24%" left="6%" rotate={9} zIndex={4}>
        <FigurinhaDieCut src="/stickers/clean-pelezinho.png" altura={86} />
      </StickerCapa>
      <StickerCapa bottom="24%" right="6%" rotate={-9} zIndex={4}>
        <FigurinhaDieCut src="/stickers/clean-fred.png" altura={86} />
      </StickerCapa>
      <StickerCapa bottom="24%" left="50%" rotate={-3} zIndex={5} centralizado>
        <FigurinhaDieCut src="/stickers/clean-trofeu.png" altura={76} />
      </StickerCapa>
    </div>
  )
}
