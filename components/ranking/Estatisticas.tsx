'use client'

// Estatisticas — aba de estatísticas do Ranking, com toggle Minhas/Grupo.
//
// Minhas: dados do participante logado (localStorage 'palpitao_sessao').
//   - 4 cards: Rodadas, Cravadas, Vencedor, Saldo
//   - Cards extras: Média por rodada, Meu Recorde, Tendência
//   - Heatmap Performance por Rodada (clicável — abre detalhe)
//   - Barras %: Placar exato / Vencedor / Saldo
//
// Grupo: placeholder (implementado no Bloco 2).

import { useEffect, useState } from 'react'
import {
  buscarMinhasStats,
  buscarDetalheRodada,
  type MinhasStatsReal,
  type DetalheJogoRodada,
} from '@/lib/statsReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Sub = 'minhas' | 'grupo'

// A prop `e` (MinhasEstatisticas do RankingScreen) fica só por compatibilidade
// — não usamos, buscamos dados reais direto do Supabase.
export function Estatisticas(_props: { e?: any }) {
  const [sub, setSub] = useState<Sub>('minhas')
  return (
    <div className="flex flex-col gap-4">
      {/* Sub-toggle Minhas / Grupo */}
      <div className="flex gap-1 rounded-lg border border-papel-borda-200 bg-papel-100 p-1">
        {(['minhas', 'grupo'] as Sub[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cx(
              'flex-1 rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors',
              sub === s ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
            )}
          >
            {s === 'minhas' ? '👤 Minhas' : '🌐 Grupo'}
          </button>
        ))}
      </div>

      {sub === 'minhas' && <BlocoMinhas />}
      {sub === 'grupo' && <BlocoGrupo />}
    </div>
  )
}

// ─── MINHAS ──────────────────────────────────────────────────────────────────

function BlocoMinhas() {
  const [stats, setStats] = useState<MinhasStatsReal | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [rodadaDetalhe, setRodadaDetalhe] = useState<{
    roundId: string
    numero: number
    nome: string
    pts: number | null
    jogos: DetalheJogoRodada[] | null
  } | null>(null)

  useEffect(() => {
    let pid: string | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        pid = sessao.id
      }
    } catch { /* ignora */ }

    if (!pid) {
      setErro('Sessão não encontrada. Faça login novamente.')
      return
    }
    setParticipantId(pid)
    buscarMinhasStats(pid)
      .then(setStats)
      .catch((e) => setErro((e as Error).message))
  }, [])

  async function abrirDetalheRodada(roundId: string, numero: number, nome: string, pts: number | null) {
    if (!participantId) return
    setRodadaDetalhe({ roundId, numero, nome, pts, jogos: null })
    try {
      const jogos = await buscarDetalheRodada(roundId, participantId)
      setRodadaDetalhe((atual) => (atual && atual.roundId === roundId ? { ...atual, jogos } : atual))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (erro) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-raridade-frango-selo">{erro}</div>
  }
  if (!stats) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-100">Carregando suas estatísticas...</div>
  }
  if (stats.rodadas === 0) {
    return (
      <div className="rounded-lg border border-papel-borda-200 bg-papel-100 p-6 text-center font-sans text-sm text-tinta-200">
        Você ainda não participou de nenhuma rodada finalizada. Suas estatísticas aparecerão aqui quando a primeira rodada com seus palpites for finalizada.
      </div>
    )
  }

  const iconeTendencia = stats.tendencia === 'alta' ? '⬆️' : stats.tendencia === 'baixa' ? '⬇️' : stats.tendencia === 'estavel' ? '➡️' : '—'
  const corTendencia = stats.tendencia === 'alta' ? 'text-green-600' : stats.tendencia === 'baixa' ? 'text-red-600' : 'text-tinta-200'
  const labelTendencia = stats.tendencia === 'alta' ? 'Em alta' : stats.tendencia === 'baixa' ? 'Em baixa' : stats.tendencia === 'estavel' ? 'Estável' : 'Sem dados'

  return (
    <div className="flex flex-col gap-4">
      {/* 4 cards principais */}
      <div className="grid grid-cols-4 gap-2">
        <CardStat label="Rodadas" valor={stats.rodadas} cor="text-tinta-300" />
        <CardStat label="Cravadas" valor={stats.cravadas} cor="text-green-600" />
        <CardStat label="Vencedor" valor={stats.vencedor} cor="text-blue-600" />
        <CardStat label="Saldo" valor={stats.saldo} cor="text-orange-600" />
      </div>

      {/* 3 cards extras */}
      <div className="grid grid-cols-3 gap-2">
        <CardStat label="Média/rod" valor={stats.mediaPts} cor="text-dourado-600" pequeno />
        <CardStat label="Recorde" valor={stats.meuRecorde} cor="text-dourado-600" pequeno />
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
          <span className={cx('font-mono text-lg font-bold', corTendencia)}>{iconeTendencia}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">{labelTendencia}</span>
        </div>
      </div>

      {/* Heatmap Performance por Rodada */}
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">🔥 Performance por Rodada</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {stats.ptsPorRodada.map((r) => {
            const cor = corCelulaHeatmap(r.pontos)
            return (
              <button
                key={r.roundId}
                type="button"
                onClick={() => abrirDetalheRodada(r.roundId, r.numero, r.nome, r.pontos)}
                className={cx('flex h-10 w-10 flex-col items-center justify-center rounded transition-transform hover:scale-110', cor)}
                title={`${r.nome}: ${r.pontos === null ? 'NP' : r.pontos + ' pts'}`}
              >
                <span className="font-mono text-[9px] font-bold">{r.label}</span>
                <span className="font-mono text-[10px] font-bold">{r.pontos === null ? '—' : r.pontos}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px] text-tinta-100">
          <LegendaHeatmap cor="bg-red-500" label="Ruim (0-4)" />
          <LegendaHeatmap cor="bg-orange-400" label="OK (5-9)" />
          <LegendaHeatmap cor="bg-yellow-400" label="Bom (10-14)" />
          <LegendaHeatmap cor="bg-blue-500" label="Muito bom (15-19)" />
          <LegendaHeatmap cor="bg-green-600" label="Ótimo (20+)" />
          <LegendaHeatmap cor="bg-papel-borda-300" label="NP" />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] italic text-tinta-100">👆 Toque numa rodada pra ver os detalhes</p>
      </div>

      {/* Barras % */}
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-tinta-100">📊 Acertos em {stats.totalComPalpite} palpites</p>
        <BarraPct label="Placar exato" pct={stats.pctPlacarExato} cor="bg-green-600" />
        <BarraPct label="Acertei o vencedor" pct={stats.pctVencedor} cor="bg-blue-500" />
        <BarraPct label="Acertei só o saldo" pct={stats.pctSaldo} cor="bg-orange-500" />
      </div>

      {/* Modal detalhe da rodada */}
      {rodadaDetalhe && (
        <DetalheRodadaModal
          detalhe={rodadaDetalhe}
          onFechar={() => setRodadaDetalhe(null)}
        />
      )}
    </div>
  )
}

