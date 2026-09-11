import { supabase } from './supabase'
import { normalizarNomeTime, type ResultadoUltimo } from './campeonatoReal'

// ─── Tipos ────────────────────────────────────────────────────────────────

export interface LinhaMandanteVisitante {
  time: string
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  gp: number
  gc: number
  pontos: number
  aproveitamento: number // 0-100
}

export interface MandanteVisitante {
  casa: LinhaMandanteVisitante[]   // ordenado por aproveitamento em casa, desc
  fora: LinhaMandanteVisitante[]   // ordenado por aproveitamento fora, desc
}

export interface LinhaTabelaTurno {
  posicao: number
  time: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  gp: number
  gc: number
  saldoGols: number
}

export interface LinhaAproveitamento {
  time: string
  pontos: number
  jogos: number
  aproveitamento: number // 0-100
}

export interface LinhaSequencia {
  time: string
  tipo: 'invicto' | 'jejum'
  jogos: number
}

interface JogoInterno {
  home: string
  away: string
  homeScore: number
  awayScore: number
  date: string // YYYY-MM-DD, sempre presente (jogos sem data são ignorados)
  time: string | null
  roundNumber: number
}

// ─── Busca base: todos os jogos com placar, uma vez só ────────────────────

async function buscarTodosJogosComPlacar(): Promise<JogoInterno[]> {
  const { data, error } = await supabase
    .from('matches')
    .select('home, away, home_score, away_score, match_date, match_time, rounds!inner(number)')
    .not('home_score', 'is', null)
    .not('away_score', 'is', null)
    .not('match_date', 'is', null)

  if (error) throw error

  return (data ?? []).map((m: any) => ({
    home: normalizarNomeTime(m.home),
    away: normalizarNomeTime(m.away),
    homeScore: m.home_score,
    awayScore: m.away_score,
    date: m.match_date,
    time: m.match_time,
    roundNumber: m.rounds?.number ?? 0,
  }))
}

function pontosPorResultado(gf: number, gs: number): number {
  return gf > gs ? 3 : gf === gs ? 1 : 0
}

// ─── 1. Mandante × Visitante ────────────────────────────────────────────

export async function buscarMandanteVisitante(): Promise<MandanteVisitante> {
  const jogos = await buscarTodosJogosComPlacar()

  const casaMap = new Map<string, LinhaMandanteVisitante>()
  const foraMap = new Map<string, LinhaMandanteVisitante>()

  function vazio(time: string): LinhaMandanteVisitante {
    return { time, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gp: 0, gc: 0, pontos: 0, aproveitamento: 0 }
  }

  for (const j of jogos) {
    if (!j.home || !j.away) continue

    const casa = casaMap.get(j.home) ?? vazio(j.home)
    casa.jogos++; casa.gp += j.homeScore; casa.gc += j.awayScore
    casa.pontos += pontosPorResultado(j.homeScore, j.awayScore)
    if (j.homeScore > j.awayScore) casa.vitorias++
    else if (j.homeScore === j.awayScore) casa.empates++
    else casa.derrotas++
    casaMap.set(j.home, casa)

    const fora = foraMap.get(j.away) ?? vazio(j.away)
    fora.jogos++; fora.gp += j.awayScore; fora.gc += j.homeScore
    fora.pontos += pontosPorResultado(j.awayScore, j.homeScore)
    if (j.awayScore > j.homeScore) fora.vitorias++
    else if (j.awayScore === j.homeScore) fora.empates++
    else fora.derrotas++
    foraMap.set(j.away, fora)
  }

  function finalizar(mapa: Map<string, LinhaMandanteVisitante>): LinhaMandanteVisitante[] {
    return Array.from(mapa.values())
      .map((l) => ({ ...l, aproveitamento: l.jogos > 0 ? Math.round((l.pontos / (l.jogos * 3)) * 1000) / 10 : 0 }))
      .sort((a, b) => b.aproveitamento - a.aproveitamento || b.pontos - a.pontos)
  }

  return { casa: finalizar(casaMap), fora: finalizar(foraMap) }
}

// ─── 2. Tabela por turno (corte por DATA real, não por número de rodada —
//        uma Extra que caiu depois do turno 1 fechar na prática conta como
//        turno 2, mesmo que fosse originalmente um confronto do turno 1) ──

