'use client'

// AppLayout — wrapper de todas as páginas logadas.
//
// Renderiza sempre: Header do usuário + Nav de abas.
// Player de música só aparece na aba "Início" (/inicio).
// O conteúdo específico da página vai como children.

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buscarAvatarEmoji } from '@/lib/avatarUpload'
import { HeaderUsuario } from './HeaderUsuario'
import { NavAbas } from './NavAbas'
import { PlayerMusica } from './PlayerMusica'

interface Sessao {
  id: string
  nome: string
}

export function AppLayout({
  children,
  onAtualizar,
  atualizando = false,
}: {
  children: React.ReactNode
  onAtualizar?: () => void
  atualizando?: boolean
}) {
  const router = useRouter()
  const pathname = usePathname()
  const [sessao, setSessao] = useState<Sessao | null>(null)
  const [isAdmin, setIsAdmin] = useState(false)
  const [avatar, setAvatar] = useState<string | null>(null)
  const [emoji, setEmoji] = useState<string | null>(null)
  const [carregando, setCarregando] = useState(true)

  useEffect(() => {
    let s: Sessao | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) s = JSON.parse(raw)
    } catch { /* ignora */ }

    if (!s) {
      router.replace('/')
      return
    }
    setSessao(s)
    carregarPerfil(s.id)
  }, [])

  async function carregarPerfil(pid: string) {
    setCarregando(true)
    try {
      const [{ data: part }, ae] = await Promise.all([
        supabase.from('participants').select('is_admin').eq('id', pid).maybeSingle(),
        buscarAvatarEmoji(pid),
      ])
      setIsAdmin(part?.is_admin ?? false)
      setAvatar(ae.avatar)
      setEmoji(ae.emoji)
    } catch { /* silencioso */ }
    finally { setCarregando(false) }
  }

  if (!sessao || carregando) {
    return <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-100">Carregando...</main>
  }

  const mostrarPlayer = pathname === '/inicio'

  return (
    <main className="min-h-screen bg-papel-200 px-3 pb-10 pt-4">
      <div className="mx-auto max-w-md space-y-3">
        <HeaderUsuario
          participantId={sessao.id}
          nome={sessao.nome}
          avatar={avatar}
          emoji={emoji}
          onAtualizar={onAtualizar ?? (() => {})}
          atualizando={atualizando}
          onPerfilAlterado={() => carregarPerfil(sessao.id)}
        />
        <NavAbas isAdmin={isAdmin} />
        {mostrarPlayer && <PlayerMusica />}

        {children}
      </div>
    </main>
  )
}
