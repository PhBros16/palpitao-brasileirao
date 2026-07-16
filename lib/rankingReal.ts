import { supabase } from './supabase'
import { lerConfig } from './appSettings'

// Camada de dados do Ranking real.
//
// Agrega participants + predictions + matches + rounds (só finalizadas) e
// devolve tudo que a tela /ranking precisa: linhas do ranking (com cravadas/
// vencedor/saldo/projeção), pódio, dados pra "Frente a Frente".
//
// Regra do ranking (mesma do Copa, ver lib/domain/ranking):
//   ordena por: total desc → cravadas desc → vencedor desc → saldo desc
//
// Regra da projeção %:
//   soma dos pontos médios dos últimos N (janela config) + pontos atuais,
//   projeta pra 38 rodadas totais, normaliza cada jogador contra a soma.
//   Se < 2 rodadas finalizadas, projeção = null (UI mostra "—").

export interface LinhaRanking {
  participantId: string
  nome: string
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

/** Rodada finalizada + palpite de UM participante em cada jogo daquela rodada. */
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
    palpiteAH: number | null      // palpite do jogador A (esquerda)
    palpiteAA: number | null
    pontosA: number | null
    palpiteBH: number | null      // palpite do jogador B (direita)
    palpiteBA: number | null
    pontosB: number | null
  }>
  totalA: number
  totalB: number
}

/** Busca o ranking geral (só rodadas finalizadas), já ordenado com desempate. */
export async function buscarRankingReal(): Promise<LinhaRanking[]> {
  const [
    { data: participants, error: pErr },
    { data: rounds, error: rErr },
  ] = await Promise.all([
    supabase.from('participants').select('id, name').order('name'),
    supabase.from('rounds').select('id').eq('finalized', true),
  ])
  if (pErr) throw pErr
  if (rErr) throw rErr
  if (!participants) return []

  const roundIdsFinalizadas = (rounds ?? []).map((r) => r.id)

  // Sem rodadas finalizadas → ranking vazio (com participantes zerados)
  if (roundIdsFinalizadas.length === 0) {
    return participants.map((p, i) => ({
      participantId: p.id,
      nome: p.name,
      total: 0,
      cravadas: 0,
      vencedor: 0,
      saldo: 0,
      projecaoPct: null,
      posicao: i + 1,
    }))
  }

  const { data: matches, error: mErr } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('round_id', roundIdsFinalizadas)
  if (mErr) throw mErr
  const matchIds = (matches ?? []).map((m) => m.id)
  const matchScoreMap = new Map((matches ?? []).map((m) => [m.id, { h: m.home_score, a: m.away_score }]))

  if (matchIds.length === 0) {
    return participants.map((p, i) => ({
      participantId: p.id, nome: p.name, total: 0, cravadas: 0, vencedor: 0, saldo: 0, projecaoPct: null, posicao: i + 1,
    }))
  }

  const { data: predictions, error: predErr } = await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_h, pred_a, points')
    .in('match_id', matchIds)
  if (predErr) throw predErr

  // Agrega por participante: total, cravadas, vencedor, saldo
  const agregado = new Map<string, { total: number; cravadas: number; vencedor: number; saldo: number }>()
  for (const p of participants) agregado.set(p.id, { total: 0, cravadas: 0, vencedor: 0, saldo: 0 })

  for (const pred of predictions ?? []) {
    const resultado = matchScoreMap.get(pred.match_id)
    if (!resultado || resultado.h === null || resultado.a === null) continue
    const bucket = agregado.get(pred.participant_id)
    if (!bucket) continue

    bucket.total += pred.points ?? 0

    const ph = pred.pred_h, pa = pred.pred_a
    const rh = resultado.h, ra = resultado.a

    if (ph === rh && pa === ra) {
      bucket.cravadas++
    } else if (ph - pa === rh - ra) {
      bucket.saldo++
    } else {
      const pw = ph > pa ? 1 : ph < pa ? -1 : 0
      const rw = rh > ra ? 1 : rh < ra ? -1 : 0
      if (pw === rw) bucket.vencedor++
    }
  }

  // Projeção: se >= 2 rodadas finalizadas, calcula; senão null
  const projMap = roundIdsFinalizadas.length >= 2
    ? await calcularProjecoes(participants.map((p) => ({ id: p.id, nome: p.name })), roundIdsFinalizadas)
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
      projecaoPct: roundIdsFinalizadas.length >= 2 ? (projMap.get(p.id) ?? 0) : null,
      posicao: 0, // preenchido logo abaixo
    }
  })

  // Ordena: total desc → cravadas desc → vencedor desc → saldo desc
  linhas.sort((a, b) =>
    b.total - a.total ||
    b.cravadas - a.cravadas ||
    b.vencedor - a.vencedor ||
    b.saldo - a.saldo,
  )
  linhas.forEach((l, i) => { l.posicao = i + 1 })

  return linhas
}

