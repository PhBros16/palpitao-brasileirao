'use client'

// Palpites real — envolvido no AppLayout pra ganhar Header + Nav + Player.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PalpitesRodada } from '@/components/palpites'
import type { Palpite } from '@/components/palpites/CardJogo'
import { buscarRodadaAtivaPalpites, buscarPalpitesExistentes, salvarPalpitesReais, type RodadaPalpites } from '@/lib/palpitesReais'

export default function PalpitesPage() {
  const router = useRouter()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [rodada, setRodada] = useState<RodadaPalpites | null>(null)
  const [palpitesIniciais, setPalpitesIniciais] = useState<Record<string, Palpite>>({})
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    const sessaoRaw = localStorage.getItem('palpitao_sessao')
    if (!sessaoRaw) {
      router.push('/')
      return
    }
    const sessao = JSON.parse(sessaoRaw) as { id: string; nome: string }
    setParticipantId(sessao.id)

    buscarRodadaAtivaPalpites()
      .then(async (r) => {
        setRodada(r)
        if (r.roundId) {
          const existentes = await buscarPalpitesExistentes(r.roundId, sessao.id)
          setPalpitesIniciais(existentes)
        }
      })
      .catch((e) => setErro(`Não consegui carregar a rodada: ${e.message}`))
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
          Carregando...
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
