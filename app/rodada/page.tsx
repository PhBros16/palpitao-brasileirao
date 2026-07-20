'use client'

// /rodada — envolvida no AppLayout.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { RodadaAoVivo } from '@/components/rodada/RodadaAoVivo'
import { AppLayout } from '@/components/home/AppLayout'

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

  return (
    <AppLayout>
      <RodadaAoVivo />
    </AppLayout>
  )
}
