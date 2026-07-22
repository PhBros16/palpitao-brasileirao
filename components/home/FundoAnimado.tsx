'use client'

// FundoAnimado v4 — Página de álbum vintage, mais rica e dispersa.
// Sem vinco central estranho. Manchas menores, canto dobrado 3D mais realista.

import { motion } from 'framer-motion'
import { Poeira } from './Poeira'

export function FundoAnimado() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Camada 1 — Base radial de papel envelhecido */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 25% 20%, #F7E6BA 0%, #EBD9A4 40%, #D9C48A 100%)
          `,
        }}
      />

      {/* Camada 2 — Textura de fibra de papel (grão fino) */}
      <div
        className="absolute inset-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.26 0 0 0 0 0.12 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
        }}
      />

      {/* Camada 3 — Manchas amareladas grandes do envelhecimento */}
      <div
        className="absolute inset-0 opacity-70 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1400' height='1400'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.22 0 0 0 0 0.09 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E")`,
          backgroundSize: '1400px 1400px',
        }}
      />

      {/* Camada 4 — Aura dourada central pulsante */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          opacity: [0.35, 0.55, 0.35],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(255,225,150,0.28) 0%, rgba(218,165,32,0.10) 35%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />

      {/* Camada 5 — SVG com detalhes (dispersos e naturais) */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cs" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#4A2E10" stopOpacity="0" />
            <stop offset="55%" stopColor="#6B3F1C" stopOpacity="0.15" />
            <stop offset="82%" stopColor="#5C3818" stopOpacity="0.32" />
            <stop offset="100%" stopColor="#3E260F" stopOpacity="0.42" />
          </radialGradient>

          <radialGradient id="cr" cx="50%" cy="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="80%" stopColor="transparent" stopOpacity="0" />
            <stop offset="90%" stopColor="#5C3818" stopOpacity="0.4" />
            <stop offset="97%" stopColor="#4A2E14" stopOpacity="0.25" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <filter id="rough" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.5" numOctaves="3" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="2.5" />
          </filter>

          <filter id="rough2" x="-30%" y="-30%" width="160%" height="160%">
            <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>
        </defs>

        {/* MANCHAS DE CAFÉ — várias pequenas/médias, nenhuma gigante */}

        {/* Superior direita — média com anel */}
        <g transform="translate(78, 10)">
          <ellipse cx="0" cy="0" rx="4" ry="3.2" fill="url(#cs)" filter="url(#rough)" />
          <ellipse cx="0" cy="0" rx="4.3" ry="3.5" fill="url(#cr)" filter="url(#rough)" />
        </g>

        {/* Lateral esquerda meio — pingo pequeno */}
        <g transform="translate(6, 45)">
          <ellipse cx="0" cy="0" rx="2" ry="2.6" fill="url(#cs)" filter="url(#rough2)" opacity="0.7" />
        </g>

        {/* Inferior direita — média com respingos */}
        <g transform="translate(85, 82)">
          <ellipse cx="0" cy="0" rx="5" ry="4" fill="url(#cs)" filter="url(#rough)" />
          <ellipse cx="0" cy="0" rx="5.3" ry="4.3" fill="url(#cr)" filter="url(#rough)" />
          <circle cx="-2.5" cy="-3" r="0.25" fill="#5C3818" opacity="0.35" />
          <circle cx="2.8" cy="-2.5" r="0.2" fill="#5C3818" opacity="0.3" />
        </g>

        {/* Pequena meio-superior esquerda */}
        <g transform="translate(22, 18)">
          <ellipse cx="0" cy="0" rx="1.4" ry="1.1" fill="url(#cs)" filter="url(#rough2)" opacity="0.6" />
        </g>

        {/* Meio-inferior esquerda — pequena */}
        <g transform="translate(18, 68)">
          <ellipse cx="0" cy="0" rx="1.8" ry="1.4" fill="url(#cs)" filter="url(#rough2)" opacity="0.55" />
        </g>

        {/* Nova mancha centro-alta */}
        <g transform="translate(52, 25)">
          <ellipse cx="0" cy="0" rx="1.2" ry="0.9" fill="url(#cs)" filter="url(#rough2)" opacity="0.5" />
        </g>

        {/* Mancha centro-baixa */}
        <g transform="translate(45, 58)">
          <ellipse cx="0" cy="0" rx="1.6" ry="1.2" fill="url(#cs)" filter="url(#rough2)" opacity="0.5" />
        </g>

        {/* FIBRAS DO PAPEL — traços curtos aleatórios */}
        <g opacity="0.28" stroke="#8B5A2B" fill="none">
          <line x1="12" y1="8" x2="14" y2="9" strokeWidth="0.06" />
          <line x1="35" y1="15" x2="37.5" y2="14.5" strokeWidth="0.05" />
          <line x1="60" y1="12" x2="61.5" y2="13" strokeWidth="0.06" />
          <line x1="88" y1="20" x2="90" y2="21" strokeWidth="0.05" />
          <line x1="7" y1="30" x2="9" y2="30.5" strokeWidth="0.06" />
          <line x1="25" y1="42" x2="26.5" y2="42.5" strokeWidth="0.05" />
          <line x1="55" y1="38" x2="57" y2="37.5" strokeWidth="0.06" />
          <line x1="78" y1="48" x2="80" y2="48.5" strokeWidth="0.05" />
          <line x1="10" y1="60" x2="12" y2="60.5" strokeWidth="0.06" />
          <line x1="40" y1="72" x2="42" y2="72.5" strokeWidth="0.05" />
          <line x1="65" y1="75" x2="67.5" y2="74.5" strokeWidth="0.06" />
          <line x1="85" y1="55" x2="87" y2="55.5" strokeWidth="0.05" />
          <line x1="30" y1="88" x2="32" y2="88.5" strokeWidth="0.06" />
          <line x1="62" y1="92" x2="64" y2="91.5" strokeWidth="0.05" />
          <line x1="18" y1="24" x2="19.5" y2="24.5" strokeWidth="0.05" />
          <line x1="70" y1="30" x2="72" y2="29.5" strokeWidth="0.05" />
        </g>

        {/* BURACOS DE TRAÇA — mais espalhados */}
        <g opacity="0.7">
          <circle cx="42" cy="7" r="0.22" fill="#3E260F" />
          <circle cx="42.3" cy="7.15" r="0.1" fill="#1a1408" />

          <circle cx="16" cy="35" r="0.28" fill="#3E260F" />
          <circle cx="16.3" cy="35.2" r="0.13" fill="#1a1408" />

          <circle cx="68" cy="44" r="0.2" fill="#3E260F" />

          <circle cx="88" cy="32" r="0.26" fill="#3E260F" />
          <circle cx="88.2" cy="32.15" r="0.12" fill="#1a1408" />

          <circle cx="32" cy="71" r="0.22" fill="#3E260F" />

          <circle cx="56" cy="84" r="0.3" fill="#3E260F" />
          <circle cx="56.3" cy="84.15" r="0.14" fill="#1a1408" />

          <circle cx="8" cy="22" r="0.2" fill="#3E260F" />

          <circle cx="76" cy="64" r="0.24" fill="#3E260F" />

          <circle cx="48" cy="52" r="0.18" fill="#3E260F" />

          <circle cx="12" cy="52" r="0.2" fill="#3E260F" />
          <circle cx="72" cy="82" r="0.24" fill="#3E260F" />
          <circle cx="94" cy="70" r="0.19" fill="#3E260F" />
          <circle cx="3" cy="65" r="0.22" fill="#3E260F" />
        </g>

        {/* ARRANHÕES E LINHAS DE USO */}
        <g opacity="0.32">
          <line x1="50" y1="27" x2="58" y2="30" stroke="#5C3818" strokeWidth="0.09" />
          <line x1="14" y1="61" x2="18.5" y2="62" stroke="#5C3818" strokeWidth="0.07" />

          <line x1="66" y1="23" x2="70" y2="24" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="66.2" y1="24" x2="69.8" y2="24.7" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="66" y1="25" x2="69.5" y2="25.5" stroke="#5C3818" strokeWidth="0.06" />

          <line x1="7" y1="10" x2="19" y2="14" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="80" y1="72" x2="88" y2="74" stroke="#5C3818" strokeWidth="0.07" />
          <line x1="35" y1="55" x2="42" y2="57" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="92" y1="45" x2="98" y2="47" stroke="#5C3818" strokeWidth="0.05" />
          <line x1="2" y1="82" x2="9" y2="83" stroke="#5C3818" strokeWidth="0.06" />
        </g>

        {/* MARCAS DE DEDO (ovais bem sutis) */}
        <g opacity="0.13">
          <ellipse cx="39" cy="49" rx="1.4" ry="1.8" fill="#5C3818" transform="rotate(-15 39 49)" />
          <ellipse cx="72" cy="34" rx="1.2" ry="1.6" fill="#5C3818" transform="rotate(25 72 34)" />
          <ellipse cx="15" cy="80" rx="1" ry="1.4" fill="#5C3818" transform="rotate(-40 15 80)" />
          <ellipse cx="82" cy="60" rx="1.1" ry="1.5" fill="#5C3818" transform="rotate(10 82 60)" />
        </g>

        {/* CANTO INFERIOR ESQUERDO — DOBRADO 3D REALISTA */}
        <g>
          {/* Base do canto — polígono com dobra */}
          <path
            d="M 0 82 L 0 100 L 18 100 L 3 84 Z"
            fill="#3E2810"
            opacity="0.25"
          />
          {/* Verso do canto dobrado (aparece mais claro, como se estivesse virado) */}
          <path
            d="M 0 82 L 3 84 L 18 100 L 15 100 L 0 85 Z"
            fill="#F0DBAA"
            opacity="0.95"
          />
          {/* Vinco principal — linha do dobrão */}
          <line
            x1="0"
            y1="82"
            x2="18"
            y2="100"
            stroke="#7A5024"
            strokeWidth="0.25"
            opacity="0.7"
          />
          {/* Linha clara em cima do vinco (highlight) */}
          <line
            x1="0.4"
            y1="82.4"
            x2="18.4"
            y2="100.4"
            stroke="#F5E4B8"
            strokeWidth="0.15"
            opacity="0.6"
          />
          {/* Sombra profunda logo abaixo do vinco */}
          <path
            d="M 0 82.5 L 0.8 83 L 18.5 100 L 18 100 Z"
            fill="#2D1808"
            opacity="0.35"
          />
          {/* Textura no verso do canto dobrado (fibras) */}
          <g opacity="0.4">
            <line x1="4" y1="88" x2="6" y2="88.5" stroke="#8B5A2B" strokeWidth="0.05" />
            <line x1="6" y1="92" x2="8" y2="92.5" stroke="#8B5A2B" strokeWidth="0.05" />
            <line x1="8" y1="96" x2="10" y2="96.5" stroke="#8B5A2B" strokeWidth="0.05" />
          </g>
        </g>

        {/* Sombras nas bordas — vinheta */}
        <linearGradient id="st" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0.18" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0" />
        </linearGradient>
        <rect x="0" y="0" width="100" height="6" fill="url(#st)" />

        <linearGradient id="sb" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0.25" />
        </linearGradient>
        <rect x="0" y="94" width="100" height="6" fill="url(#sb)" />

        <linearGradient id="sl" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0" />
        </linearGradient>
        <rect x="0" y="0" width="4" height="100" fill="url(#sl)" />

        <linearGradient id="sr" x1="0" y1="0" x2="1" y2="0">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0.18" />
        </linearGradient>
        <rect x="96" y="0" width="4" height="100" fill="url(#sr)" />
      </svg>

      {/* Camada 6 — Feixe de luz diagonal ocasional */}
      <motion.div
        className="absolute -left-[30%] top-1/4 h-[300px] w-[70%]"
        style={{
          transform: 'rotate(-22deg)',
          transformOrigin: 'center',
          background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.28), transparent)',
          filter: 'blur(40px)',
        }}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: '260%', opacity: [0, 1, 0] }}
        transition={{
          duration: 9,
          repeat: Infinity,
          repeatDelay: 18,
          ease: 'easeInOut',
        }}
      />

      {/* Camada 7 — Vinheta radial final */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(92,56,24,0.18) 88%, rgba(62,38,15,0.35) 100%)',
        }}
      />

      {/* Camada 8 — Poeira caindo */}
      <Poeira />
    </div>
  )
}
