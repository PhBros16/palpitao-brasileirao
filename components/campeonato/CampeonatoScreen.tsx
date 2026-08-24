'use client'

import { useState } from 'react'
import { CardEnvelope } from '@/components/home/CardEnvelope'
import { getEscudo } from '@/lib/escudos'
import type { DadosCampeonato, LinhaTabela, JogoBrasileirao } from '@/lib/campeonatoReal'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Sub = 'tabela' | 'estatisticas' | 'agenda'

const ABAS: [Sub, string][] = [
  ['tabela', 'Classificação'],
  ['estatisticas', 'Estatísticas'],
  ['agenda', 'Agenda'],
]

export function CampeonatoScreen({ dados }: { dados: DadosCampeonato }) {
  const [sub, setSub] = useState<Sub>('tabela')

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

      {sub === 'tabela' && <TabelaBrasileirao linhas={dados.tabela} />}
      {sub === 'estatisticas' && <EstatisticasCampeonato dados={dados} />}
      {sub === 'agenda' && <AgendaCampeonato proximos={dados.proximosJogos} ultimos={dados.ultimosResultados} />}
    </>
  )
}

// ─── 1. Tabela de Classificação ──────────────────────────────────────────────

function TabelaBrasileirao({ linhas }: { linhas: LinhaTabela[] }) {
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
      <CardEnvelope titulo="🏆 Tabela Oficial (20 Times)">
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
                <tr key={l.time} className="hover:bg-papel-100 transition-colors">
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
          <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-100 mb-1.5">Qualificação / Rebaixamento</p>
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

// ─── 2. Estatísticas do Campeonato ───────────────────────────────────────────

function EstatisticasCampeonato({ dados }: { dados: DadosCampeonato }) {
  const e = dados.estatisticas

  function ListaTop({ titulo, icone, corTexto, lista, sufixo = '' }: { titulo: string; icone: string; corTexto: string; lista: any[]; sufixo?: string }) {
    if (lista.length === 0) return null
    return (
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className={cx('mb-2 font-mono text-[10px] uppercase tracking-widest', corTexto)}>
          {icone} {titulo}
        </p>
        <div className="space-y-1.5">
          {lista.map((item, i) => (
            <div key={item.time} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="w-3 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
                <img src={getEscudo(item.time)} alt="" className="h-4 w-4 object-contain" />
                <span className="font-sans text-xs font-semibold text-tinta-300">{item.time}</span>
              </div>
              <span className="font-mono text-xs font-bold text-tinta-300">{item.valor}{sufixo}</span>
            </div>
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
        <p className="px-3 pt-3 font-mono text-[9px] italic text-tinta-100">Simulação baseada no aproveitamento atual dos times.</p>
        <div className="p-3 space-y-2 max-h-72 overflow-y-auto scrollbar-tema">
          {e.projecoes.sort((a,b) => b.projecaoFinal - a.projecaoFinal).map((t, i) => (
            <div key={t.time} className="flex items-center justify-between border-b border-papel-borda-200/60 pb-1.5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-4 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
                <img src={getEscudo(t.time)} alt="" className="h-4 w-4 object-contain" />
                <span className="font-sans text-xs font-semibold text-tinta-300">{t.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {t.risco === 'titulo' && <span className="rounded bg-dourado-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-dourado-700">🏆 Título</span>}
                {t.risco === 'libertadores' && <span className="rounded bg-blue-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-blue-700">G4</span>}
                {t.risco === 'sulamericana' && <span className="rounded bg-green-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-green-700">Sula</span>}
                {t.risco === 'rebaixamento' && <span className="rounded bg-red-100 px-1.5 py-0.5 font-mono text-[9px] font-bold text-red-700">🚨 Risco Z4</span>}
                <span className="w-10 text-right font-mono text-xs font-bold text-tinta-300">{t.projecaoFinal} pts</span>
              </div>
            </div>
          ))}
        </div>
      </CardEnvelope>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ListaTop titulo="Melhor Ataque" icone="⚽" corTexto="text-green-700" lista={e.melhorAtaque} sufixo=" gols" />
        <ListaTop titulo="Pior Defesa" icone="🥅" corTexto="text-red-700" lista={e.piorDefesa} sufixo=" sofridos" />
        <ListaTop titulo="Mais Vitórias" icone="✅" corTexto="text-blue-700" lista={e.maisVitorias} sufixo=" vit" />
        <ListaTop titulo="Rei do Empate" icone="🤝" corTexto="text-gray-600" lista={e.reiEmpate} sufixo=" emp" />
        <ListaTop titulo="A Fortaleza (Clean Sheets)" icone="🧱" corTexto="text-orange-700" lista={e.fortaleza} sufixo=" jogos" />
      </div>
    </div>
  )
}

// ─── 3. Agenda (Agrupada por Rodada) ──────────────────────────────────────────

function AgendaCampeonato({ proximos, ultimos }: { proximos: JogoBrasileirao[], ultimos: JogoBrasileirao[] }) {
  function formatData(iso: string | null) {
    if (!iso) return 'A definir'
    const [ano, mes, dia] = iso.split('-')
    return `${dia}/${mes}`
  }

  const proximosPorRodada = new Map<string, JogoBrasileirao[]>()
  for (const j of proximos) {
    if (!proximosPorRodada.has(j.roundName)) proximosPorRodada.set(j.roundName, [])
    proximosPorRodada.get(j.roundName)!.push(j)
  }

  return (
    <div className="flex flex-col gap-4">
      <CardEnvelope titulo="📅 Próximos Jogos">
        <div className="space-y-4 p-3">
          {proximosPorRodada.size === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">Nenhum jogo futuro cadastrado.</p>
          ) : (
            Array.from(proximosPorRodada.entries()).map(([rodadaNome, jogos]) => (
              <div key={rodadaNome} className="rounded-lg border border-papel-borda-200 bg-papel-100/50 p-2.5">
                <p className="mb-2 font-mono text-[10px] font-bold uppercase tracking-widest text-dourado-600 border-b border-papel-borda-200 pb-1">
                  {rodadaNome}
                </p>
                <div className="space-y-2">
                  {jogos.map((j) => (
                    <div key={j.matchId} className="flex items-center justify-between rounded bg-papel-50 p-2 border border-papel-borda-200/60">
                      <div className="flex flex-col w-16">
                        <span className="font-mono text-[10px] font-semibold text-tinta-300">{formatData(j.date)}</span>
                        {j.time && <span className="font-mono text-[9px] text-tinta-100">{j.time}</span>}
                      </div>

                      <div className="flex flex-1 items-center justify-center gap-2">
                        <div className="flex flex-1 items-center justify-end gap-1.5">
                          <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[80px]">{j.home}</span>
                          <img src={getEscudo(j.home)} className="h-5 w-5 object-contain" />
                        </div>
                        <span className="font-mono text-xs font-bold text-tinta-100 px-1">×</span>
                        <div className="flex flex-1 items-center justify-start gap-1.5">
                          <img src={getEscudo(j.away)} className="h-5 w-5 object-contain" />
                          <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[80px]">{j.away}</span>
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

      <CardEnvelope titulo="✅ Últimos Resultados">
        <div className="space-y-2 p-3">
          {ultimos.length === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">Nenhum resultado registrado.</p>
          ) : (
            ultimos.map((j) => (
              <div key={j.matchId} className="flex items-center justify-between rounded border border-papel-borda-200 bg-papel-50 px-3 py-2">
                <span className="font-mono text-[9px] text-tinta-100 w-14">{j.roundName}</span>
                <div className="flex flex-1 items-center justify-center gap-3">
                  <div className="flex flex-1 items-center justify-end gap-1.5">
                    <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[80px]">{j.home}</span>
                    <img src={getEscudo(j.home)} className="h-5 w-5 object-contain" />
                  </div>
                  <div className="flex items-center gap-1.5 rounded bg-papel-200 px-2 py-0.5">
                    <span className="font-mono text-sm font-bold text-tinta-300">{j.homeScore}</span>
                    <span className="text-xs text-tinta-100">×</span>
                    <span className="font-mono text-sm font-bold text-tinta-300">{j.awayScore}</span>
                  </div>
                  <div className="flex flex-1 items-center justify-start gap-1.5">
                    <img src={getEscudo(j.away)} className="h-5 w-5 object-contain" />
                    <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[80px]">{j.away}</span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </CardEnvelope>
    </div>
  )
}
