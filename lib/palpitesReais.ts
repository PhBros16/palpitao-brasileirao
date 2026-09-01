import { supabase } from './supabase'

export interface JogoParaPalpite {
  id: string
  home: string
  away: string
  date: string
  time: string
  isLocked: boolean
}

export interface RodadaPalpites {
  roundId: string | null
  nome: string
  numero: number
  jogos: JogoParaPalpite[]
}

export async function buscarRodadaAtivaPalpites(): Promise<RodadaPalpites> {
  const { data: round } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('palpites_open', true)
    .eq('finalized', false)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) {
    return { roundId: null, nome: '', numero: 0, jogos: [] }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual')
    .eq('round_id', round.id)
    .order('match_date', { ascending: true }).order('match_time', { ascending: true })

  const agora = Date.now()

  const jogos: JogoParaPalpite[] = (matches ?? []).map((m) => {
    let isLocked = m.travado_manual ?? false

    // Trava automática por horário (Compatível 100% com Safari iOS/iPhone)
    if (!isLocked && m.match_date && m.match_time) {
      const dataFormatada = m.match_date.includes('/')
        ? m.match_date.split('/').reverse().join('-')
        : m.match_date

      // Adiciona o 'T' obrigatório do Safari para ISO Date
      const isoString = `${dataFormatada}T${m.match_time.substring(0, 5)}:00`
      const matchTime = new Date(isoString).getTime()

      if (!isNaN(matchTime) && agora >= matchTime) {
        isLocked = true
      }
    }

    return {
      id: m.id,
      home: m.home,
      away: m.away,
      date: m.match_date ?? '',
      time: m.match_time?.slice(0, 5) ?? '',
      isLocked,
    }
  })

  return {
    roundId: round.id,
    nome: round.name,
    numero: round.number,
    jogos,
  }
}

export async function buscarPalpitesExistentes(
  roundId: string,
  participantId: string,
): Promise<Record<string, { h: number; a: number }>> {
  const { data: matches } = await supabase.from('matches').select('id').eq('round_id', roundId)
  const matchIds = (matches ?? []).map((m) => m.id)

  if (matchIds.length === 0) return {}

  const { data: preds } = await supabase
    .from('predictions')
    .select('match_id, pred_h, pred_a')
    .eq('participant_id', participantId)
    .in('match_id', matchIds)

  const res: Record<string, { h: number; a: number }> = {}
  for (const p of preds ?? []) {
    if (p.pred_h !== null && p.pred_a !== null) {
      res[p.match_id] = { h: p.pred_h, a: p.pred_a }
    }
  }
  return res
}

export async function salvarPalpitesReais(
  participantId: string,
  palpites: Record<string, { h: number; a: number }>,
): Promise<void> {
  const matchIds = Object.keys(palpites)
  if (matchIds.length === 0) return

  try {
    const { data: parts } = await supabase.from('participants').select('name').eq('id', participantId).single()
    const { data: matchesData } = await supabase.from('matches').select('id, home, away').in('id', matchIds)

    if (parts && matchesData) {
      const matchMap = new Map(matchesData.map((m) => [m.id, m]))
      const logJogos = matchIds
        .map((id) => {
          const m = matchMap.get(id)
          const p = palpites[id]
          return m ? { jogo: `${m.home}×${m.away}`, palpite: `${p.h}×${p.a}` } : null
        })
        .filter(Boolean)

      await supabase.from('admin_log').insert({
        action: 'PALPITE_SALVO',
        payload: { jogos: logJogos },
        performed_by: parts.name,
        participant_id: participantId,
      })
    }
  } catch { /* ignora erro de log */ }

  const upserts = matchIds.map((matchId) => ({
    participant_id: participantId,
    match_id: matchId,
    pred_h: palpites[matchId].h,
    pred_a: palpites[matchId].a,
    points: null,
  }))

  const { error } = await supabase.from('predictions').upsert(upserts, { onConflict: 'participant_id, match_id' })
  if (error) throw error
}
