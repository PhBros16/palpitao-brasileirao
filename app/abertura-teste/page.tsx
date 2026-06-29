'use client'

// Conferência visual da Abertura Cinematográfica. Rota: /abertura-teste.
// 14 jogadores mockados: 11 titulares (formação 4-3-3) + 3 banco.
// Primeiro da lista com ehVoce=true simula o jogador logado.

import { useState } from 'react'
import { AberturaScreen } from '@/components/abertura'
import type { JogadorAbertura } from '@/components/abertura'

const PLAYERS: JogadorAbertura[] = [
  // GK
  { nome: 'Gabriel F.', iniciais: 'GF' },
  // DEF
  { nome: 'Rafael S.', iniciais: 'RS' },
  { nome: 'Lucas M.', iniciais: 'LM', ehVoce: true },
  { nome: 'Pedro A.', iniciais: 'PA' },
  { nome: 'Thiago C.', iniciais: 'TC' },
  // MID
  { nome: 'Bruno V.', iniciais: 'BV' },
  { nome: 'Diego N.', iniciais: 'DN' },
  { nome: 'Mateus R.', iniciais: 'MR' },
  // FWD
  { nome: 'André P.', iniciais: 'AP' },
  { nome: 'Felipe O.', iniciais: 'FO' },
  { nome: 'Caio L.', iniciais: 'CL' },
  // BANCO
  { nome: 'Renato G.', iniciais: 'RG' },
  { nome: 'Vinícius T.', iniciais: 'VT' },
  { nome: 'Igor B.', iniciais: 'IB' },
]

export default function AberturaTestePage() {
  const [logado, setLogado] = useState<string | null>(null)

  if (logado) {
    return (
      <div
        className="flex h-screen w-screen flex-col items-center justify-center gap-4 bg-[#06180f]"
        style={{ fontFamily: 'monospace' }}
      >
        <p className="text-2xl font-bold text-[#d4af37]">Bem-vindo, {logado}!</p>
        <button
          onClick={() => setLogado(null)}
          className="rounded border border-[#d4af37]/40 px-4 py-2 text-sm text-[#d4af37]/60 hover:border-[#d4af37]/70"
        >
          Voltar
        </button>
      </div>
    )
  }

  return <AberturaScreen players={PLAYERS} onLogin={setLogado} />
}
