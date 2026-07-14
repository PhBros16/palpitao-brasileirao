import { supabase } from './supabase'

export interface JogoAdmin {
  id: string
  home: string
  away: string
  date: string
  time: string
  locked: boolean
}

export interface RodadaAdmin {
  roundId: string | null
  nome: string
  numero: number
  aberta: boolean
  finalizada: boolean
  valeDobro: boolean
  jogos: JogoAdmin[]
}

/** Um id "novo" (ainda não salvo) é gerado no client como 'j' + timestamp —
 *  nunca colide com um uuid real do Supabase (que sempre tem hífen). */
function ehIdNovo(id: string) {
  return !id.includes('-')
}

/** Busca a rodada ativa (palpites_open = true, a mais recente por número).
 *  Se não houver nenhuma aberta, cai pra rodada de maior número (última criada). */
export async function buscarRodadaAtiva(): Promise<RodadaAdmin> {
  let { data: round } = await supabase
    .from('rounds')
    .select('id, number, name, palpites_open, finalized, is_double')
    .eq('palpites_open', true)
    .order('number', { ascending: false })
    .limit(1)
    .maybeSingle()

  if (!round) {
    const res = await supabase.from('rounds').select('id, number, name, palpites_open, finalized, is_double').order('number', { ascending: false }).limit(1).maybeSingle()
    round = res.data
  }

  if (!round) {
    return { roundId: null, nome: 'Rodada 20', numero: 20, aberta: true, finalizada: false, valeDobro: false, jogos: [] }
  }

  const { data: matches } = await supabase
    .from('matches')
    .select('id, home, away, match_date, match_time, travado_manual')
    .eq('round_id', round.id)
    .order('match_date', { ascending: true })

  const jogos: JogoAdmin[] = (matches ?? []).map((m) => ({
    id: m.id,
    home: m.home,
    away: m.away,
    date: m.match_date ?? '',
    time: m.match_time?.slice(0, 5) ?? '',
    locked: m.travado_manual ?? false,
  }))

  return {
    roundId: round.id,
    nome: round.name,
    numero: round.number,
    aberta: round.palpites_open,
    finalizada: round.finalized,
    valeDobro: round.is_double ?? false,
    jogos,
  }
}

/** Salva nome/número/abertura da rodada + reconcilia os jogos (cria os novos,
 *  atualiza os existentes, apaga os removidos). Retorna o roundId real
 *  (necessário na primeira vez que uma rodada nova é criada). */
export async function salvarRodada(
  roundId: string | null,
  nome: string,
  numero: number,
  aberta: boolean,
  valeDobro: boolean,
  jogos: JogoAdmin[],
  jogosOriginaisIds: string[],
): Promise<string> {
  let idFinal = roundId

  if (idFinal) {
    const { error } = await supabase.from('rounds').update({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro }).eq('id', idFinal)
    if (error) throw error
  } else {
    const { data, error } = await supabase.from('rounds').insert({ name: nome, number: numero, palpites_open: aberta, is_double: valeDobro, finalized: false }).select('id').single()
    if (error) throw error
    idFinal = data.id
  }

  const idsAtuais = jogos.filter((j) => !ehIdNovo(j.id)).map((j) => j.id)
  const idsRemovidos = jogosOriginaisIds.filter((id) => !idsAtuais.includes(id))
  if (idsRemovidos.length > 0) {
    const { error } = await supabase.from('matches').delete().in('id', idsRemovidos)
    if (error) throw error
  }

  for (const j of jogos) {
    const payload = {
      round_id: idFinal,
      home: j.home,
      away: j.away,
      match_date: j.date || null,
      match_time: j.time || null,
      travado_manual: j.locked,
    }
    if (ehIdNovo(j.id)) {
      const { error } = await supabase.from('matches').insert(payload)
      if (error) throw error
    } else {
      const { error } = await supabase.from('matches').update(payload).eq('id', j.id)
      if (error) throw error
    }
  }

  return idFinal!
}

/** Finaliza a rodada — fecha palpites e marca como encerrada. O cálculo de
 *  pontos em si usa lib/domain/pontuacao.ts (não duplicado aqui). */
export async function finalizarRodada(roundId: string): Promise<void> {
  const { error } = await supabase.from('rounds').update({ finalized: true, palpites_open: false }).eq('id', roundId)
  if (error) throw error
}

/** Apaga todos os palpites da rodada (predictions), sem mexer nos jogos. */
export async function limparPalpitesRodada(roundId: string): Promise<void> {
  const { data: matches } = await supabase.from('matches').select('id').eq('round_id', roundId)
  const ids = (matches ?? []).map((m) => m.id)
  if (ids.length === 0) return
  const { error } = await supabase.from('predictions').delete().in('match_id', ids)
  if (error) throw error
}
