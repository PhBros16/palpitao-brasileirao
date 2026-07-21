'use client'

// CardFifa v6 — ajustes: foto maior/melhor posicionada, labels limpas, card menor.

import type { AdminProfile } from '@/lib/rodadaAdmin'

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

export function CardFifa({ adm, width = 230 }: { adm: AdminProfile; width?: number }) {
  const height = width * (460 / 320)
  const uid = `pc-${adm.id}`
  const rating = adm.rating ?? '—'
  const posicao = adm.posicao ?? 'ADM'

  return (
    <div className="mx-auto flex flex-col items-center" style={{ maxWidth: width + 20 }}>
      <div className="relative" style={{ width, height }}>
        <svg
          viewBox="0 0 320 460"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7e7a8" />
              <stop offset="18%" stopColor="#d9b45a" />
              <stop offset="40%" stopColor="#b58433" />
              <stop offset="55%" stopColor="#f2d97a" />
              <stop offset="72%" stopColor="#b58433" />
              <stop offset="90%" stopColor="#e8c874" />
              <stop offset="100%" stopColor="#a97a2b" />
            </linearGradient>

            <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6ecd0" />
              <stop offset="55%" stopColor="#efe1b8" />
              <stop offset="100%" stopColor="#e6d29a" />
            </linearGradient>

            <linearGradient id={`${uid}-gold-h`} x1="0" y1="0" x2="1" y2="0">
              <stop offset="0%" stopColor="#8a6a22" stopOpacity="0" />
              <stop offset="20%" stopColor="#b58433" />
              <stop offset="50%" stopColor="#f7e7a8" />
              <stop offset="80%" stopColor="#b58433" />
              <stop offset="100%" stopColor="#8a6a22" stopOpacity="0" />
            </linearGradient>

            <radialGradient id={`${uid}-gold-r`} cx="50%" cy="45%" r="60%">
              <stop offset="0%" stopColor="#fff2b8" />
              <stop offset="45%" stopColor="#dcb057" />
              <stop offset="100%" stopColor="#7a5716" />
            </radialGradient>

            <linearGradient id={`${uid}-nameplate`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9b45a" />
              <stop offset="50%" stopColor="#f2d97a" />
              <stop offset="100%" stopColor="#b58433" />
            </linearGradient>

            <linearGradient id={`${uid}-navy-flow`} x1="0" y1="0.02" x2="0" y2="0.98">
              <stop offset="0%" stopColor="#0f1e4a" stopOpacity="1" />
              <stop offset="45%" stopColor="#1f3a8a" stopOpacity="0.75" />
              <stop offset="70%" stopColor="#1f3a8a" stopOpacity="0.35" />
              <stop offset="90%" stopColor="#274bbd" stopOpacity="0.1" />
              <stop offset="100%" stopColor="#274bbd" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-blue-flow`} x1="0" y1="0.02" x2="0" y2="0.98">
              <stop offset="0%" stopColor="#274bbd" stopOpacity="0.95" />
              <stop offset="40%" stopColor="#5a7fe0" stopOpacity="0.65" />
              <stop offset="70%" stopColor="#5a7fe0" stopOpacity="0.28" />
              <stop offset="100%" stopColor="#5a7fe0" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-lightblue-flow`} x1="0" y1="0.02" x2="0" y2="0.98">
              <stop offset="0%" stopColor="#c5d3ee" stopOpacity="0.85" />
              <stop offset="45%" stopColor="#8ea6d5" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#8ea6d5" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#8ea6d5" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-white-flow`} x1="0" y1="0.02" x2="0" y2="0.98">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="35%" stopColor="#ffffff" stopOpacity="0.7" />
              <stop offset="65%" stopColor="#e8f0ff" stopOpacity="0.4" />
              <stop offset="90%" stopColor="#c5d3ee" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#c5d3ee" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-white-bright`} x1="0" y1="0.02" x2="0" y2="0.98">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="45%" stopColor="#ffffff" stopOpacity="0.8" />
              <stop offset="75%" stopColor="#ffffff" stopOpacity="0.4" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Drop-shadow só pros números (mais leve) */}
            <filter id={`${uid}-num-shadow`} x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow dx="1" dy="1.2" stdDeviation="0.6" floodColor="#000" floodOpacity="0.4" />
            </filter>

            <symbol id={`${uid}-flourish`} viewBox="-40 -10 80 20" overflow="visible">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.1" strokeLinecap="round">
                <path d="M-38 0 C -24 0, -22 -6, -14 -6 C -6 -6, -6 6, 2 6 C 10 6, 14 0, 20 0" />
                <path d="M-14 -6 c -2 -3, -6 -3, -8 0" />
                <path d="M2 6 c 2 3, 6 3, 8 0" />
              </g>
              <circle r="1.8" fill="#f2d97a" stroke="#8a6a22" strokeWidth="0.6" />
            </symbol>

            <clipPath id={`${uid}-clip`}>
              <path d="M20 4 H300 Q316 4 316 20 V430 Q316 448 300 452 Q240 458 160 458 Q80 458 20 452 Q4 448 4 430 V20 Q4 4 20 4 Z" />
            </clipPath>
          </defs>

          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="0" y="0" width="320" height="460" fill={`url(#${uid}-cream)`} />

            <polygon points="60,10 260,10 300,450 20,450" fill={`url(#${uid}-navy-flow)`} />
            <polygon points="90,10 240,10 280,450 40,450" fill={`url(#${uid}-blue-flow)`} />
            <polygon points="130,10 220,10 250,450 70,450" fill={`url(#${uid}-lightblue-flow)`} />
            <polygon points="30,10 70,10 40,450 5,450" fill={`url(#${uid}-navy-flow)`} opacity="0.75" />
            <polygon points="260,10 300,10 315,450 280,450" fill={`url(#${uid}-navy-flow)`} opacity="0.7" />
            <polygon points="140,10 175,10 100,450 65,450" fill={`url(#${uid}-white-flow)`} />
            <polygon points="200,10 235,10 245,450 205,450" fill={`url(#${uid}-white-flow)`} opacity="0.7" />
            <polygon points="185,10 195,10 155,450 145,450" fill={`url(#${uid}-white-bright)`} />

            {/* Divisor ornamental */}
            <line x1="40" y1="255" x2="280" y2="255" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" opacity="0.6" />
            <use href={`#${uid}-flourish`} x="90" y="273" />
            <use href={`#${uid}-flourish`} x="230" y="273" transform="rotate(180 230 273)" />
            <g transform="translate(160 273)">
              <circle r="10" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.8" />
              <circle r="6.5" fill="none" stroke="#f7e7a8" strokeWidth="0.6" />
              <polygon points="0,-4 3.5,0 0,4 -3.5,0" fill="#5a4415" />
            </g>

            {/* Placa do nome */}
            <rect
              x="45" y="285" width="230" height="26" rx="4"
              fill={`url(#${uid}-nameplate)`}
              stroke="#5a4415" strokeWidth="0.8"
            />
            <rect
              x="48" y="288" width="224" height="20" rx="2"
              fill="none" stroke="#f7e7a8" strokeWidth="0.5" opacity="0.7"
            />

            {/* Placa dos stats */}
            <rect
              x="26" y="322" width="268" height="86" rx="6"
              fill="#f8ecc4" fillOpacity="0.95"
              stroke="#c9ad5f" strokeWidth="0.8"
            />
            <rect
              x="30" y="326" width="260" height="78" rx="4"
              fill="none" stroke="#e2cd88" strokeWidth="0.5"
            />

            <line x1="34" y1="320" x2="286" y2="320" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.4" />
            <polygon points="30,320 34,316 38,320 34,324" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,320 286,316 290,320 286,324" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            <g fontFamily="'Inter', system-ui, sans-serif">
              <line x1="160" y1="330" x2="160" y2="400" stroke="#8a6a22" strokeWidth="1.4" />
              <line x1="156" y1="336" x2="156" y2="394" stroke="#d8c48a" strokeWidth="0.5" />
              <line x1="164" y1="336" x2="164" y2="394" stroke="#d8c48a" strokeWidth="0.5" />
              <polygon points="160,362 165,368 160,374 155,368" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />

              <line x1="40" y1="355" x2="150" y2="355" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="40" y1="380" x2="150" y2="380" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="355" x2="280" y2="355" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="380" x2="280" y2="380" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />

              {/* Números — com sombra suave */}
              {STATS_LEFT.map((s, i) => {
                const y = 345 + i * 25
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text
                      x="58" y={y}
                      fontSize="18"
                      fontWeight="800"
                      textAnchor="middle"
                      fill="#1a1408"
                    >
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {/* Labels — SEM sombra, peso normal */}
              {STATS_LEFT.map((s, i) => {
                const y = 345 + i * 25
                return (
                  <text
                    key={`${s.key}-label`}
                    x="115" y={y}
                    fontSize="13"
                    fontWeight="500"
                    letterSpacing="1.5"
                    textAnchor="middle"
                    fill="#6b5220"
                    fontFamily="'Inter', system-ui, sans-serif"
                  >
                    {s.label}
                  </text>
                )
              })}

              {STATS_RIGHT.map((s, i) => {
                const y = 345 + i * 25
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text
                      x="215" y={y}
                      fontSize="18"
                      fontWeight="800"
                      textAnchor="middle"
                      fill="#1a1408"
                    >
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {STATS_RIGHT.map((s, i) => {
                const y = 345 + i * 25
                return (
                  <text
                    key={`${s.key}-label`}
                    x="262" y={y}
                    fontSize="13"
                    fontWeight="500"
                    letterSpacing="1.5"
                    textAnchor="middle"
                    fill="#6b5220"
                    fontFamily="'Inter', system-ui, sans-serif"
                  >
                    {s.label}
                  </text>
                )
              })}
            </g>

            <line x1="34" y1="412" x2="286" y2="412" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.2" />
            <polygon points="30,412 34,408 38,412 34,416" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,412 286,408 290,412 286,416" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            <g transform="translate(160 434)">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" strokeLinecap="round">
                <path d="M-52 0 C -40 -8, -28 -10, -18 -6" />
                <path d="M-46 4 C -34 6, -24 4, -18 -2" />
                <path d="M52 0 C 40 -8, 28 -10, 18 -6" />
                <path d="M46 4 C 34 6, 24 4, 18 -2" />
              </g>
              <circle r="10" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.9" />
              <circle r="6.5" fill="none" stroke="#f7e7a8" strokeWidth="0.6" />
              <circle r="2.4" fill="#5a4415" />
            </g>

            <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.8" strokeLinecap="round">
              <path d="M20 255 C 32 255, 36 263, 40 271" />
              <path d="M300 255 C 288 255, 284 263, 280 271" />
              <path d="M20 423 C 32 423, 40 428, 44 434" />
              <path d="M300 423 C 288 423, 280 428, 276 434" />
            </g>

            <g transform="translate(160 16)" fill="#b58433">
              <polygon points="0,-4 3,0 0,4 -3,0" />
            </g>
          </g>

          <g fill="none" stroke={`url(#${uid}-gold)`} strokeLinejoin="round">
            <path
              d="M20 4 H300 Q316 4 316 20 V430 Q316 448 300 452 Q240 458 160 458 Q80 458 20 452 Q4 448 4 430 V20 Q4 4 20 4 Z"
              strokeWidth="6"
            />
            <path
              d="M24 12 H296 Q308 12 308 24 V428 Q308 442 296 445 Q235 450 160 450 Q85 450 24 445 Q12 442 12 428 V24 Q12 12 24 12 Z"
              strokeWidth="1.2"
            />
            <path d="M12 40 L28 24" strokeWidth="1.2" />
            <path d="M308 40 L292 24" strokeWidth="1.2" />
            <path d="M12 420 L28 436" strokeWidth="1.2" />
            <path d="M308 420 L292 436" strokeWidth="1.2" />
          </g>
        </svg>

        {/* Overlay HTML */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rating */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: '6%', top: '4%' }}
          >
            <span
              className="font-display leading-none"
              style={{
                fontSize: width * 0.18,
                fontWeight: 800,
                color: '#1a1408',
                letterSpacing: '-2px',
                textShadow: `
                  1px 1px 0 rgba(255,255,255,0.85),
                  2px 3px 4px rgba(0,0,0,0.45)
                `,
              }}
            >
              {rating}
            </span>
            <span
              className="font-mono uppercase"
              style={{
                fontSize: width * 0.042,
                fontWeight: 700,
                color: '#1a1408',
                letterSpacing: '2.5px',
                marginTop: '4px',
                textShadow: '0 1px 0 rgba(255,255,255,0.9)',
                background: 'rgba(255,240,180,0.5)',
                padding: '1px 6px',
                borderRadius: '2px',
                border: '1px solid rgba(184,132,51,0.3)',
              }}
            >
              {posicao}
            </span>

            <div
              style={{
                marginTop: width * 0.03,
                width: width * 0.13,
                height: width * 0.091,
                boxShadow: '0 2px 4px rgba(0,0,0,0.4)',
                borderRadius: '1px',
                overflow: 'hidden',
                border: '1px solid rgba(0,0,0,0.25)',
              }}
            >
              <svg viewBox="0 0 720 504" width="100%" height="100%">
                <rect width="720" height="504" fill="#009c3b" />
                <polygon points="360,60 660,252 360,444 60,252" fill="#ffdf00" />
                <circle cx="360" cy="252" r="105" fill="#002776" />
                <path
                  d="M 260 240 Q 360 210 460 250"
                  fill="none"
                  stroke="#fff"
                  strokeWidth="18"
                />
              </svg>
            </div>
          </div>

          {/* Foto — MAIOR, ocupa quase toda a metade direita */}
          {adm.foto && (
            <div
              className="absolute overflow-hidden"
              style={{
                right: '2%',
                top: '2%',
                width: '62%',
                height: '58%',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adm.foto}
                alt={adm.nome}
                style={{
                  width: '100%',
                  height: '100%',
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}

          {/* Nome */}
          <div
            className="absolute inset-x-0 text-center"
            style={{ top: '62%', padding: '0 12%' }}
          >
            <p
              className="font-display uppercase truncate"
              style={{
                fontSize: adm.nome.length > 12 ? width * 0.055 : width * 0.068,
                fontWeight: 700,
                color: '#1a1408',
                letterSpacing: '1px',
                lineHeight: '1',
                textShadow: '0 1px 0 rgba(255,240,180,0.8), 0 -0.5px 0 rgba(90,68,21,0.3)',
              }}
            >
              {adm.nome}
            </p>
          </div>
        </div>
      </div>

      {adm.vulgo && (
        <div
          className="mt-2 rounded-full border border-couro-500 bg-gradient-to-r from-couro-100 via-dourado-100 to-couro-100 px-4 py-1 shadow-sm"
          style={{ maxWidth: width * 0.85 }}
        >
          <p
            className="text-center italic truncate"
            style={{
              fontSize: width * 0.048,
              fontWeight: 500,
              color: '#5a4415',
              letterSpacing: '0.3px',
            }}
          >
            "{adm.vulgo}"
          </p>
        </div>
      )}

      {adm.descricao && (
        <div
          className="mt-3 relative rounded-lg border-2 border-dourado-300 px-4 py-3 shadow-md"
          style={{
            maxWidth: width + 20,
            background: 'linear-gradient(135deg, #FCF3D8 0%, #F5E4B0 100%)',
          }}
        >
          <span
            className="absolute font-display text-dourado-400"
            style={{
              fontSize: width * 0.16,
              fontWeight: 700,
              lineHeight: '1',
              top: '-6px',
              left: '6px',
              opacity: 0.55,
            }}
          >
            &ldquo;
          </span>
          <span
            className="absolute font-display text-dourado-400"
            style={{
              fontSize: width * 0.16,
              fontWeight: 700,
              lineHeight: '1',
              bottom: '-24px',
              right: '6px',
              opacity: 0.55,
            }}
          >
            &rdquo;
          </span>
          <p
            className="text-center italic leading-snug px-4"
            style={{
              fontSize: width * 0.052,
              fontWeight: 400,
              color: '#3a2c12',
            }}
          >
            {adm.descricao}
          </p>
        </div>
      )}
    </div>
  )
}
