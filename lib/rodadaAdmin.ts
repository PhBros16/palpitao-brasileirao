import { supabase } from './supabase'
import { calcPoints } from './domain/pontuacao'

export interface JogoAdmin {
  id: string
  home: string
  away: string
  date: string
  time: string
  locked: boolean
  resultadoH: number | null
  resultadoA: number | null
}

export interface RodadaAdmin {
  roundId: string | null
  nome: string
  numero: number
  aberta: boolean
  finalizada: boolean
  valeDobro: boolean
  jogos: JogoAdmin[]
}

function ehIdNovo(id: string) {
  return !id.includes('-')
}

export async function buscarRodadaAtiva(): Promise<RodadaAdmin> {
  let { data: round } = await supabase
    .from('rounds')
    .select('id, number, name, palpites_open, finalized, is_double')
    .eq('palpites_open', true)
    .eq('finalized', false)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) {
    const res = await supabase
      .from('rounds')
      .select('id, number, name, palpites_open, finalized, is_double')
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle()
    round = res.data
  }

  if (!round) {
    return { roundId: null, nome: 'Rodada 20', numero: 20, aberta: true, finalizada: false, valeDobro: false, jogos: [] }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual, home_score, away_score')
    .eq('round_id', round.id)
    .order('match_date', { ascending: true })

  const jogos: JogoAdmin[] = (matches ?? []).map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    date: m.match_date ?? '',
    time: m.match_time?.slice(0, 5) ?? '',
    locked: m.travado_manual ?? false,
    resultadoH: m.home_score ?? null,
    resultadoA: m.away_score ?? null,
  }))

  return {
    roundId: round.id,
    nome: round.name,
    numero: round.number,
    aberta: round.palpites_open,
    finalizada: round.finalized,
    valeDobro: round.is_double ?? false,
    jogos,
  }
}

export async function salvarRodada(
  roundId: string | null,
  nome: string,
  numero: number,
  aberta: boolean,
  valeDobro: boolean,
  jogos: JogoAdmin[],
  jogosOriginaisIds: string[],
): Promise<string> {
  let idFinal = roundId

  if (idFinal) {
    const { error } = await supabase
      .from('rounds')
      .update({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro })
      .eq('id', idFinal)
    if (error) throw error
  } else {
    const { data, error } = await supabase
      .from('rounds')
      .insert({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro, finalized: false })
      .select('id')
      .single()
    if (error) throw error
    idFinal = data.id
  }

  const idsAtuais = jogos.filter((j) => !ehIdNovo(j.id)).map((j) => j.id)
  const idsRemovidos = jogosOriginaisIds.filter((id) => !idsAtuais.includes(id))
  if (idsRemovidos.length > 0) {
    const { error } = await supabase.from('matches').delete().in('id', idsRemovidos)
    if (error) throw error
  }

  for (const j of jogos) {
    const payload = {
      round_id: idFinal,
      home: j.home,
      away: j.away,
      match_date: j.date || null,
      match_time: j.time || null,
      travado_manual: j.locked,
    }
    if (ehIdNovo(j.id)) {
      const { error } = await supabase.from('matches').insert(payload)
      if (error) throw error
    } else {
      const { error } = await supabase.from('matches').update(payload).eq('id', j.id)
      if (error) throw error
    }
  }

  return idFinal!
}

export async function buscarJogosSemPlacar(
  roundId: string,
): Promise<Array<{ id: string; home: string; away: string }>> {
  const { data, error } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score')
    .eq('round_id', roundId)
    .order('match_date', { ascending: true })
  if (error) throw error
  return (data ?? [])
    .filter((m) => m.home_score === null || m.away_score === null)
    .map((m) => ({ id: m.id, home: m.home, away: m.away }))
}

/**
 * Finaliza uma rodada:
 *   1. Marca rounds.finalized = true e palpites_open = false
 *   2. Popula round_results com pts/cravadas/saldos/vencedores calculados
 *   3. Recalcula total_pts e position em cascata pra TODAS as rodadas
 *      finalizadas (ordem: number crescente)
 */
