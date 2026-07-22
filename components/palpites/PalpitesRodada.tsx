'use client'

// PalpitesRodada — tela de Palpites da rodada atual.
// Agora com toasts + vibração + micro-interações no salvar.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import { CardJogo, formatCountdown, type JogoPalpite, type Palpite } from './CardJogo'
import { showToast } from '@/components/home/Toast'
import { vibrar } from '@/lib/haptic'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

const URGENTE_MS = 60 * 60 * 1000

const listaVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.08,
    },
  },
}

const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

export function PalpitesRodada({
  rodadaNome,
  jogos,
  palpitesIniciais,
  onSalvar,
}: {
  rodadaNome: string
  jogos: JogoPalpite[]
  palpitesIniciais?: Record<string, Palpite>
  onSalvar?: (palpites: Record<string, Palpite>) => void | Promise<void>
}) {
  const [palpites, setPalpites] = useState<Record<string, Palpite>>(palpitesIniciais ?? {})
  const [now, setNow] = useState<number>(() => Date.now())
  const [salvoEm, setSalvoEm] = useState<Date | null>(null)

  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 1000)
    return () => clearInterval(id)
  }, [])

  function getPalpite(id: string): Palpite {
    return palpites[id] ?? { h: '', a: '' }
  }

  function setPalpite(id: string, p: Palpite) {
    setPalpites((prev) => ({ ...prev, [id]: p }))
  }

  const { totais, abertos, palpitados, proximoMs } = useMemo(() => {
    let abertosN = 0
    let palpitadosN = 0
    let proximo = Infinity
    for (const j of jogos) {
      const diff = Date.parse(j.kickoff) - now
      const locked = j.travadoManual || diff <= 0
      if (!locked) {
        abertosN++
        if (diff < proximo) proximo = diff
      }
      const p = palpites[j.id]
      if (p && p.h !== '' && p.a !== '') palpitadosN++
    }
    return {
      totais: jogos.length,
      abertos: abertosN,
      palpitados: palpitadosN,
      proximoMs: proximo === Infinity ? null : proximo,
    }
  }, [jogos, palpites, now])

  const esqueceu = jogos.some((j) => {
    const diff = Date.parse(j.kickoff) - now
    const locked = j.travadoManual || diff <= 0
    const p = palpites[j.id]
    return !locked && (!p || p.h === '' || p.a === '')
  })

  const [salvando, setSalvando] = useState(false)

  async function salvar() {
    if (salvando) return

    if (palpitados === 0) {
      vibrar('erro')
      showToast('Palpite pelo menos um jogo antes de salvar!', 'aviso')
      return
    }

    if (onSalvar) {
      setSalvando(true)
      try {
        await onSalvar(palpites)
        setSalvoEm(new Date())
        vibrar('sucesso')
        showToast(
          esqueceu
            ? `Salvo! Mas ainda tem jogo em aberto... 👀`
            : `Todos os ${palpitados} palpites salvos! ⚽`,
          'sucesso',
        )
      } catch (e) {
        vibrar('erro')
        showToast(`Erro ao salvar: ${(e as Error).message}`, 'erro')
      } finally {
        setSalvando(false)
      }
      return
    }

    console.log('[palpites mock] salvar:', palpites)
    setSalvoEm(new Date())
    vibrar('sucesso')
    showToast('Palpites salvos (mock)!', 'sucesso')
  }

  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-28 pt-6">
      <div className="mx-auto max-w-md">
        {/* Cabeçalho */}
        <header className="mb-4">
          <h1 className="font-display text-2xl font-bold text-tinta-300">{rodadaNome}</h1>
          <p className="font-sans text-sm text-tinta-100">Palpite o placar de cada jogo</p>

          <div className="mt-3 grid grid-cols-3 gap-2">
            <Resumo label="Jogos" valor={totais} />
            <Resumo label="Abertos" valor={abertos} />
            <Resumo label="Palpitados" valor={`${palpitados}/${totais}`} destaque={palpitados > 0} />
          </div>

          {proximoMs !== null && (
            <p className="mt-3 text-center font-mono text-xs text-tinta-200">
              Próximo fecha em{' '}
              <motion.span
                key={proximoMs < URGENTE_MS ? 'urgente' : 'ok'}
                initial={{ scale: 0.9 }}
                animate={{ scale: 1 }}
                className={cx(
                  'font-bold inline-block',
                  proximoMs < URGENTE_MS ? 'text-raridade-frango-selo' : 'text-verde-badge',
                )}
              >
                {formatCountdown(proximoMs)}
              </motion.span>
            </p>
          )}
        </header>

        {/* Banner cômico */}
        {esqueceu && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.3 }}
            className="mb-4 rounded-md border border-dourado-300 bg-dourado-50/60 px-3 py-2 text-center font-sans text-xs font-medium text-tinta-300"
          >
            iii, mané… ainda tem jogo sem palpite! 👀
          </motion.div>
        )}

        {/* Lista de jogos com stagger */}
        <motion.div
          variants={listaVariants}
          initial="hidden"
          animate="visible"
          className="flex flex-col gap-3"
        >
          {jogos.map((j) => (
            <motion.div key={j.id} variants={itemVariants}>
              <CardJogo
                jogo={j}
                palpite={getPalpite(j.id)}
                now={now}
                onChange={(p) => setPalpite(j.id, p)}
              />
            </motion.div>
          ))}
        </motion.div>
      </div>

      {/* Barra de salvar fixa */}
      <motion.div
        initial={{ y: 60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2, ease: [0.32, 0.72, 0, 1] }}
        className="fixed inset-x-0 bottom-0 border-t border-papel-borda-300 bg-papel-100/95 px-4 py-3 backdrop-blur-sm shadow-[0_-4px_12px_rgba(0,0,0,0.08)]"
      >
        <div className="mx-auto flex max-w-md items-center justify-between gap-3">
          <span className="font-mono text-[11px] text-tinta-100">
            {salvoEm
              ? `Salvo às ${salvoEm.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
              : `${palpitados} de ${totais} palpitados`}
          </span>
          <motion.button
            type="button"
            onClick={salvar}
            disabled={salvando}
            whileTap={{ scale: 0.96 }}
            whileHover={{ scale: salvando ? 1 : 1.02 }}
            transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
            className="flex items-center gap-2 rounded-md border-2 border-dourado-300 bg-couro-300 px-6 py-2 font-display text-sm font-bold uppercase tracking-wider text-dourado-50 shadow-md transition-colors hover:bg-couro-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300 disabled:opacity-60"
          >
            {salvando ? (
              <>
                <motion.span
                  className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
                />
                Salvando...
              </>
            ) : (
              'Salvar Palpites'
            )}
          </motion.button>
        </div>
      </motion.div>
    </main>
  )
}

function Resumo({
  label,
  valor,
  destaque = false,
}: {
  label: string
  valor: string | number
  destaque?: boolean
}) {
  return (
    <motion.div
      animate={destaque ? { borderColor: 'var(--dourado-400, #E3C268)' } : {}}
      transition={{ duration: 0.3 }}
      className={cx(
        'flex flex-col items-center rounded-md border py-2 transition-colors',
        destaque ? 'border-dourado-400 bg-dourado-50' : 'border-papel-borda-200 bg-papel-50',
      )}
    >
      <motion.span
        key={`${label}-${valor}`}
        initial={{ scale: 0.85, opacity: 0.6 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ duration: 0.25, ease: [0.32, 0.72, 0, 1] }}
        className="font-mono text-lg font-bold leading-none text-tinta-300"
      >
        {valor}
      </motion.span>
      <span className="mt-1 font-mono text-[8px] uppercase tracking-wider text-tinta-100">
        {label}
      </span>
    </motion.div>
  )
}
