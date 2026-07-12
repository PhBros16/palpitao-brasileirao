'use client'

// CapaVerso — face de trás da capa (forro interno do livro), visível só no
// instante em que o flip passa da metade (edge-on) até assentar.
export function CapaVerso() {
  return (
    <div
      className="absolute overflow-hidden"
      style={{
        top: 0,
        left: 0,
        right: -2,
        bottom: -2,
        background: 'linear-gradient(115deg, var(--couro-500) 0%, var(--parede-100) 55%, var(--parede-200) 100%)',
      }}
    >
      <div className="pointer-events-none absolute inset-0" style={{ background: 'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 5px, rgba(0,0,0,0.18) 5px 6px)' }} />
      <div className="absolute rounded-md border" style={{ inset: 20, borderColor: 'color-mix(in srgb, var(--dourado-600) 35%, transparent)' }} />
      <div
        className="absolute bottom-0 right-0 top-0"
        style={{ width: 16, background: 'linear-gradient(270deg, var(--parede-200), var(--lombada-100))', boxShadow: 'inset 3px 0 7px rgba(0,0,0,0.55)' }}
      />
    </div>
  )
}
