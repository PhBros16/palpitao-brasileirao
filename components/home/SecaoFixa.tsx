// SecaoFixa — bloco de seção sempre visível (sem header clicável nem chevron).
// Mesmo enquadramento visual do Accordion, mas estático. Usado nas seções que
// não colapsam (Parcial, Frango, Pódio).

import type { ReactNode } from 'react'

export function SecaoFixa({ titulo, children }: { titulo: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-papel-borda-200 bg-papel-50 p-4">
      <h2 className="mb-3 font-display text-base font-bold text-tinta-300">{titulo}</h2>
      {children}
    </section>
  )
}
