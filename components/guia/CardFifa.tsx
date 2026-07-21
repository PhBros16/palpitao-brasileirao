'use client'

// CardFifa — cartão estilo FIFA Ultimate Team (ouro).
// Formato pentagonal (topo abaulado), textura holográfica, foto grande no topo,
// rating gigante à esquerda, stats em 2 colunas embaixo.

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
  return (
    <div className="relative mx-auto w-full max-w-[260px]">
      {/* Card com clip-path pentagonal (topo abaulado tipo FIFA) */}
      <div
        className="relative"
        style={{
          aspectRatio: '5 / 7.5',
          clipPath: 'polygon(50% 0%, 92% 4%, 100% 12%, 100% 96%, 96% 100%, 4% 100%, 0% 96%, 0% 12%, 8% 4%)',
          background: `
            linear-gradient(135deg, 
              #C99A2E 0%, 
              #F4D77A 15%, 
              #FCEBA7 30%, 
              #E8BB4A 50%, 
              #FCEBA7 70%, 
              #D4A038 85%, 
              #B8860B 100%
            )
          `,
          boxShadow: '0 8px 25px rgba(184,134,11,0.5), inset 0 0 40px rgba(255,240,180,0.4)',
          padding: '8px',
        }}
      >
        {/* Borda interna dourada mais escura (recorte) */}
        <div
          className="relative h-full w-full"
          style={{
            clipPath: 'polygon(50% 0%, 92% 4%, 100% 12%, 100% 96%, 96% 100%, 4% 100%, 0% 96%, 0% 12%, 8% 4%)',
            background: `
              linear-gradient(180deg,
                #F4D77A 0%,
                #FCEBA7 30%,
                #E8BB4A 100%
              )
            `,
          }}
        >
          {/* Efeito holográfico - listras diagonais brilhantes */}
          <div
            className="pointer-events-none absolute inset-0 opacity-40"
            style={{
              background: `
                linear-gradient(115deg, 
                  transparent 0%, 
                  transparent 20%, 
                  rgba(255,255,255,0.6) 35%, 
                  transparent 45%,
                  transparent 55%,
                  rgba(255,220,120,0.5) 65%,
                  transparent 75%,
                  transparent 100%
                )
              `,
            }}
          />

          {/* Textura sutil de pontos */}
          <div
            className="pointer-events-none absolute inset-0 opacity-20"
            style={{
              backgroundImage: 'radial-gradient(circle at 1px 1px, rgba(184,134,11,0.4) 1px, transparent 0)',
              backgroundSize: '8px 8px',
            }}
          />

          {/* Rating + Posição (esquerda alta) */}
          <div className="absolute left-4 top-6 z-20 flex flex-col items-center">
            <span
              className="font-display font-black leading-none text-couro-900"
              style={{
                fontSize: '3.5rem',
                textShadow: '1px 1px 0 rgba(255,240,180,0.8), -1px -1px 0 rgba(120,80,20,0.4)',
                letterSpacing: '-2px',
              }}
            >
              {adm.rating ?? '—'}
            </span>
            {adm.posicao && (
              <span className="mt-1 font-mono text-xs font-bold uppercase tracking-widest text-couro-900">
                {adm.posicao}
              </span>
            )}
          </div>

          {/* Foto (direita alta, grande) */}
          <div
            className="absolute right-4 top-6 z-20 overflow-hidden"
            style={{
              width: '110px',
              height: '110px',
            }}
          >
            {adm.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={adm.foto}
                alt={adm.nome}
                className="h-full w-full object-cover"
                style={{
                  filter: 'drop-shadow(2px 3px 4px rgba(80,50,10,0.5))',
                }}
              />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-4xl font-bold text-couro-700">
                {getIniciais(adm.nome)}
              </div>
            )}
          </div>

          {/* Divisor dourado */}
          <div
            className="absolute inset-x-8 z-10"
            style={{
              top: '48%',
              height: '1.5px',
              background: 'linear-gradient(90deg, transparent, #8B5A2B, #8B5A2B, transparent)',
              boxShadow: '0 1px 0 rgba(255,240,180,0.6)',
            }}
          />

          {/* Nome + Vulgo (centro) */}
          <div className="absolute inset-x-3 z-10" style={{ top: '52%' }}>
            <p
              className="text-center font-display font-black uppercase text-couro-900 truncate"
              style={{
                fontSize: adm.nome.length > 10 ? '1rem' : '1.15rem',
                letterSpacing: '0.5px',
                textShadow: '0 1px 0 rgba(255,240,180,0.6)',
              }}
            >
              {adm.nome}
            </p>
            {adm.vulgo && (
              <p className="mt-0.5 text-center font-sans text-[11px] italic text-couro-700 truncate">
                "{adm.vulgo}"
              </p>
            )}
          </div>

          {/* Stats — 2 colunas (parte inferior) */}
          <div
            className="absolute inset-x-6 z-10 grid grid-cols-2 gap-x-4"
            style={{ bottom: '18px' }}
          >
            <div className="space-y-1 border-r border-couro-800/40 pr-3">
              {STATS_LEFT.map((s) => (
                <div key={s.key} className="flex items-center justify-between font-mono text-sm font-bold text-couro-900">
                  <span style={{ minWidth: '20px' }}>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                  <span className="text-couro-700 text-xs tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-1 pl-3">
              {STATS_RIGHT.map((s) => (
                <div key={s.key} className="flex items-center justify-between font-mono text-sm font-bold text-couro-900">
                  <span style={{ minWidth: '20px' }}>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                  <span className="text-couro-700 text-xs tracking-wider">{s.label}</span>
                </div>
              ))}
            </div>
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
