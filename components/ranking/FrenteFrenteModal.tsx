'use client'

// FrenteFrenteModal — comparativo histórico entre 2 participantes.
// Agora com Framer Motion: backdrop fade + card scale-in + stagger nas rodadas.

import { useEffect, useMemo, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { buscarFrenteAFrente, type FrenteFrenteRodada } from '@/lib/rankingReal'
import { vibrar } from '@/lib/haptic'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

type Janela = 'ultima' | 'ult3' | 'ult5' | 'ult10' | 'total'

const OPCOES_JANELA: Array<[Janela, string]> = [
  ['ultima', 'Última'], ['ult3', 'Últ. 3'], ['ult5', 'Últ. 5'], ['ult10', 'Últ. 10'], ['total', 'Total'],
]

function iconeResultado(pontos: number | null, resultadoH: number | null): string {
  if (pontos === null || resultadoH === null) return '—'
  if (pontos >= 5) return '✅'
  if (pontos >= 3) return '📐'
  if (pontos >= 1) return '👍'
  return '❌'
}

const listaRodadas = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
}

const itemRodada = {
  hidden: { opacity: 0, y: 8 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.28,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

interface Jogador {
  participantId: string
  nome: string
  avatar?: string | null
  emoji?: string | null
}

// Avatar circular grande — mostra foto se tiver, senão iniciais
function AvatarGrande({ jogador, corBorda, corFundo }: { jogador: Jogador; corBorda: string; corFundo: string }) {
  const avatarLimpo = jogador.avatar && jogador.avatar.trim().length > 0 ? jogador.avatar : null
  return (
    <div className={cx(
      'mx-auto flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 font-display text-base font-bold text-tinta-300',
      corBorda,
      !avatarLimpo && corFundo,
    )}>
      {avatarLimpo ? (
        /* eslint-disable-next-line @next/next/no-img-element */
        <img src={avatarLimpo} alt={jogador.nome} className="h-full w-full object-cover" />
      ) : (
        <span>{getIniciais(jogador.nome)}</span>
      )}
    </div>
  )
}

export function FrenteFrenteModal({
  jogadorA,
  jogadorB,
  onFechar,
}: {
  jogadorA: Jogador
  jogadorB: Jogador
  onFechar: () => void
}) {
  const [janela, setJanela] = useState<Janela>('total')
  const [carregando, setCarregando] = useState(true)
  const [rodadas, setRodadas] = useState<FrenteFrenteRodada[]>([])
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true); setErro(null)
    buscarFrenteAFrente(jogadorA.participantId, jogadorB.participantId, janela)
      .then(setRodadas)
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false))
  }, [janela, jogadorA.participantId, jogadorB.participantId])

  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onFechar()
    }
    window.addEventListener('keydown', handleEsc)
    return () => window.removeEventListener('keydown', handleEsc)
  }, [onFechar])

  const { vA, vB, empates } = useMemo(() => {
    let vA = 0, vB = 0, empates = 0
    for (const r of rodadas) {
      if (r.totalA > r.totalB) vA++
      else if (r.totalB > r.totalA) vB++
      else empates++
    }
    return { vA, vB, empates }
  }, [rodadas])

  function mudarJanela(j: Janela) {
    if (j === janela) return
    vibrar('leve')
    setJanela(j)
  }

  return (
    <AnimatePresence>
      <motion.div
        key="backdrop"
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-0 z-[150] flex items-center justify-center bg-tinta-300/70 p-4 backdrop-blur-sm"
        onClick={onFechar}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.94, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 6 }}
          transition={{ duration: 0.28, ease: [0.32, 0.72, 0, 1] }}
          className="w-full max-w-lg overflow-hidden rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Cabeçalho */}
          <div className="flex items-center justify-between border-b border-papel-borda-200 bg-papel-100 px-4 py-3">
            <p className="font-display text-base font-bold uppercase tracking-wide text-tinta-300">
              🥊 Frente a Frente
            </p>
            <motion.button
              type="button"
              onClick={onFechar}
              whileTap={{ scale: 0.9 }}
              className="font-mono text-xs text-tinta-200 hover:text-tinta-300"
            >
              ✕
            </motion.button>
          </div>

          {/* Filtros de janela */}
          <div className="flex flex-wrap gap-1.5 border-b border-papel-borda-200 bg-papel-100 px-4 py-2">
            {OPCOES_JANELA.map(([val, label]) => (
              <motion.button
                key={val}
                type="button"
                onClick={() => mudarJanela(val)}
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.1 }}
                className={cx(
                  'rounded-md border px-2.5 py-1 font-mono text-[10px] font-bold uppercase tracking-widest transition-colors',
                  janela === val
                    ? 'border-dourado-500 bg-dourado-100 text-dourado-700'
                    : 'border-papel-borda-300 text-tinta-200 hover:bg-papel-200',
                )}
              >
                {label}
              </motion.button>
            ))}
          </div>

          {/* Placar */}
          <div className="grid grid-cols-3 items-center gap-2 border-b border-papel-borda-200 bg-papel-50 px-4 py-4">
            <motion.div
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="text-center"
            >
              <AvatarGrande jogador={jogadorA} corBorda="border-dourado-400" corFundo="bg-dourado-100" />
              <p className="mt-1 truncate font-sans text-xs font-semibold text-tinta-300">
                {jogadorA.emoji && <span className="mr-1">{jogadorA.emoji}</span>}
                {jogadorA.nome}
              </p>
              <motion.p
                key={`vA-${vA}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="mt-0.5 font-mono text-2xl font-bold text-dourado-600"
              >
                {vA}
              </motion.p>
              <p className="font-mono text-[9px] uppercase text-tinta-100">Rodadas vencidas</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35, delay: 0.1 }}
              className="text-center"
            >
              <p className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">Placar</p>
              <motion.p
                key={`emp-${empates}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="mt-1 font-mono text-lg font-bold text-tinta-300"
              >
                {empates}
              </motion.p>
              <p className="font-mono text-[9px] uppercase text-tinta-100">Empates</p>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, x: 10 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.35, delay: 0.05 }}
              className="text-center"
            >
              <AvatarGrande jogador={jogadorB} corBorda="border-gray-400" corFundo="bg-gray-200" />
              <p className="mt-1 truncate font-sans text-xs font-semibold text-tinta-300">
                {jogadorB.emoji && <span className="mr-1">{jogadorB.emoji}</span>}
                {jogadorB.nome}
              </p>
              <motion.p
                key={`vB-${vB}`}
                initial={{ scale: 0.6, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ duration: 0.3, ease: [0.32, 0.72, 0, 1] }}
                className="mt-0.5 font-mono text-2xl font-bold text-dourado-600"
              >
                {vB}
              </motion.p>
              <p className="font-mono text-[9px] uppercase text-tinta-100">Rodadas vencidas</p>
            </motion.div>
          </div>

          {/* Corpo scrollável */}
          <div className="max-h-[50vh] overflow-y-auto">
            {carregando && (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="p-4 text-center font-sans text-xs text-tinta-100"
              >
                Carregando...
              </motion.p>
            )}
            {erro && <p className="p-4 text-center font-sans text-xs text-raridade-frango-selo">{erro}</p>}
            {!carregando && !erro && rodadas.length === 0 && (
              <p className="p-4 text-center font-sans text-xs text-tinta-100">
                Nenhuma rodada finalizada nesse recorte.
              </p>
            )}
            {!carregando && !erro && rodadas.length > 0 && (
              <motion.div
                key={janela}
                variants={listaRodadas}
                initial="hidden"
                animate="visible"
              >
                {rodadas.map((r) => {
                  const cor = r.totalA > r.totalB ? 'text-dourado-600' : r.totalB > r.totalA ? 'text-gray-500' : 'text-tinta-300'
                  return (
                    <motion.div
                      key={r.roundId}
                      variants={itemRodada}
                      className="border-b border-papel-borda-200 px-4 py-3 last:border-0"
                    >
                      <div className="mb-2 flex items-center justify-between">
                        <span className="font-mono text-[10px] uppercase tracking-widest text-tinta-100">{r.nome}</span>
                        <span className={cx('font-mono text-sm font-bold', cor)}>
                          {r.totalA} × {r.totalB}
                        </span>
                      </div>
                      <div className="space-y-1">
                        {r.jogos.map((j) => (
                          <div key={j.matchId} className="grid grid-cols-[1fr_auto_1fr_auto_1fr] items-center gap-2 font-mono text-[11px]">
                            <span className="text-right">
                              {j.palpiteAH !== null ? `${j.palpiteAH}×${j.palpiteAA}` : '—'}
                              {' '}<span className="text-sm">{iconeResultado(j.pontosA, j.resultadoH)}</span>
                            </span>
                            <span className="text-tinta-100">|</span>
                            <span className="text-center text-tinta-200">
                              {j.home} × {j.away}
                              {j.resultadoH !== null && (
                                <span className="ml-1 font-bold text-dourado-600">
                                  ({j.resultadoH}×{j.resultadoA})
                                </span>
                              )}
                            </span>
                            <span className="text-tinta-100">|</span>
                            <span className="text-left">
                              <span className="text-sm">{iconeResultado(j.pontosB, j.resultadoH)}</span>{' '}
                              {j.palpiteBH !== null ? `${j.palpiteBH}×${j.palpiteBA}` : '—'}
                            </span>
                          </div>
                        ))}
                      </div>
                    </motion.div>
                  )
                })}
              </motion.div>
            )}
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  )
}