// ─── GRUPO (placeholder) ─────────────────────────────────────────────────────

function BlocoGrupo() {
  return (
    <div className="rounded-lg border border-papel-borda-200 bg-papel-100 p-6 text-center font-sans text-sm text-tinta-200">
      🚧 Estatísticas do grupo em breve.
      <p className="mt-2 font-sans text-xs text-tinta-100">
        Cravadas & Zeros · Perfil de aposta · Bipolares · Consistência · Placares mais apostados · e mais...
      </p>
    </div>
  )
}

// ─── COMPONENTES AUXILIARES ──────────────────────────────────────────────────

function CardStat({ label, valor, cor, pequeno = false }: { label: string; valor: number | string; cor: string; pequeno?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
      <span className={cx('font-mono font-bold', cor, pequeno ? 'text-base' : 'text-xl')}>{valor}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">{label}</span>
    </div>
  )
}

function LegendaHeatmap({ cor, label }: { cor: string; label: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cx('h-2.5 w-2.5 rounded', cor)} />
      {label}
    </span>
  )
}

function corCelulaHeatmap(pts: number | null): string {
  if (pts === null) return 'bg-papel-borda-300 text-tinta-100'
  if (pts >= 20) return 'bg-green-600 text-white'
  if (pts >= 15) return 'bg-blue-500 text-white'
  if (pts >= 10) return 'bg-yellow-400 text-tinta-300'
  if (pts >= 5) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

function BarraPct({ label, pct, cor }: { label: string; pct: number; cor: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between font-sans text-xs">
        <span className="text-tinta-200">{label}</span>
        <span className="font-mono font-bold text-tinta-300">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-papel-200">
        <div className={cx('h-full rounded-full transition-all duration-500', cor)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

// ─── MODAL DETALHE DA RODADA ─────────────────────────────────────────────────

function DetalheRodadaModal({
  detalhe,
  onFechar,
}: {
  detalhe: { roundId: string; numero: number; nome: string; pts: number | null; jogos: DetalheJogoRodada[] | null }
  onFechar: () => void
}) {
  function iconePonto(pts: number | null, resultadoH: number | null): string {
    if (pts === null || resultadoH === null) return '—'
    if (pts >= 5) return '✅'
    if (pts >= 3) return '📐'
    if (pts >= 1) return '👍'
    return '❌'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
          <div>
            <p className="font-display text-base font-bold uppercase tracking-wide text-tinta-300">{detalhe.nome}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">
              {detalhe.pts !== null ? `${detalhe.pts} pontos` : 'Não palpitei'}
            </p>
          </div>
          <button type="button" onClick={onFechar} className="font-mono text-xs text-tinta-200 hover:text-tinta-300">✕</button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto">
          {!detalhe.jogos && (
            <p className="p-4 text-center font-sans text-xs text-tinta-100">Carregando jogos...</p>
          )}
          {detalhe.jogos && detalhe.jogos.length === 0 && (
            <p className="p-4 text-center font-sans text-xs text-tinta-100">Nenhum jogo encontrado.</p>
          )}
          {detalhe.jogos && detalhe.jogos.map((j) => (
            <div key={j.matchId} className="border-b border-papel-borda-200 px-4 py-3 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-tinta-300">{j.home} × {j.away}</span>
                <span className="font-mono text-sm">{iconePonto(j.pontos, j.resultadoH)}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-tinta-100">
                  Palpite: <span className="font-bold text-tinta-300">
                    {j.palpiteH !== null ? `${j.palpiteH}×${j.palpiteA}` : '—'}
                  </span>
                </span>
                <span className="text-tinta-100">
                  Resultado: <span className="font-bold text-dourado-600">
                    {j.resultadoH !== null ? `${j.resultadoH}×${j.resultadoA}` : '—'}
                  </span>
                </span>
                <span className="text-tinta-100">
                  Pts: <span className="font-bold text-tinta-300">{j.pontos ?? '—'}</span>
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