export async function buscarTabelasPorTurno(): Promise<{ turno1: LinhaTabelaTurno[]; turno2: LinhaTabelaTurno[]; turno2EmAndamento: boolean }> {
  const jogos = await buscarTodosJogosComPlacar()

  // Data de corte: último jogo, por data, entre as rodadas REAIS 1-19.
  const datasT1Oficial = jogos.filter((j) => j.roundNumber >= 1 && j.roundNumber <= 19).map((j) => j.date)
  const dataCorte = datasT1Oficial.length > 0 ? datasT1Oficial.reduce((a, b) => (a > b ? a : b)) : null

  const t1: JogoInterno[] = []
  const t2: JogoInterno[] = []
  for (const j of jogos) {
    if (dataCorte && j.date <= dataCorte) t1.push(j)
    else t2.push(j)
  }

  function montarTabela(lista: JogoInterno[]): LinhaTabelaTurno[] {
    const mapa = new Map<string, LinhaTabelaTurno>()
    function vazio(time: string): LinhaTabelaTurno {
      return { posicao: 0, time, pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, gp: 0, gc: 0, saldoGols: 0 }
    }
    for (const j of lista) {
      if (!j.home || !j.away) continue
      const h = mapa.get(j.home) ?? vazio(j.home)
      const a = mapa.get(j.away) ?? vazio(j.away)
      h.jogos++; a.jogos++
      h.gp += j.homeScore; h.gc += j.awayScore
      a.gp += j.awayScore; a.gc += j.homeScore
      h.pontos += pontosPorResultado(j.homeScore, j.awayScore)
      a.pontos += pontosPorResultado(j.awayScore, j.homeScore)
      if (j.homeScore > j.awayScore) { h.vitorias++; a.derrotas++ }
      else if (j.homeScore === j.awayScore) { h.empates++; a.empates++ }
      else { a.vitorias++; h.derrotas++ }
      mapa.set(j.home, h); mapa.set(j.away, a)
    }
    return Array.from(mapa.values())
      .map((l) => ({ ...l, saldoGols: l.gp - l.gc }))
      .sort((a, b) => b.pontos - a.pontos || b.saldoGols - a.saldoGols || b.gp - a.gp)
      .map((l, i) => ({ ...l, posicao: i + 1 }))
  }

  return {
    turno1: montarTabela(t1),
    turno2: montarTabela(t2),
    turno2EmAndamento: t2.length > 0 && t2.length < t1.length,
  }
}

// ─── 3. Aproveitamento geral (temporada toda) ──────────────────────────────

export async function buscarAproveitamentoGeral(): Promise<LinhaAproveitamento[]> {
  const jogos = await buscarTodosJogosComPlacar()
  const mapa = new Map<string, { pontos: number; jogos: number }>()

  for (const j of jogos) {
    if (!j.home || !j.away) continue
    const h = mapa.get(j.home) ?? { pontos: 0, jogos: 0 }
    h.jogos++; h.pontos += pontosPorResultado(j.homeScore, j.awayScore)
    mapa.set(j.home, h)

    const a = mapa.get(j.away) ?? { pontos: 0, jogos: 0 }
    a.jogos++; a.pontos += pontosPorResultado(j.awayScore, j.homeScore)
    mapa.set(j.away, a)
  }

  return Array.from(mapa.entries())
    .map(([time, v]) => ({
      time, pontos: v.pontos, jogos: v.jogos,
      aproveitamento: v.jogos > 0 ? Math.round((v.pontos / (v.jogos * 3)) * 1000) / 10 : 0,
    }))
    .sort((a, b) => b.aproveitamento - a.aproveitamento || b.pontos - a.pontos)
}

// ─── 4. Sequência atual (invencibilidade ou jejum, jogo mais recente por
//        DATA real, não por número de rodada) ─────────────────────────────

export async function buscarSequenciasAtuais(): Promise<LinhaSequencia[]> {
  const jogos = await buscarTodosJogosComPlacar()

  const porTime = new Map<string, ResultadoUltimo[]>() // em ordem cronológica crescente

  function empurrar(time: string, res: ResultadoUltimo) {
    const lista = porTime.get(time) ?? []
    lista.push(res)
    porTime.set(time, lista)
  }

  const ordenados = [...jogos].sort((a, b) => {
    if (a.date !== b.date) return a.date < b.date ? -1 : 1
    return (a.time ?? '').localeCompare(b.time ?? '')
  })

  for (const j of ordenados) {
    if (!j.home || !j.away) continue
    const resHome: ResultadoUltimo = j.homeScore > j.awayScore ? 'V' : j.homeScore === j.awayScore ? 'E' : 'D'
    const resAway: ResultadoUltimo = j.awayScore > j.homeScore ? 'V' : j.awayScore === j.homeScore ? 'E' : 'D'
    empurrar(j.home, resHome)
    empurrar(j.away, resAway)
  }

  const resultado: LinhaSequencia[] = []
  for (const [time, historico] of porTime.entries()) {
    if (historico.length === 0) continue
    const ultimo = historico[historico.length - 1]
    const tipo: 'invicto' | 'jejum' = ultimo === 'D' ? 'jejum' : 'invicto'
    let contagem = 0
    for (let i = historico.length - 1; i >= 0; i--) {
      const r = historico[i]
      if (tipo === 'invicto' && r !== 'D') contagem++
      else if (tipo === 'jejum' && r !== 'V') contagem++
      else break
    }
    resultado.push({ time, tipo, jogos: contagem })
  }

  return resultado.sort((a, b) => b.jogos - a.jogos)
}
