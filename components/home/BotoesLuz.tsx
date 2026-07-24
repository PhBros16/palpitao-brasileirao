'use client'

// BotoesLuz — dupla de botões pra Home:
// 1. "Chamar TI" 🔧 — reseta lâmpada queimada + cansaço, roda mini-sequência visual
// 2. Interruptor 💡 — desliga/liga todas as luzes manualmente
//
// Comunicação com LuzesAmbiente via eventos customizados do window.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'
import { showToast } from './Toast'
import { vibrar } from '@/lib/haptic'

const CHAVE_INTERRUPTOR = 'palpitao_interruptor_desligado'

export function BotoesLuz() {
  const [chamandoTI, setChamandoTI] = useState(false)
  const [interruptorLigado, setInterruptorLigado] = useState(true)
  const [alternando, setAlternando] = useState(false)

  useEffect(() => {
    try {
      const desligado = sessionStorage.getItem(CHAVE_INTERRUPTOR) === '1'
      setInterruptorLigado(!desligado)
    } catch { /* ignora */ }
  }, [])

  async function chamarTI() {
    if (chamandoTI) return
    vibrar('leve')
    setChamandoTI(true)
    showToast('Chamando o TI... 📞', 'info', 3500)

    // Simula tempo do TI ir até o poste
    await new Promise((r) => setTimeout(r, 6000))

    // Dispara evento pra LuzesAmbiente rodar a sequência de conserto
    try {
      window.dispatchEvent(new CustomEvent('palpitao:chamarTI'))
    } catch { /* ignora */ }

    vibrar('sucesso')
    showToast('Consertei a lâmpada, Pai. 🔧', 'sucesso', 4000)

    // Aguarda animação terminar
    await new Promise((r) => setTimeout(r, 5000))
    setChamandoTI(false)
  }

  async function alternarInterruptor() {
    if (alternando) return
    vibrar('medio')
    setAlternando(true)

    const novoEstado = !interruptorLigado
    setInterruptorLigado(novoEstado)

    try {
      window.dispatchEvent(new CustomEvent('palpitao:alternarInterruptor'))
    } catch { /* ignora */ }

    showToast(
      novoEstado ? 'Luzes ligadas 💡' : 'Luzes desligadas 🌑',
      'info',
      2500,
    )

    // Aguarda animação terminar
    await new Promise((r) => setTimeout(r, 5500))
    setAlternando(false)
  }

  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-papel-borda-200 bg-papel-50/80 px-3 py-2 backdrop-blur-sm">
      {/* Botão Chamar TI */}
      <motion.button
        type="button"
        onClick={chamarTI}
        disabled={chamandoTI}
        whileTap={{ scale: 0.94 }}
        transition={{ duration: 0.15 }}
        className="flex flex-1 items-center gap-2 rounded-md border border-couro-400 bg-gradient-to-b from-papel-100 to-papel-200 px-3 py-2 font-mono text-[11px] font-bold uppercase tracking-wider text-couro-700 shadow-sm transition-colors hover:from-papel-50 hover:to-papel-100 disabled:opacity-50"
      >
        <span className="text-base">🔧</span>
        <span>{chamandoTI ? 'Chamando...' : 'Chamar o TI'}</span>
      </motion.button>

      {/* Interruptor */}
      <Interruptor ligado={interruptorLigado} onClick={alternarInterruptor} disabled={alternando} />
    </div>
  )
}

// ─── Interruptor cartoon ──────────────────────────────────────────────

function Interruptor({
  ligado,
  onClick,
  disabled,
}: {
  ligado: boolean
  onClick: () => void
  disabled: boolean
}) {
  return (
    <motion.button
      type="button"
      onClick={onClick}
      disabled={disabled}
      whileTap={{ scale: 0.92 }}
      transition={{ duration: 0.15 }}
      aria-label={ligado ? 'Desligar luzes' : 'Ligar luzes'}
      className="relative flex-shrink-0 disabled:opacity-60"
      style={{ width: 44, height: 60 }}
    >
      <svg viewBox="0 0 44 60" width="44" height="60">
        {/* Placa de fundo */}
        <rect
          x="2"
          y="2"
          width="40"
          height="56"
          rx="4"
          fill="#F0DBAA"
          stroke="#8B5A2B"
          strokeWidth="1.5"
        />

        {/* Detalhe interno */}
        <rect
          x="6"
          y="6"
          width="32"
          height="48"
          rx="2"
          fill="none"
          stroke="#B8860B"
          strokeWidth="0.5"
          opacity="0.5"
        />

        {/* Parafusos nos cantos */}
        <circle cx="6" cy="6" r="1.5" fill="#5C3818" />
        <circle cx="38" cy="6" r="1.5" fill="#5C3818" />
        <circle cx="6" cy="54" r="1.5" fill="#5C3818" />
        <circle cx="38" cy="54" r="1.5" fill="#5C3818" />

        {/* Trilho da chave */}
        <rect
          x="14"
          y="14"
          width="16"
          height="32"
          rx="3"
          fill="#3E2A1A"
          stroke="#1a1408"
          strokeWidth="0.8"
        />

        {/* Chave (o botão que sobe/desce) */}
        <motion.rect
          x="14"
          y="14"
          width="16"
          height="16"
          rx="2"
          fill={ligado ? '#F5DC82' : '#6B4A15'}
          stroke="#1a1408"
          strokeWidth="1"
          animate={{
            y: ligado ? 14 : 30,
            fill: ligado ? '#F5DC82' : '#6B4A15',
          }}
          transition={{
            y: { type: 'spring', stiffness: 400, damping: 22 },
            fill: { duration: 0.2 },
          }}
        />

        {/* Marca "I / O" */}
        <text
          x="22"
          y="12"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#5C3818"
          textAnchor="middle"
        >
          I
        </text>
        <text
          x="22"
          y="53"
          fontSize="6"
          fontFamily="monospace"
          fontWeight="bold"
          fill="#5C3818"
          textAnchor="middle"
        >
          O
        </text>
      </svg>
    </motion.button>
  )
}
