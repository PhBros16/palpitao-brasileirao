'use client'

import { motion } from 'framer-motion'

// Três refletores fixos no topo do campo — feixe cônico + luminária (poste +
// carcaça + lâmpada). "acesos" controla quantos já ligaram (stagger, ver
// AberturaScreen).
const FIXTURES = [
  { xPct: 18, angle: 20 },
  { xPct: 50, angle: 0 },
  { xPct: 82, angle: -20 },
] as const

export function RefletoresRig({ acesos }: { acesos: number }) {
  return (
    <>
      {FIXTURES.map((f, i) => {
        const aceso = i < acesos
        return (
          <div
            key={i}
            className="absolute"
            style={{
              left: `${f.xPct}%`,
              top: 0,
              transform: 'translate(-50%, -100%)',
              zIndex: 4,
              pointerEvents: 'none',
            }}
          >
            {/* Feixe de luz projetado sobre o campo */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: aceso ? 0.55 : 0 }}
              transition={{ duration: 0.35 }}
              style={{
                position: 'absolute',
                left: '50%',
                top: '100%',
                width: 220,
                height: '60vh',
                transform: `translateX(-50%) rotate(${f.angle}deg)`,
                transformOrigin: 'top center',
                background:
                  'linear-gradient(180deg, color-mix(in srgb, var(--dourado-200) 88%, transparent) 0%, color-mix(in srgb, var(--dourado-400) 23%, transparent) 40%, transparent 90%)',
                clipPath: 'polygon(42% 0, 58% 0, 100% 100%, 0 100%)',
                filter: 'blur(3px)',
                mixBlendMode: 'screen',
              }}
            />
            {/* Luminária: poste + carcaça + lâmpada */}
            <div style={{ position: 'relative', width: 42, transform: 'translateY(-2px)' }}>
              <div
                className="absolute left-1/2 -translate-x-1/2 border border-black bg-couro-600"
                style={{ top: 22, width: 4, height: 24 }}
              />
              <div
                className="relative border-2 border-black bg-couro-600"
                style={{ width: 42, height: 20, borderRadius: '3px 3px 8px 8px' }}
              >
                <div
                  className="absolute left-1/2 -translate-x-1/2 rounded-full border-2 border-black transition-colors duration-200"
                  style={{
                    bottom: -4,
                    width: 18,
                    height: 18,
                    backgroundColor: aceso ? 'var(--dourado-300)' : 'var(--dourado-700)',
                    boxShadow: aceso
                      ? '0 0 22px var(--dourado-300), 0 0 40px color-mix(in srgb, var(--dourado-200) 80%, transparent)'
                      : 'none',
                  }}
                />
              </div>
            </div>
          </div>
        )
      })}
    </>
  )
}
