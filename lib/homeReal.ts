import { supabase } from './supabase'
import { calcPoints } from './domain/pontuacao'

export interface ParcialLinha {
  participantId: string
  nome: string
  avatar: string | null
  emoji: string | null
  ptsRodada: number | null
  totalGeral: number
}

export interface PlacaresJogo {
  matchId: string
  home: string
  away: string
  placares: Array<{ placar: string; qtd: number }>
}

export interface DistribuicaoJogo {
  matchId: string
  home: string
  away: string
  mandante: number
  empate: number
  visitante: number
  totalPalpites: number
}

export interface HomeCompleta {
  meuPerfil: { id: string; nome: string; avatar: string | null; emoji: string | null } | null
  rodada: {
    id: string
    nome: string
    isDouble: boolean
    jogosTotais: number
    jogosAbertos: number
    proximoJogoFechaEm: number | null
  } | null
  parcial: ParcialLinha[]
  stats: {
    ptsRodada: number | null
    posicaoRanking: number
    ptsPraSubir: number | null
    cravadasRodada: number
  } | null
  frango: {
    jogador: string
    texto: string | null
    fotoUrl: string | null
    rodadaNome: string
  } | null
  podioGeral: Array<{ id: string; nome: string; avatar: string | null; emoji: string | null; pts: number }>
  distribuicao: DistribuicaoJogo[]
  placares: PlacaresJogo[]
  avisos: { meusFaltantes: number; rodadaNome: string } | null
  formacaoId: string
}

