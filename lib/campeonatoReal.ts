import { supabase } from './supabase'

export type ResultadoUltimo = 'V' | 'E' | 'D'

export interface LinhaTabela {
  time: string
  pontos: number
  jogos: number
  vitorias: number
  empates: number
  derrotas: number
  golsMarcados: number
  golsSofridos: number
  saldoGols: number
  ultimos5: ResultadoUltimo[]
  posicao: number
  zona: 'libertadores' | 'pre-libertadores' | 'sulamericana' | 'meio' | 'z4'
}

export interface JogoBrasileirao {
  matchId: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  date: string | null
  time: string | null
  roundNumber: number
  roundName: string
}

export interface EstatisticaTime {
  time: string
  valor: number
  label?: string
}

export interface EstatisticasCampeonato {
  melhorAtaque: EstatisticaTime[]
  piorDefesa: EstatisticaTime[]
  reiEmpate: EstatisticaTime[]
  maiorGoleada: { home: string; away: string; homeScore: number; awayScore: number; saldoAbs: number } | null
  fortaleza: EstatisticaTime[]
  maisVitorias: EstatisticaTime[]
  projecoes: Array<{ time: string; projecaoFinal: number; risco: 'titulo' | 'libertadores' | 'sulamericana' | 'meio' | 'rebaixamento' }>
}

export interface DadosCampeonato {
  tabela: LinhaTabela[]
  estatisticas: EstatisticasCampeonato
  proximosJogos: JogoBrasileirao[]
  ultimosResultados: JogoBrasileirao[]
  totalJogosDisputados: number
  totalRodadasFinalizadas: number
}

// Dicionário para unificar nomes digitados errados ou com variações no banco
function normalizarNomeTime(nomeBruto: string): string {
  const n = nomeBruto.trim()
  if (n === 'Vasco da Gama') return 'Vasco'
  if (n === 'Chape') return 'Chapecoense'
  if (n === 'Galo') return 'Atlético-MG'
  if (n === 'Inter') return 'Internacional'
  if (n === 'Red Bull Bragantino') return 'RB Bragantino'
  return n
}

export async function buscarDadosCampeonato(): Promise<DadosCampeonato> {
  const [
    { data: matches, error: mErr },
    { data: rounds, error: rErr },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('id, home, away, home_score, away_score, match_date, match_time, round_id')
      .order('match_date', { ascending: true, nullsFirst: false })
      .order('match_time', { ascending: true, nullsFirst: false }),
    supabase
      .from('rounds')
      .select('id, number, name, finalized'),
  ])

  if (mErr) throw mErr
  if (rErr) throw rErr
  if (!matches || matches.length === 0) return vazio()
  if (!rounds) return vazio()

  const roundMap = new Map(rounds.map((r) => [r.id, { number: r.number, name: r.name, finalized: r.finalized }]))

  const jogosComPlacar: JogoBrasileirao[] = []
  const jogosFuturos: JogoBrasileirao[] = []

  for (const m of matches) {
    const r = roundMap.get(m.round_id)
    if (!r) continue

    const isExtra = r.number >= 100

    const jogo: JogoBrasileirao = {
      matchId: m.id,
      home: normalizarNomeTime(m.home),
      away: normalizarNomeTime(m.away),
      homeScore: m.home_score,
      awayScore: m.away_score,
      date: m.match_date,
      time: m.match_time?.slice(0, 5) ?? null,
      roundNumber: r.number,
      roundName: r.name,
    }

    if (m.home_score !== null && m.away_score !== null) {
      if (!isExtra) jogosComPlacar.push(jogo)
    } else {
      if (!isExtra) jogosFuturos.push(jogo)
    }
  }

  const tabela = calcularTabela(jogosComPlacar)
  const estatisticas = calcularEstatisticas(jogosComPlacar, tabela)

  const hoje = new Date().toISOString().split('T')[0]
  const proximosJogos = jogosFuturos
    .filter((j) => !j.date || j.date >= hoje)
    // Ordena pela rodada pra agrupar bonitinho na tela
    .sort((a, b) => a.roundNumber - b.roundNumber || (a.date ?? '9999').localeCompare(b.date ?? '9999'))
    .slice(0, 30)

  const ultimosResultados = [...jogosComPlacar]
    .sort((a, b) => (b.date ?? '').localeCompare(a.date ?? ''))
    .slice(0, 10)

  const totalRodadasFinalizadas = rounds.filter((r) => r.finalized && r.number < 100).length

  return { tabela, estatisticas, proximosJogos, ultimosResultados, totalJogosDisputados: jogosComPlacar.length, totalRodadasFinalizadas }
}

