'use client'

// HomeReal — conteúdo específico da tela /inicio.
//
// Header, Nav e Player agora vêm do AppLayout que envolve esta tela.
// Aqui fica só o conteúdo próprio da Home:
//   1. Card da rodada atual
//   2. Parcial da rodada (sem foto — só emoji ao lado do nome)
//   3. Frango da rodada anterior
//   4. Por Placar
//   5. Distribuição de palpites
//   6. Pódio atual

import { useCallback, useEffect, useState } from 'react'
import { buscarHomeCompleta, type HomeCompleta, type ParcialLinha, type PlacaresJogo, type DistribuicaoJogo, type PodioLinha } from '@/lib/homeReal'
import { AvatarCirculo } from './HeaderUsuario'
import { useRegistrarAtualizar } from './AtualizarContext'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function formatarCountdown(ms: number): string {
  if (ms <= 0) return 'fechou'
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 60) return `${totalMin}min`
  const horas = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (horas < 24) return `${horas}h${mins > 0 ? ` ${mins}min` : ''}`
  const dias = Math.floor(horas / 24)
  const hRest = horas % 24
  return `${dias}d${hRest > 0 ? ` ${hRest}h` : ''}`
}

export function HomeReal() {
  const [dados, setDados] = useState<HomeCompleta | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [atualizando, setAtualizando] = useState(false)

  useEffect(() => {
    let pid: string | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        pid = sessao.id
      }
    } catch { /* ignora */ }

    if (!pid) return
    setParticipantId(pid)
    carregar(pid)
  }, [])

  async function carregar(pid: string) {
    setErro(null)
    try {
      const d = await buscarHomeCompleta(pid)
      setDados(d)
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  const atualizar = useCallback(async () => {
    if (!participantId) return
    setAtualizando(true)
    try {
      const d = await buscarHomeCompleta(participantId)
      setDados(d)
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setAtualizando(false)
    }
  }, [participantId])

  useRegistrarAtualizar(participantId ? atualizar : null, atualizando)

  return (
    <>
      {erro && (
        <div className="rounded-lg border border-raridade-frango-selo bg-red-50 p-3 text-center font-sans text-sm text-raridade-frango-selo">
          {erro}
        </div>
      )}

      {!dados && !erro && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-100">
          Carregando dados da rodada...
        </div>
      )}

      {dados && (
        <>
          {/* Card da rodada */}
          {dados.rodada ? (
            <CardRodada rodada={dados.rodada} stats={dados.stats} />
          ) : (
            <div className="rounded-lg border-2 border-dourado-300 bg-papel-50 p-6 text-center shadow-sm">
              <p className="mb-2 text-4xl">😴</p>
              <p className="font-display text-base font-bold text-tinta-300">Sem rodada em andamento</p>
              <p className="mt-1 font-sans text-xs text-tinta-200">Aguarde o admin abrir a próxima rodada.</p>
            </div>
          )}

          {/* Parcial */}
          {dados.parcial.length > 0 && participantId && (
            <BlocoParcial linhas={dados.parcial} meuId={participantId} isDouble={dados.rodada?.isDouble ?? false} />
          )}

          {/* Frango */}
          {dados.frango && <BlocoFrango frango={dados.frango} />}

          {/* Por Placar */}
          {dados.placares.length > 0 && <BlocoPorPlacar placares={dados.placares} />}

          {/* Distribuição */}
          {dados.distribuicao.length > 0 && <BlocoDistribuicao distribuicao={dados.distribuicao} />}

          {/* Pódio */}
          {dados.podio.length > 0 && <BlocoPodio podio={dados.podio} />}

        </>
      )}
    </>
  )
}

// ─── Card da Rodada ─────────────────────────────────────────────────────────

