import type { FrangoHistorico } from '@/lib/historicoReal'

export function AbaFrango({ frango }: { frango: FrangoHistorico | null }) {
  if (!frango) {
    return <p className="py-4 text-center font-sans text-sm text-tinta-100">Sem frango nesta rodada. 🎉</p>
  }

  return (
    <div className="rounded-md border-2 border-raridade-frango-selo bg-red-50 p-3 dark:bg-red-950/40">
      <div className="flex items-center gap-2 border-b border-raridade-frango-selo/40 pb-2">
        <span className="text-2xl">🐔</span>
        <div>
          <p className="font-mono text-[10px] uppercase tracking-widest text-raridade-frango-selo">
            Frango da Rodada
          </p>
          <p className="font-display text-lg font-bold text-tinta-300">{frango.playerName}</p>
        </div>
      </div>
      {frango.photoUrl && (
        <div className="mt-3 flex justify-center">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frango.photoUrl}
            alt={`Frango de ${frango.playerName}`}
            className="max-h-64 rounded border-2 border-raridade-frango-selo/40 object-contain"
          />
        </div>
      )}
      {frango.text && (
        <p className="mt-3 font-sans text-sm italic text-tinta-300">"{frango.text}"</p>
      )}
    </div>
  )
}
