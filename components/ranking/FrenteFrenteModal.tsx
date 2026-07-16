'use client'

// FrenteFrenteModal — comparativo histórico entre 2 participantes com filtro
// de janela (Última / Últ 3/5/10 / Total). Chamado pela Classificacao ao clicar
// em qualquer linha da tabela.

import { useEffect, useMemo, useState } from 'react'
import { buscarFrenteAFrente, type FrenteFrenteRodada } from '@/lib/rankingReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type Janela = 'ultima' | 'ult3' | 'ult5' | 'ult10' | 'total'

const OPCOES_JANELA: Array<[Janela, string]> = [
  ['ultima', 'Última'], ['ult3', 'Últ. 3'], ['ult5', 'Últ. 5'], ['ult10', 'Últ. 10'], ['total', 'Total'],
]

function iconeResultado(pontos: number | null, resultadoH: number | null): string {
  if (pontos === null || resultadoH === null) return '—'
  if (pontos >= 5) return '✅'
  if (pontos >= 3) return '📐'
  if (pontos >= 1) return '👍'
  return '❌'
}

export function FrenteFrenteModal({
  jogadorA,
  jogadorB,
  onFechar,
}: {
  jogadorA: { participantId: string; nome: string }
  jogadorB: { participantId: string; nome: string }
  onFechar: () => void
}) {
  const [janela, setJanela] = useState<Janela>('total')
  const [carregando, setCarregando] = useState(true)
  const [rodadas, setRodadas] = useState<FrenteFrenteRodada[]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true); setErro(null)
    buscarFrenteAFrente(jogadorA.participantId, jogadorB.participantId, janela)
      .then(setRodadas)
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false))
  }, [janela, jogadorA.participantId, jogadorB.participantId])

  const { vA, vB, empates } = useMemo(() => {
    let vA = 0, vB = 0, empates = 0
    for (const r of rodadas) {
      if (r.totalA > r.totalB) vA++
      else if (r.totalB > r.totalA) vB++
      else empates++
    }
    return { vA, vB, empates }
  }, [rodadas])

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-lg overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
          <p className="font-display text-base font-bold uppercase tracking-wide text-tinta-300">
            🥊 Frente a Frente
          </p>
          <button
            type="button"
            onClick={onFechar}
            className="font-mono text-xs text-tinta-200 hover:text-tinta-300"
          >
            ✕
          </button>
        </div>

        {/* Filtros de janela */}
        <div className="flex flex-wrap gap-1.5 border-b border-papel-borda-200 bg-papel-100 px-4 py-2">
          {OPCOES_JANELA.map(([val, label]) => (
            <button
              key={val}
              type="button"
              onClick={() => setJanela(val)}
              className={cx(
                'rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors',
                janela === val
                  ? 'border-dourado-500 bg-dourado-100 text-dourado-700'
                  : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-200',
              )}
            >
              {label}
            </button>
          ))}
        </div>

        {/* Placar */}
        <div className="grid grid-cols-3 items-center gap-2 border-b border-papel-borda-200 bg-papel-50 px-4 py-4">
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-dourado-400 bg-dourado-100 font-display text-base font-bold text-tinta-300">
              {getIniciais(jogadorA.nome)}
            </div>
            <p className="mt-1 truncate font-sans text-xs font-semibold text-tinta-300">{jogadorA.nome}</p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-dourado-600">{vA}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">Rodadas vencidas</p>
          </div>
          <div className="text-center">
            <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">Placar</p>
            <p className="mt-1 font-mono text-lg font-bold text-tinta-300">{empates}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">Empates</p>
          </div>
          <div className="text-center">
            <div className="mx-auto flex h-12 w-12 items-center justify-center rounded-full border-2 border-gray-400 bg-gray-200 font-display text-base font-bold text-tinta-300">
              {getIniciais(jogadorB.nome)}
            </div>
            <p className="mt-1 truncate font-sans text-xs font-semibold text-tinta-300">{jogadorB.nome}</p>
            <p className="mt-0.5 font-mono text-2xl font-bold text-dourado-600">{vB}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">Rodadas vencidas</p>
          </div>
        </div>

        {/* Corpo scrollável — rodada a rodada */}
        <div className="max-h-[50vh] overflow-y-auto">
          {carregando && <p className="p-4 text-center font-sans text-xs text-tinta-100">Carregando...</p>}
          {erro && <p className="p-4 text-center font-sans text-xs text-raridade-frango-selo">{erro}</p>}
          {!carregando && !erro && rodadas.length === 0 && (
            <p className="p-4 text-center font-sans text-xs text-tinta-100">
              Nenhuma rodada finalizada nesse recorte.
            </p>
          )}
          {!carregando && !erro && rodadas.map((r) => {
            const cor = r.totalA > r.totalB ? 'text-dourado-600' : r.totalB > r.totalA ? 'text-gray-500' : 'text-tinta-300'
            return (
              <div key={r.roundId} className="border-b border-papel-borda-200 px-4 py-3 last:border-0">
                <div className="mb-2 flex items-center justify-between">
                  <span className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">{r.nome}</span>
                  <span className={cx('font-mono text-sm font-bold', cor)}>
                    {r.totalA} × {r.totalB}
                  </span>
                </div>
                <div className="space-y-1">
                  {r.jogos.map((j) => (
                    <div key={j.matchId} className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 font-mono text-[11px]">
                      <span className="text-right">
                        {j.palpiteAH !== null ? `${j.palpiteAH}×${j.palpiteAA}` : '—'}
                        {' '}<span className="text-sm">{iconeResultado(j.pontosA, j.resultadoH)}</span>
                      </span>
                      <span className="text-tinta-100">|</span>
                      <span className="text-center text-tinta-200">
                        {j.home} × {j.away}
                        {j.resultadoH !== null && (
                          <span className="ml-1 font-bold text-dourado-600">
                            ({j.resultadoH}×{j.resultadoA})
                          </span>
                        )}
                      </span>
                      <span className="text-tinta-100">|</span>
                      <span className="text-left">
                        <span className="text-sm">{iconeResultado(j.pontosB, j.resultadoH)}</span>{' '}
                        {j.palpiteBH !== null ? `${j.palpiteBH}×${j.palpiteBA}` : '—'}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}
