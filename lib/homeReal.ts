import { supabase } from './supabase'

// Camada de dados da Home Real.
//
// Agrega tudo que a tela /inicio precisa numa query só (ou o mais próximo
// disso). Devolve dados prontos pros 9 blocos visuais:
//   - Card da rodada (nome + jogos totais/abertos/cravadas do jogador)
//   - Countdown do próximo jogo
//   - Parcial da rodada (14 participantes ordenados)
//   - Frango da rodada anterior (tabela shame)
//   - Por Placar (placares mais apostados por jogo)
//   - Distribuição de palpites (mandante/empate/visitante)
//   - Pódio atual (top 3 do ranking geral)
//   - Pontos hoje do usuário logado + posição no ranking

export interface RodadaAtiva {
  roundId: string
  numero: number
  nome: string
  isDouble: boolean
  jogosTotais: number
  jogosAbertos: number
  proximoJogoFechaEm: number | null   // ms
}

export interface ParcialLinha {
  participantId: string
  nome: string
  emoji: string | null
  avatar: string | null
  ptsRodada: number | null   // null = NP (ainda não palpitou)
  totalGeral: number
  posicao: number
}

export interface StatsUsuario {
  ptsAcumulados: number       // total do participante
  ptsRodada: number | null
  cravadasRodada: number
  posicaoRanking: number       // 1-14
  ptsPraSubir: number | null   // quanto falta pra ultrapassar quem tá à frente
}

export interface Frango {
  playerName: string
  text: string | null
  photoUrl: string | null
  rodadaNome: string
}

export interface PlacaresJogo {
  matchId: string
  home: string
  away: string
  placares: Array<{ placar: string; qtd: number }>  // top placares desse jogo
}

export interface DistribuicaoJogo {
  matchId: string
  home: string
  away: string
  totalPalpites: number
  mandante: number      // qtd palpites com H > A
  empate: number
  visitante: number
}

export interface PodioLinha {
  nome: string
  emoji: string | null
  avatar: string | null
  pts: number
}

export interface HomeCompleta {
  rodada: RodadaAtiva | null
  stats: StatsUsuario | null
  parcial: ParcialLinha[]
  frango: Frango | null
  placares: PlacaresJogo[]
  distribuicao: DistribuicaoJogo[]
  podio: PodioLinha[]
  usuarioNome: string
  usuarioEmoji: string | null
  usuarioAvatar: string | null
}

// ─── Função principal ────────────────────────────────────────────────────────

