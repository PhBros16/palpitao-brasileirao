import { supabase } from './supabase'

// ─── Interfaces com suporte a todos os aliases de componentes ─────────────────

export interface JogoHistorico {
  id: string
  matchId: string
  match_id: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  home_score: number | null
  away_score: number | null
  date: string | null
  time: string | null
}

export interface PalpiteHistorico {
  id: string
  participantId: string
  participant_id: string
  nome: string
  name: string
  avatar: string | null
  emoji: string | null
  pontos: number
  round_pts: number
  pts: number
  total_pts: number
  cravadas: number
  exact_scores: number
  vencedores: number
  correct_winner: number
  saldos: number
  correct_saldo: number
}

export interface FrangoHistorico {
  jogador: string
  texto: string | null
  fotoUrl: string | null
}

export interface CampeaoHistorico {
  nome: string
  name: string
  pontos: number
  pts: number
  round_pts: number
  total_pts: number
  score: number
  avatar: string | null
  emoji: string | null
}

export interface RodadaHistorico {
  id: string
  roundId: string
  round_id: string
  numero: number
  number: number
  nome: string
  name: string
  finalizada: boolean
  finalized: boolean
  isDouble: boolean
  is_double: boolean
  totalJogos: number
  qtdJogos: number
  total_jogos: number
  jogos: JogoHistorico[]
  ranking: PalpiteHistorico[]
  campeao: CampeaoHistorico | null
  campeaoRodada: CampeaoHistorico | null
  campeaoPontos: number
  meusPontos: number
  meuPontos: number
  meus_pontos: number
  frango: FrangoHistorico | null
  frangoRodada: FrangoHistorico | null
}

export interface DetalhePalpiteJogo {
  matchId: string
  match_id: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  home_score: number | null
  away_score: number | null
  predH: number | null
  predA: number | null
  pred_h: number | null
  pred_a: number | null
  pontos: number | null
  pts: number | null
}

export interface DetalheParticipanteRodada {
  participantId: string
  participant_id: string
  nome: string
  name: string
  avatar: string | null
  emoji: string | null
  pontosTotais: number
  pontos: number
  pts: number
  jogos: DetalhePalpiteJogo[]
}

export interface DetalheRodadaHistorico {
  id: string
  roundId: string
  round_id: string
  numero: number
  number: number
  nome: string
  name: string
  jogos: DetalhePalpiteJogo[]
  participante: DetalheParticipanteRodada
}

// ─── Helper de categoria de acerto ──────────────────────────────────────────

export function categorizarAcerto(pts: number | null): 'cravada' | 'saldo' | 'vencedor' | 'errou' | 'np' {
  if (pts === null) return 'np'
  if (pts === 5 || pts === 10) return 'cravada'
  if (pts === 3 || pts === 6) return 'saldo'
  if (pts === 1 || pts === 2) return 'vencedor'
  return 'errou'
}

// ─── Função de Busca Principal ───────────────────────────────────────────────

