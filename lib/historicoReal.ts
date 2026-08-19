// Camada de dados do Histórico.
// Busca rodadas finalizadas + monta pacote (ranking + jogos + palpites + frango).

import { supabase } from './supabase'

export interface CampeaoRodada {
  nome: string
  avatar: string | null
  emoji: string | null
  pts: number
}

export interface RodadaHistorico {
  id: string
  number: number
  name: string
  isDouble: boolean
  totalJogos: number
  /** Primeiro campeão (mantido pra compatibilidade). Use `campeoes` pra ver todos. */
  campeao: CampeaoRodada | null
  /** Lista de campeões (mais de um em caso de empate perfeito). */
  campeoes: CampeaoRodada[]
  meusPontos: number | null
}

export interface LinhaRankingRodada {
  participantId: string
  nome: string
  avatar: string | null
  emoji: string | null
  pontos: number
  cravadas: number
  vencedor: number
  saldo: number
  position: number
}

export interface JogoHistorico {
  id: string
  home: string
  away: string
  homeScore: number | null
  awayScore: number | null
  matchDate: string | null
  matchTime: string | null
  palpites: Array<{
    participantId: string
    nome: string
    avatar: string | null
    emoji: string | null
    predH: number | null
    predA: number | null
    points: number
  }>
}

export interface FrangoHistorico {
  playerName: string
  text: string | null
  photoUrl: string | null
}

export interface DetalheRodadaHistorico {
  rodada: RodadaHistorico
  ranking: LinhaRankingRodada[]
  jogos: JogoHistorico[]
  frango: FrangoHistorico | null
}

// ─── Listagem simples ────────────────────────────────────────────────────────

export async function buscarRodadasFinalizadasHistorico(
  meuParticipantId: string | null,
): Promise<RodadaHistorico[]> {
  const { data: rounds, error } = await supabase
    .from('rounds')
    .select('id, number, name, is_double, finalized')
    .eq('finalized', true)
    .order('created_at', { ascending: false })

  if (error) throw new Error(error.message)
  if (!rounds || rounds.length === 0) return []

  const roundIds = rounds.map((r) => r.id)

  // Todos os round_results das rodadas de uma vez (com campos pra desempate)
  const { data: results } = await supabase
    .from('round_results')
    .select('round_id, participant_id, round_pts, exact_scores, correct_winner, correct_saldo')
    .in('round_id', roundIds)

  // Todos os participantes (só não-admin)
  const { data: parts } = await supabase
    .from('participants')
    .select('id, name, avatar, emoji, is_admin')
    .eq('is_admin', false)

  const partMap = new Map<string, { nome: string; avatar: string | null; emoji: string | null }>()
  ;(parts ?? []).forEach((p) => {
    partMap.set(p.id, { nome: p.name, avatar: p.avatar ?? null, emoji: p.emoji ?? null })
  })

  // Contagem de jogos por rodada
  const { data: matches } = await supabase
    .from('matches')
    .select('round_id')
    .in('round_id', roundIds)

  const jogosPorRodada = new Map<string, number>()
  ;(matches ?? []).forEach((m) => {
    jogosPorRodada.set(m.round_id, (jogosPorRodada.get(m.round_id) ?? 0) + 1)
  })

  return rounds.map((r) => {
    const resultsRodada = (results ?? []).filter((x) => x.round_id === r.id)

    // Ordena por: pts → cravadas → vencedor → saldo (desc)
    const ordenados = resultsRodada
      .filter((x) => partMap.has(x.participant_id))
      .sort((a, b) => {
        if ((b.round_pts ?? 0) !== (a.round_pts ?? 0)) return (b.round_pts ?? 0) - (a.round_pts ?? 0)
        if ((b.exact_scores ?? 0) !== (a.exact_scores ?? 0)) return (b.exact_scores ?? 0) - (a.exact_scores ?? 0)
        if ((b.correct_winner ?? 0) !== (a.correct_winner ?? 0)) return (b.correct_winner ?? 0) - (a.correct_winner ?? 0)
        return (b.correct_saldo ?? 0) - (a.correct_saldo ?? 0)
      })

    // Campeões = todos que empatam TOTALMENTE (pts + cravadas + vencedor + saldo) com o primeiro
    const campeoes: CampeaoRodada[] = []
    if (ordenados.length > 0) {
      const primeiro = ordenados[0]
      for (const r of ordenados) {
        const empatouTudo =
          (r.round_pts ?? 0) === (primeiro.round_pts ?? 0) &&
          (r.exact_scores ?? 0) === (primeiro.exact_scores ?? 0) &&
          (r.correct_winner ?? 0) === (primeiro.correct_winner ?? 0) &&
          (r.correct_saldo ?? 0) === (primeiro.correct_saldo ?? 0)
        if (!empatouTudo) break

        const p = partMap.get(r.participant_id)
        if (p) {
          campeoes.push({
            nome: p.nome,
            avatar: p.avatar,
            emoji: p.emoji,
            pts: r.round_pts ?? 0,
          })
        }
      }
    }

    let meusPontos: number | null = null
    if (meuParticipantId) {
      const meu = resultsRodada.find((x) => x.participant_id === meuParticipantId)
      meusPontos = meu ? meu.round_pts ?? 0 : null
    }

    return {
      id: r.id,
      number: r.number,
      name: r.name,
      isDouble: r.is_double ?? false,
      totalJogos: jogosPorRodada.get(r.id) ?? 0,
      campeao: campeoes[0] ?? null,
      campeoes,
      meusPontos,
    }
  })
}

// ─── Detalhe completo de uma rodada ──────────────────────────────────────────

