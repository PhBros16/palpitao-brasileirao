'use client'

// CardFifa v8 — foto grande, ornamentos no topo, paleta refinada,
// tipografia melhorada, nome centralizado dentro do SVG.

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

export function CardFifa({ adm, width = 240 }: { adm: AdminProfile; width?: number }) {
  const height = width * (490 / 320)
  const uid = `pc-${adm.id}`
  const rating = adm.rating ?? '—'
  const posicao = adm.posicao ?? 'ADM'

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
            {/* Dourado mais rico (mais camadas) */}
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#faf1c8" />
              <stop offset="12%" stopColor="#e3c268" />
              <stop offset="30%" stopColor="#c8963a" />
              <stop offset="50%" stopColor="#f4dc84" />
              <stop offset="70%" stopColor="#a97a22" />
              <stop offset="85%" stopColor="#e8c874" />
              <stop offset="100%" stopColor="#8b6110" />
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

            {/* Placa dourada com mais profundidade */}
            <linearGradient id={`${uid}-nameplate`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d4a544" />
              <stop offset="20%" stopColor="#f5dc82" />
              <stop offset="45%" stopColor="#fbe89a" />
              <stop offset="70%" stopColor="#e3c264" />
              <stop offset="100%" stopColor="#a67824" />
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
              <feDropShadow dx="0.8" dy="1" stdDeviation="0.5" floodColor="#000" floodOpacity="0.35" />
            </filter>

            <filter id={`${uid}-inner-shadow`}>
              <feGaussianBlur in="SourceAlpha" stdDeviation="1.5" />
              <feOffset dx="0" dy="1" result="offsetblur" />
              <feFlood floodColor="#5a4415" floodOpacity="0.5" />
              <feComposite in2="offsetblur" operator="in" />
              <feComposite in2="SourceGraphic" operator="over" />
            </filter>

            {/* Filigrana de canto ornamental */}
            <symbol id={`${uid}-corner`} viewBox="0 0 40 40" overflow="visible">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" strokeLinecap="round">
                <path d="M 2 20 Q 6 10, 20 8" />
                <path d="M 6 22 Q 10 14, 22 12" opacity="0.7" />
                <circle cx="20" cy="8" r="1.5" fill="#f2d97a" stroke="#8a6a22" strokeWidth="0.4" />
                <circle cx="4" cy="20" r="1" fill="#dcb057" stroke="#5a4415" strokeWidth="0.3" />
              </g>
            </symbol>

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

            {/* Feixes cristal — continuam do topo até base */}
            <polygon points="60,10 260,10 300,480 20,480" fill={`url(#${uid}-navy-flow)`} />
            <polygon points="90,10 240,10 280,480 40,480" fill={`url(#${uid}-blue-flow)`} />
            <polygon points="130,10 220,10 250,480 70,480" fill={`url(#${uid}-lightblue-flow)`} />
            <polygon points="30,10 70,10 40,480 5,480" fill={`url(#${uid}-navy-flow)`} opacity="0.75" />
            <polygon points="260,10 300,10 315,480 280,480" fill={`url(#${uid}-navy-flow)`} opacity="0.7" />
            <polygon points="140,10 175,10 100,480 65,480" fill={`url(#${uid}-white-flow)`} />
            <polygon points="200,10 235,10 245,480 205,480" fill={`url(#${uid}-white-flow)`} opacity="0.7" />
            <polygon points="185,10 195,10 155,480 145,480" fill={`url(#${uid}-white-bright)`} />

            {/* ORNAMENTOS NO TOPO — cantos + centro */}
            <use href={`#${uid}-corner`} x="12" y="15" />
            <use href={`#${uid}-corner`} x="308" y="15" transform="scale(-1 1) translate(-620 0)" />

            {/* Filigrana central no topo */}
            <g transform="translate(160 18)">
              <use href={`#${uid}-flourish`} x="-20" y="0" />
              <use href={`#${uid}-flourish`} x="20" y="0" transform="rotate(180 20 0)" />
              <circle r="4" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />
              <circle r="1.5" fill="#5a4415" />
            </g>

            {/* Estrelinhas decorativas laterais no topo */}
            <g fill="#dcb057" opacity="0.7">
              <polygon points="80,32 82,36 86,36 83,39 84,43 80,41 76,43 77,39 74,36 78,36" transform="scale(0.5) translate(80 30)" />
              <polygon points="240,32 242,36 246,36 243,39 244,43 240,41 236,43 237,39 234,36 238,36" transform="scale(0.5) translate(240 30)" />
            </g>

            {/* PLACA UNIFICADA */}
            <rect
              x="22" y="290" width="276" height="150" rx="10"
              fill={`url(#${uid}-nameplate)`}
              stroke="#7a5716" strokeWidth="1.5"
            />
            <rect
              x="26" y="294" width="268" height="142" rx="8"
              fill="none" stroke="#fff5c8" strokeWidth="0.7" opacity="0.85"
            />
            {/* Sombra interna sutil */}
            <rect
              x="24" y="292" width="272" height="146" rx="9"
              fill="none" stroke="#000" strokeWidth="0.5" opacity="0.2"
            />

            {/* Faixa do nome — mais escura pra dar destaque */}
            <rect
              x="26" y="294" width="268" height="36" rx="6"
              fill="#8a6428" fillOpacity="0.28"
            />
            <line x1="42" y1="331" x2="278" y2="331" stroke="#7a5716" strokeWidth="1.2" />
            <line x1="42" y1="333" x2="278" y2="333" stroke="#fff5c8" strokeWidth="0.5" opacity="0.8" />

            {/* NOME — dentro do SVG, centralizado perfeitamente */}
            <text
              x="160" y="318"
              textAnchor="middle"
              fontFamily="Georgia, 'Times New Roman', serif"
              fontSize={adm.nome.length > 12 ? 15 : 18}
              fontWeight="700"
              fill="#1a1408"
              letterSpacing="1.5"
              style={{ textTransform: 'uppercase' }}
            >
              {adm.nome}
            </text>

            {/* Stats */}
            <g>
              <line x1="160" y1="348" x2="160" y2="428" stroke="#7a5716" strokeWidth="1.4" />
              <line x1="156" y1="353" x2="156" y2="423" stroke="#e8d4a0" strokeWidth="0.5" />
              <line x1="164" y1="353" x2="164" y2="423" stroke="#e8d4a0" strokeWidth="0.5" />
              <polygon points="160,383 165,389 160,395 155,389" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />

              <line x1="40" y1="372" x2="150" y2="372" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.55" />
              <line x1="40" y1="400" x2="150" y2="400" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.55" />
              <line x1="170" y1="372" x2="280" y2="372" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.55" />
              <line x1="170" y1="400" x2="280" y2="400" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" opacity="0.55" />

              {/* Números — font serifada, peso 700 */}
              {STATS_LEFT.map((s, i) => {
                const y = 362 + i * 28
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text
                      x="58" y={y}
                      fontFamily="Georgia, 'Times New Roman', serif"
                      fontSize="19"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="#1a1408"
                    >
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {STATS_LEFT.map((s, i) => {
                const y = 362 + i * 28
                return (
                  <text
                    key={`${s.key}-label`}
                    x="115" y={y}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize="12"
                    fontWeight="400"
                    letterSpacing="1.8"
                    textAnchor="middle"
                    fill="#5a4415"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {s.label}
                  </text>
                )
              })}

              {STATS_RIGHT.map((s, i) => {
                const y = 362 + i * 28
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key} filter={`url(#${uid}-num-shadow)`}>
                    <text
                      x="215" y={y}
                      fontFamily="Georgia, 'Times New Roman', serif"
                      fontSize="19"
                      fontWeight="700"
                      textAnchor="middle"
                      fill="#1a1408"
                    >
                      {val ?? '—'}
                    </text>
                  </g>
                )
              })}
              {STATS_RIGHT.map((s, i) => {
                const y = 362 + i * 28
                return (
                  <text
                    key={`${s.key}-label`}
                    x="262" y={y}
                    fontFamily="Georgia, 'Times New Roman', serif"
                    fontSize="12"
                    fontWeight="400"
                    letterSpacing="1.8"
                    textAnchor="middle"
                    fill="#5a4415"
                    style={{ textTransform: 'uppercase' }}
                  >
                    {s.label}
                  </text>
                )
              })}
            </g>

            {/* Crest inferior */}
            <g transform="translate(160 458)">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" strokeLinecap="round">
                <path d="M-42 0 C -32 -6, -22 -8, -14 -5" />
                <path d="M42 0 C 32 -6, 22 -8, 14 -5" />
              </g>
              <circle r="7" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.9" />
              <circle r="4" fill="none" stroke="#f7e7a8" strokeWidth="0.5" />
              <circle r="1.8" fill="#5a4415" />
            </g>
          </g>

          {/* Borda dourada dupla — mais rica */}
          <g fill="none" stroke={`url(#${uid}-gold)`} strokeLinejoin="round">
            <path d={cardPath} strokeWidth="5.5" />
            <path
              d="M 160 10 L 198 18 L 296 28 Q 308 30 308 42 V 418 Q 308 436 296 442 L 250 454 Q 208 468 160 470 Q 112 468 70 454 L 24 442 Q 12 436 12 418 V 42 Q 12 30 24 28 L 122 18 Z"
              strokeWidth="1.2"
            />
            {/* Hairline extra interna */}
            <path
              d="M 160 18 L 195 24 L 290 32 Q 302 34 302 46 V 416 Q 302 432 290 438 L 248 450 Q 206 464 160 466 Q 114 464 72 450 L 30 438 Q 18 432 18 416 V 46 Q 18 34 30 32 L 125 24 Z"
              strokeWidth="0.4"
              opacity="0.5"
            />
          </g>
        </svg>

        {/* Overlay HTML */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rating */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: '6%', top: '7%' }}
          >
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: width * 0.17,
                fontWeight: 700,
                color: '#1a1408',
                letterSpacing: '-1px',
                lineHeight: '1',
                textShadow: `
                  1px 1px 0 rgba(255,255,255,0.9),
                  2px 3px 4px rgba(0,0,0,0.5)
                `,
              }}
            >
              {rating}
            </span>
            <span
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                fontSize: width * 0.038,
                fontWeight: 400,
                color: '#1a1408',
                letterSpacing: '3px',
                marginTop: '3px',
                textShadow: '0 1px 0 rgba(255,255,255,0.9)',
                background: 'rgba(255,240,180,0.55)',
                padding: '2px 8px',
                borderRadius: '2px',
                border: '1px solid rgba(184,132,51,0.4)',
                textTransform: 'uppercase',
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

          {/* Foto — MUITO grande */}
          {adm.foto && (
            <div
              className="absolute overflow-hidden"
              style={{
                left: '50%',
                top: '8%',
                width: '88%',
                height: '58%',
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
                  filter: 'drop-shadow(2px 4px 8px rgba(0,0,0,0.55))',
                }}
              />
            </div>
          )}
        </div>
      </div>

      {adm.vulgo && (
        <div
          className="mt-2 rounded-full border-2 border-dourado-500 px-4 py-1 shadow-md"
          style={{
            maxWidth: width * 0.85,
            background: 'linear-gradient(135deg, #FCF3D8 0%, #F5E4B0 50%, #E8C97A 100%)',
          }}
        >
          <p
            className="text-center italic truncate"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
              fontSize: width * 0.048,
              fontWeight: 500,
              color: '#5a4415',
              letterSpacing: '0.5px',
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
            style={{
              fontFamily: "Georgia, serif",
              position: 'absolute',
              fontSize: width * 0.16,
              fontWeight: 700,
              lineHeight: '1',
              top: '-6px',
              left: '6px',
              opacity: 0.55,
              color: '#B8860B',
            }}
          >
            &ldquo;
          </span>
          <span
            style={{
              fontFamily: "Georgia, serif",
              position: 'absolute',
              fontSize: width * 0.16,
              fontWeight: 700,
              lineHeight: '1',
              bottom: '-24px',
              right: '6px',
              opacity: 0.55,
              color: '#B8860B',
            }}
          >
            &rdquo;
          </span>
          <p
            className="text-center italic leading-snug px-4"
            style={{
              fontFamily: "Georgia, 'Times New Roman', serif",
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
