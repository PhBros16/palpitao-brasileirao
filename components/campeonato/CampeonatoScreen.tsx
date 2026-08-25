'use client'

import { useMemo, useState } from 'react'
import { CardEnvelope } from '@/components/home/CardEnvelope'
import { Modal } from '@/components/home/Modal'
import { getEscudo } from '@/lib/escudos'
import type { DadosCampeonato, LinhaTabela, JogoBrasileirao } from '@/lib/campeonatoReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Sub = 'tabela' | 'estatisticas' | 'agenda' | 'resultados'

const ABAS: [Sub, string][] = [
  ['tabela', 'Tabela'],
  ['estatisticas', 'Stats'],
  ['agenda', 'Agenda'],
  ['resultados', 'Resultados'],
]

export function CampeonatoScreen({ dados }: { dados: DadosCampeonato }) {
  const [sub, setSub] = useState<Sub>('tabela')
  const [timeSel, setTimeSel] = useState<LinhaTabela | null>(null)

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-dourado-50">Série A</h1>

      <div className="flex gap-1 rounded-lg border border-papel-borda-200 bg-papel-50 p-1">
        {ABAS.map(([s, label]) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cx(
              'flex-1 rounded-md px-2 py-1.5 font-sans text-xs font-semibold transition-colors',
              sub === s ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
            )}
          >
            {label}
          </button>
        ))}
      </div>

      {sub === 'tabela' && <TabelaBrasileirao linhas={dados.tabela} onClickTime={setTimeSel} />}
      {sub === 'estatisticas' && (
        <EstatisticasCampeonato
          dados={dados}
          onClickTime={(nome) => {
            const t = dados.tabela.find((x) => x.time === nome)
            if (t) setTimeSel(t)
          }}
        />
      )}
      {sub === 'agenda' && <AgendaCampeonato jogos={dados.proximosJogos} tipo="proximos" />}
      {sub === 'resultados' && <AgendaCampeonato jogos={dados.ultimosResultados} tipo="resultados" />}

      {timeSel && (
        <ModalTime
          time={timeSel}
          jogos={dados.ultimosResultados}
          projecao={dados.estatisticas.projecoes.find((p) => p.time === timeSel.time)}
          onFechar={() => setTimeSel(null)}
        />
      )}
    </>
  )
}

// ─── 1. Tabela ───────────────────────────────────────────────────────────────

