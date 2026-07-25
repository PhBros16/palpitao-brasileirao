'use client'

import { ChipJogador } from './ChipJogador'
import { estiloZonaLuz } from './coreografia'
import type { EstiloEntrada } from './coreografia'
import type { JogadorBanco } from './tipos'

// BancoReservas — fileira do banco: reservas + marcador ADM, círculos simples
// no mesmo padrão dos chips do campo. Zona de refletor própria, acende por
// último na cascata (tier 4).
export function BancoReservas({
  revelado,
  reservas,
  admin,
  tecnico,
  onEntrarAdmin,
}: {
  revelado: boolean
  reservas: Array<JogadorBanco & { entrada: EstiloEntrada }>
  admin: { entrada: EstiloEntrada }
  tecnico: { entrada: EstiloEntrada }
  onEntrarAdmin?: () => void
}) {
  const zBanco = estiloZonaLuz(4, revelado)

  return (
    <div
      className="absolute flex flex-col gap-[7px] overflow-hidden rounded-[3px] border-2 border-papel-100/20"
      style={{
        left: 12,
        right: 12,
        height: 100,
        bottom: 12,
        background: 'var(--parede-100)',
        padding: '9px 14px',
      }}
    >
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background: 'rgba(4,7,12,0.92)',
          opacity: zBanco.escuroOpacity,
          transition: zBanco.escuroTransition,
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

      <div className="relative flex items-start justify-evenly gap-2.5">
        <ChipJogador
          iniciais="PC"
          nome="Cardoso"
          numero=""
          entrada={tecnico.entrada}
          variante="tecnico"
        />

        {reservas.map((r) => (
          <ChipJogador
            key={r.id}
            iniciais={r.iniciais}
            nome={r.nome}
            numero={r.numero}
            entrada={r.entrada}
            variante="reserva"
          />
        ))}

        <ChipJogador
          iniciais="AD"
          nome="Admin"
          numero=""
          entrada={admin.entrada}
          variante="admin"
          onClick={onEntrarAdmin ? (e) => { e.stopPropagation(); onEntrarAdmin() } : undefined}
        />
      </div>
    </div>
  )
}
