'use client'

// /ranking — Fase completa do Ranking.
//
// Busca dados reais do Supabase (via lib/rankingReal) e monta o DadosRanking.
// Aba Estatísticas + Sala de Troféus buscam dados por conta própria (via
// lib/statsReal / lib/trofeusReal) usando a sessão do localStorage.
//
// Notificação de novo troféu: ao carregar, detecta troféus desbloqueados
// desde a última visita (comparando com localStorage 'palpitao_trofeus_vistos')
// e mostra um toast animado no canto. Auto-fecha em 6s.
//
// Sem sessão → redireciona pra /.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RankingScreen } from '@/components/ranking/RankingScreen'
import { FrenteFrenteModal } from '@/components/ranking/FrenteFrenteModal'
import { buscarRankingReal, type LinhaRanking } from '@/lib/rankingReal'
import { buscarTrofeusJogador, type TrofeuReal } from '@/lib/trofeusReal'
import type { DadosRanking } from '@/components/ranking/tipos'

const CHAVE_TROFEUS_VISTOS = 'palpitao_trofeus_vistos'

export default function RankingPage() {
  const router = useRouter()
  const [dados, setDados] = useState<DadosRanking | null>(null)
  const [linhasReais, setLinhasReais] = useState<LinhaRanking[]>([])
  const [erro, setErro] = useState<string | null>(null)
  const [frenteFrente, setFrenteFrente] = useState<{ a: LinhaRanking; b: LinhaRanking } | null>(null)
  const [novosTrofeus, setNovosTrofeus] = useState<TrofeuReal[]>([])

  useEffect(() => {
    // Redirect defensivo: sem sessão → volta pra abertura
    let sessao: { id: string; nome: string } | null = null
    try {
      const raw = localStorage.getItem('palpitao_sessao')
      if (!raw) {
        router.replace('/')
        return
      }
      sessao = JSON.parse(raw)
    } catch {
      router.replace('/')
      return
    }

    // Carrega ranking
    buscarRankingReal()
      .then((linhas) => {
        setLinhasReais(linhas)
        setDados(montarDadosRanking(linhas))
      })
      .catch((e) => setErro((e as Error).message))

    // Verifica troféus novos (silencioso, não bloqueia se falhar)
    if (sessao?.id) {
      buscarTrofeusJogador(sessao.id)
        .then((res) => {
          detectarNovosTrofeus(sessao!.id, res.trofeus, setNovosTrofeus)
        })
        .catch(() => { /* silencioso */ })
    }
  }, [router])

  function abrirFrenteFrenteReal(nome: string) {
    const clicada = linhasReais.find((l) => l.nome === nome)
    if (!clicada) return

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
      {novosTrofeus.length > 0 && (
        <ToastNovoTrofeu
          trofeus={novosTrofeus}
          onFechar={() => setNovosTrofeus([])}
        />
      )}
    </>
  )
}

// ─── Detecção de troféus novos ───────────────────────────────────────────────

function detectarNovosTrofeus(
  participantId: string,
  trofeus: TrofeuReal[],
  onNovos: (novos: TrofeuReal[]) => void,
) {
  const chave = `${CHAVE_TROFEUS_VISTOS}_${participantId}`
  let vistosIds: string[] = []
  try {
    const raw = localStorage.getItem(chave)
    if (raw) vistosIds = JSON.parse(raw)
  } catch { /* ignora */ }

  const desbloqueados = trofeus.filter((t) => t.unlocked)
  const novos = desbloqueados.filter((t) => !vistosIds.includes(t.id))

  // Atualiza a lista de vistos ANTES de notificar — evita repetir se o
  // usuário navegar de volta pra /ranking na mesma sessão.
  const novosIds = desbloqueados.map((t) => t.id)
  try {
    localStorage.setItem(chave, JSON.stringify(novosIds))
  } catch { /* ignora */ }

  // Só notifica se realmente há novos E se não é a primeira visita
  // (primeira visita = vistosIds vazio → considera tudo como "já visto"
  // pra não bombardear com 20 troféus de uma vez).
  if (vistosIds.length > 0 && novos.length > 0) {
    onNovos(novos)
  }
}

// ─── Toast de novo troféu ────────────────────────────────────────────────────

function ToastNovoTrofeu({ trofeus, onFechar }: { trofeus: TrofeuReal[]; onFechar: () => void }) {
  const [indice, setIndice] = useState(0)

  // Auto-avanço a cada 4s; fecha depois do último
  useEffect(() => {
    const timer = setTimeout(() => {
      if (indice + 1 >= trofeus.length) {
        onFechar()
      } else {
        setIndice(indice + 1)
      }
    }, 4000)
    return () => clearTimeout(timer)
  }, [indice, trofeus.length, onFechar])

  const t = trofeus[indice]
  if (!t) return null

  return (
    <div className="fixed bottom-4 right-4 z-[60] w-full max-w-xs animate-in slide-in-from-right duration-500">
      <div className="overflow-hidden rounded-lg border-2 border-dourado-500 bg-gradient-to-br from-dourado-100 to-dourado-50 shadow-2xl">
        {/* Cabeçalho */}
        <div className="flex items-center justify-between border-b border-dourado-300 bg-dourado-200 px-3 py-1.5">
          <p className="font-display text-[11px] font-bold uppercase tracking-widest text-dourado-800">
            🏆 Troféu Desbloqueado!
          </p>
          <button
            type="button"
            onClick={onFechar}
            className="font-mono text-xs text-dourado-700 hover:text-dourado-900"
          >
            ✕
          </button>
        </div>

        {/* Conteúdo */}
        <div className="flex items-center gap-3 p-4">
          <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dourado-300 to-dourado-500 text-3xl shadow-inner">
            {t.icon}
          </span>
          <div className="flex-1 min-w-0">
            <p className="font-display text-sm font-bold text-tinta-300">{t.label}</p>
            <p className="mt-0.5 font-sans text-[11px] leading-tight text-tinta-200">{t.desc}</p>
          </div>
        </div>

        {/* Indicador de progresso (se tem mais de 1) */}
        {trofeus.length > 1 && (
          <div className="flex items-center justify-center gap-1 border-t border-dourado-300 bg-dourado-100 px-3 py-1.5">
            <span className="font-mono text-[9px] uppercase tracking-widest text-dourado-700">
              {indice + 1} de {trofeus.length}
            </span>
          </div>
        )}
      </div>
    </div>
  )
}

// ─── Adaptador ───────────────────────────────────────────────────────────────

function montarDadosRanking(linhasReais: LinhaRanking[]): DadosRanking {
  return {
    classificacao: linhasReais.map((l) => ({
      nome: l.nome,
      pontos: l.total,
      cravadas: l.cravadas,
      vencedor: l.vencedor,
      saldo: l.saldo,
      projecao: l.projecaoPct ?? 0,
    })),
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
