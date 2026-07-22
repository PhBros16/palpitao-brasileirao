'use client'

// FundoAnimado — padrão de textura sutil (losangos amarronzados) + manchas
// douradas grandes flutuando lentamente. Sem partículas soltas.
// Inspirado no fundo hexagonal do Copa, adaptado pra paleta Panini.

import { motion } from 'framer-motion'

export function FundoAnimado() {
  return (
    <div
      className="pointer-events-none fixed inset-0 -z-10 overflow-hidden"
      aria-hidden="true"
    >
      {/* Padrão de losangos (tipo tecido/papel de parede vintage) */}
      <div
        className="absolute inset-0 opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cg fill='none' stroke='%238B5A2B' stroke-width='0.5' opacity='0.4'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z'/%3E%3Cpath d='M30 15 L45 30 L30 45 L15 30 Z' opacity='0.5'/%3E%3Ccircle cx='30' cy='30' r='1.5' fill='%23B8860B' stroke='none' opacity='0.6'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: '60px 60px',
        }}
      />

      {/* Textura de papel (ruído sutil) */}
      <div
        className="absolute inset-0 opacity-20 mix-blend-multiply"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='300' height='300'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='2' seed='5' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.55 0 0 0 0 0.36 0 0 0 0 0.17 0 0 0 0.6 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '300px 300px',
        }}
      />

      {/* Manchas douradas grandes e borradas — se movem lentamente */}
      <motion.div
        className="absolute -left-1/4 top-0 h-[700px] w-[700px] rounded-full"
        animate={{
          x: [0, 80, -40, 0],
          y: [0, -50, 60, 0],
          scale: [1, 1.15, 0.9, 1],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: 'easeInOut' }}
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.35) 0%, rgba(184,134,11,0.15) 40%, transparent 70%)',
          filter: 'blur(60px)',
        }}
      />
      <motion.div
        className="absolute -right-1/4 top-1/2 h-[800px] w-[800px] rounded-full"
        animate={{
          x: [0, -100, 50, 0],
          y: [0, 70, -50, 0],
          scale: [1, 0.9, 1.2, 1],
        }}
        transition={{ duration: 35, repeat: Infinity, ease: 'easeInOut', delay: 5 }}
        style={{
          background: 'radial-gradient(circle, rgba(139,90,43,0.25) 0%, rgba(184,134,11,0.12) 45%, transparent 70%)',
          filter: 'blur(70px)',
        }}
      />
      <motion.div
        className="absolute left-1/4 bottom-0 h-[600px] w-[600px] rounded-full"
        animate={{
          x: [0, 60, -80, 0],
          y: [0, -60, 40, 0],
          scale: [1, 1.1, 0.95, 1],
        }}
        transition={{ duration: 28, repeat: Infinity, ease: 'easeInOut', delay: 10 }}
        style={{
          background: 'radial-gradient(circle, rgba(244,220,132,0.30) 0%, rgba(184,134,11,0.10) 50%, transparent 75%)',
          filter: 'blur(55px)',
        }}
      />

      {/* Faixa de luz diagonal ocasional (bem sutil) */}
      <motion.div
        className="absolute -left-[30%] top-1/3 h-[200px] w-[60%]"
        style={{
          transform: 'rotate(-20deg)',
          transformOrigin: 'center',
          background: 'linear-gradient(90deg, transparent, rgba(255,240,180,0.25), transparent)',
          filter: 'blur(30px)',
        }}
        initial={{ x: '-100%', opacity: 0 }}
        animate={{ x: '300%', opacity: [0, 1, 0] }}
        transition={{
          duration: 8,
          repeat: Infinity,
          repeatDelay: 20,
          ease: 'easeInOut',
        }}
      />
    </div>
  )
}
