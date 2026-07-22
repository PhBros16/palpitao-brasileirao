'use client'

// FundoAnimado — página de álbum vintage realista.
// SVG denso com textura de papel, rasgos, manchas de café, vincos,
// buracos de traça, marcas de dedo. Respiração sutil global.

import { motion } from 'framer-motion'

export function FundoAnimado() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Camada 1 — Base de cor papel envelhecido */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 30% 25%, #F5E4B8 0%, #E8D4A0 45%, #D4C088 100%)
          `,
        }}
      />

      {/* Camada 2 — Textura de fibra de papel (grãos finos) */}
      <div
        className="absolute inset-0 opacity-50 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='paper'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.13 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23paper)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
        }}
      />

      {/* Camada 3 — Manchas amareladas do envelhecimento */}
      <div
        className="absolute inset-0 opacity-70 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1200' height='1200'%3E%3Cfilter id='age'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.015' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.38 0 0 0 0 0.24 0 0 0 0 0.10 0 0 0 0.3 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23age)'/%3E%3C/svg%3E")`,
          backgroundSize: '1200px 1200px',
        }}
      />

      {/* Camada 4 — SVG com detalhes autênticos (manchas, rasgos, buracos, etc.) */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="xMidYMid slice"
        viewBox="0 0 1000 1400"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Mancha de café - textura orgânica */}
          <radialGradient id="coffee-stain" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#5C3818" stopOpacity="0" />
            <stop offset="60%" stopColor="#7A4A24" stopOpacity="0.15" />
            <stop offset="80%" stopColor="#5C3818" stopOpacity="0.35" />
            <stop offset="100%" stopColor="#3E260F" stopOpacity="0.5" />
          </radialGradient>

          <radialGradient id="coffee-ring" cx="50%" cy="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="75%" stopColor="transparent" stopOpacity="0" />
            <stop offset="85%" stopColor="#5C3818" stopOpacity="0.45" />
            <stop offset="95%" stopColor="#4A2E14" stopOpacity="0.3" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          {/* Filtro pra deformar bordas (mancha orgânica) */}
          <filter id="rough-edge" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.02" numOctaves="3" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="15" />
          </filter>

          <filter id="rough-edge-2" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.03" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="20" />
          </filter>

          {/* Sombra suave */}
          <filter id="soft-shadow">
            <feGaussianBlur stdDeviation="1" />
          </filter>
        </defs>

        {/* ─── MANCHAS DE CAFÉ (com anel + preenchimento) ─── */}

        {/* Mancha 1 — canto superior direito, grande com anel */}
        <g transform="translate(820, 180)">
          <ellipse cx="0" cy="0" rx="85" ry="72" fill="url(#coffee-stain)" filter="url(#rough-edge)" />
          <ellipse cx="0" cy="0" rx="90" ry="76" fill="url(#coffee-ring)" filter="url(#rough-edge)" />
          <ellipse cx="-15" cy="-10" rx="12" ry="8" fill="#5C3818" opacity="0.2" filter="url(#rough-edge-2)" />
        </g>

        {/* Mancha 2 — lateral esquerda meio, pingo/gota */}
        <g transform="translate(60, 720)">
          <ellipse cx="0" cy="0" rx="45" ry="60" fill="url(#coffee-stain)" filter="url(#rough-edge-2)" />
          <ellipse cx="0" cy="45" rx="8" ry="14" fill="#5C3818" opacity="0.3" filter="url(#rough-edge-2)" />
        </g>

        {/* Mancha 3 — parte inferior direita, grande com espirradinhos */}
        <g transform="translate(880, 1150)">
          <ellipse cx="0" cy="0" rx="100" ry="80" fill="url(#coffee-stain)" filter="url(#rough-edge)" />
          <ellipse cx="0" cy="0" rx="105" ry="85" fill="url(#coffee-ring)" filter="url(#rough-edge)" />
          <circle cx="-30" cy="-50" r="4" fill="#5C3818" opacity="0.3" />
          <circle cx="35" cy="-45" r="2.5" fill="#5C3818" opacity="0.25" />
          <circle cx="20" cy="55" r="3" fill="#5C3818" opacity="0.3" />
          <ellipse cx="-45" cy="40" rx="6" ry="3" fill="#5C3818" opacity="0.25" transform="rotate(30 -45 40)" />
        </g>

        {/* Mancha 4 — pequena isolada, meio-cima esquerda */}
        <g transform="translate(230, 320)">
          <ellipse cx="0" cy="0" rx="28" ry="22" fill="url(#coffee-stain)" filter="url(#rough-edge-2)" opacity="0.7" />
        </g>

        {/* ─── VINCOS E DOBRAS (linhas curvas do papel) ─── */}

        {/* Vinco vertical grande — do topo até quase o meio */}
        <path
          d="M 320 0 Q 322 200 318 400 Q 316 500 322 600"
          stroke="#8B5A2B"
          strokeWidth="0.8"
          fill="none"
          opacity="0.15"
        />
        <path
          d="M 320 0 Q 322 200 318 400 Q 316 500 322 600"
          stroke="#F5E4B8"
          strokeWidth="0.5"
          fill="none"
          opacity="0.4"
          transform="translate(-1.5, 0)"
        />

        {/* Vinco diagonal — canto inferior esquerdo */}
        <path
          d="M 0 1000 Q 100 1050 200 1120 Q 300 1180 400 1250"
          stroke="#8B5A2B"
          strokeWidth="1"
          fill="none"
          opacity="0.18"
        />
        <path
          d="M 0 1000 Q 100 1050 200 1120 Q 300 1180 400 1250"
          stroke="#F5E4B8"
          strokeWidth="0.5"
          fill="none"
          opacity="0.5"
          transform="translate(0, -2)"
        />

        {/* Vinco horizontal curto — direita */}
        <path
          d="M 700 850 Q 800 855 900 848 Q 950 845 1000 850"
          stroke="#8B5A2B"
          strokeWidth="0.7"
          fill="none"
          opacity="0.12"
        />

        {/* ─── BURACOS DE TRAÇA (furinhos escuros) ─── */}

        <g opacity="0.6">
          <circle cx="450" cy="90" r="1.8" fill="#3E260F" />
          <circle cx="453" cy="92" r="0.8" fill="#1a1408" />

          <circle cx="180" cy="500" r="2.2" fill="#3E260F" />
          <circle cx="183" cy="502" r="1" fill="#1a1408" />

          <circle cx="750" cy="620" r="1.5" fill="#3E260F" />

          <circle cx="920" cy="450" r="2" fill="#3E260F" />
          <circle cx="922" cy="452" r="0.9" fill="#1a1408" />

          <circle cx="350" cy="1000" r="1.7" fill="#3E260F" />

          <circle cx="600" cy="1180" r="2.5" fill="#3E260F" />
          <circle cx="603" cy="1182" r="1.2" fill="#1a1408" />

          <circle cx="90" cy="300" r="1.6" fill="#3E260F" />

          <circle cx="820" cy="900" r="1.9" fill="#3E260F" />
        </g>

        {/* ─── ARRANHÕES E LINHAS DE DESGASTE ─── */}

        <g opacity="0.25">
          {/* Arranhão diagonal grande */}
          <line x1="540" y1="380" x2="620" y2="420" stroke="#5C3818" strokeWidth="0.6" />
          <line x1="540" y1="381" x2="620" y2="421" stroke="#F5E4B8" strokeWidth="0.3" opacity="0.6" />

          {/* Arranhão curto */}
          <line x1="150" y1="850" x2="185" y2="862" stroke="#5C3818" strokeWidth="0.5" />

          {/* Vários arranhõezinhos agrupados */}
          <line x1="720" y1="330" x2="740" y2="336" stroke="#5C3818" strokeWidth="0.4" />
          <line x1="722" y1="340" x2="738" y2="345" stroke="#5C3818" strokeWidth="0.4" />
          <line x1="720" y1="350" x2="736" y2="354" stroke="#5C3818" strokeWidth="0.4" />

          {/* Arranhão longo diagonal outro canto */}
          <line x1="80" y1="150" x2="200" y2="200" stroke="#5C3818" strokeWidth="0.4" />
        </g>

        {/* ─── MARCAS DE DEDO (ovais bem sutis) ─── */}

        <g opacity="0.12">
          <ellipse cx="420" cy="680" rx="18" ry="24" fill="#5C3818" transform="rotate(-15 420 680)" />
          <ellipse cx="770" cy="480" rx="15" ry="20" fill="#5C3818" transform="rotate(25 770 480)" />
        </g>

        {/* ─── RASGO IRREGULAR NA BORDA SUPERIOR (canto direito) ─── */}

        <path
          d="M 850 0 L 858 8 L 852 18 L 862 28 L 855 40 L 868 52 L 858 68 L 872 82 L 862 100 L 878 118 L 870 138 L 890 158 L 880 180 L 900 200 L 1000 200 L 1000 0 Z"
          fill="#D4C088"
          opacity="0.6"
        />
        <path
          d="M 850 0 L 858 8 L 852 18 L 862 28 L 855 40 L 868 52 L 858 68 L 872 82 L 862 100 L 878 118 L 870 138 L 890 158 L 880 180 L 900 200"
          stroke="#8B5A2B"
          strokeWidth="0.8"
          fill="none"
          opacity="0.4"
        />

        {/* Sombra do rasgo — dá profundidade */}
        <path
          d="M 855 4 L 860 12 L 855 22 L 865 32 L 858 44 L 870 56 L 861 72 L 874 86 L 864 104 L 880 122 L 872 142 L 892 162"
          stroke="#3E260F"
          strokeWidth="1.5"
          fill="none"
          opacity="0.2"
          filter="url(#soft-shadow)"
        />

        {/* ─── CANTO INFERIOR ESQUERDO DOBRADO/AMASSADO ─── */}

        <g>
          {/* Triângulo dobrado (mais claro, como se estivesse dobrado pra trás) */}
          <path
            d="M 0 1200 L 0 1400 L 150 1400 Z"
            fill="#EEDEB0"
            opacity="0.7"
          />
          {/* Linha do vinco da dobra */}
          <line
            x1="0"
            y1="1200"
            x2="150"
            y2="1400"
            stroke="#8B5A2B"
            strokeWidth="1"
            opacity="0.4"
          />
          {/* Sombra da dobra */}
          <path
            d="M 0 1200 L 4 1204 L 148 1400 L 150 1400 Z"
            fill="#8B5A2B"
            opacity="0.3"
          />
        </g>

        {/* ─── SOMBRAS SUAVES NAS BORDAS (vinheta do papel) ─── */}

        <rect x="0" y="0" width="1000" height="1400" fill="url(#coffee-ring)" opacity="0" />

        {/* Sombra topo */}
        <linearGradient id="shadow-top" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0.15" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0" />
        </linearGradient>
        <rect x="0" y="0" width="1000" height="80" fill="url(#shadow-top)" />

        {/* Sombra base */}
        <linearGradient id="shadow-bottom" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#5C3818" stopOpacity="0" />
          <stop offset="100%" stopColor="#5C3818" stopOpacity="0.2" />
        </linearGradient>
        <rect x="0" y="1320" width="1000" height="80" fill="url(#shadow-bottom)" />
      </svg>

      {/* Camada 5 — Vinheta radial (bordas escuras) */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 45%, rgba(92,56,24,0.15) 90%, rgba(62,38,15,0.3) 100%)',
        }}
      />

      {/* Camada 6 — Respiração global suave */}
      <motion.div
        className="absolute inset-0"
        animate={{
          opacity: [0.85, 1, 0.85],
        }}
        transition={{
          duration: 15,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
        style={{
          background: 'radial-gradient(ellipse at 50% 40%, rgba(244,220,132,0.08) 0%, transparent 60%)',
          mixBlendMode: 'screen',
        }}
      />
    </div>
  )
}
