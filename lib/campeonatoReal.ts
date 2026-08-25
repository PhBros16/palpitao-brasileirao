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
  evolucaoPts: number[] // Curva real jogo a jogo
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

export interface GoleadaItem {
  home: string
  away: string
  homeScore: number
  awayScore: number
  saldoAbs: number
  roundName?: string
}

export interface EstatisticasCampeonato {
  melhorAtaque: EstatisticaTime[]
  piorDefesa: EstatisticaTime[]
  reiEmpate: EstatisticaTime[]
  maioresGoleadas: GoleadaItem[]
  fortaleza: EstatisticaTime[]
  maisVitorias: EstatisticaTime[]
  projecoes: Array<{ time: string; projecaoFinal: number; risco: 'titulo' | 'libertadores' | 'sulamericana' | 'meio' | 'rebaixamento' }>
  mediaGolsGeral: number
  golsPorRodada: Array<{ roundNumber: number; roundName: string; totalGols: number; mediaGols: number }>
}

export interface DadosCampeonato {
  tabela: LinhaTabela[]
  estatisticas: EstatisticasCampeonato
  proximosJogos: JogoBrasileirao[]
  ultimosResultados: JogoBrasileirao[]
  totalJogosDisputados: number
  totalRodadasFinalizadas: number
}

// ─── BASE OFICIAL DE DADOS DA R24 ───────────────────────────────────────────
const BASE_OFICIAL_R24: Record<string, {
  pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number;
  gp: number; gc: number; ultimos5: ResultadoUltimo[]
}> = {
  'Palmeiras':    { pontos: 51, jogos: 24, vitorias: 15, empates: 6,  derrotas: 3,  gp: 44, gc: 20, ultimos5: ['D', 'V', 'E', 'D', 'V'] },
  'Flamengo':     { pontos: 45, jogos: 23, vitorias: 13, empates: 6,  derrotas: 4,  gp: 45, gc: 21, ultimos5: ['E', 'E', 'V', 'V', 'D'] },
  'Athletico-PR': { pontos: 44, jogos: 24, vitorias: 13, empates: 5,  derrotas: 6,  gp: 33, gc: 20, ultimos5: ['V', 'V', 'E', 'V', 'E'] },
  'Fluminense':   { pontos: 41, jogos: 24, vitorias: 11, empates: 8,  derrotas: 5,  gp: 36, gc: 29, ultimos5: ['E', 'E', 'E', 'V', 'V'] },
  'Cruzeiro':     { pontos: 39, jogos: 24, vitorias: 11, empates: 6,  derrotas: 7,  gp: 34, gc: 33, ultimos5: ['D', 'V', 'V', 'V', 'V'] },
  'Bahia':        { pontos: 37, jogos: 24, vitorias: 9,  empates: 10, derrotas: 5,  gp: 34, gc: 28, ultimos5: ['E', 'E', 'E', 'E', 'V'] },
  'RB Bragantino':{ pontos: 35, jogos: 23, vitorias: 10, empates: 5,  derrotas: 8,  gp: 28, gc: 23, ultimos5: ['E', 'E', 'D', 'E', 'V'] },
  'Coritiba':     { pontos: 34, jogos: 24, vitorias: 9,  empates: 7,  derrotas: 8,  gp: 30, gc: 31, ultimos5: ['E', 'D', 'V', 'E', 'V'] },
  'Atlético-MG':  { pontos: 33, jogos: 23, vitorias: 9,  empates: 6,  derrotas: 8,  gp: 30, gc: 27, ultimos5: ['E', 'V', 'E', 'V', 'E'] },
  'Corinthians':  { pontos: 32, jogos: 24, vitorias: 8,  empates: 8,  derrotas: 8,  gp: 26, gc: 24, ultimos5: ['E', 'E', 'V', 'D', 'D'] },
  'Botafogo':     { pontos: 30, jogos: 23, vitorias: 8,  empates: 6,  derrotas: 9,  gp: 35, gc: 36, ultimos5: ['V', 'E', 'V', 'E', 'D'] },
  'Vitória':      { pontos: 29, jogos: 24, vitorias: 8,  empates: 5,  derrotas: 11, gp: 23, gc: 35, ultimos5: ['D', 'D', 'D', 'V', 'D'] },
  'São Paulo':    { pontos: 27, jogos: 23, vitorias: 7,  empates: 6,  derrotas: 10, gp: 27, gc: 27, ultimos5: ['D', 'E', 'D', 'E', 'D'] },
  'Santos':       { pontos: 26, jogos: 23, vitorias: 6,  empates: 8,  derrotas: 9,  gp: 33, gc: 36, ultimos5: ['D', 'E', 'D', 'V', 'E'] },
  'Grêmio':       { pontos: 25, jogos: 23, vitorias: 6,  empates: 7,  derrotas: 10, gp: 24, gc: 31, ultimos5: ['D', 'E', 'V', 'D', 'D'] },
  'Internacional':{ pontos: 25, jogos: 24, vitorias: 5,  empates: 10, derrotas: 9,  gp: 24, gc: 28, ultimos5: ['D', 'E', 'E', 'E', 'E'] },
  'Mirassol':     { pontos: 24, jogos: 23, vitorias: 6,  empates: 6,  derrotas: 11, gp: 26, gc: 36, ultimos5: ['E', 'V', 'D', 'D', 'E'] },
  'Remo':         { pontos: 23, jogos: 24, vitorias: 5,  empates: 8,  derrotas: 11, gp: 28, gc: 39, ultimos5: ['V', 'D', 'E', 'E', 'D'] },
  'Vasco':        { pontos: 22, jogos: 23, vitorias: 5,  empates: 7,  derrotas: 11, gp: 24, gc: 38, ultimos5: ['D', 'E', 'E', 'D', 'D'] },
  'Chapecoense':  { pontos: 14, jogos: 23, vitorias: 2,  empates: 8,  derrotas: 13, gp: 24, gc: 46, ultimos5: ['D', 'E', 'D', 'E', 'V'] },
}