export async function finalizarRodada(roundId: string): Promise<void> {
  const { error: e1 } = await supabase
    .from('rounds')
    .update({ finalized: true, palpites_open: false })
    .eq('id', roundId)
  if (e1) throw e1

  const { data: parts, error: ePart } = await supabase
    .from('participants')
    .select('id')
    .eq('is_admin', false)
  if (ePart) throw ePart

  const { data: matches } = await supabase
    .from('matches')
    .select('id')
    .eq('round_id', roundId)
  const matchIds = (matches ?? []).map((m) => m.id)

  const { data: preds } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('participant_id, match_id, points')
    .in('match_id', matchIds) : { data: [] as any[] }

  const predsPorPart = new Map<string, Array<{ points: number | null }>>()
  for (const p of preds ?? []) {
    if (!predsPorPart.has(p.participant_id)) predsPorPart.set(p.participant_id, [])
    predsPorPart.get(p.participant_id)!.push({ points: p.points })
  }

  await supabase.from('round_results').delete().eq('round_id', roundId)

  const rows = (parts ?? []).map((part) => {
    const meusPalps = predsPorPart.get(part.id) ?? []
    let pts = 0, exatos = 0, saldos = 0, vencedores = 0
    for (const p of meusPalps) {
      const pt = p.points ?? 0
      pts += pt
      if (pt === 5 || pt === 10) exatos++
      else if (pt === 3 || pt === 6) saldos++
      else if (pt === 1 || pt === 2) vencedores++
    }
    return {
      round_id: roundId,
      participant_id: part.id,
      round_pts: pts,
      total_pts: 0,
      position: 0,
      exact_scores: exatos,
      correct_saldo: saldos,
      correct_winner: vencedores,
      missed: meusPalps.length === 0,
    }
  })

  if (rows.length > 0) {
    const { error: eIns } = await supabase.from('round_results').insert(rows)
    if (eIns) throw eIns
  }

  const { data: rodadasFinalizadas } = await supabase
    .from('rounds')
    .select('id, number')
    .eq('finalized', true)
    .order('number', { ascending: true })

  if (!rodadasFinalizadas || rodadasFinalizadas.length === 0) return

  const roundIds = rodadasFinalizadas.map((r) => r.id)
  const { data: allRRs } = await supabase
    .from('round_results')
    .select('id, round_id, participant_id, round_pts')
    .in('round_id', roundIds)

  if (!allRRs || allRRs.length === 0) return

  const ordemPorRound = new Map(rodadasFinalizadas.map((r, i) => [r.id, i]))

  const rrsSorted = [...allRRs].sort((a, b) => {
    const oa = ordemPorRound.get(a.round_id) ?? 0
    const ob = ordemPorRound.get(b.round_id) ?? 0
    return oa - ob
  })

  const acumPorPart = new Map<string, number>()
  const totalPorRR = new Map<string, number>()

  for (const rr of rrsSorted) {
    const acumAnt = acumPorPart.get(rr.participant_id) ?? 0
    const novoAcum = acumAnt + (rr.round_pts ?? 0)
    acumPorPart.set(rr.participant_id, novoAcum)
    totalPorRR.set(rr.id, novoAcum)
  }

  const posPorRR = new Map<string, number>()
  for (const rd of rodadasFinalizadas) {
    const rrsDaRodada = allRRs
      .filter((rr) => rr.round_id === rd.id)
      .map((rr) => ({
        id: rr.id,
        total: totalPorRR.get(rr.id) ?? 0,
        round: rr.round_pts ?? 0,
      }))
      .sort((a, b) => b.total - a.total || b.round - a.round)

    rrsDaRodada.forEach((rr, i) => {
      posPorRR.set(rr.id, i + 1)
    })
  }

  const updates = allRRs.map((rr) =>
    supabase
      .from('round_results')
      .update({
        total_pts: totalPorRR.get(rr.id) ?? 0,
        position: posPorRR.get(rr.id) ?? 0,
      })
      .eq('id', rr.id),
  )

  const results = await Promise.all(updates)
  const primeiroErro = results.find((r) => r.error)
  if (primeiroErro?.error) throw primeiroErro.error
}

export async function reabrirRodada(roundId: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ finalized: false, palpites_open: true })
    .eq('id', roundId)
  if (error) throw error
}

export async function buscarRodadasFinalizadas(): Promise<
  Array<{ id: string; number: number; name: string }>
> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('number', { ascending: false })
  if (error) throw error
  return data ?? []
}

export async function limparPalpitesRodada(roundId: string): Promise<void> {
  const { data: matches } = await supabase.from('matches').select('id').eq('round_id', roundId)
  const ids = (matches ?? []).map((m) => m.id)
  if (ids.length === 0) return
  const { error } = await supabase.from('predictions').delete().in('match_id', ids)
  if (error) throw error
}

export async function buscarParticipantesNomes(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from('participants').select('id, name').order('name')
  if (error) throw error
  return data ?? []
}