function CardRodada({ rodada, stats }: { rodada: NonNullable<HomeCompleta['rodada']>; stats: HomeCompleta['stats'] }) {
  return (
    <div className="rounded-lg border-2 border-dourado-300 bg-gradient-to-br from-dourado-50 to-papel-50 p-4 shadow-md">
      <div className="mb-3 text-center">
        <h2 className="font-display text-2xl font-bold uppercase tracking-wide text-dourado-800">
          {rodada.nome}
        </h2>
        {rodada.isDouble && (
          <span className="mt-1 inline-block rounded bg-dourado-200 px-2 py-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-800">
            ⚡ Vale x2
          </span>
        )}
      </div>

      {stats && (
        <div className="mb-3 grid grid-cols-2 gap-2">
          <CardBig label="Na rodada" valor={stats.ptsRodada ?? 0} sub="pts acumulados" />
          <CardBig
            label="Ranking"
            valor={stats.posicaoRanking}
            sub={stats.ptsPraSubir ? `${stats.ptsPraSubir}pts p/ subir` : 'Você é o líder! 👑'}
            valorSufixo="º"
          />
        </div>
      )}

      <div className="grid grid-cols-3 gap-2">
        <MiniCard label="Jogos totais" valor={rodada.jogosTotais} />
        <MiniCard label="Jogos abertos" valor={rodada.jogosAbertos} />
        <MiniCard label="Cravei quantos" valor={stats?.cravadasRodada ?? 0} destaque="verde" />
      </div>

      {rodada.proximoJogoFechaEm !== null && (
        <p className="mt-3 text-center font-mono text-xs text-tinta-200">
          ⏱ Próximo fecha em <b className="text-dourado-700">{formatarCountdown(rodada.proximoJogoFechaEm)}</b>
        </p>
      )}
    </div>
  )
}

function CardBig({ label, valor, sub, valorSufixo }: { label: string; valor: number; sub: string; valorSufixo?: string }) {
  return (
    <div className="rounded-lg border border-dourado-300 bg-papel-50 p-3 text-center shadow-sm">
      <p className="mb-1 font-mono text-[9px] uppercase tracking-widest text-tinta-100">{label}</p>
      <p className="font-mono text-3xl font-bold text-dourado-700">
        {valor}{valorSufixo && <span className="text-lg">{valorSufixo}</span>}
      </p>
      <p className="mt-1 font-mono text-[9px] text-tinta-200">{sub}</p>
    </div>
  )
}

function MiniCard({ label, valor, destaque }: { label: string; valor: number; destaque?: 'verde' }) {
  return (
    <div className="rounded-lg border border-papel-borda-300 bg-papel-100 p-2 text-center">
      <p className={cx('font-mono text-xl font-bold', destaque === 'verde' && valor > 0 ? 'text-green-700' : 'text-tinta-300')}>
        {valor}
      </p>
      <p className="mt-0.5 font-mono text-[8px] uppercase tracking-widest text-tinta-100 leading-tight">{label}</p>
    </div>
  )
}

// ─── Parcial (SEM foto — só emoji ao lado do nome) ──────────────────────────

function BlocoParcial({ linhas, meuId, isDouble }: { linhas: ParcialLinha[]; meuId: string; isDouble: boolean }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      <div className="flex items-center justify-between border-b-2 border-dourado-400 bg-couro-300 px-3 py-2">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-50">
          📊 Parcial
        </p>
        <div className="flex gap-1.5">
          <span className="rounded bg-dourado-50/20 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-dourado-50">
            Em andamento
          </span>
          {isDouble && (
            <span className="rounded bg-dourado-500 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest text-dourado-50">
              ×2
            </span>
          )}
        </div>
      </div>
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-1.5 text-center font-mono text-[9px] uppercase tracking-widest text-tinta-100">#</th>
            <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-1.5 text-left font-mono text-[9px] uppercase tracking-widest text-tinta-100">Participante</th>
            <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-1.5 text-right font-mono text-[9px] uppercase tracking-widest text-tinta-100">Pts Rod.</th>
            <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-1.5 text-right font-mono text-[9px] uppercase tracking-widest text-tinta-100">Total</th>
          </tr>
        </thead>
        <tbody>
          {linhas.map((l) => {
            const ehMeu = l.participantId === meuId
            const medalha = l.posicao === 1 ? '🥇' : l.posicao === 2 ? '🥈' : l.posicao === 3 ? '🥉' : null
            return (
              <tr key={l.participantId} className={cx(ehMeu && 'bg-dourado-50/60')}>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-xs">
                  {medalha ? <span className="text-base">{medalha}</span> : <span className="text-tinta-200">{l.posicao}</span>}
                </td>
                <td className={cx('border-b border-papel-borda-200/60 px-2 py-1.5 font-sans text-xs font-semibold', ehMeu ? 'text-dourado-800' : 'text-tinta-300')}>
                  <div className="flex items-center gap-1.5">
                    {l.emoji && <span className="text-sm leading-none">{l.emoji}</span>}
                    <span className="truncate">{l.nome}</span>
                  </div>
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs">
                  {l.ptsRodada === null ? (
                    <span className="text-raridade-frango-selo">NP</span>
                  ) : (
                    <span className="font-bold text-tinta-300">{l.ptsRodada || '—'}</span>
                  )}
                </td>
                <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-right font-mono text-xs font-bold text-dourado-700">
                  {l.totalGeral}
                </td>
              </tr>
            )
          })}
        </tbody>
      </table>
    </div>
  )
}

