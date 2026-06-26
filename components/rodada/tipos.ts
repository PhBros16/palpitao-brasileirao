// Tipos da Tabela da Rodada. Dados por prop (mock na página).

export interface JogoCol {
  id: string
  home: string
  away: string
}

export interface CelulaPalpite {
  /** Palpite do participante neste jogo, ou null se não palpitou. */
  palpite: { h: number; a: number } | null
  /** Pontos do palpite (5 cravada · 3 saldo · 1 vencedor · 0 erro), null se sem palpite. */
  pts: number | null
}

export interface LinhaParticipante {
  id: string
  nome: string
  ehVoce: boolean
  /** Hora do palpite (HH:MM) ou null. */
  hora: string | null
  totalRodada: number
  /** Por id de jogo. */
  celulas: Record<string, CelulaPalpite>
}

export interface DadosRodada {
  rodadaNome: string
  rodadaNumero: number
  jogos: JogoCol[]
  linhas: LinhaParticipante[]
}