export async function calcularPontosRodada(
  roundId: string,
  resultados: Record<string, { h: number; a: number }>,
  valeDobro: boolean,
): Promise<void> {
  for (const [matchId, r] of Object.entries(resultados)) {
    const { error } = await supabase
      .from('matches')
      .update({ home_score: r.h, away_score: r.a })
      .eq('id', matchId)
    if (error) throw error
  }

  const matchIds = Object.keys(resultados)
  if (matchIds.length === 0) return

  const { data: predictions, error: predErr } = await supabase
    .from('predictions')
    .select('id, match_id, pred_h, pred_a')
    .in('match_id', matchIds)
  if (predErr) throw predErr

  for (const p of predictions ?? []) {
    const resultado = resultados[p.match_id]
    if (!resultado) continue
    const pontos = calcPoints({ h: p.pred_h, a: p.pred_a }, { h: resultado.h, a: resultado.a })
    if (pontos === null) continue
    const pontosFinal = valeDobro ? pontos * 2 : pontos
    const { error } = await supabase
      .from('predictions')
      .update({ points: pontosFinal })
      .eq('id', p.id)
    if (error) throw error
  }
}

export interface PalpitePorJogo {
  matchId: string
  home: string
  away: string
  predH: number | null
  predA: number | null
  resultadoH: number | null
  resultadoA: number | null
  points: number | null
  predictionId: string | null
}

export async function buscarPalpitesParticipante(
  roundId: string,
  participantId: string,
): Promise<PalpitePorJogo[]> {
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score')
    .eq('round_id', roundId)
    .order('match_date', { ascending: true })
  if (mErr) throw mErr

  const matchIds = (matches ?? []).map((m) => m.id)
  const { data: predictions, error: pErr } = await supabase
    .from('predictions')
    .select('id, match_id, pred_h, pred_a, points')
    .eq('participant_id', participantId)
    .in('match_id', matchIds.length ? matchIds : ['00000000-0000-0000-0000-000000000000'])
  if (pErr) throw pErr

  const porJogo = new Map((predictions ?? []).map((p) => [p.match_id, p]))

  return (matches ?? []).map((m) => {
    const pred = porJogo.get(m.id)
    return {
      matchId: m.id,
      home: m.home,
      away: m.away,
      predH: pred?.pred_h ?? null,
      predA: pred?.pred_a ?? null,
      resultadoH: m.home_score ?? null,
      resultadoA: m.away_score ?? null,
      points: pred?.points ?? null,
      predictionId: pred?.id ?? null,
    }
  })
}

export async function corrigirPontoManual(
  predictionId: string,
  novoValor: number,
): Promise<void> {
  const { error } = await supabase
    .from('predictions')
    .update({ points: novoValor })
    .eq('id', predictionId)
  if (error) throw error
}

// ─── Histórico de rodadas pra Projeção de Campeão (Sincronizado com round_results) ────

export interface RodadaHistoricoAdmin {
  roundId: string
  numero: number
  nome: string
  scores: Record<string, number>
}

export async function buscarHistoricoRodadas(): Promise<RodadaHistoricoAdmin[]> {
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('number', { ascending: true })
  if (rErr) throw rErr
  if (!rounds || rounds.length === 0) return []

  const roundIds = rounds.map((r) => r.id)

  const { data: participants, error: partErr } = await supabase
    .from('participants')
    .select('id, name')
    .eq('is_admin', false)
  if (partErr) throw partErr

  const idParaNome = new Map((participants ?? []).map((p) => [p.id, p.name]))

  // Lê DIRETO da fonte oficial (round_results) pra bater 100% com o Ranking
  const { data: rrRows, error: rrErr } = await supabase
    .from('round_results')
    .select('round_id, participant_id, round_pts')
    .in('round_id', roundIds)
  if (rrErr) throw rrErr

  const scoresMap = new Map<string, Record<string, number>>()
  for (const roundId of roundIds) scoresMap.set(roundId, {})

  for (const row of rrRows ?? []) {
    const nome = idParaNome.get(row.participant_id)
    if (!nome) continue
    const bucket = scoresMap.get(row.round_id)
    if (bucket) bucket[nome] = row.round_pts ?? 0
  }

  return rounds.map((r) => ({
    roundId: r.id,
    numero: r.number,
    nome: r.name,
    scores: scoresMap.get(r.id) ?? {},
  }))
}

// ─── Log de ações ─────────────────────────────────────────────────────────────

export interface EntradaLog {
  id: string
  action: string
  payload: Record<string, any> | null
  performed_by: string | null
  participant_id: string | null
  created_at: string
}

export async function gravarLog(
  action: string,
  payload?: Record<string, any>,
  performedBy?: string,
  participantId?: string,
): Promise<void> {
  try {
    await supabase.from('admin_log').insert({
      action,
      payload: payload ?? null,
      performed_by: performedBy ?? null,
      participant_id: participantId ?? null,
    })
  } catch {
    // Silencioso — log nunca bloqueia
  }
}

