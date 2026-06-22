// Página de teste visual da Figurinha do Jogador.
// Rota: /figurinha-teste — apenas para conferência durante o desenvolvimento.
//
// Os dados aqui são fixos DE PROPÓSITO (harness de teste). O componente em si
// não tem mock: tudo chega por props daqui.

import { FigurinhaJogador, type Raridade } from '@/components/figurinha'

type Amostra = {
  raridade: Raridade
  titulo: string
  nome: string
  vulgo: string
  fotoUrl?: string
  stats: { pts: number; cravou: number; pos: number }
}

const AMOSTRAS: Amostra[] = [
  {
    raridade: 'lendaria',
    titulo: 'LENDÁRIA — 1º lugar',
    nome: 'Carlos Eduardo',
    vulgo: 'Cadu',
    stats: { pts: 312, cravou: 28, pos: 1 },
  },
  {
    raridade: 'rara',
    titulo: 'RARA — zona G6 (top 6)',
    nome: 'Beatriz Lima',
    vulgo: 'Bia',
    stats: { pts: 274, cravou: 19, pos: 4 },
  },
  {
    raridade: 'comum',
    titulo: 'COMUM — demais',
    nome: 'Thiago Souza',
    vulgo: 'Theozinho',
    stats: { pts: 188, cravou: 11, pos: 9 },
  },
  {
    raridade: 'frango',
    titulo: 'FRANGO — último',
    nome: 'Heitor Augusto',
    vulgo: 'Perna',
    stats: { pts: 96, cravou: 3, pos: 14 },
  },
]

export default function FigurinhaTestePage() {
  return (
    <main className="min-h-screen bg-parede-200 px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-1 font-display text-3xl font-bold text-papel-100">
          Figurinha do Jogador
        </h1>
        <p className="mb-8 font-sans text-sm text-papel-borda-300">
          As 4 variantes de raridade (com <code className="font-mono">showRarity</code>) e, abaixo,
          o mesmo componente SEM raridade — como a tela de login vai usar.
        </p>

        {/* Com raridade visível */}
        <section className="mb-12">
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-dourado-300">
            showRarity = true
          </h2>
          <div className="flex flex-wrap gap-8">
            {AMOSTRAS.map((a) => (
              <figure key={a.raridade} className="flex flex-col items-center gap-3">
                <FigurinhaJogador
                  nome={a.nome}
                  vulgo={a.vulgo}
                  fotoUrl={a.fotoUrl}
                  stats={a.stats}
                  raridade={a.raridade}
                  showRarity
                />
                <figcaption className="font-mono text-[10px] uppercase tracking-wider text-papel-borda-300">
                  {a.titulo}
                </figcaption>
              </figure>
            ))}
          </div>
        </section>

        {/* Sem raridade (reuso no login) — mesmas posições, aparência neutra */}
        <section>
          <h2 className="mb-4 font-mono text-xs uppercase tracking-widest text-dourado-300">
            showRarity = false (login)
          </h2>
          <div className="flex flex-wrap gap-8">
            {AMOSTRAS.map((a) => (
              <figure key={a.raridade} className="flex flex-col items-center gap-3">
                <FigurinhaJogador
                  nome={a.nome}
                  vulgo={a.vulgo}
                  fotoUrl={a.fotoUrl}
                  stats={a.stats}
                  raridade={a.raridade}
                />
                <figcaption className="font-mono text-[10px] uppercase tracking-wider text-papel-borda-300">
                  neutra (raridade ignorada)
                </figcaption>
              </figure>
            ))}
          </div>
        </section>
      </div>
    </main>
  )
}
