'use client'

// CardEnvelope — wrapper visual padrão do app: borda dourada 2px arredondada
// com header opcional em couro-300 (título bege + tags à direita).
//
// Uso:
//   <CardEnvelope titulo="📊 Ranking" tags={[{ label: 'EM ANDAMENTO' }]}>
//     ...conteúdo...
//   </CardEnvelope>
//
// Se não quiser header, omita `titulo`.

import type { ReactNode } from 'react'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export type CardEnvelopeTag = {
  label: string
  /** Cor de fundo da tag. 'sutil' = mesma cor do header com opacidade. */
  variante?: 'sutil' | 'dourado' | 'verde' | 'vermelho'
}

export function CardEnvelope({
  titulo,
  subtitulo,
  tags,
  children,
  className,
  variante = 'padrao',
}: {
  titulo?: string
  subtitulo?: string
  tags?: CardEnvelopeTag[]
  children: ReactNode
  className?: string
  /** 'padrao' = borda dourada / header couro. 'alerta' = borda vermelha / header vermelho. */
  variante?: 'padrao' | 'alerta'
}) {
  const isAlerta = variante === 'alerta'

  return (
    <div
      className={cx(
        'overflow-hidden rounded-lg shadow-sm',
        isAlerta
          ? 'border-2 border-raridade-frango-selo bg-papel-50'
          : 'border-2 border-dourado-300 bg-papel-50',
        className,
      )}
    >
      {titulo && (
        <div
          className={cx(
            'flex items-center justify-between gap-2 px-3 py-2',
            isAlerta
              ? 'border-b-2 border-raridade-frango-selo bg-red-50'
              : 'border-b-2 border-dourado-400 bg-couro-300',
          )}
        >
          <div className="min-w-0 flex-1">
            <p
              className={cx(
                'font-display text-sm font-bold uppercase tracking-widest truncate',
                isAlerta ? 'text-raridade-frango-selo' : 'text-dourado-50',
              )}
            >
              {titulo}
            </p>
            {subtitulo && (
              <p
                className={cx(
                  'font-mono text-[9px]',
                  isAlerta ? 'text-tinta-100' : 'text-dourado-50/80',
                )}
              >
                {subtitulo}
              </p>
            )}
          </div>

          {tags && tags.length > 0 && (
            <div className="flex flex-shrink-0 gap-1.5">
              {tags.map((tag, i) => (
                <span key={i} className={cx('rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase tracking-widest', tagClasses(tag.variante))}>
                  {tag.label}
                </span>
              ))}
            </div>
          )}
        </div>
      )}
      {children}
    </div>
  )
}

function tagClasses(variante: CardEnvelopeTag['variante']): string {
  switch (variante) {
    case 'dourado':
      return 'bg-dourado-500 text-dourado-50'
    case 'verde':
      return 'bg-verde-badge text-papel-50'
    case 'vermelho':
      return 'bg-raridade-frango-selo text-papel-50'
    case 'sutil':
    default:
      return 'bg-dourado-50/20 text-dourado-50'
  }
}
