'use client'

import styles from './abertura.module.css'
import { ChipJogador } from './ChipJogador'
import { estiloZonaLuz } from './coreografia'
import type { EstiloEntrada } from './coreografia'
import type { JogadorCampo } from './tipos'

const LINHAS = {
  contorno: 2140,
  meio: 366,
  centro: 308,
  grandeArea: 410,
  pequenaArea: 164,
  arcoCentral: 60,
  escanteio: 20,
}

export function CenaEstadio({
  revelado,
  titulares,
  onEntrar,
  carregandoId,
}: {
  revelado: boolean
  titulares: Array<JogadorCampo & { entrada: EstiloEntrada }>
  onEntrar?: (jogador: JogadorCampo) => void
  carregandoId?: string | null
}) {
  const zAtaque = estiloZonaLuz(3, revelado)
  const zMeio = estiloZonaLuz(2, revelado)
  const zDefesa = estiloZonaLuz(1, revelado)
  const zGoleiro = estiloZonaLuz(0, revelado)

  // Mapa tier → zona de luz, usado pra sombra direcional de cada jogador
  // (item 2 do refinamento de campinho: chips "acendiam" mas não pareciam
  // receber luz de cima — sem sombra nenhuma vindo da direção do refletor).
  function zonaDoTier(tier: number) {
    if (tier >= 3) return zAtaque
    if (tier === 2) return zMeio
    if (tier === 1) return zDefesa
    return zGoleiro
  }

  const lineTransitionAtaque = 'stroke-dashoffset 900ms ease-out 540ms'
  const lineTransitionMeio = 'stroke-dashoffset 900ms ease-out 360ms'
  const lineTransitionGoleiro = 'stroke-dashoffset 900ms ease-out 0ms'
  const lineTransitionContorno = 'stroke-dashoffset 900ms ease-out 360ms'
  const dotTransitionAtaque = 'transform 500ms ease-out 1080ms'
  const dotTransitionMeio = 'transform 500ms ease-out 900ms'
  const dotTransitionGoleiro = 'transform 500ms ease-out 540ms'
  const dotScale = revelado ? 'scale(1)' : 'scale(0)'
  const offset = (total: number) => (revelado ? 0 : total)

  return (
    <div className="absolute inset-0" style={{ background: 'var(--campo-200)', zIndex: 0 }}>
      <div
        className={styles.grassDrift}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 0,
          background: 'repeating-linear-gradient(180deg, var(--campo-100) 0 104px, var(--campo-200) 104px 208px)',
        }}
      />
      {/* textura de grama — ruído bem sutil (3-5% opacidade) por cima das
          listras de corte, pra quebrar a uniformidade "papel de parede" que
          um degradê repetido puro tem visto de perto */}
      <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ zIndex: 0, mixBlendMode: 'overlay' }}>
        <filter id="textura-grama">
          <feTurbulence type="fractalNoise" baseFrequency="0.7" numOctaves={2} seed={3} stitchTiles="stitch" />
          <feColorMatrix type="matrix" values="0 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 0.05 0" />
        </filter>
        <rect width="100%" height="100%" filter="url(#textura-grama)" />
      </svg>

      <div
        className="pointer-events-none absolute inset-0"
        style={{ zIndex: 1, background: 'rgba(4,7,12,0.95)', opacity: revelado ? 0 : 1, transition: 'opacity 650ms ease-out' }}
      />

      <div className="absolute" style={{ left: 12, right: 12, top: 12, height: 708, zIndex: 3 }}>
        <svg width={366} height={708} viewBox="0 0 366 708" className="pointer-events-none absolute inset-0 overflow-visible" fill="none">
          <rect x={1} y={1} width={364} height={706} stroke="rgba(255,255,255,0.9)" strokeWidth={2.4} style={{ strokeDasharray: LINHAS.contorno, strokeDashoffset: offset(LINHAS.contorno), transition: lineTransitionContorno }} />
          <line x1={0} y1={354} x2={366} y2={354} stroke="rgba(255,255,255,0.9)" strokeWidth={2} style={{ strokeDasharray: LINHAS.meio, strokeDashoffset: offset(LINHAS.meio), transition: lineTransitionMeio }} />
          <circle cx={183} cy={354} r={49} stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.centro, strokeDashoffset: offset(LINHAS.centro), transition: lineTransitionMeio }} />
          <circle cx={183} cy={354} r={3} fill="rgba(255,255,255,0.68)" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: dotScale, transition: dotTransitionMeio }} />

          <path d="M76,0 L76,98 L290,98 L290,0" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.grandeArea, strokeDashoffset: offset(LINHAS.grandeArea), transition: lineTransitionAtaque }} />
          <path d="M134,0 L134,33 L232,33 L232,0" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.pequenaArea, strokeDashoffset: offset(LINHAS.pequenaArea), transition: lineTransitionAtaque }} />
          <circle cx={183} cy={65} r={3} fill="rgba(255,255,255,0.68)" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: dotScale, transition: dotTransitionAtaque }} />
          <path d="M157,96 Q183,118 209,96" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.arcoCentral, strokeDashoffset: offset(LINHAS.arcoCentral), transition: lineTransitionAtaque }} />

          <path d="M76,708 L76,610 L290,610 L290,708" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.grandeArea, strokeDashoffset: offset(LINHAS.grandeArea), transition: lineTransitionGoleiro }} />
          <path d="M134,708 L134,675 L232,675 L232,708" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.pequenaArea, strokeDashoffset: offset(LINHAS.pequenaArea), transition: lineTransitionGoleiro }} />
          <circle cx={183} cy={643} r={3} fill="rgba(255,255,255,0.68)" style={{ transformBox: 'fill-box', transformOrigin: 'center', transform: dotScale, transition: dotTransitionGoleiro }} />
          <path d="M157,612 Q183,590 209,612" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.arcoCentral, strokeDashoffset: offset(LINHAS.arcoCentral), transition: lineTransitionGoleiro }} />

          <path d="M1,13 A12,12 0 0 0 13,1" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.escanteio, strokeDashoffset: offset(LINHAS.escanteio), transition: lineTransitionAtaque }} />
          <path d="M353,1 A12,12 0 0 0 365,13" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.escanteio, strokeDashoffset: offset(LINHAS.escanteio), transition: lineTransitionAtaque }} />
          <path d="M13,707 A12,12 0 0 0 1,695" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.escanteio, strokeDashoffset: offset(LINHAS.escanteio), transition: lineTransitionGoleiro }} />
          <path d="M365,695 A12,12 0 0 0 353,707" stroke="rgba(255,255,255,0.68)" strokeWidth={1.5} style={{ strokeDasharray: LINHAS.escanteio, strokeDashoffset: offset(LINHAS.escanteio), transition: lineTransitionGoleiro }} />
        </svg>

        <div
          className="absolute left-1/2 -translate-x-1/2"
          style={{
            top: -8,
            width: 52,
            height: 10,
            border: '2px solid rgba(255,255,255,0.7)',
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.28) 0 1px, rgba(255,255,255,0) 1px 5px), repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 1px, rgba(255,255,255,0) 1px 5px), rgba(255,255,255,0.06)',
            opacity: zAtaque.brilhoOpacity,
            transition: zAtaque.brilhoTransition,
          }}
        />
        <div
          className="absolute bottom-0 left-1/2 -translate-x-1/2"
          style={{
            bottom: -8,
            width: 52,
            height: 10,
            border: '2px solid rgba(255,255,255,0.7)',
            background:
              'repeating-linear-gradient(0deg, rgba(255,255,255,0.28) 0 1px, rgba(255,255,255,0) 1px 5px), repeating-linear-gradient(90deg, rgba(255,255,255,0.28) 0 1px, rgba(255,255,255,0) 1px 5px), rgba(255,255,255,0.06)',
            opacity: zGoleiro.brilhoOpacity,
            transition: zGoleiro.brilhoTransition,
          }}
        />

        {DUST_AMBIENTE.map((d, i) => (
          <div
            key={i}
            className={styles.dustFloat}
            style={{
              position: 'absolute',
              left: d.left,
              top: d.top,
              width: d.size,
              height: d.size,
              borderRadius: '50%',
              background: 'var(--papel-200)',
              ['--dx' as string]: d.dx,
              ['--dy' as string]: d.dy,
              animationDuration: d.duracao,
              animationDelay: d.atraso,
              pointerEvents: 'none',
            }}
          />
        ))}

        <ZonaLuz top={0} altura={287} zona={zAtaque} />
        <ZonaLuz top={287} altura={159} zona={zMeio} />
        <ZonaLuz top={446} altura={120} zona={zDefesa} />
        <ZonaLuz top={566} altura={142} zona={zGoleiro} centroY={42} />

        {titulares.map((j) => {
          const zona = zonaDoTier(j.tier)
          return (
            <div
              key={j.id}
              style={{
                position: 'absolute',
                left: j.left,
                top: j.top,
                filter: `drop-shadow(0 10px 8px rgba(0,0,0,${(0.38 * zona.brilhoOpacity).toFixed(2)}))`,
                transition: zona.brilhoTransition,
              }}
            >
              <ChipJogador
                iniciais={j.iniciais}
                nome={j.nome}
                numero={j.numero}
                entrada={j.entrada}
                variante="titular"
                onClick={revelado ? () => onEntrar?.(j) : undefined}
                carregando={carregandoId === j.id}
                avatar={j.avatar}
              />
            </div>
          )
        })}
      </div>

      <div
        className={styles.vignettePulse}
        style={{
          position: 'absolute',
          inset: 0,
          zIndex: 5,
          pointerEvents: 'none',
          background: 'radial-gradient(135% 100% at 50% 50%, rgba(0,0,0,0) 58%, rgba(0,0,0,0.34) 100%)',
        }}
      />
    </div>
  )
}

