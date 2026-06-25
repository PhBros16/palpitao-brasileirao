'use client'

// EscudoTime — escudo do clube com fallback de iniciais.
//
// img real quando o logo existe (vão em /public/escudos/ — CLAUDE.md §7);
// se a imagem faltar ou quebrar (onError), cai para uma sigla de 3 letras
// num círculo de papel. Mesmo espírito do fallback de bandeira do Copa, mas
// data-driven e sem emoji.

import { useState } from 'react'

/** Sigla de 3 letras a partir do nome do clube (sem acento), ex.: Flamengo→FLA. */
export function siglaTime(nome: string): string {
  // NFD separa o acento em marca combinante; o filtro [^a-zA-Z\s] remove tanto
  // os acentos quanto pontuação/dígitos, deixando só letras ASCII e espaços.
  const limpo = nome
    .normalize('NFD')
    .replace(/[^a-zA-Z\s]/g, '')
    .trim()
  const base = limpo.split(/\s+/)[0] || nome
  return base.slice(0, 3).toUpperCase()
}

export function EscudoTime({ nome, logo }: { nome: string; logo?: string }) {
  const [erro, setErro] = useState(false)
  const mostrarImg = logo && !erro
  return (
    <span className="flex h-12 w-12 items-center justify-center overflow-hidden rounded-full border-2 border-papel-borda-300 bg-papel-100">
      {mostrarImg ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={logo}
          alt={nome}
          className="h-full w-full object-contain p-1"
          onError={() => setErro(true)}
        />
      ) : (
        <span className="font-display text-sm font-bold text-tinta-200">{siglaTime(nome)}</span>
      )}
    </span>
  )
}