/** Calcula projeção % baseado na janela em app_settings.projecao_janela.
 *  Retorna Map<participantId, pct> onde pct soma ~100 entre todos. */
async function calcularProjecoes(
  participants: Array<{ id: string; nome: string }>,
  roundIdsFinalizadas: string[],
): Promise<Map<string, number>> {
  const cfg = await lerConfig<{ rodadas: number }>('projecao_janela')
  const janela = cfg?.rodadas ?? 3
  const totalRodadas = 38

  // Busca pontos por rodada por participante — pra fazer média da janela
  const { data: matchesTodas } = await supabase
    .from('matches')
    .select('id, round_id')
    .in('round_id', roundIdsFinalizadas)
  const matchToRound = new Map((matchesTodas ?? []).map((m) => [m.id, m.round_id]))

  const { data: preds } = await supabase
    .from('predictions')
    .select('participant_id, match_id, points')
    .in('match_id', (matchesTodas ?? []).map((m) => m.id))

  // Ordena rounds cronologicamente (pela ordem number ASC — precisamos buscar)
  const { data: roundsOrd } = await supabase
    .from('rounds')
    .select('id, number')
    .in('id', roundIdsFinalizadas)
    .order('number', { ascending: true })
  const roundIdsSorted = (roundsOrd ?? []).map((r) => r.id)

  // Total por participante
  const totalPorPart = new Map<string, number>()
  // Pontos por (participant, round)
  const porRound = new Map<string, Map<string, number>>() // roundId → (partId → pts)
  for (const rid of roundIdsSorted) porRound.set(rid, new Map())

  for (const pred of preds ?? []) {
    if (pred.points === null) continue
    const rid = matchToRound.get(pred.match_id)
    if (!rid) continue
    totalPorPart.set(pred.participant_id, (totalPorPart.get(pred.participant_id) ?? 0) + pred.points)
    const bucket = porRound.get(rid)!
    bucket.set(pred.participant_id, (bucket.get(pred.participant_id) ?? 0) + pred.points)
  }

  // Janela: últimas N rodadas (ou todas se janela=0)
  const rodadasJanela = janela === 0 ? roundIdsSorted : roundIdsSorted.slice(-janela)
  const rodadasRestantes = Math.max(totalRodadas - roundIdsSorted.length, 0)

  // Projeta cada participante: total + (media_janela * rodadas_restantes)
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

  // Normaliza pra %
  const somaTotal = Array.from(projTotal.values()).reduce((a, b) => a + b, 0)
  const pctMap = new Map<string, number>()
  if (somaTotal <= 0) return pctMap
  for (const [pid, proj] of projTotal.entries()) {
    pctMap.set(pid, Math.round((proj / somaTotal) * 100))
  }
  return pctMap
}

// ─── Frente a Frente ─────────────────────────────────────────────────────────

/** Lista as N rodadas finalizadas mais recentes (pra dropdown do frente-a-frente). */
export async function buscarRodadasParaFrenteAFrente(): Promise<RodadaFinalizada[]> {
  const { data, error } = await supabase
    .from('rounds')
    .select('id, number, name, is_double')
    .eq('finalized', true)
    .order('number', { ascending: false })
  if (error) throw error
  return data ?? []
}

/** Busca o comparativo detalhado entre 2 participantes numa janela específica.
 *  janela: 'ultima' | 'ult3' | 'ult5' | 'ult10' | 'total' */
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
  const rodadasEscolhidas = rounds.slice(0, limites[janela]).reverse() // mais antiga primeiro

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
