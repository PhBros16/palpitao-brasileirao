import { supabase } from './supabase'

// Types esperados pelos componentes de Histórico

export interface JogoHistorico {
  matchId: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
}

export interface PalpiteHistorico {
  participantId: string
  nome: string
  avatar: string | null
  emoji: string | null
  pontos: number
  cravadas: number
  vencedores: number
  saldos: number
}

export interface FrangoHistorico {
  jogador: string
  texto: string | null
  fotoUrl: string | null
}

export interface CampeaoHistorico {
  nome: string
  pontos: number
  avatar: string | null
  emoji: string | null
}

export interface RodadaHistorico {
  roundId: string
  numero: number
  nome: string
  finalizada: boolean
  isDouble: boolean
  jogos: JogoHistorico[]
  ranking: PalpiteHistorico[]
  campeaoRodada: CampeaoHistorico | null
  frangoRodada: FrangoHistorico | null
}

export interface DetalhePalpiteJogo {
  matchId: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  predH: number | null
  predA: number | null
  pontos: number | null
}

export interface DetalheParticipanteRodada {
  participantId: string
  nome: string
  avatar: string | null
  emoji: string | null
  pontosTotais: number
  jogos: DetalhePalpiteJogo[]
}

export interface DetalheRodadaHistorico {
  roundId: string
  numero: number
  nome: string
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

// ─── Funções de busca ────────────────────────────────────────────────────────

/**
 * Busca todas as rodadas finalizadas ordenadas estritamente pelo NÚMERO da rodada (number DESC).
 */
export async function buscarRodadasFinalizadasHistorico(): Promise<RodadaHistorico[]> {
  const { data: rounds, error: rErr } = await supabase
    .from('rounds')
    .select('id, number, name, finalized, is_double')
    .eq('finalized', true)
    .order('number', { ascending: false })

  if (rErr) throw rErr
  if (!rounds || rounds.length === 0) return []

  const roundIds = rounds.map((r) => r.id)

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

  return rounds.map((r) => {
    const jogosDaRodada: JogoHistorico[] = (matches ?? [])
      .filter((m) => m.round_id === r.id)
      .map((m) => ({
        matchId: m.id,
        home: m.home,
        away: m.away,
        homeScore: m.home_score,
        awayScore: m.away_score,
      }))

    const rrDaRodada = (roundResults ?? []).filter((rr) => rr.round_id === r.id)

    const ranking: PalpiteHistorico[] = rrDaRodada
      .map((rr) => {
        const p = partMap.get(rr.participant_id)
        if (!p) return null
        return {
          participantId: p.id,
          nome: p.name,
          avatar: p.avatar ?? null,
          emoji: p.emoji ?? null,
          pontos: rr.round_pts ?? 0,
          cravadas: rr.exact_scores ?? 0,
          vencedores: rr.correct_winner ?? 0,
          saldos: rr.correct_saldo ?? 0,
        }
      })
      .filter((x): x is PalpiteHistorico => x !== null)
      .sort((a, b) => b.pontos - a.pontos || b.cravadas - a.cravadas || b.saldos - a.saldos)

    const campeao = ranking[0]
      ? {
          nome: ranking[0].nome,
          pontos: ranking[0].pontos,
          avatar: ranking[0].avatar,
          emoji: ranking[0].emoji,
        }
      : null

    const shame = shamesMap.get(r.id)
    const frango = shame
      ? {
          jogador: shame.player_name,
          texto: shame.text ?? null,
          fotoUrl: shame.photo_url ?? null,
        }
      : null

    return {
      roundId: r.id,
      numero: r.number,
      nome: r.name,
      finalizada: r.finalized,
      isDouble: r.is_double ?? false,
      jogos: jogosDaRodada,
      ranking,
      campeaoRodada: campeao,
      frangoRodada: frango,
    }
  })
}

/** Alias para manter retrocompatibilidade */
export const buscarHistoricoCompleto = buscarRodadasFinalizadasHistorico

/**
 * Busca os detalhes de uma rodada específica para o histórico.
 */
export async function buscarDetalheRodada(
  roundId: string,
  participantId: string,
): Promise<DetalheRodadaHistorico | null> {
  const [{ data: round }, { data: part }, { data: matches }, { data: rr }] = await Promise.all([
    supabase
      .from('rounds')
      .select('id, number, name')
      .eq('id', roundId)
      .single(),
    supabase
      .from('participants')
      .select('id, name, avatar, emoji')
      .eq('id', participantId)
      .single(),
    supabase
      .from('matches')
      .select('id, home, away, home_score, away_score, match_date')
      .eq('round_id', roundId)
      .order('match_date', { ascending: true, nullsFirst: false }),
    supabase
      .from('round_results')
      .select('round_pts')
      .eq('round_id', roundId)
      .eq('participant_id', participantId)
      .maybeSingle(),
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
    return {
      matchId: m.id,
      home: m.home,
      away: m.away,
      homeScore: m.home_score,
      awayScore: m.away_score,
      predH: p?.pred_h ?? null,
      predA: p?.pred_a ?? null,
      pontos: p?.points ?? null,
    }
  })

  return {
    roundId: round.id,
    numero: round.number,
    nome: round.name,
    participante: {
      participantId: part.id,
      nome: part.name,
      avatar: part.avatar ?? null,
      emoji: part.emoji ?? null,
      pontosTotais: rr?.round_pts ?? 0,
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