function calcularTabela(jogos: JogoBrasileirao[]): LinhaTabela[] {
  const timesMap = new Map<string, {
    pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number;
    golsMarcados: number; golsSofridos: number; historico: Array<{ resultado: ResultadoUltimo; data: string | null }>
  }>()

  function getOrCreate(time: string) {
    if (!timesMap.has(time)) {
      timesMap.set(time, { pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsMarcados: 0, golsSofridos: 0, historico: [] })
    }
    return timesMap.get(time)!
  }

  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const home = getOrCreate(j.home)
    const away = getOrCreate(j.away)

    home.jogos++
    away.jogos++
    home.golsMarcados += j.homeScore
    home.golsSofridos += j.awayScore
    away.golsMarcados += j.awayScore
    away.golsSofridos += j.homeScore

    let resHome: ResultadoUltimo
    let resAway: ResultadoUltimo

    if (j.homeScore > j.awayScore) {
      home.pontos += 3; home.vitorias++; away.derrotas++; resHome = 'V'; resAway = 'D'
    } else if (j.homeScore < j.awayScore) {
      away.pontos += 3; away.vitorias++; home.derrotas++; resHome = 'D'; resAway = 'V'
    } else {
      home.pontos++; away.pontos++; home.empates++; away.empates++; resHome = 'E'; resAway = 'E'
    }

    home.historico.push({ resultado: resHome, data: j.date })
    away.historico.push({ resultado: resAway, data: j.date })
  }

  const linhas: LinhaTabela[] = Array.from(timesMap.entries()).map(([time, dados]) => {
    const historicoOrdenado = [...dados.historico].sort((a, b) => (a.data ?? '').localeCompare(b.data ?? ''))
    const ultimos5 = historicoOrdenado.slice(-5).map((h) => h.resultado)
    return {
      time, pontos: dados.pontos, jogos: dados.jogos, vitorias: dados.vitorias, empates: dados.empates,
      derrotas: dados.derrotas, golsMarcados: dados.golsMarcados, golsSofridos: dados.golsSofridos,
      saldoGols: dados.golsMarcados - dados.golsSofridos, ultimos5, posicao: 0, zona: 'meio' as const,
    }
  })

  linhas.sort((a, b) => b.pontos - a.pontos || b.vitorias - a.vitorias || b.saldoGols - a.saldoGols || b.golsMarcados - a.golsMarcados || a.time.localeCompare(b.time))

  linhas.forEach((l, i) => {
    l.posicao = i + 1
    if (l.posicao <= 4) l.zona = 'libertadores'
    else if (l.posicao <= 6) l.zona = 'pre-libertadores'
    else if (l.posicao <= 12) l.zona = 'sulamericana'
    else if (l.posicao <= 16) l.zona = 'meio'
    else l.zona = 'z4'
  })

  return linhas
}

function calcularEstatisticas(jogos: JogoBrasileirao[], tabela: LinhaTabela[]): EstatisticasCampeonato {
  const melhorAtaque = [...tabela].sort((a, b) => b.golsMarcados - a.golsMarcados).slice(0, 5).map((t) => ({ time: t.time, valor: t.golsMarcados }))
  const piorDefesa = [...tabela].sort((a, b) => b.golsSofridos - a.golsSofridos).slice(0, 5).map((t) => ({ time: t.time, valor: t.golsSofridos }))
  const reiEmpate = [...tabela].sort((a, b) => b.empates - a.empates).slice(0, 5).map((t) => ({ time: t.time, valor: t.empates }))
  const maisVitorias = [...tabela].sort((a, b) => b.vitorias - a.vitorias).slice(0, 5).map((t) => ({ time: t.time, valor: t.vitorias }))

  let maiorGoleada: EstatisticasCampeonato['maiorGoleada'] = null
  let maiorSaldoAbs = 0
  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const saldoAbs = Math.abs(j.homeScore - j.awayScore)
    if (saldoAbs > maiorSaldoAbs) {
      maiorSaldoAbs = saldoAbs
      maiorGoleada = { home: j.home, away: j.away, homeScore: j.homeScore, awayScore: j.awayScore, saldoAbs }
    }
  }

  const cleanSheetsMap = new Map<string, number>()
  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    if (j.awayScore === 0) cleanSheetsMap.set(j.home, (cleanSheetsMap.get(j.home) ?? 0) + 1)
    if (j.homeScore === 0) cleanSheetsMap.set(j.away, (cleanSheetsMap.get(j.away) ?? 0) + 1)
  }
  const fortaleza = Array.from(cleanSheetsMap.entries()).sort((a, b) => b[1] - a[1]).slice(0, 5).map(([time, valor]) => ({ time, valor }))

  const projecoes = tabela.map((t) => {
    const media = t.jogos > 0 ? t.pontos / t.jogos : 0
    const projecaoFinal = Math.round(media * 38)
    let risco: 'titulo' | 'libertadores' | 'sulamericana' | 'meio' | 'rebaixamento'
    if (projecaoFinal >= 72) risco = 'titulo'
    else if (projecaoFinal >= 58) risco = 'libertadores'
    else if (projecaoFinal >= 48) risco = 'sulamericana'
    else if (projecaoFinal >= 45) risco = 'meio'
    else risco = 'rebaixamento'
    return { time: t.time, projecaoFinal, risco }
  })

  return { melhorAtaque, piorDefesa, reiEmpate, maiorGoleada, fortaleza, maisVitorias, projecoes }
}

function vazio(): DadosCampeonato {
  return {
    tabela: [],
    estatisticas: { melhorAtaque: [], piorDefesa: [], reiEmpate: [], maiorGoleada: null, fortaleza: [], maisVitorias: [], projecoes: [] },
    proximosJogos: [], ultimosResultados: [], totalJogosDisputados: 0, totalRodadasFinalizadas: 0
  }
}
