import { supabase } from './supabase'

// Camada de dados das Estatísticas do Ranking (aba Minhas).
//
// Duas fontes principais:
//   - round_results (agregado por rodada — fonte oficial de pontos/cravadas/etc)
//   - predictions   (para detalhamento por jogo — palpite vs resultado e coragem)
//
// Regras: 
//   - Só rodadas com finalized=true entram. 
//   - Só participantes com is_admin=false.
//   - Rodadas Extras (number >= 100) são excluídas de Médias e Recordes.

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

  // NOVAS
  placarFavorito: string | null
  taxaCoragemPct: number
  jogosCorajosos: number
  melhorRodada: { nome: string; pts: number } | null
  piorRodada: { nome: string; pts: number } | null
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
  // 1. Lista rodadas finalizadas em ordem cronológica
  const { data: rounds } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('finalized', true)
    .order('created_at', { ascending: true })

  const roundList = rounds ?? []
  const roundIds = roundList.map((r) => r.id)

  const statsVazias: MinhasStatsReal = {
    rodadas: 0, cravadas: 0, vencedor: 0, saldo: 0,
    mediaPts: 0, meuRecorde: 0, tendencia: 'sem_dados',
    ptsPorRodada: [],
    pctPlacarExato: 0, pctVencedor: 0, pctSaldo: 0, totalComPalpite: 0,
    placarFavorito: null, taxaCoragemPct: 0, jogosCorajosos: 0,
    melhorRodada: null, piorRodada: null
  }

  if (roundIds.length === 0) return statsVazias

  const { data: rrRows } = await supabase
    .from('round_results')
    .select('round_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .eq('participant_id', participantId)
    .in('round_id', roundIds)

  const rrByRound = new Map((rrRows ?? []).map((r) => [r.round_id, r]))

  let cravadas = 0, vencedor = 0, saldo = 0, rodadasGerais = 0
  let totalPtsNormais = 0, rodadasNormais = 0, meuRecordeNormal = 0
  let melhor: { nome: string; pts: number } | null = null
  let pior: { nome: string; pts: number } | null = null

  const rodadasExtras = roundList.filter((r) => r.number >= 100).sort((a, b) => a.number - b.number)
  const mapaExtra = new Map(rodadasExtras.map((r, i) => [r.id, `E${i + 1}`]))
  function montarLabel(r: { id: string; number: number }): string {
    return mapaExtra.get(r.id) ?? `R${r.number}`
  }

  const ptsNormaisArray: number[] = []

  const ptsPorRodada = roundList.map((r) => {
    const rr = rrByRound.get(r.id)
    const label = montarLabel(r)
    const isExtra = r.number >= 100

    if (!rr) {
      return { roundId: r.id, numero: r.number, label, nome: r.name, pontos: null, cravadas: 0, saldos: 0, vencedores: 0 }
    }
    const pts = rr.round_pts ?? 0
    cravadas += rr.exact_scores ?? 0
    vencedor += rr.correct_winner ?? 0
    saldo += rr.correct_saldo ?? 0
    rodadasGerais++

    if (!isExtra) {
      totalPtsNormais += pts
      rodadasNormais++
      ptsNormaisArray.push(pts)
      if (pts > meuRecordeNormal) meuRecordeNormal = pts

      if (!melhor || pts > melhor.pts) melhor = { nome: r.name, pts }
      if (!pior || pts < pior.pts) pior = { nome: r.name, pts }
    }

    return {
      roundId: r.id, numero: r.number, label, nome: r.name,
      pontos: pts,
      cravadas: rr.exact_scores ?? 0,
      saldos: rr.correct_saldo ?? 0,
      vencedores: rr.correct_winner ?? 0,
    }
  })

  const mediaPts = rodadasNormais > 0 ? Math.round((totalPtsNormais / rodadasNormais) * 10) / 10 : 0

  let tendencia: MinhasStatsReal['tendencia'] = 'sem_dados'
  if (ptsNormaisArray.length >= 2) {
    const N = 5
    const ultimas = ptsNormaisArray.slice(-N)
    const anteriores = ptsNormaisArray.slice(0, -N)
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

  // 2. Busca Predictions para Placar Exato, Vencedor e Coragem
  const { data: matches } = await supabase.from('matches').select('id').in('round_id', roundIds)
  const matchIds = (matches ?? []).map((m) => m.id)

  let totalComPalpite = 0
  let placarFavorito: string | null = null
  let taxaCoragemPct = 0
  let jogosCorajosos = 0

  if (matchIds.length > 0) {
    // Todos os palpites (pra calcular coragem contra o grupo)
    const { data: allPreds } = await supabase
      .from('predictions')
      .select('participant_id, match_id, pred_h, pred_a')
      .in('match_id', matchIds)

    const meusPalpites = (allPreds ?? []).filter((p) => p.participant_id === participantId)
    totalComPalpite = meusPalpites.length

    // Placar Favorito
    const placarCount = new Map<string, number>()
    for (const p of meusPalpites) {
      const key = `${p.pred_h}x${p.pred_a}`
      placarCount.set(key, (placarCount.get(key) ?? 0) + 1)
    }
    if (placarCount.size > 0) {
      placarFavorito = Array.from(placarCount.entries()).sort((a, b) => b[1] - a[1])[0][0]
    }

    // Taxa de Coragem (quantos palpites meus foram contra a tendência da MAIORIA no jogo)
    // Maioria = Vitória H, Vitória A, ou Empate.
    const grupoPorJogo = new Map<string, { h: number, a: number, e: number }>()
    for (const p of allPreds ?? []) {
      if (!grupoPorJogo.has(p.match_id)) grupoPorJogo.set(p.match_id, { h: 0, a: 0, e: 0 })
      const j = grupoPorJogo.get(p.match_id)!
      if (p.pred_h > p.pred_a) j.h++
      else if (p.pred_a > p.pred_h) j.a++
      else j.e++
    }

    for (const p of meusPalpites) {
      const j = grupoPorJogo.get(p.match_id)
      if (!j) continue
      const meuLado = p.pred_h > p.pred_a ? 'h' : p.pred_a > p.pred_h ? 'a' : 'e'
      
      // Qual foi o lado mais votado do grupo?
      let ladoMaioria = 'h'
      let maxVotos = j.h
      if (j.a > maxVotos) { ladoMaioria = 'a'; maxVotos = j.a }
      if (j.e > maxVotos) { ladoMaioria = 'e'; maxVotos = j.e }

      // Se meu lado não for a maioria, fui corajoso!
      if (meuLado !== ladoMaioria) jogosCorajosos++
    }

    if (totalComPalpite > 0) {
      taxaCoragemPct = Math.round((jogosCorajosos / totalComPalpite) * 100)
    }
  }

  const pctPlacarExato = totalComPalpite > 0 ? Math.round((cravadas / totalComPalpite) * 100) : 0
  const pctVencedor = totalComPalpite > 0 ? Math.round(((cravadas + vencedor + saldo) / totalComPalpite) * 100) : 0 // Correção do 358% (Acerto é QUALQUER ponto ganho)
  const pctSaldo = totalComPalpite > 0 ? Math.round((saldo / totalComPalpite) * 100) : 0

  return {
    rodadas: rodadasGerais, cravadas, vencedor, saldo,
    mediaPts, meuRecorde: meuRecordeNormal, tendencia,
    ptsPorRodada,
    pctPlacarExato, pctVencedor, pctSaldo, totalComPalpite,
    placarFavorito, taxaCoragemPct, jogosCorajosos, melhorRodada: melhor, piorRodada: pior
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
