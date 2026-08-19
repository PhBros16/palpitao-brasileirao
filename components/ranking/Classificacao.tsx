'use client'

// Classificação — pódio top 3 + tabela completa.
// Linhas clicáveis se onClickLinha for passado (abre Frente a Frente).
// Linhas da tabela + colunas do pódio entram em cascata (stagger).

import { motion } from 'framer-motion'
import { CardEnvelope } from '@/components/home/CardEnvelope'
import type { ClassificacaoLinha } from './tipos'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// "Victor Simões" -> "Victor S." — evita que nomes longos estourem a
// coluna da tabela. Nomes de uma palavra só ficam como estão.
function abreviarNome(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length <= 1) return nome
  return `${parts[0]} ${parts[parts.length - 1][0]}.`
}

const containerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.04,
      delayChildren: 0.1,
    },
  },
}

const linhaVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.32,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

const podioContainerVariants = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.12,
      delayChildren: 0.05,
    },
  },
}

const podioColunaVariants = {
  hidden: { opacity: 0, y: 20 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.45,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

function AvatarMini({ avatar, nome }: { avatar: string | null | undefined; nome: string }) {
  if (avatar) {
    return (
      <span className="flex h-6 w-6 flex-shrink-0 overflow-hidden rounded-full border border-dourado-300 bg-papel-100">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={avatar} alt={nome} className="h-full w-full object-cover" />
      </span>
    )
  }
  return (
    <span className="flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border border-dourado-300 bg-dourado-100 font-mono text-[9px] font-bold text-dourado-700">
      {getIniciais(nome)}
    </span>
  )
}

function ColunaPodio({
  linha,
  lugar,
  altura,
  base,
  medalha,
}: {
  linha?: ClassificacaoLinha
  lugar: number
  altura: string
  base: string
  medalha: string
}) {
  if (!linha) return <div className="flex-1" />
  return (
    <motion.div
      variants={podioColunaVariants}
      className="flex flex-1 flex-col items-center justify-end gap-1"
    >
      <span className="text-xl leading-none">{medalha}</span>
      <span className="max-w-full truncate text-center font-sans text-xs font-semibold text-tinta-300">
        {linha.nome}
      </span>
      <div className={cx('flex w-full flex-col items-center justify-start rounded-t-md pt-1.5', altura, base)}>
        <span className="font-display text-lg font-bold leading-none text-tinta-300">{lugar}º</span>
        <span className="mt-0.5 font-mono text-[10px] font-bold text-tinta-200">{linha.pontos}</span>
      </div>
    </motion.div>
  )
}

export function Classificacao({
  linhas,
  onClickLinha,
}: {
  linhas: ClassificacaoLinha[]
  /** Opcional. Se passado, cada linha da tabela vira clicável. */
  onClickLinha?: (linha: ClassificacaoLinha) => void
}) {
  const clicavel = !!onClickLinha
  return (
    <div className="flex flex-col gap-4">
      {/* Pódio dentro do card padrão */}
      <CardEnvelope titulo="🏆 Pódio Atual">
        <motion.div
          variants={podioContainerVariants}
          initial="hidden"
          animate="visible"
          className="flex items-end gap-2 px-3 py-3"
        >
          <ColunaPodio linha={linhas[1]} lugar={2} altura="h-16" base="bg-prata-100" medalha="🥈" />
          <ColunaPodio linha={linhas[0]} lugar={1} altura="h-24" base="bg-dourado-300" medalha="👑" />
          <ColunaPodio linha={linhas[2]} lugar={3} altura="h-12" base="bg-bronze-100" medalha="🥉" />
        </motion.div>
      </CardEnvelope>

      {/* Tabela dentro do card padrão */}
      <CardEnvelope titulo="📊 Classificação Geral">
        <div className="overflow-x-auto">
          <table className="w-full table-fixed border-separate border-spacing-0">
            <colgroup>
              <col className="w-8" />
              <col className="w-[108px]" />
              <col className="w-12" />
              <col className="w-11" />
              <col className="w-11" />
              <col className="w-11" />
              <col className="w-12" />
            </colgroup>
            <thead>
              <tr className="font-mono text-[9px] uppercase tracking-wider text-tinta-100">
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">#</th>
                <th className="border-b border-r-2 border-papel-borda-300 bg-papel-100 px-2 py-2 text-left">
                  Nome
                </th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">Pontos</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">Crav.</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">Venc.</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">Saldo</th>
                <th className="border-b border-papel-borda-200 bg-papel-100 px-1 py-2 text-center">Proj.%</th>
              </tr>
            </thead>
            <motion.tbody
              variants={containerVariants}
              initial="hidden"
              animate="visible"
            >
              {linhas.map((d, i) => (
                <motion.tr
                  key={d.nome}
                  variants={linhaVariants}
                  onClick={clicavel ? () => onClickLinha!(d) : undefined}
                  className={clicavel ? 'cursor-pointer transition-colors hover:bg-papel-100' : undefined}
                >
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs text-tinta-200">
                    {i + 1}
                  </td>
                  <td className="border-b border-r-2 border-papel-borda-300 px-2 py-2 font-sans text-xs font-semibold text-tinta-300">
                    <div className="flex items-center gap-1.5">
                      <AvatarMini avatar={d.avatar} nome={d.nome} />
                      {d.emoji && <span className="flex-shrink-0 text-sm leading-none">{d.emoji}</span>}
                      <span className="whitespace-nowrap" title={d.nome}>{abreviarNome(d.nome)}</span>
                    </div>
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs font-bold text-tinta-300">
                    {d.pontos}
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs text-tinta-200">
                    {d.cravadas}
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs text-tinta-200">
                    {d.vencedor}
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs text-tinta-200">
                    {d.saldo}
                  </td>
                  <td className="border-b border-papel-borda-200/60 px-1 py-2 text-center font-mono text-xs font-bold text-dourado-600">
                    {d.projecao}%
                  </td>
                </motion.tr>
              ))}
            </motion.tbody>
          </table>
        </div>
        {clicavel && (
          <p className="border-t border-papel-borda-200 bg-papel-100 px-3 py-2 text-center font-mono text-[10px] italic text-tinta-100">
            👆 Toque em qualquer participante pra ver o comparativo frente a frente
          </p>
        )}
      </CardEnvelope>
    </div>
  )
}
