'use client'

// CardJogo — card individual de um jogo na tela de palpites.
//
// Suporta:
//   - Duas entradas de placar (Home e Away)
//   - Bloqueio se o jogo ja passou do horario ou foi travado pelo admin
//   - Escudo do time com fallback para sigla de 3 letras se imagem falhar
//   - Formatacao de data/hora imune a bugs do Safari/iOS (iPhone)
//   - Exibicao encurtada de "Red Bull Bragantino" para "RB Bragantino"

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

function getSigla(nome: string): string {
  const n = nome.trim()
  if (n === 'Red Bull Bragantino' || n === 'RB Bragantino') return 'RBB'
  if (n === 'Athletico-PR' || n === 'Athletico PR') return 'CAP'
  if (n === 'Atlético-MG' || n === 'Atlético MG') return 'CAM'
  if (n === 'São Paulo') return 'SAO'
  const palavras = n.split(' ').filter(Boolean)
  if (palavras.length >= 2) {
    return (palavras[0][0] + palavras[1][0] + (palavras[2]?.[0] ?? '')).toUpperCase().slice(0, 3)
  }
  return n.slice(0, 3).toUpperCase()
}

function normalizarNomeExibicao(nome: string): string {
  if (!nome) return ''
  if (nome === 'Red Bull Bragantino') return 'RB Bragantino'
  return nome.trim()
}

function parseDataHoraSafe(dateStr: string, timeStr: string): Date | null {
  if (!dateStr) return null
  const cleanDate = dateStr.trim()
  let y = 0, m = 0, d = 0

  if (cleanDate.includes('-')) {
    const parts = cleanDate.split('-')
    if (parts.length === 3) {
      y = parseInt(parts[0], 10)
      m = parseInt(parts[1], 10) - 1
      d = parseInt(parts[2], 10)
    }
  } else if (cleanDate.includes('/')) {
    const parts = cleanDate.split('/')
    if (parts.length === 3) {
      d = parseInt(parts[0], 10)
      m = parseInt(parts[1], 10) - 1
      y = parseInt(parts[2], 10)
    }
  }

  if (!y || isNaN(y) || isNaN(m) || isNaN(d)) return null

  let hr = 0, min = 0
  if (timeStr) {
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

function formatarDataFormatada(dateStr: string, timeStr: string): string {
  const dt = parseDataHoraSafe(dateStr, timeStr)
  if (!dt) return 'A definir'
  const dia = String(dt.getDate()).padStart(2, '0')
  const mes = String(dt.getMonth() + 1).padStart(2, '0')
  const hora = String(dt.getHours()).padStart(2, '0')
  const min = String(dt.getMinutes()).padStart(2, '0')
  return `${dia}/${mes}, ${hora}:${min}`
}

function formatarCountdown(dateStr: string, timeStr: string): string {
  const dt = parseDataHoraSafe(dateStr, timeStr)
  if (!dt) return 'A definir'
  const ms = dt.getTime() - Date.now()
  if (ms <= 0) return 'fechado'
  const totalMin = Math.floor(ms / 60000)
  if (totalMin < 60) return `fecha em ${totalMin}min`
  const horas = Math.floor(totalMin / 60)
  const mins = totalMin % 60
  if (horas < 24) return `fecha em ${horas}h${mins > 0 ? ` ${mins}min` : ''}`
  const dias = Math.floor(horas / 24)
  const hRest = horas % 24
  return `fecha em ${dias}d${hRest > 0 ? ` ${hRest}h` : ''}`
}

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

  const [tempoTexto, setTempoTexto] = useState(() => formatarCountdown(jogo.date, jogo.time))

  useEffect(() => {
    const timer = setInterval(() => {
      setTempoTexto(formatarCountdown(jogo.date, jogo.time))
    }, 30000)
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
            value={palpite.h ?? ''}
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
            value={palpite.a ?? ''}
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
          <span className="font-semibold text-raridade-frango-selo">🔒 palpite encerrado</span>
        ) : (
          <span className="text-dourado-700">{tempoTexto}</span>
        )}
      </div>
    </div>
  )
}
