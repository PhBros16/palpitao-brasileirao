'use client'

// CardFifa — cartão estilo trading card FIFA em SVG.
// Fundo claro cristalino, shapes geométricos angulados, borda dourada,
// rating gigante à esquerda + foto grande à direita.

import type { AdminProfile } from '@/lib/rodadaAdmin'

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

const STATS_LEFT: Array<{ key: keyof AdminProfile; label: string }> = [
  { key: 'stat_pal', label: 'PAL' },
  { key: 'stat_ges', label: 'GES' },
  { key: 'stat_jus', label: 'JUS' },
]

const STATS_RIGHT: Array<{ key: keyof AdminProfile; label: string }> = [
  { key: 'stat_zoa', label: 'ZOA' },
  { key: 'stat_res', label: 'RES' },
  { key: 'stat_cra', label: 'CRA' },
]

export function CardFifa({ adm }: { adm: AdminProfile }) {
  const uid = `card-${adm.id}`

  return (
    <div className="mx-auto w-full max-w-[280px]">
      {/* SVG do card */}
      <svg
        viewBox="0 0 300 420"
        className="w-full"
        style={{ filter: 'drop-shadow(0 6px 15px rgba(184,134,11,0.35))' }}
      >
        <defs>
          {/* Gradient da borda dourada */}
          <linearGradient id={`${uid}-border`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#E8C158" />
            <stop offset="25%" stopColor="#FCEBA7" />
            <stop offset="50%" stopColor="#B8860B" />
            <stop offset="75%" stopColor="#FCEBA7" />
            <stop offset="100%" stopColor="#D4A038" />
          </linearGradient>

          {/* Gradient do fundo cristalino */}
          <linearGradient id={`${uid}-bg`} x1="0%" y1="0%" x2="0%" y2="100%">
            <stop offset="0%" stopColor="#FFFDF5" />
            <stop offset="50%" stopColor="#FCEFC7" />
            <stop offset="100%" stopColor="#F0DDA0" />
          </linearGradient>

          {/* Gradient de shapes decorativos (azul/dourado tipo cristal) */}
          <linearGradient id={`${uid}-shape1`} x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stopColor="#4A5A80" stopOpacity="0.15" />
            <stop offset="100%" stopColor="#B8860B" stopOpacity="0.05" />
          </linearGradient>
          <linearGradient id={`${uid}-shape2`} x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="#E8C158" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#FCEBA7" stopOpacity="0.05" />
          </linearGradient>

          {/* Path do card (formato pentagonal FIFA) */}
          <clipPath id={`${uid}-clip`}>
            <path d="M 150 4 L 275 20 L 296 45 L 296 400 L 275 416 L 25 416 L 4 400 L 4 45 L 25 20 Z" />
          </clipPath>
        </defs>

        {/* Borda externa dourada */}
        <path
          d="M 150 4 L 275 20 L 296 45 L 296 400 L 275 416 L 25 416 L 4 400 L 4 45 L 25 20 Z"
          fill={`url(#${uid}-border)`}
        />

        {/* Interior do card */}
        <g clipPath={`url(#${uid}-clip)`}>
          {/* Fundo cristalino */}
          <rect
            x="10"
            y="14"
            width="280"
            height="392"
            fill={`url(#${uid}-bg)`}
          />

          {/* Shapes geométricos decorativos (efeito cristal) */}
          <polygon points="10,14 180,14 100,180 10,120" fill={`url(#${uid}-shape1)`} />
          <polygon points="180,14 290,14 290,90 220,140" fill={`url(#${uid}-shape2)`} />
          <polygon points="10,180 90,220 10,280" fill={`url(#${uid}-shape1)`} opacity="0.7" />
          <polygon points="290,150 290,220 240,190" fill={`url(#${uid}-shape2)`} opacity="0.6" />

          {/* Listras de brilho holográfico */}
          <polygon points="10,60 60,14 80,14 10,90" fill="white" opacity="0.4" />
          <polygon points="200,14 250,14 100,180 60,180" fill="white" opacity="0.15" />
        </g>

        {/* Borda interna fininha (linha dourada escura) */}
        <path
          d="M 150 10 L 272 25 L 291 47 L 291 398 L 272 411 L 28 411 L 9 398 L 9 47 L 28 25 Z"
          fill="none"
          stroke="#8B6914"
          strokeWidth="0.5"
          opacity="0.4"
        />
      </svg>

      {/* Conteúdo por cima do SVG (posicionado absoluto) */}
      <div className="relative -mt-[420px] h-[420px]" style={{ pointerEvents: 'none' }}>
        {/* Rating + Posição */}
        <div className="absolute left-6 top-8 flex flex-col items-center">
          <span
            className="font-display font-black leading-none text-tinta-300"
            style={{
              fontSize: '3.75rem',
              letterSpacing: '-3px',
              textShadow: '0 1px 0 rgba(255,255,255,0.8)',
            }}
          >
            {adm.rating ?? '—'}
          </span>
          {adm.posicao && (
            <span
              className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-tinta-300"
              style={{ letterSpacing: '2px' }}
            >
              {adm.posicao}
            </span>
          )}
        </div>

        {/* Foto */}
        <div
          className="absolute right-6 top-8 overflow-hidden bg-papel-200"
          style={{
            width: '105px',
            height: '115px',
          }}
        >
          {adm.foto ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={adm.foto}
              alt={adm.nome}
              className="h-full w-full object-cover"
            />
          ) : (
            <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-couro-700">
              {getIniciais(adm.nome)}
            </div>
          )}
        </div>

        {/* Divisor dourado horizontal */}
        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: '190px',
            width: '180px',
            height: '1.5px',
            background: 'linear-gradient(90deg, transparent, #B8860B, transparent)',
          }}
        />

        {/* Nome + Vulgo */}
        <div
          className="absolute inset-x-4 text-center"
          style={{ top: '205px' }}
        >
          <p
            className="font-display font-black uppercase text-tinta-300 truncate"
            style={{
              fontSize: adm.nome.length > 12 ? '1.1rem' : '1.35rem',
              letterSpacing: '1px',
            }}
          >
            {adm.nome}
          </p>
          {adm.vulgo && (
            <p className="mt-1 font-sans text-xs italic text-tinta-100 truncate">
              "{adm.vulgo}"
            </p>
          )}
        </div>

        {/* Stats — 2 colunas com divisor */}
        <div
          className="absolute inset-x-8 grid grid-cols-2 gap-x-6"
          style={{ top: '285px' }}
        >
          <div className="space-y-2 border-r border-couro-500/40 pr-4">
            {STATS_LEFT.map((s) => (
              <div key={s.key} className="flex items-center justify-between font-mono text-base font-bold text-tinta-300">
                <span style={{ minWidth: '22px' }}>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                <span className="text-tinta-200 text-sm font-semibold tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
          <div className="space-y-2 pl-4">
            {STATS_RIGHT.map((s) => (
              <div key={s.key} className="flex items-center justify-between font-mono text-base font-bold text-tinta-300">
                <span style={{ minWidth: '22px' }}>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                <span className="text-tinta-200 text-sm font-semibold tracking-wider">{s.label}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Descrição embaixo (fora do card) */}
      {adm.descricao && (
        <p className="mt-3 text-center font-sans text-xs italic leading-snug text-tinta-200 px-2">
          "{adm.descricao}"
        </p>
      )}
    </div>
  )
}
