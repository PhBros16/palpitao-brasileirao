'use client'

// /inicio — Home real, tela principal pós-login.
//
// Sem sessão → redireciona pra / (abertura, único caminho canônico).
// Com sessão → renderiza <HomeReal /> que busca todos os dados de uma vez.

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { HomeReal } from '@/components/home/HomeReal'

export default function InicioPage() {
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

  return <HomeReal />
}
