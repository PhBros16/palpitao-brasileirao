// FigurinhaJogador — o átomo da identidade visual do Palpitão Brasileirão.
//
// Card no estilo figurinha de álbum: papel envelhecido, borda serrilhada,
// foto circular (com fallback de iniciais), nome + vulgo e três stats no
// rodapé (PTS / CRAVOU / POS). Ver CLAUDE.md Seção 4, item 4.
//
// Princípios (CLAUDE.md Regras 2, 6 e §4):
//  • Data-driven: nome, vulgo, foto e stats vêm 100% por props. Sem jogador
//    nem mock hardcoded aqui dentro.
//  • Estilo via Tailwind/tokens, nunca inline-style. O único efeito em CSS
//    Module é a borda serrilhada (mask), que o Tailwind não expressa bem.
//  • Raridade é CONTROLADA pelo chamador (prop), nunca calculada aqui, e só
//    aparece quando `showRarity` é true. A tela de login reusa este componente
//    SEM raridade (showRarity omitido/false) — por isso o default é não mostrar.

import styles from './figurinha.module.css'

/** Raridade da figurinha, derivada da POSIÇÃO no ranking pelo CHAMADOR. */
export type Raridade = 'lendaria' | 'rara' | 'comum' | 'frango'

export interface FigurinhaStats {
  /** Pontos totais. */
  pts: number
  /** Quantidade de placares cravados (CRAVOU). */
  cravou: number
  /** Posição no ranking (POS). */
  pos: number
}

export interface FigurinhaJogadorProps {
  nome: string
  vulgo?: string
  /** URL da foto. Ausente → mostra iniciais como fallback. */
  fotoUrl?: string
  stats: FigurinhaStats
  /** Raridade decidida pelo chamador. Padrão 'comum'. */
  raridade?: Raridade
  /** Liga a aparência de raridade. Padrão `false` (ex.: tela de login). */
  showRarity?: boolean
  className?: string
}

/** Junta classes truthy sem dependência externa (evita clsx por enquanto). */
function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

