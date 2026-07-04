'use client'

import { motion } from 'framer-motion'
import { RefletoresRig } from './RefletoresRig'
import { ChipJogador } from './ChipJogador'
import { TITULARES, BANCO } from './elencoMock'

// CenaEstadio — campo visto de cima com refletores acendendo em sequência e
// o elenco surgindo (Beats "refletores" → "revelado"). Fica visível por trás
// da capa durante toda a animação, como pano de fundo.
export function CenaEstadio({ acesos, jogadoresVisiveis }: { acesos: number; jogadoresVisiveis: boolean }) {
  const escuridao = Math.max(0, 0.78 - acesos * 0.22)

  return (
    <div className="absolute inset-0 overflow-hidden bg-parede-200">
      {/* Torcida/entorno do estádio */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 50% 50%, var(--parede-200) 0%, var(--campo-noturno) 80%)',
        }}
      />

      {/* Retângulo do campo — deixa espaço pro banco na direita */}
      <div className="absolute" style={{ top: '6%', bottom: '6%', left: '6%', right: '26%' }}>
        <RefletoresRig acesos={acesos} />

        <div
          className="relative h-full w-full border-2 border-papel-borda-100"
          style={{
            backgroundImage:
              'repeating-linear-gradient(0deg, var(--campo-200) 0 8%, var(--campo-300) 8% 16%)',
            boxShadow: '0 0 0 3px var(--couro-600), inset 0 0 80px rgba(0,0,0,0.55)',
          }}
        >
          {/* Linhas de campo desenhadas à mão (leve imperfeição) */}
          <svg
            viewBox="0 0 100 160"
            preserveAspectRatio="none"
            className="absolute inset-0 h-full w-full"
            style={{ pointerEvents: 'none' }}
          >
            <g
              fill="none"
              stroke="var(--papel-borda-100)"
              strokeWidth="0.45"
              strokeLinecap="round"
              strokeLinejoin="round"
              opacity="0.85"
            >
              <path d="M 3 80 Q 30 79.5 50 80.2 T 97 80" />
              <path d="M 50 70 Q 62 70.5 62.2 80 Q 62 89.5 50 90 Q 38 89.8 37.8 80 Q 38 70.5 50 70 Z" />
              <circle cx="50" cy="80" r="0.8" fill="var(--papel-borda-100)" />
              <path d="M 28 3 L 28.2 22 Q 50 22.5 72 22 L 72 3" />
              <path d="M 40 3 L 40 10 Q 50 10.3 60 10 L 60 3" />
              <path d="M 28 157.8 L 28.3 138 Q 50 137.5 72 138 L 72 157.8" />
              <path d="M 40 157.8 L 40 151 Q 50 150.7 60 151 L 60 157.8" />
            </g>
          </svg>

          {/* Titulares — posicionados em % do campo */}
          {[...TITULARES]
            .sort((a, b) => a.y - b.y)
            .map((jogador, idx) => (
              <motion.div
                key={jogador.nome}
                initial={{ opacity: 0, scale: 0.3, y: 12 }}
                animate={{
                  opacity: jogadoresVisiveis ? 1 : 0,
                  scale: jogadoresVisiveis ? 1 : 0.3,
                  y: jogadoresVisiveis ? 0 : 12,
                }}
                transition={{
                  duration: 0.4,
                  delay: jogadoresVisiveis ? idx * 0.09 : 0,
                  type: 'spring',
                  stiffness: 200,
                  damping: 15,
                }}
                className="absolute"
                style={{ left: `${jogador.x}%`, top: `${jogador.y}%`, transform: 'translate(-50%, -50%)' }}
              >
                <ChipJogador jogador={jogador} destaque={jogador.voce} />
              </motion.div>
            ))}
        </div>
      </div>

      {/* Banco — coluna lateral direita, fora do campo */}
      <motion.div
        initial={{ opacity: 0, x: 12 }}
        animate={{ opacity: jogadoresVisiveis ? 1 : 0, x: jogadoresVisiveis ? 0 : 12 }}
        transition={{ duration: 0.5, delay: jogadoresVisiveis ? 1.0 : 0 }}
        className="absolute flex flex-col items-center gap-3 rounded-md border-2 border-dourado-300 bg-couro-600/90 px-2 py-3"
        style={{ top: '18%', bottom: '18%', right: '3%', width: '18%', maxWidth: 92, zIndex: 5 }}
      >
        <div className="font-mono text-[0.6rem] font-bold uppercase tracking-[0.18em] text-dourado-300">
          Banco
        </div>
        {BANCO.map((jogador) => (
          <ChipJogador key={jogador.nome} jogador={jogador} pequeno />
        ))}
      </motion.div>

      {/* Escurecimento — recua conforme os refletores acendem */}
      <motion.div
        className="pointer-events-none absolute inset-0 bg-black"
        animate={{ opacity: escuridao }}
        transition={{ duration: 0.5 }}
      />
    </div>
  )
}
