'use client'

// LuzesAmbiente — v7. Entrada teatral tem fade rápido pra bater com
// a cortina subindo (não fica arrastando depois da cortina sumir).

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const CHAVE_LUZES = 'palpitao_luzes_ligado_v3'
const CHAVE_CORTINA = 'palpitao_cortina_subir'
const CHAVE_ENTRADA = 'palpitao_entrada_teatral'

// Fade rápido na entrada teatral (sincroniza com a cortina subindo em 1400ms)
const DUR_TEATRAL = 0.8
// Fade normal fora da entrada teatral
const DUR_NORMAL = 1.6

export function lerLuzesLigadas(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(CHAVE_LUZES) !== '0'
  } catch {
    return true
  }
}

export function LuzesAmbiente() {
  const [ligado, setLigado] = useState(true)
  const [pronto, setPronto] = useState(false)
  const [haloOpacidade, setHaloOpacidade] = useState(0)
  const [duracao, setDuracao] = useState(DUR_NORMAL)

  function piscarHalo() {
    setHaloOpacidade(0.55)
    setTimeout(() => setHaloOpacidade(0), 1500)
  }

  useEffect(() => {
    let entradaTeatral = false
    try {
      entradaTeatral =
        sessionStorage.getItem(CHAVE_CORTINA) === '1' ||
        sessionStorage.getItem(CHAVE_ENTRADA) === '1'
      if (entradaTeatral) {
        sessionStorage.setItem(CHAVE_ENTRADA, '1')
      }
    } catch { /* ignora */ }

    let jaConfigurado = false
    try {
      jaConfigurado = sessionStorage.getItem(CHAVE_LUZES) !== null
    } catch { /* ignora */ }

    if (entradaTeatral) {
      // Nasce apagada, acende junto com a cortina subindo
      setDuracao(DUR_TEATRAL)
      setLigado(false)
      setPronto(true)
      const t = setTimeout(() => {
        setLigado(true)
        piscarHalo()
        try {
          sessionStorage.setItem(CHAVE_LUZES, '1')
          sessionStorage.removeItem(CHAVE_ENTRADA)
        } catch { /* ignora */ }
      }, 50)
      return () => clearTimeout(t)
    }

    if (jaConfigurado) {
      setLigado(lerLuzesLigadas())
      setPronto(true)
      return
    }

    setDuracao(DUR_NORMAL)
    setLigado(false)
    setPronto(true)
    const t = setTimeout(() => {
      setLigado(true)
      piscarHalo()
      try { sessionStorage.setItem(CHAVE_LUZES, '1') } catch { /* ignora */ }
    }, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function handleToggle() {
      setDuracao(DUR_NORMAL)
      setLigado((atual) => {
        const novo = !atual
        if (novo) piscarHalo()
        try { sessionStorage.setItem(CHAVE_LUZES, novo ? '1' : '0') } catch { /* ignora */ }
        return novo
      })
    }
    window.addEventListener('palpitao:alternarLuzes', handleToggle)
    return () => window.removeEventListener('palpitao:alternarLuzes', handleToggle)
  }, [])

  if (!pronto) return null

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
      <motion.div
        className="absolute inset-0"
        animate={{ background: ligado ? 'rgba(10, 6, 2, 0)' : 'rgba(10, 6, 2, 0.9)' }}
        transition={{ duration: duracao, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '15%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 245, 210, 1) 0%, rgba(255, 235, 180, 0.35) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: haloOpacidade }}
        transition={{ duration: haloOpacidade > 0 ? 0.5 : duracao, ease: 'easeInOut' }}
      />
    </div>
  )
}
