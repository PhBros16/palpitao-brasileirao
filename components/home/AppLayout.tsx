'use client'

// AppLayout — wrapper de todas as páginas logadas.
//
// Renderiza sempre: Header do usuário + Nav de abas.
// Player de música só aparece na aba "Início" (/inicio).
// O conteúdo específico da página vai como children, envolvido em PageTransition.
//
// Perfil vem do cache localStorage (instantâneo) + revalida do Supabase em
// background. Isso elimina o "trava/carrega" ao trocar de aba.

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buscarAvatarEmoji } from '@/lib/avatarUpload'
import { lerPerfilCache, salvarPerfilCache } from '@/lib/perfilCache'
import { HeaderUsuario } from './HeaderUsuario'
import { NavAbas } from './NavAbas'
import { PlayerMusica } from './PlayerMusica'
import { PageTransition } from './PageTransition'

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
  const [prontoParaRenderizar, setProntoParaRenderizar] = useState(false)

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

    // 1. Tenta carregar do cache (instantâneo)
    const cache = lerPerfilCache(s.id)
    if (cache) {
      setIsAdmin(cache.isAdmin)
      setAvatar(cache.avatar)
      setEmoji(cache.emoji)
      setProntoParaRenderizar(true)
      // 2. Revalida em background (não bloqueia render)
      revalidarPerfil(s.id, s.nome)
    } else {
      // Sem cache: busca síncrono e só então libera render
      carregarPerfilInicial(s.id, s.nome)
    }
  }, [])

  async function carregarPerfilInicial(pid: string, nome: string) {
    try {
      const [{ data: part }, ae] = await Promise.all([
        supabase.from('participants').select('is_admin').eq('id', pid).maybeSingle(),
        buscarAvatarEmoji(pid),
      ])
      const isAdminNovo = part?.is_admin ?? false
      setIsAdmin(isAdminNovo)
      setAvatar(ae.avatar)
      setEmoji(ae.emoji)
      salvarPerfilCache({
        participantId: pid,
        nome,
        isAdmin: isAdminNovo,
        avatar: ae.avatar,
        emoji: ae.emoji,
      })
    } catch { /* silencioso */ }
    finally { setProntoParaRenderizar(true) }
  }

  async function revalidarPerfil(pid: string, nome: string) {
    try {
      const [{ data: part }, ae] = await Promise.all([
        supabase.from('participants').select('is_admin').eq('id', pid).maybeSingle(),
        buscarAvatarEmoji(pid),
      ])
      const isAdminNovo = part?.is_admin ?? false
      setIsAdmin(isAdminNovo)
      setAvatar(ae.avatar)
      setEmoji(ae.emoji)
      salvarPerfilCache({
        participantId: pid,
        nome,
        isAdmin: isAdminNovo,
        avatar: ae.avatar,
        emoji: ae.emoji,
      })
    } catch { /* silencioso — se falhar, mantém o cache */ }
  }

  function recarregarAposEdicao() {
    if (!sessao) return
    revalidarPerfil(sessao.id, sessao.nome)
  }

  if (!sessao || !prontoParaRenderizar) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-100">
        Carregando...
      </main>
    )
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
          onPerfilAlterado={recarregarAposEdicao}
        />
        <NavAbas isAdmin={isAdmin} />
        {mostrarPlayer && <PlayerMusica />}

        <PageTransition>{children}</PageTransition>
      </div>
    </main>
  )
}
