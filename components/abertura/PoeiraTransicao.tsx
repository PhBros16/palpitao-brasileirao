'use client'

import { useMemo } from 'react'
import styles from './abertura.module.css'
import type { FasePoeira } from './tipos'

// PoeiraTransicao — nuvem de poeira densa entre o flip assentar e a cascata
// de luzes começar: oculta -> assentada (paira, visível) -> soprando (sopro
// leva embora, com rajadas de vento literais). Hash determinístico (não
// Math.random) pra o scatter ficar idêntico em toda renderização.
//
// Duas camadas: clusters orgânicos (concentração visual) + grade uniforme
// (garante que nenhuma região da tela fique sem poeira).

const DUST_SETTLE_HOLD = 900
const DUST_BLOW_DUR = 900

const CORES = ['#ffffff', 'var(--papel-100)', 'var(--dourado-50)', '#ffe9b0', 'var(--papel-borda-100)']

function hash(n: number): number {
  const x = Math.sin(n * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

interface Mote {
  left: string
  top: string
  size: string
  color: string
  atraso: number
}

function construirMote(i: number, left: number, top: number): Mote {
  const leftC = Math.min(98, Math.max(1, left))
  const topC = Math.min(92, Math.max(2, top))
  const sizeRoll = hash(i * 9.7 + 1.3)
  const size = sizeRoll > 0.85 ? 3.2 + sizeRoll * 2.8 : 1 + sizeRoll * 2.2
  const dx = (hash(i * 8.3 + 4.1) - 0.5) * 90
  const atraso = Math.round(hash(i * 4.4 + 5.5) * 260)
  const color = CORES[Math.floor(hash(i * 2.17 + 7.3) * CORES.length) % CORES.length]
  return { left: `${leftC.toFixed(1)}%`, top: `${topC.toFixed(1)}%`, size: `${size.toFixed(1)}px`, color, atraso }
}

const CLUSTERS = [
  { left: 14, top: 14, spread: 11, n: 18 },
  { left: 34, top: 8, spread: 8, n: 13 },
  { left: 30, top: 30, spread: 15, n: 20 },
  { left: 55, top: 10, spread: 10, n: 15 },
  { left: 66, top: 30, spread: 13, n: 17 },
  { left: 82, top: 12, spread: 9, n: 12 },
  { left: 46, top: 46, spread: 17, n: 22 },
  { left: 20, top: 52, spread: 10, n: 14 },
  { left: 74, top: 52, spread: 12, n: 16 },
  { left: 8, top: 38, spread: 7, n: 10 },
  { left: 90, top: 40, spread: 8, n: 11 },
  { left: 60, top: 60, spread: 9, n: 12 },
  { left: 40, top: 72, spread: 12, n: 16 },
  { left: 70, top: 76, spread: 10, n: 13 },
  { left: 16, top: 76, spread: 9, n: 12 },
  { left: 92, top: 70, spread: 7, n: 9 },
  { left: 50, top: 4, spread: 6, n: 9 },
] as const

const GRID_COLS = 11
const GRID_ROWS = 9

function construirPoeira(): Mote[] {
  const motes: Mote[] = []
  let gi = 0
  CLUSTERS.forEach((c, ci) => {
    for (let k = 0; k < c.n; k++) {
      const i = gi++
      const ang = hash(i * 3.71 + ci) * Math.PI * 2
      const rad = hash(i * 5.13 + ci * 2.2) * c.spread
      const left = c.left + Math.cos(ang) * rad
      const top = c.top + Math.sin(ang) * rad * 0.7
      motes.push(construirMote(i, left, top))
    }
  })
  for (let r = 0; r < GRID_ROWS; r++) {
    for (let c = 0; c < GRID_COLS; c++) {
      const i = 1000 + r * GRID_COLS + c
      const cellLeft = (c + 0.5) * (100 / GRID_COLS)
      const cellTop = (r + 0.5) * (90 / GRID_ROWS) + 3
      const jx = (hash(i * 3.3 + 0.7) - 0.5) * (100 / GRID_COLS) * 0.9
      const jy = (hash(i * 4.9 + 1.9) - 0.5) * (90 / GRID_ROWS) * 0.9
      motes.push(construirMote(i, cellLeft + jx, cellTop + jy))
    }
  }
  return motes
}

interface Rajada {
  left: string
  top: string
  height: string
  wdx: string
  atraso: number
}

function construirRajadas(): Rajada[] {
  const n = 10
  const rajadas: Rajada[] = []
  for (let i = 0; i < n; i++) {
    const left = ((i * 31 + 6) % 92) + 3
    const top = ((i * 41 + 50) % 60) + 10
    const height = 46 + (i % 4) * 14
    const wdx = (((i * 11) % 7) - 3) * 6
    const atraso = (i % 5) * 40
    rajadas.push({ left: `${left}%`, top: `${top}%`, height: `${height}px`, wdx: `${wdx}px`, atraso })
  }
  return rajadas
}

export { DUST_SETTLE_HOLD, DUST_BLOW_DUR }

export function PoeiraTransicao({ fase }: { fase: FasePoeira }) {
  const motes = useMemo(construirPoeira, [])
  const rajadas = useMemo(construirRajadas, [])

  return (
    <div className="pointer-events-none absolute inset-0" style={{ zIndex: 10 }}>
      {fase === 'soprando' &&
        rajadas.map((r, i) => (
          <div
            key={i}
            className={styles.windGust}
            style={{
              position: 'absolute',
              left: r.left,
              top: r.top,
              width: 2,
              height: r.height,
              ['--wdx' as string]: r.wdx,
              opacity: 0,
              background: 'linear-gradient(180deg, rgba(255,255,255,0) 0%, rgba(255,255,255,0.55) 45%, rgba(255,255,255,0) 100%)',
              animationDuration: `${DUST_BLOW_DUR}ms`,
              animationDelay: `${r.atraso}ms`,
            }}
          />
        ))}
      {motes.map((m, i) => {
        const opacity = fase === 'assentada' ? 0.12 + hash(i * 6.47 + 2.9) * 0.68 : 0
        const transform =
          fase === 'soprando'
            ? `translate(${((hash(i * 8.3 + 4.1) - 0.5) * 90).toFixed(0)}px,-${(150 + hash(i) * 70).toFixed(0)}px)`
            : 'translate(0,0)'
        const transition =
          fase === 'assentada'
            ? `opacity 550ms ease-out ${m.atraso}ms`
            : fase === 'soprando'
              ? `transform ${DUST_BLOW_DUR}ms cubic-bezier(0.33,0,0.2,1) ${m.atraso}ms, opacity ${DUST_BLOW_DUR}ms ease-in ${m.atraso}ms`
              : 'none'
        return (
          <div
            key={i}
            style={{
              position: 'absolute',
              left: m.left,
              top: m.top,
              width: m.size,
              height: m.size,
              borderRadius: '50%',
              background: m.color,
              opacity,
              transform,
              transition,
            }}
          />
        )
      })}
    </div>
  )
}
