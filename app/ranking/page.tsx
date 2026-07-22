'use client'

// /ranking — envolvida no AppLayout.

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { RankingScreen } from '@/components/ranking/RankingScreen'
import { FrenteFrenteModal } from '@/components/ranking/FrenteFrenteModal'
import { buscarRankingReal, type LinhaRanking } from '@/lib/rankingReal'
import { buscarTrofeusJogador, type TrofeuReal } from '@/lib/trofeusReal'
import { AppLayout } from '@/components/home/AppLayout'
import { Confete } from '@/components/home/Confete'
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

    buscarRankingReal()
      .then((linhas) => {
        setLinhasReais(linhas)
        setDados(montarDadosRanking(linhas))
      })
      .catch((e) => setErro((e as Error).message))

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

  return (
    <AppLayout>
      {erro && (
        <div className="rounded-lg border border-raridade-frango-selo bg-red-50 p-3 text-center font-sans text-sm text-raridade-frango-selo">
          {erro}
        </div>
      )}
      {!dados && !erro && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-100">
          Carregando ranking...
        </div>
      )}
      {dados && (
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
      )}
    </AppLayout>
  )
}

// ─── Helpers (mantidos do arquivo original) ─────────────────────────────────

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

  const novosIds = desbloqueados.map((t) => t.id)
  try {
    localStorage.setItem(chave, JSON.stringify(novosIds))
  } catch { /* ignora */ }

  if (vistosIds.length > 0 && novos.length > 0) {
    onNovos(novos)
  }
}

function ToastNovoTrofeu({ trofeus, onFechar }: { trofeus: TrofeuReal[]; onFechar: () => void }) {
  const [indice, setIndice] = useState(0)
  const [mostrarConfete, setMostrarConfete] = useState(true)

  useEffect(() => {
    setMostrarConfete(true)
    const timerConfete = setTimeout(() => setMostrarConfete(false), 3500)
    return () => clearTimeout(timerConfete)
  }, [indice])

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
    <>
      <Confete ativo={mostrarConfete} quantidade={80} duracao={3500} />
      <div className="fixed bottom-4 right-4 z-[60] w-full max-w-xs animate-in slide-in-from-right duration-500">
        <div className="overflow-hidden rounded-lg border-2 border-dourado-500 bg-gradient-to-br from-dourado-100 to-dourado-50 shadow-2xl">
          <div className="flex items-center justify-between border-b border-dourado-300 bg-dourado-200 px-3 py-1.5">
            <p className="font-display text-[11px] font-bold uppercase tracking-widest text-dourado-800">
              🏆 Troféu Desbloqueado!
            </p>
            <button type="button" onClick={onFechar} className="font-mono text-xs text-dourado-700 hover:text-dourado-900">
              ✕
            </button>
          </div>
          <div className="flex items-center gap-3 p-4">
            <span className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-full bg-gradient-to-br from-dourado-300 to-dourado-500 text-3xl shadow-inner">
              {t.icon}
            </span>
            <div className="flex-1 min-w-0">
              <p className="font-display text-sm font-bold text-tinta-300">{t.label}</p>
              <p className="mt-0.5 font-sans text-[11px] leading-tight text-tinta-200">{t.desc}</p>
            </div>
          </div>
          {trofeus.length > 1 && (
            <div className="flex items-center justify-center gap-1 border-t border-dourado-300 bg-dourado-100 px-3 py-1.5">
              <span className="font-mono text-[9px] uppercase tracking-widest text-dourado-700">
                {indice + 1} de {trofeus.length}
              </span>
            </div>
          )}
        </div>
      </div>
    </>
  )
}
function montarDadosRanking(linhasReais: LinhaRanking[]): DadosRanking {
  return {
    classificacao: linhasReais.map((l) => ({
      nome: l.nome,
      avatar: l.avatar,
      emoji: l.emoji,
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
