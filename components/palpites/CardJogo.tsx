'use client'

// CardJogo — card de um jogo palpitável.
//
// Escudo casa × inputs de placar × escudo fora, com countdown até o jogo
// fechar e estado "Travado" (após o início OU trava manual do admin). Sem os
// extras de mata-mata do Copa (Quem Avança / Pênaltis) — isso é liga.
//
// Presentacional: o estado (palpite, now, lock) vem por prop; quem orquestra é
// PalpitesRodada. Estilo 100% via Tailwind/tokens.

import { EscudoTime } from './EscudoTime'

export interface JogoPalpite {
  id: string
  home: string
  away: string
  homeLogo?: string
  awayLogo?: string
  /** Início do jogo em ISO com timezone. Trava quando agora ≥ kickoff. */
  kickoff: string
  /** Trava manual do admin — independe do horário. */
  travadoManual?: boolean
}

export interface Palpite {
  h: string
  a: string
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Formata um intervalo (ms) em "Xd Yh", "Xh Ymin", "Ymin Zs" ou "Zs". */
export function formatCountdown(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000))
  const d = Math.floor(s / 86400)
  const h = Math.floor((s % 86400) / 3600)
  const m = Math.floor((s % 3600) / 60)
  const sec = s % 60
  if (d > 0) return `${d}d ${h}h`
  if (h > 0) return `${h}h ${m}min`
  if (m > 0) return `${m}min ${String(sec).padStart(2, '0')}s`
  return `${sec}s`
}

/** Limita o gol a 0–20, só dígitos, máx 2 caracteres. */
export function sanitizeGol(v: string): string {
  const d = v.replace(/\D/g, '').slice(0, 2)
  if (d === '') return ''
  return String(Math.min(20, parseInt(d, 10)))
}

const URGENTE_MS = 60 * 60 * 1000 // < 1h → contagem urgente

export function CardJogo({
  jogo,
  palpite,
  now,
  onChange,
}: {
  jogo: JogoPalpite
  palpite: Palpite
  now: number
  onChange: (p: Palpite) => void
}) {
  const kickoffMs = Date.parse(jogo.kickoff)
  const diffMs = kickoffMs - now
  const locked = jogo.travadoManual || diffMs <= 0
  const urgente = !locked && diffMs < URGENTE_MS

  const horario = new Date(kickoffMs).toLocaleString('pt-BR', {
    day: '2-digit',
    month: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  })

  return (
    <article
      className={cx(
        'rounded-lg border bg-papel-50 p-3 shadow-sm transition-opacity',
        locked ? 'border-papel-borda-200 opacity-75' : 'border-papel-borda-300',
      )}
    >
      <div className="flex items-center justify-between gap-2">
        {/* Casa */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <EscudoTime nome={jogo.home} logo={jogo.homeLogo} />
          <span className="max-w-full truncate text-center font-sans text-xs font-semibold text-tinta-300">
            {jogo.home}
          </span>
        </div>

        {/* Placar */}
        <div className="flex shrink-0 items-center gap-1.5">
          <input
            type="text"
            inputMode="numeric"
            aria-label={`Gols ${jogo.home}`}
            value={palpite.h}
            disabled={locked}
            onChange={(e) => onChange({ ...palpite, h: sanitizeGol(e.target.value) })}
            className="h-12 w-11 rounded-md border border-papel-borda-300 bg-papel-100 text-center font-mono text-xl font-bold text-tinta-300 outline-none focus:border-couro-300 disabled:cursor-not-allowed disabled:bg-papel-300 disabled:text-tinta-100"
          />
          <span className="font-mono text-sm text-tinta-100">×</span>
          <input
            type="text"
            inputMode="numeric"
            aria-label={`Gols ${jogo.away}`}
            value={palpite.a}
            disabled={locked}
            onChange={(e) => onChange({ ...palpite, a: sanitizeGol(e.target.value) })}
            className="h-12 w-11 rounded-md border border-papel-borda-300 bg-papel-100 text-center font-mono text-xl font-bold text-tinta-300 outline-none focus:border-couro-300 disabled:cursor-not-allowed disabled:bg-papel-300 disabled:text-tinta-100"
          />
        </div>

        {/* Fora */}
        <div className="flex min-w-0 flex-1 flex-col items-center gap-1">
          <EscudoTime nome={jogo.away} logo={jogo.awayLogo} />
          <span className="max-w-full truncate text-center font-sans text-xs font-semibold text-tinta-300">
            {jogo.away}
          </span>
        </div>
      </div>

      {/* Rodapé: horário + countdown ou badge de travado */}
      <div className="mt-3 flex items-center justify-center border-t border-papel-borda-200 pt-2">
        {locked ? (
          <span className="flex items-center gap-1.5 rounded-full bg-tinta-300 px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase tracking-wider text-papel-50">
            🔒 {jogo.travadoManual ? 'Travado pelo admin' : 'Jogo começou'}
          </span>
        ) : (
          <span className="flex flex-wrap items-center justify-center gap-x-2 font-mono text-[11px] text-tinta-100">
            <span>⏱ {horario}</span>
            <span
              className={cx(
                'font-bold',
                urgente ? 'text-raridade-frango-selo' : 'text-verde-badge',
              )}
            >
              · fecha em {formatCountdown(diffMs)}
            </span>
          </span>
        )}
      </div>
    </article>
  )
}