export async function buscarHomeCompleta(participantId: string): Promise<HomeCompleta> {
  // 1, 2, 5 e 7 não dependem uma da outra — antes rodavam uma de cada vez
  // (await sequencial), cada uma esperando a anterior terminar. Com
  // Promise.all elas saem todas ao mesmo tempo, e o tempo total de espera
  // vira o da mais lenta, não a soma de todas.
  const [
    { data: participants },
    { data: rodadaRaw },
    { data: rrTotais },
    { data: ultimaFin },
  ] = await Promise.all([
    // 1. Participantes (com emoji + avatar)
    supabase
      .from('participants')
      .select('id, name, emoji, avatar')
      .eq('is_admin', false)
      .order('name'),
    // 2. Rodada ativa (palpites_open=true)
    supabase
      .from('rounds')
      .select('id, number, name, is_double')
      .eq('palpites_open', true)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle(),
    // 5. Total geral de todo mundo (usado no pódio E na parcial — antes
    // essa mesma query rodava DUAS VEZES, uma pra cada uso).
    supabase
      .from('round_results')
      .select('participant_id, round_pts'),
    // 7. Última rodada finalizada (pro Frango)
    supabase
      .from('rounds')
      .select('id, name')
      .eq('finalized', true)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const partList = participants ?? []
  const partById = new Map(partList.map((p) => [p.id, p]))
  const usuario = partById.get(participantId)

  const totaisRanking = new Map<string, number>()
  for (const rr of rrTotais ?? []) {
    totaisRanking.set(rr.participant_id, (totaisRanking.get(rr.participant_id) ?? 0) + (rr.round_pts ?? 0))
  }

  let rodada: RodadaAtiva | null = null
  let cravadasRodadaUsuario = 0
  let ptsRodadaUsuario: number | null = null
  const parcial: ParcialLinha[] = []
  const placares: PlacaresJogo[] = []
  const distribuicao: DistribuicaoJogo[] = []

  // 7b. Frango — também não depende da rodada ativa, então dispara junto
  // com a busca de jogos (3) logo abaixo, em vez de esperar tudo terminar.
  // Sempre é aguardado (com ou sem rodada ativa) via Promise.all abaixo.
  let frango: Frango | null = null
  const shamePromise = ultimaFin
    ? supabase
        .from('shame')
        .select('player_name, text, photo_url')
        .eq('round_id', ultimaFin.id)
        .maybeSingle()
    : Promise.resolve({ data: null } as { data: { player_name: string; text: string | null; photo_url: string | null } | null })

  // 3. Jogos da rodada ativa (só existe se rodadaRaw existir) — dispara ao
  // mesmo tempo que o Frango (7b) acima, já que uma coisa não depende da
  // outra.
  const matchesPromise = rodadaRaw
    ? supabase
        .from('matches')
        .select('id, home, away, home_score, away_score, match_date, match_time')
        .eq('round_id', rodadaRaw.id)
        .order('match_date', { ascending: true })
        .order('match_time', { ascending: true })
    : Promise.resolve({ data: [] as Array<{ id: string; home: string; away: string; home_score: number | null; away_score: number | null; match_date: string | null; match_time: string | null }> })

  const [{ data: matchesRaw }, { data: shameRow }] = await Promise.all([matchesPromise, shamePromise])

  if (shameRow && shameRow.player_name) {
    frango = {
      playerName: shameRow.player_name,
      text: shameRow.text,
      photoUrl: shameRow.photo_url,
      rodadaNome: ultimaFin!.name,
    }
  }

  if (rodadaRaw) {
    const matches = matchesRaw ?? []
    const matchIds = matches.map((m) => m.id)

    // Próximo jogo a fechar (ainda sem placar)
    const agora = Date.now()
    let proximoMs: number | null = null
    for (const m of matches) {
      if (m.home_score !== null) continue
      if (!m.match_date || !m.match_time) continue
      const dt = new Date(`${m.match_date}T${m.match_time}`).getTime()
      const diff = dt - agora
      if (diff > 0 && (proximoMs === null || diff < proximoMs)) {
        proximoMs = diff
      }
    }

    rodada = {
      roundId: rodadaRaw.id,
      numero: rodadaRaw.number,
      nome: rodadaRaw.name,
      isDouble: rodadaRaw.is_double ?? false,
      jogosTotais: matches.length,
      jogosAbertos: matches.filter((m) => m.home_score === null).length,
      proximoJogoFechaEm: proximoMs,
    }

    // 4. Predictions de todos, nessa rodada
    const { data: predsRaw } = matchIds.length > 0 ? await supabase
      .from('predictions')
      .select('participant_id, match_id, pred_h, pred_a, points')
      .in('match_id', matchIds) : { data: [] as any[] }

    const preds = predsRaw ?? []
    const matchScoreMap = new Map(matches.map((m) => [m.id, { h: m.home_score, a: m.away_score }]))

    // Agrega por participante
    const aggMap = new Map<string, { pts: number | null; palpitou: boolean }>()
    for (const p of partList) {
      aggMap.set(p.id, { pts: null, palpitou: false })
    }
    for (const pred of preds) {
      const agg = aggMap.get(pred.participant_id)
      if (!agg) continue
      if (!agg.palpitou) {
        agg.palpitou = true
        agg.pts = 0
      }
      if (pred.points !== null) {
        agg.pts! += pred.points
      }
      // Cravadas do usuário logado
      if (pred.participant_id === participantId) {
        const res = matchScoreMap.get(pred.match_id)
        if (res && res.h !== null && res.a !== null) {
          if (pred.pred_h === res.h && pred.pred_a === res.a) cravadasRodadaUsuario++
        }
      }
    }

    // Placares mais apostados por jogo (top 3 de cada)
    const placaresPorMatch = new Map<string, Map<string, number>>()
    // Distribuição por jogo
    const distPorMatch = new Map<string, { mandante: number; empate: number; visitante: number; total: number }>()

    for (const pred of preds) {
      // Placares
      if (!placaresPorMatch.has(pred.match_id)) placaresPorMatch.set(pred.match_id, new Map())
      const key = `${pred.pred_h}x${pred.pred_a}`
      const mapP = placaresPorMatch.get(pred.match_id)!
      mapP.set(key, (mapP.get(key) ?? 0) + 1)

      // Distribuição
      if (!distPorMatch.has(pred.match_id)) distPorMatch.set(pred.match_id, { mandante: 0, empate: 0, visitante: 0, total: 0 })
      const d = distPorMatch.get(pred.match_id)!
      d.total++
      if (pred.pred_h > pred.pred_a) d.mandante++
      else if (pred.pred_h < pred.pred_a) d.visitante++
      else d.empate++
    }

    for (const m of matches) {
      const mapP = placaresPorMatch.get(m.id)
      if (mapP && mapP.size > 0) {
        const top = Array.from(mapP.entries())
          .sort((a, b) => b[1] - a[1])
          .slice(0, 5)
          .map(([placar, qtd]) => ({ placar, qtd }))
        placares.push({ matchId: m.id, home: m.home, away: m.away, placares: top })
      }
      const d = distPorMatch.get(m.id)
      if (d && d.total > 0) {
        distribuicao.push({
          matchId: m.id,
          home: m.home,
          away: m.away,
          totalPalpites: d.total,
          mandante: d.mandante,
          empate: d.empate,
          visitante: d.visitante,
        })
      }
    }

    // Ptsrodada do usuário
    const meuAgg = aggMap.get(participantId)
    ptsRodadaUsuario = meuAgg?.pts ?? null

    // Monta parcial — total geral já veio em paralelo lá em cima
    // (totaisRanking), não precisa buscar de novo.
    const linhasBrutas: ParcialLinha[] = partList.map((p) => {
      const agg = aggMap.get(p.id)
      return {
        participantId: p.id,
        nome: p.name,
        emoji: p.emoji,
        avatar: p.avatar,
        ptsRodada: agg?.pts ?? null,
        totalGeral: totaisRanking.get(p.id) ?? 0,
        posicao: 0,
      }
    })

    // Ordena: total geral desc → pts rodada desc → nome asc
    linhasBrutas.sort((a, b) =>
      b.totalGeral - a.totalGeral ||
      (b.ptsRodada ?? -1) - (a.ptsRodada ?? -1) ||
      a.nome.localeCompare(b.nome)
    )
    linhasBrutas.forEach((l, i) => { l.posicao = i + 1 })
    parcial.push(...linhasBrutas)
  }

  // 5. Pódio (top 3 do ranking geral) — mesmo totaisRanking de cima
  const podioList = partList
    .map((p) => ({
      nome: p.name,
      emoji: p.emoji,
      avatar: p.avatar,
      pts: totaisRanking.get(p.id) ?? 0,
    }))
    .sort((a, b) => b.pts - a.pts)
    .slice(0, 3)

  // 6. Stats do usuário
  const posUsuario = partList
    .map((p) => ({ id: p.id, total: totaisRanking.get(p.id) ?? 0 }))
    .sort((a, b) => b.total - a.total)
    .findIndex((x) => x.id === participantId)

  const totaisOrdenados = Array.from(totaisRanking.values()).sort((a, b) => b - a)
  const ptsAcumuladosUsuario = totaisRanking.get(participantId) ?? 0
  let ptsPraSubir: number | null = null
  if (posUsuario > 0) {
    const acimaPts = totaisOrdenados[posUsuario - 1]
    ptsPraSubir = acimaPts - ptsAcumuladosUsuario + 1
  }

  const stats: StatsUsuario = {
    ptsAcumulados: ptsAcumuladosUsuario,
    ptsRodada: ptsRodadaUsuario,
    cravadasRodada: cravadasRodadaUsuario,
    posicaoRanking: posUsuario + 1,
    ptsPraSubir,
  }
  // Frango já foi resolvido lá em cima, em paralelo com os jogos da rodada.

  return {
    rodada,
    stats,
    parcial,
    frango,
    placares,
    distribuicao,
    podio: podioList,
    usuarioNome: usuario?.name ?? '?',
    usuarioEmoji: usuario?.emoji ?? null,
    usuarioAvatar: usuario?.avatar ?? null,
  }
}
