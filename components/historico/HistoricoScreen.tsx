'use client'

// HistoricoScreen — lista de rodadas finalizadas + busca + expansão de detalhes.
// Envolvido pelo AppLayout: sem <main>, sem bg próprio.

import { useEffect, useMemo, useState } from 'react'
import { motion } from 'framer-motion'
import {
  buscarRodadasFinalizadasHistorico,
  buscarDetalheRodada,
  type RodadaHistorico,
  type DetalheRodadaHistorico,
} from '@/lib/historicoReal'
import { CardEnvelope } from '@/components/home/CardEnvelope'
import { CardRodadaHistorico } from './CardRodadaHistorico'

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.1,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

export function HistoricoScreen({ meuParticipantId }: { meuParticipantId: string | null }) {
  const [rodadas, setRodadas] = useState<RodadaHistorico[]>([])
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)
  const [buscaId, setBuscaId] = useState<string>('')
  const [expandida, setExpandida] = useState<string | null>(null)
  const [detalheCache, setDetalheCache] = useState<Record<string, DetalheRodadaHistorico>>({})
  const [carregandoDetalhe, setCarregandoDetalhe] = useState<string | null>(null)

  useEffect(() => {
    setCarregando(true)
    buscarRodadasFinalizadasHistorico(meuParticipantId)
      .then((r) => setRodadas(r))
      .catch((e) => setErro((e as Error).message))
      .finally(() => setCarregando(false))
  }, [meuParticipantId])

  async function toggleExpandir(rodadaId: string) {
    if (expandida === rodadaId) {
      setExpandida(null)
      return
    }
    setExpandida(rodadaId)
    if (!detalheCache[rodadaId]) {
      setCarregandoDetalhe(rodadaId)
      try {
        const d = await buscarDetalheRodada(rodadaId)
        if (d) setDetalheCache((prev) => ({ ...prev, [rodadaId]: d }))
      } catch { /* silencioso */ }
      finally { setCarregandoDetalhe(null) }
    }
  }

  function onBuscaSelect(id: string) {
    setBuscaId(id)
    if (!id) return
    setExpandida(id)
    if (!detalheCache[id]) {
      setCarregandoDetalhe(id)
      buscarDetalheRodada(id)
        .then((d) => { if (d) setDetalheCache((prev) => ({ ...prev, [id]: d })) })
        .catch(() => { /* silencioso */ })
        .finally(() => setCarregandoDetalhe(null))
    }
    setTimeout(() => {
      const el = document.getElementById(`rodada-${id}`)
      if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' })
    }, 100)
  }

  const opcoesBusca = useMemo(
    () => rodadas.map((r) => ({ id: r.id, label: r.name })),
    [rodadas],
  )

  return (
    <>
      <h1 className="font-display text-2xl font-bold text-dourado-50">Histórico</h1>

      <CardEnvelope titulo="🔍 Buscar Rodada">
        <div className="p-3">
          <select
            value={buscaId}
            onChange={(e) => onBuscaSelect(e.target.value)}
            className="w-full rounded-md border border-papel-borda-300 bg-papel-100 px-3 py-2 font-sans text-sm text-tinta-300 focus:border-dourado-500 focus:outline-none"
          >
            <option value="">— Escolha uma rodada —</option>
            {opcoesBusca.map((o) => (
              <option key={o.id} value={o.id}>{o.label}</option>
            ))}
          </select>
        </div>
      </CardEnvelope>

      {erro && (
        <CardEnvelope variante="alerta" titulo="Erro">
          <p className="p-3 text-center font-sans text-sm text-raridade-frango-selo">{erro}</p>
        </CardEnvelope>
      )}

      {carregando && (
        <CardEnvelope>
          <p className="p-6 text-center font-sans text-sm text-tinta-100">Carregando histórico...</p>
        </CardEnvelope>
      )}

      {!carregando && rodadas.length === 0 && (
        <CardEnvelope>
          <p className="p-6 text-center font-sans text-sm text-tinta-100">
            Nenhuma rodada finalizada ainda.
          </p>
        </CardEnvelope>
      )}

      {!carregando && rodadas.length > 0 && (
        <motion.div
          variants={container}
          initial="hidden"
          animate="visible"
          className="space-y-3"
        >
          {rodadas.map((r) => (
            <motion.div key={r.id} variants={item}>
              <CardRodadaHistorico
                rodada={r}
                expandida={expandida === r.id}
                detalhe={detalheCache[r.id] ?? null}
                carregandoDetalhe={carregandoDetalhe === r.id}
                meuParticipantId={meuParticipantId}
                onToggle={() => toggleExpandir(r.id)}
              />
            </motion.div>
          ))}
        </motion.div>
      )}
    </>
  )
}
