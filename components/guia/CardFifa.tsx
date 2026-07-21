'use client'

// CardFifa — trading card FIFA-style em SVG puro.
// Baseado no template do Lovable, adaptado pro Palpitão:
// - Dados vindos do Supabase (AdminProfile)
// - Labels: PAL/GES/JUS/ZOA/RES/CRA
// - Feixes cristal atravessam a divisão pra dar profundidade

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

export function CardFifa({ adm, width = 300 }: { adm: AdminProfile; width?: number }) {
  const height = width * (460 / 320)
  const uid = `pc-${adm.id}`
  const rating = adm.rating ?? '—'
  const posicao = adm.posicao ?? 'ADM'

  return (
    <div className="mx-auto" style={{ width }}>
      <div className="relative" style={{ width, height }}>
        <svg
          viewBox="0 0 320 460"
          width={width}
          height={height}
          xmlns="http://www.w3.org/2000/svg"
        >
          <defs>
            {/* Borda dourada */}
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

            {/* Filigranas douradas horizontais */}
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

            {/* Gradientes dos feixes cristal */}
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

            {/* Fade pros feixes atravessarem — vertical top→bottom */}
            <linearGradient id={`${uid}-beam-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ffffff" stopOpacity="1" />
              <stop offset="60%" stopColor="#ffffff" stopOpacity="0.85" />
              <stop offset="82%" stopColor="#ffffff" stopOpacity="0.35" />
              <stop offset="100%" stopColor="#ffffff" stopOpacity="0" />
            </linearGradient>

            <linearGradient id={`${uid}-beam-blue-fade`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#274bbd" stopOpacity="0.85" />
              <stop offset="55%" stopColor="#274bbd" stopOpacity="0.5" />
              <stop offset="80%" stopColor="#274bbd" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#274bbd" stopOpacity="0" />
            </linearGradient>

            {/* Sombra suave que os feixes projetam na área bege */}
            <linearGradient id={`${uid}-beam-shadow`} x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#1a1a2a" stopOpacity="0.18" />
              <stop offset="100%" stopColor="#1a1a2a" stopOpacity="0" />
            </linearGradient>

            {/* Filigrana ornamental */}
            <symbol id={`${uid}-flourish`} viewBox="-40 -10 80 20" overflow="visible">
              <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.1" strokeLinecap="round">
                <path d="M-38 0 C -24 0, -22 -6, -14 -6 C -6 -6, -6 6, 2 6 C 10 6, 14 0, 20 0" />
                <path d="M-14 -6 c -2 -3, -6 -3, -8 0" />
                <path d="M2 6 c 2 3, 6 3, 8 0" />
              </g>
              <circle r="1.8" fill="#f2d97a" stroke="#8a6a22" strokeWidth="0.6" />
            </symbol>

            {/* Clip do card */}
            <clipPath id={`${uid}-clip`}>
              <path d="M20 4 H300 Q316 4 316 20 V430 Q316 448 300 452 Q240 458 160 458 Q80 458 20 452 Q4 448 4 430 V20 Q4 4 20 4 Z" />
            </clipPath>

            {/* Clip da região dos feixes cristal — ESTENDIDO até y=310 (invade área bege) */}
            <clipPath id={`${uid}-top-clip`}>
              <path d="M12 12 H308 V240 H12 Z" />
            </clipPath>

            {/* Clip pros feixes que atravessam — vão até y=340 */}
            <clipPath id={`${uid}-beam-clip`}>
              <path d="M12 240 H308 V340 H12 Z" />
            </clipPath>
          </defs>

          {/* ---- Corpo bege ---- */}
          <g clipPath={`url(#${uid}-clip)`}>
            <rect x="0" y="0" width="320" height="460" fill={`url(#${uid}-cream)`} />

            {/* ---- Foto do adm (atrás dos feixes) ---- */}
            {adm.foto && (
              <image
                href={adm.foto}
                x="30"
                y="20"
                width="260"
                height="240"
                preserveAspectRatio="xMidYMid slice"
              />
            )}

            {/* ---- Composição principal dos feixes (topo) ---- */}
            <g clipPath={`url(#${uid}-top-clip)`} opacity={adm.foto ? 0.78 : 1}>
              <polygon points="60,10 260,10 300,120 260,240 40,240 20,150" fill={`url(#${uid}-blue1)`} />
              <polygon points="90,10 240,10 280,140 200,240 60,240 40,120" fill={`url(#${uid}-blue2)`} opacity="0.92" />
              <polygon points="130,10 220,10 250,120 190,240 100,240 90,110" fill={`url(#${uid}-lightblue)`} opacity="0.75" />
              <polygon points="140,10 175,10 130,240 95,240" fill={`url(#${uid}-white)`} />
              <polygon points="200,10 235,10 195,240 160,240" fill="#ffffff" opacity="0.55" />
              <polygon points="185,10 195,10 145,240 135,240" fill="#ffffff" />
              <polygon points="30,10 70,10 40,180 15,140" fill={`url(#${uid}-blue1)`} opacity="0.8" />
              <polygon points="260,10 300,10 305,120 270,220" fill={`url(#${uid}-blue1)`} opacity="0.7" />
            </g>

            {/* ---- Feixes que ATRAVESSAM a divisão (com fade) ---- */}
            <g clipPath={`url(#${uid}-beam-clip}`}>
              {/* Sombra dos feixes projetada primeiro */}
              <polygon points="130,240 95,240 115,340 145,340" fill={`url(#${uid}-beam-shadow)`} />
              <polygon points="195,240 160,240 175,340 210,340" fill={`url(#${uid}-beam-shadow)`} />

              {/* Feixe branco central longo — atravessa até quase os stats */}
              <polygon
                points="145,240 135,240 115,340 125,340"
                fill={`url(#${uid}-beam-fade)`}
              />

              {/* Feixe branco largo esquerda */}
              <polygon
                points="130,240 95,240 105,335 140,335"
                fill={`url(#${uid}-beam-fade)`}
                opacity="0.7"
              />

              {/* Feixe branco direita */}
              <polygon
                points="195,240 160,240 175,335 210,335"
                fill={`url(#${uid}-beam-fade)`}
                opacity="0.55"
              />

              {/* Feixe azul suave — dá profundidade */}
              <polygon
                points="250,240 220,240 235,310 265,310"
                fill={`url(#${uid}-beam-blue-fade)`}
              />

              <polygon
                points="70,240 45,240 55,300 80,300"
                fill={`url(#${uid}-beam-blue-fade)`}
                opacity="0.7"
              />
            </g>

            {/* ---- Vignette e sombra do bege (agora depois dos feixes) ---- */}
            <rect x="0" y="238" width="320" height="222" fill={`url(#${uid}-cream-vignette)`} />
            <rect x="0" y="238" width="320" height="30" fill={`url(#${uid}-cream-shadow)`} />

            {/* ---- Divisor ornamental ---- */}
            <line x1="40" y1="260" x2="280" y2="260" stroke={`url(#${uid}-gold-h)`} strokeWidth="1" />
            <use href={`#${uid}-flourish`} x="90" y="278" />
            <use href={`#${uid}-flourish`} x="230" y="278" transform="rotate(180 230 278)" />
            <g transform="translate(160 278)">
              <circle r="10" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.8" />
              <circle r="6.5" fill="none" stroke="#f7e7a8" strokeWidth="0.6" />
              <polygon points="0,-4 3.5,0 0,4 -3.5,0" fill="#5a4415" />
            </g>

            {/* ---- Placa dos stats ---- */}
            <rect
              x="26" y="298" width="268" height="108" rx="6"
              fill="none" stroke="#c9ad5f" strokeWidth="0.8" strokeOpacity="0.55"
            />
            <rect
              x="30" y="302" width="260" height="100" rx="4"
              fill="#f3e4b4" fillOpacity="0.35"
              stroke="#e2cd88" strokeWidth="0.5"
            />

            <line x1="34" y1="296" x2="286" y2="296" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.4" />
            <line x1="46" y1="300" x2="274" y2="300" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.6" />
            <polygon points="30,296 34,292 38,296 34,300" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,296 286,292 290,296 286,300" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            {/* ---- Stats reais ---- */}
            <g fontFamily="'Inter', system-ui, sans-serif" fontWeight="700" fill="#3a2c12">
              <line x1="160" y1="308" x2="160" y2="392" stroke="#b8a267" strokeWidth="1.4" />
              <line x1="156" y1="316" x2="156" y2="384" stroke="#d8c48a" strokeWidth="0.5" />
              <line x1="164" y1="316" x2="164" y2="384" stroke="#d8c48a" strokeWidth="0.5" />
              <polygon points="160,346 165,352 160,358 155,352" fill={`url(#${uid}-gold-r)`} stroke="#5a4415" strokeWidth="0.5" />

              <line x1="40" y1="336" x2="150" y2="336" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="40" y1="366" x2="150" y2="366" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="336" x2="280" y2="336" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />
              <line x1="170" y1="366" x2="280" y2="366" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.5" />

              {/* Coluna esquerda — valor + label */}
              {STATS_LEFT.map((s, i) => {
                const y = 325 + i * 30
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key}>
                    <text x="60" y={y} fontSize="15" letterSpacing="1" textAnchor="middle">
                      {val ?? '—'}
                    </text>
                    <text x="105" y={y} fontSize="14" letterSpacing="1.4" textAnchor="middle" fill="#5a4415">
                      {s.label}
                    </text>
                  </g>
                )
              })}

              {/* Coluna direita — valor + label */}
              {STATS_RIGHT.map((s, i) => {
                const y = 325 + i * 30
                const val = (adm as any)[s.key] as number | null
                return (
                  <g key={s.key}>
                    <text x="220" y={y} fontSize="15" letterSpacing="1" textAnchor="middle">
                      {val ?? '—'}
                    </text>
                    <text x="265" y={y} fontSize="14" letterSpacing="1.4" textAnchor="middle" fill="#5a4415">
                      {s.label}
                    </text>
                  </g>
                )
              })}
            </g>

            {/* Rail bottom */}
            <line x1="34" y1="406" x2="286" y2="406" stroke={`url(#${uid}-gold-h)`} strokeWidth="1.2" />
            <polygon points="30,406 34,402 38,406 34,410" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />
            <polygon points="282,406 286,402 290,406 286,410" fill="#dcb057" stroke="#5a4415" strokeWidth="0.4" />

            {/* Crest inferior */}
            <g transform="translate(160 428)">
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

            {/* Filigranas corner */}
            <g fill="none" stroke={`url(#${uid}-gold-h)`} strokeWidth="0.8" strokeLinecap="round">
              <path d="M20 260 C 32 260, 36 268, 40 276" />
              <path d="M300 260 C 288 260, 284 268, 280 276" />
              <path d="M20 420 C 32 420, 40 428, 44 436" />
              <path d="M300 420 C 288 420, 280 428, 276 436" />
            </g>

            {/* Glyph topo */}
            <g transform="translate(160 16)" fill="#b58433">
              <polygon points="0,-4 3,0 0,4 -3,0" />
            </g>
          </g>

          {/* Borda dourada dupla — por cima de tudo */}
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

        {/* Overlay HTML — Rating, Posição, Nome, Vulgo (por cima do SVG) */}
        <div className="absolute inset-0 pointer-events-none">
          {/* Rating (canto superior esquerdo) */}
          <div
            className="absolute flex flex-col items-center"
            style={{
              left: `${(24 / 320) * 100}%`,
              top: `${(28 / 460) * 100}%`,
            }}
          >
            <span
              className="font-display font-black leading-none"
              style={{
                fontSize: width * 0.13,
                color: '#2d2416',
                letterSpacing: '-2px',
                textShadow: '0 1px 0 rgba(255,255,255,0.6)',
              }}
            >
              {rating}
            </span>
            <span
              className="font-mono font-bold uppercase"
              style={{
                fontSize: width * 0.035,
                color: '#2d2416',
                letterSpacing: '2px',
                marginTop: '2px',
              }}
            >
              {posicao}
            </span>
          </div>

          {/* Nome + Vulgo (centro, abaixo do divisor) */}
          <div
            className="absolute inset-x-0 text-center px-6"
            style={{ top: `${(292 / 460) * 100}%` }}
          >
            <p
              className="font-display font-black uppercase truncate"
              style={{
                fontSize: adm.nome.length > 12 ? width * 0.052 : width * 0.062,
                color: '#2d2416',
                letterSpacing: '1px',
              }}
            >
              {adm.nome}
            </p>
            {adm.vulgo && (
              <p
                className="font-sans italic truncate"
                style={{
                  fontSize: width * 0.035,
                  color: '#6b5a2e',
                  marginTop: '2px',
                }}
              >
                "{adm.vulgo}"
              </p>
            )}
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
