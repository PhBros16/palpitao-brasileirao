'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/home/AppLayout'
import { HistoricoScreen } from '@/components/historico'

export default function HistoricoPage() {
  const router = useRouter()
  const [meuId, setMeuId] = useState<string | null>(null)
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (!raw) {
        router.replace('/')
        return
      }
      const s = JSON.parse(raw) as { id: string }
      setMeuId(s.id)
    } catch {
      router.replace('/')
      return
    }
    setPronto(true)
  }, [router])

  if (!pronto) return null

  return (
    <AppLayout>
      <HistoricoScreen meuParticipantId={meuId} />
    </AppLayout>
  )
}
