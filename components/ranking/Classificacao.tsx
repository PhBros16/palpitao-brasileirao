// Classificação — pódio top 3 + tabela completa.

import type { ClassificacaoLinha } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function ColunaPodio({
  linha,
  lugar,
  altura,
  base,
  medalha,
}: {
  linha?: ClassificacaoLinha
  lugar: number
  altura: string
  base: string
  medalha: string
}) {
  if (!linha) return <div className="flex-1" />
  return (
    <div className="flex flex-1 flex-col items-center justify-end gap-1">
      <span className="text-xl leading-none">{medalha}</span>
      <span className="max-w-full truncate text-center font-sans text-xs font-semibold text-tinta-300">
        {linha.nome}
      </span>
      <div className={cx('flex w-full flex-col items-center justify-start rounded-t-md pt-1.5', altura, base)}>
        <span className="font-display text-lg font-bold leading-none text-tinta-300">{lugar}º</span>
        <span className="mt-0.5 font-mono text-[10px] font-bold text-tinta-200">{linha.pontos}</span>
      </div>
    </div>
  )
}

export function Classificacao({ linhas }: { linhas: ClassificacaoLinha[] }) {
  return (
    <div className="flex flex-col gap-4">
      {/* Pódio */}
      <div className="flex items-end gap-2 px-2 pt-2">
        <ColunaPodio linha={linhas[1]} lugar={2} altura="h-16" base="bg-prata-100" medalha="🥈" />
        <ColunaPodio linha={linhas[0]} lugar={1} altura="h-24" base="bg-dourado-300" medalha="🥇" />
        <ColunaPodio linha={linhas[2]} lugar={3} altura="h-12" base="bg-bronze-100" medalha="🥉" />
      </div>

      {/* Tabela (scroll horizontal, # e Nome fixos) */}
      <div className="overflow-x-auto rounded-lg border border-papel-borda-200">
        <table className="border-separate border-spacing-0">
          <thead>
            <tr className="font-mono text-[9px] uppercase tracking-wider text-tinta-200">
              <th className="sticky left-0 z-20 border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-center">#</th>
              <th className="sticky left-8 z-20 border-b border-r-2 border-papel-borda-300 bg-papel-200 px-2 py-2 text-left">
                Nome
              </th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-3 py-2 text-right">Pontos</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Crav.</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Venc.</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Saldo</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Proj.%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((d, i) => (
              <tr key={d.nome}>
                <td className="sticky left-0 z-10 border-b border-papel-borda-200/60 bg-papel-50 px-2 py-2 text-center font-mono text-xs text-tinta-200">
                  {i + 1}
                </td>
                <td className="sticky left-8 z-10 border-b border-r-2 border-papel-borda-300 bg-papel-50 px-2 py-2 font-sans text-xs font-semibold text-tinta-300">
                  {d.nome}
                </td>
                <td className="border-b border-papel-borda-200/60 px-3 py-2 text-right font-mono text-xs font-bold text-tinta-300">
                  {d.pontos}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-2 text-right font-mono text-xs text-tinta-200">
                  {d.cravadas}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-2 text-right font-mono text-xs text-tinta-200">
                  {d.vencedor}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-2 text-right font-mono text-xs text-tinta-200">
                  {d.saldo}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-2 text-right font-mono text-xs font-bold text-dourado-600">
                  {d.projecao}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
