'use client'

import { useEffect, useState } from 'react'
import { CampeonatoScreen } from '@/components/campeonato/CampeonatoScreen'
import { buscarDadosCampeonato, type DadosCampeonato } from '@/lib/campeonatoReal'
import { lerCache, salvarCache, CACHE_TTL } from '@/lib/dataCache'

export default function CampeonatoPage() {
  const [dados, setDados] = useState<DadosCampeonato | null>(
    () => lerCache<DadosCampeonato>('campeonato', CACHE_TTL.MEDIO),
  )
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarDadosCampeonato()
      .then((d) => {
        setDados(d)
        salvarCache('campeonato', d)
        setErro(null)
      })
      .catch((e) => {
        // Já tem tabela em tela (veio do cache)? Mantém ela visível em vez
        // de trocar por uma mensagem de erro.
        setDados((atual) => {
          if (!atual) setErro((e as Error).message)
          return atual
        })
      })
  }, [])

  if (erro && !dados) {
    return (
      <div className="rounded-lg border border-raridade-frango-selo bg-red-50 p-3 text-center font-sans text-sm text-raridade-frango-selo">
        {erro}
      </div>
    )
  }

  if (!dados) {
    return (
      <div className="rounded-lg border border-papel-borda-200 bg-papel-50 p-6 text-center font-sans text-sm text-tinta-100">
        Calculando tabela oficial...
      </div>
    )
  }

  return <CampeonatoScreen dados={dados} />
}
