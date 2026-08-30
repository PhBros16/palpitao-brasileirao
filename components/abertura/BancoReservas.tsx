'use client'

import { ChipJogador } from './ChipJogador'
import { estiloZonaLuz } from './coreografia'
import type { EstiloEntrada } from './coreografia'
import type { JogadorBanco } from './tipos'

export function BancoReservas({
  revelado,
  reservas,
  admin,
  tecnico,
  onEntrarAdmin,
  onEntrarJogador,
  carregandoId,
}: {
  revelado: boolean
  reservas: Array<JogadorBanco & { entrada: EstiloEntrada }>
  admin: { entrada: EstiloEntrada; avatar?: string | null }
  tecnico: JogadorBanco & { entrada: EstiloEntrada }
  onEntrarAdmin?: () => void
  onEntrarJogador?: (j: { id: string; nome: string }) => void
  carregandoId?: string | null
}) {
  const zBanco = estiloZonaLuz(4, revelado)

  return (
    <div
      className="absolute flex flex-col gap-[7px] overflow-hidden rounded-[3px]"
      style={{
        left: 12,
        right: 12,
        height: 100,
        bottom: 12,
        background: revelado ? 'var(--parede-100)' : 'transparent',
        border: `2px solid ${revelado ? 'rgba(245, 235, 215, 0.2)' : 'transparent'}`,
        transition: 'background-color 900ms ease-out, border-color 900ms ease-out',
        padding: '9px 14px',
        zIndex: 0,
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'rgba(4,7,12,0.98)',
          opacity: zBanco.escuroOpacity,
          transition: zBanco.escuroTransition,
          zIndex: 10,
        }}
      />

      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(70% 120% at 50% 40%, color-mix(in srgb, var(--dourado-200) 50%, transparent) 0%, color-mix(in srgb, var(--dourado-400) 22%, transparent) 50%, transparent 80%)',
          opacity: zBanco.brilhoOpacity,
          transform: zBanco.brilhoScale,
          transition: zBanco.brilhoTransition,
          zIndex: 11,
        }}
      />

      <div className="relative flex items-center gap-[7px]">
        <span className="whitespace-nowrap font-mono text-[8px] font-medium tracking-[2.5px] text-dourado-400">
          BANCO DE RESERVAS
        </span>
        <span
          className="h-px flex-1"
          style={{
            background:
              'linear-gradient(90deg, color-mix(in srgb, var(--dourado-400) 45%, transparent), transparent)',
          }}
        />
      </div>

      <div className="relative grid grid-cols-4 items-start justify-items-center gap-2.5">
        <ChipJogador
          iniciais={tecnico.iniciais}
          nome={tecnico.nome}
          numero=""
          entrada={tecnico.entrada}
          variante="tecnico"
          onClick={onEntrarJogador ? () => onEntrarJogador(tecnico) : undefined}
          carregando={carregandoId === tecnico.id}
          avatar={tecnico.avatar}
        />

        {reservas.map((r) => (
          <ChipJogador
            key={r.id}
            iniciais={r.iniciais}
            nome={r.nome}
            numero={r.numero}
            entrada={r.entrada}
            variante="reserva"
            onClick={onEntrarJogador ? () => onEntrarJogador(r) : undefined}
            carregando={carregandoId === r.id}
            avatar={r.avatar}
          />
        ))}

        <ChipJogador
          iniciais="AD"
          nome="Admin"
          numero=""
          entrada={admin.entrada}
          variante="admin"
          onClick={onEntrarAdmin}
          avatar={admin.avatar}
        />
      </div>
    </div>
  )
}
