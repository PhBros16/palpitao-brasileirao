'use client'

// PinModal — modal de PIN usado na abertura cinematográfica ao clicar num
// jogador titular. Agora com animações Framer Motion:
// - Backdrop fade
// - Card scale-in + slide up
// - Bolinhas com "pop" ao preencher
// - Shake horizontal + vibração no erro
// - Teclas com press-down
// - Haptic feedback ao digitar/errar/acertar

import { useEffect, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { vibrar } from '@/lib/haptic'
import { validarPin } from './elencoMock'

// Sem campo "pin" — o valor certo nunca sai do banco. A validação
// acontece via validarPin() (chama a função validar_pin do Postgres),
// não por comparação local. Ver fix_pin_seguranca.sql.
export interface PinPlayer {
  id: string
  nome: string
  vulgo?: string
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
    if (validando) return
    vibrar('leve')
    setPin((atual) => (atual.length >= 4 ? atual : atual + d))
    setErro(false)
  }

  function apagar() {
    if (validando) return
    vibrar('leve')
    setErro(false)
    setPin((atual) => atual.slice(0, -1))
  }

  const [validando, setValidando] = useState(false)

  useEffect(() => {
    if (pin.length !== 4) return
    let cancelado = false
    setValidando(true)
    validarPin(player.nome, pin)
      .then((resultado) => {
        if (cancelado) return
        if (resultado) {
          vibrar('sucesso')
          onSucesso(resultado)
        } else {
          vibrar('erro')
          setErro(true)
          // Limpa o pin depois do shake terminar
          setTimeout(() => setPin(''), 500)
        }
      })
      .finally(() => {
        if (!cancelado) setValidando(false)
      })
    return () => {
      cancelado = true
    }
  }, [pin, player, onSucesso])

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-0 z-[100] flex items-center justify-center bg-tinta-300/85 p-4 backdrop-blur-sm"
        onClick={onFechar}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 12 }}
          animate={
            erro
              ? { opacity: 1, scale: 1, y: 0, x: [0, -8, 8, -6, 6, -3, 3, 0] }
              : { opacity: 1, scale: 1, y: 0, x: 0 }
          }
          exit={{ opacity: 0, scale: 0.94, y: 6 }}
          transition={
            erro
              ? { x: { duration: 0.45, ease: 'easeInOut' } }
              : { duration: 0.32, ease: [0.32, 0.72, 0, 1] }
          }
          className="flex w-full max-w-[300px] flex-col items-center gap-4 rounded-lg border-2 border-dourado-300 bg-papel-100 p-5 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Avatar */}
          <motion.div
            initial={{ scale: 0.6, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.4, delay: 0.1, ease: [0.32, 0.72, 0, 1] }}
            className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full border-4 border-dourado-400 bg-dourado-100"
          >
            {player.avatar ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={player.avatar} alt={player.nome} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-xl font-bold text-dourado-700">{getIniciais(player.nome)}</span>
            )}
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3, delay: 0.15 }}
            className="text-center"
          >
            <p className="font-display text-lg font-bold text-tinta-300">{player.nome}</p>
            {player.vulgo && <p className="font-sans text-xs italic text-tinta-100">"{player.vulgo}"</p>}
          </motion.div>

          <p className="font-sans text-sm font-bold uppercase tracking-tight text-tinta-300">Digite seu PIN</p>

          {/* 4 bolinhas com pop-in */}
          <div className="flex gap-3">
            {[0, 1, 2, 3].map((i) => {
              const preenchida = i < pin.length
              return (
                <motion.span
                  key={i}
                  animate={
                    erro
                      ? { scale: 1, borderColor: 'var(--raridade-frango-selo, #B22222)' }
                      : preenchida
                        ? { scale: [1, 1.25, 1] }
                        : { scale: 1 }
                  }
                  transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
                  className={cx(
                    'h-3.5 w-3.5 rounded-full border-2',
                    erro
                      ? 'border-raridade-frango-selo'
                      : preenchida
                        ? 'border-dourado-400 bg-dourado-400'
                        : 'border-papel-borda-300',
                  )}
                />
              )
            })}
          </div>

          <AnimatePresence>
            {erro && (
              <motion.p
                initial={{ opacity: 0, y: -4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="font-mono text-[11px] uppercase tracking-wider text-raridade-frango-selo"
              >
                PIN incorreto
              </motion.p>
            )}
          </AnimatePresence>

          {/* Teclado */}
          <div className="grid w-full grid-cols-3 gap-2">
            {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((d) => (
              <motion.button
                key={d}
                type="button"
                onClick={() => digitar(d)}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.1 }}
                className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
              >
                {d}
              </motion.button>
            ))}
            <motion.button
              type="button"
              onClick={onFechar}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1 }}
              className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-xs uppercase text-tinta-100 transition-colors active:bg-papel-200"
            >
              Sair
            </motion.button>
            <motion.button
              type="button"
              onClick={() => digitar('0')}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1 }}
              className="rounded-md border border-papel-borda-200 bg-papel-200 py-3 font-mono text-lg font-bold text-tinta-300 transition-colors active:bg-papel-300"
            >
              0
            </motion.button>
            <motion.button
              type="button"
              onClick={apagar}
              whileTap={{ scale: 0.94 }}
              transition={{ duration: 0.1 }}
              className="rounded-md border border-papel-borda-200 bg-papel-50 py-3 font-mono text-lg text-tinta-100 transition-colors active:bg-papel-200"
            >
              ⌫
            </motion.button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
