import { supabase } from './supabase'

// Camada de dados dos Troféus.
//
// Portada do calcTrofeus() do Copa, com 2 adaptações pro contexto liga:
//   - Sangue Frio / Vidente: mata-mata → rodada dupla (is_double=true)
//   - Flamenguista (Brasil) → Chutômetro (2x1 em 50+ jogos)
//
// Total: 39 troféus (16 tier1 + 13 tier2 + 9 tier3 + 1 tier4).
// Fonte primária: round_results (pontos por rodada) + predictions + matches
// pra detalhes por jogo (cravadas, saldos, empates, etc).

export type TierTrofeuNum = 1 | 2 | 3 | 4

export interface TrofeuReal {
  id: string
  icon: string
  label: string
  desc: string
  tier: TierTrofeuNum
  unlocked: boolean
}

export interface TrofeusDoJogador {
  participantId: string
  nome: string
  trofeus: TrofeuReal[]
  totalConquistados: number
  totalGeral: number
}

// ─── Função principal ────────────────────────────────────────────────────────

export async function buscarTrofeusJogador(participantId: string): Promise<TrofeusDoJogador> {
  // 1. Dados base
  const [
    { data: participants },
    { data: rounds },
    { data: campsFinalizados },
  ] = await Promise.all([
    supabase.from('participants').select('id, name').eq('is_admin', false).order('name'),
    supabase.from('rounds').select('id, number, is_double').eq('finalized', true).order('number', { ascending: true }),
    supabase.from('campeonatos_finalizados').select('campeao'),
  ])

  if (!participants || !rounds || rounds.length === 0) {
    return { participantId, nome: '?', trofeus: [], totalConquistados: 0, totalGeral: 39 }
  }

  const jogador = participants.find((p) => p.id === participantId)
  if (!jogador) {
    return { participantId, nome: '?', trofeus: [], totalConquistados: 0, totalGeral: 39 }
  }

  // Verifica se o jogador já venceu oficialmente um campeonato encerrado no Admin
  const jaFoiCampeaoDeVerdade = (campsFinalizados ?? []).some((c) => c.campeao === jogador.name)

  const roundIds = rounds.map((r) => r.id)

  // 2. round_results de TODOS (pra calcular posição em cada rodada)
  const { data: rrRows } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts, exact_scores, correct_saldo, correct_winner')
    .in('round_id', roundIds)

  // 3. Todos os matches das rodadas finalizadas
  const { data: matches } = await supabase
    .from('matches')
    .select('id, round_id, home_score, away_score')
    .in('round_id', roundIds)
  const matchIds = (matches ?? []).map((m) => m.id)

  // 4. Predictions do jogador
  const { data: preds } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('match_id, pred_h, pred_a, points')
    .eq('participant_id', participantId)
    .in('match_id', matchIds) : { data: [] as any[] }

  // ─── Monta history: array de rodadas com scores/palpites do jogador ────

  interface Rodada {
    roundId: string
    number: number
    is_double: boolean
    scores: Record<string, number>       // participantId → pontos
    posicaoJogador: number                // 0-indexed dentro dessa rodada
    palpitesJogador: Array<{
      matchId: string
      pred_h: number
      pred_a: number
      home_score: number | null
      away_score: number | null
      points: number
    }>
    ptsJogador: number | null              // null se NP
  }

  const predsByMatchId = new Map((preds ?? []).map((p) => [p.match_id, p]))
  const rrByRoundAndPart = new Map<string, Map<string, number>>()
  const rrJogadorPorRodada = new Map<string, { pts: number; cravadas: number; saldos: number; vencedores: number }>()

  for (const rr of rrRows ?? []) {
    if (!rrByRoundAndPart.has(rr.round_id)) rrByRoundAndPart.set(rr.round_id, new Map())
    rrByRoundAndPart.get(rr.round_id)!.set(rr.participant_id, rr.round_pts ?? 0)
    if (rr.participant_id === participantId) {
      rrJogadorPorRodada.set(rr.round_id, {
        pts: rr.round_pts ?? 0,
        cravadas: rr.exact_scores ?? 0,
        saldos: rr.correct_saldo ?? 0,
        vencedores: rr.correct_winner ?? 0,
      })
    }
  }

  const history: Rodada[] = rounds.map((r) => {
    const scoresMap = rrByRoundAndPart.get(r.id) ?? new Map()
    const scores: Record<string, number> = {}
    for (const p of participants) {
      const pts = scoresMap.get(p.id)
      if (pts !== undefined) scores[p.id] = pts
    }

    const ordenados = Object.entries(scores).sort((a, b) => b[1] - a[1])
    const posicaoJogador = ordenados.findIndex(([pid]) => pid === participantId)

    const jogosDaRodada = (matches ?? []).filter((m) => m.round_id === r.id)
    const palpitesJogador = jogosDaRodada
      .map((m) => {
        const pred = predsByMatchId.get(m.id)
        if (!pred) return null
        return {
          matchId: m.id,
          pred_h: pred.pred_h,
          pred_a: pred.pred_a,
          home_score: m.home_score,
          away_score: m.away_score,
          points: pred.points ?? 0,
        }
      })
      .filter((x): x is NonNullable<typeof x> => x !== null)

    const rrJog = rrJogadorPorRodada.get(r.id)
    return {
      roundId: r.id,
      number: r.number,
      is_double: r.is_double ?? false,
      scores,
      posicaoJogador,
      palpitesJogador,
      ptsJogador: rrJog ? rrJog.pts : null,
    }
  })

  // ─── Estatísticas agregadas do jogador ─────────────────────────────────

  const rodadasComPalpite = history.filter((r) => r.palpitesJogador.length > 0)
  const rodadasComResultado = history.filter((r) => r.ptsJogador !== null)

  let cravadas = 0, saldos = 0, vencedores = 0, totalPts = 0
  let maxSeriaSemZero = 0, curSemZero = 0
  let maxSaltoPos = 0
  let rodadasTop3 = 0, rodadasUltimo = 0, rodadasPrimeiro = 0
  let rodadasSegundo = 0
  let maxConsecTop3 = 0, curConsecTop3 = 0
  let maxSeriaSemAcerto = 0, curSemAcerto = 0
  let empatesApostados = 0, totalApostados = 0
  let goleadasApostadas = 0, goleadasAcertadas = 0
  let faltouPalpitar = 0
  let acertos0x0 = 0
  let apostou0x0Count = 0
  let chutometroCount = 0

  for (let i = 0; i < history.length; i++) {
    const r = history[i]
    const rrJog = rrJogadorPorRodada.get(r.roundId)

    if (!rrJog) {
      faltouPalpitar++
      curSemZero = 0
      curConsecTop3 = 0
      curSemAcerto = 0
      continue
    }

    cravadas += rrJog.cravadas
    saldos += rrJog.saldos
    vencedores += rrJog.vencedores
    totalPts += rrJog.pts

    // Zeros
    if (rrJog.pts > 0) {
      curSemZero++
      if (curSemZero > maxSeriaSemZero) maxSeriaSemZero = curSemZero
    } else {
      curSemZero = 0
    }

    // Salto de posição vs rodada anterior
    if (i > 0) {
      const prevPos = history[i - 1].posicaoJogador
      const curPos = r.posicaoJogador
      if (prevPos >= 0 && curPos >= 0) {
        const salto = prevPos - curPos
        if (salto > maxSaltoPos) maxSaltoPos = salto
      }
    }

    // Posições
    const totalJogadoresRod = Object.keys(r.scores).length
    if (r.posicaoJogador === 0) rodadasPrimeiro++
    if (r.posicaoJogador === 1) rodadasSegundo++
    if (r.posicaoJogador >= 0 && r.posicaoJogador <= 2) {
      rodadasTop3++
      curConsecTop3++
      if (curConsecTop3 > maxConsecTop3) maxConsecTop3 = curConsecTop3
    } else {
      curConsecTop3 = 0
    }
    if (r.posicaoJogador === totalJogadoresRod - 1 && totalJogadoresRod > 1) rodadasUltimo++

    // Série sem acertar nada
    const acertouAlgo = rrJog.cravadas + rrJog.saldos + rrJog.vencedores > 0
    if (!acertouAlgo) {
      curSemAcerto++
      if (curSemAcerto > maxSeriaSemAcerto) maxSeriaSemAcerto = curSemAcerto
    } else {
      curSemAcerto = 0
    }

    // Palpites por rodada
    for (const p of r.palpitesJogador) {
      totalApostados++
      if (p.pred_h === p.pred_a) empatesApostados++
      if (p.pred_h === 0 && p.pred_a === 0) {
        apostou0x0Count++
        if (p.home_score === 0 && p.away_score === 0) acertos0x0++
      }
      if (p.pred_h === 2 && p.pred_a === 1) chutometroCount++
      if (p.pred_h + p.pred_a >= 5) {
        goleadasApostadas++
        if (p.pred_h === p.home_score && p.pred_a === p.away_score) goleadasAcertadas++
      }
    }
  }

  const rodadasJogadas = rodadasComResultado.length

  // ─── Comparações com o grupo ───────────────────────────────────────────

  const totalPorPart = new Map<string, number>()
  const rodadasPorPart = new Map<string, number>()
  for (const rr of rrRows ?? []) {
    totalPorPart.set(rr.participant_id, (totalPorPart.get(rr.participant_id) ?? 0) + (rr.round_pts ?? 0))
    rodadasPorPart.set(rr.participant_id, (rodadasPorPart.get(rr.participant_id) ?? 0) + 1)
  }
  const mediaPorPart = new Map<string, number>()
  for (const p of participants) {
    const rods = rodadasPorPart.get(p.id) ?? 0
    mediaPorPart.set(p.id, rods > 0 ? (totalPorPart.get(p.id) ?? 0) / rods : 0)
  }
  const melhorMediaId = [...mediaPorPart.entries()].reduce((best, cur) => (cur[1] > (mediaPorPart.get(best) ?? -1) ? cur[0] : best), participants[0].id)

  const rodadasPrimeiroPorPart = new Map<string, number>()
  for (const r of history) {
    const ordenados = Object.entries(r.scores).sort((a, b) => b[1] - a[1])
    if (ordenados[0]) {
      rodadasPrimeiroPorPart.set(ordenados[0][0], (rodadasPrimeiroPorPart.get(ordenados[0][0]) ?? 0) + 1)
    }
  }
  const maisPrimeiroId = [...rodadasPrimeiroPorPart.entries()].reduce((best, cur) => (cur[1] > (rodadasPrimeiroPorPart.get(best) ?? -1) ? cur[0] : best), participants[0].id)

  const empatesPorPart = new Map<string, number>()
  const totalPorPartPreds = new Map<string, number>()
  const { data: predsAll } = matchIds.length > 0 ? await supabase
    .from('predictions')
    .select('participant_id, pred_h, pred_a, match_id')
    .in('match_id', matchIds) : { data: [] as any[] }
  for (const pa of predsAll ?? []) {
    totalPorPartPreds.set(pa.participant_id, (totalPorPartPreds.get(pa.participant_id) ?? 0) + 1)
    if (pa.pred_h === pa.pred_a) {
      empatesPorPart.set(pa.participant_id, (empatesPorPart.get(pa.participant_id) ?? 0) + 1)
    }
  }
  const pctEmpatePorPart = new Map<string, number>()
  for (const p of participants) {
    const tot = totalPorPartPreds.get(p.id) ?? 0
    pctEmpatePorPart.set(p.id, tot > 0 ? (empatesPorPart.get(p.id) ?? 0) / tot : 0)
  }
  const maisEmpatesId = [...pctEmpatePorPart.entries()].reduce((best, cur) => (cur[1] > (pctEmpatePorPart.get(best) ?? -1) ? cur[0] : best), participants[0].id)

  // ─── Papagaio ──────────────────────────────────────────────────────────

  const palpitesPorMatch = new Map<string, Map<string, { h: number; a: number }>>()
  for (const p of predsAll ?? []) {
    if (!palpitesPorMatch.has(p.match_id)) palpitesPorMatch.set(p.match_id, new Map())
    palpitesPorMatch.get(p.match_id)!.set(p.participant_id, { h: p.pred_h, a: p.pred_a })
  }

  let papagaioDesbloqueado = false
  for (const r of history) {
    if (r.palpitesJogador.length < 2) continue
    const ordenados = Object.entries(r.scores).sort((a, b) => b[1] - a[1])
    const lider = ordenados[0]
    if (!lider || lider[0] === participantId) continue

    const todosIguais = r.palpitesJogador.every((meuPalp) => {
      const palpitesMatch = palpitesPorMatch.get(meuPalp.matchId)
      if (!palpitesMatch) return false
      const palpiteLider = palpitesMatch.get(lider[0])
      if (!palpiteLider) return false
      return palpiteLider.h === meuPalp.pred_h && palpiteLider.a === meuPalp.pred_a
    })
    if (todosIguais) {
      papagaioDesbloqueado = true
      break
    }
  }

  function exatosNaRodada(r: Rodada): number {
    let cnt = 0
    for (const p of r.palpitesJogador) {
      if (p.pred_h === p.home_score && p.pred_a === p.away_score) cnt++
    }
    return cnt
  }

  // ─── TIER 1 — 16 troféus ───────────────────────────────────────────────

  const tier1: TrofeuReal[] = [
    {
      id: 't1-veterano',
      icon: '💪',
      tier: 1,
      label: 'Veterano',
      desc: 'Participou de 5+ rodadas.',
      unlocked: rodadasJogadas >= 5,
    },
    {
      id: 't1-olho-de-aguia',
      icon: '🎯',
      tier: 1,
      label: 'Olho de Águia',
      desc: 'Acertou 3+ placares exatos na competição.',
      unlocked: cravadas >= 3,
    },
    {
      id: 't1-muralha',
      icon: '🧱',
      tier: 1,
      label: 'O Muralha',
      desc: '3 rodadas seguidas sem zerar.',
      unlocked: maxSeriaSemZero >= 3,
    },
    {
      id: 't1-virada',
      icon: '📈',
      tier: 1,
      label: 'Virada de Mesa',
      desc: 'Subiu 3+ posições no ranking em uma rodada.',
      unlocked: maxSaltoPos >= 3,
    },
    {
      id: 't1-resistente',
      icon: '🏁',
      tier: 1,
      label: 'Resistente',
      desc: 'Palpitou em todas as rodadas sem faltar nenhuma (mín. 5).',
      unlocked: history.length >= 5 && history.every((r) => rrJogadorPorRodada.has(r.roundId)),
    },
    {
      id: 't1-pacifista',
      icon: '🏳️',
      tier: 1,
      label: 'O Pacifista',
      desc: 'Apostou empate em mais da metade dos jogos de uma rodada.',
      unlocked: history.some((r) => {
        const pals = r.palpitesJogador
        if (pals.length < 2) return false
        return pals.filter((p) => p.pred_h === p.pred_a).length / pals.length > 0.5
      }),
    },
    {
      id: 't1-zero-a-zero',
      icon: '⚰️',
      tier: 1,
      label: 'Zero a Zero',
      desc: 'Apostou 0x0 em 3+ jogos ao longo da competição.',
      unlocked: apostou0x0Count >= 3,
    },
    {
      id: 't1-galinha',
      icon: '🐔',
      tier: 1,
      label: 'Galinha',
      desc: 'Nunca apostou mais de 2 gols totais em nenhum jogo (mín. 3 rodadas).',
      unlocked: rodadasJogadas >= 3 && rodadasComPalpite.every((r) => r.palpitesJogador.every((p) => p.pred_h + p.pred_a <= 2)),
    },
    {
      id: 't1-dormiu',
      icon: '😴',
      tier: 1,
      label: 'Dormiu no Ponto',
      desc: 'Perdeu o prazo de palpite em 3+ rodadas.',
      unlocked: faltouPalpitar >= 3,
    },
    {
      id: 't1-monolito',
      icon: '🗿',
      tier: 1,
      label: 'O Monólito',
      desc: 'Apostou o mesmo placar em todos os jogos de uma rodada.',
      unlocked: history.some((r) => {
        const pals = r.palpitesJogador
        if (pals.length < 2) return false
        const primeiro = pals[0]
        return pals.every((p) => p.pred_h === primeiro.pred_h && p.pred_a === primeiro.pred_a)
      }),
    },
    {
      id: 't1-contador',
      icon: '🧮',
      tier: 1,
      label: 'O Contador',
      desc: 'Acertou o saldo de gols em 5+ jogos (sem cravar).',
      unlocked: saldos >= 5,
    },
    {
      id: 't1-chutometro',
      icon: '🎰',
      tier: 1,
      label: 'Chutômetro',
      desc: 'Apostou 2x1 em 50+ jogos da competição.',
      unlocked: chutometroCount >= 50,
    },
    {
      id: 't1-vice',
      icon: '📉',
      tier: 1,
      label: 'O Eterno Vice',
      desc: 'Ficou 3+ rodadas em 2º sem nunca ter chegado ao 1º.',
      unlocked: rodadasSegundo >= 3 && rodadasPrimeiro === 0,
    },
    {
      id: 't1-otimista',
      icon: '💀',
      tier: 1,
      label: 'O Otimista Trágico',
      desc: 'Apostou goleada (5+ gols) 3x e nunca acertou.',
      unlocked: goleadasApostadas >= 3 && goleadasAcertadas === 0,
    },
    {
      id: 't1-seca',
      icon: '🌧️',
      tier: 1,
      label: 'Maior Seca',
      desc: 'Ficou 3+ rodadas seguidas sem acertar nem um resultado.',
      unlocked: maxSeriaSemAcerto >= 3,
    },
    {
      id: 't1-sorte',
      icon: '🎲',
      tier: 1,
      label: 'Na Sorte',
      desc: 'Acertou um placar tendo palpitado em apenas 1 jogo da rodada.',
      unlocked: history.some((r) => r.palpitesJogador.length === 1 && exatosNaRodada(r) === 1),
    },
  ]

  // ─── TIER 2 — 13 troféus ───────────────────────────────────────────────

  const tier2: TrofeuReal[] = [
    {
      id: 't2-em-chamas',
      icon: '🔥',
      tier: 2,
      label: 'Em Chamas',
      desc: '4+ rodadas no top 3.',
      unlocked: rodadasTop3 >= 4,
    },
    {
      id: 't2-hat-trick',
      icon: '🌪️',
      tier: 2,
      label: 'Hat-trick',
      desc: '3 placares exatos na mesma rodada.',
      unlocked: history.some((r) => exatosNaRodada(r) >= 3),
    },
    {
      id: 't2-analista',
      icon: '🧠',
      tier: 2,
      label: 'O Analista',
      desc: 'Maior média de pontos por rodada entre todos (mín. 3 rodadas).',
      unlocked: rodadasJogadas >= 3 && participantId === melhorMediaId,
    },
    {
      id: 't2-consistente',
      icon: '📊',
      tier: 2,
      label: 'O Consistente',
      desc: 'Nunca ficou abaixo da média do grupo em nenhuma rodada (mín. 3).',
      unlocked: (() => {
        if (rodadasComResultado.length < 3) return false
        return rodadasComResultado.every((r) => {
          const pts = r.scores[participantId] ?? 0
          const vals = Object.values(r.scores)
          if (vals.length < 2) return true
          const media = vals.reduce((s, v) => s + v, 0) / vals.length
          return pts >= media
        })
      })(),
    },
    {
      id: 't2-sangue-frio',
      icon: '🧊',
      tier: 2,
      label: 'Sangue Frio',
      desc: 'Acertou placar exato em rodada dupla (⚡).',
      unlocked: history.some((r) => r.is_double && exatosNaRodada(r) >= 1),
    },
    {
      id: 't2-papagaio',
      icon: '🦜',
      tier: 2,
      label: 'O Papagaio',
      desc: 'Apostou igual ao líder em todos os jogos de uma rodada.',
      unlocked: papagaioDesbloqueado,
    },
    {
      id: 't2-tartaruga',
      icon: '🐢',
      tier: 2,
      label: 'Tartaruga',
      desc: 'Ficou 2+ rodadas consecutivas em último e conseguiu sair.',
      unlocked: (() => {
        if (history.length < 3) return false
        let consec = 0
        for (let i = 0; i < history.length; i++) {
          const r = history[i]
          const totalJog = Object.keys(r.scores).length
          if (r.posicaoJogador === totalJog - 1 && totalJog > 1) {
            consec++
          } else {
            if (consec >= 2) return true
            consec = 0
          }
        }
        return false
      })(),
    },
    {
      id: 't2-diplomata',
      icon: '🤝',
      tier: 2,
      label: 'Diplomata',
      desc: 'Apostou mais empates (%) que qualquer outro (mín. 3 rodadas).',
      unlocked: rodadasJogadas >= 3 && participantId === maisEmpatesId,
    },
    {
      id: 't2-showman',
      icon: '🎪',
      tier: 2,
      label: 'O Showman',
      desc: 'Acertou um placar com 5+ gols no total.',
      unlocked: history.some((r) => r.palpitesJogador.some((p) => p.pred_h === p.home_score && p.pred_a === p.away_score && (p.pred_h + p.pred_a) >= 5)),
    },
    {
      id: 't2-lanterninha',
      icon: '💩',
      tier: 2,
      label: 'Lanterninha Raiz',
      desc: 'Ficou 3+ rodadas em último lugar.',
      unlocked: rodadasUltimo >= 3,
    },
    {
      id: 't2-fenix',
      icon: '🔄',
      tier: 2,
      label: 'Fênix',
      desc: 'Saiu do último lugar para o top 3 em uma única rodada.',
      unlocked: (() => {
        for (let i = 1; i < history.length; i++) {
          const prev = history[i - 1]
          const cur = history[i]
          const totalJogPrev = Object.keys(prev.scores).length
          if (prev.posicaoJogador === totalJogPrev - 1 && totalJogPrev > 1 && cur.posicaoJogador >= 0 && cur.posicaoJogador <= 2) {
            return true
          }
        }
        return false
      })(),
    },
    {
      id: 't2-magico',
      icon: '🎩',
      tier: 2,
      label: 'O Mágico',
      desc: 'Acertou 4+ placares exatos em uma única rodada.',
      unlocked: history.some((r) => exatosNaRodada(r) >= 4),
    },
    {
      id: 't2-colado-media',
      icon: '📌',
      tier: 2,
      label: 'Colado na Média',
      desc: 'Terminou uma rodada com exatamente a mesma pontuação que outro participante.',
      unlocked: history.some((r) => {
        const pts = r.scores[participantId]
        if (pts === undefined) return false
        return Object.entries(r.scores).some(([pid, v]) => pid !== participantId && v === pts)
      }),
    },
  ]

  // ─── TIER 3 — 9 troféus ────────────────────────────────────────────────

  const tier3: TrofeuReal[] = [
    {
      id: 't3-perfeicao',
      icon: '💎',
      tier: 3,
      label: 'Perfeição',
      desc: 'Acertou TODOS os placares de uma rodada (mín. 2 jogos).',
      unlocked: history.some((r) => {
        const jogosComResultado = r.palpitesJogador.filter((p) => p.home_score !== null)
        if (jogosComResultado.length < 2) return false
        return jogosComResultado.every((p) => p.pred_h === p.home_score && p.pred_a === p.away_score)
      }),
    },
    {
      id: 't3-lider-absoluto',
      icon: '🏆',
      tier: 3,
      label: 'Líder Absoluto',
      desc: 'Ficou mais rodadas em 1º lugar que qualquer outro (mín. 3 vezes).',
      unlocked: rodadasPrimeiro >= 3 && participantId === maisPrimeiroId,
    },
    {
      id: 't3-relampago',
      icon: '⚡',
      tier: 3,
      label: 'Relâmpago',
      desc: '7+ placares exatos ao longo de toda a competição.',
      unlocked: cravadas >= 7,
    },
    {
      id: 't3-predador',
      icon: '🦅',
      tier: 3,
      label: 'O Predador',
      desc: 'Top 3 em todas as rodadas em que palpitou (mín. 4 rodadas).',
      unlocked: rodadasComResultado.length >= 4 && rodadasComResultado.every((r) => r.posicaoJogador >= 0 && r.posicaoJogador <= 2),
    },
    {
      id: 't3-invicto',
      icon: '🎖️',
      tier: 3,
      label: 'Invicto',
      desc: 'Nunca ficou em último em nenhuma rodada (mín. 5 rodadas).',
      unlocked: rodadasComResultado.length >= 5 && rodadasComResultado.every((r) => {
        const totalJog = Object.keys(r.scores).length
        return !(r.posicaoJogador === totalJog - 1 && totalJog > 1)
      }),
    },
    {
      id: 't3-saldo-perfeito',
      icon: '🧿',
      tier: 3,
      label: 'Saldo Perfeito',
      desc: 'Acertou o saldo de gols em 10+ jogos na competição.',
      unlocked: saldos >= 10,
    },
    {
      id: 't3-vidente',
      icon: '🔮',
      tier: 3,
      label: 'Vidente',
      desc: 'Acertou o placar exato de 2+ jogos em rodadas duplas (⚡).',
      unlocked: (() => {
        let cnt = 0
        for (const r of history) {
          if (!r.is_double) continue
          cnt += exatosNaRodada(r)
        }
        return cnt >= 2
      })(),
    },
    {
      id: 't3-implacavel',
      icon: '🧲',
      tier: 3,
      label: 'Implacável',
      desc: '5+ rodadas consecutivas no top 3.',
      unlocked: maxConsecTop3 >= 5,
    },
    {
      id: 't3-franco-atirador',
      icon: '🎯',
      tier: 3,
      label: 'Franco Atirador',
      desc: '12+ placares exatos ao longo de toda a competição.',
      unlocked: cravadas >= 12,
    },
  ]

  // ─── TIER 4 — 1 troféu ─────────────────────────────────────────────────

  const tier4: TrofeuReal[] = [
    {
      id: 't4-campeao',
      icon: '👑',
      tier: 4,
      label: 'CAMPEÃO!',
      desc: 'O maior pontuador de toda a competição. Eterno.',
      unlocked: jaFoiCampeaoDeVerdade, // SÓ LIBERA SE O CAMPEONATO FOR OFICIALMENTE ENCERRADO NO ADMIN!
    },
  ]

  const trofeus = [...tier1, ...tier2, ...tier3, ...tier4]
  const totalConquistados = trofeus.filter((t) => t.unlocked).length

  return {
    participantId,
    nome: jogador.name,
    trofeus,
    totalConquistados,
    totalGeral: trofeus.length,
  }
}
