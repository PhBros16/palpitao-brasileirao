import { supabase } from './supabase'

// Camada de dados da aba Evolução (Ranking).
//
// Busca round_results + rounds finalizadas em ordem cronológica e devolve
// séries acumuladas por participante — pronto pra desenhar linha SVG.
//
// Regras:
//   - Só rodadas com finalized=true
//   - Só participantes com is_admin=false
//   - Rodadas 1-38 aparecem como "R1"..."R38"
//   - Rodadas 100+ aparecem como "E1", "E2"... (extras, em ordem de criação)

export interface EvolucaoSerie {
  participantId: string
  nome: string
  posicaoFinal: number      // ranking na última rodada (1 = líder)
  ehVoce: boolean           // preenchido pelo componente, não pela lib
  acumulado: number[]       // pontos acumulados ao fim de cada rodada
}

export interface DadosEvolucao {
  labelsRodadas: string[]   // ex: ["R1", "R2", ..., "R18", "E1", "E2"]
  series: EvolucaoSerie[]   // uma série por participante
  totalRodadas: number
}

/** Busca dados completos pra montar o gráfico de evolução. */
export async function buscarEvolucao(): Promise<DadosEvolucao> {
  const [
    { data: participants },
    { data: rounds },
  ] = await Promise.all([
    supabase.from('participants').select('id, name').eq('is_admin', false).order('name'),
    supabase.from('rounds').select('id, number').eq('finalized', true).order('number', { ascending: true }),
  ])

  if (!participants || !rounds || rounds.length === 0) {
    return { labelsRodadas: [], series: [], totalRodadas: 0 }
  }

  // Monta labels: R1..R38 pras normais; E1, E2... pras extras (na ordem
  // cronológica de criação — que é a ordem em que aparecem no `rounds`
  // filtrado por number asc).
  const rodadasExtras = rounds.filter((r) => r.number >= 100)
  const mapaExtra = new Map(rodadasExtras.map((r, i) => [r.id, `E${i + 1}`]))
  const labelsRodadas = rounds.map((r) => mapaExtra.get(r.id) ?? `R${r.number}`)

  const roundIds = rounds.map((r) => r.id)

  // Busca round_results de todas as rodadas
  const { data: rrRows } = await supabase
    .from('round_results')
    .select('participant_id, round_id, round_pts')
    .in('round_id', roundIds)

  // Mapa: (participantId, roundId) → round_pts
  const rrMap = new Map<string, number>()
  for (const rr of rrRows ?? []) {
    rrMap.set(`${rr.participant_id}|${rr.round_id}`, rr.round_pts ?? 0)
  }

  // Monta séries acumuladas
  const seriesRaw = participants.map((p) => {
    let acum = 0
    const acumulado = rounds.map((r) => {
      const pts = rrMap.get(`${p.id}|${r.id}`) ?? 0
      acum += pts
      return acum
    })
    return { participantId: p.id, nome: p.name, acumulado }
  })

  // Ranking final = ordem pela última posição do acumulado (desc)
  const ordenadoPorFinal = [...seriesRaw]
    .map((s) => ({ ...s, totalFinal: s.acumulado[s.acumulado.length - 1] ?? 0 }))
    .sort((a, b) => b.totalFinal - a.totalFinal)

  const posicaoMap = new Map<string, number>()
  ordenadoPorFinal.forEach((s, i) => posicaoMap.set(s.participantId, i + 1))

  const series: EvolucaoSerie[] = seriesRaw.map((s) => ({
    participantId: s.participantId,
    nome: s.nome,
    posicaoFinal: posicaoMap.get(s.participantId) ?? 999,
    ehVoce: false,
    acumulado: s.acumulado,
  }))

  return { labelsRodadas, series, totalRodadas: rounds.length }
}