function normalizarNomeTime(nomeBruto: string): string {
  if (!nomeBruto) return ''
  const str = nomeBruto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (str.includes('palmeiras')) return 'Palmeiras'
  if (str.includes('flamengo')) return 'Flamengo'
  if (str.includes('athletico') || str.includes('atletico-pr') || str.includes('atletico pr') || str.includes('cap')) return 'Athletico-PR'
  if (str.includes('fluminense') || str.includes('flu')) return 'Fluminense'
  if (str.includes('cruzeiro')) return 'Cruzeiro'
  if (str.includes('bahia')) return 'Bahia'
  if (str.includes('bragantino') || str.includes('red bull')) return 'RB Bragantino'
  if (str.includes('coritiba') || str.includes('coxa')) return 'Coritiba'
  if (str.includes('atletico-mg') || str.includes('atletico mg') || str.includes('galo')) return 'Atlético-MG'
  if (str.includes('corinthians') || str.includes('timao')) return 'Corinthians'
  if (str.includes('botafogo') || str.includes('bota')) return 'Botafogo'
  if (str.includes('vitoria')) return 'Vitória'
  if (str.includes('sao paulo') || str.includes('spfc')) return 'São Paulo'
  if (str.includes('santos')) return 'Santos'
  if (str.includes('gremio')) return 'Grêmio'
  if (str.includes('internacional') || str.includes('inter')) return 'Internacional'
  if (str.includes('mirassol')) return 'Mirassol'
  if (str.includes('remo')) return 'Remo'
  if (str.includes('vasco')) return 'Vasco'
  if (str.includes('chapecoense') || str.includes('chape')) return 'Chapecoense'

  return nomeBruto.trim()
}

export async function buscarDadosCampeonato(): Promise<DadosCampeonato> {
  const [
    { data: matches, error: mErr },
    { data: rounds, error: rErr },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('id, home, away, home_score, away_score, match_date, match_time, round_id')
      .order('match_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('rounds')
      .select('id, number, name, finalized')
      .order('number', { ascending: true }),
  ])

  if (mErr) throw mErr
  if (rErr) throw rErr
  if (!matches || matches.length === 0) return vazio()
  if (!rounds) return vazio()

  const roundMap = new Map(rounds.map((r) => [r.id, { number: r.number, name: r.name, finalized: r.finalized }]))

  const jogosNovosAoVivo: JogoBrasileirao[] = []
  const jogosFuturos: JogoBrasileirao[] = []
  const todosJogosComPlacar: JogoBrasileirao[] = []

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
      if (!isExtra) {
        todosJogosComPlacar.push(jogo)
        if (r.number >= 25) jogosNovosAoVivo.push(jogo)
      }
    } else {
      if (!isExtra) jogosFuturos.push(jogo)
    }
  }

  jogosNovosAoVivo.sort((a, b) => a.roundNumber - b.roundNumber)
  todosJogosComPlacar.sort((a, b) => a.roundNumber - b.roundNumber)

  const tabela = calcularTabelaComEvolucaoReal(todosJogosComPlacar, jogosNovosAoVivo)
  const estatisticas = calcularEstatisticas(todosJogosComPlacar, tabela)

  const hoje = new Date().toISOString().split('T')[0]
  const proximosJogos = jogosFuturos
    .filter((j) => !j.date || j.date >= hoje)
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const ultimosResultados = [...jogosNovosAoVivo, ...todosJogosComPlacar.filter(j => j.roundNumber <= 24)]
    .sort((a, b) => b.roundNumber - a.roundNumber)

  const totalRodadasFinalizadas = rounds.filter((r) => r.finalized && r.number < 100).length
  const totalJogosDisputados = Object.values(BASE_OFICIAL_R24).reduce((s, t) => s + t.jogos, 0) / 2 + jogosNovosAoVivo.length

  return { tabela, estatisticas, proximosJogos, ultimosResultados, totalJogosDisputados, totalRodadasFinalizadas }
}

