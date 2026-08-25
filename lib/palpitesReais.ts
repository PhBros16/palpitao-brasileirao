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

// Normaliza o nome do time para garantir que o escudo seja encontrado 
// e o layout não quebre com nomes muito longos.
function normalizarNomeParaPalpite(nomeBruto: string): string {
  if (!nomeBruto) return ''
  const str = nomeBruto.trim().toLowerCase().normalize('NFD').replace(/[\u0300-\u036f]/g, '')

  if (str.includes('palmeiras')) return 'Palmeiras'
  if (str.includes('flamengo')) return 'Flamengo'
  if (str.includes('athletico') || str.includes('atletico-pr') || str.includes('atletico pr') || str.includes('cap')) return 'Athletico-PR'
  if (str.includes('fluminense') || str.includes('flu')) return 'Fluminense'
  if (str.includes('cruzeiro')) return 'Cruzeiro'
  if (str.includes('bahia')) return 'Bahia'
  if (str.includes('bragantino') || str.includes('red bull')) return 'RB Bragantino'
  if (str.includes('coritiba') || str.includes('coxa')) return 'Coritiba'
  if (str.includes('atletico-mg') || str.includes('atletico mg') || str.includes('galo')) return 'Atlético-MG'
  if (str.includes('corinthians') || str.includes('timao')) return 'Corinthians'
  if (str.includes('botafogo') || str.includes('bota')) return 'Botafogo'
  if (str.includes('vitoria')) return 'Vitória'
  if (str.includes('sao paulo') || str.includes('spfc')) return 'São Paulo'
  if (str.includes('santos')) return 'Santos'
  if (str.includes('gremio')) return 'Grêmio'
  if (str.includes('internacional') || str.includes('inter')) return 'Internacional'
  if (str.includes('mirassol')) return 'Mirassol'
  if (str.includes('remo')) return 'Remo'
  if (str.includes('vasco')) return 'Vasco'
  if (str.includes('chapecoense') || str.includes('chape')) return 'Chapecoense'

  return nomeBruto.trim()
}

export async function buscarRodadaAtivaPalpites(): Promise<RodadaPalpites> {
  const { data: round } = await supabase
    .from('rounds')
    .select('id, number, name')
    .eq('palpites_open', true)
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
    .order('match_date', { ascending: true })

  const jogos: JogoParaPalpite[] = (matches ?? []).map((m) => {
    // Calcula se já passou da hora (travamento automático)
    let isLocked = m.travado_manual ?? false
    if (!isLocked && m.match_date && m.match_time) {
      const dateTimeStr = `${m.match_date}T${m.match_time}`
      const matchTime = new Date(dateTimeStr).getTime()
      if (Date.now() >= matchTime) {
        isLocked = true
      }
    }
    return {
      id: m.id,
      home: normalizarNomeParaPalpite(m.home), // Normaliza o nome do mandante
      away: normalizarNomeParaPalpite(m.away), // Normaliza o nome do visitante
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

  // Loga a ação com os detalhes antes de salvar
  try {
    const { data: parts } = await supabase.from('participants').select('name').eq('id', participantId).single()
    const { data: matchesData } = await supabase.from('matches').select('id, home, away').in('id', matchIds)

    if (parts && matchesData) {
      const matchMap = new Map(matchesData.map(m => [m.id, m]))
      const logJogos = matchIds.map(id => {
        const m = matchMap.get(id)
        const p = palpites[id]
        return m ? { jogo: `${m.home}×${m.away}`, palpite: `${p.h}×${p.a}` } : null
      }).filter(Boolean)

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
    points: null, // zera os pontos pois é um palpite novo/editado
  }))

  const { error } = await supabase.from('predictions').upsert(upserts, { onConflict: 'participant_id, match_id' })
  if (error) throw error
}
