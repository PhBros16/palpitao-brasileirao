'use client'

// CardDestaque — destaque da rodada (sempre visível, não colapsável).
// "Na Rodada" (pts acumulados) + "Hoje", faixa de stats (totais/abertos/cravei)
// e countdown do próximo jogo a fechar. Tudo via tokens.

import { useEffect, useState } from 'react'
import type { HomeData } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}min`
  return `${m}min`
}

export function CardDestaque({ data }: { data: HomeData }) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  const diff = data.proximoFechaEm !== null ? data.proximoFechaEm - now : null
  const urgente = diff !== null && diff < 2 * 60 * 60 * 1000

  return (
    <section className="rounded-lg border-2 border-dourado-300 bg-couro-300 p-4 shadow-md">
      <div className="mb-3 text-center">
        <h1 className="font-display text-xl font-bold uppercase leading-none tracking-wide text-dourado-50">
          {data.rodadaNome}
        </h1>
        <p className="mt-1 font-mono text-[10px] uppercase tracking-widest text-dourado-200">
          Rodada {data.rodadaNumero}
        </p>
      </div>

      {/* Na Rodada / Hoje */}
      <div className="mb-3 grid grid-cols-2 gap-2">
        <div className="rounded-lg border border-dourado-300/40 bg-couro-400/40 px-2 py-3 text-center">
          <div className="font-mono text-[9px] uppercase tracking-wider text-dourado-200">Na Rodada</div>
          <div className="font-display text-4xl font-bold leading-none text-dourado-50">{data.naRodada}</div>
          <div className="mt-1 font-mono text-[9px] text-dourado-200">pts acumulados</div>
        </div>
        <div className="rounded-lg border border-campo-50/40 bg-campo-noturno/30 px-2 py-3 text-center">
          <div className="font-mono text-[9px] uppercase tracking-wider text-dourado-200">Hoje</div>
          <div className={cx('font-display text-4xl font-bold leading-none', data.hoje > 0 ? 'text-campo-50' : 'text-dourado-200')}>
            {data.hoje}
          </div>
          <div className="mt-1 font-mono text-[9px] text-dourado-200">
            {data.posicao === 1 ? '🏆 Líder!' : `${data.posicao}º · ${data.ptsParaSubir}pts p/ subir`}
          </div>
        </div>
      </div>

      {/* Stats: totais / abertos / cravei */}
      <div className="grid grid-cols-3 gap-2">
        <StatBox label="Jogos Totais" valor={data.jogosTotais} tom="neutro" />
        <StatBox label="Jogos Abertos" valor={data.jogosAbertos} tom={data.jogosAbertos > 0 ? 'ouro' : 'neutro'} />
        <StatBox label="Cravei Quantos" valor={data.craveiQuantos} tom={data.craveiQuantos > 0 ? 'verde' : 'neutro'} />
      </div>

      {/* Countdown próximo */}
      {diff !== null && (
        <p className="mt-3 text-center font-mono text-[11px] text-dourado-200">
          ⏱ Próximo fecha em{' '}
          <span className={cx('font-bold', urgente ? 'text-raridade-frango-selo' : 'text-dourado-50')}>
            {formatCountdown(diff)}
          </span>
        </p>
      )}
    </section>
  )
}

function StatBox({ label, valor, tom }: { label: string; valor: number; tom: 'neutro' | 'ouro' | 'verde' }) {
  const cor = tom === 'ouro' ? 'text-dourado-50' : tom === 'verde' ? 'text-campo-50' : 'text-dourado-200'
  return (
    <div className="rounded-lg border border-dourado-300/30 bg-couro-400/30 px-1 py-2 text-center">
      <div className={cx('font-display text-2xl font-bold leading-none', cor)}>{valor}</div>
      <div className="mt-1 font-mono text-[8px] uppercase tracking-wider text-dourado-200">{label}</div>
    </div>
  )
}
