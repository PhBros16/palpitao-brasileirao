'use client'

import { useEffect, useRef, useState, type ReactElement } from 'react'

/**
 * Mede a largura real (em px) do mais largo de uma lista de textos, com a
 * MESMA classe/fonte que vai aparecer de verdade na tela — via um elemento
 * oculto no DOM, nunca por estimativa de caracteres.
 *
 * Uso: dar essa largura pra coluna que precisa encaixar o texto sem sobra
 * nem corte, em qualquer fonte/aparelho/zoom — sem chutar pixel.
 *
 * Retorna [largura, elementoMedidor]. O chamador PRECISA renderizar o
 * elementoMedidor em algum lugar da árvore (ele é invisível e sai do fluxo,
 * não afeta o layout visível). Antes da primeira medição, largura vem como
 * `null` — use um fallback razoável nesse meio tempo.
 */
export function useMedidaTexto(textos: string[], className: string): [number | null, ReactElement] {
  const [largura, setLargura] = useState<number | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const chave = textos.join('\u0000')

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const spans = el.querySelectorAll('span[data-medir]')
    let max = 0
    spans.forEach((s) => {
      max = Math.max(max, (s as HTMLElement).getBoundingClientRect().width)
    })
    if (max > 0) setLargura(Math.ceil(max))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chave, className])

  const medidor = (
    <div
      ref={containerRef}
      aria-hidden
      style={{ position: 'absolute', visibility: 'hidden', pointerEvents: 'none', top: -9999, left: -9999, whiteSpace: 'nowrap' }}
    >
      {textos.map((t, i) => (
        <span key={i} data-medir className={className} style={{ display: 'inline-block' }}>{t}</span>
      ))}
    </div>
  )

  return [largura, medidor]
}
