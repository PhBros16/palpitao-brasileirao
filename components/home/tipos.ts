// Tipos da tela Home (mock-friendly). Todos os dados chegam por prop — nada
// hardcoded nos componentes (CLAUDE.md Regra 2). Integração com Supabase depois.

export interface Faixa {
  titulo: string
  artista: string
}

export interface ParcialLinha {
  nome: string
  ptsRodada: number
  total: number
  /** Se já palpitou na rodada (senão marca "NP" — não palpitou). */
  palpitou: boolean
}

export interface PlacarContagem {
  /** Ex.: "2x1". */
  placar: string
  /** Quantos palpitaram esse placar. */
  n: number
}

export interface Distribuicao {
  /** % que apostou vitória da casa / empate / fora. Somam ~100. */
  casa: number
  empate: number
  fora: number
}

export interface JogoResumo {
  id: string
  home: string
  away: string
  placares: PlacarContagem[]
  distrib: Distribuicao
}

export interface PodioLinha {
  nome: string
  pts: number
}

export interface FrangoRodada {
  nome: string
  fotoUrl?: string
  texto: string
}

export interface HomeData {
  rodadaNome: string
  rodadaNumero: number

  // Card destaque
  naRodada: number
  hoje: number
  /** Posição atual (1-based). */
  posicao: number
  /** Pts para subir uma posição (0 se líder). */
  ptsParaSubir: number
  jogosTotais: number
  jogosAbertos: number
  craveiQuantos: number
  /** Alvo (timestamp ms) do próximo jogo a fechar, ou null se nenhum aberto. */
  proximoFechaEm: number | null
  palpitePendente: boolean

  faixas: Faixa[]
  parcial: ParcialLinha[]
  finalizada: boolean
  frango: FrangoRodada | null
  jogos: JogoResumo[]
  podio: PodioLinha[]
}
