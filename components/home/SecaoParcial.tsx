// Parcial — ranking parcial da rodada (conteúdo do accordion).

import type { ParcialLinha } from './tipos'

function posIcon(i: number): string {
  return i === 0 ? '🥇' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}º`
}

export function SecaoParcial({ linhas, finalizada }: { linhas: ParcialLinha[]; finalizada: boolean }) {
  return (
    <div>
      <div className="mb-2 flex items-center gap-2">
        <span
          className={
            finalizada
              ? 'rounded-full bg-verde-badge px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-papel-50'
              : 'rounded-full bg-dourado-300 px-2 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-tinta-300'
          }
        >
          {finalizada ? '✔ Finalizada' : 'Em andamento'}
        </span>
      </div>
      <div className="overflow-hidden rounded-md border border-papel-borda-200">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="bg-papel-200 font-mono text-[9px] uppercase tracking-wider text-tinta-100">
              <th className="w-8 px-2 py-1.5 text-center">#</th>
              <th className="px-2 py-1.5">Participante</th>
              <th className="px-2 py-1.5 text-right">Rod.</th>
              <th className="px-2 py-1.5 text-right">Total</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((d, i) => (
              <tr key={d.nome} className="border-t border-papel-borda-200/60">
                <td className="px-2 py-1.5 text-center font-mono text-xs text-tinta-200">{posIcon(i)}</td>
                <td className="px-2 py-1.5 font-sans text-xs text-tinta-300">{d.nome}</td>
                <td className="px-2 py-1.5 text-right font-mono text-xs">
                  {d.ptsRodada > 0 ? (
                    <span className="font-bold text-verde-badge">{d.ptsRodada}</span>
                  ) : d.palpitou ? (
                    <span className="text-tinta-100">—</span>
                  ) : (
                    <span className="font-bold text-raridade-frango-selo">NP</span>
                  )}
                </td>
                <td className="px-2 py-1.5 text-right font-mono text-xs font-bold text-tinta-300">{d.total}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="mt-2 font-mono text-[9px] text-tinta-100">NP = não palpitou nesta rodada</p>
    </div>
  )
}
