'use client'

// FundoAnimado v3 — Página de álbum vintage.
// Papel envelhecido com textura densa, manchas de café realistas,
// buracos de traça, arranhões, canto dobrado, iluminação viva.
// Sem elementos que se cortem nas bordas (SVG cobre 100% via CSS).
// Poeira dourada vem separada em outro componente (Poeira).

import { motion } from 'framer-motion'
import { Poeira } from './Poeira'

export function FundoAnimado() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* ─── Camada 1 — Base radial de papel envelhecido ─────────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: `
            radial-gradient(ellipse at 25% 20%, #F7E6BA 0%, #EBD9A4 40%, #D9C48A 100%)
          `,
        }}
      />

      {/* ─── Camada 2 — Textura de fibra de papel (grão fino) ────────── */}
      <div
        className="absolute inset-0 opacity-60 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.4 0 0 0 0 0.26 0 0 0 0 0.12 0 0 0 0.5 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
          backgroundSize: '400px 400px',
        }}
      />

      {/* ─── Camada 3 — Manchas amareladas grandes do envelhecimento ── */}
      <div
        className="absolute inset-0 opacity-80 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='1400' height='1400'%3E%3Cfilter id='a'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.012' numOctaves='3' seed='7'/%3E%3CfeColorMatrix values='0 0 0 0 0.36 0 0 0 0 0.22 0 0 0 0 0.09 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23a)'/%3E%3C/svg%3E")`,
          backgroundSize: '1400px 1400px',
        }}
      />

      {/* ─── Camada 4 — Aura dourada central pulsante (iluminação) ──── */}
      <motion.div
        className="absolute left-1/2 top-1/2 h-[1200px] w-[1200px] -translate-x-1/2 -translate-y-1/2 rounded-full"
        animate={{
          opacity: [0.4, 0.65, 0.4],
          scale: [1, 1.06, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(255,225,150,0.30) 0%, rgba(218,165,32,0.12) 35%, transparent 65%)',
          filter: 'blur(50px)',
        }}
      />

      {/* ─── Camada 5 — SVG com detalhes autênticos (viewBox preserva) ─ */}
      <svg
        className="absolute inset-0 h-full w-full"
        preserveAspectRatio="none"
        viewBox="0 0 100 100"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          <radialGradient id="cs" cx="50%" cy="50%">
            <stop offset="0%" stopColor="#4A2E10" stopOpacity="0" />
            <stop offset="55%" stopColor="#6B3F1C" stopOpacity="0.18" />
            <stop offset="80%" stopColor="#5C3818" stopOpacity="0.45" />
            <stop offset="100%" stopColor="#3E260F" stopOpacity="0.55" />
          </radialGradient>

          <radialGradient id="cr" cx="50%" cy="50%">
            <stop offset="0%" stopColor="transparent" stopOpacity="0" />
            <stop offset="78%" stopColor="transparent" stopOpacity="0" />
            <stop offset="88%" stopColor="#5C3818" stopOpacity="0.55" />
            <stop offset="96%" stopColor="#4A2E14" stopOpacity="0.35" />
            <stop offset="100%" stopColor="transparent" stopOpacity="0" />
          </radialGradient>

          <filter id="rough" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.4" numOctaves="3" seed="4" />
            <feDisplacementMap in="SourceGraphic" scale="2" />
          </filter>

          <filter id="rough2" x="-20%" y="-20%" width="140%" height="140%">
            <feTurbulence type="fractalNoise" baseFrequency="0.6" numOctaves="2" seed="11" />
            <feDisplacementMap in="SourceGraphic" scale="1.5" />
          </filter>
        </defs>

        {/* MANCHAS DE CAFÉ (coords em %, 0-100) */}

        {/* Superior direita — grande com anel */}
        <g transform="translate(82, 12)">
          <ellipse cx="0" cy="0" rx="7" ry="5.5" fill="url(#cs)" filter="url(#rough)" />
          <ellipse cx="0" cy="0" rx="7.5" ry="6" fill="url(#cr)" filter="url(#rough)" />
          <ellipse cx="-1.2" cy="-0.8" rx="1" ry="0.6" fill="#5C3818" opacity="0.25" filter="url(#rough2)" />
        </g>

        {/* Lateral esquerda meio — pingo/gota */}
        <g transform="translate(5, 55)">
          <ellipse cx="0" cy="0" rx="3.5" ry="4.5" fill="url(#cs)" filter="url(#rough2)" />
          <ellipse cx="0" cy="3.5" rx="0.6" ry="1.1" fill="#5C3818" opacity="0.35" filter="url(#rough2)" />
        </g>

        {/* Inferior direita — grande com respingos */}
        <g transform="translate(88, 85)">
          <ellipse cx="0" cy="0" rx="8.5" ry="6.5" fill="url(#cs)" filter="url(#rough)" />
          <ellipse cx="0" cy="0" rx="9" ry="7" fill="url(#cr)" filter="url(#rough)" />
          <circle cx="-3" cy="-4" r="0.35" fill="#5C3818" opacity="0.4" />
          <circle cx="3.5" cy="-3.5" r="0.25" fill="#5C3818" opacity="0.35" />
          <circle cx="2" cy="4.5" r="0.3" fill="#5C3818" opacity="0.4" />
          <ellipse cx="-4.5" cy="3" rx="0.6" ry="0.3" fill="#5C3818" opacity="0.3" transform="rotate(30 -4.5 3)" />
        </g>

        {/* Pequena isolada meio-superior */}
        <g transform="translate(28, 22)">
          <ellipse cx="0" cy="0" rx="2.3" ry="1.8" fill="url(#cs)" filter="url(#rough2)" opacity="0.75" />
        </g>

        {/* Nova mancha meio-inferior esquerda */}
        <g transform="translate(20, 72)">
          <ellipse cx="0" cy="0" rx="3.5" ry="2.8" fill="url(#cs)" filter="url(#rough2)" opacity="0.6" />
        </g>

        {/* VINCOS/DOBRAS — sutis, com linha dupla (escura + clara) pra dar profundidade */}

        <g opacity="0.35">
          {/* Vinco vertical central-esquerda */}
          <path d="M 28 0 Q 28.5 30 27.8 50 Q 27.5 65 28.2 80" stroke="#8B5A2B" strokeWidth="0.15" fill="none" />
          <path d="M 27.7 0 Q 28.2 30 27.5 50 Q 27.2 65 27.9 80" stroke="#F5E4B8" strokeWidth="0.1" fill="none" opacity="0.6" />

          {/* Vinco diagonal inferior esquerdo */}
          <path d="M 0 78 Q 12 82 25 88 Q 38 92 50 98" stroke="#8B5A2B" strokeWidth="0.18" fill="none" />
          <path d="M 0 77.5 Q 12 81.5 25 87.5 Q 38 91.5 50 97.5" stroke="#F5E4B8" strokeWidth="0.1" fill="none" opacity="0.6" />

          {/* Vinco horizontal curto direita */}
          <path d="M 65 62 Q 80 62.3 92 61.8" stroke="#8B5A2B" strokeWidth="0.13" fill="none" />

          {/* Novo vinco pequeno inferior */}
          <path d="M 50 90 Q 60 91 72 90.5" stroke="#8B5A2B" strokeWidth="0.12" fill="none" opacity="0.6" />
        </g>

        {/* BURACOS DE TRAÇA */}
        <g opacity="0.75">
          <circle cx="42" cy="7" r="0.22" fill="#3E260F" />
          <circle cx="42.3" cy="7.15" r="0.1" fill="#1a1408" />

          <circle cx="16" cy="35" r="0.28" fill="#3E260F" />
          <circle cx="16.3" cy="35.2" r="0.13" fill="#1a1408" />

          <circle cx="68" cy="44" r="0.2" fill="#3E260F" />

          <circle cx="88" cy="32" r="0.26" fill="#3E260F" />
          <circle cx="88.2" cy="32.15" r="0.12" fill="#1a1408" />

          <circle cx="32" cy="71" r="0.22" fill="#3E260F" />

          <circle cx="56" cy="84" r="0.32" fill="#3E260F" />
          <circle cx="56.3" cy="84.15" r="0.15" fill="#1a1408" />

          <circle cx="8" cy="22" r="0.2" fill="#3E260F" />

          <circle cx="76" cy="64" r="0.24" fill="#3E260F" />

          <circle cx="48" cy="52" r="0.18" fill="#3E260F" />
        </g>

        {/* ARRANHÕES */}
        <g opacity="0.35">
          <line x1="50" y1="27" x2="58" y2="30" stroke="#5C3818" strokeWidth="0.08" />
          <line x1="50" y1="27.1" x2="58" y2="30.1" stroke="#F5E4B8" strokeWidth="0.05" opacity="0.6" />

          <line x1="14" y1="61" x2="18.5" y2="62" stroke="#5C3818" strokeWidth="0.07" />

          <line x1="66" y1="23" x2="70" y2="24" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="66.2" y1="24" x2="69.8" y2="24.7" stroke="#5C3818" strokeWidth="0.06" />
          <line x1="66" y1="25" x2="69.5" y2="25.5" stroke="#5C3818" strokeWidth="0.06" />

          <line x1="7" y1="10" x2="19" y2="14" stroke="#5C3818" strokeWidth="0.06" />
        </g>

        {/* MARCAS DE DEDO (elipses ovais bem sutis) */}
        <g opacity="0.14">
          <ellipse cx="39" cy="49" rx="1.4" ry="1.8" fill="#5C3818" transform="rotate(-15 39 49)" />
          <ellipse cx="72" cy="34" rx="1.2" ry="1.6" fill="#5C3818" transform="rotate(25 72 34)" />
          <ellipse cx="15" cy="80" rx="1" ry="1.4" fill="#5C3818" transform="rotate(-40 15 80)" />
        </g>

        {/* Canto inferior esquerdo AMASSADO (triangulo dobrado) */}
        <g>
          <path d="M 0 87 L 0 100 L 12 100 Z" fill="#F0E0B0" opacity="0.85" />
          <line x1="0" y1="87" x2="12" y2="100" stroke="#8B5A2B" strokeWidth="0.15" opacity="0.5" />
          <path d="M 0 87 L 0.3 87.3 L 11.7 100 L 12 100 Z" fill="#8B5A2B" opacity="0.35" />
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

      {/* ─── Camada 6 — Feixe de luz diagonal ocasional (reflexo) ────── */}
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

      {/* ─── Camada 7 — Vinheta radial final (foco no centro) ────────── */}
      <div
        className="absolute inset-0"
        style={{
          background: 'radial-gradient(ellipse at center, transparent 40%, rgba(92,56,24,0.18) 88%, rgba(62,38,15,0.35) 100%)',
        }}
      />

      {/* ─── Camada 8 — Poeira caindo (componente separado) ──────────── */}
      <Poeira />
    </div>
  )
}
