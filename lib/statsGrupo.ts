import { supabase } from './supabase'

// Camada de dados das Estatísticas do Grupo (aba Ranking → Estatísticas → Grupo).
//
// Todas as 8 funções agregam dados de todos os 14 participantes.
// Fonte primária: round_results (mesma do ranking oficial).
// Fonte secundária: predictions + matches (só pra Perfil de Aposta e
// Placares mais apostados, que precisam de detalhe por jogo).
//
// Filtros aplicados em todas:
//   - participants.is_admin = false (exclui "Administração")
//   - rounds.finalized = true (só rodadas oficiais)

export interface JogadorCravadasZeros {
  nome: string
  cravadas: number
  zeros: number
  totalPalpites: number
  pctCravadas: number
  pctZeros: number
}

export interface JogadorAcertoVencedor {
  nome: string
  acertos: number         // cravadas + saldos + vencedores
  totalPalpites: number
  pct: number
}

export interface JogadorBipolar {
  nome: string
  max: number
  min: number
  variacao: number
}

export interface JogadorConsistencia {
  nome: string
  media: number
  desvioPadrao: number
  perfil: 'consistente' | 'regular' | 'bipolar'
}

export interface JogadorOverUnder {
  nome: string
  media: number
  diff: number
  status: 'over' | 'under'
}

export interface JogadorPerfilAposta {
  nome: string
  pctMandante: number
  pctVisitante: number
  pctEmpate: number
}

export interface JogadorRecorde {
  nome: string
  recorde: number
  tendencia: 'alta' | 'baixa' | 'estavel' | 'sem_dados'
}

export interface PlacarFrequencia {
  placar: string          // ex: "2x1"
  qtd: number
}

export interface StatsGrupoCompleto {
  cravadasZeros: JogadorCravadasZeros[]
  acertoVencedor: JogadorAcertoVencedor[]
  bipolares: JogadorBipolar[]
  consistencia: JogadorConsistencia[]
  overUnder: { overs: JogadorOverUnder[]; unders: JogadorOverUnder[]; mediaGrupo: number }
  perfilAposta: JogadorPerfilAposta[]
  recordes: JogadorRecorde[]
  placares: { apostados: PlacarFrequencia[]; reais: PlacarFrequencia[] }
}

// ─── Função principal — busca tudo de uma vez ────────────────────────────────

