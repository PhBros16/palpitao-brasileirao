'use client'

// CapaEspessura — paredes sólidas que dão espessura real à capa (14px),
// ligando a frente (z=0) ao verso (z=-14). Sem elas, a capa "de canto"
// (perto de -90°, no meio do flip) pareceria uma folha de papel, não um
// objeto com volume.
export function CapaEspessura() {
  return (
    <>
      {/* quina (borda externa/direita) — a aresta que o espectador vê de frente perto de -90° */}
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{
          width: 14,
          transformOrigin: 'right center',
          transform: 'rotateY(-90deg)',
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0.26) 0 2px, color-mix(in srgb, var(--madeira-200) 10%, transparent) 2px 4px), linear-gradient(90deg, var(--parede-200) 0%, var(--lombada-100) 55%, var(--parede-200) 100%)',
          boxShadow: 'inset 0 0 10px rgba(0,0,0,0.6)',
        }}
      />
      <div
        className="absolute left-0 right-0 top-0"
        style={{ height: 14, transformOrigin: 'center top', transform: 'rotateX(-90deg)', background: 'linear-gradient(180deg, var(--parede-200), var(--couro-600))' }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{ height: 14, transformOrigin: 'center bottom', transform: 'rotateX(90deg)', background: 'linear-gradient(0deg, var(--parede-200), var(--couro-600))' }}
      />
    </>
  )
}
