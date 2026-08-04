'use client'

// CapaEspessura — paredes sólidas que dão espessura real à capa (24px),
// ligando a frente (z=0) ao verso (z=-24). Couro rústico, no mesmo tom
// da lombada/capa (não dourado/página), com grão para não parecer plana
// quando vista de canto durante o flip.
export function CapaEspessura() {
  return (
    <>
      {/* quina (borda externa/direita) — a aresta que o espectador vê de frente perto de -90° */}
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{
          width: 24,
          transformOrigin: 'right center',
          transform: 'rotateY(-90deg)',
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 2px, rgba(0,0,0,0.22) 2px 3px), repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.08) 3px 4px), linear-gradient(90deg, var(--lombada-300) 0%, var(--lombada-100) 45%, var(--couro-500) 75%, var(--couro-600) 100%)',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.6), inset -2px 0 4px rgba(0,0,0,0.35)',
        }}
      />
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: 24,
          transformOrigin: 'center top',
          transform: 'rotateX(-90deg)',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.1) 3px 4px), linear-gradient(180deg, var(--couro-500), var(--couro-600))',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 24,
          transformOrigin: 'center bottom',
          transform: 'rotateX(90deg)',
          background:
            'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 3px, rgba(0,0,0,0.1) 3px 4px), linear-gradient(0deg, var(--couro-500), var(--couro-600))',
        }}
      />
    </>
  )
}
