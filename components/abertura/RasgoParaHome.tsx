'use client'

// RasgoParaHome — Overlay que anima o efeito de "rasgo de papel" cobrindo
// a tela inteira, revelando a Home por trás.
//
// Como funciona:
//   1. Ao ativar, aparece a página inteira (cor de couro/papel) cobrindo tudo
//   2. Uma linha diagonal irregular (SVG path) rasga a página em duas metades
//   3. Metade superior-direita: rotaciona pra cima-direita e sai da tela
//   4. Metade inferior-esquerda: rotaciona pra baixo-esquerda e sai da tela
//   5. Entre as duas metades, um flash dourado (luz "por trás do papel")
//   6. Ao final, chama onCompleto() → AberturaScreen navega pra /inicio
//
// A linha de rasgo é gerada dinamicamente (path com ~30 pontos aleatórios)
// pra cada montagem — dá aparência orgânica, cada login parece único.
//
// Duração total: ~1400ms
//   - 0-100ms: página cobre tudo (fade-in)
//   - 100-500ms: rasgo começa, flash dourado surge no meio
//   - 500-1300ms: duas metades se separam e saem da tela
//   - 1300-1400ms: dissipa flash, dispara onCompleto

import { motion } from 'framer-motion'
import { useMemo, useEffect } from 'react'

interface Props {
  onCompleto: () => void
}

// Gera uma linha irregular de rasgo (diagonal do canto superior-direito
// ao canto inferior-esquerdo) com ruído orgânico.
function gerarPathRasgo(seed: number): { pontos: Array<{ x: number; y: number }>; pathTop: string; pathBottom: string } {
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  // 40 pontos ao longo da diagonal (0,0) canto sup-esq → (100, 100) canto inf-dir
  // Vamos rasgar de (100, 20) canto sup-dir aproximado → (0, 80) canto inf-esq aproximado
  const pontos: Array<{ x: number; y: number }> = []
  const numPontos = 40

  for (let i = 0; i <= numPontos; i++) {
    const t = i / numPontos
    // Linha base: diagonal de (100, 15) → (0, 85)
    const xBase = 100 - t * 100
    const yBase = 15 + t * 70
    // Ruído perpendicular (varia ±6% pra dar aparência rasgada)
    const ruido = (rand() - 0.5) * 12
    // Aplica ruído perpendicular à direção do rasgo
    const x = Math.max(-5, Math.min(105, xBase + ruido * 0.7))
    const y = Math.max(-5, Math.min(105, yBase + ruido * 0.7))
    pontos.push({ x, y })
  }

  // Path da metade SUPERIOR (acima do rasgo):
  //   começa em (0,0) → topo → (100, 0) → desce pela linha de rasgo → volta pro (0,0)
  const pathTop = [
    'M -5 -5',
    'L 105 -5',
    `L ${pontos[0].x} ${pontos[0].y}`,
    ...pontos.slice(1).map((p) => `L ${p.x} ${p.y}`),
    'L -5 -5',
    'Z',
  ].join(' ')

  // Path da metade INFERIOR (abaixo do rasgo):
  //   começa no primeiro ponto do rasgo → segue rasgo → canto inf-dir → volta
  const pathBottom = [
    `M ${pontos[0].x} ${pontos[0].y}`,
    ...pontos.slice(1).map((p) => `L ${p.x} ${p.y}`),
    'L -5 105',
    'L 105 105',
    'L 105 -5',
    `L ${pontos[0].x} ${pontos[0].y}`,
    'Z',
  ].join(' ')

  return { pontos, pathTop, pathBottom }
}

