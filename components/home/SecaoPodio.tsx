// Pódio Atual — top 3 visual (2º · 1º · 3º), com alturas e metais distintos.

import type { PodioLinha } from './tipos'

function Coluna({
  linha,
  lugar,
  altura,
  base,
  medalha,
}: {
  linha?: PodioLinha
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
      <div className={`flex w-full ${altura} flex-col items-center justify-start rounded-t-md ${base} pt-1.5`}>
        <span className="font-display text-lg font-bold leading-none text-tinta-300">{lugar}º</span>
        <span className="mt-0.5 font-mono text-[10px] font-bold text-tinta-200">{linha.pts}</span>
      </div>
    </div>
  )
}

export function SecaoPodio({ podio }: { podio: PodioLinha[] }) {
  return (
    <div className="flex items-end gap-2 pt-2">
      <Coluna linha={podio[1]} lugar={2} altura="h-16" base="bg-prata-100" medalha="🥈" />
      <Coluna linha={podio[0]} lugar={1} altura="h-24" base="bg-dourado-300" medalha="🥇" />
      <Coluna linha={podio[2]} lugar={3} altura="h-12" base="bg-bronze-100" medalha="🥉" />
    </div>
  )
}
