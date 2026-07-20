import { supabase } from './supabase'
import { lerConfig } from './appSettings'

// Camada de dados do Ranking real.
//
// Fonte oficial: tabela round_results (importada do histórico).
// Pra rodadas NOVAS (19+), os pontos serão gravados em round_results via
// a rotina de finalização de rodada (próxima etapa).
//
// Regras:
//   - Só participantes com is_admin=false
//   - Só rodadas com finalized=true
//   - Ordena por: total desc → cravadas desc → vencedor desc → saldo desc
//   - Projeção %: config app_settings.projecao_janela

export interface LinhaRanking {
  participantId: string
  nome: string
  emoji: string | null
  avatar: string | null
  total: number
  cravadas: number
  vencedor: number
  saldo: number
  projecaoPct: number | null
  posicao: number
}

export interface RodadaFinalizada {
  id: string
  numero: number
  nome: string
  is_double: boolean
}

export interface FrenteFrenteRodada {
  roundId: string
  numero: number
  nome: string
  jogos: Array<{
    matchId: string
    home: string
    away: string
    resultadoH: number | null
    resultadoA: number | null
    palpiteAH: number | null
    palpiteAA: number | null
    pontosA: number | null
    palpiteBH: number | null
    palpiteBA: number | null
    pontosB: number | null
  }>
  totalA: number
  totalB: number
}

