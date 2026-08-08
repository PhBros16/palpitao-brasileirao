'use client'

// RasgoParaHome — Overlay que anima uma página de "caderno" sendo arrancada
// pela borda (estilo folha de espiral), revelando a Home por trás.
//
// Redesenho (v2): a versão anterior tinha duas metades saindo do centro,
// usava mix-blend-mode em duas camadas (causa comprovada de bug de repaint
// no Safari iOS — a camada simplesmente não pintava em certos aparelhos) e
// gerava posição de partículas com Math.random() direto no render (não
// memoizado — se o componente re-renderiza durante a animação, as
// partículas "pulam"). Esta versão:
//   - é UMA página só (não duas metades), com borda direita rasgada
//     (clip-path irregular, gerado uma vez com seed) e borda esquerda reta
//     com furos de perfuração (visual "arrancado do caderno")
//   - nenhuma propriedade usa mix-blend-mode; só opacity/transform, testado
//     e confirmado que pinta de forma confiável nesse ambiente
//   - partículas de papel têm posição/ângulo calculados uma vez via
//     useMemo (seed fixo), não recalculados a cada render
//
// Sequência (~1300ms):
//   0-150ms:   página cobre tudo, parada
//   150-320ms: leve tremor (rasgando de fato) + flash dourado atrás
//   320-1150ms: página sai voando pra direita, girando, some
//   1150-1300ms: dissipa resto, dispara onCompleto()

import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'

interface Props {
  onCompleto: () => void
}

// Gerador com seed fixo (mesmo padrão do restante do projeto) — cada login
// tem um rasgo com formato ligeiramente único, mas estável durante toda a
// vida do componente (não recalcula em re-render).
function criarRand(seed: number) {
  let s = seed
  return () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

/** Borda direita rasgada: pontos de cima a baixo, oscilando em x pra dar
 *  aparência de papel arrancado (não uma linha reta). */
function gerarBordaRasgada(rand: () => number) {
  const pontos = 14
  const partes: string[] = ['0% 0%']
  for (let i = 0; i <= pontos; i++) {
    const y = (i / pontos) * 100
    const x = 100 - rand() * 9
    partes.push(`${x.toFixed(1)}% ${y.toFixed(1)}%`)
  }
  partes.push('0% 100%')
  return `polygon(${partes.join(', ')})`
}

/** Furos de perfuração na borda esquerda (visual "arrancado do caderno") —
 *  posições fixas, sem aleatoriedade (não precisa variar). */
const FUROS_Y = [8, 20, 32, 44, 56, 68, 80, 92]

export function RasgoParaHome({ onCompleto }: Props) {
  const seed = useMemo(() => Date.now() % 10000, [])
  const clipPath = useMemo(() => gerarBordaRasgada(criarRand(seed)), [seed])

  // Partículas de papel — calculadas uma vez, nunca recalculadas em re-render.
  const particulas = useMemo(() => {
    const rand = criarRand(seed + 777)
    return Array.from({ length: 8 }).map(() => ({
      left: 55 + rand() * 20,
      top: 20 + rand() * 60,
      tamanho: 4 + rand() * 6,
      anguloFinal: (rand() - 0.5) * 360,
      distancia: 40 + rand() * 70,
      direcaoY: -20 + rand() * 40,
      atraso: 0.2 + rand() * 0.2,
    }))
  }, [seed])

  useEffect(() => {
    const t = setTimeout(() => onCompleto(), 1300)
    return () => clearTimeout(t)
  }, [onCompleto])

  return (
    <div className="pointer-events-none fixed inset-0 z-[100] overflow-hidden">
      {/* Flash dourado — luz "por trás" no instante do rasgo */}
      <motion.div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at 60% 50%, #FFF4C4 0%, #FFD870 30%, #E8A020 70%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.8, 0.4, 0] }}
        transition={{ duration: 1.3, times: [0, 0.12, 0.28, 0.55, 1], ease: 'easeOut' }}
      />

      {/* A página — uma peça só, borda direita rasgada via clip-path */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 35% 20%, var(--campo-50) 0%, var(--campo-200) 55%, var(--campo-300) 100%), repeating-linear-gradient(90deg, rgba(255,255,255,0.05) 0 42px, rgba(0,0,0,0.06) 42px 84px)',
          clipPath,
          WebkitClipPath: clipPath,
          boxShadow: 'inset 0 0 50px rgba(0,0,0,0.45)',
        }}
        initial={{ x: 0, rotate: 0, opacity: 1 }}
        animate={{
          x: [0, -2, 2, 0, 0, '110vw'],
          rotate: [0, -0.6, 0.6, 0, 0, 10],
          opacity: [1, 1, 1, 1, 1, 0],
        }}
        transition={{
          duration: 1.3,
          times: [0, 0.06, 0.1, 0.14, 0.24, 1],
          ease: [0.5, 0, 0.4, 1],
        }}
      >
        {/* furos de perfuração — borda esquerda, visual "arrancado do caderno" */}
        {FUROS_Y.map((y) => (
          <div
            key={y}
            className="absolute rounded-full"
            style={{
              left: 6,
              top: `${y}%`,
              width: 10,
              height: 10,
              background: 'var(--madeira-100, #2a1c10)',
              boxShadow: 'inset 0 1px 2px rgba(0,0,0,0.6)',
            }}
          />
        ))}

        {/* linha central do campo, sugerindo que é a mesma cena que estava atrás */}
        <div
          className="absolute rounded-full border border-white/25"
          style={{ left: '50%', top: '50%', width: '38%', aspectRatio: '1', transform: 'translate(-50%, -50%)' }}
        />
        <div className="absolute inset-x-0 top-1/2 h-px bg-white/25" />
      </motion.div>

      {/* Partículas de papel se soltando perto da borda rasgada */}
      {particulas.map((p, i) => (
        <motion.div
          key={i}
          className="absolute"
          style={{
            left: `${p.left}%`,
            top: `${p.top}%`,
            width: p.tamanho,
            height: p.tamanho,
            background: 'var(--campo-50)',
            borderRadius: '20%',
          }}
          initial={{ opacity: 0, x: 0, y: 0, rotate: 0 }}
          animate={{
            opacity: [0, 1, 0.5, 0],
            x: [0, 0, p.distancia, p.distancia * 1.8],
            y: [0, 0, p.direcaoY, p.direcaoY + 40],
            rotate: [0, 0, p.anguloFinal, p.anguloFinal * 1.5],
          }}
          transition={{
            duration: 1.1,
            times: [0, 0.2, 0.55, 1],
            delay: p.atraso,
            ease: 'easeOut',
          }}
        />
      ))}
    </div>
  )
}
