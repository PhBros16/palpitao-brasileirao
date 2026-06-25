'use client'

// Accordion — header clicável (título + chevron) e conteúdo com abertura suave.
//
// Sem Framer Motion (não está no projeto): a animação usa a técnica CSS de
// grid-template-rows 1fr↔0fr, que anima altura "auto" sem medir o conteúdo.
// Cada seção lembra seu estado no sessionStorage pela `storageKey`.

import { useEffect, useState, type ReactNode } from 'react'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export function Accordion({
  titulo,
  storageKey,
  defaultOpen = false,
  children,
}: {
  titulo: string
  storageKey: string
  defaultOpen?: boolean
  children: ReactNode
}) {
  const [open, setOpen] = useState<boolean>(() => {
    if (typeof window === 'undefined') return defaultOpen
    const v = window.sessionStorage.getItem(storageKey)
    return v === null ? defaultOpen : v === '1'
  })

  useEffect(() => {
    try {
      window.sessionStorage.setItem(storageKey, open ? '1' : '0')
    } catch {
      /* sessionStorage indisponível — ignora */
    }
  }, [open, storageKey])

  return (
    <section className="overflow-hidden rounded-lg border border-papel-borda-200 bg-papel-50">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-2 px-4 py-3 text-left transition-colors hover:bg-papel-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-dourado-300"
      >
        <span className="font-display text-base font-bold text-tinta-300">{titulo}</span>
        <span
          className={cx(
            'font-mono text-xs text-tinta-100 transition-transform duration-300',
            open && 'rotate-180',
          )}
          aria-hidden
        >
          ▼
        </span>
      </button>
      <div
        className={cx(
          'grid transition-all duration-300 ease-out',
          open ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0',
        )}
      >
        <div className="overflow-hidden">
          <div className="px-4 pb-4 pt-1">{children}</div>
        </div>
      </div>
    </section>
  )
}
