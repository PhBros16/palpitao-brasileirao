// coreografia.ts — funções puras de timing/transform da cascata de entrada
// (jogadores saindo em fila única da lateral esquerda + refletores acendendo
// por zona/tier). Sem dependência de React — só cálculo, consumido pelo
// AberturaScreen e repassado como estilo já pronto pros chips/zonas.
//
// tier: 0=goleiro, 1=defesa, 2=meio, 3=ataque, 4=banco — define a ordem em
// que cada linha entra em fila e em que ordem os refletores da respectiva
// zona acendem.

export const DUR_FLIP = 1200
export const EASE_LUZ = 'cubic-bezier(0.62,0,0.38,1)'
export const LUZ_TIER_STAGGER = 180
export const LUZ_DUR = 650

export const DUR_CORRIDA = 1200
export const EASE_CORRIDA = 'cubic-bezier(0.16,1,0.3,1)'
export const INTERVALO_FILA = 140
/** Ponto de entrada compartilhado: fora da tela à esquerda, altura do meio-campo. */
export const ORIGEM_X = -20
export const ORIGEM_Y = 366
/** Quanto a fila avança reto (px) antes de cada um dobrar pra sua posição final. */
export const AVANCO_FILA = 90
/** Corrida do banco é mais curta que a do campo. */
export const ENCOLHER_BANCO = 0.4

/** Titulares: 1 goleiro + 4 defesa + 3 meio + 3 ataque. Banco: 3 reservas + 1 ADM. */
export const CONTAGEM_TIERS = [1, 4, 3, 3, 4]

/** Momento em que o primeiro jogador de cada tier pode sair da fila: não antes
 *  do próprio refletor da zona acender, nem antes do último da fila anterior
 *  (+ um intervalo) — assim a fila lê como uma só, sem sobreposição entre tiers. */
export function calcularInicioTiers(contagemTiers: number[]): number[] {
  const inicios: number[] = []
  let fimAnterior = -Infinity
  for (let t = 0; t < contagemTiers.length; t++) {
    const luzPronta = t * LUZ_TIER_STAGGER + LUZ_DUR
    const podeSeguir = t === 0 ? 0 : fimAnterior + INTERVALO_FILA
    const inicio = Math.max(podeSeguir, luzPronta)
    inicios.push(inicio)
    fimAnterior = inicio + (contagemTiers[t] - 1) * INTERVALO_FILA
  }
  return inicios
}

export interface EstiloEntrada {
  /** Custom properties --t0/--t1/--t2 (transform de cada estágio do keyframe). */
  t0: string
  t1: string
  t2: string
  opacity: number
  /** Fallback estático pré-revelação (igual ao 0% do keyframe — sem salto ao ligar a animação). */
  transformEstatico: string
  animar: boolean
  animationDelay: string
  /** Delay do idle (chipIdle) — só começa quando a corrida individual termina. */
  idleDelay: string
  nomeOpacity: number
  nomeTransitionDelay: string
}

/**
 * finalXpx/finalYpx: posição final em px de cena (390×844).
 * centrado: chips do campo precisam do translate(-50%,-50%) (posicionados por
 *   left/top %); chips do banco são itens de flex comuns (sem centralização extra).
 * encolher: <1 encurta o vetor de corrida inteiro (banco).
 * atrasoFila: momento em que ESTE jogador sai da fila (delay individual).
 */
export function estiloEntrada(
  finalXpx: number,
  finalYpx: number,
  centrado: boolean,
  encolher: number,
  atrasoFila: number,
  revelado: boolean,
): EstiloEntrada {
  const base = centrado ? 'translate(-50%,-50%) ' : ''

  const dx0 = Math.round((ORIGEM_X - finalXpx) * encolher)
  const dy0 = Math.round((ORIGEM_Y - finalYpx) * encolher)
  const filaX = ORIGEM_X + AVANCO_FILA
  const filaY = ORIGEM_Y
  const dx1 = Math.round((filaX - finalXpx) * encolher)
  const dy1 = Math.round((filaY - finalYpx) * encolher)

  const t0 = `${base}translate(${dx0}px,${dy0}px)`
  const t1 = `${base}translate(${dx1}px,${dy1}px)`
  const t2 = `${base}translate(0px,0px)`

  return {
    t0,
    t1,
    t2,
    opacity: revelado ? 1 : 0,
    transformEstatico: revelado ? t2 : t0,
    animar: revelado,
    animationDelay: `${atrasoFila}ms`,
    idleDelay: `${atrasoFila + DUR_CORRIDA}ms`,
    nomeOpacity: revelado ? 1 : 0,
    // Nome aparece ~120ms depois do próprio chip já visível (18% do seu keyframe).
    nomeTransitionDelay: `${Math.round(atrasoFila + DUR_CORRIDA * 0.18 + 120)}ms`,
  }
}

export interface EstiloZonaLuz {
  escuroOpacity: number
  escuroTransition: string
  brilhoOpacity: number
  brilhoScale: string
  brilhoTransition: string
}

/** Zona de refletor: começa escura/fria e vira brilho quente no mesmo delay
 *  do tier — luz e corrida do respectivo grupo começam juntas. */
export function estiloZonaLuz(tier: number, revelado: boolean): EstiloZonaLuz {
  const atraso = `${tier * LUZ_TIER_STAGGER}ms`
  const transition = `opacity ${LUZ_DUR}ms ${EASE_LUZ} ${atraso}`
  return {
    escuroOpacity: revelado ? 0 : 1,
    escuroTransition: transition,
    brilhoOpacity: revelado ? 1 : 0,
    brilhoScale: revelado ? 'scale(1)' : 'scale(0.55)',
    brilhoTransition: `opacity ${LUZ_DUR}ms ${EASE_LUZ} ${atraso}, transform ${LUZ_DUR}ms ${EASE_LUZ} ${atraso}`,
  }
}