function ZonaLuz({
  top,
  altura,
  zona,
  centroY = 50,
}: {
  top: number
  altura: number
  zona: ReturnType<typeof estiloZonaLuz>
  centroY?: number
}) {
  return (
    <>
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{ top, height: altura, background: 'rgba(4,7,12,0.95)', opacity: zona.escuroOpacity, transition: zona.escuroTransition }}
      />
      <div
        className="pointer-events-none absolute left-0 right-0"
        style={{
          top,
          height: altura,
          background: `radial-gradient(65% 85% at 50% ${centroY}%, color-mix(in srgb, var(--dourado-200) 60%, transparent) 0%, color-mix(in srgb, var(--dourado-400) 28%, transparent) 45%, transparent 78%)`,
          opacity: zona.brilhoOpacity,
          transform: zona.brilhoScale,
          transition: zona.brilhoTransition,
        }}
      />
    </>
  )
}

const DUST_AMBIENTE = [
  { left: '14%', top: '22%', size: '3px', dx: '14px', dy: '-22px', duracao: '19s', atraso: '0s' },
  { left: '62%', top: '12%', size: '2px', dx: '-10px', dy: '-26px', duracao: '23s', atraso: '3s' },
  { left: '80%', top: '38%', size: '3px', dx: '-16px', dy: '-18px', duracao: '21s', atraso: '7s' },
  { left: '30%', top: '55%', size: '2px', dx: '12px', dy: '-24px', duracao: '26s', atraso: '1.5s' },
  { left: '48%', top: '70%', size: '3px', dx: '-14px', dy: '-20px', duracao: '18s', atraso: '10s' },
  { left: '20%', top: '82%', size: '2px', dx: '18px', dy: '-16px', duracao: '24s', atraso: '5s' },
  { left: '70%', top: '64%', size: '2.5px', dx: '-10px', dy: '-24px', duracao: '20s', atraso: '13s' },
]
