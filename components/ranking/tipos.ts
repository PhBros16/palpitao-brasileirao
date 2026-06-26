// Tipos da tela Ranking. Dados por prop (mock na página).

export interface ClassificacaoLinha {
  nome: string
  pontos: number
  cravadas: number
  vencedor: number
  saldo: number
  /** Projeção de campeão em %. */
  projecao: number
}

export interface EvolucaoSerie {
  nome: string
  /** Pts acumulados ao fim de cada rodada (índice = rodada-1). */
  acumulado: number[]
  ehVoce: boolean
  /** Posição final (1-based) — usada pelos filtros Top 3/Top 5. */
  posicao: number
}

export interface SequenciaItem {
  label: string
  valor: string
}

export interface MinhasEstatisticas {
  /** Pts por rodada (para o heatmap). */
  ptsPorRodada: number[]
  cravadas: number
  vencedor: number
  saldo: number
  mediaPts: number
  sequencias: SequenciaItem[]
}

/** Tier do troféu (TROFEUS.md): 1 bronze · 2 prata · 3 e 4 ouro. */
export type TierTrofeu = 1 | 2 | 3 | 4

export interface TrofeuItem {
  id: string
  nome: string
  tier: TierTrofeu
}

export interface DadosRanking {
  classificacao: ClassificacaoLinha[]
  evolucao: EvolucaoSerie[]
  totalRodadas: number
  estatisticas: MinhasEstatisticas
  trofeus: TrofeuItem[]
  totalTrofeus: number
}
