'use client'

import { useEffect, useState } from 'react'
import { CampeonatoScreen } from '@/components/campeonato/CampeonatoScreen'
import { buscarDadosCampeonato, type DadosCampeonato } from '@/lib/campeonatoReal'

export default function CampeonatoPage() {
  const [dados, setDados] = useState<DadosCampeonato | null>(null)
  const [erro, setErro] = useState<string | null>(null)

  useEffect(() => {
    buscarDadosCampeonato()
      .then(setDados)
      .catch((e) => setErro((e as Error).message))
  }, [])

  if (erro) {
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