export async function buscarHomeCompleta(participantId: string): Promise<HomeCompleta> {
  // As 3 buscas abaixo não dependem uma da outra — disparadas juntas em
  // vez de uma esperando a outra terminar (era o maior custo de tempo
  // desta função: eram 11 idas sequenciais ao banco antes desta troca).
  const [partsRes, formacaoRes, roundRes] = await Promise.all([
    supabase.from('participants').select('id, name, avatar, emoji, is_admin').eq('is_admin', false),
    supabase.from('app_settings').select('value').eq('key', 'formacao').maybeSingle().then(
      (r) => r,
      () => ({ data: null as any }),
    ),
    supabase
      .from('rounds')
      .select('id, name, is_double, number')
      .eq('palpites_open', true)
      .order('number', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ])

  const participants = partsRes.data ?? []
  const eu = participants.find((p) => p.id === participantId) ?? null

  let formacaoId = '4-3-3'
  const formacaoValue = formacaoRes?.data?.value
  if (formacaoValue) formacaoId = (formacaoValue as any).id ?? (formacaoValue as any).nome ?? '4-3-3'

  const round = roundRes.data

  if (!round) {
    // Pódio e frango não dependem um do outro — dispara juntos.
    const [podio, f] = await Promise.all([calcPodioGeral(participants), buscarUltimoFrango()])
    return {
      meuPerfil: eu ? { id: eu.id, nome: eu.name, avatar: eu.avatar, emoji: eu.emoji } : null,
      rodada: null, parcial: [], stats: null, frango: f, podioGeral: podio,
      distribuicao: [], placares: [], avisos: null, formacaoId,
    }
  }

  // matches e a base do ranking geral não dependem um do outro — só os
  // palpites (preds) dependem de sabermos os IDs dos jogos primeiro.
  const [matchesRes, pontuacaoBase] = await Promise.all([
    supabase
      .from('matches')
      .select('id, home, away, match_date, match_time, travado_manual, home_score, away_score')
      .eq('round_id', round.id)
      .order('match_date', { ascending: true }),
    calcBaseRanking(participants),
  ])

  const mList = matchesRes.data ?? []

  // Palpites e o frango da rodada anterior não dependem um do outro —
  // dispara juntos, já deixando o frango pronto pro fim da função.
  const [predsRes, f] = await Promise.all([
    mList.length > 0
      ? supabase.from('predictions').select('participant_id, match_id, pred_h, pred_a').in('match_id', mList.map((m) => m.id))
      : Promise.resolve({ data: [] as any[] }),
    buscarUltimoFrango(),
  ])

  const pList = predsRes.data ?? []

  let proximoFechaEm: number | null = null
  let jogosAbertos = 0
  const agora = Date.now()

  for (const m of mList) {
    let travado = m.travado_manual ?? false
    let matchTimeStr = ''
    if (!travado && m.match_date && m.match_time) {
      // Ajuste crucial de data para aceitar YYYY-MM-DD e DD/MM/YYYY
      const dateStr = m.match_date.includes('/') ? m.match_date.split('/').reverse().join('-') : m.match_date
      matchTimeStr = `${dateStr}T${m.match_time}`
      const ms = new Date(matchTimeStr).getTime()
      if (agora >= ms) travado = true
      else {
        jogosAbertos++
        const diff = ms - agora
        if (proximoFechaEm === null || diff < proximoFechaEm) {
          proximoFechaEm = diff
        }
      }
    } else if (!travado) {
      jogosAbertos++
    }
  }

  const { parcial, cravadasMinhas, meusPtsRodada } = calcParcial(participants, mList, pList, round.is_double, pontuacaoBase, participantId)

  let posicaoRanking = 1
  let ptsPraSubir: number | null = null
  if (parcial.length > 0) {
    const ordenados = [...parcial].sort((a, b) => b.totalGeral - a.totalGeral)
    const idx = ordenados.findIndex((l) => l.participantId === participantId)
    if (idx >= 0) {
      posicaoRanking = idx + 1
      if (idx > 0) {
        ptsPraSubir = ordenados[idx - 1].totalGeral - ordenados[idx].totalGeral
      }
    }
  }

  const stats = {
    ptsRodada: meusPtsRodada,
    posicaoRanking,
    ptsPraSubir,
    cravadasRodada: cravadasMinhas,
  }

  const meusPalpites = pList.filter((p) => p.participant_id === participantId)
  const meusFaltantes = mList.length - meusPalpites.length

  const { placares, distribuicao } = calcEstatisticasPalpites(mList, pList)

  // Reaproveita a MESMA pontuacaoBase já calculada acima — antes esta
  // linha chamava calcPodioGeral(participants), que recalculava a base
  // do zero (2 consultas repetidas ao banco só pra chegar no mesmo número).
  const podioGeral = montarPodio(participants, pontuacaoBase)

  return {
    meuPerfil: eu ? { id: eu.id, nome: eu.name, avatar: eu.avatar, emoji: eu.emoji } : null,
    rodada: {
      id: round.id,
      nome: round.name,
      isDouble: round.is_double ?? false,
      jogosTotais: mList.length,
      jogosAbertos,
      proximoJogoFechaEm: proximoFechaEm,
    },
    parcial, stats, frango: f, podioGeral, distribuicao, placares,
    avisos: { meusFaltantes, rodadaNome: round.name },
    formacaoId,
  }
}

async function calcBaseRanking(parts: any[]) {
  const { data: rounds } = await supabase.from('rounds').select('id').eq('finalized', true)
  const rIds = (rounds ?? []).map((r) => r.id)
  const res = new Map<string, number>()
  for (const p of parts) res.set(p.id, 0)
  if (rIds.length === 0) return res

  const { data: rr } = await supabase.from('round_results').select('participant_id, round_pts').in('round_id', rIds)
  for (const row of rr ?? []) {
    res.set(row.participant_id, (res.get(row.participant_id) ?? 0) + (row.round_pts ?? 0))
  }
  return res
}

function montarPodio(parts: any[], base: Map<string, number>) {
  const lista = parts.map((p) => ({
    id: p.id,
    nome: p.name,
    avatar: p.avatar ?? null,
    emoji: p.emoji ?? null,
    pts: base.get(p.id) ?? 0,
  }))
  lista.sort((a, b) => b.pts - a.pts)
  return lista.slice(0, 3).filter((l) => l.pts > 0)
}

async function calcPodioGeral(parts: any[]) {
  const base = await calcBaseRanking(parts)
  return montarPodio(parts, base)
}

async function buscarUltimoFrango() {
  const { data: rounds } = await supabase.from('rounds').select('id, name').eq('finalized', true).order('number', { ascending: false }).limit(1).maybeSingle()
  if (!rounds) return null
  const { data: sh } = await supabase.from('shame').select('player_name, text, photo_url').eq('round_id', rounds.id).maybeSingle()
  if (!sh) return null
  return {
    jogador: sh.player_name,
    texto: sh.text ?? null,
    fotoUrl: sh.photo_url ?? null,
    rodadaNome: rounds.name,
  }
}

function calcParcial(parts: any[], matches: any[], preds: any[], isDouble: boolean, pontuacaoBase: Map<string, number>, meuId: string) {
  const pMap = new Map<string, Array<{ match_id: string; pred_h: number; pred_a: number }>>()
  for (const p of preds) {
    if (!pMap.has(p.participant_id)) pMap.set(p.participant_id, [])
    pMap.get(p.participant_id)!.push(p)
  }

  const parcial: ParcialLinha[] = []
  let cravadasMinhas = 0
  let meusPtsRodada: number | null = null

  for (const pt of parts) {
    const palps = pMap.get(pt.id) ?? []
    const base = pontuacaoBase.get(pt.id) ?? 0
    if (palps.length === 0) {
      parcial.push({ participantId: pt.id, nome: pt.name, avatar: pt.avatar, emoji: pt.emoji, ptsRodada: null, totalGeral: base })
      continue
    }

    let rodPts = 0
    for (const p of palps) {
      const m = matches.find((x) => x.id === p.match_id)
      if (!m || m.home_score === null || m.away_score === null) continue
      const val = calcPoints({ h: p.pred_h, a: p.pred_a }, { h: m.home_score, a: m.away_score })
      if (val !== null) {
        const pFinal = isDouble ? val * 2 : val
        rodPts += pFinal
        if (pt.id === meuId && (val === 5 || val === 10)) cravadasMinhas++
      }
    }
    if (pt.id === meuId) meusPtsRodada = rodPts
    parcial.push({ participantId: pt.id, nome: pt.name, avatar: pt.avatar, emoji: pt.emoji, ptsRodada: rodPts, totalGeral: base + rodPts })
  }
  return { parcial, cravadasMinhas, meusPtsRodada }
}

function calcEstatisticasPalpites(matches: any[], preds: any[]) {
  const placares: PlacaresJogo[] = []
  const distribuicao: DistribuicaoJogo[] = []

  for (const m of matches) {
    const pm = preds.filter((p) => p.match_id === m.id)
    if (pm.length === 0) continue

    const homeNome = m.home === 'Red Bull Bragantino' ? 'RB Bragantino' : m.home
    const awayNome = m.away === 'Red Bull Bragantino' ? 'RB Bragantino' : m.away

    const cnt = new Map<string, number>()
    let mand = 0, emp = 0, vis = 0
    for (const p of pm) {
      const key = `${p.pred_h}×${p.pred_a}`
      cnt.set(key, (cnt.get(key) ?? 0) + 1)
      if (p.pred_h > p.pred_a) mand++
      else if (p.pred_a > p.pred_h) vis++
      else emp++
    }

    const placs = Array.from(cnt.entries()).map(([placar, qtd]) => ({ placar, qtd })).sort((a, b) => b.qtd - a.qtd)
    placares.push({ matchId: m.id, home: homeNome, away: awayNome, placares: placs })
    distribuicao.push({ matchId: m.id, home: homeNome, away: awayNome, mandante: mand, empate: emp, visitante: vis, totalPalpites: pm.length })
  }

  return { placares, distribuicao }
}