/** Iniciais a partir do nome: 1ª letra do primeiro e do último nome. */
function getIniciais(nome: string): string {
  const parts = nome.trim().split(/\s+/).filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

// ── Aparência por raridade (classes LITERAIS para o JIT do Tailwind gerar) ──
// Sem concatenação dinâmica de nomes de classe: cada variante é uma string
// completa, presente no código-fonte.

/** Fundo do card (papel) por raridade. */
const FUNDO: Record<Raridade, string> = {
  lendaria: 'bg-raridade-lendaria-bg',
  rara: 'bg-papel-100',
  comum: 'bg-papel-100',
  frango: 'bg-papel-200',
}

/** Moldura interna (a "borda" de raridade) — inset, dentro da serrilha. */
const MOLDURA: Record<Raridade, string> = {
  lendaria: 'border-2 border-solid border-raridade-lendaria',
  rara: 'border-2 border-solid border-raridade-rara-borda',
  comum: 'border-2 border-dashed border-raridade-comum-borda',
  frango: 'border-2 border-solid border-raridade-frango',
}

/** Rotação do card (só o frango "torto"). Vai no wrapper. */
const CARD_ROTACAO: Record<Raridade, string> = {
  lendaria: '',
  rara: '',
  comum: '',
  frango: '-rotate-2',
}

/** Filtro de cor (só o frango "desbotado"). Vai no corpo (article), num único
 *  `filter` arbitrário pra não conflitar com o drop-shadow do wrapper. */
const CARD_FILTRO: Record<Raridade, string> = {
  lendaria: '',
  rara: '',
  comum: '',
  frango: '[filter:grayscale(0.35)_saturate(0.6)]',
}

// Aparência NEUTRA (sem raridade): usada quando showRarity é false.
const FUNDO_NEUTRO = 'bg-papel-100'
const MOLDURA_NEUTRA = 'border-2 border-solid border-papel-borda-300'

export function FigurinhaJogador({
  nome,
  vulgo,
  fotoUrl,
  stats,
  raridade = 'comum',
  showRarity = false,
  className,
}: FigurinhaJogadorProps) {
  const fundo = showRarity ? FUNDO[raridade] : FUNDO_NEUTRO
  const moldura = showRarity ? MOLDURA[raridade] : MOLDURA_NEUTRA
  const cardRotacao = showRarity ? CARD_ROTACAO[raridade] : ''
  const cardFiltro = showRarity ? CARD_FILTRO[raridade] : ''
  const ehFrango = showRarity && raridade === 'frango'

  return (
    // Wrapper relativo: a sombra acompanha a silhueta serrilhada (drop-shadow
    // usa o alfa do filho mascarado; box-shadow não seguiria os furos). Os
    // selos (frango/coroa) ficam AQUI, fora da máscara, pra não serem cortados
    // pela serrilha — leem como adesivo colado por cima.
    <div className={cx('relative inline-block drop-shadow-md', cardRotacao, className)}>
      {/* Selo do frango — castigo afetuoso, só para o último colocado. */}
      {ehFrango && (
        <span className="absolute -right-2 top-1 z-10 rotate-12 rounded-sm bg-raridade-frango-selo px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-wider text-papel-50 shadow-sm">
          Frango
        </span>
      )}

      {/* Coroa discreta da lendária. */}
      {showRarity && raridade === 'lendaria' && (
        <span className="absolute -top-3 left-1/2 z-10 -translate-x-1/2 text-lg leading-none drop-shadow-sm">
          👑
        </span>
      )}

      <article
        className={cx(
          styles.serrilhada,
          fundo,
          cardFiltro,
          'relative w-[190px] select-none p-[10px] transition-transform',
        )}
      >
        <div className={cx(moldura, 'flex flex-col items-center gap-2 rounded-md px-3 pb-3 pt-4')}>
          {/* Foto circular ou iniciais. */}
          <div
            className={cx(
              'flex h-20 w-20 items-center justify-center overflow-hidden rounded-full border-2 bg-papel-200',
              showRarity && raridade === 'lendaria' ? 'border-dourado-300' : 'border-papel-borda-300',
            )}
          >
            {fotoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={fotoUrl} alt={nome} className="h-full w-full object-cover" />
            ) : (
              <span className="font-display text-2xl font-bold text-tinta-200">
                {getIniciais(nome)}
              </span>
            )}
          </div>

          {/* Nome (condensado) + vulgo. */}
          <div className="mt-1 flex flex-col items-center text-center">
            <h3 className="font-sans text-sm font-bold uppercase leading-tight tracking-tight text-tinta-300">
              {nome}
            </h3>
            {vulgo && (
              <p className="font-sans text-[11px] font-medium italic leading-tight text-tinta-100">
                “{vulgo}”
              </p>
            )}
          </div>

          {/* Rodapé de stats: PTS / CRAVOU / POS. */}
          <dl className="mt-1 grid w-full grid-cols-3 divide-x divide-papel-borda-200 border-t border-papel-borda-200 pt-2">
            <Stat label="PTS" valor={stats.pts} />
            <Stat label="CRAVOU" valor={stats.cravou} />
            <Stat label="POS" valor={stats.pos} prefixo="º" sufixoComoPrefixo />
          </dl>
        </div>
      </article>
    </div>
  )
}

function Stat({
  label,
  valor,
  prefixo,
  sufixoComoPrefixo,
}: {
  label: string
  valor: number
  prefixo?: string
  sufixoComoPrefixo?: boolean
}) {
  return (
    <div className="flex flex-col items-center px-1">
      <dd className="font-mono text-base font-bold leading-none text-tinta-300">
        {sufixoComoPrefixo ? (
          <>
            {valor}
            <span className="text-[10px]">{prefixo}</span>
          </>
        ) : (
          valor
        )}
      </dd>
      <dt className="mt-0.5 font-mono text-[8px] font-medium uppercase tracking-wider text-tinta-100">
        {label}
      </dt>
    </div>
  )
}
