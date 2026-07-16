'use client'

// RodadaAoVivo — tabela ao vivo da rodada em andamento.

import { useEffect, useMemo, useState } from 'react'
import { buscarRodadaAoVivo, type RodadaAoVivoDados, type LinhaRodadaAoVivo, type PalpiteCelula, type JogoRodada } from '@/lib/rodadaAoVivo'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const ZOACOES_ESQUECEU = [
  'iii mané, esqueceu de palpitar foi?',
  'Vai palpitar ou vai deixar barato?',
  'Ó o zero chegando... palpita aí!',
  'Tá esperando o quê? Um convite formal?',
  'Falta palpite. Não vai chorar depois, hein.',
  'A rodada não espera, colega.',
]
function frasesZoacaoAleatoria(): string {
  return ZOACOES_ESQUECEU[Math.floor(Math.random() * ZOACOES_ESQUECEU.length)]
}

function corCelula(cat: PalpiteCelula['categoria']): string {
  switch (cat) {
    case 'cravou': return 'bg-green-600 text-white'
    case 'saldo': return 'bg-blue-500 text-white'
    case 'vencedor': return 'bg-yellow-400 text-tinta-300'
    case 'errou': return 'bg-red-500 text-white'
    case 'aguardando': return 'bg-papel-borda-300 text-tinta-200'
    case 'np': return 'bg-papel-100 text-tinta-100'
  }
}

function corPts(pts: number | null): string {
  if (pts === null) return 'bg-papel-100 text-tinta-100'
  if (pts >= 20) return 'bg-green-100 text-green-800'
  if (pts >= 15) return 'bg-blue-100 text-blue-800'
  if (pts >= 10) return 'bg-yellow-100 text-yellow-800'
  if (pts >= 5) return 'bg-orange-100 text-orange-800'
  return 'bg-red-100 text-red-800'
}

function CabecalhoJogo({ jogo }: { jogo: JogoRodada }) {
  return (
    <div className="flex flex-col items-center gap-0.5 py-1">
      <div className="flex items-center gap-0.5">
        {jogo.homeEscudo && (
          <img
            src={jogo.homeEscudo}
            alt={jogo.home}
            className="h-4 w-4 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
        <span className="font-mono text-[9px] font-bold text-dourado-50">{jogo.homeAbrev}</span>
      </div>
      <span className="font-mono text-[7px] text-dourado-50/60">×</span>
      <div className="flex items-center gap-0.5">
        <span className="font-mono text-[9px] font-bold text-dourado-50">{jogo.awayAbrev}</span>
        {jogo.awayEscudo && (
          <img
            src={jogo.awayEscudo}
            alt={jogo.away}
            className="h-4 w-4 object-contain"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.display = 'none' }}
          />
        )}
      </div>
      {jogo.temResultado && (
        <span className="mt-0.5 rounded bg-dourado-100 px-1 py-0.5 font-mono text-[9px] font-bold text-dourado-700">
          {jogo.home_score}×{jogo.away_score}
        </span>
      )}
    </div>
  )
}

function CelulaPalpite({ celula }: { celula: PalpiteCelula }) {
  if (celula.categoria === 'np') {
    return (
      <div className="flex h-10 items-center justify-center rounded bg-papel-100 px-1 text-center font-mono text-[10px] italic text-tinta-100">
        NP
      </div>
    )
  }
  return (
    <div className={cx('flex h-10 flex-col items-center justify-center rounded px-1 text-center', corCelula(celula.categoria))}>
      <span className="font-mono text-[11px] font-bold leading-tight">
        {celula.pred_h}×{celula.pred_a}
      </span>
      {celula.points !== null && celula.categoria !== 'aguardando' && (
        <span className="font-mono text-[8px] font-bold leading-none opacity-90">
          +{celula.points}
        </span>
      )}
    </div>
  )
}

