'use client'

// /ranking — Fase A do Ranking real.
//
// Busca dados reais do Supabase (via lib/rankingReal) e monta o DadosRanking
// que o RankingScreen espera. Só a aba "Classificação" tem dados reais nesta
// fase — Evolução, Estatísticas e Troféus vão com mock vazio até serem
// implementadas em fases seguintes.
//
// Clique numa linha da Classificação → abre FrenteFrenteModal comparando
// o participante logado (localStorage 'palpitao_sessao') com o clicado.
// Sem sessão ou clicando em si mesmo → cai no líder do ranking como fallback.

import { useEffect, useState } from 'react'
import { RankingScreen } from '@/components/ranking/RankingScreen'
import { FrenteFrenteModal } from '@/components/ranking/FrenteFrenteModal'
import { buscarRankingReal, type LinhaRanking } from '@/lib/rankingReal'
import type { DadosRanking } from '@/components/ranking/tipos'

export default function RankingPage() {
  const [dados, setDados] = useState<DadosRanking | null>(null)
  const [linhasReais, setLinhasReais] = useState<LinhaRanking[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [frenteFrente, setFrenteFrente] = useState<{ a: LinhaRanking; b: LinhaRanking } | null>(null)

  useEffect(() => {
    buscarRankingReal()
      .then((linhas) => {
        setLinhasReais(linhas)
        setDados(montarDadosRanking(linhas))
      })
      .catch((e) => setErro((e as Error).message))
  }, [])

  function abrirFrenteFrenteReal(nome: string) {
    const clicada = linhasReais.find((l) => l.nome === nome)
    if (!clicada) return

    // Jogador A = participante logado; senão, líder
    let jogadorA: LinhaRanking | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (raw) {
        const sessao = JSON.parse(raw) as { id: string; nome: string }
        jogadorA = linhasReais.find((l) => l.participantId === sessao.id) ?? null
      }
    } catch { /* ignora */ }

    if (!jogadorA || jogadorA.participantId === clicada.participantId) {
      jogadorA = linhasReais[0] ?? null
    }
    if (!jogadorA || jogadorA.participantId === clicada.participantId) return

    setFrenteFrente({ a: jogadorA, b: clicada })
  }

  if (erro) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-raridade-frango-selo">
        {erro}
      </main>
    )
  }
  if (!dados) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-papel-200 p-6 text-center font-sans text-sm text-tinta-100">
        Carregando ranking...
      </main>
    )
  }

  return (
    <>
      <RankingScreen dados={dados} onClickLinha={abrirFrenteFrenteReal} />
      {frenteFrente && (
        <FrenteFrenteModal
          jogadorA={{ participantId: frenteFrente.a.participantId, nome: frenteFrente.a.nome }}
          jogadorB={{ participantId: frenteFrente.b.participantId, nome: frenteFrente.b.nome }}
          onFechar={() => setFrenteFrente(null)}
        />
      )}
    </>
  )
}

// ─── Adaptador Supabase → DadosRanking ───────────────────────────────────────

function montarDadosRanking(linhasReais: LinhaRanking[]): DadosRanking {
  return {
    // Classificação real
    classificacao: linhasReais.map((l) => ({
      nome: l.nome,
      pontos: l.total,
      cravadas: l.cravadas,
      vencedor: l.vencedor,
      saldo: l.saldo,
      projecao: l.projecaoPct ?? 0,
    })),
    // Outras 3 abas: mock vazio (fases seguintes)
    evolucao: [],
    totalRodadas: 0,
    estatisticas: {
      ptsPorRodada: [],
      cravadas: 0,
      vencedor: 0,
      saldo: 0,
      mediaPts: 0,
      sequencias: [],
    },
    trofeus: [],
    totalTrofeus: 0,
  }
}
