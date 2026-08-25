'use client'

import { useEffect, useState } from 'react'
import { getEscudo } from '@/lib/escudos'

export interface Palpite {
  h: number | null
  a: number | null
}

export interface Jogo {
  id: string
  home: string
  away: string
  date: string
  time: string
  isLocked: boolean
}

export type JogoPalpite = Jogo

function getSigla(nome: string): string {
  if (!nome) return '?'
  const n = nome.trim()
  if (n.includes('Bragantino') || n.includes('Red Bull')) return 'RBB'
  if (n.includes('Athletico')) return 'CAP'
  if (n.includes('Atlético-MG') || n.includes('Atlético MG') || n.includes('Galo')) return 'CAM'
  if (n.includes('São Paulo') || n.includes('Sao Paulo')) return 'SAO'
  if (n.includes('Vitória') || n.includes('Vitoria')) return 'VIT'
  if (n.includes('Coritiba')) return 'CFC'
  if (n.includes('Internacional')) return 'INT'
  if (n.includes('Chapecoense')) return 'CHA'
  if (n.includes('Bahia')) return 'BAH'
  const palavras = n.split(' ').filter(Boolean)
  if (palavras.length >= 2) {
    return (palavras[0][0] + palavras[1][0] + (palavras[2]?.[0] ?? '')).toUpperCase().slice(0, 3)
  }
  return n.slice(0, 3).toUpperCase()
}

function normalizarNomeExibicao(nome: string): string {
  if (!nome) return ''
  const clean = nome.trim()
  if (clean === 'Red Bull Bragantino') return 'RB Bragantino'
  return clean
}

export function parseDataHoraSafe(dateStr: string | null | undefined, timeStr: string | null | undefined): Date | null {
  if (!dateStr || !dateStr.trim()) return null
  const cleanDate = dateStr.trim()
  let y = 0, m = 0, d = 0

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      if (parts[0].length === 4) {
        y = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10) - 1
        d = parseInt(parts[2], 10)
      } else {
        d = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10) - 1
        y = parseInt(parts[2], 10)
      }
    }
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/')
    if (parts.length === 3) {
      if (parts[2].length === 4) {
        d = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10) - 1
        y = parseInt(parts[2], 10)
      } else {
        y = parseInt(parts[0], 10)
        m = parseInt(parts[1], 10) - 1
        d = parseInt(parts[2], 10)
      }
    }
  }

  if (!y || isNaN(y) || isNaN(m) || isNaN(d)) return null

  let hr = 0, min = 0
  if (timeStr && timeStr.trim()) {
    const timeParts = timeStr.trim().split(':')
    if (timeParts.length >= 2) {
      hr = parseInt(timeParts[0], 10) || 0
      min = parseInt(timeParts[1], 10) || 0
    }
  }

  const dt = new Date(y, m, d, hr, min, 0)
  if (isNaN(dt.getTime())) return null
  return dt
}

