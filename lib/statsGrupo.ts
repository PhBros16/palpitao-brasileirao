import { supabase } from './supabase'

// Camada de dados das Estatísticas do Grupo (aba Ranking → Estatísticas → Grupo).
//
// Filtros aplicados em todas:
//   - participants.is_admin = false (exclui "Administração")
//   - rounds.finalized = true (só rodadas oficiais)
//
// ATENÇÃO: Rodadas extras (number >= 100) são EXCLUÍDAS de estatísticas
// baseadas em médias/consistência para não contaminar os dados,
// mas MANTIDAS em estatísticas acumuladas (ex: Cravadas, Zebras).

export interface JogadorCravadasZeros { nome: string; cravadas: number; zeros: number; totalPalpites: number; pctCravadas: number; pctZeros: number }
export interface JogadorAcertoVencedor { nome: string; acertos: number; totalPalpites: number; pct: number }
export interface JogadorBipolar { nome: string; max: number; min: number; variacao: number }
export interface JogadorConsistencia { nome: string; media: number; desvioPadrao: number; perfil: 'consistente' | 'regular' | 'bipolar' }
export interface JogadorOverUnder { nome: string; media: number; diff: number; status: 'over' | 'under' }
export interface JogadorPerfilAposta { nome: string; pctMandante: number; pctVisitante: number; pctEmpate: number }
export interface JogadorRecorde { nome: string; recorde: number; tendencia: 'alta' | 'baixa' | 'estavel' | 'sem_dados' }
export interface PlacarFrequencia { placar: string; qtd: number }

// NOVAS ESTATÍSTICAS
export interface JogadorViciadoEmpate { nome: string; empatesApostados: number; acertos: number; pct: number }
export interface JogadorEmocionado { nome: string; mediaGols: number }
export interface JogadorDonoRodada { nome: string; qtdLiderancas: number }
export interface JogadorCacadorZebras { nome: string; pontosZebra: number; jogosZebra: number }

export interface StatsGrupoCompleto {
  cravadasZeros: JogadorCravadasZeros[]
  acertoVencedor: JogadorAcertoVencedor[]
  bipolares: JogadorBipolar[]
  consistencia: JogadorConsistencia[]
  overUnder: { overs: JogadorOverUnder[]; unders: JogadorOverUnder[]; mediaGrupo: number }
  perfilAposta: JogadorPerfilAposta[]
  recordes: JogadorRecorde[]
  placares: { apostados: PlacarFrequencia[]; reais: PlacarFrequencia[] }
  viciadosEmpate: JogadorViciadoEmpate[]
  emocionados: { emocionados: JogadorEmocionado[]; retranqueiros: JogadorEmocionado[] }
  donoRodada: JogadorDonoRodada[]
  cacadorZebras: JogadorCacadorZebras[]
}

