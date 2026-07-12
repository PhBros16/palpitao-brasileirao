/**
 * Fase da nuvem de poeira pós-flip (entre o livro assentar e a cascata de
 * luzes começar): oculta -> assentada (paira visível) -> soprando (sopro leva
 * embora). Ver AberturaScreen.
 */
export type FasePoeira = 'oculta' | 'assentada' | 'soprando'

export interface JogadorCampo {
  id: string
  iniciais: string
  nome: string
  numero: string
  /** Posição final em % do retângulo do campo (left/top). */
  left: string
  top: string
  /** 0=goleiro, 1=defesa, 2=meio, 3=ataque — define a ordem de entrada/luz. */
  tier: 0 | 1 | 2 | 3
  /** Posição final em px de cena (390×844), usada pro vetor de corrida. */
  xpx: number
  ypx: number
}

export interface JogadorBanco {
  id: string
  iniciais: string
  nome: string
  numero: string
  xpx: number
  ypx: number
}