export async function buscarRodadasFinalizadasHistorico(): Promise<RodadaHistorico[]> {
  let sessaoId: string | null = null
  if (typeof window !== 'undefined') {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) sessaoId = JSON.parse(raw).id ?? null
    } catch { /* ignora */ }
  }

  // 1. Busca rodadas finalizadas no banco
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, number, name, finalized, is_double, created_at')
    .eq('finalized', true)

  if (rErr) throw rErr
  if (!rounds || rounds.length === 0) return []

  // ORDENAÇÃO: Rodadas normais (R24, R23, R22...) primeiro em ordem decrescente, e Extras por último ou ordem de criação
  const roundsOrdenados = [...rounds].sort((a, b) => {
    const isExtraA = a.number >= 100
    const isExtraB = b.number >= 100
    if (isExtraA && !isExtraB) return 1  // Extra vai pra baixo
    if (!isExtraA && isExtraB) return -1 // Normal fica em cima
    return b.number - a.number           // Decrescente (R24 em cima de R23)
  })

  const roundIds = roundsOrdenados.map((r) => r.id)

  const [
    { data: matches },
    { data: roundResults },
    { data: participants },
    { data: shames },
  ] = await Promise.all([
    supabase
      .from('matches')
      .select('id, round_id, home, away, home_score, away_score, match_date, match_time')
      .in('round_id', roundIds)
      .order('match_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('round_results')
      .select('round_id, participant_id, round_pts, exact_scores, correct_winner, correct_saldo')
      .in('round_id', roundIds),
    supabase
      .from('participants')
      .select('id, name, avatar, emoji, is_admin')
      .eq('is_admin', false),
    supabase
      .from('shame')
      .select('round_id, player_name, text, photo_url')
      .in('round_id', roundIds),
  ])

  const partMap = new Map((participants ?? []).map((p) => [p.id, p]))
  const shamesMap = new Map((shames ?? []).map((s) => [s.round_id, s]))

  return roundsOrdenados.map((r) => {
    const jogosDaRodada: JogoHistorico[] = (matches ?? [])
      .filter((m) => m.round_id === r.id)
      .map((m) => ({
        id: m.id,
        matchId: m.id,
        match_id: m.id,
        home: m.home,
        away: m.away,
        homeScore: m.home_score,
        awayScore: m.away_score,
        home_score: m.home_score,
        away_score: m.away_score,
        date: m.match_date ?? null,
        time: m.match_time?.slice(0, 5) ?? null,
      }))

    const rrDaRodada = (roundResults ?? []).filter((rr) => rr.round_id === r.id)

    const ranking: PalpiteHistorico[] = rrDaRodada
      .map((rr) => {
        const p = partMap.get(rr.participant_id)
        if (!p) return null
        const pts = rr.round_pts ?? 0
        return {
          id: p.id,
          participantId: p.id,
          participant_id: p.id,
          nome: p.name,
          name: p.name,
          avatar: p.avatar ?? null,
          emoji: p.emoji ?? null,
          pontos: pts,
          round_pts: pts,
          pts: pts,
          total_pts: pts,
          cravadas: rr.exact_scores ?? 0,
          exact_scores: rr.exact_scores ?? 0,
          vencedores: rr.correct_winner ?? 0,
          correct_winner: rr.correct_winner ?? 0,
          saldos: rr.correct_saldo ?? 0,
          correct_saldo: rr.correct_saldo ?? 0,
        }
      })
      .filter((x): x is PalpiteHistorico => x !== null)
      .sort((a, b) => b.pontos - a.pontos || b.cravadas - a.cravadas || b.saldos - a.saldos)

    const campeao: CampeaoHistorico | null = ranking[0]
      ? {
          nome: ranking[0].nome,
          name: ranking[0].nome,
          pontos: ranking[0].pontos,
          pts: ranking[0].pontos,
          round_pts: ranking[0].pontos,
          total_pts: ranking[0].pontos,
          score: ranking[0].pontos,
          avatar: ranking[0].avatar,
          emoji: ranking[0].emoji,
        }
      : null

    const meuRank = sessaoId ? ranking.find((p) => p.participantId === sessaoId) : null
    const meusPts = meuRank ? meuRank.pontos : 0

    const shame = shamesMap.get(r.id)
    const frango: FrangoHistorico | null = shame
      ? {
          jogador: shame.player_name,
          texto: shame.text ?? null,
          fotoUrl: shame.photo_url ?? null,
        }
      : null

    const num = r.number
    const nomeRodada = r.name || `Rodada ${num}`

    return {
      id: r.id,
      roundId: r.id,
      round_id: r.id,
      numero: num,
      number: num,
      nome: nomeRodada,
      name: nomeRodada,
      finalizada: r.finalized,
      finalized: r.finalized,
      isDouble: r.is_double ?? false,
      is_double: r.is_double ?? false,
      totalJogos: jogosDaRodada.length,
      qtdJogos: jogosDaRodada.length,
      total_jogos: jogosDaRodada.length,
      jogos: jogosDaRodada,
      ranking,
      campeao,
      campeaoRodada: campeao,
      campeaoPontos: campeao ? campeao.pontos : 0,
      meusPontos: meusPts,
      meuPontos: meusPts,
      meus_pontos: meusPts,
      frango,
      frangoRodada: frango,
    }
  })
}

export const buscarHistoricoCompleto = buscarRodadasFinalizadasHistorico

export async function buscarDetalheRodada(
  roundId: string,
  participantId: string,
): Promise<DetalheRodadaHistorico | null> {
  const [{ data: round }, { data: part }, { data: matches }, { data: rr }] = await Promise.all([
    supabase.from('rounds').select('id, number, name').eq('id', roundId).single(),
    supabase.from('participants').select('id, name, avatar, emoji').eq('id', participantId).single(),
    supabase.from('matches').select('id, home, away, home_score, away_score, match_date').eq('round_id', roundId).order('match_date', { ascending: true, nullsFirst: false }),
    supabase.from('round_results').select('round_pts').eq('round_id', roundId).eq('participant_id', participantId).maybeSingle(),
  ])

  if (!round || !part) return null

  const matchIds = (matches ?? []).map((m) => m.id)

  const { data: preds } = matchIds.length > 0
    ? await supabase
        .from('predictions')
        .select('match_id, pred_h, pred_a, points')
        .eq('participant_id', participantId)
        .in('match_id', matchIds)
    : { data: [] }

  const predMap = new Map((preds ?? []).map((p) => [p.match_id, p]))

  const jogos: DetalhePalpiteJogo[] = (matches ?? []).map((m) => {
    const p = predMap.get(m.id)
    const pts = p?.points ?? null
    return {
      matchId: m.id,
      match_id: m.id,
      home: m.home,
      away: m.away,
      homeScore: m.home_score,
      awayScore: m.away_score,
      home_score: m.home_score,
      away_score: m.away_score,
      predH: p?.pred_h ?? null,
      predA: p?.pred_a ?? null,
      pred_h: p?.pred_h ?? null,
      pred_a: p?.pred_a ?? null,
      pontos: pts,
      pts: pts,
    }
  })

  const ptsTotais = rr?.round_pts ?? 0

  return {
    id: round.id,
    roundId: round.id,
    round_id: round.id,
    numero: round.number,
    number: round.number,
    nome: round.name,
    name: round.name,
    jogos,
    participante: {
      participantId: part.id,
      participant_id: part.id,
      nome: part.name,
      name: part.name,
      avatar: part.avatar ?? null,
      emoji: part.emoji ?? null,
      pontosTotais: ptsTotais,
      pontos: ptsTotais,
      pts: ptsTotais,
      jogos,
    },
  }
}

export const buscarDetalheParticipanteHistorico = async (
  roundId: string,
  participantId: string,
): Promise<DetalheParticipanteRodada | null> => {
  const res = await buscarDetalheRodada(roundId, participantId)
  return res ? res.participante : null
}
