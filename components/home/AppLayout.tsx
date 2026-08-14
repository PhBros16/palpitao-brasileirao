'use client'

// AppLayout — wrapper de todas as páginas logadas.
//
// Renderiza sempre: FundoAnimado + LuzesAmbiente + Header + Nav.
// Player de música só aparece na aba "Início" (/inicio).
//
// Perfil vem do cache localStorage (instantâneo) + revalida em background.
// Renderiza sempre, sem loading — zero delay entre trocas de aba.
//
// Padding-top: usa max(safe-area-inset-top, 56px) pra proteger contra o
// Dynamic Island do iPhone (que é maior que o notch tradicional e não é
// coberto pela safe-area padrão quando expandido).

import { useEffect, useState } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { supabase } from '@/lib/supabase'
import { buscarAvatarEmoji } from '@/lib/avatarUpload'
import { lerPerfilCache, salvarPerfilCache } from '@/lib/perfilCache'
import { HeaderUsuario } from './HeaderUsuario'
import { NavAbas } from './NavAbas'
import { PlayerMusica } from './PlayerMusica'
import { FundoAnimado } from './FundoAnimado'
import { SkeletonHeader, SkeletonNav, SkeletonConteudo } from './AppLayoutSkeleton'
import { LuzesAmbiente } from './LuzesAmbiente'
import { useAtualizarHeader } from './AtualizarContext'

interface Sessao {
  id: string
  nome: string
}

// Padding top mínimo que cobre Dynamic Island expandido do iPhone.
// max(safe-area, 56px) garante que dispositivos sem notch tb têm folga
// bacana, e iPhones com Dynamic Island ganham 56px de proteção.
const PADDING_TOP_CSS = 'max(env(safe-area-inset-top), 72px)'

export function AppLayout({
  children,
}: {
  children: React.ReactNode
}) {
  const { onAtualizar, atualizando } = useAtualizarHeader()
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

    // Sempre renderiza IMEDIATAMENTE (com cache ou vazio)
    const cache = lerPerfilCache(s.id)
    if (cache) {
      setIsAdmin(cache.isAdmin)
      setAvatar(cache.avatar)
      setEmoji(cache.emoji)
    }
    setProntoParaRenderizar(true)

    // Revalida em background — não bloqueia
    revalidarPerfil(s.id, s.nome)
  }, [])

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
    } catch { /* silencioso */ }
  }

  function recarregarAposEdicao() {
    if (!sessao) return
    revalidarPerfil(sessao.id, sessao.nome)
  }

  if (!sessao || !prontoParaRenderizar) {
    return (
      <main
        className="relative min-h-screen px-3 pb-10"
        style={{ paddingTop: PADDING_TOP_CSS }}
      >
        <FundoAnimado />
        <LuzesAmbiente />
        <div className="relative mx-auto max-w-md space-y-3">
          <SkeletonHeader />
          <SkeletonNav />
          <SkeletonConteudo />
        </div>
      </main>
    )
  }

  const mostrarPlayer = pathname === '/inicio'

  return (
    <main
      className="relative min-h-screen px-3 pb-10"
      style={{ paddingTop: PADDING_TOP_CSS }}
    >
      <FundoAnimado />
      <LuzesAmbiente />
      <div className="relative mx-auto max-w-md space-y-3">
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

        {children}
      </div>
    </main>
  )
}
