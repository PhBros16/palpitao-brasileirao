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
      {sub === 'estatisticas' && <EstatisticasCampeonato dados={dados} onClickTime={(nome) => {
        const t = dados.tabela.find((x) => x.time === nome)
        if (t) setTimeSel(t)
      }} />}
      {sub === 'agenda' && <AgendaCampeonato jogos={dados.proximosJogos} tipo="proximos" />}
      {sub === 'resultados' && <AgendaCampeonato jogos={dados.ultimosResultados} tipo="resultados" />}

      {timeSel && (
        <ModalTime
          time={timeSel}
          jogos={[...dados.ultimosResultados, ...dados.proximosJogos]}
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
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center w-6">#</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-left sticky left-0 z-10 w-36 border-r-2 border-r-papel-borda-300">Clube</th>
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
                  className="cursor-pointer hover:bg-papel-100 transition-colors"
                >
                  <td className={cx('border-b border-papel-borda-200/60 px-1.5 py-2 text-center font-mono text-xs font-bold text-tinta-200', getBordaLateral(l.zona))}>
                    {l.posicao}
                  </td>
                  <td className="border-b border-r-2 border-r-papel-borda-300 border-papel-borda-200/60 bg-papel-50 px-2 py-2 sticky left-0 z-10">
                    <div className="flex items-center gap-2">
                      <img src={getEscudo(l.time)} alt={l.time} className="h-5 w-5 object-contain" />
                      <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[110px]">{l.time}</span>
                    </div>
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-2 text-center font-mono text-xs font-bold text-tinta-300 bg-papel-100/50">{l.pontos}</td>
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
            Toque em um time pra ver detalhes · Qualificação
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

  function ListaTop({ titulo, icone, corTexto, lista, sufixo = '' }: {
    titulo: string; icone: string; corTexto: string; lista: Array<{ time: string; valor: number }>; sufixo?: string
  }) {
    if (lista.length === 0) return null
    return (
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className={cx('mb-2 font-mono text-[10px] uppercase tracking-widest', corTexto)}>
          {icone} {titulo}
        </p>
        <div className="space-y-1.5">
          {lista.map((item, i) => (
            <button
              key={item.time}
              type="button"
              onClick={() => onClickTime(item.time)}
              className="flex w-full items-center justify-between rounded px-1 py-0.5 hover:bg-papel-100"
            >
              <div className="flex items-center gap-2">
                <span className="w-3 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
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
      <div className="grid grid-cols-2 gap-3">
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-3 text-center">
          <span className="font-mono text-2xl font-bold text-tinta-300">{dados.totalJogosDisputados}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Jogos Realizados</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-3 text-center">
          <span className="font-mono text-2xl font-bold text-dourado-600">{dados.totalRodadasFinalizadas}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">Rodadas Finais</span>
        </div>
      </div>

      {e.maiorGoleada && (
        <CardEnvelope titulo="🔥 Maior Goleada">
          <div className="flex flex-col items-center justify-center py-4">
            <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-600">Saldo de +{e.maiorGoleada.saldoAbs}</p>
            <div className="flex items-center gap-4">
              <div className="flex flex-col items-center gap-1">
                <img src={getEscudo(e.maiorGoleada.home)} className="h-10 w-10 object-contain" />
                <span className="font-sans text-[10px] font-bold text-tinta-300">{e.maiorGoleada.home}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="font-mono text-3xl font-bold text-tinta-300">{e.maiorGoleada.homeScore}</span>
                <span className="text-xs text-tinta-100">×</span>
                <span className="font-mono text-3xl font-bold text-tinta-300">{e.maiorGoleada.awayScore}</span>
              </div>
              <div className="flex flex-col items-center gap-1">
                <img src={getEscudo(e.maiorGoleada.away)} className="h-10 w-10 object-contain" />
                <span className="font-sans text-[10px] font-bold text-tinta-300">{e.maiorGoleada.away}</span>
              </div>
            </div>
          </div>
        </CardEnvelope>
      )}

      <CardEnvelope titulo="🔮 Projeção de Término (38 Rodadas)">
        <p className="px-3 pt-3 font-mono text-[9px] italic text-tinta-100">Simulação baseada no aproveitamento atual.</p>
        <div className="max-h-72 space-y-2 overflow-y-auto p-3 scrollbar-tema">
          {[...e.projecoes].sort((a, b) => b.projecaoFinal - a.projecaoFinal).map((t, i) => (
            <button
              key={t.time}
              type="button"
              onClick={() => onClickTime(t.time)}
              className="flex w-full items-center justify-between border-b border-papel-borda-200/60 pb-1.5 last:border-0 hover:bg-papel-100"
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

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <ListaTop titulo="Melhor Ataque" icone="⚽" corTexto="text-green-700" lista={e.melhorAtaque} sufixo=" gols" />
        <ListaTop titulo="Pior Defesa" icone="🥅" corTexto="text-red-700" lista={e.piorDefesa} sufixo=" sofridos" />
        <ListaTop titulo="Mais Vitórias" icone="✅" corTexto="text-blue-700" lista={e.maisVitorias} sufixo=" vit" />
        <ListaTop titulo="Rei do Empate" icone="🤝" corTexto="text-gray-600" lista={e.reiEmpate} sufixo=" emp" />
        <ListaTop titulo="A Fortaleza (Clean Sheets)" icone="🧱" corTexto="text-orange-700" lista={e.fortaleza} sufixo=" jogos" />
      </div>
    </div>
  )
}

// ─── 3. Agenda / Resultados (com filtro de rodada) ───────────────────────────

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

  // Defaults diferentes por tipo
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
    // filtro por número de rodada específico
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
      {/* Filtros rápidos */}
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

      {/* Seletor de rodada específica */}
      {rodadasUnicas.length > 0 && (
        <select
          value={['proximas', '3', '5', 'todas'].includes(filtro) ? '' : filtro}
          onChange={(e) => {
            if (e.target.value) setFiltro(e.target.value)
          }}
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
                    <div
                      key={j.matchId}
                      className="flex items-center justify-between rounded border border-papel-borda-200/60 bg-papel-50 p-2"
                    >
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

// ─── 4. Modal do Time (stats + evolução) ─────────────────────────────────────

function ModalTime({
  time,
  jogos,
  onFechar,
}: {
  time: LinhaTabela
  jogos: JogoBrasileirao[]
  onFechar: () => void
}) {
  const jogosDoTime = useMemo(() => {
    return jogos
      .filter((j) => j.home === time.time || j.away === time.time)
      .filter((j) => j.homeScore !== null)
      .sort((a, b) => (a.date ?? '').localeCompare(b.date ?? ''))
  }, [jogos, time.time])

  const maxPts = Math.max(...(time.evolucaoPts.length ? time.evolucaoPts : [1]), 1)

  // SVG sparkline da evolução
  const pontos = time.evolucaoPts
  const w = 280
  const h = 80
  const pad = 8
  const path = pontos.length > 1
    ? pontos.map((p, i) => {
        const x = pad + (i / (pontos.length - 1)) * (w - pad * 2)
        const y = h - pad - (p / maxPts) * (h - pad * 2)
        return `${i === 0 ? 'M' : 'L'}${x.toFixed(1)},${y.toFixed(1)}`
      }).join(' ')
    : ''

  return (
    <Modal aberto onFechar={onFechar} borda="border-dourado-300" className="max-h-[90vh] overflow-y-auto">
      <div className="mb-4 flex items-center gap-3">
        <img src={getEscudo(time.time)} alt="" className="h-12 w-12 object-contain" />
        <div>
          <p className="font-display text-lg font-bold text-tinta-300">{time.time}</p>
          <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">
            {time.posicao}º lugar · {time.pontos} pts
          </p>
        </div>
      </div>

      {/* Cards de stats */}
      <div className="mb-4 grid grid-cols-4 gap-2">
        {[
          { l: 'J', v: time.jogos },
          { l: 'V', v: time.vitorias },
          { l: 'E', v: time.empates },
          { l: 'D', v: time.derrotas },
          { l: 'GP', v: time.golsMarcados },
          { l: 'GC', v: time.golsSofridos },
          { l: 'SG', v: time.saldoGols },
          { l: 'Pts', v: time.pontos },
        ].map((c) => (
          <div key={c.l} className="flex flex-col items-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
            <span className="font-mono text-base font-bold text-tinta-300">{c.v}</span>
            <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">{c.l}</span>
          </div>
        ))}
      </div>

      {/* Forma recente */}
      <div className="mb-4">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">Forma recente</p>
        <div className="flex gap-1.5">
          {time.ultimos5.map((res, i) => {
            const cor = res === 'V' ? 'bg-green-600' : res === 'E' ? 'bg-gray-400' : 'bg-red-600'
            return (
              <span key={i} className={cx('flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold text-white', cor)}>
                {res}
              </span>
            )
          })}
        </div>
      </div>

      {/* Gráfico de evolução */}
      {pontos.length > 1 && (
        <div className="mb-4">
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">📈 Evolução de pontos</p>
          <div className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
            <svg viewBox={`0 0 ${w} ${h}`} className="h-20 w-full">
              <path d={path} fill="none" stroke="#B8860B" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
              {/* ponto final */}
              {pontos.length > 0 && (
                <circle
                  cx={pad + ((pontos.length - 1) / (pontos.length - 1)) * (w - pad * 2)}
                  cy={h - pad - (pontos[pontos.length - 1] / maxPts) * (h - pad * 2)}
                  r="4"
                  fill="#B8860B"
                />
              )}
            </svg>
            <div className="mt-1 flex justify-between font-mono text-[9px] text-tinta-100">
              <span>Início</span>
              <span className="font-bold text-dourado-600">{time.pontos} pts agora</span>
            </div>
          </div>
        </div>
      )}

      {/* Últimos jogos do time */}
      <div>
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">
          Últimos jogos ({jogosDoTime.length})
        </p>
        <div className="max-h-48 space-y-1.5 overflow-y-auto scrollbar-tema">
          {[...jogosDoTime].reverse().slice(0, 10).map((j) => {
            const mandante = j.home === time.time
            const gf = mandante ? j.homeScore! : j.awayScore!
            const gs = mandante ? j.awayScore! : j.homeScore!
            const res = gf > gs ? 'V' : gf < gs ? 'D' : 'E'
            const cor = res === 'V' ? 'text-green-600' : res === 'D' ? 'text-red-600' : 'text-gray-500'
            const adversario = mandante ? j.away : j.home
            return (
              <div key={j.matchId} className="flex items-center justify-between rounded border border-papel-borda-200/60 bg-papel-50 px-2 py-1.5">
                <span className="w-14 font-mono text-[9px] text-tinta-100">{j.roundName}</span>
                <div className="flex flex-1 items-center justify-center gap-2">
                  <span className="font-sans text-[10px] text-tinta-200">{mandante ? 'vs' : '@'}</span>
                  <img src={getEscudo(adversario)} className="h-4 w-4 object-contain" alt="" />
                  <span className="font-sans text-xs font-semibold text-tinta-300">{adversario}</span>
                </div>
                <span className={cx('w-12 text-right font-mono text-xs font-bold', cor)}>
                  {gf}×{gs}
                </span>
              </div>
            )
          })}
          {jogosDoTime.length === 0 && (
            <p className="text-center font-sans text-xs text-tinta-100">Sem jogos com placar ainda.</p>
          )}
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