/** Busca o ranking geral (de round_results, só finalizadas, só não-admins). */
export async function buscarRankingReal(): Promise<LinhaRanking[]> {
  const { data: participants, error: pErr } = await supabase
    .from('participants')
    .select('id, name')
    .eq('is_admin', false)
    .order('name')
  if (pErr) throw pErr
  if (!participants) return []

  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id')
    .eq('finalized', true)
  if (rErr) throw rErr
  const roundIds = (rounds ?? []).map((r) => r.id)

  if (roundIds.length === 0) {
    return participants.map((p, i) => ({
      participantId: p.id, nome: p.name,
      total: 0, cravadas: 0, vencedor: 0, saldo: 0,
      projecaoPct: null, posicao: i + 1,
    }))
  }

  // Agrega de round_results
  const { data: rr, error: rrErr } = await supabase
    .from('round_results')
    .select('participant_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .in('round_id', roundIds)
  if (rrErr) throw rrErr

  const agregado = new Map<string, { total: number; cravadas: number; vencedor: number; saldo: number }>()
  for (const p of participants) agregado.set(p.id, { total: 0, cravadas: 0, vencedor: 0, saldo: 0 })

  for (const row of rr ?? []) {
    const bucket = agregado.get(row.participant_id)
    if (!bucket) continue // ignora admin
    bucket.total += row.round_pts ?? 0
    bucket.cravadas += row.exact_scores ?? 0
    bucket.saldo += row.correct_saldo ?? 0
    bucket.vencedor += row.correct_winner ?? 0
  }

  // Projeção
  const projMap = roundIds.length >= 2
    ? await calcularProjecoes(participants.map((p) => ({ id: p.id })), roundIds)
    : new Map<string, number>()

  const linhas = participants.map((p) => {
    const agg = agregado.get(p.id)!
    return {
      participantId: p.id,
      nome: p.name,
      total: agg.total,
      cravadas: agg.cravadas,
      vencedor: agg.vencedor,
      saldo: agg.saldo,
      projecaoPct: roundIds.length >= 2 ? (projMap.get(p.id) ?? 0) : null,
      posicao: 0,
    }
  })

  linhas.sort((a, b) =>
    b.total - a.total ||
    b.cravadas - a.cravadas ||
    b.vencedor - a.vencedor ||
    b.saldo - a.saldo,
  )
  linhas.forEach((l, i) => { l.posicao = i + 1 })

  return linhas
}

async function calcularProjecoes(
  participants: Array<{ id: string }>,
  roundIdsFinalizadas: string[],
): Promise<Map<string, number>> {
  const cfg = await lerConfig<{ rodadas: number }>('projecao_janela')
  const janela = cfg?.rodadas ?? 3
  const totalRodadas = 38

  // Busca round_results + ordena por round number
  const { data: roundsOrd } = await supabase
    .from('rounds')
    .select('id, number')
    .in('id', roundIdsFinalizadas)
    .order('number', { ascending: true })
  const roundIdsSorted = (roundsOrd ?? []).map((r) => r.id)

  const { data: rr } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts')
    .in('round_id', roundIdsSorted)

  // Total acumulado por participante
  const totalPorPart = new Map<string, number>()
  // Pontos por rodada por participante
  const porRound = new Map<string, Map<string, number>>()
  for (const rid of roundIdsSorted) porRound.set(rid, new Map())

  for (const row of rr ?? []) {
    totalPorPart.set(row.participant_id, (totalPorPart.get(row.participant_id) ?? 0) + (row.round_pts ?? 0))
    const bucket = porRound.get(row.round_id)
    if (bucket) bucket.set(row.participant_id, (bucket.get(row.participant_id) ?? 0) + (row.round_pts ?? 0))
  }

  const rodadasJanela = janela === 0 ? roundIdsSorted : roundIdsSorted.slice(-janela)
  const rodadasRestantes = Math.max(totalRodadas - roundIdsSorted.length, 0)

  const projTotal = new Map<string, number>()
  for (const p of participants) {
    let somaJanela = 0
    for (const rid of rodadasJanela) {
      somaJanela += porRound.get(rid)?.get(p.id) ?? 0
    }
    const media = rodadasJanela.length > 0 ? somaJanela / rodadasJanela.length : 0
    const projecao = (totalPorPart.get(p.id) ?? 0) + media * rodadasRestantes
    projTotal.set(p.id, projecao)
  }

  const somaTotal = Array.from(projTotal.values()).reduce((a, b) => a + b, 0)
  const pctMap = new Map<string, number>()
  if (somaTotal <= 0) return pctMap
  for (const [pid, proj] of projTotal.entries()) {
    pctMap.set(pid, Math.round((proj / somaTotal) * 100))
  }
  return pctMap
}

// ─── Frente a Frente ─────────────────────────────────────────────────────────

export async function buscarRodadasParaFrenteAFrente(): Promise<RodadaFinalizada[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, number, name, is_double')
    .eq('finalized', true)
    .order('number', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function buscarFrenteAFrente(
  participantIdA: string,
  participantIdB: string,
  janela: 'ultima' | 'ult3' | 'ult5' | 'ult10' | 'total',
): Promise<FrenteFrenteRodada[]> {
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('number', { ascending: false })
  if (rErr) throw rErr
  if (!rounds || rounds.length === 0) return []

  const limites: Record<string, number> = { ultima: 1, ult3: 3, ult5: 5, ult10: 10, total: 999 }
  const rodadasEscolhidas = rounds.slice(0, limites[janela]).reverse()
  const roundIds = rodadasEscolhidas.map((r) => r.id)

  const { data: matches } = await supabase
    .from('matches')
    .select('id, round_id, home, away, home_score, away_score, match_date')
    .in('round_id', roundIds)
    .order('match_date', { ascending: true })

  const { data: preds } = await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_h, pred_a, points')
    .in('participant_id', [participantIdA, participantIdB])
    .in('match_id', (matches ?? []).map((m) => m.id))

  const predMapA = new Map<string, { h: number; a: number; pts: number | null }>()
  const predMapB = new Map<string, { h: number; a: number; pts: number | null }>()
  for (const p of preds ?? []) {
    const map = p.participant_id === participantIdA ? predMapA : predMapB
    map.set(p.match_id, { h: p.pred_h, a: p.pred_a, pts: p.points })
  }

  return rodadasEscolhidas.map((r) => {
    const jogosDaRodada = (matches ?? []).filter((m) => m.round_id === r.id)
    const jogos = jogosDaRodada.map((m) => {
      const pA = predMapA.get(m.id)
      const pB = predMapB.get(m.id)
      return {
        matchId: m.id,
        home: m.home,
        away: m.away,
        resultadoH: m.home_score,
        resultadoA: m.away_score,
        palpiteAH: pA?.h ?? null,
        palpiteAA: pA?.a ?? null,
        pontosA: pA?.pts ?? null,
        palpiteBH: pB?.h ?? null,
        palpiteBA: pB?.a ?? null,
        pontosB: pB?.pts ?? null,
      }
    })
    // Pontos do frente-a-frente vêm de round_results (mais confiável)
    const totalA = jogos.reduce((s, j) => s + (j.pontosA ?? 0), 0)
    const totalB = jogos.reduce((s, j) => s + (j.pontosB ?? 0), 0)
    return { roundId: r.id, numero: r.number, nome: r.name, jogos, totalA, totalB }
  })
}
