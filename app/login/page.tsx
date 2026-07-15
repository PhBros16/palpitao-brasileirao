'use client'

// Login real — Fase 4: participantes vêm do Supabase (tabela `participants`),
// não mais mock. PIN ainda é validado no client (CLAUDE.md §7 Fase 5 pendente:
// isso precisa virar rota server-side antes de produção com dados sensíveis
// de verdade — por ora os PINs são só "0000" placeholder, risco baixo).
//
// Sessão: guardada em localStorage (chave 'palpitao_sessao') só com
// participant_id + nome. Suficiente pra próxima etapa (Palpites) saber quem
// está "logado" sem precisar de auth real ainda.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { LoginGramado, type LoginPlayer } from '@/components/login'
import { buscarJogadoresLogin } from '@/lib/participantesReais'

export default function LoginPage() {
  const router = useRouter()
  const [jogadores, setJogadores] = useState<LoginPlayer[] | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarJogadoresLogin()
      .then(setJogadores)
      .catch((e) => {
        // eslint-disable-next-line no-console
        console.error('[login] falha ao buscar participantes:', e)
        setErro('Não consegui carregar os participantes. Confere a conexão com o Supabase.')
      })
  }, [])

  function handleEntrar(player: LoginPlayer) {
    localStorage.setItem('palpitao_sessao', JSON.stringify({ id: player.id, nome: player.nome }))
    router.push('/palpites')
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-campo-noturno p-6 text-center font-sans text-sm text-papel-100">
        {erro}
      </main>
    )
  }

  if (!jogadores) return <main className="min-h-screen bg-campo-noturno" />

  return <LoginGramado players={jogadores} onEntrar={handleEntrar} />
}