export async function buscarStatsGrupo(): Promise<StatsGrupoCompleto> {
  const [
    { data: participants },
    { data: rounds },
  ] = await Promise.all([
    supabase.from('participants').select('id, name').eq('is_admin', false).order('name'),
    supabase.from('rounds').select('id, number').eq('finalized', true).order('number', { ascending: true }),
  ])

  if (!participants || !rounds || rounds.length === 0) return vazio()

  const roundIds = rounds.map((r) => r.id)
  const normaisIds = new Set(rounds.filter((r) => r.number < 100).map((r) => r.id)) // Apenas R1 a R38

  // round_results (usado pra bipolares, consistência, recordes, dono da rodada)
  const { data: rrRows } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts, exact_scores')
    .in('round_id', roundIds)

  // Maps para agregações
  const aggMapNormal = new Map<string, { ptsPorRodada: number[]; somaPts: number; recorde: number }>()
  const cravadasTotaisMap = new Map<string, number>()
  const liderancasRodadaMap = new Map<string, number>()

  for (const p of participants) {
    aggMapNormal.set(p.id, { ptsPorRodada: [], somaPts: 0, recorde: 0 })
    cravadasTotaisMap.set(p.id, 0)
    liderancasRodadaMap.set(p.id, 0)
  }

  // Agrupa resultados por rodada pra achar o "Dono da Rodada" (só rodadas normais)
  const ptsPorRodada = new Map<string, Array<{ pid: string; pts: number }>>()

  for (const rr of rrRows ?? []) {
    if (!aggMapNormal.has(rr.participant_id)) continue

    const pts = rr.round_pts ?? 0
    cravadasTotaisMap.set(rr.participant_id, (cravadasTotaisMap.get(rr.participant_id) ?? 0) + (rr.exact_scores ?? 0))

    if (normaisIds.has(rr.round_id)) {
      const agg = aggMapNormal.get(rr.participant_id)!
      agg.ptsPorRodada.push(pts)
      agg.somaPts += pts
      if (pts > agg.recorde) agg.recorde = pts

      if (!ptsPorRodada.has(rr.round_id)) ptsPorRodada.set(rr.round_id, [])
      ptsPorRodada.get(rr.round_id)!.push({ pid: rr.participant_id, pts })
    }
  }

  // Calcula Dono da Rodada (quem fez max points em cada rodada normal)
  for (const [, resultados] of ptsPorRodada.entries()) {
    if (resultados.length === 0) continue
    const maxPts = Math.max(...resultados.map((r) => r.pts))
    if (maxPts > 0) {
      resultados.filter((r) => r.pts === maxPts).forEach((r) => {
        liderancasRodadaMap.set(r.pid, (liderancasRodadaMap.get(r.pid) ?? 0) + 1)
      })
    }
  }

  // predictions + matches (fonte da verdade para acertos, empates, gols, zebras)
  const { data: matches } = await supabase
    .from('matches')
    .select('id, round_id, home_score, away_score')
    .in('round_id', roundIds)
  
  const matchToRound = new Map((matches ?? []).map((m) => [m.id, m.round_id]))
  const matchIds = (matches ?? []).map((m) => m.id)

  const { data: preds } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('participant_id, match_id, pred_h, pred_a, points')
    .in('match_id', matchIds)
    .not('points', 'is', null) : { data: [] as any[] }

  // Estruturas de contagem baseadas 100% em predictions (resolve bug dos 358%)
  const statsPred = new Map<string, {
    total: number, zeros: number, acertos: number,
    empatesAp: number, empatesAcertados: number,
    mandante: number, visitante: number,
    golsNormais: number, palpitesNormais: number,
    pontosZebra: number, qtdZebra: number
  }>()

  for (const p of participants) {
    statsPred.set(p.id, {
      total: 0, zeros: 0, acertos: 0, empatesAp: 0, empatesAcertados: 0,
      mandante: 0, visitante: 0, golsNormais: 0, palpitesNormais: 0, pontosZebra: 0, qtdZebra: 0
    })
  }

  const placaresApostados = new Map<string, number>()
  const placaresReais = new Map<string, number>()

  // Lógica para Zebras (Jogos onde >= 70% das pessoas zeraram)
  const predPorJogo = new Map<string, Array<{ pts: number }>>()
  for (const p of preds ?? []) {
    if (!predPorJogo.has(p.match_id)) predPorJogo.set(p.match_id, [])
    predPorJogo.get(p.match_id)!.push({ pts: p.points ?? 0 })
  }
  const jogosZebraIds = new Set<string>()
  for (const [mId, pList] of predPorJogo.entries()) {
    if (pList.length === 0) continue
    const qtdZeros = pList.filter((x) => x.pts === 0).length
    if (qtdZeros / pList.length >= 0.7) jogosZebraIds.add(mId) // 70%+ zerou = ZEBRA
  }

  // Percorre as predictions pra preencher os stats
  for (const pred of preds ?? []) {
    const st = statsPred.get(pred.participant_id)
    if (!st) continue

    const isNormal = normaisIds.has(matchToRound.get(pred.match_id)!)
    const pts = pred.points ?? 0

    st.total++
    if (pts === 0) st.zeros++
    if (pts > 0) st.acertos++ // Resolvido bug 358% (qualquer ponto > 0 é um acerto de algo)

    // Perfil
    if (pred.pred_h > pred.pred_a) st.mandante++
    else if (pred.pred_h < pred.pred_a) st.visitante++
    else {
      st.empatesAp++
      if (pts > 0) st.empatesAcertados++
    }

    // Emocionados (só rodadas normais)
    if (isNormal) {
      st.palpitesNormais++
      st.golsNormais += (pred.pred_h + pred.pred_a)
    }

    // Caçador de Zebras
    if (jogosZebraIds.has(pred.match_id) && pts > 0) {
      st.pontosZebra += pts
      st.qtdZebra++
    }

    // Placares apostados
    const palpKey = `${pred.pred_h}x${pred.pred_a}`
    placaresApostados.set(palpKey, (placaresApostados.get(palpKey) ?? 0) + 1)
  }

  // Placares reais
  for (const m of matches ?? []) {
    if (m.home_score === null || m.away_score === null) continue
    const key = `${m.home_score}x${m.away_score}`
    placaresReais.set(key, (placaresReais.get(key) ?? 0) + 1)
  }

  // ─── Monta os blocos ────────────────────────────────────────────────

  // 1. Cravadas & Zeros (Cravadas do round_results, Zeros e Total do predictions)
  const cravadasZeros: JogadorCravadasZeros[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    const cravadas = cravadasTotaisMap.get(p.id) ?? 0
    return {
      nome: p.name,
      cravadas,
      zeros: st.zeros,
      totalPalpites: st.total,
      pctCravadas: st.total > 0 ? Math.round((cravadas / st.total) * 100) : 0,
      pctZeros: st.total > 0 ? Math.round((st.zeros / st.total) * 100) : 0,
    }
  })

  // 2. Acerto do Vencedor (100% via predictions)
  const acertoVencedor: JogadorAcertoVencedor[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    return {
      nome: p.name,
      acertos: st.acertos,
      totalPalpites: st.total,
      pct: st.total > 0 ? Math.round((st.acertos / st.total) * 100) : 0,
    }
  })

  // 3. Bipolares (Rodadas normais)
  const bipolares: JogadorBipolar[] = participants
    .map((p) => {
      const agg = aggMapNormal.get(p.id)!
      if (agg.ptsPorRodada.length < 2) return null
      const max = Math.max(...agg.ptsPorRodada)
      const min = Math.min(...agg.ptsPorRodada)
      return { nome: p.name, max, min, variacao: max - min }
    })
    .filter((x): x is JogadorBipolar => x !== null)

  // 4. Consistência (Rodadas normais)
  const consistencia: JogadorConsistencia[] = participants
    .map((p) => {
      const agg = aggMapNormal.get(p.id)!
      if (agg.ptsPorRodada.length < 2) return null
      const media = agg.somaPts / agg.ptsPorRodada.length
      const somaQuad = agg.ptsPorRodada.reduce((s, pt) => s + Math.pow(pt - media, 2), 0)
      const dp = Math.sqrt(somaQuad / agg.ptsPorRodada.length)
      const perfil: JogadorConsistencia['perfil'] = dp < 5 ? 'consistente' : dp < 10 ? 'regular' : 'bipolar'
      return { nome: p.name, media: Math.round(media * 10) / 10, desvioPadrao: Math.round(dp * 10) / 10, perfil }
    })
    .filter((x): x is JogadorConsistencia => x !== null)

  // 5. Over/Under (Rodadas normais)
  const medias = participants.map((p) => {
    const agg = aggMapNormal.get(p.id)!
    return agg.ptsPorRodada.length > 0 ? agg.somaPts / agg.ptsPorRodada.length : null
  }).filter((m): m is number => m !== null)
  const mediaGrupo = medias.length > 0 ? medias.reduce((s, m) => s + m, 0) / medias.length : 0

  const overUnderTodos: JogadorOverUnder[] = participants
    .map((p) => {
      const agg = aggMapNormal.get(p.id)!
      if (agg.ptsPorRodada.length === 0) return null
      const media = agg.somaPts / agg.ptsPorRodada.length
      const diff = media - mediaGrupo
      return {
        nome: p.name, media: Math.round(media * 10) / 10, diff: Math.round(diff * 10) / 10,
        status: diff >= 0 ? 'over' as const : 'under' as const,
      }
    })
    .filter((x): x is JogadorOverUnder => x !== null)

  const overs = overUnderTodos.filter((x) => x.status === 'over').sort((a, b) => b.diff - a.diff)
  const unders = overUnderTodos.filter((x) => x.status === 'under').sort((a, b) => a.diff - b.diff)

  // 6. Perfil de Aposta
  const perfilAposta: JogadorPerfilAposta[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    const total = st.mandante + st.visitante + st.empatesAp || 1
    return {
      nome: p.name,
      pctMandante: Math.round((st.mandante / total) * 100),
      pctVisitante: Math.round((st.visitante / total) * 100),
      pctEmpate: Math.round((st.empatesAp / total) * 100),
    }
  })

  // 7. Recordes + tendência (Rodadas normais)
  const recordes: JogadorRecorde[] = participants.map((p) => {
    const agg = aggMapNormal.get(p.id)!
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
      } else tendencia = 'estavel'
    }
    return { nome: p.name, recorde: agg.recorde, tendencia }
  })

  // 8. Placares
  const placares = {
    apostados: Array.from(placaresApostados.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([placar, qtd]) => ({ placar, qtd })),
    reais: Array.from(placaresReais.entries()).sort((a, b) => b[1] - a[1]).slice(0, 10).map(([placar, qtd]) => ({ placar, qtd })),
  }

  // 9. Viciados em Empate
  const viciadosEmpate: JogadorViciadoEmpate[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    return {
      nome: p.name,
      empatesApostados: st.empatesAp,
      acertos: st.empatesAcertados,
      pct: st.empatesAp > 0 ? Math.round((st.empatesAcertados / st.empatesAp) * 100) : 0
    }
  })

  // 10. Emocionados vs Retranqueiros (Rodadas normais)
  const todosEmocionados: JogadorEmocionado[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    const media = st.palpitesNormais > 0 ? st.golsNormais / st.palpitesNormais : 0
    return { nome: p.name, mediaGols: Math.round(media * 100) / 100 }
  }).filter((x) => x.mediaGols > 0)
  
  const emocionados = [...todosEmocionados].sort((a, b) => b.mediaGols - a.mediaGols)
  const retranqueiros = [...todosEmocionados].sort((a, b) => a.mediaGols - b.mediaGols)

  // 11. Dono da Rodada
  const donoRodada: JogadorDonoRodada[] = participants.map((p) => ({
    nome: p.name,
    qtdLiderancas: liderancasRodadaMap.get(p.id) ?? 0
  }))

  // 12. Caçador de Zebras
  const cacadorZebras: JogadorCacadorZebras[] = participants.map((p) => {
    const st = statsPred.get(p.id)!
    return {
      nome: p.name,
      pontosZebra: st.pontosZebra,
      jogosZebra: st.qtdZebra
    }
  })

  return {
    cravadasZeros, acertoVencedor, bipolares, consistencia,
    overUnder: { overs, unders, mediaGrupo: Math.round(mediaGrupo * 10) / 10 },
    perfilAposta, recordes, placares,
    viciadosEmpate, emocionados: { emocionados, retranqueiros }, donoRodada, cacadorZebras
  }
}

function vazio(): StatsGrupoCompleto {
  return {
    cravadasZeros: [], acertoVencedor: [], bipolares: [], consistencia: [],
    overUnder: { overs: [], unders: [], mediaGrupo: 0 },
    perfilAposta: [], recordes: [], placares: { apostados: [], reais: [] },
    viciadosEmpate: [], emocionados: { emocionados: [], retranqueiros: [] },
    donoRodada: [], cacadorZebras: []
  }
}
