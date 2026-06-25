// Por Placar — para cada jogo, quantos palpitaram cada placar (sabedoria da
// multidão). Chips de almanaque, ordenados do mais palpitado ao menos.

import type { JogoResumo } from './tipos'

export function SecaoPorPlacar({ jogos }: { jogos: JogoResumo[] }) {
  return (
    <div className="flex flex-col gap-3">
      {jogos.map((j) => {
        const ordenados = [...j.placares].sort((a, b) => b.n - a.n)
        return (
          <div key={j.id}>
            <div className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">
              {j.home} <span className="text-tinta-100">×</span> {j.away}
            </div>
            <div className="flex flex-wrap gap-1.5">
              {ordenados.map((p) => (
                <span
                  key={p.placar}
                  className="flex items-center gap-1 rounded-full border border-papel-borda-300 bg-papel-100 px-2 py-0.5 font-mono text-[11px] text-tinta-300"
                >
                  <span className="font-bold">{p.placar}</span>
                  <span className="text-tinta-100">×{p.n}</span>
                </span>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
