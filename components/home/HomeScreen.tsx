'use client'

// HomeScreen — tela Início. Orquestra as seções na ordem definida:
//  1. Card destaque (sempre visível)         5. Frango (accordion, colapsado)
//  2. Mini player (sempre visível)           6. Por Placar (accordion, colapsado)
//  3. Banner palpite pendente (condicional)  7. Distribuição (accordion, colapsado)
//  4. Parcial (accordion, expandido)         8. Pódio (accordion, colapsado)
//
// Reconstrução do zero da seção INÍCIO do Copa (referência de comportamento).
// Dados 100% por prop. Mobile-first, tudo via Tailwind/tokens.

import { Accordion } from './Accordion'
import { BannerPalpite } from './BannerPalpite'
import { CardDestaque } from './CardDestaque'
import { MiniPlayer } from './MiniPlayer'
import { SecaoDistribuicao } from './SecaoDistribuicao'
import { SecaoFrango } from './SecaoFrango'
import { SecaoParcial } from './SecaoParcial'
import { SecaoPodio } from './SecaoPodio'
import { SecaoPorPlacar } from './SecaoPorPlacar'
import type { HomeData } from './tipos'

export function HomeScreen({ data }: { data: HomeData }) {
  return (
    <main className="min-h-screen bg-papel-200 px-4 pb-10 pt-6">
      <div className="mx-auto flex max-w-md flex-col gap-4">
        {/* 1 · Destaque */}
        <CardDestaque data={data} />

        {/* 2 · Player */}
        <MiniPlayer faixas={data.faixas} />

        {/* 3 · Banner pendente (condicional) */}
        {data.palpitePendente && <BannerPalpite />}

        {/* 4 · Parcial (expandido) */}
        <Accordion titulo="Parcial da Rodada" storageKey="home:parcial" defaultOpen>
          <SecaoParcial linhas={data.parcial} finalizada={data.finalizada} />
        </Accordion>

        {/* 5 · Frango (colapsado) */}
        <Accordion titulo="Frango da Rodada" storageKey="home:frango">
          <SecaoFrango frango={data.frango} />
        </Accordion>

        {/* 6 · Por Placar (colapsado) */}
        <Accordion titulo="Por Placar" storageKey="home:porplacar">
          <SecaoPorPlacar jogos={data.jogos} />
        </Accordion>

        {/* 7 · Distribuição (colapsado) */}
        <Accordion titulo="Distribuição de Palpites" storageKey="home:distrib">
          <SecaoDistribuicao jogos={data.jogos} />
        </Accordion>

        {/* 8 · Pódio (colapsado) */}
        <Accordion titulo="Pódio Atual" storageKey="home:podio">
          <SecaoPodio podio={data.podio} />
        </Accordion>
      </div>
    </main>
  )
}
