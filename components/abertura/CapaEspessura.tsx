'use client'

// CapaEspessura — paredes sólidas que dão espessura real à capa (24px),
// ligando a frente (z=0) ao verso (z=-24). Textura de "corte de páginas"
// (listras finas simulando dezenas de folhas empilhadas) + acabamento
// dourado na borda frontal, como um álbum de colecionador de verdade.
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
            'repeating-linear-gradient(0deg, rgba(255,248,224,0.9) 0 1px, rgba(60,40,15,0.4) 1px 2.2px), linear-gradient(90deg, var(--dourado-400) 0%, var(--dourado-200) 10%, var(--parede-200) 32%, var(--lombada-100) 58%, var(--parede-200) 100%)',
          boxShadow: 'inset 0 0 12px rgba(0,0,0,0.55), inset 3px 0 0 rgba(255,220,140,0.35)',
        }}
      />
      <div
        className="absolute left-0 right-0 top-0"
        style={{
          height: 24,
          transformOrigin: 'center top',
          transform: 'rotateX(-90deg)',
          background:
            'repeating-linear-gradient(90deg, rgba(255,248,224,0.5) 0 1px, rgba(60,40,15,0.3) 1px 2.2px), linear-gradient(180deg, var(--dourado-300) 0%, var(--parede-200), var(--couro-600))',
        }}
      />
      <div
        className="absolute bottom-0 left-0 right-0"
        style={{
          height: 24,
          transformOrigin: 'center bottom',
          transform: 'rotateX(90deg)',
          background:
            'repeating-linear-gradient(90deg, rgba(255,248,224,0.5) 0 1px, rgba(60,40,15,0.3) 1px 2.2px), linear-gradient(0deg, var(--dourado-300) 0%, var(--parede-200), var(--couro-600))',
        }}
      />
    </>
  )
}
