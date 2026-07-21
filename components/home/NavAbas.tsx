'use client'

// NavAbas — barra de navegação horizontal (mobile-first, scroll horizontal).
//
// 6 abas fixas + 1 condicional (Admin, se participants.is_admin=true).
// Indicador ativo (fundo couro) desliza suavemente entre as abas usando
// layoutId do Framer Motion. Press-down feedback ao tocar.

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { motion } from 'framer-motion'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

interface Aba {
  key: string
  label: string
  emoji: string
  href: string
  adminOnly?: boolean
}

const ABAS: Aba[] = [
  { key: 'inicio',    label: 'Início',    emoji: '🏠', href: '/inicio' },
  { key: 'palpites',  label: 'Palpites',  emoji: '✏️', href: '/palpites' },
  { key: 'rodada',    label: 'Rodada',    emoji: '📊', href: '/rodada' },
  { key: 'ranking',   label: 'Ranking',   emoji: '🏆', href: '/ranking' },
  { key: 'historico', label: 'Histórico', emoji: '📅', href: '/historico' },
  { key: 'guia',      label: 'Guia',      emoji: '📖', href: '/guia' },
  { key: 'admin',     label: 'Admin',     emoji: '⚙️', href: '/admin', adminOnly: true },
]

export function NavAbas({ isAdmin }: { isAdmin: boolean }) {
  const pathname = usePathname()
  const abasVisiveis = ABAS.filter((a) => !a.adminOnly || isAdmin)

  return (
    <nav className="overflow-x-auto rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm scrollbar-tema">
      <div className="flex gap-1 p-1.5">
        {abasVisiveis.map((aba) => {
          const ativa = pathname === aba.href || pathname.startsWith(aba.href + '/')
          return (
            <Link
              key={aba.key}
              href={aba.href}
              className="relative flex-shrink-0"
            >
              <motion.div
                whileTap={{ scale: 0.94 }}
                transition={{ duration: 0.15, ease: [0.32, 0.72, 0, 1] }}
                className={cx(
                  'relative flex items-center gap-1.5 rounded-md px-3 py-1.5 font-mono text-[11px] font-bold uppercase tracking-widest transition-colors duration-200',
                  ativa
                    ? 'text-dourado-50'
                    : 'text-tinta-200 hover:bg-papel-200',
                )}
              >
                {/* Indicador ativo — desliza suavemente entre abas */}
                {ativa && (
                  <motion.span
                    layoutId="nav-indicator"
                    className="absolute inset-0 rounded-md bg-couro-300"
                    transition={{
                      type: 'spring',
                      stiffness: 380,
                      damping: 32,
                    }}
                  />
                )}
                <span className="relative z-10 text-sm">{aba.emoji}</span>
                <span className="relative z-10">{aba.label}</span>
              </motion.div>
            </Link>
          )
        })}
      </div>
    </nav>
  )
}
