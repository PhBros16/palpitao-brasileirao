import { supabase } from './supabase'
import { lerConfig } from './appSettings'
import { calcProjecaoPct } from './domain/projecao'

// Camada de dados do Ranking real.
//
// Lê da tabela round_results (fonte oficial compartilhada com o Histórico).
//
// Regras do Ranking Oficial:
//   - PONTOS: soma de round_pts de todas as rodadas finalizadas
//   - CRAV.: soma de exact_scores (cravadas)
//   - SALDO: soma de correct_saldo (saldos)
//   - VENC.: soma de correct_winner (vencedor puro = 1pt)
//
// Filtros:
//   - Só participantes com is_admin = false
//   - Só rodadas com finalized = true

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

export async function buscarRankingReal(): Promise<LinhaRanking[]> {
  const [
    { data: participants, error: pErr },
    { data: rounds, error: rErr },
  ] = await Promise.all([
    supabase
      .from('participants')
      .select('id, name, emoji, avatar')
      .eq('is_admin', false)
      .order('name'),
    supabase
      .from('rounds')
      .select('id, number')
      .eq('finalized', true),
  ])

  if (pErr) throw pErr
  if (!participants) return []
  if (rErr) throw rErr

  const roundIds = (rounds ?? []).map((r) => r.id)

  if (roundIds.length === 0) {
    return participants.map((p, i) => ({
      participantId: p.id,
      nome: p.name,
      emoji: p.emoji ?? null,
      avatar: p.avatar ?? null,
      total: 0,
      cravadas: 0,
      vencedor: 0,
      saldo: 0,
      projecaoPct: null,
      posicao: i + 1,
    }))
  }

  // Busca agregados da tabela round_results
  const { data: rr, error: rrErr } = await supabase
    .from('round_results')
    .select('participant_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .in('round_id', roundIds)

  if (rrErr) throw rrErr

  const agregado = new Map<string, { total: number; cravadas: number; vencedor: number; saldo: number }>()
  for (const p of participants) {
    agregado.set(p.id, { total: 0, cravadas: 0, vencedor: 0, saldo: 0 })
  }

  for (const row of rr ?? []) {
    const bucket = agregado.get(row.participant_id)
    if (!bucket) continue

    bucket.total += (row.round_pts ?? 0)
    bucket.cravadas += (row.exact_scores ?? 0)
    bucket.saldo += (row.correct_saldo ?? 0)
    bucket.vencedor += (row.correct_winner ?? 0) // Vencedor Puro (Opção B)
  }

  const projMap = roundIds.length >= 2
    ? await calcularProjecoes(participants.map((p) => ({ id: p.id, name: p.name })), roundIds)
    : new Map<string, number>()

  const linhas = participants.map((p) => {
    const agg = agregado.get(p.id)!
    return {
      participantId: p.id,
      nome: p.name,
      emoji: p.emoji ?? null,
      avatar: p.avatar ?? null,
      total: agg.total,
      cravadas: agg.cravadas,
      vencedor: agg.vencedor,
      saldo: agg.saldo,
      projecaoPct: roundIds.length >= 2 ? (projMap.get(p.id) ?? 0) : null,
      posicao: 0,
    }
  })

  // Ordenação oficial
  linhas.sort((a, b) => b.total - a.total || b.cravadas - a.cravadas || b.vencedor - a.vencedor || b.saldo - a.saldo)
  linhas.forEach((l, i) => { l.posicao = i + 1 })

  return linhas
}

async function calcularProjecoes(
  participants: Array<{ id: string; name: string }>,
  roundIdsFinalizadas: string[]
): Promise<Map<string, number>> {
  const cfg = await lerConfig<{ rodadas: number }>('projecao_janela')
  const janela = cfg?.rodadas ?? 3

  const { data: roundsOrd } = await supabase
    .from('rounds')
    .select('id, number')
    .in('id', roundIdsFinalizadas)
    .order('number', { ascending: true })

  if (!roundsOrd || roundsOrd.length === 0) return new Map()
  const roundIdsSorted = roundsOrd.map((r) => r.id)

  const { data: rr } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts')
    .in('round_id', roundIdsSorted)

  const idParaNome = new Map(participants.map((p) => [p.id, p.name]))
  const nomeParaId = new Map(participants.map((p) => [p.name, p.id]))
  const players = participants.map((p) => p.name)

  const totalPoints: Record<string, number> = {}
  for (const p of players) totalPoints[p] = 0

  const roundScoresMap = new Map<string, Record<string, number>>()
  for (const rid of roundIdsSorted) roundScoresMap.set(rid, {})

  for (const row of rr ?? []) {
    const nome = idParaNome.get(row.participant_id)
    if (!nome) continue
    const pts = row.round_pts ?? 0
    totalPoints[nome] = (totalPoints[nome] ?? 0) + pts
    const bucket = roundScoresMap.get(row.round_id)!
    bucket[nome] = (bucket[nome] ?? 0) + pts
  }

  const historico = roundIdsSorted.map((rid) => ({ scores: roundScoresMap.get(rid) ?? {} }))
  const slice = janela === 0 ? historico : historico.slice(-janela)

  const projObj = calcProjecaoPct({ players, totalPoints, history: slice, totalRodadas: 38 })

  const pctMap = new Map<string, number>()
  for (const [nome, pct] of Object.entries(projObj)) {
    const pid = nomeParaId.get(nome)
    if (pid) pctMap.set(pid, pct)
  }
  return pctMap
}

export async function buscarRodadasParaFrenteAFrente(): Promise<RodadaFinalizada[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, number, name, is_double')
    .eq('finalized', true)
    .order('number', { ascending: false })

  if (error) throw error
  return (data ?? []).map((r) => ({
    id: r.id,
    numero: r.number,
    nome: r.name,
    is_double: r.is_double,
  }))
}

export async function buscarFrenteAFrente(
  participantIdA: string,
  participantIdB: string,
  janela: 'ultima' | 'ult3' | 'ult5' | 'ult10' | 'total'
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

    const totalA = jogos.reduce((s, j) => s + (j.pontosA ?? 0), 0)
    const totalB = jogos.reduce((s, j) => s + (j.pontosB ?? 0), 0)

    return { roundId: r.id, numero: r.number, nome: r.name, jogos, totalA, totalB }
  })
}
