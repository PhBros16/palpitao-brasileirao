// Sala de Troféus — grid dos troféus DESBLOQUEADOS (bloqueados não aparecem).
// Placeholder de ícone + nome + cor do tier conforme TROFEUS.md (tier→metal):
// 1 bronze · 2 prata · 3 e 4 ouro. O desenho fino dos ícones é fase de design.

import type { TierTrofeu, TrofeuItem } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

// Classes LITERAIS por tier (JIT). Usam os tokens trofeu-tier{1-4}-* (tier→metal).
const TIER_MOLDURA: Record<TierTrofeu, string> = {
  1: 'border-trofeu-tier1-100 bg-trofeu-tier1-50/40',
  2: 'border-trofeu-tier2-100 bg-trofeu-tier2-50/40',
  3: 'border-trofeu-tier3-100 bg-trofeu-tier3-50/40',
  4: 'border-trofeu-tier4-100 bg-trofeu-tier4-50/40',
}
const TIER_DISCO: Record<TierTrofeu, string> = {
  1: 'bg-trofeu-tier1-100',
  2: 'bg-trofeu-tier2-100',
  3: 'bg-trofeu-tier3-100',
  4: 'bg-trofeu-tier4-100',
}
const TIER_NOME: Record<TierTrofeu, string> = {
  1: 'Bronze',
  2: 'Prata',
  3: 'Ouro',
  4: 'Ouro',
}

export function SalaTrofeus({ trofeus, total }: { trofeus: TrofeuItem[]; total: number }) {
  return (
    <div className="flex flex-col gap-3">
      <p className="font-mono text-xs text-tinta-200">
        <span className="font-bold text-tinta-300">{trofeus.length}</span> de {total} conquistados
      </p>

      {trofeus.length === 0 ? (
        <p className="rounded-md border border-papel-borda-200 bg-papel-50 px-3 py-6 text-center font-sans text-sm italic text-tinta-100">
          Nenhum troféu ainda — bora pontuar! 🏆
        </p>
      ) : (
        <div className="grid grid-cols-3 gap-3">
          {trofeus.map((t) => (
            <div
              key={t.id}
              className={cx(
                'flex flex-col items-center gap-2 rounded-lg border-2 p-3 text-center',
                TIER_MOLDURA[t.tier],
              )}
            >
              {/* Placeholder do ícone (objeto colecionável vem na fase de design) */}
              <span className={cx('flex h-12 w-12 items-center justify-center rounded-full shadow-inner', TIER_DISCO[t.tier])}>
                <span className="text-xl">🏆</span>
              </span>
              <span className="font-sans text-[11px] font-bold leading-tight text-tinta-300">{t.nome}</span>
              <span className="font-mono text-[8px] uppercase tracking-wider text-tinta-100">{TIER_NOME[t.tier]}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