export async function buscarLog(limite = 50, participantId?: string): Promise<EntradaLog[]> {
  let query = supabase
    .from('admin_log')
    .select('id, action, payload, performed_by, participant_id, created_at')
    .order('created_at', { ascending: false })
    .limit(limite)

  if (participantId) {
    query = query.eq('participant_id', participantId)
  }

  const { data, error } = await query
  if (error) throw error
  return data ?? []
}

// ─── PINs dos participantes ───────────────────────────────────────────────────

export interface ParticipantePin {
  id: string
  name: string
  pin: string
}

export async function buscarParticipantesPins(): Promise<ParticipantePin[]> {
  const { data, error } = await supabase
    .from('participants')
    .select('id, name, pin')
    .order('name')
  if (error) throw error
  return data ?? []
}

export async function atualizarPin(participantId: string, novoPin: string): Promise<void> {
  const { error } = await supabase
    .from('participants')
    .update({ pin: novoPin })
    .eq('id', participantId)
  if (error) throw error
}

// ─── Admins profile ───────────────────────────────────────────────────────────

export interface AdminProfile {
  id: string
  nome: string
  vulgo: string | null
  foto: string | null
  descricao: string | null
  ordem: number
  rating: number | null
  posicao: string | null
  stat_pal: number | null
  stat_ges: number | null
  stat_jus: number | null
  stat_zoa: number | null
  stat_res: number | null
  stat_cra: number | null
  foto_scale: number | null
  foto_pos_x: number | null
  foto_pos_y: number | null
}

export async function buscarAdmins(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('admins_profile')
    .select('id, nome, vulgo, foto, descricao, ordem, rating, posicao, stat_pal, stat_ges, stat_jus, stat_zoa, stat_res, stat_cra, foto_scale, foto_pos_x, foto_pos_y')
    .order('ordem', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function salvarAdmin(adm: {
  id?: string
  nome: string
  vulgo: string | null
  foto: string | null
  descricao: string | null
  ordem: number
  rating?: number | null
  posicao?: string | null
  stat_pal?: number | null
  stat_ges?: number | null
  stat_jus?: number | null
  stat_zoa?: number | null
  stat_res?: number | null
  stat_cra?: number | null
  foto_scale?: number | null
  foto_pos_x?: number | null
  foto_pos_y?: number | null
}): Promise<void> {
  const payload: any = {
    nome: adm.nome,
    vulgo: adm.vulgo,
    foto: adm.foto,
    descricao: adm.descricao,
    ordem: adm.ordem,
    rating: adm.rating ?? null,
    posicao: adm.posicao ?? null,
    stat_pal: adm.stat_pal ?? null,
    stat_ges: adm.stat_ges ?? null,
    stat_jus: adm.stat_jus ?? null,
    stat_zoa: adm.stat_zoa ?? null,
    stat_res: adm.stat_res ?? null,
    stat_cra: adm.stat_cra ?? null,
    foto_scale: adm.foto_scale ?? 1.0,
    foto_pos_x: adm.foto_pos_x ?? 0,
    foto_pos_y: adm.foto_pos_y ?? 0,
  }
  if (adm.id) {
    const { error } = await supabase.from('admins_profile').update(payload).eq('id', adm.id)
    if (error) throw error
  } else {
    const { error } = await supabase.from('admins_profile').insert(payload)
    if (error) throw error
  }
}

export async function removerAdmin(id: string): Promise<void> {
  const { error } = await supabase.from('admins_profile').delete().eq('id', id)
  if (error) throw error
}

// ─── Finalizar Campeonato ─────────────────────────────────────────────────────

export interface SnapshotCampeonato {
  campeao: string
  data_encerramento: string
  snapshot: Array<{ pos: number; nome: string; pontos: number }>
}

export async function finalizarCampeonato(nome: string, adminNome: string): Promise<void> {
  const { data: parts } = await supabase.from('participants').select('id, name')
  const { data: preds } = await supabase
    .from('predictions')
    .select('participant_id, points')
    .not('points', 'is', null)

  const totais: Record<string, number> = {}
  for (const p of preds ?? []) {
    totais[p.participant_id] = (totais[p.participant_id] ?? 0) + p.points
  }

  const ranking = (parts ?? [])
    .map((p) => ({ nome: p.name, pontos: totais[p.id] ?? 0 }))
    .sort((a, b) => b.pontos - a.pontos)
    .map((p, i) => ({ pos: i + 1, nome: p.nome, pontos: p.pontos }))

  const campeao = ranking[0]?.nome ?? '?'
  const dataEncerramento = new Date().toISOString()

  const { error } = await supabase.from('campeonatos_finalizados').insert({
    nome,
    campeao,
    data_encerramento: dataEncerramento,
    snapshot: ranking,
  })
  if (error) throw error

  await gravarLog('CAMPEONATO_FINALIZADO', { nome, campeao, totalJogadores: ranking.length }, adminNome)
}
