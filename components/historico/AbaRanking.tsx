import type { LinhaRankingRodada } from '@/lib/historicoReal'
import { AvatarNome } from './AvatarNome'

function medalha(pos: number): string {
  if (pos === 1) return '🥇'
  if (pos === 2) return '🥈'
  if (pos === 3) return '🥉'
  return `${pos}º`
}

export function AbaRanking({
  linhas,
  meuParticipantId,
}: {
  linhas: LinhaRankingRodada[]
  meuParticipantId: string | null
}) {
  if (linhas.length === 0) {
    return <p className="py-4 text-center font-sans text-sm text-tinta-100">Sem ranking registrado.</p>
  }

  return (
    <div className="overflow-hidden rounded-md border border-papel-borda-200">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr className="font-mono text-[9px] uppercase tracking-wider text-tinta-200">
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-center w-10">#</th>
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-left">Nome</th>
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-right">Pts</th>
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-right">Crav.</th>
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-right">Venc.</th>
            <th className="border-b border-papel-borda-200 bg-papel-200 px-2 py-1.5 text-right">Saldo</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const eu = l.participantId === meuParticipantId
            return (
              <tr key={l.participantId} className={eu ? 'bg-dourado-50' : ''}>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-xs text-tinta-200">
                  {medalha(l.position)}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5">
                  <AvatarNome avatar={l.avatar} emoji={l.emoji} nome={l.nome} tema="claro" />
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs font-bold text-tinta-300">
                  {l.pontos}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs text-tinta-200">
                  {l.cravadas}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs text-tinta-200">
                  {l.vencedor}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs text-tinta-200">
                  {l.saldo}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}