export function formatarDataFormatada(dateStr: string, timeStr: string): string {
  const dt = parseDataHoraSafe(dateStr, timeStr)
  if (!dt) return 'A definir'
  const dia = String(dt.getDate()).padStart(2, '0')
  const mes = String(dt.getMonth() + 1).padStart(2, '0')
  const hora = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}, ${hora}:${min}`
}

export function formatCountdown(dateStr: string, timeStr: string): string {
  const dt = parseDataHoraSafe(dateStr, timeStr)
  if (!dt) return 'A definir'
  const ms = dt.getTime() - Date.now()
  
  if (ms <= 0) return 'fechado'

  const totalSeg = Math.floor(ms / 1000)
  const totalMin = Math.floor(totalSeg / 60)

  if (totalMin < 60) {
    const min = Math.floor(totalSeg / 60)
    const sec = totalSeg % 60
    return `fecha em ${min}m ${String(sec).padStart(2, '0')}s`
  }

  const horas = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  
  if (horas < 24) {
    const sec = totalSeg % 60
    return `fecha em ${horas}h ${String(mins).padStart(2, '0')}m ${String(sec).padStart(2, '0')}s`
  }

  const dias = Math.floor(horas / 24)
  const hRest = horas % 24
  return `fecha em ${dias}d${hRest > 0 ? ` ${hRest}h` : ''}`
}

export function getCountdownColor(dateStr: string, timeStr: string): string {
  const dt = parseDataHoraSafe(dateStr, timeStr)
  if (!dt) return 'text-tinta-200'
  const ms = dt.getTime() - Date.now()
  if (ms <= 0) return 'text-red-600 font-semibold'
  const horas = ms / (1000 * 60 * 60)
  if (horas <= 2) return 'text-red-600 font-bold'
  return 'text-green-700 font-bold'
}

export const formatarCountdown = formatCountdown

export function CardJogo({
  jogo,
  palpite,
  onChangePalpite,
}: {
  jogo: Jogo
  palpite: Palpite
  onChangePalpite: (p: Palpite) => void
}) {
  const [erroImgHome, setErroImgHome] = useState(false)
  const [erroImgAway, setErroImgAway] = useState(false)

  const homeNomeExibicao = normalizarNomeExibicao(jogo.home)
  const awayNomeExibicao = normalizarNomeExibicao(jogo.away)

  const escudoHome = getEscudo(jogo.home)
  const escudoAway = getEscudo(jogo.away)

  const [tempoTexto, setTempoTexto] = useState(() => formatCountdown(jogo.date, jogo.time))
  const [tempoCor, setTempoCor] = useState(() => getCountdownColor(jogo.date, jogo.time))

  useEffect(() => {
    setTempoTexto(formatCountdown(jogo.date, jogo.time))
    setTempoCor(getCountdownColor(jogo.date, jogo.time))
    const timer = setInterval(() => {
      setTempoTexto(formatCountdown(jogo.date, jogo.time))
      setTempoCor(getCountdownColor(jogo.date, jogo.time))
    }, 1000)
    return () => clearInterval(timer)
  }, [jogo.date, jogo.time])

  const travado = jogo.isLocked

  return (
    <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-3.5 shadow-sm">
      <div className="flex items-center justify-between gap-2">
        {/* Mandante */}
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-papel-borda-300 bg-papel-100 p-1">
            {escudoHome && !erroImgHome ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={escudoHome}
                alt={homeNomeExibicao}
                className="h-full w-full object-contain"
                onError={() => setErroImgHome(true)}
              />
            ) : (
              <span className="font-display text-xs font-bold text-tinta-200">
                {getSigla(jogo.home)}
              </span>
            )}
          </div>
          <span className="max-w-full truncate font-sans text-xs font-semibold text-tinta-300">
            {homeNomeExibicao}
          </span>
        </div>

        {/* Inputs de Placar */}
        <div className="flex items-center gap-1.5">
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            disabled={travado}
            value={palpite?.h ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
              onChangePalpite({ ...palpite, h: isNaN(val!) ? null : val })
            }}
            placeholder=""
            className="h-10 w-10 rounded-md border border-papel-borda-300 bg-papel-100 text-center font-mono text-base font-bold text-tinta-300 outline-none focus:border-dourado-500 focus:ring-1 focus:ring-dourado-500 disabled:opacity-50"
          />
          <span className="font-mono text-xs text-tinta-100">×</span>
          <input
            type="number"
            inputMode="numeric"
            min={0}
            max={99}
            disabled={travado}
            value={palpite?.a ?? ''}
            onChange={(e) => {
              const val = e.target.value === '' ? null : parseInt(e.target.value, 10)
              onChangePalpite({ ...palpite, a: isNaN(val!) ? null : val })
            }}
            placeholder=""
            className="h-10 w-10 rounded-md border border-papel-borda-300 bg-papel-100 text-center font-mono text-base font-bold text-tinta-300 outline-none focus:border-dourado-500 focus:ring-1 focus:ring-dourado-500 disabled:opacity-50"
          />
        </div>

        {/* Visitante */}
        <div className="flex flex-1 flex-col items-center gap-1.5 text-center min-w-0">
          <div className="flex h-12 w-12 items-center justify-center rounded-full border border-papel-borda-300 bg-papel-100 p-1">
            {escudoAway && !erroImgAway ? (
              /* eslint-disable-next-line @next/next/no-img-element */
              <img
                src={escudoAway}
                alt={awayNomeExibicao}
                className="h-full w-full object-contain"
                onError={() => setErroImgAway(true)}
              />
            ) : (
              <span className="font-display text-xs font-bold text-tinta-200">
                {getSigla(jogo.away)}
              </span>
            )}
          </div>
          <span className="max-w-full truncate font-sans text-xs font-semibold text-tinta-300">
            {awayNomeExibicao}
          </span>
        </div>
      </div>

      {/* Footer com Data/Hora e Status de Bloqueio */}
      <div className="mt-2.5 flex items-center justify-center gap-2 border-t border-papel-borda-200/60 pt-2 font-mono text-[10px] text-tinta-100">
        <span>⏱ {formatarDataFormatada(jogo.date, jogo.time)}</span>
        <span>·</span>
        {travado ? (
          <span className="font-semibold text-red-600">🔒 palpite encerrado</span>
        ) : (
          <span className={tempoCor}>{tempoTexto}</span>
        )}
      </div>
    </div>
  )
}
