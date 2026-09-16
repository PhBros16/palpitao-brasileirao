'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { PalpitesRodada } from '@/components/palpites'
import type { Palpite } from '@/components/palpites/CardJogo'
import { buscarRodadaAtivaPalpites, buscarPalpitesExistentes, salvarPalpitesReais, type RodadaPalpites } from '@/lib/palpitesReais'
import { buscarMascaraPalpite, definirMascaraPalpite } from '@/lib/rodadaAdmin'
import { lerCache, salvarCache, CACHE_TTL } from '@/lib/dataCache'

export default function PalpitesPage() {
  const router = useRouter()
  const [participantId, setParticipantId] = useState<string | null>(null)
  const [rodada, setRodada] = useState<RodadaPalpites | null>(
    () => lerCache<RodadaPalpites>('rodada_ativa', CACHE_TTL.CURTO),
  )
  const [palpitesIniciais, setPalpitesIniciais] = useState<Record<string, Palpite>>({})
  const [erro, setErro] = useState<string | null>(null)
  const [mascaraAtiva, setMascaraAtiva] = useState(false)
  const [mascaraCarregando, setMascaraCarregando] = useState(false)

  useEffect(() => {
    try {
      const sessaoRaw = localStorage.getItem('palpitao_sessao')
      if (!sessaoRaw) {
        router.push('/')
        return
      }
      const sessao = JSON.parse(sessaoRaw) as { id: string; nome: string }
      if (!sessao || !sessao.id) {
        router.push('/')
        return
      }
      setParticipantId(sessao.id)

      // Se já tem uma rodada em cache, mostra os palpites daquela rodada
      // (também em cache) imediatamente, sem esperar a rede.
      const rodadaCache = lerCache<RodadaPalpites>('rodada_ativa', CACHE_TTL.CURTO)
      if (rodadaCache?.roundId) {
        const palpitesCache = lerCache<Record<string, Palpite>>(
          `palpites_${rodadaCache.roundId}_${sessao.id}`,
          CACHE_TTL.CURTO,
        )
        if (palpitesCache) setPalpitesIniciais(palpitesCache)
      }

      buscarRodadaAtivaPalpites()
        .then(async (r) => {
          setRodada(r)
          salvarCache('rodada_ativa', r)
          if (r && r.roundId) {
            try {
              const existentes = await buscarPalpitesExistentes(r.roundId, sessao.id)
              setPalpitesIniciais(existentes ?? {})
              salvarCache(`palpites_${r.roundId}_${sessao.id}`, existentes ?? {})
            } catch {
              setPalpitesIniciais({})
            }
            if (r.ocultarPalpitesDisponivel) {
              try { setMascaraAtiva(await buscarMascaraPalpite(r.roundId, sessao.id)) } catch { /* mantém o valor atual */ }
            }
          }
        })
        .catch((e) => setErro(`Não consegui carregar a rodada: ${(e as Error).message}`))
    } catch {
      router.push('/')
    }
  }, [router])

  async function alternarMascara() {
    if (!rodada?.roundId || !participantId) return
    const novoValor = !mascaraAtiva
    setMascaraCarregando(true)
    try {
      await definirMascaraPalpite(rodada.roundId, participantId, novoValor)
      setMascaraAtiva(novoValor)
    } catch {
      // mantém o estado anterior se der erro
    } finally {
      setMascaraCarregando(false)
    }
  }

  return (
    <>
      {erro && (
        <div className="rounded-lg border border-raridade-frango-selo bg-red-50 p-3 text-center font-sans text-sm text-raridade-frango-selo dark:bg-red-950/40">
          {erro}
        </div>
      )}
      {!erro && !rodada && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-100">
          Carregando palpites...
        </div>
      )}
      {rodada && !rodada.roundId && (
        <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-200">
          Nenhuma rodada com palpites abertos no momento.
        </div>
      )}
      {rodada && rodada.roundId && participantId && (
        <>
          {rodada.ocultarPalpitesDisponivel && (
            <button
              type="button"
              onClick={alternarMascara}
              disabled={mascaraCarregando}
              className="mb-3 flex w-full items-center justify-between rounded-lg border border-papel-borda-200 bg-papel-50 px-3 py-2.5 disabled:opacity-60"
            >
              <span className="font-sans text-xs text-tinta-200">
                🔒 Mascarar meus palpites
                <span className="block text-[10px] text-tinta-100">Esconde seus placares dos outros até o resultado sair — sua pontuação nunca fica escondida</span>
              </span>
              <span className={mascaraAtiva ? 'flex h-6 w-11 flex-shrink-0 items-center rounded-full bg-dourado-500 px-0.5' : 'flex h-6 w-11 flex-shrink-0 items-center rounded-full bg-papel-borda-300 px-0.5'}>
                <span className={mascaraAtiva ? 'h-5 w-5 translate-x-5 rounded-full bg-white shadow transition-transform' : 'h-5 w-5 translate-x-0 rounded-full bg-white shadow transition-transform'} />
              </span>
            </button>
          )}
          <PalpitesRodada
            rodadaNome={rodada.nome}
            jogos={rodada.jogos}
            palpitesIniciais={palpitesIniciais}
            onSalvar={(palpites) => salvarPalpitesReais(participantId, palpites)}
          />
        </>
      )}
    </>
  )
}
