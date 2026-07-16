'use client'

// /rodada — Aba Rodada ao vivo.
//
// Sem sessão → redireciona pra / (abertura, único caminho canônico de acesso).
// Com sessão → renderiza <RodadaAoVivo /> que busca dados por conta própria.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RodadaAoVivo } from '@/components/rodada/RodadaAoVivo'

export default function RodadaPage() {
  const router = useRouter()

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (!raw) {
        router.replace('/')
      }
    } catch {
      router.replace('/')
    }
  }, [router])

  return <RodadaAoVivo />
}
