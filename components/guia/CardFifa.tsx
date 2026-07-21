'use client'

// CardFifa v7 — formato brasão (topo/base pontudos), foto mais baixa,
// bloco nome+stats unificado.

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
  const height = width * (490 / 320)
  const uid = `pc-${adm.id}`
  const rating = adm.rating ?? '—'
  const posicao = adm.posicao ?? 'ADM'

  // Path do card com formato brasão: pico no topo, ombros em curva, pico invertido embaixo
  const cardPath = `
    M 160 2
    L 200 12
    L 300 22
    Q 316 24 316 40
    V 420
    Q 316 440 300 448
    L 250 462
    Q 210 476 160 478
    Q 110 476 70 462
    L 20 448
    Q 4 440 4 420
    V 40
    Q 4 24 20 22
    L 120 12
    Z
  `.trim().replace(/\s+/g, ' ')

  return (
    <div className="mx-auto flex flex-col items-center" style={{ maxWidth: width + 20 }}>
      <div className="relative" style={{ width, height }}>
        <svg
          viewBox="0 0 320 490"
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
              <stop offset="0%" stopColor="#e8c274" />
              <stop offset="50%" stopColor="#f7e0a4" />
              <stop offset="100%" stopColor="#c89844" />
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
              <path d={cardPath} />
            </clipPath>
          </defs>

          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="0" y="0" width="320" height="490" fill={`url(#${uid}-cream)`} />

            {/* Feixes que atravessam todo o card */}
            <polygon points="60,10 260,10 300,480 20,480" fill={`url(#${uid}-navy-flow)`} />
            <polygon points="90,10 240,10 280,480 40,480" fill={`url(#${uid}-blue-flow)`} />
            <polygon points="130,10 220,10 250,480 70,480" fill={`url(#${uid}-lightblue-flow)`} />
            <polygon points="30,10 70,10 40,480 5,480" fill={`url(#${uid}-navy-flow)`} opacity="0.75" />
            <polygon points="260,10 300,10 315,480 280,480" fill={`url(#${uid}-navy-flow)`} opacity="0.7" />
            <polygon points="140,10 175,10 100,480 65,480" fill={`url(#${uid}-white-flow)`} />
            <polygon points="200,10 235,10 245,480 205,480" fill={`url(#${uid}-white-flow)`} opacity="0.7" />
            <polygon points="185,10 195,10 155,480 145,480" fill={`url(#${uid}-white-bright)`} />

            {/* ===== BLOCO UNIFICADO: NOME + STATS (mesma placa) ===== */}
            {/* Painel de fundo grande */}
            <rect
              x="24" y="285" width="272" height="145" rx="10"
              fill={`url(#${uid}-nameplate)`}
              stroke="#5a4415" strokeWidth="1.2"
            />
            {/* Borda interna clara */}
            <rect
              x="28" y="289" width="264" height="137" rx="8"
              fill="none" stroke="#f7e7a8" strokeWidth="0.6" opacity="0.7"
            />

            {/* Faixa superior mais escura pro nome */}
            <rect
              x="28" y="289" width="264" height="34" rx="6"
              fill="#b8863a" fillOpacity="0.35"
            />

            {/* Divisor sob o nome */}
            <line x1="40" y1="325" x2="280" y2="325" stroke="#8a6a22" strokeWidth="1" />
            <line x1="40" y1="327" x2="280" y2="327" stroke="#f7e7a8" strokeWidth="0.5" opacity="0.7" />

            {/* Stats */}
            <g fontFamily="'Inter', system-ui, sans-serif">
              {/* Divisor central vertical entre colunas */}
              <line x1="160" y1="340" x2="160" y2="418" stroke="#8a6a22" strokeWidth="1.2" />
              <line x1="156" y1="345" x2="156" y2="413" stroke="#d8c48a" strokeWidth="0.5" />
              <line x1="164" y1="345" x2="164" y2="413" stroke="#d8c48a" strokeWidth="0.5" />
              <polygon points="160,375 165,381 160,387 155,381" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />

              {/* Separadores horizontais entre linhas */}
              <line x1="40" y1="365" x2="150" y2="365" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.6" />
              <line x1="40" y1="392" x2="150" y2="392" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.6" />
              <line x1="170" y1="365" x2="280" y2="365" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.6" />
              <line x1="170" y1="392" x2="280" y2="392" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.6" />

              {STATS_LEFT.map((s, i) => {
                const y = 355 + i * 27
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text x="58" y={y} fontSize="18" fontWeight="800" textAnchor="middle" fill="#1a1408">
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {STATS_LEFT.map((s, i) => {
                const y = 355 + i * 27
                return (
                  <text
                    key={`${s.key}-label`}
                    x="115" y={y}
                    fontSize="12"
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
                const y = 355 + i * 27
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text x="215" y={y} fontSize="18" fontWeight="800" textAnchor="middle" fill="#1a1408">
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {STATS_RIGHT.map((s, i) => {
                const y = 355 + i * 27
                return (
                  <text
                    key={`${s.key}-label`}
                    x="262" y={y}
                    fontSize="12"
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

            {/* Crest inferior — mais abaixo, no rodapé pontudo */}
            <g transform="translate(160 452)">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" strokeLinecap="round">
                <path d="M-48 0 C -38 -6, -28 -8, -18 -5" />
                <path d="M48 0 C 38 -6, 28 -8, 18 -5" />
              </g>
              <circle r="8" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.9" />
              <circle r="5" fill="none" stroke="#f7e7a8" strokeWidth="0.6" />
              <circle r="2" fill="#5a4415" />
            </g>

            {/* Glyph topo pontudo */}
            <g transform="translate(160 10)" fill="#b58433">
              <polygon points="0,-4 3,0 0,4 -3,0" />
            </g>
          </g>

          {/* Borda dourada dupla */}
          <g fill="none" stroke={`url(#${uid}-gold)`} strokeLinejoin="round">
            <path d={cardPath} strokeWidth="5" />
            {/* Hairline interna */}
            <path
              d="M 160 10 L 198 18 L 296 28 Q 308 30 308 42 V 418 Q 308 436 296 442 L 250 454 Q 208 468 160 470 Q 112 468 70 454 L 24 442 Q 12 436 12 418 V 42 Q 12 30 24 28 L 122 18 Z"
              strokeWidth="1.2"
            />
          </g>
        </svg>

        {/* Overlay HTML */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rating */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: '7%', top: '6%' }}
          >
            <span
              className="font-display leading-none"
              style={{
                fontSize: width * 0.17,
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
                fontSize: width * 0.04,
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
                <path d="M 260 240 Q 360 210 460 250" fill="none" stroke="#fff" strokeWidth="18" />
              </svg>
            </div>
          </div>

          {/* Foto — mais pra baixo, ancorada na base */}
          {adm.foto && (
            <div
              className="absolute overflow-hidden"
              style={{
                left: '50%',
                top: '12%',
                width: '78%',
                height: '55%',
                transform: 'translateX(-50%)',
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

          {/* Nome — centralizado no card, dentro da faixa superior do painel */}
          <div
            className="absolute inset-x-0 text-center"
            style={{ top: `${(302 / 490) * 100}%`, padding: '0 8%' }}
          >
            <p
              className="font-display uppercase truncate"
              style={{
                fontSize: adm.nome.length > 12 ? width * 0.055 : width * 0.068,
                fontWeight: 700,
                color: '#1a1408',
                letterSpacing: '1px',
                lineHeight: '1',
                textShadow: '0 1px 0 rgba(255,240,180,0.9), 0 -0.5px 0 rgba(90,68,21,0.4)',
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
