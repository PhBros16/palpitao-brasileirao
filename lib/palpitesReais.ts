import { supabase } from './supabase'

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
  if (Object.keys(palpites).length === 0) return

  // Todo o trabalho (trava por horário, cálculo de points, log) agora roda
  // dentro de rpc_salvar_palpites, no banco — não é mais feito aqui em cima
  // de dados lidos pelo cliente. Isso fecha o buraco de alguém escrever
  // direto em `predictions` via REST com a anon key e se dar pontos que não
  // fez (RLS não permite mais INSERT/UPDATE direto nessa tabela).
  const { error } = await supabase.rpc('rpc_salvar_palpites', {
    p_participant_id: participantId,
    p_palpites: palpites,
  })
  if (error) throw error
}

/**
 * Edição tardia (Modo Palpite Oculto, Fase 2) — clique 8x no placar.
 * Todas as validações (jogo sem resultado, máscara ativa, uso < 3) e a
 * escrita em predictions/palpite_mascaras/admin_log rodam dentro de
 * rpc_registrar_edicao_tardia, numa única transação com lock de linha —
 * fecha tanto a escrita direta via REST quanto a corrida de duas edições
 * simultâneas do mesmo jogador furando o limite de 3.
 */
export async function registrarEdicaoTardia(
  roundId: string,
  matchId: string,
  participantId: string,
  novoPalpite: { h: number; a: number },
): Promise<void> {
  const { error } = await supabase.rpc('rpc_registrar_edicao_tardia', {
    p_round_id: roundId,
    p_match_id: matchId,
    p_participant_id: participantId,
    p_pred_h: novoPalpite.h,
    p_pred_a: novoPalpite.a,
  })
  if (error) throw error
}