function TabelaBrasileirao({
  linhas,
  onClickTime,
}: {
  linhas: LinhaTabela[]
  onClickTime: (t: LinhaTabela) => void
}) {
  if (linhas.length === 0) {
    return <div className="rounded-lg bg-papel-100 p-6 text-center text-sm text-tinta-200">Nenhum jogo registrado ainda.</div>
  }

  function getBordaLateral(zona: LinhaTabela['zona']) {
    if (zona === 'libertadores') return 'border-l-4 border-l-blue-600'
    if (zona === 'pre-libertadores') return 'border-l-4 border-l-cyan-400'
    if (zona === 'sulamericana') return 'border-l-4 border-l-green-600'
    if (zona === 'z4') return 'border-l-4 border-l-red-600'
    return 'border-l-4 border-l-transparent'
  }

  function BolinhaForma({ res }: { res: 'V' | 'E' | 'D' }) {
    const cores = { V: 'bg-green-600', E: 'bg-gray-400', D: 'bg-red-600' }
    return (
      <span className={cx('flex h-3.5 w-3.5 items-center justify-center rounded-full text-[7px] font-bold text-white', cores[res])}>
        {res}
      </span>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <CardEnvelope titulo="🏆 Tabela Oficial">
        <div className="overflow-x-auto scrollbar-tema">
          <table className="w-full border-separate border-spacing-0 whitespace-nowrap">
            <thead>
              <tr className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">
                <th className="w-6 border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">#</th>
                <th className="sticky left-0 z-10 w-36 border-b border-r-2 border-papel-borda-200 border-r-papel-borda-300 bg-papel-100 px-2 py-2 text-left">Clube</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center font-bold text-tinta-300">Pts</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">J</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">V</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">E</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">D</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">GP</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">GC</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center font-bold">SG</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">Últ. 5</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr
                  key={l.time}
                  onClick={() => onClickTime(l)}
                  className="cursor-pointer transition-colors hover:bg-papel-100"
                >
                  <td className={cx('border-b border-papel-borda-200/60 px-1.5 py-2 text-center font-mono text-xs font-bold text-tinta-200', getBordaLateral(l.zona))}>
                    {l.posicao}
                  </td>
                  <td className="sticky left-0 z-10 border-b border-r-2 border-papel-borda-200/60 border-r-papel-borda-300 bg-papel-50 px-2 py-2">
                    <div className="flex items-center gap-2">
                      <img src={getEscudo(l.time)} alt={l.time} className="h-5 w-5 object-contain" />
                      <span className="max-w-[110px] truncate font-sans text-xs font-semibold text-tinta-300">{l.time}</span>
                    </div>
                  </td>
                  <td className="border-b border-papel-borda-200/60 bg-papel-100/50 px-2 py-2 text-center font-mono text-xs font-bold text-tinta-300">{l.pontos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.jogos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.vitorias}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.empates}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.derrotas}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.golsMarcados}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs text-tinta-200">{l.golsSofridos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs font-bold text-tinta-300">{l.saldoGols}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center">
                    <div className="flex items-center justify-center gap-1">
                      {l.ultimos5.map((res, idx) => <BolinhaForma key={idx} res={res} />)}
                      {[...Array(Math.max(0, 5 - l.ultimos5.length))].map((_, i) => (
                        <span key={`vazio-${i}`} className="h-3.5 w-3.5 rounded-full bg-papel-borda-300" />
                      ))}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="border-t border-papel-borda-200 bg-papel-100 p-3">
          <p className="mb-1.5 font-mono text-[9px] uppercase tracking-widest text-tinta-100">
            👆 Toque em um time pra ver detalhes completos
          </p>
          <div className="grid grid-cols-2 gap-1.5 font-sans text-[10px] text-tinta-200">
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-blue-600" /> Libertadores</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-cyan-400" /> Pré-Libertadores</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-green-600" /> Sul-Americana</span>
            <span className="flex items-center gap-1.5"><span className="h-2.5 w-2.5 rounded bg-red-600" /> Rebaixamento</span>
          </div>
        </div>
      </CardEnvelope>
    </div>
  )
}

// ─── 2. Estatísticas ─────────────────────────────────────────────────────────

