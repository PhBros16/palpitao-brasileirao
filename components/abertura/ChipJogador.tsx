'use client'

import type { JogadorBase, JogadorCampo } from './tipos'

// Marcador circular de jogador na cena do estádio — círculo colorido com
// iniciais + nome abaixo. Distinto da FigurinhaJogador (papel/serrilha): aqui
// o estilo é "ficha tática" (FIFA-like), coerente com o campo escuro sob os
// refletores. A FigurinhaJogador completa pertence ao interior do álbum.
export function ChipJogador({
  jogador,
  destaque,
  pequeno,
}: {
  jogador: JogadorBase | JogadorCampo
  destaque?: boolean
  pequeno?: boolean
}) {
  const tamanho = pequeno ? 28 : 36
  return (
    <div className="flex flex-col items-center" style={{ width: pequeno ? 52 : 62 }}>
      <div
        className="flex items-center justify-center rounded-full border-[3px] border-papel-borda-100 font-display font-black text-papel-200"
        style={{
          width: tamanho,
          height: tamanho,
          backgroundColor: jogador.cor,
          boxShadow: destaque
            ? '0 0 0 3px var(--dourado-300), 0 4px 8px rgba(0,0,0,0.7), 0 0 20px var(--dourado-300)'
            : '0 4px 6px rgba(0,0,0,0.6), inset 0 -3px 0 rgba(0,0,0,0.2)',
          fontSize: pequeno ? 10 : 12,
          textShadow: '1px 1px 0 rgba(0,0,0,0.6)',
        }}
      >
        {jogador.iniciais}
      </div>
      <div
        className="mt-[3px] text-center font-mono font-bold leading-tight text-papel-200"
        style={{ fontSize: pequeno ? 7 : 9, textShadow: '1px 1px 2px rgba(0,0,0,0.95)' }}
      >
        {jogador.nome}
      </div>
    </div>
  )
}
