'use client'

// Palpites real — Fase 4: rodada/jogos vêm do Supabase (palpites_open=true),
// palpites gravados de verdade em `predictions`, ligados à sessão de /login.

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
      router.push('/login')
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

  if (erro) {
    return <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-300">{erro}</main>
  }

  if (!participantId || !rodada) {
    return <main className="min-h-screen bg-papel-200" />
  }

  if (!rodada.roundId) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-300">
        Nenhuma rodada com palpites abertos no momento.
      </main>
    )
  }

  return (
    <PalpitesRodada
      rodadaNome={rodada.nome}
      jogos={rodada.jogos}
      palpitesIniciais={palpitesIniciais}
      onSalvar={(palpites) => salvarPalpitesReais(participantId, palpites)}
    />
  )
}
