'use client'

// HomeScreen — tela Início com stagger de entrada em cascata.
// Cada seção surge em sequência (fade + slide up sutil).

import { motion } from 'framer-motion'
import { Accordion } from './Accordion'
import { BannerPalpite } from './BannerPalpite'
import { BotoesLuz } from './BotoesLuz'
import { CardDestaque } from './CardDestaque'
import { MiniPlayer } from './MiniPlayer'
import { SecaoDistribuicao } from './SecaoDistribuicao'
import { SecaoFixa } from './SecaoFixa'
import { SecaoFrango } from './SecaoFrango'
import { SecaoParcial } from './SecaoParcial'
import { SecaoPodio } from './SecaoPodio'
import { SecaoPorPlacar } from './SecaoPorPlacar'
import type { HomeData } from './tipos'

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.07,
      delayChildren: 0.08,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 14 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.4,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
}

export function HomeScreen({ data }: { data: HomeData }) {
  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <motion.div
        variants={container}
        initial="hidden"
        animate="visible"
        className="mx-auto flex max-w-md flex-col gap-4"
      >
        {/* 1 · Destaque */}
        <motion.div variants={item}>
          <CardDestaque data={data} />
        </motion.div>

        {/* 2 · Player */}
        <motion.div variants={item}>
          <MiniPlayer faixas={data.faixas} />
        </motion.div>

        {/* 3 · Banner pendente (condicional) */}
        {data.palpitePendente && (
          <motion.div variants={item}>
            <BannerPalpite />
          </motion.div>
        )}

        {/* 4 · Parcial */}
        <motion.div variants={item}>
          <SecaoFixa titulo="Parcial da Rodada">
            <SecaoParcial linhas={data.parcial} finalizada={data.finalizada} />
          </SecaoFixa>
        </motion.div>

        {/* 5 · Frango */}
        <motion.div variants={item}>
          <SecaoFixa titulo="Frango da Rodada">
            <SecaoFrango frango={data.frango} />
          </SecaoFixa>
        </motion.div>

        {/* 6 · Por Placar */}
        <motion.div variants={item}>
          <Accordion titulo="Por Placar" storageKey="home:porplacar">
            <SecaoPorPlacar jogos={data.jogos} />
          </Accordion>
        </motion.div>

        {/* 7 · Distribuição */}
        <motion.div variants={item}>
          <Accordion titulo="Distribuição de Palpites" storageKey="home:distrib">
            <SecaoDistribuicao jogos={data.jogos} />
          </Accordion>
        </motion.div>

        {/* 8 · Pódio */}
        <motion.div variants={item}>
          <SecaoFixa titulo="Pódio Atual">
            <SecaoPodio podio={data.podio} />
          </SecaoFixa>
        </motion.div>

        {/* 9 · Botões de Luz (Chamar TI + Interruptor) */}
        <motion.div variants={item}>
          <BotoesLuz />
        </motion.div>
      </motion.div>
    </main>
  )
}
