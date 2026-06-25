'use client'

// Frango da Rodada — o último colocado, com foto editada (tradição do grupo) e
// texto de resenha. Admin-driven (mock aqui). Foto com fallback se faltar/quebrar.

import { useState } from 'react'
import type { FrangoRodada } from './tipos'

export function SecaoFrango({ frango }: { frango: FrangoRodada | null }) {
  const [erroFoto, setErroFoto] = useState(false)

  if (!frango) {
    return <p className="font-sans text-sm italic text-tinta-100">Sem frango por enquanto — ninguém vacilou ainda. 🐔</p>
  }

  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <div className="w-full max-w-[280px] overflow-hidden rounded-lg border-2 border-raridade-frango-selo bg-papel-200">
        {frango.fotoUrl && !erroFoto ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={frango.fotoUrl}
            alt={`Frango da rodada: ${frango.nome}`}
            className="block aspect-video w-full object-cover"
            onError={() => setErroFoto(true)}
          />
        ) : (
          <div className="flex aspect-video w-full items-center justify-center text-5xl">🐔</div>
        )}
      </div>
      <div className="font-display text-lg font-bold uppercase tracking-wide text-raridade-frango-selo">
        😂 {frango.nome}
      </div>
      <p className="font-sans text-sm italic leading-snug text-tinta-200">“{frango.texto}”</p>
    </div>
  )
}
