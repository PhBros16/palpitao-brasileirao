'use client'

// FundoMesa — Cenário externo da abertura: mesa de madeira envelhecida
// com um cone de luz baixando do topo (spotlight de lâmpada de mesa antiga)
// e poeira suspensa dançando dentro do feixe.
//
// Substitui o antigo bg-campo-noturno (verde) por algo que casa com a
// narrativa "álbum físico apoiado sobre uma mesa antiga sob luz baixa".
//
// Camadas empilhadas (de baixo pra cima):
//   1. Base marrom escura (madeira base)
//   2. SVG com padrão de tábuas horizontais + veios
//   3. Vinheta lateral escura (bordas somem no escuro)
//   4. Cone de luz descendo do topo (spotlight radial)
//   5. Poeira suspensa dentro do cone (partículas subindo/descendo)
//   6. Sombra elíptica projetada onde o álbum se apoia

import { motion } from 'framer-motion'
import { useMemo } from 'react'

// Gera N grãos de poeira com trajetórias e delays aleatórios.
function gerarPoeira(quantidade: number, seed: number) {
  // Pseudo-random determinístico via seed (evita mismatch SSR)
  let s = seed
  const rand = () => {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }

  return Array.from({ length: quantidade }).map((_, i) => ({
    id: i,
    // Posição horizontal restrita ao cone (30-70% da tela)
    xInicio: 30 + rand() * 40,
    xFim: 30 + rand() * 40,
    yInicio: rand() * 100,
    yFim: rand() * 100,
    tamanho: 1 + rand() * 2.5,
    duracao: 8 + rand() * 10,
    delay: rand() * 8,
    opacidade: 0.15 + rand() * 0.35,
  }))
}

export function FundoMesa() {
  const graos = useMemo(() => gerarPoeira(35, 7), [])

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      {/* Camada 1: base madeira escura */}
      <div
        className="absolute inset-0"
        style={{
          background: 'linear-gradient(180deg, #2a1a0d 0%, #3a2515 50%, #1f1206 100%)',
        }}
      />

      {/* Camada 2: tábuas horizontais + veios de madeira */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 400 800"
      >
        <defs>
          {/* Filtro de ruído pra dar textura orgânica de madeira */}
          <filter id="madeira-noise" x="0" y="0" width="100%" height="100%">
            <feTurbulence
              type="fractalNoise"
              baseFrequency="0.02 0.9"
              numOctaves="3"
              seed="4"
            />
            <feColorMatrix
              type="matrix"
              values="0 0 0 0 0.15
                      0 0 0 0 0.09
                      0 0 0 0 0.04
                      0 0 0 0.7 0"
            />
            <feComposite in2="SourceGraphic" operator="in" />
          </filter>

          {/* Padrão de tábuas horizontais (linhas de separação a cada ~80px) */}
          <pattern
            id="tabuas"
            x="0"
            y="0"
            width="400"
            height="90"
            patternUnits="userSpaceOnUse"
          >
            <rect width="400" height="90" fill="transparent" />
            {/* Linha superior escura (junta de tábuas) */}
            <line
              x1="0"
              y1="0"
              x2="400"
              y2="0"
              stroke="#0a0503"
              strokeWidth="1.5"
              opacity="0.85"
            />
            {/* Linha de destaque sutil abaixo */}
            <line
              x1="0"
              y1="1.5"
              x2="400"
              y2="1.5"
              stroke="#4a3020"
              strokeWidth="0.5"
              opacity="0.4"
            />
          </pattern>

          {/* Gradiente radial pra vinheta */}
          <radialGradient id="vinheta" cx="50%" cy="50%" r="70%">
            <stop offset="0%" stopColor="rgba(0,0,0,0)" />
            <stop offset="60%" stopColor="rgba(0,0,0,0.15)" />
            <stop offset="100%" stopColor="rgba(0,0,0,0.75)" />
          </radialGradient>

          {/* Cone de luz descendo do topo (elipse alongada) */}
          <radialGradient id="coneLuz" cx="50%" cy="0%" r="60%">
            <stop offset="0%" stopColor="rgba(255, 235, 180, 0.35)" />
            <stop offset="30%" stopColor="rgba(255, 220, 150, 0.18)" />
            <stop offset="65%" stopColor="rgba(255, 210, 130, 0.06)" />
            <stop offset="100%" stopColor="rgba(255, 210, 130, 0)" />
          </radialGradient>
        </defs>

        {/* Tábuas (padrão repetido) */}
        <rect width="400" height="800" fill="url(#tabuas)" />

        {/* Veios de madeira (ruído fractal) */}
        <rect width="400" height="800" filter="url(#madeira-noise)" opacity="0.55" />

        {/* Manchas escuras irregulares (nós de madeira) */}
        <ellipse cx="80" cy="180" rx="18" ry="8" fill="#0a0503" opacity="0.4" />
        <ellipse cx="320" cy="340" rx="14" ry="6" fill="#0a0503" opacity="0.35" />
        <ellipse cx="150" cy="520" rx="20" ry="10" fill="#0a0503" opacity="0.35" />
        <ellipse cx="340" cy="680" rx="16" ry="7" fill="#0a0503" opacity="0.3" />

        {/* Camada 3: vinheta */}
        <rect width="400" height="800" fill="url(#vinheta)" />

        {/* Camada 4: cone de luz descendo do topo */}
        <ellipse cx="200" cy="0" rx="180" ry="600" fill="url(#coneLuz)" />
      </svg>

      {/* Camada 5: poeira suspensa dentro do cone (partículas flutuantes) */}
      <div className="absolute inset-0">
        {graos.map((g) => (
          <motion.div
            key={g.id}
            className="absolute rounded-full"
            style={{
              left: `${g.xInicio}%`,
              top: `${g.yInicio}%`,
              width: g.tamanho,
              height: g.tamanho,
              background: 'rgba(255, 235, 180, 0.9)',
              boxShadow: '0 0 3px rgba(255, 220, 150, 0.6)',
            }}
            animate={{
              left: [`${g.xInicio}%`, `${g.xFim}%`, `${g.xInicio}%`],
              top: [`${g.yInicio}%`, `${g.yFim}%`, `${g.yInicio}%`],
              opacity: [0, g.opacidade, g.opacidade * 0.4, g.opacidade, 0],
            }}
            transition={{
              duration: g.duracao,
              delay: g.delay,
              repeat: Infinity,
              ease: 'linear',
            }}
          />
        ))}
      </div>

      {/* Camada 6: brilho suave do topo (halo da lâmpada) */}
      <div
        className="absolute inset-x-0 top-0 h-40"
        style={{
          background:
            'radial-gradient(ellipse at 50% 0%, rgba(255, 230, 160, 0.25) 0%, transparent 70%)',
        }}
      />

      {/* Vinheta extra reforçada nas laterais (garante que as bordas somem no escuro) */}
      <div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at center, transparent 40%, rgba(0,0,0,0.5) 90%, rgba(0,0,0,0.85) 100%)',
        }}
      />
    </div>
  )
}
