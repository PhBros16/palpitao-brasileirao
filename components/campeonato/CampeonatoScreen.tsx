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
      <span className={cx('flex h-3 w-3 items-center justify-center rounded-full text-[6px] font-bold text-white', cores[res])}>
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
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-left sticky left-0 z-10 w-32 border-r-2 border-r-papel-borda-300">Clube</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Pontos">Pts</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Jogos">J</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Vitórias">V</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Empates">E</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Derrotas">D</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Gols Marcados">GP</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Gols Sofridos">GC</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Saldo de Gols">SG</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center" title="Aproveitamento">%</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-2 py-2 text-center">Últ. 5</th>
              </tr>
            </thead>
            <tbody>
              {linhas.map((l) => (
                <tr key={l.time} className="hover:bg-papel-100 transition-colors">
                  <td className={cx('border-b border-papel-borda-200/60 px-1 py-1.5 text-center font-mono text-xs font-bold text-tinta-200', getBordaLateral(l.zona))}>
                    {l.posicao}
                  </td>
                  <td className="border-b border-r-2 border-r-papel-borda-300 border-papel-borda-200/60 bg-papel-50 px-2 py-1.5 sticky left-0 z-10">
                    <div className="flex items-center gap-1.5">
                      <img src={getEscudo(l.time)} alt={l.time} className="h-5 w-5 object-contain" />
                      <span className="font-sans text-xs font-semibold text-tinta-300 truncate max-w-[100px]">{l.time}</span>
                    </div>
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-xs font-bold text-tinta-300">{l.pontos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.jogos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.vitorias}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.empates}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.derrotas}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.golsMarcados}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-tinta-200">{l.golsSofridos}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-xs font-bold text-tinta-300">{l.saldoGols}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center font-mono text-[10px] text-dourado-600">{l.aproveitamento}</td>
                  <td className="border-b border-papel-borda-200/60 px-2 py-1.5 text-center">
                    <div className="flex items-center justify-center gap-0.5">
                      {l.ultimos5.map((res, idx) => <BolinhaForma key={idx} res={res} />)}
                      {[...Array(5 - l.ultimos5.length)].map((_, i) => (
                        <span key={`vazio-${i}`} className="h-3 w-3 rounded-full bg-papel-borda-300" />
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
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5 font-sans text-[10px] text-tinta-200">
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-blue-600" /> Libertadores (Fase de Grupos)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-cyan-400" /> Libertadores (Pré)</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-green-600" /> Sul-Americana</span>
            <span className="flex items-center gap-1.5"><span className="h-2 w-2 rounded bg-red-600" /> Rebaixamento Série B</span>
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
                <span className="text-tinta-100">×</span>
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

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <ListaTop titulo="Melhor Ataque" icone="⚽" corTexto="text-green-700" lista={e.melhorAtaque} sufixo=" gols" />
        <ListaTop titulo="Pior Defesa" icone="🥅" corTexto="text-red-700" lista={e.piorDefesa} sufixo=" sofridos" />
        <ListaTop titulo="Mais Vitórias" icone="✅" corTexto="text-blue-700" lista={e.maisVitorias} sufixo=" vit" />
        <ListaTop titulo="Rei do Empate" icone="🤝" corTexto="text-gray-600" lista={e.reiEmpate} sufixo=" emp" />
        <ListaTop titulo="A Fortaleza (Clean Sheets)" icone="🧱" corTexto="text-orange-700" lista={e.fortaleza} sufixo=" jogos" />
      </div>

      <CardEnvelope titulo="🔮 Simulador (Projeção 38 Rodadas)">
        <p className="px-3 pt-3 font-mono text-[9px] italic text-tinta-100">Projeção matemática baseada no aproveitamento atual dos times.</p>
        <div className="p-3 space-y-2 max-h-64 overflow-y-auto scrollbar-tema">
          {e.projecoes.sort((a,b) => b.projecaoFinal - a.projecaoFinal).map((t, i) => (
            <div key={t.time} className="flex items-center justify-between border-b border-papel-borda-200/60 pb-1.5 last:border-0">
              <div className="flex items-center gap-2">
                <span className="w-3 text-center font-mono text-[9px] text-tinta-100">{i + 1}º</span>
                <span className="font-sans text-xs font-semibold text-tinta-300">{t.time}</span>
              </div>
              <div className="flex items-center gap-2">
                {t.risco === 'titulo' && <span className="font-mono text-[9px] font-bold text-dourado-600">🏆 Título</span>}
                {t.risco === 'libertadores' && <span className="font-mono text-[9px] font-bold text-blue-600">Libertadores</span>}
                {t.risco === 'sulamericana' && <span className="font-mono text-[9px] font-bold text-green-600">Sul-Americana</span>}
                {t.risco === 'rebaixamento' && <span className="font-mono text-[9px] font-bold text-red-600">🚨 Risco Z4</span>}
                <span className="w-10 text-right font-mono text-sm font-bold text-tinta-300">{t.projecaoFinal}</span>
              </div>
            </div>
          ))}
        </div>
      </CardEnvelope>
    </div>
  )
}

// ─── 3. Agenda ───────────────────────────────────────────────────────────────

function AgendaCampeonato({ proximos, ultimos }: { proximos: JogoBrasileirao[], ultimos: JogoBrasileirao[] }) {
  function formatData(iso: string | null) {
    if (!iso) return ''
    const [ano, mes, dia] = iso.split('-')
    return `${dia}/${mes}`
  }

  function CardJogo({ j, passado = false }: { j: JogoBrasileirao; passado?: boolean }) {
    return (
      <div className="flex items-center justify-between rounded border border-papel-borda-200 bg-papel-50 px-3 py-2">
        <div className="flex flex-col items-center gap-0.5 w-16">
          <p className="font-mono text-[8px] uppercase tracking-widest text-tinta-100">{j.roundName}</p>
          <p className="font-mono text-[10px] text-tinta-200">{formatData(j.date)}</p>
          {!passado && j.time && <p className="font-mono text-[9px] text-tinta-200">{j.time}</p>}
        </div>
        <div className="flex flex-1 items-center justify-center gap-3">
          <div className="flex flex-1 flex-col items-end gap-1">
            <img src={getEscudo(j.home)} className="h-5 w-5 object-contain" />
            <span className="font-sans text-[10px] font-semibold text-tinta-300 truncate max-w-[80px]">{j.home}</span>
          </div>
          {passado ? (
            <div className="flex items-center gap-1.5 rounded bg-papel-200 px-2 py-1">
              <span className="font-mono text-base font-bold text-tinta-300">{j.homeScore}</span>
              <span className="text-xs text-tinta-100">×</span>
              <span className="font-mono text-base font-bold text-tinta-300">{j.awayScore}</span>
            </div>
          ) : (
            <span className="font-sans text-xs text-tinta-200">×</span>
          )}
          <div className="flex flex-1 flex-col items-start gap-1">
            <img src={getEscudo(j.away)} className="h-5 w-5 object-contain" />
            <span className="font-sans text-[10px] font-semibold text-tinta-300 truncate max-w-[80px]">{j.away}</span>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div className="flex flex-col gap-4">
      <CardEnvelope titulo="📅 Próximos Jogos">
        <div className="space-y-1.5 p-3">
          {proximos.length === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">Nenhum jogo futuro cadastrado na agenda.</p>
          ) : (
            proximos.map((j) => <CardJogo key={j.matchId} j={j} />)
          )}
        </div>
      </CardEnvelope>

      <CardEnvelope titulo="✅ Últimos Resultados">
        <div className="space-y-1.5 p-3">
          {ultimos.length === 0 ? (
            <p className="text-center font-sans text-xs text-tinta-200">Nenhum jogo com resultado cadastrado.</p>
          ) : (
            ultimos.map((j) => <CardJogo key={j.matchId} j={j} passado />)
          )}
        </div>
      </CardEnvelope>
    </div>
  )
}
