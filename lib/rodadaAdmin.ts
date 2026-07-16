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

/** Um id "novo" (ainda não salvo) é gerado no client como 'j' + timestamp —
 *  nunca colide com um uuid real do Supabase (que sempre tem hífen). */
function ehIdNovo(id: string) {
  return !id.includes('-')
}

/** Busca a rodada ativa (palpites_open = true, a mais recente por número).
 *  Se não houver nenhuma aberta, cai pra rodada de maior número (última criada). */
export async function buscarRodadaAtiva(): Promise<RodadaAdmin> {
  let { data: round } = await supabase
    .from('rounds')
    .select('id, number, name, palpites_open, finalized, is_double')
    .eq('palpites_open', true)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) {
    const res = await supabase.from('rounds').select('id, number, name, palpites_open, finalized, is_double').order('number', { ascending: false }).limit(1).maybeSingle()
    round = res.data
  }

  if (!round) {
    return { roundId: null, nome: 'Rodada 20', numero: 20, aberta: true, finalizada: false, valeDobro: false, jogos: [] }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual, home_score, home_score, away_score')
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

/** Salva nome/número/abertura da rodada + reconcilia os jogos (cria os novos,
 *  atualiza os existentes, apaga os removidos). Retorna o roundId real
 *  (necessário na primeira vez que uma rodada nova é criada). */
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
    const { error } = await supabase.from('rounds').update({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro }).eq('id', idFinal)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('rounds').insert({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro, finalized: false }).select('id').single()
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

/** Retorna a lista de jogos SEM placar lançado na rodada — usado pra popular
 *  o modal "Tá doido é?" antes de finalizar. Se retornar vazio, é seguro
 *  finalizar sem aviso. */
export async function buscarJogosSemPlacar(roundId: string): Promise<Array<{ id: string; home: string; away: string }>> {
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

/** Finaliza a rodada — fecha palpites e marca como encerrada. */
export async function finalizarRodada(roundId: string): Promise<void> {
  const { error } = await supabase.from('rounds').update({ finalized: true, palpites_open: false }).eq('id', roundId)
  if (error) throw error
}

/** Reabre uma rodada finalizada — volta ela pro estado "em andamento". */
export async function reabrirRodada(roundId: string): Promise<void> {
  const { error } = await supabase.from('rounds').update({ finalized: false, palpites_open: true }).eq('id', roundId)
  if (error) throw error
}

/** Lista todas as rodadas finalizadas — pra popular o seletor de reabertura. */
export async function buscarRodadasFinalizadas(): Promise<Array<{ id: string; number: number; name: string }>> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('number', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Apaga todos os palpites da rodada (predictions), sem mexer nos jogos. */
export async function limparPalpitesRodada(roundId: string): Promise<void> {
  const { data: matches } = await supabase.from('matches').select('id').eq('round_id', roundId)
  const ids = (matches ?? []).map((m) => m.id)
  if (ids.length === 0) return
  const { error } = await supabase.from('predictions').delete().in('match_id', ids)
  if (error) throw error
}

/** Lista de participantes reais pro seletor de "Correção Manual". */
export async function buscarParticipantesNomes(): Promise<Array<{ id: string; name: string }>> {
  const { data, error } = await supabase.from('participants').select('id, name').order('name')
  if (error) throw error
  return data ?? []
}

/**
 * Grava o placar real de cada jogo e recalcula os pontos de TODOS os palpites
 * da rodada via lib/domain/pontuacao.ts (calcPoints).
 */
export async function calcularPontosRodada(
  roundId: string,
  resultados: Record<string, { h: number; a: number }>,
  valeDobro: boolean,
): Promise<void> {
  for (const [matchId, r] of Object.entries(resultados)) {
    const { error } = await supabase.from('matches').update({ home_score: r.h, away_score: r.a }).eq('id', matchId)
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
    const { error } = await supabase.from('predictions').update({ points: pontosFinal }).eq('id', p.id)
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

/** Palpites de UM participante nos jogos de uma rodada — pra tela de correção manual. */
export async function buscarPalpitesParticipante(roundId: string, participantId: string): Promise<PalpitePorJogo[]> {
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

/** Sobrescreve manualmente os pontos de um palpite específico. */
export async function corrigirPontoManual(predictionId: string, novoValor: number): Promise<void> {
  const { error } = await supabase.from('predictions').update({ points: novoValor }).eq('id', predictionId)
  if (error) throw error
}

// ─── NOVO: Histórico de rodadas pra Projeção de Campeão ──────────────────────

export interface RodadaHistoricoAdmin {
  /** UUID da rodada */
  roundId: string
  /** Número da rodada (ex: 1, 2, ..., 18, 19) */
  numero: number
  /** Nome da rodada (ex: "Rodada 1") */
  nome: string
  /** Pontos de cada participante nesta rodada.
   *  Chave = participants.name (canônico), valor = soma de predictions.points */
  scores: Record<string, number>
}

/**
 * Busca o histórico completo de rodadas finalizadas com pontos por participante.
 *
 * Usado pela SecaoProjecao pra montar o input de calcProjecaoPct.
 *
 * Query strategy:
 *  1. Busca todas as rounds finalizadas (order by number ASC).
 *  2. Busca todos os matches dessas rounds de uma vez (IN roundIds).
 *  3. Busca todas as predictions com points desses matches de uma vez (IN matchIds).
 *  4. Busca todos os participants de uma vez.
 *  5. Monta o Record<nome, pontos> por rodada em memória — sem N+1 queries.
 */
export async function buscarHistoricoRodadas(): Promise<RodadaHistoricoAdmin[]> {
  // 1. Rounds finalizadas
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('number', { ascending: true })
  if (rErr) throw rErr
  if (!rounds || rounds.length === 0) return []

  const roundIds = rounds.map((r) => r.id)

  // 2. Matches dessas rounds
  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, round_id')
    .in('round_id', roundIds)
  if (mErr) throw mErr

  const matchIds = (matches ?? []).map((m) => m.id)
  if (matchIds.length === 0) return rounds.map((r) => ({ roundId: r.id, numero: r.number, nome: r.name, scores: {} }))

  // Mapa matchId → roundId (pra distribuir pontos pelas rodadas)
  const matchParaRound = new Map((matches ?? []).map((m) => [m.id, m.round_id]))

  // 3. Predictions com points
  const { data: predictions, error: pErr } = await supabase
    .from('predictions')
    .select('match_id, participant_id, points')
    .in('match_id', matchIds)
    .not('points', 'is', null)
  if (pErr) throw pErr

  // 4. Participants
  const { data: participants, error: partErr } = await supabase
    .from('participants')
    .select('id, name')
  if (partErr) throw partErr

  const idParaNome = new Map((participants ?? []).map((p) => [p.id, p.name]))

  // 5. Agrupa pontos por round → participante
  // scores[roundId][participantName] = soma de points
  const scoresMap = new Map<string, Record<string, number>>()
  for (const roundId of roundIds) {
    scoresMap.set(roundId, {})
  }

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