function FrenteFrenteRodadaModal({
  jogadorA,
  jogadorB,
  jogos,
  onFechar,
}: {
  jogadorA: LinhaRodadaAoVivo
  jogadorB: LinhaRodadaAoVivo
  jogos: JogoRodada[]
  onFechar: () => void
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div
        className="w-full max-w-md overflow-hidden rounded-lg border-2 border-dourado-400 bg-papel-50 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b-2 border-dourado-300 bg-gradient-to-r from-dourado-100 to-dourado-50 px-4 py-3">
          <p className="font-display text-sm font-bold uppercase tracking-widest text-dourado-800">
            🥊 Frente a Frente — Rodada
          </p>
          <button type="button" onClick={onFechar} className="font-mono text-xs text-dourado-700 hover:text-dourado-900">
            ✕
          </button>
        </div>

        <div className="grid grid-cols-3 items-center gap-2 border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
          <div className="text-center">
            <p className="truncate font-display text-sm font-bold text-tinta-300">{jogadorA.nome}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-dourado-700">{jogadorA.ptsRodada}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">pts rodada</p>
          </div>
          <div className="text-center font-mono text-xs uppercase tracking-widest text-tinta-100">vs</div>
          <div className="text-center">
            <p className="truncate font-display text-sm font-bold text-tinta-300">{jogadorB.nome}</p>
            <p className="mt-1 font-mono text-2xl font-bold text-dourado-700">{jogadorB.ptsRodada}</p>
            <p className="font-mono text-[9px] uppercase text-tinta-100">pts rodada</p>
          </div>
        </div>

        <div className="max-h-[50vh] overflow-y-auto">
          {jogos.map((j, i) => {
            const cA = jogadorA.celulas[i]
            const cB = jogadorB.celulas[i]
            return (
              <div key={j.matchId} className="border-b border-papel-borda-200 px-4 py-2.5 last:border-0">
                <div className="mb-1.5 text-center font-sans text-xs font-semibold text-tinta-300">
                  {j.home} × {j.away}
                  {j.temResultado && (
                    <span className="ml-2 font-mono font-bold text-dourado-600">
                      ({j.home_score}×{j.away_score})
                    </span>
                  )}
                </div>
                <div className="grid grid-cols-3 items-center gap-2">
                  <div className={cx('flex flex-col items-center justify-center rounded px-1 py-1', corCelula(cA.categoria))}>
                    <span className="font-mono text-xs font-bold">
                      {cA.pred_h !== null ? `${cA.pred_h}×${cA.pred_a}` : '—'}
                    </span>
                    {cA.points !== null && cA.categoria !== 'aguardando' && (
                      <span className="font-mono text-[9px] font-bold opacity-90">+{cA.points}</span>
                    )}
                  </div>
                  <div className="text-center font-mono text-[10px] text-tinta-100">vs</div>
                  <div className={cx('flex flex-col items-center justify-center rounded px-1 py-1', corCelula(cB.categoria))}>
                    <span className="font-mono text-xs font-bold">
                      {cB.pred_h !== null ? `${cB.pred_h}×${cB.pred_a}` : '—'}
                    </span>
                    {cB.points !== null && cB.categoria !== 'aguardando' && (
                      <span className="font-mono text-[9px] font-bold opacity-90">+{cB.points}</span>
                    )}
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>
    </div>
  )
}

export function RodadaAoVivo() {
  const [dados, setDados] = useState<RodadaAoVivoDados | null>(null)
  const [carregando, setCarregando] = useState(true)
  const [atualizando, setAtualizando] = useState(false)
  const [erro, setErro] = useState<string | null>(null)
  const [meuId, setMeuId] = useState<string | null>(null)
  const [ultimaAtualizacao, setUltimaAtualizacao] = useState<Date | null>(null)
  const [frenteFrente, setFrenteFrente] = useState<{ a: LinhaRodadaAoVivo; b: LinhaRodadaAoVivo } | null>(null)
  const [zoacao] = useState<string>(() => frasesZoacaoAleatoria())

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        setMeuId(sessao.id)
      }
    } catch { /* ignora */ }

    carregar()
  }, [])

  async function carregar() {
    setCarregando(true)
    setErro(null)
    try {
      const r = await buscarRodadaAoVivo()
      setDados(r)
      setUltimaAtualizacao(new Date())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setCarregando(false)
    }
  }

  async function atualizar() {
    setAtualizando(true)
    try {
      const r = await buscarRodadaAoVivo()
      setDados(r)
      setUltimaAtualizacao(new Date())
    } catch (e) {
      setErro((e as Error).message)
    } finally {
      setAtualizando(false)
    }
  }

  const esqueceuAlgum = useMemo(() => {
    if (!dados || !meuId) return false
    const minhaLinha = dados.linhas.find((l) => l.participantId === meuId)
    if (!minhaLinha) return true
    return minhaLinha.celulas.some((c, i) => {
      const jogo = dados.jogos[i]
      return !jogo.temResultado && c.categoria === 'np'
    })
  }, [dados, meuId])

  function abrirFrenteFrente(linha: LinhaRodadaAoVivo) {
    if (!dados) return
    let minhaLinha = dados.linhas.find((l) => l.participantId === meuId)
    if (!minhaLinha || minhaLinha.participantId === linha.participantId) {
      minhaLinha = dados.linhas[0]
    }
    if (!minhaLinha || minhaLinha.participantId === linha.participantId) return
    setFrenteFrente({ a: minhaLinha, b: linha })
  }

  if (carregando) {
    return <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-100">Carregando rodada...</main>
  }
  if (erro) {
    return <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-raridade-frango-selo">{erro}</main>
  }
  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6">
        <div className="max-w-sm rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center">
          <p className="mb-2 text-4xl">😴</p>
          <p className="font-display text-lg font-bold text-tinta-300">Sem rodada em andamento</p>
          <p className="mt-2 font-sans text-sm text-tinta-200">
            Aguarde o admin abrir a próxima rodada ou consulte o Histórico.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="min-h-screen bg-papel-200 px-2 pb-10 pt-6 sm:px-4">
      <div className="mx-auto max-w-4xl space-y-3">
        <header className="flex items-center justify-between px-2">
          <div>
            <h1 className="font-display text-2xl font-bold text-tinta-300">Rodada</h1>
            <p className="font-sans text-xs text-tinta-100">
              {dados.nome}
              {dados.isDouble && <span className="ml-2 rounded bg-dourado-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-dourado-700">⚡ VALE X2</span>}
            </p>
          </div>
          <button
            type="button"
            onClick={atualizar}
            disabled={atualizando}
            className="flex items-center gap-1.5 rounded-md border border-dourado-300 bg-papel-50 px-3 py-1.5 font-mono text-xs font-bold uppercase tracking-widest text-dourado-700 transition-colors hover:bg-dourado-50 disabled:opacity-50"
          >
            {atualizando ? '...' : '↻'} Atualizar
          </button>
        </header>

        {esqueceuAlgum && (
          <div className="rounded-lg border-2 border-raridade-frango-selo bg-couro-50 px-4 py-3">
            <p className="font-sans text-sm font-semibold text-raridade-frango-selo">🚨 {zoacao}</p>
            <p className="mt-1 font-sans text-xs text-couro-400">
              Você tem palpites em aberto. Vai lá na aba <b>Palpites</b>.
            </p>
          </div>
        )}

        {ultimaAtualizacao && (
          <p className="text-center font-mono text-[10px] text-tinta-100">
            Atualizado às {ultimaAtualizacao.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </p>
        )}

        <div className="overflow-x-auto rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-md scrollbar-tema">
          <table className="min-w-full border-separate border-spacing-0">
            <thead>
              <tr>
                <th className="sticky left-0 z-20 border-b-2 border-dourado-400 bg-couro-300 px-2 py-2 text-left font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Participante
                </th>
                {dados.jogos.map((j) => (
                  <th key={j.matchId} className="min-w-[64px] border-b-2 border-dourado-400 bg-couro-300 px-1 py-1 text-center">
                    <CabecalhoJogo jogo={j} />
                  </th>
                ))}
                <th className="border-b-2 border-dourado-400 bg-couro-300 px-3 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Pts
                </th>
                <th className="border-b-2 border-dourado-400 bg-couro-300 px-2 py-2 text-center font-mono text-[10px] uppercase tracking-widest text-dourado-50">
                  Hora
                </th>
              </tr>
            </thead>
            <tbody>
              {dados.linhas.map((linha, i) => {
                const ehMeu = linha.participantId === meuId
                return (
                  <tr
                    key={linha.participantId}
                    onClick={() => abrirFrenteFrente(linha)}
                    className={cx(
                      'cursor-pointer transition-colors hover:bg-papel-100',
                      ehMeu && 'bg-dourado-50/50',
                    )}
                  >
                    <td
                      className={cx(
                        'sticky left-0 z-10 whitespace-nowrap border-b border-papel-borda-200/60 bg-papel-50 px-2 py-2 font-sans text-xs font-semibold',
                        ehMeu && 'border-l-4 border-l-dourado-500 bg-dourado-50 text-dourado-800',
                      )}
                    >
                      <span className="font-mono text-[9px] text-tinta-100">{i + 1}.</span>{' '}
                      <span className={ehMeu ? 'font-bold' : 'text-tinta-300'}>
                        {linha.nome}
                      </span>
                    </td>
                    {linha.celulas.map((c) => (
                      <td key={c.matchId} className="border-b border-papel-borda-200/60 px-1 py-1.5">
                        <CelulaPalpite celula={c} />
                      </td>
                    ))}
                    <td className="border-b border-papel-borda-200/60 px-2 py-1.5">
                      <div
                        className={cx(
                          'flex h-10 items-center justify-center rounded px-2 text-center font-mono text-sm font-bold',
                          corPts(linha.palpitouAlgo ? linha.ptsRodada : null),
                        )}
                      >
                        {linha.palpitouAlgo ? linha.ptsRodada : '—'}
                      </div>
                    </td>
                    <td className="border-b border-papel-borda-200/60 px-2 py-1.5">
                      <div className="flex h-10 items-center justify-center rounded bg-papel-200 px-2 text-center font-mono text-[10px] text-tinta-300">
                        {linha.ultimoPalpiteEm
                          ? new Date(linha.ultimoPalpiteEm).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })
                          : '—'}
                      </div>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-3 rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2 font-mono text-[10px] text-tinta-100">
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-green-600" /> Cravou (+5)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-blue-500" /> Saldo (+3)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-yellow-400" /> Vencedor (+1)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-red-500" /> Errou (0)</span>
          <span className="flex items-center gap-1"><span className="h-2.5 w-2.5 rounded bg-papel-borda-300" /> Aguardando</span>
        </div>

        <p className="text-center font-mono text-[10px] italic text-tinta-100">
          👆 Toque em qualquer participante pra ver o frente a frente
        </p>
      </div>

      {frenteFrente && dados && (
        <FrenteFrenteRodadaModal
          jogadorA={frenteFrente.a}
          jogadorB={frenteFrente.b}
          jogos={dados.jogos}
          onFechar={() => setFrenteFrente(null)}
        />
      )}
    </main>
  )
}

