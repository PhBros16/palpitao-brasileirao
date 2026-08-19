import { supabase } from './supabase'

// Camada de dados das Estatísticas do Ranking.
//
// Duas fontes principais:
//   - round_results (agregado por rodada — fonte oficial de pontos/cravadas/etc)
//   - predictions   (para detalhamento por jogo — palpite vs resultado)
//
// Regra: só rodadas com finalized=true entram. Só participantes com
// is_admin=false. Mesma lógica do ranking.

export interface MinhasStatsReal {
  rodadas: number
  cravadas: number
  vencedor: number
  saldo: number
  mediaPts: number
  meuRecorde: number
  tendencia: 'alta' | 'baixa' | 'estavel' | 'sem_dados'

  ptsPorRodada: Array<{
    roundId: string
    numero: number
    label: string
    nome: string
    pontos: number | null
    cravadas: number
    saldos: number
    vencedores: number
  }>

  pctPlacarExato: number
  pctVencedor: number
  pctSaldo: number
  totalComPalpite: number
}

export interface DetalheJogoRodada {
  matchId: string
  home: string
  away: string
  resultadoH: number | null
  resultadoA: number | null
  palpiteH: number | null
  palpiteA: number | null
  pontos: number | null
}

export async function buscarMinhasStats(participantId: string): Promise<MinhasStatsReal> {
  // 1. Lista rodadas finalizadas em ordem cronológica REAL (por created_at)
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('created_at', { ascending: true })

  const roundList = rounds ?? []
  const roundIds = roundList.map((r) => r.id)

  if (roundIds.length === 0) {
    return {
      rodadas: 0, cravadas: 0, vencedor: 0, saldo: 0,
      mediaPts: 0, meuRecorde: 0, tendencia: 'sem_dados',
      ptsPorRodada: [],
      pctPlacarExato: 0, pctVencedor: 0, pctSaldo: 0, totalComPalpite: 0,
    }
  }

  const { data: rrRows } = await supabase
    .from('round_results')
    .select('round_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .eq('participant_id', participantId)
    .in('round_id', roundIds)

  const rrByRound = new Map((rrRows ?? []).map((r) => [r.round_id, r]))

  let cravadas = 0, vencedor = 0, saldo = 0, totalPts = 0, rodadas = 0, meuRecorde = 0
  const rodadasExtras = roundList.filter((r) => r.number >= 100).sort((a, b) => a.number - b.number)
  const mapaExtra = new Map(rodadasExtras.map((r, i) => [r.id, `E${i + 1}`]))
  function montarLabel(r: { id: string; number: number }): string {
    return mapaExtra.get(r.id) ?? `R${r.number}`
  }

  const ptsPorRodada = roundList.map((r) => {
    const rr = rrByRound.get(r.id)
    const label = montarLabel(r)
    if (!rr) {
      return { roundId: r.id, numero: r.number, label, nome: r.name, pontos: null, cravadas: 0, saldos: 0, vencedores: 0 }
    }
    const pts = rr.round_pts ?? 0
    cravadas += rr.exact_scores ?? 0
    vencedor += rr.correct_winner ?? 0
    saldo += rr.correct_saldo ?? 0
    totalPts += pts
    rodadas++
    if (pts > meuRecorde) meuRecorde = pts
    return {
      roundId: r.id, numero: r.number, label, nome: r.name,
      pontos: pts,
      cravadas: rr.exact_scores ?? 0,
      saldos: rr.correct_saldo ?? 0,
      vencedores: rr.correct_winner ?? 0,
    }
  })

  const mediaPts = rodadas > 0 ? Math.round((totalPts / rodadas) * 10) / 10 : 0

  const pontosNumericos = ptsPorRodada.filter((p) => p.pontos !== null).map((p) => p.pontos!) as number[]
  let tendencia: MinhasStatsReal['tendencia'] = 'sem_dados'
  if (pontosNumericos.length >= 2) {
    const N = 5
    const ultimas = pontosNumericos.slice(-N)
    const anteriores = pontosNumericos.slice(0, -N)
    if (ultimas.length > 0 && anteriores.length > 0) {
      const mU = ultimas.reduce((a, b) => a + b, 0) / ultimas.length
      const mA = anteriores.reduce((a, b) => a + b, 0) / anteriores.length
      const diff = mU - mA
      if (diff > 1) tendencia = 'alta'
      else if (diff < -1) tendencia = 'baixa'
      else tendencia = 'estavel'
    } else {
      tendencia = 'estavel'
    }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('round_id', roundIds)
  const matchIds = (matches ?? []).map((m) => m.id)

  let totalComPalpite = 0
  if (matchIds.length > 0) {
    const { count } = await supabase
      .from('predictions')
      .select('id', { count: 'exact', head: true })
      .eq('participant_id', participantId)
      .in('match_id', matchIds)
      .not('points', 'is', null)
    totalComPalpite = count ?? 0
  }

  const pctPlacarExato = totalComPalpite > 0 ? Math.round((cravadas / totalComPalpite) * 100) : 0
  const pctVencedor = totalComPalpite > 0 ? Math.round(((cravadas + vencedor) / totalComPalpite) * 100) : 0
  const pctSaldo = totalComPalpite > 0 ? Math.round((saldo / totalComPalpite) * 100) : 0

  return {
    rodadas, cravadas, vencedor, saldo,
    mediaPts, meuRecorde, tendencia,
    ptsPorRodada,
    pctPlacarExato, pctVencedor, pctSaldo, totalComPalpite,
  }
}

export async function buscarDetalheRodada(
  roundId: string,
  participantId: string,
): Promise<DetalheJogoRodada[]> {
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score, match_date')
    .eq('round_id', roundId)
    .order('match_date', { ascending: true })

  const matchIds = (matches ?? []).map((m) => m.id)
  const { data: preds } = await supabase
    .from('predictions')
    .select('match_id, pred_h, pred_a, points')
    .eq('participant_id', participantId)
    .in('match_id', matchIds)

  const predMap = new Map((preds ?? []).map((p) => [p.match_id, p]))

  return (matches ?? []).map((m) => {
    const p = predMap.get(m.id)
    return {
      matchId: m.id,
      home: m.home,
      away: m.away,
      resultadoH: m.home_score,
      resultadoA: m.away_score,
      palpiteH: p?.pred_h ?? null,
      palpiteA: p?.pred_a ?? null,
      pontos: p?.points ?? null,
    }
  })
}
