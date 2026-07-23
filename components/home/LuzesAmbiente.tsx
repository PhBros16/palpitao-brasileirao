'use client'

import { useEffect, useState } from 'react'

interface Foco {
  id: number
  x: string
  y: string
}

const FOCOS: Foco[] = [
  { id: 0, x: '12%', y: '10%' },
  { id: 1, x: '88%', y: '12%' },
  { id: 2, x: '10%', y: '88%' },
  { id: 3, x: '90%', y: '85%' },
]

export function LuzesAmbiente() {
  const [estados, setEstados] = useState<Record<number, number>>(() =>
    FOCOS.reduce((acc, f) => ({ ...acc, [f.id]: 1 }), {}),
  )
  const [contador, setContador] = useState(0)

  useEffect(() => {
    console.log('[LuzesAmbiente] montado, iniciando loop em 3s')
    let mounted = true

    async function loop() {
      await new Promise((r) => setTimeout(r, 3000))
      console.log('[LuzesAmbiente] loop começou')

      while (mounted) {
        const espera = 8000 + Math.random() * 5000
        console.log(`[LuzesAmbiente] aguardando ${(espera / 1000).toFixed(1)}s antes de queimar`)
        await new Promise((r) => setTimeout(r, espera))
        if (!mounted) return

        const idx = Math.floor(Math.random() * FOCOS.length)
        console.log(`[LuzesAmbiente] QUEIMANDO foco ${idx}`)
        setContador((c) => c + 1)

        for (let i = 0; i < 3; i++) {
          setEstados((s) => ({ ...s, [idx]: 0.1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
          setEstados((s) => ({ ...s, [idx]: 1 }))
          await new Promise((r) => setTimeout(r, 100))
          if (!mounted) return
        }

        setEstados((s) => ({ ...s, [idx]: 0 }))
        console.log(`[LuzesAmbiente] foco ${idx} APAGADO`)
        await new Promise((r) => setTimeout(r, 4000))
        if (!mounted) return

        setEstados((s) => ({ ...s, [idx]: 1 }))
        console.log(`[LuzesAmbiente] foco ${idx} REACENDIDO`)
      }
    }

    loop()
    return () => {
      mounted = false
    }
  }, [])

  return (
    <>
      {/* Indicador de debug no canto — mostra estados */}
      <div
        style={{
          position: 'fixed',
          top: 4,
          right: 4,
          zIndex: 9999,
          background: 'black',
          color: 'lime',
          padding: '4px 8px',
          fontFamily: 'monospace',
          fontSize: 11,
        }}
      >
        Luzes: {FOCOS.map((f) => (estados[f.id] ?? 1).toFixed(2)).join(' ')} | queimas: {contador}
      </div>

      <div
        className="pointer-events-none fixed inset-0 overflow-hidden"
        style={{ zIndex: 0 }}
        aria-hidden="true"
      >
        {FOCOS.map((f) => {
          const brilho = estados[f.id] ?? 1
          return (
            <div
              key={f.id}
              style={{
                position: 'absolute',
                left: f.x,
                top: f.y,
                transform: 'translate(-50%, -50%)',
                width: 600,
                height: 600,
                borderRadius: '50%',
                background: 'radial-gradient(circle, rgba(255, 200, 80, 0.95) 0%, rgba(255, 180, 60, 0.4) 30%, transparent 65%)',
                filter: 'blur(35px)',
                mixBlendMode: 'overlay',
                opacity: brilho,
                transition: 'opacity 0.2s ease-out',
              }}
            />
          )
        })}
      </div>
    </>
  )
}
