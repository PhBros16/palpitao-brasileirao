'use client'

import { useState } from 'react'

export function SecaoAccordion({
  titulo,
  icone,
  children,
  defaultOpen = false,
}: {
  titulo: string
  icone: string
  children: React.ReactNode
  defaultOpen?: boolean
}) {
  const [aberta, setAberta] = useState(defaultOpen)

  return (
    <div className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50 shadow-sm">
      <button
        type="button"
        onClick={() => setAberta(!aberta)}
        className="flex w-full items-center justify-between gap-2 border-b border-papel-borda-200 bg-gradient-to-r from-couro-100 to-couro-50 px-4 py-3 text-left transition-colors hover:from-couro-200 hover:to-couro-100"
      >
        <span className="flex items-center gap-2">
          <span className="text-lg">{icone}</span>
          <span className="font-display text-sm font-bold uppercase tracking-wide text-papel-50">
            {titulo}
          </span>
        </span>
        <span className="font-mono text-lg text-dourado-300">{aberta ? '▲' : '▼'}</span>
      </button>
      {aberta && <div className="p-4">{children}</div>}
    </div>
  )
}