export async function buscarStatsGrupo(): Promise<StatsGrupoCompleto> {
  // 1. Carrega dados base em paralelo
  const [
    { data: participants },
    { data: rounds },
  ] = await Promise.all([
    supabase.from('participants').select('id, name').eq('is_admin', false).order('name'),
    supabase.from('rounds').select('id, number').eq('finalized', true).order('number', { ascending: true }),
  ])

  if (!participants || !rounds || rounds.length === 0) {
    return vazio()
  }

  const roundIds = rounds.map((r) => r.id)
  const partById = new Map(participants.map((p) => [p.id, p.name]))

  // 2. round_results de todas as rodadas finalizadas
  const { data: rrRows } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .in('round_id', roundIds)

  // Agrega por participante
  interface AggPart {
    nome: string
    cravadas: number
    saldos: number
    vencedores: number
    zerosContados: number  // rodadas onde round_pts = 0
    ptsPorRodada: number[]  // pra bipolar/consistência/recorde
    totalRodadas: number
    somaPts: number
    recorde: number
  }
  const aggMap = new Map<string, AggPart>()
  for (const p of participants) {
    aggMap.set(p.id, {
      nome: p.name, cravadas: 0, saldos: 0, vencedores: 0, zerosContados: 0,
      ptsPorRodada: [], totalRodadas: 0, somaPts: 0, recorde: 0,
    })
  }

  for (const rr of rrRows ?? []) {
    const agg = aggMap.get(rr.participant_id)
    if (!agg) continue
    const pts = rr.round_pts ?? 0
    agg.cravadas += rr.exact_scores ?? 0
    agg.saldos += rr.correct_saldo ?? 0
    agg.vencedores += rr.correct_winner ?? 0
    agg.ptsPorRodada.push(pts)
    agg.totalRodadas++
    agg.somaPts += pts
    if (pts > agg.recorde) agg.recorde = pts
  }

  // 3. Predictions + matches (pra zeros reais, perfil aposta, placares)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home_score, away_score')
    .in('round_id', roundIds)
  const matchScoreMap = new Map((matches ?? []).map((m) => [m.id, { h: m.home_score, a: m.away_score }]))
  const matchIds = (matches ?? []).map((m) => m.id)

  const { data: preds } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_h, pred_a, points')
    .in('match_id', matchIds) : { data: [] as any[] }

  // Total palpites (com pontos calculados) e zeros reais por participante
  const totalPalpitesMap = new Map<string, number>()
  const zerosMap = new Map<string, number>()
  const mandanteMap = new Map<string, number>()
  const visitanteMap = new Map<string, number>()
  const empateMap = new Map<string, number>()

  const placaresApostados = new Map<string, number>()
  const placaresReais = new Map<string, number>()

  for (const pred of preds ?? []) {
    const res = matchScoreMap.get(pred.match_id)
    if (!res || res.h === null || res.a === null) continue

    // Total palpites (só onde tem resultado)
    totalPalpitesMap.set(pred.participant_id, (totalPalpitesMap.get(pred.participant_id) ?? 0) + 1)

    // Zeros (points = 0)
    if (pred.points === 0) {
      zerosMap.set(pred.participant_id, (zerosMap.get(pred.participant_id) ?? 0) + 1)
    }

    // Perfil de aposta
    if (pred.pred_h > pred.pred_a) mandanteMap.set(pred.participant_id, (mandanteMap.get(pred.participant_id) ?? 0) + 1)
    else if (pred.pred_h < pred.pred_a) visitanteMap.set(pred.participant_id, (visitanteMap.get(pred.participant_id) ?? 0) + 1)
    else empateMap.set(pred.participant_id, (empateMap.get(pred.participant_id) ?? 0) + 1)

    // Placares
    const palpKey = `${pred.pred_h}x${pred.pred_a}`
    placaresApostados.set(palpKey, (placaresApostados.get(palpKey) ?? 0) + 1)
  }

  // Placares reais (uma vez por match)
  for (const m of matches ?? []) {
    if (m.home_score === null || m.away_score === null) continue
    const key = `${m.home_score}x${m.away_score}`
    placaresReais.set(key, (placaresReais.get(key) ?? 0) + 1)
  }

  // ─── Monta os 8 blocos ────────────────────────────────────────────────

  // 1. Cravadas & Zeros
  const cravadasZeros: JogadorCravadasZeros[] = participants.map((p) => {
    const agg = aggMap.get(p.id)!
    const total = totalPalpitesMap.get(p.id) ?? 0
    const zeros = zerosMap.get(p.id) ?? 0
    return {
      nome: p.name,
      cravadas: agg.cravadas,
      zeros,
      totalPalpites: total,
      pctCravadas: total > 0 ? Math.round((agg.cravadas / total) * 100) : 0,
      pctZeros: total > 0 ? Math.round((zeros / total) * 100) : 0,
    }
  })

  // 2. Acerto Vencedor
  const acertoVencedor: JogadorAcertoVencedor[] = participants.map((p) => {
    const agg = aggMap.get(p.id)!
    const total = totalPalpitesMap.get(p.id) ?? 0
    const acertos = agg.cravadas + agg.saldos + agg.vencedores
    return {
      nome: p.name,
      acertos,
      totalPalpites: total,
      pct: total > 0 ? Math.round((acertos / total) * 100) : 0,
    }
  })

  // 3. Bipolares (variação max-min)
  const bipolares: JogadorBipolar[] = participants
    .map((p) => {
      const agg = aggMap.get(p.id)!
      if (agg.ptsPorRodada.length < 2) return null
      const max = Math.max(...agg.ptsPorRodada)
      const min = Math.min(...agg.ptsPorRodada)
      return { nome: p.name, max, min, variacao: max - min }
    })
    .filter((x): x is JogadorBipolar => x !== null)

  // 4. Consistência (desvio padrão)
  const consistencia: JogadorConsistencia[] = participants
    .map((p) => {
      const agg = aggMap.get(p.id)!
      if (agg.ptsPorRodada.length < 2) return null
      const media = agg.somaPts / agg.ptsPorRodada.length
      const somaQuad = agg.ptsPorRodada.reduce((s, pt) => s + Math.pow(pt - media, 2), 0)
      const dp = Math.sqrt(somaQuad / agg.ptsPorRodada.length)
      const perfil: JogadorConsistencia['perfil'] =
        dp < 5 ? 'consistente' : dp < 10 ? 'regular' : 'bipolar'
      return {
        nome: p.name,
        media: Math.round(media * 10) / 10,
        desvioPadrao: Math.round(dp * 10) / 10,
        perfil,
      }
    })
    .filter((x): x is JogadorConsistencia => x !== null)

  // 5. Over/Under vs média do grupo
  const medias = participants
    .map((p) => {
      const agg = aggMap.get(p.id)!
      return agg.ptsPorRodada.length > 0 ? agg.somaPts / agg.ptsPorRodada.length : null
    })
    .filter((m): m is number => m !== null)
  const mediaGrupo = medias.length > 0 ? medias.reduce((s, m) => s + m, 0) / medias.length : 0

  const overUnderTodos: JogadorOverUnder[] = participants
    .map((p) => {
      const agg = aggMap.get(p.id)!
      if (agg.ptsPorRodada.length === 0) return null
      const media = agg.somaPts / agg.ptsPorRodada.length
      const diff = media - mediaGrupo
      return {
        nome: p.name,
        media: Math.round(media * 10) / 10,
        diff: Math.round(diff * 10) / 10,
        status: diff >= 0 ? 'over' as const : 'under' as const,
      }
    })
    .filter((x): x is JogadorOverUnder => x !== null)

  const overs = overUnderTodos.filter((x) => x.status === 'over').sort((a, b) => b.diff - a.diff)
  const unders = overUnderTodos.filter((x) => x.status === 'under').sort((a, b) => a.diff - b.diff)

  // 6. Perfil de Aposta
  const perfilAposta: JogadorPerfilAposta[] = participants.map((p) => {
    const m = mandanteMap.get(p.id) ?? 0
    const v = visitanteMap.get(p.id) ?? 0
    const e = empateMap.get(p.id) ?? 0
    const total = m + v + e || 1
    return {
      nome: p.name,
      pctMandante: Math.round((m / total) * 100),
      pctVisitante: Math.round((v / total) * 100),
      pctEmpate: Math.round((e / total) * 100),
    }
  })

  // 7. Recordes + tendência (N=5, mesma regra do App Script)
  const recordes: JogadorRecorde[] = participants.map((p) => {
    const agg = aggMap.get(p.id)!
    let tendencia: JogadorRecorde['tendencia'] = 'sem_dados'
    if (agg.ptsPorRodada.length >= 2) {
      const N = 5
      const ultimas = agg.ptsPorRodada.slice(-N)
      const anteriores = agg.ptsPorRodada.slice(0, -N)
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
    return { nome: p.name, recorde: agg.recorde, tendencia }
  })

  // 8. Placares mais apostados vs reais (top 10)
  const placares = {
    apostados: Array.from(placaresApostados.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([placar, qtd]) => ({ placar, qtd })),
    reais: Array.from(placaresReais.entries())
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([placar, qtd]) => ({ placar, qtd })),
  }

  return {
    cravadasZeros,
    acertoVencedor,
    bipolares,
    consistencia,
    overUnder: { overs, unders, mediaGrupo: Math.round(mediaGrupo * 10) / 10 },
    perfilAposta,
    recordes,
    placares,
  }
}

function vazio(): StatsGrupoCompleto {
  return {
    cravadasZeros: [],
    acertoVencedor: [],
    bipolares: [],
    consistencia: [],
    overUnder: { overs: [], unders: [], mediaGrupo: 0 },
    perfilAposta: [],
    recordes: [],
    placares: { apostados: [], reais: [] },
  }
}