export function RasgoParaHome({ onCompleto }: Props) {
  // Seed baseado em timestamp → cada rasgo é único
  const { pathTop, pathBottom } = useMemo(() => gerarPathRasgo(Date.now() % 10000), [])

  useEffect(() => {
    const t = setTimeout(() => {
      onCompleto()
    }, 1300)
    return () => clearTimeout(t)
  }, [onCompleto])

  // Textura de papel envelhecido (mesma da CapaVerso antiga, pra continuidade)
  const paperBg = `
    radial-gradient(ellipse at 30% 25%, #F7E6BA 0%, #EBD9A4 45%, #D4C088 100%),
    #E8D4A0
  `
  const paperNoise = `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.13 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`

  return (
    <div className="pointer-events-none fixed inset-0 z-[100]">
      {/* Flash dourado por trás — aparece durante o rasgo (luz "atravessando" o papel) */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, #FFF4C4 0%, #FFD870 30%, #E8A020 70%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.85, 0.6, 0] }}
        transition={{
          duration: 1.3,
          times: [0, 0.25, 0.45, 0.75, 1],
          ease: 'easeOut',
        }}
      />

      {/* SVG cobrindo a viewport, contendo as duas metades da página */}
      <svg
        className="absolute inset-0 h-full w-full"
        viewBox="0 0 100 100"
        preserveAspectRatio="none"
      >
        <defs>
          {/* Padrão da textura de papel */}
          <pattern id="papelTextura" x="0" y="0" width="20" height="20" patternUnits="userSpaceOnUse">
            <rect width="20" height="20" fill="#EBD9A4" />
          </pattern>

          {/* Sombra pra dar profundidade nas bordas rasgadas */}
          <filter id="sombraRasgo" x="-20%" y="-20%" width="140%" height="140%">
            <feDropShadow dx="0" dy="0.5" stdDeviation="0.8" floodColor="#3a2515" floodOpacity="0.6" />
          </filter>

          {/* Gradiente pra escurecer levemente a borda rasgada (efeito profundidade) */}
          <linearGradient id="bordaEscura" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#3a2515" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#3a2515" stopOpacity="0" />
          </linearGradient>
        </defs>

        {/* Metade SUPERIOR: rotaciona pra cima-direita e sai */}
        <motion.g
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, 0, 15, 45],
            y: [0, 0, -8, -35],
            rotate: [0, 0, 4, 14],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 1.3,
            times: [0, 0.15, 0.5, 1],
            ease: [0.32, 0.72, 0, 1],
          }}
          style={{ transformOrigin: '50% 50%' }}
        >
          <path d={pathTop} fill="#EBD9A4" filter="url(#sombraRasgo)" />
          {/* Textura em cima */}
          <path d={pathTop} fill="url(#papelTextura)" opacity="0.9" />
          {/* Vinheta radial pra dar profundidade */}
          <path d={pathTop} fill="url(#bordaEscura)" opacity="0.5" />
        </motion.g>

        {/* Metade INFERIOR: rotaciona pra baixo-esquerda e sai */}
        <motion.g
          initial={{ x: 0, y: 0, rotate: 0, opacity: 1 }}
          animate={{
            x: [0, 0, -15, -45],
            y: [0, 0, 8, 35],
            rotate: [0, 0, -4, -14],
            opacity: [1, 1, 1, 0],
          }}
          transition={{
            duration: 1.3,
            times: [0, 0.15, 0.5, 1],
            ease: [0.32, 0.72, 0, 1],
          }}
          style={{ transformOrigin: '50% 50%' }}
        >
          <path d={pathBottom} fill="#EBD9A4" filter="url(#sombraRasgo)" />
          <path d={pathBottom} fill="url(#papelTextura)" opacity="0.9" />
          <path d={pathBottom} fill="url(#bordaEscura)" opacity="0.5" />
        </motion.g>
      </svg>

      {/* Overlay HTML por cima do SVG pra textura HD do papel (SVG pattern é limitado) */}
      <div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          background: paperBg,
          maskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='${pathTop.replace(/"/g, "'")}' fill='black'/%3E%3Cpath d='${pathBottom.replace(/"/g, "'")}' fill='black'/%3E%3C/svg%3E")`,
          WebkitMaskImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' viewBox='0 0 100 100' preserveAspectRatio='none'%3E%3Cpath d='${pathTop.replace(/"/g, "'")}' fill='black'/%3E%3Cpath d='${pathBottom.replace(/"/g, "'")}' fill='black'/%3E%3C/svg%3E")`,
          maskSize: '100% 100%',
          WebkitMaskSize: '100% 100%',
          opacity: 0,
        }}
      />

      {/* Ruído de papel (textura fina) — some junto com as metades */}
      <motion.div
        className="absolute inset-0 mix-blend-multiply"
        style={{
          backgroundImage: paperNoise,
          backgroundSize: '400px 400px',
          opacity: 0.4,
        }}
        initial={{ opacity: 0.4 }}
        animate={{ opacity: [0.4, 0.4, 0.2, 0] }}
        transition={{
          duration: 1.3,
          times: [0, 0.15, 0.5, 1],
        }}
      />

      {/* Partículas de papel se soltando durante o rasgo */}
      {Array.from({ length: 15 }).map((_, i) => {
        const angulo = Math.random() * Math.PI * 2
        const distancia = 30 + Math.random() * 60
        return (
          <motion.div
            key={i}
            className="absolute"
            style={{
              left: `${45 + Math.random() * 10}%`,
              top: `${45 + Math.random() * 10}%`,
              width: 4 + Math.random() * 6,
              height: 4 + Math.random() * 6,
              background: '#D4C088',
              borderRadius: '20%',
              transform: `rotate(${Math.random() * 360}deg)`,
            }}
            initial={{ opacity: 0, x: 0, y: 0 }}
            animate={{
              opacity: [0, 1, 0.6, 0],
              x: [0, 0, Math.cos(angulo) * distancia, Math.cos(angulo) * distancia * 2],
              y: [0, 0, Math.sin(angulo) * distancia, Math.sin(angulo) * distancia * 2 + 50],
              rotate: [0, 0, 180, 720],
            }}
            transition={{
              duration: 1.3,
              times: [0, 0.3, 0.6, 1],
              delay: 0.3 + Math.random() * 0.15,
              ease: 'easeOut',
            }}
          />
        )
      })}
    </div>
  )
}
