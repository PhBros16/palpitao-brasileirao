import { supabase } from './supabase'
import { getEscudo } from './escudos'
import type { JogoPalpite, Palpite } from '@/components/palpites/CardJogo'

export interface RodadaPalpites {
  roundId: string | null
  nome: string
  jogos: JogoPalpite[]
}

/** Combina match_date (date) + match_time (time) num ISO completo.
 *  Sem data/hora definida, usa "agora" — assim o jogo já nasce travado
 *  (mesmo comportamento documentado no admin: "sem data trava hoje").
 *  match_time pode vir do Postgres como "HH:MM" ou "HH:MM:SS" — normaliza. */
function combinarKickoff(date: string | null, time: string | null): string {
  if (!date) return new Date().toISOString()
  const horaBruta = time ?? '00:00'
  // Garante formato HH:MM:SS (Postgres pode devolver com ou sem segundos)
  const partes = horaBruta.split(':')
  const hh = (partes[0] ?? '00').padStart(2, '0')
  const mm = (partes[1] ?? '00').padStart(2, '0')
  const ss = (partes[2] ?? '00').padStart(2, '0')
  return new Date(`${date}T${hh}:${mm}:${ss}`).toISOString()
}

/** Busca a rodada com palpites abertos (a mais recente, se houver mais de
 *  uma por engano) + seus jogos, já com escudo resolvido por nome. */
export async function buscarRodadaAtivaPalpites(): Promise<RodadaPalpites> {
  const { data: round } = await supabase
    .from('rounds')
    .select('id, name')
    .eq('palpites_open', true)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) return { roundId: null, nome: '', jogos: [] }

  const { data: matches, error } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual')
    .eq('round_id', round.id)
    .order('match_date', { ascending: true })
  if (error) throw error

  const jogos: JogoPalpite[] = (matches ?? []).map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    homeLogo: getEscudo(m.home) || undefined,
    awayLogo: getEscudo(m.away) || undefined,
    kickoff: combinarKickoff(m.match_date, m.match_time),
    travadoManual: m.travado_manual ?? false,
  }))

  return { roundId: round.id, nome: round.name, jogos }
}

/** Palpites que o participante já salvou nessa rodada (pra pré-preencher). */
export async function buscarPalpitesExistentes(roundId: string, participantId: string): Promise<Record<string, Palpite>> {
  const { data: matches } = await supabase.from('matches').select('id').eq('round_id', roundId)
  const matchIds = (matches ?? []).map((m) => m.id)
  if (matchIds.length === 0) return {}

  const { data: predictions, error } = await supabase
    .from('predictions')
    .select('match_id, pred_h, pred_a')
    .eq('participant_id', participantId)
    .in('match_id', matchIds)
  if (error) throw error

  const out: Record<string, Palpite> = {}
  for (const p of predictions ?? []) {
    out[p.match_id] = { h: String(p.pred_h), a: String(p.pred_a) }
  }
  return out
}

/** Salva (upsert) os palpites preenchidos do participante nos jogos ainda
 *  abertos. Jogos vazios ("", "") são ignorados — não sobrescreve com lixo. */
export async function salvarPalpitesReais(
  participantId: string,
  palpites: Record<string, Palpite>,
): Promise<void> {
  for (const [matchId, p] of Object.entries(palpites)) {
    if (p.h === '' || p.a === '') continue
    const h = parseInt(p.h, 10)
    const a = parseInt(p.a, 10)
    if (Number.isNaN(h) || Number.isNaN(a)) continue

    const { data: existente } = await supabase
      .from('predictions')
      .select('id')
      .eq('participant_id', participantId)
      .eq('match_id', matchId)
      .maybeSingle()

    if (existente) {
      const { error } = await supabase.from('predictions').update({ pred_h: h, pred_a: a }).eq('id', existente.id)
      if (error) throw error
    } else {
      const { error } = await supabase.from('predictions').insert({ participant_id: participantId, match_id: matchId, pred_h: h, pred_a: a })
      if (error) throw error
    }
  }
}
