'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { AppLayout } from '@/components/home/AppLayout'
import { GuiaScreen } from '@/components/guia'

export default function GuiaPage() {
  const router = useRouter()
  const [pronto, setPronto] = useState(false)

  useEffect(() => {
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (!raw) {
        router.replace('/')
        return
      }
    } catch {
      router.replace('/')
      return
    }
    setPronto(true)
  }, [router])

  if (!pronto) return null

  return (
    <AppLayout>
      <GuiaScreen />
    </AppLayout>
  )
}
