import { supabase } from './supabase'
import { calcPoints } from './domain/pontuacao'

export interface JogoParaPalpite {
  id: string
  home: string
  away: string
  date: string
  time: string
  isLocked: boolean
  // Resultado já publicado pelo admin. Enquanto false, o jogo é elegível pra
  // edição tardia (Modo Palpite Oculto) mesmo com isLocked=true; a partir do
  // momento que fica true, a edição tardia trava de vez pra esse jogo.
  temResultado: boolean
}

export interface RodadaPalpites {
  roundId: string | null
  nome: string
  numero: number
  jogos: JogoParaPalpite[]
  ocultarPalpitesDisponivel: boolean
}

export async function buscarRodadaAtivaPalpites(): Promise<RodadaPalpites> {
  const { data: round } = await supabase
    .from('rounds')
    .select('id, number, name, hide_predictions')
    .eq('palpites_open', true)
    .eq('finalized', false)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) {
    return { roundId: null, nome: '', numero: 0, jogos: [], ocultarPalpitesDisponivel: false }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual, home_score, away_score')
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
      temResultado: m.home_score !== null && m.away_score !== null,
    }
  })

  return {
    roundId: round.id,
    nome: round.name,
    numero: round.number,
    jogos,
    ocultarPalpitesDisponivel: round.hide_predictions ?? false,
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

  // Busca o resultado (se já existir) e se a rodada vale x2 — precisamos
  // disso pra calcular o points na hora, em vez de gravar null sempre.
  //
  // ANTES: todo save gravava points:null incondicionalmente. Se o palpite
  // fosse salvo/editado DEPOIS que o admin já tinha corrigido o resultado
  // daquele jogo, o points voltava pra null e ficava assim pra sempre — a
  // Home (que sempre recalcula na hora) continuava mostrando a pontuação
  // certa, mas a aba Rodada (que lê points do banco) mostrava 0, porque
  // nada nunca reescreveu esse campo de volta.
  const { data: matchesData } = await supabase
    .from('matches')
    .select('id, home, away, home_score, away_score, round_id, rounds!inner(is_double)')
    .in('id', matchIds)

  const matchMap = new Map((matchesData ?? []).map((m: any) => [m.id, m]))

  try {
    const { data: parts } = await supabase.from('participants').select('name').eq('id', participantId).single()

    if (parts && matchesData) {
      const logJogos = matchIds
        .map((id) => {
          const m = matchMap.get(id)
          const p = palpites[id]
          return m ? { jogo: `${m.home}×${m.away}`, palpite: `${p.h}×${p.a}`, matchId: id } : null
        })
        .filter(Boolean)

      const roundId = matchesData[0]?.round_id ?? null

      await supabase.from('admin_log').insert({
        action: 'PALPITE_SALVO',
        payload: { jogos: logJogos },
        performed_by: parts.name,
        participant_id: participantId,
        round_id: roundId,
      })
    }
  } catch { /* ignora erro de log */ }

  const upserts = matchIds.map((matchId) => {
    const m: any = matchMap.get(matchId)
    const p = palpites[matchId]

    let points: number | null = null
    if (m && m.home_score !== null && m.away_score !== null) {
      const val = calcPoints({ h: p.h, a: p.a }, { h: m.home_score, a: m.away_score })
      if (val !== null) {
        const valeDobro = m.rounds?.is_double ?? false
        points = valeDobro ? val * 2 : val
      }
    }

    return {
      participant_id: participantId,
      match_id: matchId,
      pred_h: p.h,
      pred_a: p.a,
      points,
    }
  })

  const { error } = await supabase.from('predictions').upsert(upserts, { onConflict: 'participant_id, match_id' })
  if (error) throw error
}

/**
 * Edição tardia (Modo Palpite Oculto, Fase 2) — clique 8x no placar.
 * Só roda pra UM jogo por vez (o clique é por card), e só quando:
 *  - a rodada tem hide_predictions ativo
 *  - o jogador está com a própria máscara ativa (ativo=true em palpite_mascaras)
 *  - ainda restam usos (edicoes_tardias_usadas < 3)
 *  - o jogo ainda não teve resultado publicado pelo admin
 * Diferente de salvarPalpitesReais: aqui SEMPRE loga como EDICAO_TARDIA (nunca
 * PALPITE_SALVO), pra não vazar no log antes da hora, e incrementa o contador.
 * Não recalcula pontuação — sem resultado publicado, points continua null,
 * igual ao save normal.
 */
export async function registrarEdicaoTardia(
  roundId: string,
  matchId: string,
  participantId: string,
  novoPalpite: { h: number; a: number },
): Promise<void> {
  const { data: match, error: matchErr } = await supabase
    .from('matches')
    .select('id, home, away, round_id, home_score, away_score')
    .eq('id', matchId)
    .single()
  if (matchErr) throw matchErr
  if (!match || match.round_id !== roundId) throw new Error('Jogo não pertence a essa rodada.')
  if (match.home_score !== null || match.away_score !== null) {
    throw new Error('Resultado já publicado — edição tardia bloqueada pra esse jogo.')
  }

  const { data: mascara, error: mascaraErr } = await supabase
    .from('palpite_mascaras')
    .select('ativo, edicoes_tardias_usadas')
    .eq('round_id', roundId)
    .eq('participant_id', participantId)
    .maybeSingle()
  if (mascaraErr) throw mascaraErr
  if (!mascara?.ativo) throw new Error('Edição tardia só funciona com o Modo Palpite Oculto ativado.')
  const usadas = mascara.edicoes_tardias_usadas ?? 0
  if (usadas >= 3) throw new Error('Limite de 3 edições tardias por rodada já foi usado.')

  const { data: predAntiga } = await supabase
    .from('predictions')
    .select('pred_h, pred_a')
    .eq('match_id', matchId)
    .eq('participant_id', participantId)
    .maybeSingle()

  const { data: parts, error: partsErr } = await supabase
    .from('participants')
    .select('name')
    .eq('id', participantId)
    .single()
  if (partsErr) throw partsErr

  const { error: predErr } = await supabase
    .from('predictions')
    .upsert(
      { participant_id: participantId, match_id: matchId, pred_h: novoPalpite.h, pred_a: novoPalpite.a, points: null },
      { onConflict: 'participant_id, match_id' },
    )
  if (predErr) throw predErr

  const { error: contadorErr } = await supabase
    .from('palpite_mascaras')
    .update({ edicoes_tardias_usadas: usadas + 1 })
    .eq('round_id', roundId)
    .eq('participant_id', participantId)
  if (contadorErr) throw contadorErr

  await supabase.from('admin_log').insert({
    action: 'EDICAO_TARDIA',
    payload: {
      jogos: [
        {
          matchId,
          jogo: `${match.home}×${match.away}`,
          palpite: `${novoPalpite.h}×${novoPalpite.a}`,
          palpiteAntigo: predAntiga ? `${predAntiga.pred_h}×${predAntiga.pred_a}` : '—',
        },
      ],
    },
    performed_by: parts.name,
    participant_id: participantId,
    round_id: roundId,
  })
}
