'use client'

import { useMemo, useState, useEffect } from 'react'
import { CardEnvelope } from '@/components/home/CardEnvelope'
import { Modal } from '@/components/home/Modal'
import { getEscudo } from '@/lib/escudos'
import {
  buscarMinhasStats,
  buscarDetalheRodada,
  type MinhasStatsReal,
  type DetalheJogoRodada,
} from '@/lib/statsReal'
import {
  buscarStatsGrupo,
  type StatsGrupoCompleto,
  type JogadorCravadasZeros,
  type JogadorAcertoVencedor,
  type JogadorBipolar,
  type JogadorConsistencia,
  type JogadorOverUnder,
  type JogadorPerfilAposta,
  type JogadorRecorde,
  type PlacarFrequencia,
  type JogadorViciadoEmpate,
  type JogadorEmocionado,
  type JogadorDonoRodada,
  type JogadorCacadorZebras,
} from '@/lib/statsGrupo'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

type Sub = 'minhas' | 'grupo'

export function Estatisticas(_props: { e?: any }) {
  const [sub, setSub] = useState<Sub>('minhas')
  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-1 rounded-lg border border-papel-borda-200 bg-papel-100 p-1">
        {(['minhas', 'grupo'] as Sub[]).map((s) => (
          <button
            key={s}
            type="button"
            onClick={() => setSub(s)}
            className={cx(
              'flex-1 rounded-md px-3 py-1.5 font-sans text-xs font-semibold transition-colors',
              sub === s ? 'bg-couro-300 text-dourado-50' : 'text-tinta-200 hover:bg-papel-200',
            )}
          >
            {s === 'minhas' ? '👤 Minhas' : '🌐 Grupo'}
          </button>
        ))}
      </div>

      {sub === 'minhas' && <BlocoMinhas />}
      {sub === 'grupo' && <BlocoGrupo />}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// MINHAS
// ═══════════════════════════════════════════════════════════════════════════

function BlocoMinhas() {
  const [stats, setStats] = useState<MinhasStatsReal | null>(null)
  const [erro, setErro] = useState<string | null>(null)
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [rodadaDetalhe, setRodadaDetalhe] = useState<{
    roundId: string
    numero: number
    nome: string
    pts: number | null
    jogos: DetalheJogoRodada[] | null
  } | null>(null)
  const [verTodosPlacares, setVerTodosPlacares] = useState(false)

  useEffect(() => {
    let pid: string | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        pid = sessao.id
      }
    } catch { /* ignora */ }

    if (!pid) {
      setErro('Sessão não encontrada. Faça login novamente.')
      return
    }
    setParticipantId(pid)
    buscarMinhasStats(pid)
      .then(setStats)
      .catch((e) => setErro((e as Error).message))
  }, [])

  async function abrirDetalheRodada(roundId: string, numero: number, nome: string, pts: number | null) {
    if (!participantId) return
    setRodadaDetalhe({ roundId, numero, nome, pts, jogos: null })
    try {
      const jogos = await buscarDetalheRodada(roundId, participantId)
      setRodadaDetalhe((atual) => (atual && atual.roundId === roundId ? { ...atual, jogos } : atual))
    } catch (e) {
      setErro((e as Error).message)
    }
  }

  if (erro) return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-raridade-frango-selo">{erro}</div>
  if (!stats) return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-100">Carregando suas estatísticas...</div>
  if (stats.rodadas === 0) return <div className="rounded-lg border border-papel-borda-200 bg-papel-100 p-6 text-center font-sans text-sm text-tinta-200">Você ainda não participou de nenhuma rodada finalizada.</div>

  const iconeTendencia = stats.tendencia === 'alta' ? '⬆️' : stats.tendencia === 'baixa' ? '⬇️' : stats.tendencia === 'estavel' ? '➡️' : '—'
  const corTendencia = stats.tendencia === 'alta' ? 'text-green-600' : stats.tendencia === 'baixa' ? 'text-red-600' : 'text-tinta-200'
  const labelTendencia = stats.tendencia === 'alta' ? 'Em alta' : stats.tendencia === 'baixa' ? 'Em baixa' : stats.tendencia === 'estavel' ? 'Estável' : 'Sem dados'

  const jogosPontuados = stats.cravadas + stats.saldo + stats.vencedor

  return (
    <div className="flex flex-col gap-4">
      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col items-center justify-center rounded-lg border border-dourado-300 bg-dourado-50 p-3 text-center">
          <span className="font-mono text-2xl font-bold text-dourado-800">{stats.totalComPalpite}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-dourado-700">Palpites Totais</span>
        </div>
        <div className="flex flex-col items-center justify-center rounded-lg border border-dourado-300 bg-dourado-50 p-3 text-center">
          <span className="font-mono text-2xl font-bold text-green-700">{stats.pctVencedor}%</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-green-800">Aproveitamento</span>
        </div>
      </div>

      <div className="grid grid-cols-4 gap-2">
        <CardStat label="Rodadas" valor={stats.rodadas} cor="text-tinta-300" />
        <CardStat label="Pontuou" valor={jogosPontuados} cor="text-blue-600" />
        <CardStat label="Cravadas" valor={stats.cravadas} cor="text-green-600" />
        <CardStat label="Saldo" valor={stats.saldo} cor="text-orange-600" />
      </div>

      <div className="grid grid-cols-3 gap-2">
        <CardStat label="Média/rod" valor={stats.mediaPts} cor="text-dourado-600" pequeno />
        <CardStat label="Recorde" valor={stats.meuRecorde} cor="text-dourado-600" pequeno />
        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
          <span className={cx('font-mono text-lg font-bold', corTendencia)}>{iconeTendencia}</span>
          <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">{labelTendencia}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {stats.melhorRodada && (
          <div className="rounded-lg border border-dourado-200 bg-dourado-50 p-3 text-center">
            <span className="mb-1 block text-lg">👑</span>
            <p className="font-mono text-[9px] uppercase tracking-widest text-dourado-700">Melhor Rodada</p>
            <p className="mt-1 font-sans text-xs font-bold text-dourado-900">{stats.melhorRodada.nome}</p>
            <p className="font-mono text-[10px] text-dourado-700">{stats.melhorRodada.pts} pts</p>
          </div>
        )}
        {stats.piorRodada && (
          <div className="rounded-lg border border-papel-borda-200 bg-papel-100 p-3 text-center">
            <span className="mb-1 block text-lg">💀</span>
            <p className="font-mono text-[9px] uppercase tracking-widest text-tinta-200">Pior Rodada</p>
            <p className="mt-1 font-sans text-xs font-bold text-tinta-300">{stats.piorRodada.nome}</p>
            <p className="font-mono text-[10px] text-tinta-200">{stats.piorRodada.pts} pts</p>
          </div>
        )}
      </div>

      <div className="grid grid-cols-2 gap-2">
        <div className="flex flex-col rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
          <div className="flex flex-col items-center text-center">
            <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-tinta-100">🎯 Placar Favorito</p>
            <span className="font-mono text-xl font-bold text-dourado-600">{stats.placarFavorito ?? '—'}</span>
            <span className="font-sans text-[9px] text-tinta-200">Apostado {stats.placaresFrequentes?.[0]?.qtd ?? 0}x</span>
          </div>
          <button onClick={() => setVerTodosPlacares(!verTodosPlacares)} className="mt-2 w-full font-mono text-[9px] text-tinta-200 hover:underline">
            {verTodosPlacares ? '▲ Ocultar' : '▼ Ver todos'}
          </button>
          {verTodosPlacares && stats.placaresFrequentes && (
            <div className="mt-2 max-h-24 overflow-y-auto space-y-1 scrollbar-tema border-t border-papel-borda-200 pt-2">
              {stats.placaresFrequentes.map((p) => (
                <div key={p.placar} className="flex justify-between font-mono text-[10px]">
                  <span className="font-bold text-tinta-300">{p.placar}</span>
                  <span className="text-tinta-100">{p.qtd}x</span>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
          <p className="mb-1 font-mono text-[10px] uppercase tracking-widest text-tinta-100">🎲 Taxa de Coragem</p>
          <span className="font-mono text-xl font-bold text-dourado-600">{stats.taxaCoragemPct}%</span>
          <span className="font-sans text-[9px] text-tinta-200 text-center leading-tight">({stats.jogosCorajosos} apostas contra<br/>a maioria do grupo)</span>
        </div>
      </div>

      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-tinta-100">🔥 Performance por Rodada</p>
        <div className="flex flex-wrap justify-center gap-1.5">
          {stats.ptsPorRodada.map((r) => {
            const cor = corCelulaHeatmap(r.pontos)
            return (
              <button
                key={r.roundId}
                type="button"
                onClick={() => abrirDetalheRodada(r.roundId, r.numero, r.nome, r.pontos)}
                className={cx('flex h-10 w-10 flex-col items-center justify-center rounded transition-transform hover:scale-110', cor)}
                title={`${r.nome}: ${r.pontos === null ? 'NP' : r.pontos + ' pts'}`}
              >
                <span className="font-mono text-[9px] font-bold">{r.label}</span>
                <span className="font-mono text-[10px] font-bold">{r.pontos === null ? '—' : r.pontos}</span>
              </button>
            )
          })}
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-2 font-mono text-[9px] text-tinta-100">
          <LegendaHeatmap cor="bg-red-500" label="Ruim (0-4)" />
          <LegendaHeatmap cor="bg-orange-400" label="OK (5-9)" />
          <LegendaHeatmap cor="bg-yellow-400" label="Bom (10-14)" />
          <LegendaHeatmap cor="bg-blue-500" label="Muito bom (15-19)" />
          <LegendaHeatmap cor="bg-green-600" label="Ótimo (20+)" />
          <LegendaHeatmap cor="bg-papel-borda-300" label="NP" />
        </div>
        <p className="mt-2 text-center font-mono text-[10px] italic text-tinta-100">👆 Toque numa rodada pra ver os detalhes</p>
      </div>

      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3">
        <p className="mb-3 font-mono text-[10px] uppercase tracking-widest text-tinta-100">📊 Detalhe dos Acertos</p>
        <BarraPct label="Total de acertos (>0 pts)" pct={stats.pctVencedor} cor="bg-blue-500" />
        <BarraPct label="Cravadas Exatas (5 pts)" pct={stats.pctPlacarExato} cor="bg-green-600" />
        <BarraPct label="Apenas o Saldo (3 pts)" pct={stats.pctSaldo} cor="bg-orange-500" />
      </div>

      {rodadaDetalhe && (
        <DetalheRodadaModal detalhe={rodadaDetalhe} onFechar={() => setRodadaDetalhe(null)} />
      )}
    </div>
  )
}

// ═══════════════════════════════════════════════════════════════════════════
// GRUPO
// ═══════════════════════════════════════════════════════════════════════════

function BlocoGrupo() {
  const [dados, setDados] = useState<StatsGrupoCompleto | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarStatsGrupo()
      .then(setDados)
      .catch((e) => setErro((e as Error).message))
  }, [])

  if (erro) return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-raridade-frango-selo">{erro}</div>
  if (!dados) return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-100">Carregando estatísticas do grupo...</div>
  if (dados.cravadasZeros.length === 0) return <div className="rounded-lg bg-papel-100 p-4 text-center font-sans text-sm text-tinta-200">Sem rodadas finalizadas ainda.</div>

  return (
    <div className="flex flex-col gap-4">
      <BlocoCravadasZeros dados={dados.cravadasZeros} />
      <BlocoAcertoVencedor dados={dados.acertoVencedor} />
      <BlocoDonoRodada dados={dados.donoRodada} />
      <BlocoEmocionados dados={dados.emocionados} />
      <BlocoZebras dados={dados.cacadorZebras} />
      <BlocoViciadosEmpate dados={dados.viciadosEmpate} />
      <BlocoConsistencia dados={dados.consistencia} />
      <BlocoBipolares dados={dados.bipolares} />
      <BlocoOverUnder dados={dados.overUnder} />
      <BlocoPerfilAposta dados={dados.perfilAposta} />
      <BlocoRecordes dados={dados.recordes} />
      <BlocoPlacares dados={dados.placares} />
    </div>
  )
}

// ─── Componentes de Bloco Base ──────────────────────────────────────────────

function BlocoAccordion({ titulo, emoji, cor, children }: { titulo: string; emoji: string; cor: string; children: React.ReactNode }) {
  return (
    <div className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50">
      <div className={cx('flex items-center gap-2 border-b border-papel-borda-200 px-4 py-2.5', cor)}>
        <span className="text-base">{emoji}</span>
        <p className="font-display text-sm font-bold uppercase tracking-wide text-tinta-300">{titulo}</p>
      </div>
      <div className="p-3">{children}</div>
    </div>
  )
}

function Top3Barra({ items, getValor, getSublinha, formatValor, corBarra }: { items: Array<{ nome: string }>; getValor: (item: any) => number; getSublinha?: (item: any) => string; formatValor: (v: number) => string; corBarra: string }) {
  const max = Math.max(...items.slice(0, 3).map(getValor), 1)
  return (
    <div className="space-y-2">
      {items.slice(0, 3).map((item, i) => {
        const val = getValor(item)
        const pctBarra = Math.round((val / max) * 100)
        return (
          <div key={item.nome} className="flex items-center gap-2">
            <span className="w-5 text-center text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className="w-24 truncate font-sans text-xs font-semibold text-tinta-300">{item.nome}</span>
            <div className="flex-1 overflow-hidden rounded-full bg-papel-200">
              <div className={cx('h-2 rounded-full transition-all duration-500', corBarra)} style={{ width: `${pctBarra}%` }} />
            </div>
            <span className="w-14 text-right font-mono text-xs font-bold text-tinta-300">{formatValor(val)}</span>
            {getSublinha && <span className="w-12 text-right font-mono text-[10px] text-tinta-100">{getSublinha(item)}</span>}
          </div>
        )
      })}
    </div>
  )
}

function VerTodos({ children, label = 'Ver todos' }: { children: React.ReactNode; label?: string }) {
  const [aberto, setAberto] = useState(false)
  return (
    <div className="mt-3 border-t border-papel-borda-200/60 pt-2">
      <button type="button" onClick={() => setAberto((v) => !v)} className="w-full text-center font-mono text-[10px] uppercase tracking-widest text-tinta-100 hover:text-tinta-300">
        {aberto ? '▲ Fechar' : `▼ ${label}`}
      </button>
      {aberto && <div className="mt-2">{children}</div>}
    </div>
  )
}

function TabelaSimples({ cabecalho, linhas }: { cabecalho: string[]; linhas: string[][] }) {
  return (
    <div className="overflow-x-auto scrollbar-tema">
      <table className="w-full border-separate border-spacing-0">
        <thead>
          <tr>
            {cabecalho.map((c, i) => (
              <th key={i} className={cx('border-b border-papel-borda-300 bg-papel-200 px-2 py-1.5 font-mono text-[9px] uppercase tracking-widest text-tinta-100', i === 0 ? 'text-left' : 'text-right')}>
                {c}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {linhas.map((linha, r) => (
            <tr key={r}>
              {linha.map((celula, c) => (
                <td key={c} className={cx('border-b border-papel-borda-200/40 px-2 py-1.5 font-mono text-[11px] text-tinta-300', c === 0 ? 'font-sans font-semibold' : 'text-right')}>
                  {celula}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

// ─── BLOCOS ESPECÍFICOS DO GRUPO ─────────────────────────────────────────────

function BlocoCravadasZeros({ dados }: { dados: JogadorCravadasZeros[] }) {
  const rankCravadas = [...dados].sort((a, b) => b.cravadas - a.cravadas || b.pctCravadas - a.pctCravadas)
  const rankZeros = [...dados].sort((a, b) => b.zeros - a.zeros || b.pctZeros - a.pctZeros)

  return (
    <BlocoAccordion titulo="Cravadas & Zeros" emoji="🎯" cor="bg-green-50">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-green-700">🎯 Mais cravadas</p>
          <Top3Barra items={rankCravadas} getValor={(x) => x.cravadas} getSublinha={(x) => `${x.pctCravadas}%`} formatValor={(v) => String(v)} corBarra="bg-green-600" />
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-700">💀 Mais zeros</p>
          <Top3Barra items={rankZeros} getValor={(x) => x.zeros} getSublinha={(x) => `${x.pctZeros}%`} formatValor={(v) => String(v)} corBarra="bg-red-500" />
        </div>
      </div>
      <VerTodos>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <TabelaSimples cabecalho={['Jogador', 'Cravadas', '%']} linhas={rankCravadas.map((x) => [x.nome, String(x.cravadas), `${x.pctCravadas}%`])} />
          <TabelaSimples cabecalho={['Jogador', 'Zeros', '%']} linhas={rankZeros.map((x) => [x.nome, String(x.zeros), `${x.pctZeros}%`])} />
        </div>
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoAcertoVencedor({ dados }: { dados: JogadorAcertoVencedor[] }) {
  const rank = [...dados].sort((a, b) => b.pct - a.pct || b.acertos - a.acertos)
  return (
    <BlocoAccordion titulo="Taxa de Pontuação" emoji="✅" cor="bg-blue-50">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">Taxa de vezes que o jogador não zerou o palpite</p>
      <Top3Barra items={rank} getValor={(x) => x.pct} getSublinha={(x) => `${x.acertos}/${x.totalPalpites}`} formatValor={(v) => `${v}%`} corBarra="bg-blue-500" />
      <VerTodos>
        <TabelaSimples cabecalho={['Jogador', 'Acertos', 'Total', '%']} linhas={rank.map((x) => [x.nome, String(x.acertos), String(x.totalPalpites), `${x.pct}%`])} />
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoDonoRodada({ dados }: { dados: JogadorDonoRodada[] }) {
  const rank = [...dados].filter(x => x.qtdLiderancas > 0).sort((a, b) => b.qtdLiderancas - a.qtdLiderancas)
  return (
    <BlocoAccordion titulo="O Dono da Rodada" emoji="👑" cor="bg-dourado-50">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">Vezes que terminou a rodada em 1º lugar</p>
      <Top3Barra items={rank} getValor={(x) => x.qtdLiderancas} formatValor={(v) => `${v}×`} corBarra="bg-dourado-400" />
      <VerTodos>
        <TabelaSimples cabecalho={['Jogador', 'Lideranças']} linhas={rank.map((x) => [x.nome, `${x.qtdLiderancas}×`])} />
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoZebras({ dados }: { dados: JogadorCacadorZebras[] }) {
  const rank = [...dados].filter(x => x.pontosZebra > 0).sort((a, b) => b.pontosZebra - a.pontosZebra)
  return (
    <BlocoAccordion titulo="Caçador de Zebras" emoji="🦓" cor="bg-zinc-100">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">Pontos feitos em jogos onde 70% do grupo zerou</p>
      <Top3Barra items={rank} getValor={(x) => x.pontosZebra} getSublinha={(x) => `${x.jogosZebra} jgs`} formatValor={(v) => `${v} pts`} corBarra="bg-zinc-800" />
      <VerTodos>
        <TabelaSimples cabecalho={['Jogador', 'Pontos Zebra', 'Jogos Acertados']} linhas={rank.map((x) => [x.nome, String(x.pontosZebra), String(x.jogosZebra)])} />
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoViciadosEmpate({ dados }: { dados: JogadorViciadoEmpate[] }) {
  const rank = [...dados].sort((a, b) => b.empatesApostados - a.empatesApostados)
  return (
    <BlocoAccordion titulo="Viciados em Empate" emoji="🤝" cor="bg-gray-50">
      <Top3Barra items={rank} getValor={(x) => x.empatesApostados} getSublinha={(x) => `${x.pct}% hit`} formatValor={(v) => `${v} palps`} corBarra="bg-gray-500" />
      <VerTodos>
        <TabelaSimples cabecalho={['Jogador', 'Apostas', 'Acertos', '% Acerto']} linhas={rank.map((x) => [x.nome, String(x.empatesApostados), String(x.acertos), `${x.pct}%`])} />
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoEmocionados({ dados }: { dados: { emocionados: JogadorEmocionado[]; retranqueiros: JogadorEmocionado[] } }) {
  return (
    <BlocoAccordion titulo="Emocionados vs Retranqueiros" emoji="🎭" cor="bg-purple-50">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">Média de gols previstos por partida</p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-purple-700">🤪 Emocionados (+ gols)</p>
          <Top3Barra items={dados.emocionados} getValor={(x) => x.mediaGols} formatValor={(v) => String(v)} corBarra="bg-purple-500" />
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-teal-700">🛡️ Retranqueiros (- gols)</p>
          <div className="space-y-2">
            {dados.retranqueiros.slice(0, 3).map((item, i) => (
              <div key={item.nome} className="flex items-center gap-2">
                <span className="w-5 text-center text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
                <span className="w-24 truncate font-sans text-xs font-semibold text-tinta-300">{item.nome}</span>
                <div className="flex-1 overflow-hidden rounded-full bg-papel-200">
                  <div className="h-2 rounded-full transition-all duration-500 bg-teal-500" style={{ width: `${Math.round((item.mediaGols / dados.emocionados[0].mediaGols) * 100)}%` }} />
                </div>
                <span className="w-14 text-right font-mono text-xs font-bold text-tinta-300">{item.mediaGols}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </BlocoAccordion>
  )
}

function BlocoBipolares({ dados }: { dados: JogadorBipolar[] }) {
  const rank = [...dados].sort((a, b) => b.variacao - a.variacao)
  return (
    <BlocoAccordion titulo="Os mais bipolares" emoji="🎢" cor="bg-orange-50">
      <Top3Barra items={rank} getValor={(x) => x.variacao} getSublinha={(x) => `${x.min}→${x.max}`} formatValor={(v) => String(v)} corBarra="bg-orange-500" />
      <VerTodos><TabelaSimples cabecalho={['Jogador', 'Mín', 'Máx', 'Variação']} linhas={rank.map((x) => [x.nome, String(x.min), String(x.max), String(x.variacao)])} /></VerTodos>
    </BlocoAccordion>
  )
}

function BlocoConsistencia({ dados }: { dados: JogadorConsistencia[] }) {
  const rank = [...dados].sort((a, b) => a.desvioPadrao - b.desvioPadrao)
  const iconePerfil = (p: string) => p === 'consistente' ? '🧊' : p === 'regular' ? '😐' : '🎢'
  return (
    <BlocoAccordion titulo="Consistência" emoji="📏" cor="bg-cyan-50">
      <p className="mb-2 font-mono text-[10px] italic text-tinta-100">Mais baixo o desvio, mais previsível o jogador</p>
      <div className="space-y-2">
        {rank.slice(0, 3).map((item, i) => (
          <div key={item.nome} className="flex items-center gap-2">
            <span className="w-5 text-center text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className="w-24 truncate font-sans text-xs font-semibold text-tinta-300">{item.nome}</span>
            <span className="flex-1 font-mono text-[11px] text-tinta-200">média {item.media} · DP {item.desvioPadrao}</span>
            <span className="font-mono text-xs">{iconePerfil(item.perfil)}</span>
          </div>
        ))}
      </div>
      <VerTodos><TabelaSimples cabecalho={['Jogador', 'Média', 'DP', 'Perfil']} linhas={rank.map((x) => [x.nome, String(x.media), String(x.desvioPadrao), iconePerfil(x.perfil)])} /></VerTodos>
    </BlocoAccordion>
  )
}

function BlocoOverUnder({ dados }: { dados: { overs: JogadorOverUnder[]; unders: JogadorOverUnder[]; mediaGrupo: number } }) {
  return (
    <BlocoAccordion titulo="Over & Underperforming" emoji="📈" cor="bg-indigo-50">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">Média do grupo: <b className="text-tinta-300">{dados.mediaGrupo} pts/rodada</b></p>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-green-700">⬆️ Overperforming</p>
          <div className="space-y-1">{dados.overs.slice(0, 3).map((x, i) => <div key={x.nome} className="flex items-center gap-2"><span className="w-4 text-center text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span><span className="flex-1 truncate font-sans text-xs font-semibold text-tinta-300">{x.nome}</span><span className="font-mono text-xs font-bold text-green-700">+{x.diff}</span></div>)}</div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-red-700">⬇️ Underperforming</p>
          <div className="space-y-1">{dados.unders.slice(0, 3).map((x, i) => <div key={x.nome} className="flex items-center gap-2"><span className="w-4 text-center text-xs">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span><span className="flex-1 truncate font-sans text-xs font-semibold text-tinta-300">{x.nome}</span><span className="font-mono text-xs font-bold text-red-700">{x.diff}</span></div>)}</div>
        </div>
      </div>
      <VerTodos><TabelaSimples cabecalho={['Jogador', 'Média', 'vs Grupo', 'Status']} linhas={[...dados.overs, ...dados.unders].sort((a, b) => b.media - a.media).map((x) => [x.nome, String(x.media), (x.diff >= 0 ? '+' : '') + x.diff, x.status === 'over' ? '⬆️ Over' : '⬇️ Under'])} /></VerTodos>
    </BlocoAccordion>
  )
}

function BlocoPerfilAposta({ dados }: { dados: JogadorPerfilAposta[] }) {
  const rank = [...dados].sort((a, b) => b.pctMandante - a.pctMandante)
  return (
    <BlocoAccordion titulo="Perfil de Aposta" emoji="🏠" cor="bg-yellow-50">
      <p className="mb-3 font-mono text-[10px] italic text-tinta-100">% dos palpites de cada jogador em cada tipo de resultado</p>
      <div className="space-y-2">
        {rank.slice(0, 3).map((item) => (
          <div key={item.nome} className="rounded border border-papel-borda-200/60 bg-papel-100 p-2">
            <p className="mb-1.5 font-sans text-xs font-semibold text-tinta-300">{item.nome}</p>
            <div className="flex h-2 overflow-hidden rounded-full">
              <div className="bg-yellow-500" style={{ width: `${item.pctMandante}%` }} />
              <div className="bg-gray-400" style={{ width: `${item.pctEmpate}%` }} />
              <div className="bg-blue-500" style={{ width: `${item.pctVisitante}%` }} />
            </div>
            <div className="mt-1 flex justify-between font-mono text-[10px]">
              <span className="text-yellow-700">🏠 {item.pctMandante}%</span>
              <span className="text-gray-600">🤝 {item.pctEmpate}%</span>
              <span className="text-blue-700">✈️ {item.pctVisitante}%</span>
            </div>
          </div>
        ))}
      </div>
      <VerTodos label="Ver todos">
        <TabelaSimples cabecalho={['Jogador', 'Mandante', 'Empate', 'Visitante']} linhas={rank.map(r => [r.nome, `${r.pctMandante}%`, `${r.pctEmpate}%`, `${r.pctVisitante}%`])} />
      </VerTodos>
    </BlocoAccordion>
  )
}

function BlocoRecordes({ dados }: { dados: JogadorRecorde[] }) {
  const rank = [...dados].sort((a, b) => b.recorde - a.recorde)
  const iconeT = (t: string) => t === 'alta' ? '⬆️' : t === 'baixa' ? '⬇️' : t === 'estavel' ? '➡️' : '—'
  const corT = (t: string) => t === 'alta' ? 'text-green-600' : t === 'baixa' ? 'text-red-600' : 'text-tinta-200'
  return (
    <BlocoAccordion titulo="Recordes & Tendência" emoji="🏅" cor="bg-red-50">
      <div className="space-y-2">
        {rank.slice(0, 3).map((item, i) => (
          <div key={item.nome} className="flex items-center gap-2">
            <span className="w-5 text-center text-sm">{i === 0 ? '🥇' : i === 1 ? '🥈' : '🥉'}</span>
            <span className="flex-1 truncate font-sans text-xs font-semibold text-tinta-300">{item.nome}</span>
            <span className="font-mono text-sm font-bold text-dourado-600">{item.recorde} pts</span>
            <span className={cx('font-mono text-xs', corT(item.tendencia))}>{iconeT(item.tendencia)}</span>
          </div>
        ))}
      </div>
      <VerTodos><TabelaSimples cabecalho={['Jogador', 'Recorde', 'Tendência']} linhas={rank.map((x) => [x.nome, `${x.recorde} pts`, iconeT(x.tendencia)])} /></VerTodos>
    </BlocoAccordion>
  )
}

function BlocoPlacares({ dados }: { dados: { apostados: PlacarFrequencia[]; reais: PlacarFrequencia[] } }) {
  return (
    <BlocoAccordion titulo="Placares" emoji="🔢" cor="bg-teal-50">
      <div className="grid grid-cols-2 gap-4">
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-teal-700">Mais apostados</p>
          <div className="space-y-1">
            {dados.apostados.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-xs"><span className="font-bold text-tinta-300">{p.placar}</span><span className="text-tinta-100">{p.qtd}×</span></div>
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-teal-700">Que mais aconteceram</p>
          <div className="space-y-1">
            {dados.reais.slice(0, 5).map((p, i) => (
              <div key={i} className="flex items-center justify-between font-mono text-xs"><span className="font-bold text-dourado-600">{p.placar}</span><span className="text-tinta-100">{p.qtd}×</span></div>
            ))}
          </div>
        </div>
      </div>
    </BlocoAccordion>
  )
}

// ─── Componentes Auxiliares (Minhas) ─────────────────────────────────────────

function CardStat({ label, valor, cor, pequeno = false }: { label: string; valor: number | string; cor: string; pequeno?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-papel-borda-200 bg-papel-50 p-2">
      <span className={cx('font-mono font-bold', cor, pequeno ? 'text-base' : 'text-xl')}>{valor}</span>
      <span className="font-mono text-[9px] uppercase tracking-widest text-tinta-100">{label}</span>
    </div>
  )
}

function LegendaHeatmap({ cor, label }: { cor: string; label: string }) {
  return <span className="flex items-center gap-1"><span className={cx('h-2.5 w-2.5 rounded', cor)} />{label}</span>
}

function corCelulaHeatmap(pts: number | null): string {
  if (pts === null) return 'bg-papel-borda-300 text-tinta-100'
  if (pts >= 20) return 'bg-green-600 text-white'
  if (pts >= 15) return 'bg-blue-500 text-white'
  if (pts >= 10) return 'bg-yellow-400 text-tinta-300'
  if (pts >= 5) return 'bg-orange-400 text-white'
  return 'bg-red-500 text-white'
}

function BarraPct({ label, pct, cor }: { label: string; pct: number; cor: string }) {
  return (
    <div className="mb-2 last:mb-0">
      <div className="mb-1 flex items-center justify-between font-sans text-xs">
        <span className="text-tinta-200">{label}</span>
        <span className="font-mono font-bold text-tinta-300">{pct}%</span>
      </div>
      <div className="h-2 overflow-hidden rounded-full bg-papel-200">
        <div className={cx('h-full rounded-full transition-all duration-500', cor)} style={{ width: `${Math.min(pct, 100)}%` }} />
      </div>
    </div>
  )
}

function DetalheRodadaModal({ detalhe, onFechar }: { detalhe: any; onFechar: () => void }) {
  function iconePonto(pts: number | null, resultadoH: number | null): string {
    if (pts === null || resultadoH === null) return '—'
    if (pts >= 5) return '✅'
    if (pts >= 3) return '📐'
    if (pts >= 1) return '👍'
    return '❌'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-tinta-300/70 p-4" onClick={onFechar}>
      <div className="w-full max-w-md overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
          <div>
            <p className="font-display text-base font-bold uppercase tracking-wide text-tinta-300">{detalhe.nome}</p>
            <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">{detalhe.pts !== null ? `${detalhe.pts} pontos` : 'Não palpitei'}</p>
          </div>
          <button type="button" onClick={onFechar} className="font-mono text-xs text-tinta-200 hover:text-tinta-300">✕</button>
        </div>
        <div className="max-h-[60vh] overflow-y-auto">
          {!detalhe.jogos && <p className="p-4 text-center font-sans text-xs text-tinta-100">Carregando jogos...</p>}
          {detalhe.jogos && detalhe.jogos.length === 0 && <p className="p-4 text-center font-sans text-xs text-tinta-100">Nenhum jogo encontrado.</p>}
          {detalhe.jogos && detalhe.jogos.map((j: any) => (
            <div key={j.matchId} className="border-b border-papel-borda-200 px-4 py-3 last:border-0">
              <div className="mb-1 flex items-center justify-between">
                <span className="font-sans text-xs font-semibold text-tinta-300">{j.home} × {j.away}</span>
                <span className="font-mono text-sm">{iconePonto(j.pontos, j.resultadoH)}</span>
              </div>
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className="text-tinta-100">Palpite: <span className="font-bold text-tinta-300">{j.palpiteH !== null ? `${j.palpiteH}×${j.palpiteA}` : '—'}</span></span>
                <span className="text-tinta-100">Resultado: <span className="font-bold text-dourado-600">{j.resultadoH !== null ? `${j.resultadoH}×${j.resultadoA}` : '—'}</span></span>
                <span className="text-tinta-100">Pts: <span className="font-bold text-tinta-300">{j.pontos ?? '—'}</span></span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
