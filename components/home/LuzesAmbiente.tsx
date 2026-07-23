'use client'

export function LuzesAmbiente() {
  return (
    <div
      className="pointer-events-none fixed inset-0 overflow-hidden"
      style={{ zIndex: 5 }}
      aria-hidden="true"
    >
      {/* TESTE — bola vermelha grande no meio pra confirmar que aparece */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: '50%',
          transform: 'translate(-50%, -50%)',
          width: 200,
          height: 200,
          borderRadius: '50%',
          background: 'red',
          opacity: 0.7,
        }}
      />

      {/* 4 focos de luz nos cantos */}
      <div
        style={{
          position: 'absolute',
          left: '15%',
          top: '15%',
          transform: 'translate(-50%, -50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,220,130,0.9) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '15%',
          top: '15%',
          transform: 'translate(50%, -50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,225,140,0.9) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          left: '15%',
          bottom: '15%',
          transform: 'translate(-50%, 50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,215,125,0.9) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
      <div
        style={{
          position: 'absolute',
          right: '15%',
          bottom: '15%',
          transform: 'translate(50%, 50%)',
          width: 500,
          height: 500,
          borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(255,230,145,0.9) 0%, transparent 65%)',
          filter: 'blur(30px)',
        }}
      />
    </div>
  )
}