function EstatisticasCampeonato({
  dados,
  onClickTime,
}: {
  dados: DadosCampeonato
  onClickTime: (nome: string) => void
}) {
  const e = dados.estatisticas
  const [filtroEvo, setFiltroEvo] = useState(5)

  const timesEvo = useMemo(() => dados.tabela.slice(0, filtroEvo), [dados.tabela, filtroEvo])
  const maxPtsEvo = Math.max(...timesEvo.map((t) => t.pontos), 1)

  const CORES_EVO = [
    '#059669', '#DC2626', '#2563EB', '#B8860B', '#D97706', '#7C3AED', 
    '#4F46E5', '#DB2777', '#C026D3', '#E11D48', '#0D9488', '#0891B2', 
    '#0284C7', '#0369A1', '#1D4ED8', '#4338CA', '#5B21B6', '#7E22CE', '#A21CAF', '#BE185D'
  ]

  // Cálculo dinâmico das probabilidades baseado em pontos projetados
  const chancesTitulo = useMemo(() => {
    const maxProj = Math.max(...e.projecoes.map(p => p.projecaoFinal), 1)
    return e.projecoes
      .map(p => {
        const diff = maxProj - p.projecaoFinal
        let chance = 0
        if (diff === 0) chance = 68
        else if (diff <= 3) chance = 22
        else if (diff <= 6) chance = 8
        else if (diff <= 9) chance = 2
        return { time: p.time, chance, proj: p.projecaoFinal }
      })
      .filter(t => t.chance > 0)
      .sort((a, b) => b.chance - a.chance)
  }, [e.projecoes])

  const riscoZ4 = useMemo(() => {
    return e.projecoes
      .map(p => {
        let risco = 0
        if (p.projecaoFinal <= 35) risco = 99
        else if (p.projecaoFinal <= 39) risco = 85
        else if (p.projecaoFinal <= 42) risco = 55
        else if (p.projecaoFinal <= 44) risco = 25
        else if (p.projecaoFinal === 45) risco = 8
        return { time: p.time, risco, proj: p.projecaoFinal }
      })
      .filter(t => t.risco > 0)
      .sort((a, b) => b.risco - a.risco)
  }, [e.projecoes])

  function ListaExpandivel({ titulo, icone, corTexto, lista, sufixo = '' }: {
    titulo: string; icone: string; corTexto: string; lista: Array<{ time: string; valor: number }>; sufixo?: string
  }) {
    if (lista.length === 0) return null
    return (
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className={cx('mb-2 font-mono text-[10px] uppercase tracking-widest', corTexto)}>
          {icone} {titulo}
        </p>
        <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-tema">
          {lista.map((item, i) => (
            <button
              key={item.time}
              type="button"
              onClick={() => onClickTime(item.time)}
              className="flex w-full items-center justify-between rounded px-1 py-0.5 hover:bg-papel-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
                <img src={getEscudo(item.time)} alt="" className="h-4 w-4 object-contain" />
                <span className="font-sans text-xs font-semibold text-tinta-300">{item.time}</span>
              </div>
              <span className="font-mono text-xs font-bold text-tinta-300">{item.valor}{sufixo}</span>
            </button>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-3">

      {/* PROJEÇÃO DO CAMPEONATO (NO TOPO) */}
      <CardEnvelope titulo="🔮 Projeção do Campeonato">
        <div className="border-b border-papel-borda-200 bg-papel-100 px-3 py-2">
          <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-200">Fórmula da Projeção</p>
          <p className="mt-0.5 font-sans text-[11px] font-semibold text-tinta-300">
            <code>Projeção = (Pontos Atuais ÷ Jogos Disputados) × 38 rodadas</code>
          </p>
          <p className="mt-0.5 font-sans text-[10px] text-tinta-200">
            <i>Exemplo (Flamengo):</i> (45 pts ÷ 23 jogos) = 1.95 pts/jogo × 38 = <b>74 pts projetados</b>.
          </p>
        </div>
        <div className="max-h-72 space-y-1 overflow-y-auto p-2 scrollbar-tema">
          {[...e.projecoes].sort((a, b) => b.projecaoFinal - a.projecaoFinal).map((t, i) => (
            <button
              key={t.time}
              type="button"
              onClick={() => onClickTime(t.time)}
              className="flex w-full items-center justify-between border-b border-papel-borda-200/60 px-1 pb-1.5 last:border-0 hover:bg-papel-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
                <img src={getEscudo(t.time)} alt="" className="h-4 w-4 object-contain" />
                <span className="font-sans text-xs font-semibold text-tinta-300">{t.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {t.risco === 'titulo' && <span className="rounded bg-dourado-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-dourado-700">🏆 Título</span>}
                {t.risco === 'libertadores' && <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-700">G4</span>}
                {t.risco === 'sulamericana' && <span className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-green-700">Sula</span>}
                {t.risco === 'rebaixamento' && <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-700">🚨 Z4</span>}
                <span className="w-12 text-right font-mono text-xs font-bold text-tinta-300">{t.projecaoFinal} pts</span>
              </div>
            </button>
          ))}
        </div>
      </CardEnvelope>

      {/* PROBABILIDADES MATEMÁTICAS (TÍTULO E Z4) */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <div className="rounded-lg border border-dourado-300 bg-dourado-50 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-dourado-800">🏆 Chance de Título</p>
          <p className="mb-3 font-sans text-[9px] text-dourado-700 italic">Baseado em projeção $\ge 72$ pts</p>
          <div className="space-y-3">
            {chancesTitulo.length === 0 && <p className="font-sans text-[10px] text-dourado-700">Disputa aberta</p>}
            {chancesTitulo.map((t) => (
              <div key={t.time}>
                <div className="mb-1 flex items-center justify-between font-sans text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-dourado-900">
                    <img src={getEscudo(t.time)} className="h-3.5 w-3.5 object-contain" alt="" />
                    {t.time}
                  </span>
                  <span className="font-mono font-bold text-dourado-700">{t.chance}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-dourado-200/50">
                  <div className="h-full rounded-full bg-dourado-500 transition-all duration-500" style={{ width: `${t.chance}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="rounded-lg border border-red-300 bg-red-50 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-red-800">🚨 Risco de Rebaixamento</p>
          <p className="mb-3 font-sans text-[9px] text-red-700 italic">Baseado em nota de corte de 45 pts</p>
          <div className="max-h-48 space-y-3 overflow-y-auto pr-1 scrollbar-tema">
            {riscoZ4.length === 0 && <p className="font-sans text-[10px] text-red-700">Nenhum time em risco crítico</p>}
            {riscoZ4.map((t) => (
              <div key={t.time}>
                <div className="mb-1 flex items-center justify-between font-sans text-xs">
                  <span className="flex items-center gap-1.5 font-semibold text-red-900">
                    <img src={getEscudo(t.time)} className="h-3.5 w-3.5 object-contain" alt="" />
                    {t.time}
                  </span>
                  <span className="font-mono font-bold text-red-700">{t.risco}%</span>
                </div>
                <div className="h-1.5 overflow-hidden rounded-full bg-red-200/50">
                  <div className="h-full rounded-full bg-red-600 transition-all duration-500" style={{ width: `${t.risco}%` }} />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* GRÁFICO DE EVOLUÇÃO DOS TIMES */}
      {timesEvo.length > 0 && (
        <CardEnvelope titulo="📈 Evolução do Campeonato">
          <div className="p-3">
            <div className="mb-3 flex justify-center gap-2">
              {[
                { val: 3, label: 'G3' },
                { val: 5, label: 'G5' },
                { val: 10, label: 'G10' },
                { val: 20, label: 'Todos (G20)' },
              ].map((b) => (
                <button
                  key={b.val}
                  type="button"
                  onClick={() => setFiltroEvo(b.val)}
                  className={cx(
                    'rounded border px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-colors',
                    filtroEvo === b.val ? 'border-dourado-400 bg-dourado-100 text-dourado-700' : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100',
                  )}
                >
                  {b.label}
                </button>
              ))}
            </div>

            <div className="relative h-44 w-full overflow-hidden rounded bg-papel-100/50 p-2">
              <svg viewBox="0 0 300 100" className="h-full w-full">
                {timesEvo.map((t, idx) => {
                  const pts = t.evolucaoPts
                  if (pts.length < 2) return null
                  const totalPontos = pts.length
                  const denom = totalPontos > 1 ? totalPontos - 1 : 1
                  const path = pts.map((p, i) => {
                    const x = 10 + (i / denom) * 280
                    const y = 90 - (p / maxPtsEvo) * 80
                    return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
                  }).join(' ')

                  return (
                    <path
                      key={t.time}
                      d={path}
                      fill="none"
                      stroke={CORES_EVO[idx % CORES_EVO.length]}
                      strokeWidth={filtroEvo > 5 ? '1.5' : '2.5'}
                      strokeLinecap="round"
                    />
                  )
                })}
              </svg>
            </div>

            <div className="mt-3 flex max-h-24 flex-wrap justify-center gap-1.5 overflow-y-auto scrollbar-tema">
              {timesEvo.map((t, idx) => (
                <button
                  key={t.time}
                  type="button"
                  onClick={() => onClickTime(t.time)}
                  className="flex items-center gap-1 rounded bg-papel-100 px-1.5 py-0.5 font-sans text-[10px] font-semibold text-tinta-300 hover:underline"
                >
                  <span className="h-2 w-2 rounded-full" style={{ backgroundColor: CORES_EVO[idx % CORES_EVO.length] }} />
                  <span>{t.time}</span>
                </button>
              ))}
            </div>
          </div>
        </CardEnvelope>
      )}

      {/* CARDS DE RESUMO (COM RÓTULO CORRIGIDO) */}
      <div className="grid grid-cols-3 gap-2">
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2.5 text-center">
          <span className="font-mono text-xl font-bold text-tinta-300">{dados.totalJogosDisputados}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Jogos Realizados</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2.5 text-center">
          <span className="font-mono text-xl font-bold text-dourado-600">{dados.totalRodadasFinalizadas}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Rodadas Realizadas</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2.5 text-center">
          <span className="font-mono text-xl font-bold text-green-600">{e.mediaGolsGeral}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Gols/Jogo</span>
        </div>
      </div>

      {/* MÉDIA DE GOLS POR RODADA (COM DADOS POPULADOS DE R1 A R24) */}
      <CardEnvelope titulo="⚽ Média de Gols por Rodada">
        <div className="max-h-56 space-y-1.5 overflow-y-auto p-3 scrollbar-tema">
          {e.golsPorRodada.length === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">Nenhum dado de gols disponível.</p>
          ) : (
            e.golsPorRodada.map((r) => (
              <div key={r.roundNumber} className="flex items-center justify-between border-b border-papel-borda-200/60 pb-1 font-mono text-xs last:border-0">
                <span className="font-semibold text-tinta-300">{r.roundName}</span>
                <span className="text-tinta-100">{r.totalGols} gols</span>
                <span className="font-bold text-dourado-600">{r.mediaGols} gols/jogo</span>
              </div>
            ))
          )}
        </div>
      </CardEnvelope>

      {/* MAIOR GOLEADA */}
      {e.maiorGoleada && (
        <CardEnvelope titulo="🔥 Maior Goleada">
          <div className="flex flex-col items-center justify-center py-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-600">Saldo de +{e.maiorGoleada.saldoAbs}</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <img src={getEscudo(e.maiorGoleada.home)} className="h-10 w-10 object-contain" alt="" />
                <span className="font-sans text-[10px] font-bold text-tinta-300">{e.maiorGoleada.home}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-bold text-tinta-300">{e.maiorGoleada.homeScore}</span>
                <span className="text-xs text-tinta-100">×</span>
                <span className="font-mono text-3xl font-bold text-tinta-300">{e.maiorGoleada.awayScore}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src={getEscudo(e.maiorGoleada.away)} className="h-10 w-10 object-contain" alt="" />
                <span className="font-sans text-[10px] font-bold text-tinta-300">{e.maiorGoleada.away}</span>
              </div>
            </div>
          </div>
        </CardEnvelope>
      )}

      {/* OUTRAS ESTATÍSTICAS COM TODOS OS TIMES */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ListaExpandivel titulo="Melhor Ataque" icone="⚽" corTexto="text-green-700" lista={e.melhorAtaque} sufixo=" gols" />
        <ListaExpandivel titulo="Pior Defesa" icone="🥅" corTexto="text-red-700" lista={e.piorDefesa} sufixo=" sofridos" />
        <ListaExpandivel titulo="Mais Vitórias" icone="✅" corTexto="text-blue-700" lista={e.maisVitorias} sufixo=" vit" />
        <ListaExpandivel titulo="Rei do Empate" icone="🤝" corTexto="text-gray-600" lista={e.reiEmpate} sufixo=" emp" />
        <ListaExpandivel titulo="A Fortaleza (Clean Sheets)" icone="🧱" corTexto="text-orange-700" lista={e.fortaleza} sufixo=" jogos" />
      </div>
    </div>
  )
}

// ─── 3. Agenda / Resultados ───────────────────────────────────────────────────

function AgendaCampeonato({
  jogos,
  tipo,
}: {
  jogos: JogoBrasileirao[]
  tipo: 'proximos' | 'resultados'
}) {
  const rodadasUnicas = useMemo(() => {
    const map = new Map<number, string>()
    for (const j of jogos) map.set(j.roundNumber, j.roundName)
    return Array.from(map.entries())
      .sort((a, b) => (tipo === 'proximos' ? a[0] - b[0] : b[0] - a[0]))
      .map(([num, nome]) => ({ num, nome }))
  }, [jogos, tipo])

  const [filtro, setFiltro] = useState<string>('proximas')

  const opcoesFiltro = tipo === 'proximos'
    ? [
        { id: 'proximas', label: 'Próxima' },
        { id: '3', label: 'Próx. 3' },
        { id: '5', label: 'Próx. 5' },
        { id: 'todas', label: 'Todas' },
      ]
    : [
        { id: 'proximas', label: 'Última' },
        { id: '3', label: 'Últ. 3' },
        { id: '5', label: 'Últ. 5' },
        { id: 'todas', label: 'Todas' },
      ]

  const jogosFiltrados = useMemo(() => {
    if (jogos.length === 0) return []
    if (filtro === 'todas') return jogos
    if (filtro === 'proximas' || filtro === '3' || filtro === '5') {
      const qtd = filtro === 'proximas' ? 1 : parseInt(filtro, 10)
      const nums = rodadasUnicas.slice(0, qtd).map((r) => r.num)
      return jogos.filter((j) => nums.includes(j.roundNumber))
    }
    const n = parseInt(filtro, 10)
    return jogos.filter((j) => j.roundNumber === n)
  }, [jogos, filtro, rodadasUnicas])

  const porRodada = useMemo(() => {
    const map = new Map<string, JogoBrasileirao[]>()
    for (const j of jogosFiltrados) {
      if (!map.has(j.roundName)) map.set(j.roundName, [])
      map.get(j.roundName)!.push(j)
    }
    return Array.from(map.entries())
  }, [jogosFiltrados])

  function formatData(iso: string | null) {
    if (!iso) return 'A definir'
    const [, mes, dia] = iso.split('-')
    return `${dia}/${mes}`
  }

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap gap-1.5">
        {opcoesFiltro.map((o) => (
          <button
            key={o.id}
            type="button"
            onClick={() => setFiltro(o.id)}
            className={cx(
              'rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase transition-colors',
              filtro === o.id
                ? 'border-dourado-400 bg-dourado-100 text-dourado-700'
                : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-100',
            )}
          >
            {o.label}
          </button>
        ))}
      </div>

      {rodadasUnicas.length > 0 && (
        <select
          value={['proximas', '3', '5', 'todas'].includes(filtro) ? '' : filtro}
          onChange={(e) => { if (e.target.value) setFiltro(e.target.value) }}
          className="rounded border border-papel-borda-300 bg-papel-50 px-2 py-1.5 font-sans text-sm text-tinta-300 outline-none"
        >
          <option value="">Ir pra rodada específica...</option>
          {rodadasUnicas.map((r) => (
            <option key={r.num} value={String(r.num)}>{r.nome}</option>
          ))}
        </select>
      )}

      <CardEnvelope titulo={tipo === 'proximos' ? '📅 Próximos Jogos' : '✅ Resultados'}>
        <div className="space-y-4 p-3">
          {porRodada.length === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">
              {tipo === 'proximos' ? 'Nenhum jogo futuro cadastrado.' : 'Nenhum resultado registrado.'}
            </p>
          ) : (
            porRodada.map(([rodadaNome, lista]) => (
              <div key={rodadaNome} className="rounded-lg border border-papel-borda-200 bg-papel-100/50 p-2.5">
                <p className="mb-2 border-b border-papel-borda-200 pb-1 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-600">
                  {rodadaNome}
                </p>
                <div className="space-y-2">
                  {lista.map((j) => (
                    <div key={j.matchId} className="flex items-center justify-between rounded border border-papel-borda-200/60 bg-papel-50 p-2">
                      <div className="flex w-16 flex-col">
                        <span className="font-mono text-[10px] font-semibold text-tinta-300">{formatData(j.date)}</span>
                        {j.time && <span className="font-mono text-[9px] text-tinta-100">{j.time}</span>}
                      </div>

                      <div className="flex flex-1 items-center justify-center gap-2">
                        <div className="flex flex-1 items-center justify-end gap-1.5">
                          <span className="max-w-[80px] truncate font-sans text-xs font-semibold text-tinta-300">{j.home}</span>
                          <img src={getEscudo(j.home)} className="h-5 w-5 object-contain" alt="" />
                        </div>

                        {tipo === 'resultados' && j.homeScore !== null ? (
                          <div className="flex items-center gap-1.5 rounded bg-papel-200 px-2 py-0.5">
                            <span className="font-mono text-sm font-bold text-tinta-300">{j.homeScore}</span>
                            <span className="text-xs text-tinta-100">×</span>
                            <span className="font-mono text-sm font-bold text-tinta-300">{j.awayScore}</span>
                          </div>
                        ) : (
                          <span className="px-1 font-mono text-xs font-bold text-tinta-100">×</span>
                        )}

                        <div className="flex flex-1 items-center justify-start gap-1.5">
                          <img src={getEscudo(j.away)} className="h-5 w-5 object-contain" alt="" />
                          <span className="max-w-[80px] truncate font-sans text-xs font-semibold text-tinta-300">{j.away}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </CardEnvelope>
    </div>
  )
}

// ─── 4. Modal do Time (stats + evolução + TODOS os jogos) ────────────────────

function ModalTime({
  time,
  jogos,
  projecao,
  onFechar,
}: {
  time: LinhaTabela
  jogos: JogoBrasileirao[]
  projecao?: { projecaoFinal: number; risco: string }
  onFechar: () => void
}) {
  const jogosDoTime = useMemo(() => {
    return jogos
      .filter((j) => j.home === time.time || j.away === time.time)
      .filter((j) => j.homeScore !== null)
      .sort((a, b) => b.roundNumber - a.roundNumber)
  }, [jogos, time.time])

  const mediaGolsPro = time.jogos > 0 ? (time.golsMarcados / time.jogos).toFixed(1) : '0'
  const mediaGolsContra = time.jogos > 0 ? (time.golsSofridos / time.jogos).toFixed(1) : '0'

  const maxPts = Math.max(...(time.evolucaoPts.length ? time.evolucaoPts : [1]), 1)
  const pontos = time.evolucaoPts
  const w = 280, h = 80, pad = 8
  const path = pontos.length > 1
    ? pontos.map((p, i) => {
        const x = pad + (i / (pontos.length - 1)) * (w - pad * 2)
        const y = h - pad - (p / maxPts) * (h - pad * 2)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    : ''

  return (
    <Modal aberto onFechar={onFechar} borda="border-dourado-300" className="max-h-[90vh] overflow-y-auto">
      <div className="mb-4 flex items-center justify-between border-b border-papel-borda-200 pb-3">
        <div className="flex items-center gap-3">
          <img src={getEscudo(time.time)} alt="" className="h-12 w-12 object-contain" />
          <div>
            <p className="font-display text-lg font-bold text-tinta-300">{time.time}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">
              {time.posicao}º LUGAR · {time.pontos} PTS
            </p>
          </div>
        </div>

        {projecao && (
          <div className="flex flex-col items-end">
            {projecao.risco === 'titulo' && <span className="rounded bg-dourado-100 px-2 py-0.5 font-mono text-xs font-bold text-dourado-700">🏆 Título</span>}
            {projecao.risco === 'libertadores' && <span className="rounded bg-blue-100 px-2 py-0.5 font-mono text-xs font-bold text-blue-700">🔵 G4</span>}
            {projecao.risco === 'sulamericana' && <span className="rounded bg-green-100 px-2 py-0.5 font-mono text-xs font-bold text-green-700">🟢 Sula</span>}
            {projecao.risco === 'rebaixamento' && <span className="rounded bg-red-100 px-2 py-0.5 font-mono text-xs font-bold text-red-700">🚨 Risco Z4</span>}
            <span className="mt-0.5 font-mono text-[10px] text-tinta-200">Proj: {projecao.projecaoFinal} pts</span>
          </div>
        )}
      </div>

      <div className="mb-4 grid grid-cols-4 gap-2">
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-tinta-300">{time.jogos}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">J</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-green-600">{time.vitorias}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">V</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-gray-500">{time.empates}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">E</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-red-600">{time.derrotas}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">D</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-tinta-300">{time.golsMarcados}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">GP</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-tinta-300">{time.golsSofridos}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">GC</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-tinta-300">{time.saldoGols}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">SG</span></div>
        <div className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2"><span className="font-mono text-base font-bold text-dourado-600">{time.pontos}</span><span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">PTS</span></div>
      </div>

      <div className="mb-4 flex gap-2">
        <div className="flex flex-1 items-center justify-between rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2">
          <span className="font-sans text-xs text-tinta-200">Gols Feitos/Jogo:</span>
          <span className="font-mono text-sm font-bold text-green-700">{mediaGolsPro}</span>
        </div>
        <div className="flex flex-1 items-center justify-between rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2">
          <span className="font-sans text-xs text-tinta-200">Gols Sofridos/Jogo:</span>
          <span className="font-mono text-sm font-bold text-red-700">{mediaGolsContra}</span>
        </div>
      </div>

      {pontos.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">📈 Evolução de Pontos</p>
          <div className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
              <path d={path} fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-tinta-100">
              <span>R1</span>
              <span className="font-bold text-dourado-600">{time.pontos} pts hoje</span>
            </div>
          </div>
        </div>
      )}

      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">
          Jogos Realizados ({jogosDoTime.length})
        </p>
        <div className="max-h-60 space-y-1.5 overflow-y-auto scrollbar-tema">
          {jogosDoTime.map((j) => {
            const mandante = j.home === time.time
            const gf = mandante ? j.homeScore! : j.awayScore!
            const gs = mandante ? j.awayScore! : j.homeScore!
            const res = gf > gs ? 'V' : gf < gs ? 'D' : 'E'
            const cor = res === 'V' ? 'text-green-600' : res === 'D' ? 'text-red-600' : 'text-gray-500'
            const adversario = mandante ? j.away : j.home

            return (
              <div key={j.matchId} className="flex items-center justify-between rounded border border-papel-borda-200/60 bg-papel-50 px-2 py-1.5">
                <span className="w-16 font-mono text-[9px] font-semibold text-dourado-600">{j.roundName}</span>
                <div className="flex flex-1 items-center justify-center gap-2">
                  <span className="font-sans text-[10px] text-tinta-100">{mandante ? 'vs' : '@'}</span>
                  <img src={getEscudo(adversario)} className="h-4 w-4 object-contain" alt="" />
                  <span className="max-w-[90px] truncate font-sans text-xs font-semibold text-tinta-300">{adversario}</span>
                </div>
                <span className={cx('w-12 text-right font-mono text-xs font-bold', cor)}>
                  {gf}×{gs}
                </span>
              </div>
            )
          })}
        </div>
      </div>

      <div className="mt-4 flex justify-end">
        <button
          type="button"
          onClick={onFechar}
          className="rounded-md border border-papel-borda-300 px-4 py-2 font-mono text-xs font-bold uppercase text-tinta-200 hover:bg-papel-100"
        >
          Fechar
        </button>
      </div>
    </Modal>
  )
}
