'use client'

import { useState } from 'react'
import type { RodadaHistorico, DetalheRodadaHistorico } from '@/lib/historicoReal'
import { AvatarNome } from './AvatarNome'
import { AbaRanking } from './AbaRanking'
import { AbaJogos } from './AbaJogos'
import { AbaFrango } from './AbaFrango'

type Aba = 'ranking' | 'jogos' | 'frango'

export function CardRodadaHistorico({
  rodada,
  expandida,
  detalhe,
  carregandoDetalhe,
  meuParticipantId,
  onToggle,
}: {
  rodada: RodadaHistorico
  expandida: boolean
  detalhe: DetalheRodadaHistorico | null
  carregandoDetalhe: boolean
  meuParticipantId: string | null
  onToggle: () => void
}) {
  const [aba, setAba] = useState<Aba>('ranking')

  return (
    <div id={`rodada-${rodada.id}`} className="scroll-mt-4 overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50 shadow-sm">
      <button
        type="button"
        onClick={onToggle}
        className="w-full border-b border-papel-borda-200 bg-gradient-to-br from-couro-100 to-couro-50 p-3 text-left transition-colors hover:from-couro-200 hover:to-couro-100"
      >
        <div className="flex items-start justify-between gap-2">
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-1.5">
              <h2 className="font-display text-base font-bold uppercase tracking-wide text-papel-50">
                {rodada.name}
              </h2>
              {rodada.isDouble && (
                <span className="rounded-sm bg-dourado-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-couro-900">
                  ⚡ Vale x2
                </span>
              )}
            </div>
            <p className="mt-0.5 font-mono text-[10px] text-papel-100">
              {rodada.totalJogos} jogo{rodada.totalJogos === 1 ? '' : 's'}
            </p>
          </div>
          <span className="font-mono text-lg text-dourado-300">
            {expandida ? '▲' : '▼'}
          </span>
        </div>

        <div className="mt-2 flex flex-wrap items-center justify-between gap-2 rounded border border-couro-700 bg-couro-900/40 px-2 py-1.5">
          {rodada.campeao ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs">🏆</span>
              <AvatarNome
                avatar={rodada.campeao.avatar}
                emoji={rodada.campeao.emoji}
                nome={rodada.campeao.nome}
                tema="escuro"
              />
              <span className="font-mono text-xs font-bold text-dourado-300">
                {rodada.campeao.pts} pts
              </span>
            </div>
          ) : (
            <span className="font-mono text-[10px] text-papel-100">Sem campeão registrado</span>
          )}
          {meuParticipantId && rodada.meusPontos !== null && (
            <span className="rounded border border-dourado-400 bg-couro-900/60 px-1.5 py-0.5 font-mono text-[10px] font-bold text-dourado-200">
              Você: {rodada.meusPontos} pts
            </span>
          )}
        </div>
      </button>

      {expandida && (
        <div className="bg-papel-50">
          {carregandoDetalhe && (
            <div className="p-4 text-center font-sans text-sm text-tinta-100">
              Carregando detalhes...
            </div>
          )}
          {!carregandoDetalhe && detalhe && (
            <>
              <div className="flex border-b border-papel-borda-200 bg-papel-100">
                <TabBtn label="🏅 Ranking" ativa={aba === 'ranking'} onClick={() => setAba('ranking')} />
                <TabBtn label="⚽ Jogos" ativa={aba === 'jogos'} onClick={() => setAba('jogos')} />
                <TabBtn
                  label="🐔 Frango"
                  ativa={aba === 'frango'}
                  onClick={() => setAba('frango')}
                  disabled={!detalhe.frango}
                />
              </div>
              <div className="p-3">
                {aba === 'ranking' && <AbaRanking linhas={detalhe.ranking} meuParticipantId={meuParticipantId} />}
                {aba === 'jogos' && <AbaJogos jogos={detalhe.jogos} />}
                {aba === 'frango' && <AbaFrango frango={detalhe.frango} />}
              </div>
            </>
          )}
        </div>
      )}
    </div>
  )
}

function TabBtn({
  label,
  ativa,
  onClick,
  disabled,
}: {
  label: string
  ativa: boolean
  onClick: () => void
  disabled?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        'flex-1 border-b-2 px-2 py-2 font-display text-[11px] font-bold uppercase tracking-wider transition-colors',
        ativa ? 'border-couro-500 bg-papel-50 text-couro-700' : 'border-transparent text-tinta-100 hover:bg-papel-200',
        disabled ? 'opacity-40 cursor-not-allowed' : '',
      ].join(' ')}
    >
      {label}
    </button>
  )
}
