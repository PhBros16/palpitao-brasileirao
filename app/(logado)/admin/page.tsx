'use client'

// /admin — rota admin real (substituirá /admin-teste no futuro).
// Por enquanto ambas existem. AdminScreen ganha AppLayout também.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { AdminScreen } from '@/components/admin/AdminScreen'

export default function AdminPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState<boolean | null>(null)

  useEffect(() => {
    let pid: string | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        pid = sessao.id
      }
    } catch { /* ignora */ }

    if (!pid) {
      router.replace('/')
      return
    }

    supabase
      .from('participants')
      .select('is_admin')
      .eq('id', pid)
      .maybeSingle()
      .then(({ data }) => {
        const admin = data?.is_admin ?? false
        setIsAdmin(admin)
        if (!admin) {
          router.replace('/inicio')
        }
      })
  }, [router])

  if (isAdmin === null) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-100">
        Verificando permissão...
      </main>
    )
  }
  if (!isAdmin) return null

  return (
      <AdminScreen isAdmin={true} />
  )
}
