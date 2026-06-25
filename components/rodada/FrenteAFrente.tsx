'use client'

// FrenteAFrente — modal comparando o participante logado vs. o selecionado,
// jogo a jogo, com ✓/✗ por jogo e o total de pts da rodada de cada um.

import type { JogoCol, LinhaParticipante } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function fmt(c: { h: number; a: number } | null): string {
  return c ? `${c.h}x${c.a}` : '—'
}

export function FrenteAFrente({
  voce,
  outro,
  jogos,
  onClose,
}: {
  voce: LinhaParticipante
  outro: LinhaParticipante
  jogos: JogoCol[]
  onClose: () => void
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-parede-200/85 p-4 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="flex max-h-[85vh] w-full max-w-[420px] flex-col overflow-hidden rounded-lg border-2 border-couro-300 bg-papel-100 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Cabeçalho */}
        <div className="shrink-0 border-b border-papel-borda-200 bg-papel-200 px-4 py-3">
          <div className="text-center font-display text-sm font-bold uppercase tracking-wider text-tinta-300">
            Frente a Frente
          </div>
          <div className="mt-2 grid grid-cols-[1fr_auto_1fr] items-center gap-2">
            <div className="text-center">
              <div className="truncate font-sans text-xs font-bold text-tinta-300">{voce.nome}</div>
              <div className="font-display text-2xl font-bold leading-none text-dourado-600">{voce.totalRodada}</div>
            </div>
            <div className="font-mono text-[10px] uppercase text-tinta-100">vs</div>
            <div className="text-center">
              <div className="truncate font-sans text-xs font-bold text-tinta-300">{outro.nome}</div>
              <div className="font-display text-2xl font-bold leading-none text-couro-200">{outro.totalRodada}</div>
            </div>
          </div>
        </div>

        {/* Lista de jogos */}
        <div className="overflow-y-auto px-3 py-2">
          {jogos.map((j) => {
            const cv = voce.celulas[j.id]
            const co = outro.celulas[j.id]
            const okV = (cv?.pts ?? 0) > 0
            const okO = (co?.pts ?? 0) > 0
            return (
              <div
                key={j.id}
                className="grid grid-cols-[1fr_auto_1fr] items-center gap-2 border-b border-papel-borda-200/50 py-1.5 last:border-0"
              >
                <div className="flex items-center justify-end gap-1.5">
                  <span className="font-mono text-sm text-tinta-300">{fmt(cv?.palpite ?? null)}</span>
                  <Marca ok={okV} cravada={cv?.pts === 5} />
                </div>
                <div className="px-1 text-center font-mono text-[9px] uppercase tracking-wide text-tinta-100">
                  {sig(j.home)}×{sig(j.away)}
                </div>
                <div className="flex items-center gap-1.5">
                  <Marca ok={okO} cravada={co?.pts === 5} />
                  <span className="font-mono text-sm text-tinta-300">{fmt(co?.palpite ?? null)}</span>
                </div>
              </div>
            )
          })}
        </div>

        <button
          type="button"
          onClick={onClose}
          className="shrink-0 border-t border-papel-borda-200 bg-papel-50 py-3 font-display text-sm font-bold uppercase tracking-wider text-tinta-200 transition-colors hover:bg-papel-200"
        >
          Fechar
        </button>
      </div>
    </div>
  )
}

function Marca({ ok, cravada }: { ok: boolean; cravada?: boolean }) {
  return (
    <span
      className={cx(
        'flex h-5 w-5 shrink-0 items-center justify-center rounded-full text-[11px] font-bold',
        cravada
          ? 'bg-dourado-300 text-tinta-300'
          : ok
            ? 'bg-verde-badge text-papel-50'
            : 'bg-raridade-frango-selo text-papel-50',
      )}
    >
      {ok ? '✓' : '✗'}
    </span>
  )
}

function sig(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .slice(0, 3)
    .toUpperCase()
}