export async function buscarDetalheRodada(roundId: string): Promise<DetalheRodadaHistorico | null> {
  // 1. Info da rodada
  const { data: round, error: errR } = await supabase
    .from('rounds')
    .select('id, number, name, is_double')
    .eq('id', roundId)
    .maybeSingle()
  if (errR || !round) return null

  // 2. Participantes não-admin
  const { data: parts } = await supabase
    .from('participants')
    .select('id, name, avatar, emoji')
    .eq('is_admin', false)

  const partMap = new Map<string, { nome: string; avatar: string | null; emoji: string | null }>()
  ;(parts ?? []).forEach((p) => {
    partMap.set(p.id, { nome: p.name, avatar: p.avatar ?? null, emoji: p.emoji ?? null })
  })

  // 3. Ranking DA RODADA (ordenado por pts da rodada, não position do campeonato!)
  const { data: results } = await supabase
    .from('round_results')
    .select('participant_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .eq('round_id', roundId)

  const rankingBruto = (results ?? [])
    .filter((r) => partMap.has(r.participant_id))
    .map((r) => {
      const p = partMap.get(r.participant_id)!
      return {
        participantId: r.participant_id,
        nome: p.nome,
        avatar: p.avatar,
        emoji: p.emoji,
        pontos: r.round_pts ?? 0,
        cravadas: r.exact_scores ?? 0,
        vencedor: r.correct_winner ?? 0,
        saldo: r.correct_saldo ?? 0,
      }
    })
    .sort((a, b) => {
      if (b.pontos !== a.pontos) return b.pontos - a.pontos
      if (b.cravadas !== a.cravadas) return b.cravadas - a.cravadas
      if (b.vencedor !== a.vencedor) return b.vencedor - a.vencedor
      if (b.saldo !== a.saldo) return b.saldo - a.saldo
      return a.nome.localeCompare(b.nome, 'pt-BR')
    })

  const ranking: LinhaRankingRodada[] = rankingBruto.map((r, i) => ({
    ...r,
    position: i + 1,
  }))

  // 4. Jogos da rodada
  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score, match_date, match_time')
    .eq('round_id', roundId)
    .order('match_date', { ascending: true, nullsFirst: false })
    .order('match_time', { ascending: true, nullsFirst: false })

  const matchIds = (matches ?? []).map((m) => m.id)

  // 5. Palpites de todos os jogos
  const { data: preds } = matchIds.length
    ? await supabase
        .from('predictions')
        .select('match_id, participant_id, pred_h, pred_a, points')
        .in('match_id', matchIds)
    : { data: [] as any[] }

  const jogos: JogoHistorico[] = (matches ?? []).map((m) => {
    const palpitesJogo = (preds ?? [])
      .filter((p) => p.match_id === m.id && partMap.has(p.participant_id))
      .map((p) => {
        const part = partMap.get(p.participant_id)!
        return {
          participantId: p.participant_id,
          nome: part.nome,
          avatar: part.avatar,
          emoji: part.emoji,
          predH: p.pred_h,
          predA: p.pred_a,
          points: p.points ?? 0,
        }
      })
      .sort((a, b) => a.nome.localeCompare(b.nome, 'pt-BR'))

    return {
      id: m.id,
      home: m.home,
      away: m.away,
      homeScore: m.home_score,
      awayScore: m.away_score,
      matchDate: m.match_date,
      matchTime: m.match_time,
      palpites: palpitesJogo,
    }
  })

  // 6. Frango (se tem)
  const { data: shameRow } = await supabase
    .from('shame')
    .select('player_name, text, photo_url')
    .eq('round_id', roundId)
    .order('created_at', { ascending: false })
    .limit(1)
    .maybeSingle()

  const frango: FrangoHistorico | null = shameRow
    ? { playerName: shameRow.player_name, text: shameRow.text ?? null, photoUrl: shameRow.photo_url ?? null }
    : null

  // Detecta campeões (podem ser vários em empate perfeito)
  const campeoes: CampeaoRodada[] = []
  if (ranking.length > 0) {
    const primeiro = ranking[0]
    for (const r of ranking) {
      if (
        r.pontos === primeiro.pontos &&
        r.cravadas === primeiro.cravadas &&
        r.vencedor === primeiro.vencedor &&
        r.saldo === primeiro.saldo
      ) {
        campeoes.push({ nome: r.nome, avatar: r.avatar, emoji: r.emoji, pts: r.pontos })
      } else {
        break
      }
    }
  }

  const rodada: RodadaHistorico = {
    id: round.id,
    number: round.number,
    name: round.name,
    isDouble: round.is_double ?? false,
    totalJogos: (matches ?? []).length,
    campeao: campeoes[0] ?? null,
    campeoes,
    meusPontos: null,
  }

  return { rodada, ranking, jogos, frango }
}

// ─── Categoriza acerto por palpite ───────────────────────────────────────────

export function categorizarAcerto(
  predH: number | null,
  predA: number | null,
  realH: number | null,
  realA: number | null,
): 'cravou' | 'saldo' | 'vencedor' | 'errou' | 'sem-palpite' | 'sem-resultado' {
  if (predH === null || predA === null) return 'sem-palpite'
  if (realH === null || realA === null) return 'sem-resultado'
  if (predH === realH && predA === realA) return 'cravou'

  const saldoReal = realH - realA
  const saldoPred = predH - predA
  const vencedorReal = saldoReal > 0 ? 'H' : saldoReal < 0 ? 'A' : 'E'
  const vencedorPred = saldoPred > 0 ? 'H' : saldoPred < 0 ? 'A' : 'E'

  if (vencedorReal !== vencedorPred) return 'errou'
  if (saldoReal === saldoPred) return 'saldo'
  return 'vencedor'
}
