'use client'

import { useState } from 'react'
import type { JogoHistorico } from '@/lib/historicoReal'
import { categorizarAcerto } from '@/lib/historicoReal'
import { getEscudo } from '@/lib/escudos'
import { AvatarNome } from './AvatarNome'

const LEGENDA = [
  { cat: 'cravou', label: 'Cravou (5)', cor: 'bg-green-200 text-green-900 border-green-400' },
  { cat: 'saldo', label: 'Saldo (3)', cor: 'bg-blue-200 text-blue-900 border-blue-400' },
  { cat: 'vencedor', label: 'Vencedor (1)', cor: 'bg-yellow-200 text-yellow-900 border-yellow-400' },
  { cat: 'errou', label: 'Errou (0)', cor: 'bg-red-100 text-red-900 border-red-300' },
]

function corCategoria(cat: string): string {
  switch (cat) {
    case 'cravou': return 'bg-green-100 text-green-900'
    case 'saldo': return 'bg-blue-100 text-blue-900'
    case 'vencedor': return 'bg-yellow-100 text-yellow-900'
    case 'errou': return 'bg-red-50 text-red-900'
    case 'sem-palpite': return 'bg-neutral-100 text-neutral-500 italic'
    default: return 'bg-papel-100 text-tinta-200'
  }
}

function EscudoMini({ nome }: { nome: string }) {
  const logo = getEscudo(nome)
  if (logo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element
      <img src={logo} alt={nome} className="h-5 w-5 object-contain" />
    )
  }
  return (
    <span className="inline-flex h-5 w-5 items-center justify-center rounded-sm bg-couro-100 font-mono text-[8px] font-bold text-couro-900">
      {nome.slice(0, 3).toUpperCase()}
    </span>
  )
}

function formatarData(date: string | null, time: string | null): string {
  if (!date) return ''
  const [ano, mes, dia] = date.split('-')
  const dataStr = `${dia}/${mes}`
  if (time) {
    const hm = time.slice(0, 5)
    return `${dataStr} ${hm}`
  }
  return dataStr
}

function CardJogo({ jogo }: { jogo: JogoHistorico }) {
  const [aberto, setAberto] = useState(false)
  const temResultado = jogo.homeScore !== null && jogo.awayScore !== null

  return (
    <div className="overflow-hidden rounded-md border border-papel-borda-200 bg-papel-50">
      <button
        type="button"
        onClick={() => setAberto((o) => !o)}
        className="w-full px-2 py-2 text-left transition-colors hover:bg-papel-100"
      >
        <div className="flex items-center justify-between gap-2">
          <div className="flex flex-1 items-center justify-center gap-2">
            <div className="flex items-center gap-1.5">
              <EscudoMini nome={jogo.home} />
              <span className="font-sans text-xs font-semibold text-tinta-300">{jogo.home}</span>
            </div>
            {temResultado ? (
              <span className="rounded bg-couro-100 px-2 py-0.5 font-mono text-sm font-bold text-couro-900">
                {jogo.homeScore} <span className="text-tinta-100">×</span> {jogo.awayScore}
              </span>
            ) : (
              <span className="font-mono text-[10px] text-tinta-100">— × —</span>
            )}
            <div className="flex items-center gap-1.5">
              <span className="font-sans text-xs font-semibold text-tinta-300">{jogo.away}</span>
              <EscudoMini nome={jogo.away} />
            </div>
          </div>
          <span className="font-mono text-sm text-tinta-200">{aberto ? '▲' : '▼'}</span>
        </div>
        {(jogo.matchDate || jogo.matchTime) && (
          <p className="mt-1 text-center font-mono text-[9px] text-tinta-100">
            {formatarData(jogo.matchDate, jogo.matchTime)}
          </p>
        )}
      </button>

      {aberto && (
        <div className="border-t border-papel-borda-200 bg-papel-100 p-2">
          <p className="mb-2 font-mono text-[9px] uppercase tracking-widest text-tinta-200">
            Palpites ({jogo.palpites.length})
          </p>
          <div className="grid grid-cols-2 gap-1.5">
            {jogo.palpites.map((p) => {
              const cat = categorizarAcerto(p.predH, p.predA, jogo.homeScore, jogo.awayScore)
              const palpiteStr = p.predH !== null && p.predA !== null ? `${p.predH}×${p.predA}` : '—'
              return (
                <div
                  key={p.participantId}
                  className={`flex items-center justify-between gap-1 rounded px-1.5 py-1 ${corCategoria(cat)}`}
                >
                  <AvatarNome avatar={p.avatar} emoji={p.emoji} nome={p.nome} tema="claro" />
                  <div className="flex items-center gap-1.5">
                    <span className="font-mono text-xs font-bold">{palpiteStr}</span>
                    <span className="font-mono text-[10px] font-bold">
                      {p.points > 0 ? `+${p.points}` : p.points === 0 ? '0' : ''}
                    </span>
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}

export function AbaJogos({ jogos }: { jogos: JogoHistorico[] }) {
  if (jogos.length === 0) {
    return <p className="py-4 text-center font-sans text-sm text-tinta-100">Sem jogos registrados.</p>
  }

  return (
    <div className="space-y-2">
      {/* Legenda */}
      <div className="flex flex-wrap gap-1 rounded border border-papel-borda-200 bg-papel-100 px-2 py-1.5">
        {LEGENDA.map((l) => (
          <span key={l.cat} className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold ${l.cor}`}>
            {l.label}
          </span>
        ))}
      </div>

      {/* Lista de jogos */}
      <div className="space-y-1.5">
        {jogos.map((j) => (
          <CardJogo key={j.id} jogo={j} />
        ))}
      </div>
    </div>
  )
}