// ─── Frango ─────────────────────────────────────────────────────────────────

function BlocoFrango({ frango }: { frango: NonNullable<HomeCompleta['frango']> }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-raridade-frango-selo bg-papel-50 shadow-sm">
      <div className="border-b-2 border-raridade-frango-selo bg-red-50 px-3 py-2 text-center">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-raridade-frango-selo">
          🐔 Pior Palpiteiro
        </p>
        <p className="font-mono text-[9px] text-tinta-100">Administração atualiza após cada rodada</p>
      </div>
      {frango.photoUrl && (
        <div className="border-b border-papel-borda-200 bg-papel-100 p-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={frango.photoUrl}
            alt={frango.playerName}
            className="mx-auto max-h-56 w-full rounded object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        </div>
      )}
      <div className="px-3 py-3 text-center">
        <p className="font-display text-base font-bold text-raridade-frango-selo">
          😂 {frango.playerName}
        </p>
        {frango.text && (
          <p className="mt-1.5 font-sans text-xs italic text-tinta-200">"{frango.text}"</p>
        )}
      </div>
    </div>
  )
}

// ─── Por Placar ─────────────────────────────────────────────────────────────

function BlocoPorPlacar({ placares }: { placares: PlacaresJogo[] }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      <div className="border-b-2 border-dourado-400 bg-couro-300 px-3 py-2">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-50">
          🔢 Por Placar
        </p>
      </div>
      <div className="divide-y divide-papel-borda-200/60">
        {placares.map((p) => (
          <div key={p.matchId} className="px-3 py-2">
            <p className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">
              {p.home} × {p.away}
            </p>
            <div className="flex flex-wrap gap-1.5">
              {p.placares.map((pl) => (
                <span
                  key={pl.placar}
                  className="rounded border border-dourado-300 bg-papel-100 px-1.5 py-0.5 font-mono text-[11px]"
                >
                  <b className="text-dourado-700">{pl.placar}</b>
                  <span className="ml-1 text-tinta-100">{pl.qtd}x</span>
                </span>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}

// ─── Distribuição ───────────────────────────────────────────────────────────

function BlocoDistribuicao({ distribuicao }: { distribuicao: DistribuicaoJogo[] }) {
  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      <div className="border-b-2 border-dourado-400 bg-couro-300 px-3 py-2">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-50">
          🎯 Distribuição de Palpites
        </p>
        <p className="font-mono text-[9px] text-dourado-50/80">
          {distribuicao.length} jogo{distribuicao.length !== 1 ? 's' : ''} com palpites
        </p>
      </div>
      <div className="divide-y divide-papel-borda-200/60">
        {distribuicao.map((d) => (
          <PizzaJogo key={d.matchId} d={d} />
        ))}
      </div>
    </div>
  )
}

function PizzaJogo({ d }: { d: DistribuicaoJogo }) {
  const pctMandante = Math.round((d.mandante / d.totalPalpites) * 100)
  const pctEmpate = Math.round((d.empate / d.totalPalpites) * 100)
  const pctVisitante = 100 - pctMandante - pctEmpate

  const anguloMandante = (d.mandante / d.totalPalpites) * 360
  const anguloEmpate = (d.empate / d.totalPalpites) * 360

  return (
    <div className="px-3 py-2.5">
      <p className="mb-2 font-sans text-xs font-semibold text-tinta-300">{d.home} × {d.away}</p>
      <div className="flex items-center gap-3">
        <PizzaSvg
          anguloMandante={anguloMandante}
          anguloEmpate={anguloEmpate}
          total={d.totalPalpites}
        />
        <div className="flex-1 space-y-1 font-mono text-[11px]">
          <LinhaLegenda cor="bg-dourado-500" nome={d.home} pct={pctMandante} qtd={d.mandante} />
          <LinhaLegenda cor="bg-purple-500" nome="Empate" pct={pctEmpate} qtd={d.empate} />
          <LinhaLegenda cor="bg-blue-500" nome={d.away} pct={pctVisitante} qtd={d.visitante} />
        </div>
      </div>
    </div>
  )
}

function LinhaLegenda({ cor, nome, pct, qtd }: { cor: string; nome: string; pct: number; qtd: number }) {
  return (
    <div className="flex items-center gap-1.5">
      <span className={cx('h-2.5 w-2.5 flex-shrink-0 rounded', cor)} />
      <span className="flex-1 truncate text-tinta-300">{nome}</span>
      <span className="font-bold text-tinta-300">{pct}%</span>
      <span className="text-tinta-100">({qtd})</span>
    </div>
  )
}

function PizzaSvg({ anguloMandante, anguloEmpate, total }: { anguloMandante: number; anguloEmpate: number; total: number }) {
  const cx = 40, cy = 40, r = 35
  function ponto(anguloDeg: number) {
    const rad = ((anguloDeg - 90) * Math.PI) / 180
    return [cx + r * Math.cos(rad), cy + r * Math.sin(rad)]
  }
  function arco(inicio: number, fim: number, cor: string) {
    if (fim - inicio <= 0.01) return null
    const [x1, y1] = ponto(inicio)
    const [x2, y2] = ponto(fim)
    const large = fim - inicio > 180 ? 1 : 0
    if (fim - inicio >= 359.99) {
      return <circle cx={cx} cy={cy} r={r} fill={cor} />
    }
    const d = `M ${cx} ${cy} L ${x1} ${y1} A ${r} ${r} 0 ${large} 1 ${x2} ${y2} Z`
    return <path d={d} fill={cor} />
  }

  return (
    <svg width={80} height={80} viewBox="0 0 80 80" className="flex-shrink-0">
      {arco(0, anguloMandante, '#D4A017')}
      {arco(anguloMandante, anguloMandante + anguloEmpate, '#9333EA')}
      {arco(anguloMandante + anguloEmpate, 360, '#3B82F6')}
      <circle cx={cx} cy={cy} r={14} fill="#F5EBD7" />
      <text
        x={cx}
        y={cy + 4}
        textAnchor="middle"
        fontSize="12"
        fontWeight="bold"
        fill="#3E2A1A"
        fontFamily="monospace"
      >
        {total}
      </text>
    </svg>
  )
}

// ─── Pódio ──────────────────────────────────────────────────────────────────

function BlocoPodio({ podio }: { podio: PodioLinha[] }) {
  const seq = [
    { pos: 2, item: podio[1] ?? null, altura: 'h-16', bg: 'bg-gray-200 border-gray-400', medalha: '🥈' },
    { pos: 1, item: podio[0] ?? null, altura: 'h-24', bg: 'bg-dourado-200 border-dourado-500', medalha: '👑' },
    { pos: 3, item: podio[2] ?? null, altura: 'h-12', bg: 'bg-orange-200 border-orange-500', medalha: '🥉' },
  ]

  return (
    <div className="overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      <div className="border-b-2 border-dourado-400 bg-couro-300 px-3 py-2">
        <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-50">
          🏆 Pódio Atual
        </p>
      </div>
      <div className="flex items-end justify-center gap-2 p-4">
        {seq.map(({ pos, item, altura, bg, medalha }) => {
          if (!item) return <div key={pos} className="w-20" />
          const isFirst = pos === 1
          return (
            <div key={pos} className="flex flex-col items-center gap-1" style={{ width: isFirst ? 90 : 75 }}>
              <span className={cx(isFirst ? 'text-2xl' : 'text-lg')}>{medalha}</span>
              <AvatarCirculo
                avatar={item.avatar}
                emoji={item.emoji}
                nome={item.nome}
                tamanho={isFirst ? 'grande' : 'medio'}
              />
              <p className={cx('truncate text-center font-sans text-[11px] font-semibold text-tinta-300', isFirst && 'font-bold')}>
                {item.nome.split(' ')[0]}
              </p>
              <div className={cx('flex w-full items-center justify-center rounded-t-md border-2 border-b-0', bg, altura)}>
                <span className={cx('font-mono font-bold text-tinta-300', isFirst ? 'text-2xl' : 'text-lg')}>
                  {item.pts}
                </span>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
