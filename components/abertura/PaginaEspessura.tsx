'use client'

// PaginaEspessura — espessura de uma página de papel (bem mais fina que os
// 24px da capa de couro), ligando a frente (o campo) ao verso (PaginaVerso).
// Mesma técnica de paredes 3D da CapaEspessura, tom claro de papel em vez de
// couro — pra não parecer uma folha achatada quando vista de canto no giro.
export function PaginaEspessura({ largura = 7 }: { largura?: number }) {
  return (
    <>
      {/* quina — a aresta que aparece de frente perto de -90° (edge-on) */}
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{
          width: largura,
          transformOrigin: 'right center',
          transform: 'rotateY(-90deg)',
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 1.5px, rgba(0,0,0,0.14) 1.5px 2px), linear-gradient(90deg, var(--papel-300) 0%, var(--papel-100) 55%, #d9d0b2 100%)',
          boxShadow: 'inset 0 0 6px rgba(0,0,0,0.35)',
        }}
      />
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: largura,
          transformOrigin: 'center top',
          transform: 'rotateX(-90deg)',
          background: 'linear-gradient(180deg, var(--papel-100), var(--papel-300))',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: largura,
          transformOrigin: 'center bottom',
          transform: 'rotateX(90deg)',
          background: 'linear-gradient(0deg, var(--papel-100), var(--papel-300))',
        }}
      />
    </>
  )
}
