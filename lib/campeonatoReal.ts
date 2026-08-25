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
  evolucaoPts: number[]
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

    // TABELA 100% AO VIVO: Se o jogo tem placar, entra na tabela oficial na HORA (mesmo se a rodada for ao vivo)
    if (m.home_score !== null && m.away_score !== null) {
      if (!isExtra) {
        jogosComPlacar.push(jogo)
      }
    } else {
      if (!isExtra) jogosFuturos.push(jogo)
    }
  }

  jogosComPlacar.sort((a, b) => a.roundNumber - b.roundNumber)

  const tabela = calcularTabela(jogosComPlacar)
  const estatisticas = calcularEstatisticas(jogosComPlacar, tabela)

  const hoje = new Date().toISOString().split('T')[0]
  const proximosJogos = jogosFuturos
    .filter((j) => !j.date || j.date >= hoje)
    .sort((a, b) => a.roundNumber - b.roundNumber)

  const ultimosResultados = [...jogosComPlacar]
    .sort((a, b) => b.roundNumber - a.roundNumber)

  const totalRodadasFinalizadas = rounds.filter((r) => r.finalized && r.number < 100).length

  return { tabela, estatisticas, proximosJogos, ultimosResultados, totalJogosDisputados: jogosComPlacar.length, totalRodadasFinalizadas }
}

function calcularTabela(jogos: JogoBrasileirao[]): LinhaTabela[] {
  const timesMap = new Map<string, {
    pontos: number; jogos: number; vitorias: number; empates: number; derrotas: number;
    golsMarcados: number; golsSofridos: number; historico: Array<{ resultado: ResultadoUltimo; roundNumber: number }>;
    evolucaoPts: number[]
  }>()

  function getOrCreate(time: string) {
    if (!timesMap.has(time)) {
      timesMap.set(time, { pontos: 0, jogos: 0, vitorias: 0, empates: 0, derrotas: 0, golsMarcados: 0, golsSofridos: 0, historico: [], evolucaoPts: [0] })
    }
    return timesMap.get(time)!
  }

  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const home = getOrCreate(j.home)
    const away = getOrCreate(j.away)

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

    home.historico.push({ resultado: resHome, roundNumber: j.roundNumber })
    away.historico.push({ resultado: resAway, roundNumber: j.roundNumber })

    home.evolucaoPts.push(home.pontos)
    away.evolucaoPts.push(away.pontos)
  }

  const linhas: LinhaTabela[] = Array.from(timesMap.entries()).map(([time, dados]) => {
    const historicoOrdenado = [...dados.historico].sort((a, b) => a.roundNumber - b.roundNumber)
    const ultimos5 = historicoOrdenado.slice(-5).map((h) => h.resultado)
    return {
      time, pontos: dados.pontos, jogos: dados.jogos, vitorias: dados.vitorias, empates: dados.empates,
      derrotas: dados.derrotas, golsMarcados: dados.golsMarcados, golsSofridos: dados.golsSofridos,
      saldoGols: dados.golsMarcados - dados.golsSofridos, ultimos5, evolucaoPts: dados.evolucaoPts, posicao: 0, zona: 'meio' as const,
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
  const melhorAtaque = [...tabela].sort((a, b) => b.golsMarcados - a.golsMarcados).map((t) => ({ time: t.time, valor: t.golsMarcados }))
  const piorDefesa = [...tabela].sort((a, b) => b.golsSofridos - a.golsSofridos).map((t) => ({ time: t.time, valor: t.golsSofridos }))
  const reiEmpate = [...tabela].sort((a, b) => b.empates - a.empates).map((t) => ({ time: t.time, valor: t.empates }))
  const maisVitorias = [...tabela].sort((a, b) => b.vitorias - a.vitorias).map((t) => ({ time: t.time, valor: t.vitorias }))

  let maiorGoleada: EstatisticasCampeonato['maiorGoleada'] = null
  let maiorSaldoAbs = 0
  let totalGolsGeral = 0

  const golsPorRodadaMap = new Map<number, { nome: string; totalGols: number; jogos: number }>()

  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    const golsJogo = j.homeScore + j.awayScore
    totalGolsGeral += golsJogo

    const saldoAbs = Math.abs(j.homeScore - j.awayScore)
    if (saldoAbs > maiorSaldoAbs) {
      maiorSaldoAbs = saldoAbs
      maiorGoleada = { home: j.home, away: j.away, homeScore: j.homeScore, awayScore: j.awayScore, saldoAbs }
    }

    if (!golsPorRodadaMap.has(j.roundNumber)) {
      golsPorRodadaMap.set(j.roundNumber, { nome: j.roundName, totalGols: 0, jogos: 0 })
    }
    const r = golsPorRodadaMap.get(j.roundNumber)!
    r.totalGols += golsJogo
    r.jogos++
  }

  const mediaGolsGeral = jogos.length > 0 ? Math.round((totalGolsGeral / jogos.length) * 100) / 100 : 0

  const golsPorRodada = Array.from(golsPorRodadaMap.entries())
    .sort((a, b) => a[0] - b[0])
    .map(([num, d]) => ({
      roundNumber: num,
      roundName: d.nome,
      totalGols: d.totalGols,
      mediaGols: d.jogos > 0 ? Math.round((d.totalGols / d.jogos) * 100) / 100 : 0,
    }))

  const cleanSheetsMap = new Map<string, number>()
  for (const j of jogos) {
    if (j.homeScore === null || j.awayScore === null) continue
    if (j.awayScore === 0) cleanSheetsMap.set(j.home, (cleanSheetsMap.get(j.home) ?? 0) + 1)
    if (j.homeScore === 0) cleanSheetsMap.set(j.away, (cleanSheetsMap.get(j.away) ?? 0) + 1)
  }
  const fortaleza = Array.from(cleanSheetsMap.entries()).sort((a, b) => b[1] - a[1]).map(([time, valor]) => ({ time, valor }))

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

  return { melhorAtaque, piorDefesa, reiEmpate, maiorGoleada, fortaleza, maisVitorias, projecoes, mediaGolsGeral, golsPorRodada }
}

function vazio(): DadosCampeonato {
  return {
    tabela: [],
    estatisticas: { melhorAtaque: [], piorDefesa: [], reiEmpate: [], maiorGoleada: null, fortaleza: [], maisVitorias: [], projecoes: [], mediaGolsGeral: 0, golsPorRodada: [] },
    proximosJogos: [], ultimosResultados: [], totalJogosDisputados: 0, totalRodadasFinalizadas: 0
  }
}
