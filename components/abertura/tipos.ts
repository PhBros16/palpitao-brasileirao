export type Beat = 'capa' | 'abrindo' | 'refletores' | 'revelado'

export interface JogadorBase {
  nome: string
  iniciais: string
  cor: string
}

export interface JogadorCampo extends JogadorBase {
  /** Posição em % dentro do retângulo do campo (não da tela). */
  x: number
  y: number
  /** Marca o jogador do usuário logado — recebe destaque dourado no chip. */
  voce?: boolean
}
