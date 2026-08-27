'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PalpitesRodada } from '@/components/palpites'
import type { Palpite } from '@/components/palpites/CardJogo'
import { buscarRodadaAtivaPalpites, buscarPalpitesExistentes, salvarPalpitesReais, type RodadaPalpites } from '@/lib/palpitesReais'
import { lerCache, salvarCache, CACHE_TTL } from '@/lib/dataCache'

export default function PalpitesPage() {
  const router = useRouter()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [rodada, setRodada] = useState<RodadaPalpites | null>(
    () => lerCache<RodadaPalpites>('rodada_ativa', CACHE_TTL.CURTO),
  )
  const [palpitesIniciais, setPalpitesIniciais] = useState<Record<string, Palpite>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    try {
      const sessaoRaw = localStorage.getItem('palpitao_sessao')
      if (!sessaoRaw) {
        router.push('/')
        return
      }
      const sessao = JSON.parse(sessaoRaw) as { id: string; nome: string }
      if (!sessao || !sessao.id) {
        router.push('/')
        return
      }
      setParticipantId(sessao.id)

      // Se já tem uma rodada em cache, mostra os palpites daquela rodada
      // (também em cache) imediatamente, sem esperar a rede.
      const rodadaCache = lerCache<RodadaPalpites>('rodada_ativa', CACHE_TTL.CURTO)
      if (rodadaCache?.roundId) {
        const palpitesCache = lerCache<Record<string, Palpite>>(
          `palpites_${rodadaCache.roundId}_${sessao.id}`,
          CACHE_TTL.CURTO,
        )
        if (palpitesCache) setPalpitesIniciais(palpitesCache)
      }

      buscarRodadaAtivaPalpites()
        .then(async (r) => {
          setRodada(r)
          salvarCache('rodada_ativa', r)
          if (r && r.roundId) {
            try {
              const existentes = await buscarPalpitesExistentes(r.roundId, sessao.id)
              setPalpitesIniciais(existentes ?? {})
              salvarCache(`palpites_${r.roundId}_${sessao.id}`, existentes ?? {})
            } catch {
              setPalpitesIniciais({})
            }
          }
        })
        .catch((e) => setErro(`Não consegui carregar a rodada: ${(e as Error).message}`))
    } catch {
      router.push('/')
    }
  }, [router])

  return (
    <>
      {erro && (
        <div className="rounded-lg border border-raridade-frango-selo bg-red-50 p-3 text-center font-sans text-sm text-raridade-frango-selo">
          {erro}
        </div>
      )}
      {!erro && !rodada && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-100">
          Carregando palpites...
        </div>
      )}
      {rodada && !rodada.roundId && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-200">
          Nenhuma rodada com palpites abertos no momento.
        </div>
      )}
      {rodada && rodada.roundId && participantId && (
        <PalpitesRodada
          rodadaNome={rodada.nome}
          jogos={rodada.jogos}
          palpitesIniciais={palpitesIniciais}
          onSalvar={(palpites) => salvarPalpitesReais(participantId, palpites)}
        />
      )}
    </>
  )
}
