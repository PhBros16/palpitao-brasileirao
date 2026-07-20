// Classificação — pódio top 3 + tabela completa.
// Linhas clicáveis se onClickLinha for passado (abre Frente a Frente).

import type { ClassificacaoLinha } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// Círculo de foto/iniciais 24×24 pra usar na tabela do ranking.
function AvatarMini({ avatar, nome }: { avatar: string | null; nome: string }) {
  if (avatar) {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-dourado-300 bg-papel-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={nome} className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-dourado-300 bg-dourado-100 font-mono text-[9px] font-bold text-dourado-700">
      {getIniciais(nome)}
    </span>
  )
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

export function Classificacao({
  linhas,
  onClickLinha,
}: {
  linhas: ClassificacaoLinha[]
  /** Opcional. Se passado, cada linha da tabela vira clicável. */
  onClickLinha?: (linha: ClassificacaoLinha) => void
}) {
  const clicavel = !!onClickLinha
  return (
    <div className="flex flex-col gap-4">
      {/* Pódio */}
      <div className="flex items-end gap-2 px-2 pt-2">
        <ColunaPodio linha={linhas[1]} lugar={2} altura="h-16" base="bg-prata-100" medalha="🥈" />
        <ColunaPodio linha={linhas[0]} lugar={1} altura="h-24" base="bg-dourado-300" medalha="🥇" />
        <ColunaPodio linha={linhas[2]} lugar={3} altura="h-12" base="bg-bronze-100" medalha="🥉" />
      </div>

      {/* Tabela — # e Nome fixos na esquerda; PTS/CRAV/etc. livres */}
      <div className="rounded-lg border border-papel-borda-200 overflow-hidden">
        <table className="w-full table-auto border-separate border-spacing-0">
          <thead>
            <tr className="font-mono text-[9px] uppercase tracking-wider text-tinta-200">
              <th className="sticky left-0 z-20 border-b border-papel-borda-200 bg-papel-200 w-10 px-1 py-2 text-center">#</th>
              <th className="sticky left-10 z-20 border-b border-r-2 border-papel-borda-300 bg-papel-200 px-2 py-2 text-left min-w-[120px]">
                Nome
              </th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-3 py-2 text-right">Pontos</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Crav.</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Venc.</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-2 text-right">Saldo</th>
              <th className="border-b border-papel-borda-200 bg-papel-200 py-2 pl-2 pr-4 text-right">Proj.%</th>
            </tr>
          </thead>
          <tbody>
            {linhas.map((d, i) => (
              <tr
                key={d.nome}
                onClick={clicavel ? () => onClickLinha!(d) : undefined}
                className={clicavel ? 'cursor-pointer transition-colors hover:bg-papel-100' : undefined}
              >
                <td className="sticky left-0 z-10 border-b border-papel-borda-200/60 bg-papel-50 w-10 px-1 py-2 text-center font-mono text-xs text-tinta-200">
                  {i + 1}
                </td>
                <td className="sticky left-10 z-10 border-b border-r-2 border-papel-borda-300 bg-papel-50 px-2 py-2 font-sans text-xs font-semibold text-tinta-300">
                  <div className="flex items-center gap-1">
                    <AvatarMini avatar={d.avatar} nome={d.nome} />
                    {d.emoji && <span className="text-sm leading-none">{d.emoji}</span>}
                    <span className="whitespace-nowrap">{d.nome}</span>
                  </div>
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
                <td className="border-b border-papel-borda-200/60 py-2 pl-2 pr-4 text-right font-mono text-xs font-bold text-dourado-600">
                  {d.projecao}%
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {clicavel && (
          <p className="border-t border-papel-borda-200 bg-papel-100 px-3 py-2 text-center font-mono text-[10px] italic text-tinta-100">
            👆 Toque em qualquer participante pra ver o comparativo frente a frente
          </p>
        )}
      </div>
    </div>
  )
}