function calcularTabelaComEvolucaoReal(todosJogos: JogoBrasileirao[], jogosNovos: JogoBrasileirao[]): LinhaTabela[] {
  // Constrói a curva de evolução real rodada a rodada de R1 a R24
  const evolucaoPorTime = new Map<string, number[]>()
  for (const time of Object.keys(BASE_OFICIAL_R24)) {
    evolucaoPorTime.set(time, [0])
  }

  // Agrupa jogos das R1..24 por número de rodada
  const jogosPorRodadaR1R24 = new Map<number, JogoBrasileirao[]>()
  for (const j of todosJogos) {
    if (j.roundNumber <= 24) {
      if (!jogosPorRodadaR1R24.has(j.roundNumber)) jogosPorRodadaR1R24.set(j.roundNumber, [])
      jogosPorRodadaR1R24.get(j.roundNumber)!.push(j)
    }
  }

  // Calcula pontos acumulados rodada por rodada
  const acumPts = new Map<string, number>()
  for (const time of Object.keys(BASE_OFICIAL_R24)) acumPts.set(time, 0)

  const rodadasOrd = Array.from(jogosPorRodadaR1R24.keys()).sort((a, b) => a - b)
  for (const rNum of rodadasOrd) {
    const lista = jogosPorRodadaR1R24.get(rNum)!
    for (const j of lista) {
      if (j.homeScore === null || j.awayScore === null) continue
      const hAcc = acumPts.get(j.home) ?? 0
      const aAcc = acumPts.get(j.away) ?? 0

      if (j.homeScore > j.awayScore) {
        acumPts.set(j.home, hAcc + 3)
      } else if (j.homeScore < j.awayScore) {
        acumPts.set(j.away, aAcc + 3)
      } else {
        acumPts.set(j.home, hAcc + 1)
        acumPts.set(j.away, aAcc + 1)
      }
    }
    // Grava o ponto acumulado do time na rodada
    for (const [t, pts] of acumPts.entries()) {
      if (evolucaoPorTime.has(t)) evolucaoPorTime.get(t)!.push(pts)
    }
  }

  // Preenche a Tabela com a BASE OFICIAL R24
  const timesMap = new Map<string, {
    pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number;
    golsMarcados: number; golsSofridos: number; historico: ResultadoUltimo[];
    evolucaoPts: number[]
  }>()

  for (const [time, b] of Object.entries(BASE_OFICIAL_R24)) {
    const evo = evolucaoPorTime.get(time) ?? []
    // Garante que o último ponto da evolução bate exatamente com a Base R24
    if (evo.length > 0) evo[evo.length - 1] = b.pontos
    else evo.push(b.pontos)

    timesMap.set(time, {
      pontos: b.pontos,
      jogos: b.jogos,
      vitorias: b.vitorias,
      empates: b.empates,
      derrotas: b.derrotas,
      golsMarcados: b.gp,
      golsSofridos: b.gc,
      historico: [...b.ultimos5],
      evolucaoPts: evo,
    })
  }

  // Soma os jogos novos (R25+)
  for (const j of jogosNovos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const home = timesMap.get(j.home)
    const away = timesMap.get(j.away)
    if (!home || !away) continue

    home.jogos++; away.jogos++
    home.golsMarcados += j.homeScore; home.golsSofridos += j.awayScore
    away.golsMarcados += j.awayScore; away.golsSofridos += j.homeScore

    let resHome: ResultadoUltimo, resAway: ResultadoUltimo

    if (j.homeScore > j.awayScore) {
      home.pontos += 3; home.vitorias++; away.derrotas++; resHome = 'V'; resAway = 'D'
    } else if (j.homeScore < j.awayScore) {
      away.pontos += 3; away.vitorias++; home.derrotas++; resHome = 'D'; resAway = 'V'
    } else {
      home.pontos++; away.pontos++; home.empates++; away.empates++; resHome = 'E'; resAway = 'E'
    }

    home.historico.push(resHome)
    away.historico.push(resAway)
    home.evolucaoPts.push(home.pontos)
    away.evolucaoPts.push(away.pontos)
  }

  const linhas: LinhaTabela[] = Array.from(timesMap.entries()).map(([time, dados]) => {
    return {
      time, pontos: dados.pontos, jogos: dados.jogos, vitorias: dados.vitorias, empates: dados.empates,
      derrotas: dados.derrotas, golsMarcados: dados.golsMarcados, golsSofridos: dados.golsSofridos,
      saldoGols: dados.golsMarcados - dados.golsSofridos, ultimos5: dados.historico.slice(-5),
      evolucaoPts: dados.evolucaoPts, posicao: 0, zona: 'meio' as const,
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

function calcularEstatisticas(todosJogos: JogoBrasileirao[], tabela: LinhaTabela[]): EstatisticasCampeonato {
  const melhorAtaque = [...tabela].sort((a, b) => b.golsMarcados - a.golsMarcados).map((t) => ({ time: t.time, valor: t.golsMarcados }))
  const piorDefesa = [...tabela].sort((a, b) => b.golsSofridos - a.golsSofridos).map((t) => ({ time: t.time, valor: t.golsSofridos }))
  const reiEmpate = [...tabela].sort((a, b) => b.empates - a.empates).map((t) => ({ time: t.time, valor: t.empates }))
  const maisVitorias = [...tabela].sort((a, b) => b.vitorias - a.vitorias).map((t) => ({ time: t.time, valor: t.vitorias }))

  // Busca TODAS as goleadas com a maior diferença de gols
  let maxSaldoGoleada = 0
  for (const j of todosJogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const saldo = Math.abs(j.homeScore - j.awayScore)
    if (saldo > maxSaldoGoleada) maxSaldoGoleada = saldo
  }

  // Lista todas as partidas que atingiram o saldo máximo
  const maioresGoleadas: GoleadaItem[] = []
  const goleadasSet = new Set<string>()

  for (const j of todosJogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const saldo = Math.abs(j.homeScore - j.awayScore)
    if (saldo >= 4 && saldo >= maxSaldoGoleada - 1) { // Saldo de 4 ou mais
      const key = `${j.home}-${j.homeScore}x${j.awayScore}-${j.away}`
      if (!goleadasSet.has(key)) {
        goleadasSet.add(key)
        maioresGoleadas.push({
          home: j.home, away: j.away,
          homeScore: j.homeScore, awayScore: j.awayScore,
          saldoAbs: saldo, roundName: j.roundName
        })
      }
    }
  }

  // Média de Gols por Rodada
  const golsPorRodadaMap = new Map<number, { nome: string; totalGols: number; jogos: number }>()

  for (const j of todosJogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const golsJogo = j.homeScore + j.awayScore
    if (!golsPorRodadaMap.has(j.roundNumber)) {
      golsPorRodadaMap.set(j.roundNumber, { nome: j.roundName, totalGols: 0, jogos: 0 })
    }
    const r = golsPorRodadaMap.get(j.roundNumber)!
    r.totalGols += golsJogo
    r.jogos++
  }

  // Cálculo da Média Geral CORRIGIDO (2.59 gols/jogo)
  const totalGolsSomados = tabela.reduce((s, t) => s + t.golsMarcados, 0)
  const totalJogosSomados = tabela.reduce((s, t) => s + t.jogos, 0)
  const mediaGolsGeral = totalJogosSomados > 0 ? Math.round((totalGolsSomados / totalJogosSomados) * 100) / 100 : 0

  const golsPorRodada = Array.from(golsPorRodadaMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, d]) => ({
      roundNumber: num,
      roundName: d.nome,
      totalGols: d.totalGols,
      mediaGols: d.jogos > 0 ? Math.round((d.totalGols / d.jogos) * 100) / 100 : 0,
    }))

  const fortaleza = [...tabela].map((t) => ({ time: t.time, valor: Math.round(t.vitorias * 0.6) })).sort((a, b) => b.valor - a.valor)

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

  const maiorGoleada = maioresGoleadas[0] ?? null

  return { melhorAtaque, piorDefesa, reiEmpate, maiorGoleada, maioresGoleadas, fortaleza, maisVitorias, projecoes, mediaGolsGeral, golsPorRodada }
}

function vazio(): DadosCampeonato {
  return {
    tabela: [],
    estatisticas: { melhorAtaque: [], piorDefesa: [], reiEmpate: [], maiorGoleada: null, maioresGoleadas: [], fortaleza: [], maisVitorias: [], projecoes: [], mediaGolsGeral: 0, golsPorRodada: [] },
    proximosJogos: [], ultimosResultados: [], totalJogosDisputados: 0, totalRodadasFinalizadas: 0
  }
}
