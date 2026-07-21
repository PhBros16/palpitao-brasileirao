'use client'

// CardFifa v3 — trading card estilo FIFA Ultimate Team.
// Foto PNG com fundo transparente (preparada externamente).
// Rating gigante à esquerda + bandeira do BR sob ele.
// Foto grande à direita (posicionada como "meio corpo").
// Nome em placa dourada + vulgo em faixa separada.
// Frase decorativa em card próprio embaixo.

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

export function CardFifa({ adm, width = 260 }: { adm: AdminProfile; width?: number }) {
  const height = width * (460 / 320)
  const uid = `pc-${adm.id}`
  const rating = adm.rating ?? '—'
  const posicao = adm.posicao ?? 'ADM'

  return (
    <div className="mx-auto flex flex-col items-center" style={{ maxWidth: width + 20 }}>
      {/* Card principal */}
      <div className="relative" style={{ width, height }}>
        <svg
          viewBox="0 0 320 460"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Borda dourada rica */}
            <linearGradient id={`${uid}-gold`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f7e7a8" />
              <stop offset="18%" stopColor="#d9b45a" />
              <stop offset="40%" stopColor="#b58433" />
              <stop offset="55%" stopColor="#f2d97a" />
              <stop offset="72%" stopColor="#b58433" />
              <stop offset="90%" stopColor="#e8c874" />
              <stop offset="100%" stopColor="#a97a2b" />
            </linearGradient>

            {/* Corpo bege */}
            <linearGradient id={`${uid}-cream`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#f6ecd0" />
              <stop offset="55%" stopColor="#efe1b8" />
              <stop offset="100%" stopColor="#e6d29a" />
            </linearGradient>

            <radialGradient id={`${uid}-cream-vignette`} cx="50%" cy="70%" r="70%">
              <stop offset="0%" stopColor="#fff5d6" stopOpacity="0.9" />
              <stop offset="55%" stopColor="#efe1b8" stopOpacity="0" />
              <stop offset="100%" stopColor="#8a6a22" stopOpacity="0.35" />
            </radialGradient>

            <linearGradient id={`${uid}-cream-shadow`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#5a4415" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#5a4415" stopOpacity="0" />
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

            {/* Placa dourada pro nome */}
            <linearGradient id={`${uid}-nameplate`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#d9b45a" />
              <stop offset="50%" stopColor="#f2d97a" />
              <stop offset="100%" stopColor="#b58433" />
            </linearGradient>

            {/* Gradientes dos feixes */}
            <linearGradient id={`${uid}-blue1`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#0f1e4a" />
              <stop offset="100%" stopColor="#1f3a8a" />
            </linearGradient>
            <linearGradient id={`${uid}-blue2`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#274bbd" />
              <stop offset="100%" stopColor="#5a7fe0" />
            </linearGradient>
            <linearGradient id={`${uid}-white`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="100%" stopColor="#d9e2f3" />
            </linearGradient>
            <linearGradient id={`${uid}-lightblue`} x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#c5d3ee" />
              <stop offset="100%" stopColor="#8ea6d5" />
            </linearGradient>

            <linearGradient id={`${uid}-beam-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            {/* Filtro de sombra pra números */}
            <filter id={`${uid}-text-shadow`} x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur in="SourceAlpha" stdDeviation="0.6" />
              <feOffset dx="0.6" dy="1" result="offsetblur" />
              <feComponentTransfer>
                <feFuncA type="linear" slope="0.6" />
              </feComponentTransfer>
              <feMerge>
                <feMergeNode />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>

            {/* Filigrana */}
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

            <clipPath id={`${uid}-top-clip`}>
              <path d="M12 12 H308 V240 H12 Z" />
            </clipPath>

            <clipPath id={`${uid}-beam-clip`}>
              <path d="M12 240 H308 V340 H12 Z" />
            </clipPath>
          </defs>

          {/* Corpo bege */}
          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="0" y="0" width="320" height="460" fill={`url(#${uid}-cream)`} />

            {/* Composição dos feixes cristal (SEM foto — vem separado no HTML overlay) */}
            <g clipPath={`url(#${uid}-top-clip)`}>
              <polygon points="60,10 260,10 300,120 260,240 40,240 20,150" fill={`url(#${uid}-blue1)`} />
              <polygon points="90,10 240,10 280,140 200,240 60,240 40,120" fill={`url(#${uid}-blue2)`} opacity="0.92" />
              <polygon points="130,10 220,10 250,120 190,240 100,240 90,110" fill={`url(#${uid}-lightblue)`} opacity="0.75" />
              <polygon points="140,10 175,10 130,240 95,240" fill={`url(#${uid}-white)`} />
              <polygon points="200,10 235,10 195,240 160,240" fill="#ffffff" opacity="0.55" />
              <polygon points="185,10 195,10 145,240 135,240" fill="#ffffff" />
              <polygon points="30,10 70,10 40,180 15,140" fill={`url(#${uid}-blue1)`} opacity="0.8" />
              <polygon points="260,10 300,10 305,120 270,220" fill={`url(#${uid}-blue1)`} opacity="0.7" />
            </g>

            {/* Feixes que atravessam a divisão */}
            <g clipPath={`url(#${uid}-beam-clip)`}>
              <polygon points="145,240 135,240 115,340 125,340" fill={`url(#${uid}-beam-fade)`} />
              <polygon points="130,240 95,240 105,335 140,335" fill={`url(#${uid}-beam-fade)`} opacity="0.7" />
              <polygon points="195,240 160,240 175,335 210,335" fill={`url(#${uid}-beam-fade)`} opacity="0.55" />
            </g>

            <rect x="0" y="238" width="320" height="222" fill={`url(#${uid}-cream-vignette)`} />
            <rect x="0" y="238" width="320" height="30" fill={`url(#${uid}-cream-shadow)`} />

            {/* Divisor ornamental */}
            <line x1="40" y1="260" x2="280" y2="260" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" />
            <use href={`#${uid}-flourish`} x="90" y="278" />
            <use href={`#${uid}-flourish`} x="230" y="278" transform="rotate(180 230 278)" />
            <g transform="translate(160 278)">
              <circle r="10" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.8" />
              <circle r="6.5" fill="none" stroke="#f7e7a8" strokeWidth="0.6" />
              <polygon points="0,-4 3.5,0 0,4 -3.5,0" fill="#5a4415" />
            </g>

            {/* PLACA DOURADA DO NOME (nova) */}
            <rect
              x="45" y="292" width="230" height="26" rx="4"
              fill={`url(#${uid}-nameplate)`}
              stroke="#5a4415" strokeWidth="0.8"
            />
            <rect
              x="48" y="295" width="224" height="20" rx="2"
              fill="none" stroke="#f7e7a8" strokeWidth="0.5" opacity="0.6"
            />

            {/* Placa dos stats */}
            <rect
              x="26" y="330" width="268" height="80" rx="6"
              fill="none" stroke="#c9ad5f" strokeWidth="0.8" strokeOpacity="0.55"
            />
            <rect
              x="30" y="334" width="260" height="72" rx="4"
              fill="#f3e4b4" fillOpacity="0.35"
              stroke="#e2cd88" strokeWidth="0.5"
            />

            <line x1="34" y1="328" x2="286" y2="328" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.4" />
            <polygon points="30,328 34,324 38,328 34,332" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,328 286,324 290,328 286,332" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            {/* Stats com sombra */}
            <g fontFamily="'Inter', system-ui, sans-serif" fontWeight="900" fill="#1a1408" filter={`url(#${uid}-text-shadow)`}>
              <line x1="160" y1="338" x2="160" y2="402" stroke="#8a6a22" strokeWidth="1.4" />
              <line x1="156" y1="344" x2="156" y2="396" stroke="#d8c48a" strokeWidth="0.5" />
              <line x1="164" y1="344" x2="164" y2="396" stroke="#d8c48a" strokeWidth="0.5" />
              <polygon points="160,368 165,374 160,380 155,374" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />

              <line x1="40" y1="362" x2="150" y2="362" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="40" y1="388" x2="150" y2="388" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="362" x2="280" y2="362" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="388" x2="280" y2="388" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />

              {STATS_LEFT.map((s, i) => {
                const y = 351 + i * 26
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key}>
                    <text x="58" y={y} fontSize="17" letterSpacing="0.5" textAnchor="middle">
                      {val ?? '—'}
                    </text>
                    <text x="110" y={y} fontSize="14" letterSpacing="1.4" textAnchor="middle" fill="#4a3510" fontWeight="700">
                      {s.label}
                    </text>
                  </g>
                )
              })}

              {STATS_RIGHT.map((s, i) => {
                const y = 351 + i * 26
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key}>
                    <text x="215" y={y} fontSize="17" letterSpacing="0.5" textAnchor="middle">
                      {val ?? '—'}
                    </text>
                    <text x="265" y={y} fontSize="14" letterSpacing="1.4" textAnchor="middle" fill="#4a3510" fontWeight="700">
                      {s.label}
                    </text>
                  </g>
                )
              })}
            </g>

            <line x1="34" y1="414" x2="286" y2="414" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.2" />
            <polygon points="30,414 34,410 38,414 34,418" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,414 286,410 290,414 286,418" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            {/* Crest inferior */}
            <g transform="translate(160 435)">
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
              <path d="M20 260 C 32 260, 36 268, 40 276" />
              <path d="M300 260 C 288 260, 284 268, 280 276" />
              <path d="M20 425 C 32 425, 40 430, 44 436" />
              <path d="M300 425 C 288 425, 280 430, 276 436" />
            </g>

            <g transform="translate(160 16)" fill="#b58433">
              <polygon points="0,-4 3,0 0,4 -3,0" />
            </g>
          </g>

          {/* Borda dourada dupla */}
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

        {/* Overlay HTML — Rating, Bandeira, Foto, Nome, Vulgo */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rating (esquerda superior) */}
          <div
            className="absolute flex flex-col items-center"
            style={{ left: '7%', top: '5%' }}
          >
            <span
              className="font-display font-black leading-none"
              style={{
                fontSize: width * 0.17,
                color: '#1a1408',
                letterSpacing: '-3px',
                textShadow: `
                  1px 1px 0 rgba(255,255,255,0.7),
                  2px 3px 4px rgba(0,0,0,0.4),
                  0 0 8px rgba(184,134,11,0.3)
                `,
                WebkitTextStroke: '0.5px rgba(90,68,21,0.5)',
              }}
            >
              {rating}
            </span>
            <span
              className="font-mono font-black uppercase"
              style={{
                fontSize: width * 0.038,
                color: '#1a1408',
                letterSpacing: '3px',
                marginTop: '2px',
                textShadow: '0 1px 0 rgba(255,255,255,0.5)',
              }}
            >
              {posicao}
            </span>

            {/* Bandeira do Brasil (SVG inline) */}
            <div
              style={{
                marginTop: width * 0.025,
                width: width * 0.11,
                height: width * 0.077,
                boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                borderRadius: '1px',
                overflow: 'hidden',
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

          {/* Foto do adm (direita, "meio corpo") */}
          {adm.foto && (
            <div
              className="absolute overflow-hidden"
              style={{
                right: '4%',
                top: '3%',
                width: '52%',
                height: '48%',
              }}
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={adm.foto}
                alt={adm.nome}
                className="h-full w-full"
                style={{
                  objectFit: 'contain',
                  objectPosition: 'center bottom',
                  filter: 'drop-shadow(2px 4px 6px rgba(0,0,0,0.5))',
                }}
              />
            </div>
          )}

          {/* Nome (na placa dourada) */}
          <div
            className="absolute inset-x-0 text-center"
            style={{ top: '63.5%', padding: '0 12%' }}
          >
            <p
              className="font-display font-black uppercase truncate"
              style={{
                fontSize: adm.nome.length > 12 ? width * 0.058 : width * 0.07,
                color: '#1a1408',
                letterSpacing: '1.5px',
                lineHeight: '1',
                textShadow: `
                  0 1px 0 rgba(255,240,180,0.8),
                  0 -1px 0 rgba(90,68,21,0.4)
                `,
              }}
            >
              {adm.nome}
            </p>
          </div>
        </div>
      </div>

      {/* Vulgo (fora do card, faixa própria) */}
      {adm.vulgo && (
        <div
          className="mt-2 rounded-full border border-couro-500 bg-gradient-to-r from-couro-100 via-dourado-100 to-couro-100 px-4 py-1 shadow-sm"
          style={{ maxWidth: width * 0.85 }}
        >
          <p
            className="text-center font-sans italic font-semibold truncate"
            style={{
              fontSize: width * 0.045,
              color: '#5a4415',
              letterSpacing: '0.5px',
            }}
          >
            "{adm.vulgo}"
          </p>
        </div>
      )}

      {/* Frase (card decorativo próprio) */}
      {adm.descricao && (
        <div
          className="mt-3 relative rounded-lg border-2 border-dourado-300 px-4 py-3 shadow-md"
          style={{
            maxWidth: width + 20,
            background: 'linear-gradient(135deg, #FCF3D8 0%, #F5E4B0 100%)',
          }}
        >
          {/* Aspas decorativas */}
          <span
            className="absolute font-display font-black text-dourado-400"
            style={{
              fontSize: width * 0.15,
              lineHeight: '1',
              top: '-8px',
              left: '4px',
              opacity: 0.6,
            }}
          >
            &ldquo;
          </span>
          <span
            className="absolute font-display font-black text-dourado-400"
            style={{
              fontSize: width * 0.15,
              lineHeight: '1',
              bottom: '-24px',
              right: '4px',
              opacity: 0.6,
            }}
          >
            &rdquo;
          </span>

          <p
            className="text-center font-sans italic leading-snug px-4"
            style={{
              fontSize: width * 0.048,
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
