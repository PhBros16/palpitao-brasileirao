'use client'

import type { CSSProperties } from 'react'
import styles from './abertura.module.css'
import type { EstiloEntrada } from './coreografia'

function cx(...classes: Array<string | false | null | undefined>): string {
  return classes.filter(Boolean).join(' ')
}

export interface ChipJogadorProps {
  iniciais: string
  nome: string
  numero: string
  entrada: EstiloEntrada
  /** titular = chip do campo (maior); reserva/admin = chip do banco (menor). */
  variante?: 'titular' | 'reserva' | 'admin' | 'tecnico'
  /** Posição absoluta em % do campo (left/top) — omitir pros chips do banco (flex). */
  posicaoCampo?: { left: string; top: string }
  onClick?: () => void
}

/** Marcador circular de jogador — "ficha tática": círculo com iniciais + selo
 *  de número, nome abaixo. Usado tanto no campo (titulares) quanto no banco
 *  (reservas + ADM). Entrada calculada por coreografia.estiloEntrada; idle
 *  (respiração sutil) só liga depois que a corrida individual termina. */
export function ChipJogador({ iniciais, nome, numero, entrada, variante = 'titular', posicaoCampo, onClick }: ChipJogadorProps) {
  const tamanho = variante === 'titular' ? 44 : 38
  const isAdmin = variante === 'admin'
  const isTecnico = variante === 'tecnico'
  const temSeloEspecial = isAdmin || isTecnico

  const wrapperStyle: CSSProperties = {
    ...(posicaoCampo ? { position: 'absolute', left: posicaoCampo.left, top: posicaoCampo.top } : {}),
    ['--t0' as string]: entrada.t0,
    ['--t1' as string]: entrada.t1,
    ['--t2' as string]: entrada.t2,
    opacity: entrada.opacity,
    transform: entrada.animar ? undefined : entrada.transformEstatico,
    animationDuration: entrada.animar ? '1200ms' : undefined,
    animationDelay: entrada.animar ? entrada.animationDelay : undefined,
  }

  return (
    <div
      className={cx('flex flex-col items-center gap-[3px]', posicaoCampo && '-translate-x-1/2 -translate-y-1/2', entrada.animar && styles.filaUnica)}
      style={wrapperStyle}
      onClick={onClick}
    >
      <div
        className={cx(
          'relative flex items-center justify-center rounded-full shadow-[0_1px_3px_rgba(0,0,0,0.45)]',
          variante === 'titular' ? 'border-2 border-dourado-300' : temSeloEspecial ? 'border-2 border-dourado-300' : 'border-[1.5px] border-dourado-400',
          entrada.animar && styles.chipIdle,
        )}
        style={{
          width: tamanho,
          height: tamanho,
          background: 'radial-gradient(circle at 38% 30%, var(--papel-100) 0%, var(--dourado-100) 60%, var(--dourado-200) 100%)',
          boxShadow: temSeloEspecial ? '0 1px 3px rgba(0,0,0,0.45), 0 0 0 1.5px color-mix(in srgb, var(--dourado-300) 35%, transparent)' : undefined,
          animationDelay: entrada.animar ? entrada.idleDelay : undefined,
        }}
      >
        <span
          className="font-mono font-bold text-couro-600"
          style={{ fontSize: variante === 'titular' ? 14 : 12, letterSpacing: variante === 'titular' ? '0.5px' : undefined }}
        >
          {iniciais}
        </span>
        {isAdmin ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-dourado-300 bg-couro-600">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="var(--dourado-100)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <circle cx="12" cy="12" r="3" />
              <path d="M19.4 13.5c.04-.33.06-.66.06-1s-.02-.67-.06-1l2.1-1.6a.5.5 0 0 0 .12-.65l-2-3.4a.5.5 0 0 0-.6-.23l-2.5 1a7.6 7.6 0 0 0-1.7-1l-.38-2.65A.5.5 0 0 0 14 2.5h-4a.5.5 0 0 0-.5.43L9.12 5.6a7.6 7.6 0 0 0-1.7 1l-2.5-1a.5.5 0 0 0-.6.23l-2 3.4a.5.5 0 0 0 .12.65l2.1 1.6c-.04.33-.06.66-.06 1s.02.67.06 1l-2.1 1.6a.5.5 0 0 0-.12.65l2 3.4c.14.23.4.32.6.23l2.5-1c.5.42 1.08.76 1.7 1l.38 2.65a.5.5 0 0 0 .5.43h4a.5.5 0 0 0 .5-.43l.38-2.65c.62-.24 1.2-.58 1.7-1l2.5 1c.2.09.46 0 .6-.23l2-3.4a.5.5 0 0 0-.12-.65z" />
            </svg>
          </span>
        ) : isTecnico ? (
          <span className="absolute -right-1.5 -top-1.5 flex h-[15px] w-[15px] items-center justify-center rounded-full border border-dourado-300 bg-couro-600">
            <svg viewBox="0 0 24 24" width="9" height="9" fill="none" stroke="var(--dourado-100)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
              <path d="M8 4 L4 8 a6 6 0 1 0 6-6 Z" />
              <circle cx="14" cy="10" r="4" />
            </svg>
          </span>
        ) : (
          <span
            className="absolute -right-1.5 -top-1.5 flex items-center justify-center rounded-full border border-dourado-300 bg-couro-600 font-mono font-bold text-dourado-100"
            style={{ minWidth: variante === 'titular' ? 18 : 15, height: variante === 'titular' ? 18 : 15, padding: '0 3px', fontSize: variante === 'titular' ? 9 : 8 }}
          >
            {numero}
          </span>
        )}
      </div>
      <span
        className="whitespace-nowrap font-mono uppercase text-papel-100"
        style={{
          fontSize: 8,
          letterSpacing: variante === 'titular' ? '1px' : '0.3px',
          textShadow: '0 1px 2px rgba(0,0,0,0.9)',
          opacity: entrada.nomeOpacity,
          transition: `opacity 350ms ease-out ${entrada.nomeTransitionDelay}`,
        }}
      >
        {variante === 'admin' ? 'ADM' : variante === 'tecnico' ? 'TÉC' : nome}
      </span>
    </div>
  )
}
