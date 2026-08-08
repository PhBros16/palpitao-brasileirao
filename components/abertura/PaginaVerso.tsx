'use client'

// PaginaVerso — verso da "página" do campo (não a capa de couro: aqui é uma
// página normal do álbum). Só fica visível por uma fração de segundo, no
// meio do giro (perto de 90°, de canto) até assentar em -180°. Papel liso,
// grão bem sutil, sombra da dobradiça penetrando perto do pivô (esquerda).
export function PaginaVerso() {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        top: 0,
        left: 0,
        right: -1,
        bottom: -1,
        background: 'linear-gradient(115deg, var(--papel-300) 0%, var(--papel-100) 55%, var(--papel-300) 100%)',
      }}
    >
      {/* grão de papel — bem mais discreto que o couro */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 5px, rgba(0,0,0,0.045) 5px 6px)' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 30% 40%, rgba(0,0,0,0.03) 0 0.5px, transparent 1px), radial-gradient(circle at 68% 65%, rgba(0,0,0,0.03) 0 0.5px, transparent 1px)',
          backgroundSize: '10px 10px, 13px 13px',
        }}
      />

      <div className="absolute rounded-md border" style={{ inset: 22, borderColor: 'color-mix(in srgb, var(--dourado-600) 28%, transparent)' }} />

      {/* sombra da dobradiça — penetra levemente na página perto do pivô esquerdo */}
      <div
        className="pointer-events-none absolute bottom-0 left-0 top-0"
        style={{ width: 16, background: 'linear-gradient(90deg, rgba(0,0,0,0.3), transparent)' }}
      />
    </div>
  )
}
