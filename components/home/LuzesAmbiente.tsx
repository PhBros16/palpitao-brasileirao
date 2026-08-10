'use client'

// LuzesAmbiente — v3, drasticamente simplificado. Duas versões anteriores
// (a segunda já com fonte única de estado) ainda travaram em teste real —
// cortamos escopo agressivamente pra maximizar confiabilidade: sem
// refletores descendo, sem "cansaço"/piscada aleatória, sem rajada de
// vento, sem "momento de silêncio", sem "Chamar TI". Só o essencial:
//   - Uma vez por sessão: fade suave de escuro pra claro (~1.4s)
//   - Interruptor manual (botão no header, ver HeaderUsuario.tsx) liga/
//     desliga com o mesmo fade — sem NENHUMA animação de loop rodando
//     enquanto ligado ou desligado, só dois estados estáticos e uma
//     transição simples entre eles.
import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const CHAVE_LUZES = 'palpitao_luzes_ligado_v3'

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

  useEffect(() => {
    let jaConfigurado = false
    try {
      jaConfigurado = sessionStorage.getItem(CHAVE_LUZES) !== null
    } catch { /* ignora */ }

    if (jaConfigurado) {
      setLigado(lerLuzesLigadas())
      setPronto(true)
      return
    }

    setLigado(false)
    setPronto(true)
    const t = setTimeout(() => {
      setLigado(true)
      try { sessionStorage.setItem(CHAVE_LUZES, '1') } catch { /* ignora */ }
    }, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function handleToggle() {
      setLigado((atual) => {
        const novo = !atual
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
        animate={{ background: ligado ? 'rgba(10, 6, 2, 0)' : 'rgba(10, 6, 2, 0.7)' }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '30%',
          width: 1100,
          height: 1100,
          transform: 'translate(-50%, -50%)',
          background: 'radial-gradient(circle, rgba(255, 245, 210, 1) 0%, rgba(255, 235, 180, 0.4) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: ligado ? 0.8 : 0 }}
        transition={{ duration: 1.4, ease: 'easeInOut' }}
      />
    </div>
  )
}
