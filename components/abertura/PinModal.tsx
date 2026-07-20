'use client'

// PinModal — modal de PIN usado na abertura cinematográfica ao clicar num
// jogador titular. Extraído do LoginGramado pra permitir reuso sem carregar
// o gramado inteiro (a abertura já tem seu próprio "gramado", só faltava o
// modal). Visual/UX espelham o modal original do LoginGramado.
//
// Ao validar PIN correto: chama onSucesso(player) — quem chama decide o que
// fazer (a abertura grava sessão em localStorage e navega pra /palpites).

import { useEffect, useState } from 'react'

export interface PinPlayer {
  id: string
  nome: string
  vulgo?: string
  pin: string
  avatar?: string | null
}

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

export function PinModal({
  player,
  onFechar,
  onSucesso,
}: {
  player: PinPlayer
  onFechar: () => void
  onSucesso: (player: PinPlayer) => void
}) {
  const [pin, setPin] = useState('')
  const [erro, setErro] = useState(false)

  function digitar(d: string) {
    setPin((atual) => (atual.length >= 4 ? atual : atual + d))
    setErro(false)
  }
  function apagar() {
    setErro(false)
    setPin((atual) => atual.slice(0, -1))
  }

  useEffect(() => {
    if (pin.length !== 4) return
    if (pin === player.pin) {
      onSucesso(player)
    } else {
      setErro(true)
      setPin('')
    }
  }, [pin, player])

  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-tinta-300/85 p-4 backdrop-blur-sm"
      onClick={onFechar}
    >
      <div
        className="flex w-full max-w-[300px] flex-col items-center gap-4 rounded-lg border-2 border-dourado-300 bg-papel-100 p-5 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Avatar do selecionado (grande, dourado). Foto se existir, senão iniciais */}
        <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-dourado-400 bg-dourado-100">
          {player.avatar ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={player.avatar} alt={player.nome} className="h-full w-full object-cover" />
          ) : (
            <span className="font-display text-xl font-bold text-dourado-700">{getIniciais(player.nome)}</span>
          )}
        </div>

        <div className="text-center">
          <p className="font-display text-lg font-bold text-tinta-300">{player.nome}</p>
          {player.vulgo && <p className="font-sans text-xs italic text-tinta-100">"{player.vulgo}"</p>}
        </div>

        <p className="font-sans text-sm font-bold uppercase tracking-tight text-tinta-300">Digite seu PIN</p>

        {/* 4 bolinhas */}
        <div className="flex gap-3">
          {[0, 1, 2, 3].map((i) => (
            <span
              key={i}
              className={cx(
                'h-3.5 w-3.5 rounded-full border-2',
                erro
                  ? 'border-raridade-frango-selo'
                  : i < pin.length
                    ? 'border-dourado-400 bg-dourado-400'
                    : 'border-papel-borda-300',
              )}
            />
          ))}
        </div>

        {erro && (
          <p className="font-mono text-[11px] uppercase tracking-wider text-raridade-frango-selo">
            PIN incorreto
          </p>
        )}

        {/* Teclado numérico */}
        <div className="grid w-full grid-cols-3 gap-2">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
            <button
              key={d}
              type="button"
              onClick={() => digitar(d)}
              className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
            >
              {d}
            </button>
          ))}
          <button
            type="button"
            onClick={onFechar}
            className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-xs uppercase text-tinta-100 transition-colors active:bg-papel-200"
          >
            Sair
          </button>
          <button
            type="button"
            onClick={() => digitar('0')}
            className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
          >
            0
          </button>
          <button
            type="button"
            onClick={apagar}
            className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-lg text-tinta-100 transition-colors active:bg-papel-200"
          >
            ⌫
          </button>
        </div>
      </div>
    </div>
  )
}
