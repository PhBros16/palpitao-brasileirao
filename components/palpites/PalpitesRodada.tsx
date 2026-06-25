'use client'

// PalpitesRodada — tela de Palpites da rodada atual (versão estática/mock).
//
// Reconstrução do zero da seção PALPITES do Copa (referência de comportamento
// apenas — nada portado). Lista os jogos da rodada, deixa palpitar placar,
// trava por horário/admin, mostra countdown e salva no estado LOCAL (sem
// Supabase ainda). Mobile-first, tudo via Tailwind/tokens.

import { useEffect, useMemo, useState } from 'react'
import { CardJogo, formatCountdown, type JogoPalpite, type Palpite } from './CardJogo'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const URGENTE_MS = 60 * 60 * 1000

export function PalpitesRodada({
  rodadaNome,
  jogos,
  palpitesIniciais,
}: {
  rodadaNome: string
  jogos: JogoPalpite[]
  palpitesIniciais?: Record<string, Palpite>
}) {
  const [palpites, setPalpites] = useState<Record<string, Palpite>>(palpitesIniciais ?? {})
  const [now, setNow] = useState<number>(() => Date.now())
  const [salvoEm, setSalvoEm] = useState<Date | null>(null)

  // Tick de 1s para os countdowns (e para travar no horário).
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function getPalpite(id: string): Palpite {
    return palpites[id] ?? { h: '', a: '' }
  }

  function setPalpite(id: string, p: Palpite) {
    setPalpites((prev) => ({ ...prev, [id]: p }))
  }

  // Estatística de cabeçalho: total / abertos / palpitados.
  const { totais, abertos, palpitados, proximoMs } = useMemo(() => {
    let abertosN = 0
    let palpitadosN = 0
    let proximo = Infinity
    for (const j of jogos) {
      const diff = Date.parse(j.kickoff) - now
      const locked = j.travadoManual || diff <= 0
      if (!locked) {
        abertosN++
        if (diff < proximo) proximo = diff
      }
      const p = palpites[j.id]
      if (p && p.h !== '' && p.a !== '') palpitadosN++
    }
    return {
      totais: jogos.length,
      abertos: abertosN,
      palpitados: palpitadosN,
      proximoMs: proximo === Infinity ? null : proximo,
    }
  }, [jogos, palpites, now])

  // Banner cômico: tem jogo aberto sem palpite? (espírito do Copa, §6.5)
  const esqueceu = jogos.some((j) => {
    const diff = Date.parse(j.kickoff) - now
    const locked = j.travadoManual || diff <= 0
    const p = palpites[j.id]
    return !locked && (!p || p.h === '' || p.a === '')
  })

  function salvar() {
    // Por enquanto só estado local — integração server-side vem com o Supabase.
    // eslint-disable-next-line no-console
    console.log('[palpites mock] salvar:', palpites)
    setSalvoEm(new Date())
  }

  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-md">
        {/* Cabeçalho */}
        <header className="mb-4">
          <h1 className="font-display text-2xl font-bold text-tinta-300">{rodadaNome}</h1>
          <p className="font-sans text-sm text-tinta-100">Palpite o placar de cada jogo</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Resumo label="Jogos" valor={totais} />
            <Resumo label="Abertos" valor={abertos} />
            <Resumo label="Palpitados" valor={`${palpitados}/${totais}`} />
          </div>

          {proximoMs !== null && (
            <p className="mt-3 text-center font-mono text-xs text-tinta-200">
              Próximo fecha em{' '}
              <span
                className={cx(
                  'font-bold',
                  proximoMs < URGENTE_MS ? 'text-raridade-frango-selo' : 'text-verde-badge',
                )}
              >
                {formatCountdown(proximoMs)}
              </span>
            </p>
          )}
        </header>

        {/* Banner cômico de "esqueceu de palpitar" */}
        {esqueceu && (
          <div className="mb-4 rounded-md border border-dourado-300 bg-dourado-50/60 px-3 py-2 text-center font-sans text-xs font-medium text-tinta-300">
            iii, mané… ainda tem jogo sem palpite! 👀
          </div>
        )}

        {/* Lista de jogos */}
        <div className="flex flex-col gap-3">
          {jogos.map((j) => (
            <CardJogo
              key={j.id}
              jogo={j}
              palpite={getPalpite(j.id)}
              now={now}
              onChange={(p) => setPalpite(j.id, p)}
            />
          ))}
        </div>
      </div>

      {/* Barra de salvar (fixa no rodapé) */}
      <div className="fixed inset-x-0 bottom-0 border-t border-papel-borda-300 bg-papel-100/95 px-4 py-3 backdrop-blur-sm">
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-tinta-100">
            {salvoEm
              ? `Salvo às ${salvoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : `${palpitados} de ${totais} palpitados`}
          </span>
          <button
            type="button"
            onClick={salvar}
            className="rounded-md border-2 border-dourado-300 bg-couro-300 px-6 py-2 font-display text-sm font-bold uppercase tracking-wider text-dourado-50 shadow-md transition-colors hover:bg-couro-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
          >
            Salvar Palpites
          </button>
        </div>
      </div>
    </main>
  )
}

function Resumo({ label, valor }: { label: string; valor: string | number }) {
  return (
    <div className="flex flex-col items-center rounded-md border border-papel-borda-200 bg-papel-50 py-2">
      <span className="font-mono text-lg font-bold leading-none text-tinta-300">{valor}</span>
      <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-tinta-100">
        {label}
      </span>
    </div>
  )
}
