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

export async function finalizarRodada(roundId: string): Promise<void> {
  const { error } = await supabase
    .from('rounds')
    .update({ finalized: true, palpites_open: false })
    .eq('id', roundId)
  if (error) throw error
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

// ─── Histórico de rodadas pra Projeção de Campeão ────────────────────────────

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

  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, round_id')
    .in('round_id', roundIds)
  if (mErr) throw mErr

  const matchIds = (matches ?? []).map((m) => m.id)
  if (matchIds.length === 0) {
    return rounds.map((r) => ({ roundId: r.id, numero: r.number, nome: r.name, scores: {} }))
  }

  const matchParaRound = new Map((matches ?? []).map((m) => [m.id, m.round_id]))

  const { data: predictions, error: pErr } = await supabase
    .from('predictions')
    .select('match_id, participant_id, points')
    .in('match_id', matchIds)
    .not('points', 'is', null)
  if (pErr) throw pErr

  const { data: participants, error: partErr } = await supabase
    .from('participants')
    .select('id, name')
  if (partErr) throw partErr

  const idParaNome = new Map((participants ?? []).map((p) => [p.id, p.name]))

  const scoresMap = new Map<string, Record<string, number>>()
  for (const roundId of roundIds) scoresMap.set(roundId, {})

  for (const pred of predictions ?? []) {
    const roundId = matchParaRound.get(pred.match_id)
    if (!roundId) continue
    const nome = idParaNome.get(pred.participant_id)
    if (!nome) continue
    const bucket = scoresMap.get(roundId)!
    bucket[nome] = (bucket[nome] ?? 0) + (pred.points ?? 0)
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
  created_at: string
}

/** Grava uma entrada no log de ações do admin.
 *  Falha silenciosa — nunca deve bloquear a ação principal. */
export async function gravarLog(
  action: string,
  payload?: Record<string, any>,
  performedBy?: string,
): Promise<void> {
  try {
    await supabase.from('admin_log').insert({
      action,
      payload: payload ?? null,
      performed_by: performedBy ?? null,
    })
  } catch {
    // Silencioso — log nunca bloqueia
  }
}

/** Busca as últimas N entradas do log, ordenadas da mais recente pra mais antiga. */
export async function buscarLog(limite = 50): Promise<EntradaLog[]> {
  const { data, error } = await supabase
    .from('admin_log')
    .select('id, action, payload, performed_by, created_at')
    .order('created_at', { ascending: false })
    .limit(limite)
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
}

export async function buscarAdmins(): Promise<AdminProfile[]> {
  const { data, error } = await supabase
    .from('admins_profile')
    .select('id, nome, vulgo, foto, descricao, ordem')
    .order('ordem', { ascending: true })
  if (error) throw error
  return data ?? []
}

export async function salvarAdmin(admin: Omit<AdminProfile, 'id'> & { id?: string }): Promise<void> {
  if (admin.id) {
    const { error } = await supabase
      .from('admins_profile')
      .update({
        nome: admin.nome,
        vulgo: admin.vulgo,
        foto: admin.foto,
        descricao: admin.descricao,
        ordem: admin.ordem,
      })
      .eq('id', admin.id)
    if (error) throw error
  } else {
    const { error } = await supabase
      .from('admins_profile')
      .insert({
        nome: admin.nome,
        vulgo: admin.vulgo,
        foto: admin.foto,
        descricao: admin.descricao,
        ordem: admin.ordem,
      })
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
  // 1. Monta snapshot do ranking atual
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

  // 2. Grava snapshot
  const { error } = await supabase.from('campeonatos_finalizados').insert({
    nome,
    campeao,
    data_encerramento: dataEncerramento,
    snapshot: ranking,
  })
  if (error) throw error

  // 3. Grava log
  await gravarLog('CAMPEONATO_FINALIZADO', { nome, campeao, totalJogadores: ranking.length }, adminNome)
}
