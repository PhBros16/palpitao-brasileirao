'use client'

// Sala de Troféus — mostra os 34 troféus organizados em 4 tiers.
// Conquistados aparecem coloridos + selo dourado; bloqueados ficam
// acinzentados com a descrição do que falta pra desbloquear.
//
// Fonte: lib/trofeusReal.buscarTrofeusJogador(participantId).
// Cores por tier: bronze (1) · prata (2) · ouro (3) · lendário (4).

import { useEffect, useState } from 'react'
import { buscarTrofeusJogador, type TrofeuReal, type TrofeusDoJogador, type TierTrofeuNum } from '@/lib/trofeusReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const TIER_LABEL: Record<TierTrofeuNum, string> = {
  1: 'Bronze — Todo mundo consegue',
  2: 'Prata — Precisa jogar bem',
  3: 'Ouro — Só os cascas grossa',
  4: 'Lendário — Uma vez na vida',
}

const TIER_COR_BORDA: Record<TierTrofeuNum, string> = {
  1: 'border-orange-400',
  2: 'border-gray-400',
  3: 'border-dourado-500',
  4: 'border-purple-600',
}

const TIER_COR_DISCO: Record<TierTrofeuNum, string> = {
  1: 'bg-gradient-to-br from-orange-300 to-orange-500',
  2: 'bg-gradient-to-br from-gray-300 to-gray-500',
  3: 'bg-gradient-to-br from-dourado-300 to-dourado-500',
  4: 'bg-gradient-to-br from-purple-400 to-purple-700',
}

const TIER_COR_TITULO: Record<TierTrofeuNum, string> = {
  1: 'text-orange-700',
  2: 'text-gray-600',
  3: 'text-dourado-700',
  4: 'text-purple-700',
}

// Componente antigo mantido só pra não quebrar tipos legados
export function SalaTrofeus(_props: any) {
  const [dados, setDados] = useState<TrofeusDoJogador | null>(null)
  const [erro, setErro] = useState<string | null>(null)

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

    buscarTrofeusJogador(pid)
      .then(setDados)
      .catch((e) => setErro((e as Error).message))
  }, [])

  if (erro) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-raridade-frango-selo">{erro}</div>
  }
  if (!dados) {
    return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-100">Carregando troféus...</div>
  }

  const porTier: Record<TierTrofeuNum, TrofeuReal[]> = { 1: [], 2: [], 3: [], 4: [] }
  for (const t of dados.trofeus) porTier[t.tier].push(t)

  return (
    <div className="flex flex-col gap-4">
      {/* Contador geral */}
      <div className="flex items-center justify-between rounded-lg border-2 border-dourado-400 bg-gradient-to-r from-dourado-100 to-dourado-50 px-4 py-3 shadow-sm">
        <div>
          <p className="font-display text-sm font-bold uppercase tracking-wide text-dourado-800">🏛️ Sala de Troféus</p>
          <p className="mt-0.5 font-sans text-xs text-tinta-200">{dados.nome}</p>
        </div>
        <div className="text-right">
          <p className="font-mono text-2xl font-bold text-dourado-700">
            {dados.totalConquistados}
            <span className="text-base text-tinta-100">/{dados.totalGeral}</span>
          </p>
          <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Conquistados</p>
        </div>
      </div>

      {/* Barra de progresso geral */}
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <div className="h-2 overflow-hidden rounded-full bg-papel-200">
          <div
            className="h-full rounded-full bg-gradient-to-r from-dourado-400 to-dourado-600 transition-all duration-1000"
            style={{ width: `${Math.round((dados.totalConquistados / dados.totalGeral) * 100)}%` }}
          />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] uppercase tracking-widest text-tinta-100">
          {Math.round((dados.totalConquistados / dados.totalGeral) * 100)}% completo
        </p>
      </div>

      {/* 4 tiers */}
      {([1, 2, 3, 4] as TierTrofeuNum[]).map((tier) => (
        <TierBloco key={tier} tier={tier} trofeus={porTier[tier]} />
      ))}
    </div>
  )
}

function TierBloco({ tier, trofeus }: { tier: TierTrofeuNum; trofeus: TrofeuReal[] }) {
  const conquistados = trofeus.filter((t) => t.unlocked).length
  return (
    <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
      <div className="mb-3 flex items-center justify-between">
        <p className={cx('font-display text-sm font-bold uppercase tracking-wide', TIER_COR_TITULO[tier])}>
          {TIER_LABEL[tier]}
        </p>
        <p className="font-mono text-xs text-tinta-100">
          <b className="text-tinta-300">{conquistados}</b>/{trofeus.length}
        </p>
      </div>
      <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
        {trofeus.map((t) => (
          <CardTrofeu key={t.id} trofeu={t} />
        ))}
      </div>
    </div>
  )
}

function CardTrofeu({ trofeu }: { trofeu: TrofeuReal }) {
  const { unlocked, tier, icon, label, desc } = trofeu
  return (
    <div
      className={cx(
        'group relative flex flex-col items-center gap-1.5 rounded-lg border-2 p-2.5 text-center transition-all',
        unlocked
          ? cx(TIER_COR_BORDA[tier], 'bg-papel-50 shadow-sm hover:shadow-md')
          : 'border-papel-borda-200 bg-papel-100/60 opacity-50 grayscale',
      )}
      title={desc}
    >
      {/* Selo de conquistado */}
      {unlocked && (
        <span className="absolute right-1 top-1 flex h-4 w-4 items-center justify-center rounded-full bg-green-600 text-[8px] text-white shadow-sm">
          ✓
        </span>
      )}

      {/* Disco com ícone */}
      <span
        className={cx(
          'flex h-12 w-12 items-center justify-center rounded-full shadow-inner',
          unlocked ? TIER_COR_DISCO[tier] : 'bg-papel-borda-300',
        )}
      >
        <span className={cx('text-2xl', !unlocked && 'opacity-60')}>{icon}</span>
      </span>

      {/* Nome */}
      <p className={cx('font-display text-[11px] font-bold leading-tight', unlocked ? 'text-tinta-300' : 'text-tinta-100')}>
        {label}
      </p>

      {/* Descrição (aparece pequenininha, sempre) */}
      <p className="font-sans text-[9px] leading-tight text-tinta-100">
        {desc}
      </p>
    </div>
  )
}
