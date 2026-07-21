'use client'

// CardFifa — cartão estilo FIFA Ultimate Team pros adms.
// Rating + posição + foto + nome + 6 stats. Design ouro/couro Panini.

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
    <div className="relative mx-auto w-full max-w-[240px]">
      {/* Borda dourada externa com brilho */}
      <div
        className="relative overflow-hidden rounded-2xl p-[3px]"
        style={{
          background: 'linear-gradient(135deg, #E8C158 0%, #F4E3A1 25%, #B8860B 55%, #F4E3A1 80%, #B8860B 100%)',
          boxShadow: '0 4px 20px rgba(184,134,11,0.4), inset 0 1px 2px rgba(255,255,255,0.6)',
        }}
      >
        {/* Interior do card */}
        <div
          className="relative overflow-hidden rounded-xl"
          style={{
            background: 'linear-gradient(180deg, #FBEDB6 0%, #F5DFA0 40%, #E8C97A 100%)',
            aspectRatio: '5 / 7',
          }}
        >
          {/* Diagonais decorativas (efeito FIFA holográfico) */}
          <div
            className="pointer-events-none absolute inset-0 opacity-30"
            style={{
              background:
                'linear-gradient(135deg, transparent 30%, rgba(255,255,255,0.5) 45%, transparent 55%), linear-gradient(45deg, transparent 60%, rgba(184,134,11,0.3) 75%, transparent 85%)',
            }}
          />

          {/* Rating (canto superior esquerdo) */}
          <div className="absolute left-3 top-2 z-10 flex flex-col items-center">
            <span className="font-display text-3xl font-black leading-none text-couro-900" style={{ textShadow: '0 1px 0 rgba(255,255,255,0.4)' }}>
              {adm.rating ?? '—'}
            </span>
            {adm.posicao && (
              <span className="mt-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-couro-900">
                {adm.posicao}
              </span>
            )}
          </div>

          {/* Foto (canto superior direito, grande) */}
          <div className="absolute right-2 top-2 z-10 h-20 w-20 overflow-hidden rounded-full border-2 border-couro-900/40 bg-papel-200 shadow-inner">
            {adm.foto ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={adm.foto} alt={adm.nome} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full w-full items-center justify-center font-display text-2xl font-bold text-couro-700">
                {getIniciais(adm.nome)}
              </div>
            )}
          </div>

          {/* Divisor dourado */}
          <div className="absolute inset-x-6 top-[46%] h-[2px]" style={{ background: 'linear-gradient(90deg, transparent, #B8860B, transparent)' }} />

          {/* Nome */}
          <div className="absolute inset-x-2 top-[48%] text-center">
            <p className="font-display text-base font-black uppercase tracking-wide text-couro-900 truncate">
              {adm.nome}
            </p>
            {adm.vulgo && (
              <p className="font-sans text-[10px] italic text-couro-700 truncate">"{adm.vulgo}"</p>
            )}
          </div>

          {/* Stats — 2 colunas */}
          <div className="absolute inset-x-4 bottom-3 grid grid-cols-2 gap-x-3">
            <div className="space-y-0.5 border-r border-couro-900/30 pr-2">
              {STATS_LEFT.map((s) => (
                <div key={s.key} className="flex items-center justify-between font-mono text-[11px] font-bold text-couro-900">
                  <span>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                  <span className="opacity-70">{s.label}</span>
                </div>
              ))}
            </div>
            <div className="space-y-0.5 pl-2">
              {STATS_RIGHT.map((s) => (
                <div key={s.key} className="flex items-center justify-between font-mono text-[11px] font-bold text-couro-900">
                  <span>{((adm as any)[s.key] as number | null) ?? '—'}</span>
                  <span className="opacity-70">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Descrição abaixo do card (fora, no papel) */}
      {adm.descricao && (
        <p className="mt-2 text-center font-sans text-xs italic leading-snug text-tinta-200 px-2">
          "{adm.descricao}"
        </p>
      )}
    </div>
  )
}
