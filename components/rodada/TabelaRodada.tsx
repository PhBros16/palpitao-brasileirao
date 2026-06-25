'use client'

// TabelaRodada — a tela mais densa do app: grade participantes × jogos.
//
// Coluna "Participante" fixa (sticky) à esquerda + scroll horizontal dos jogos.
// Cada célula: palpite NxN + badge de pts (verde cravada / cinza parcial /
// vermelho zero). Colunas finais: PTS da rodada e HORA do palpite. Tocar no
// nome de outro participante abre o modal Frente a Frente.
//
// (CLAUDE.md §6.5: a densidade pra mobile é item de design próprio. Esta versão
// resolve com coluna fixa + scroll horizontal; refinamentos de UX podem vir.)

import { useState } from 'react'
import { FrenteAFrente } from './FrenteAFrente'
import type { CelulaPalpite, DadosRodada, LinhaParticipante } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function sig(nome: string): string {
  return nome
    .normalize('NFD')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
    .slice(0, 3)
    .toUpperCase()
}

function badgeClasse(pts: number | null): string {
  if (pts === null) return 'text-tinta-100'
  if (pts >= 5) return 'bg-verde-badge text-papel-50'
  if (pts > 0) return 'bg-papel-borda-400 text-tinta-300'
  return 'bg-raridade-frango-selo text-papel-50'
}

export function TabelaRodada({ dados }: { dados: DadosRodada }) {
  const [selecionado, setSelecionado] = useState<LinhaParticipante | null>(null)
  const voce = dados.linhas.find((l) => l.ehVoce) ?? dados.linhas[0]

  return (
    <main className="min-h-screen bg-papel-200 px-3 py-6">
      <div className="mx-auto max-w-3xl">
        <header className="mb-3 px-1">
          <h1 className="font-display text-2xl font-bold text-tinta-300">Tabela da Rodada</h1>
          <p className="font-sans text-sm text-tinta-100">
            {dados.rodadaNome} · Rodada {dados.rodadaNumero} — toque num nome para o frente a frente
          </p>
        </header>

        <div className="overflow-x-auto rounded-lg border border-papel-borda-200">
          <table className="border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 border-b border-r-2 border-papel-borda-300 bg-papel-200 px-3 py-2 text-left font-mono text-[10px] uppercase tracking-wider text-tinta-200">
                  Participante
                </th>
                {dados.jogos.map((j) => (
                  <th
                    key={j.id}
                    className="border-b border-papel-borda-200 bg-papel-200 px-1 py-2 text-center font-mono text-[9px] leading-tight text-tinta-100"
                  >
                    {sig(j.home)}
                    <br />
                    <span className="text-tinta-100/60">×</span>
                    <br />
                    {sig(j.away)}
                  </th>
                ))}
                <th className="border-b border-l border-papel-borda-200 bg-papel-200 px-2 py-2 text-center font-mono text-[9px] uppercase text-tinta-200">
                  Pts
                </th>
                <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-center font-mono text-[9px] uppercase text-tinta-200">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.map((linha) => (
                <tr key={linha.id} className={cx(linha.ehVoce && 'bg-dourado-50/40')}>
                  <td
                    className={cx(
                      'sticky left-0 z-10 border-b border-r-2 border-papel-borda-300 px-3 py-2',
                      linha.ehVoce ? 'bg-dourado-50' : 'bg-papel-50',
                    )}
                  >
                    {linha.ehVoce ? (
                      <span className="font-sans text-xs font-bold text-tinta-300">{linha.nome} (você)</span>
                    ) : (
                      <button
                        type="button"
                        onClick={() => setSelecionado(linha)}
                        className="font-sans text-xs font-semibold text-couro-200 underline-offset-2 hover:underline focus:outline-none focus-visible:underline"
                      >
                        {linha.nome}
                      </button>
                    )}
                  </td>
                  {dados.jogos.map((j) => (
                    <Celula key={j.id} celula={linha.celulas[j.id]} />
                  ))}
                  <td className="border-b border-l border-papel-borda-200 px-2 py-2 text-center font-mono text-sm font-bold text-tinta-300">
                    {linha.totalRodada}
                  </td>
                  <td className="border-b border-papel-borda-200 px-2 py-2 text-center font-mono text-[10px] text-tinta-100">
                    {linha.hora ?? '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1 px-1 font-mono text-[10px] text-tinta-100">
          <Legenda cor="bg-verde-badge" txt="cravada (5)" />
          <Legenda cor="bg-papel-borda-400" txt="acerto parcial (1–3)" />
          <Legenda cor="bg-raridade-frango-selo" txt="errou (0)" />
        </div>
      </div>

      {selecionado && (
        <FrenteAFrente voce={voce} outro={selecionado} jogos={dados.jogos} onClose={() => setSelecionado(null)} />
      )}
    </main>
  )
}

function Celula({ celula }: { celula: CelulaPalpite | undefined }) {
  const c = celula ?? { palpite: null, pts: null }
  return (
    <td className="border-b border-papel-borda-200/60 px-1.5 py-1.5 text-center">
      <div className="font-mono text-xs text-tinta-300">
        {c.palpite ? `${c.palpite.h}x${c.palpite.a}` : '—'}
      </div>
      {c.pts !== null && (
        <span
          className={cx(
            'mt-0.5 inline-block min-w-[16px] rounded px-1 font-mono text-[10px] font-bold leading-tight',
            badgeClasse(c.pts),
          )}
        >
          {c.pts}
        </span>
      )}
    </td>
  )
}

function Legenda({ cor, txt }: { cor: string; txt: string }) {
  return (
    <span className="flex items-center gap-1">
      <span className={cx('h-2.5 w-2.5 rounded-sm', cor)} />
      {txt}
    </span>
  )
}
