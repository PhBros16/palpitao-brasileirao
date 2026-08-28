'use client'

// LuzesAmbiente — v9. O motor do tema noite/dia (v8) ganha os dois
// momentos de identidade pedidos:
//
//   1. Modo DIA — ao acender (entrada do app ou toggle), holofotes de
//      estádio varrem a tela num sweep rápido, sincronizados com o flash
//      dourado que já existia. É o "TCHAN" da luz nascendo.
//   2. Modo NOITE — enquanto apagado, um céu de "estádio depois do jogo"
//      fica ativo: lua sutil no alto + estrelas cintilando bem discretas.
//      Não é luz forte — é a ausência dela, com atmosfera.
//
// O "escuro de verdade" continua vindo do tema (tokens.css → data-tema),
// não de nenhuma camada aqui. Este arquivo só cuida de: (a) escrever o
// atributo de tema, e (b) os dois momentos visuais acima.

import { motion } from 'framer-motion'
import { useEffect, useState } from 'react'

const CHAVE_LUZES = 'palpitao_luzes_ligado_v3'
const CHAVE_CORTINA = 'palpitao_cortina_subir'
const CHAVE_ENTRADA = 'palpitao_entrada_teatral'
const ATRIBUTO_TEMA = 'data-tema'
const CLASSE_TRANSICAO = 'tema-transicionando'
const DURACAO_TRANSICAO_MS = 650

// Fade rápido na entrada teatral (sincroniza com a cortina subindo em 1400ms)
const DUR_TEATRAL = 0.8
// Fade normal fora da entrada teatral
const DUR_NORMAL = 1.6

// Posições fixas das estrelas do céu noturno — geradas uma vez, não a
// cada render (senão "pipocam" de lugar toda vez que o componente atualiza).
const ESTRELAS = [
  { x: 8, y: 6, tam: 1.6, atraso: 0.0 },
  { x: 18, y: 14, tam: 1.1, atraso: 0.6 },
  { x: 28, y: 5, tam: 1.4, atraso: 1.4 },
  { x: 40, y: 11, tam: 1.0, atraso: 2.1 },
  { x: 52, y: 4, tam: 1.7, atraso: 0.3 },
  { x: 63, y: 9, tam: 1.1, atraso: 1.8 },
  { x: 74, y: 3, tam: 1.3, atraso: 0.9 },
  { x: 85, y: 8, tam: 1.5, atraso: 2.6 },
  { x: 93, y: 15, tam: 1.0, atraso: 1.2 },
  { x: 5, y: 20, tam: 1.2, atraso: 3.0 },
  { x: 35, y: 22, tam: 0.9, atraso: 1.6 },
  { x: 60, y: 19, tam: 1.3, atraso: 0.5 },
  { x: 80, y: 24, tam: 1.0, atraso: 2.3 },
  { x: 15, y: 27, tam: 1.1, atraso: 3.4 },
  { x: 48, y: 26, tam: 0.9, atraso: 1.0 },
] as const

export function lerLuzesLigadas(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(CHAVE_LUZES) !== '0'
  } catch {
    return true
  }
}

/** Aplica data-tema em <html>, com uma janela de transição suave
 * (ver .tema-transicionando em globals.css) que se remove sozinha. */
function aplicarTema(ligado: boolean) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.add(CLASSE_TRANSICAO)
  html.setAttribute(ATRIBUTO_TEMA, ligado ? 'dia' : 'noite')
  window.setTimeout(() => {
    html.classList.remove(CLASSE_TRANSICAO)
  }, DURACAO_TRANSICAO_MS)
}

export function LuzesAmbiente() {
  const [ligado, setLigado] = useState(true)
  const [pronto, setPronto] = useState(false)
  const [flash, setFlash] = useState<{ cor: string; opacidade: number }>({ cor: 'quente', opacidade: 0 })
  const [duracao, setDuracao] = useState(DUR_NORMAL)
  const [mostrarHolofotes, setMostrarHolofotes] = useState(false)

  function piscarFlashQuente() {
    setFlash({ cor: 'quente', opacidade: 0.55 })
    setTimeout(() => setFlash((f) => ({ ...f, opacidade: 0 })), 1500)
    // Sweep dos holofotes acompanha o flash — só no modo dia acendendo.
    setMostrarHolofotes(true)
    setTimeout(() => setMostrarHolofotes(false), 1500)
  }

  function piscarFlashFrio() {
    setFlash({ cor: 'frio', opacidade: 0.35 })
    setTimeout(() => setFlash((f) => ({ ...f, opacidade: 0 })), 900)
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
      aplicarTema(false)
      setPronto(true)
      const t = setTimeout(() => {
        setLigado(true)
        aplicarTema(true)
        piscarFlashQuente()
        try {
          sessionStorage.setItem(CHAVE_LUZES, '1')
          sessionStorage.removeItem(CHAVE_ENTRADA)
        } catch { /* ignora */ }
      }, 50)
      return () => clearTimeout(t)
    }

    if (jaConfigurado) {
      const estado = lerLuzesLigadas()
      setLigado(estado)
      aplicarTema(estado)
      setPronto(true)
      return
    }

    setDuracao(DUR_NORMAL)
    setLigado(false)
    aplicarTema(false)
    setPronto(true)
    const t = setTimeout(() => {
      setLigado(true)
      aplicarTema(true)
      piscarFlashQuente()
      try { sessionStorage.setItem(CHAVE_LUZES, '1') } catch { /* ignora */ }
    }, 300)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    function handleToggle() {
      setDuracao(DUR_NORMAL)
      setLigado((atual) => {
        const novo = !atual
        aplicarTema(novo)
        if (novo) {
          piscarFlashQuente()
        } else {
          piscarFlashFrio()
        }
        try { sessionStorage.setItem(CHAVE_LUZES, novo ? '1' : '0') } catch { /* ignora */ }
        return novo
      })
    }
    // Existem DOIS botões de interruptor no app, em componentes diferentes,
    // cada um historicamente disparando um nome de evento diferente:
    //   - HeaderUsuario.tsx (ícone no cabeçalho)  → 'palpitao:alternarLuzes'
    //   - BotoesLuz.tsx (card "Chamar o TI")       → 'palpitao:alternarInterruptor'
    // Em vez de escolher um só (e quebrar o outro botão de novo), escuta os
    // dois — assim qualquer um dos dois interruptores físicos funciona.
    window.addEventListener('palpitao:alternarLuzes', handleToggle)
    window.addEventListener('palpitao:alternarInterruptor', handleToggle)
    return () => {
      window.removeEventListener('palpitao:alternarLuzes', handleToggle)
      window.removeEventListener('palpitao:alternarInterruptor', handleToggle)
    }
  }, [])

  if (!pronto) return null

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
      {/* ─── Céu de estádio apagado — só existe no modo noite ─────────── */}
      {!ligado && (
        <>
          {/* Luar — glow branco-azulado sutil vindo de cima, não é luz de jogo */}
          <div
            className="absolute rounded-full"
            style={{
              left: '50%',
              top: '-10%',
              width: 700,
              height: 700,
              transform: 'translateX(-50%)',
              background: 'radial-gradient(circle, rgba(210, 225, 245, 0.16) 0%, rgba(180, 200, 230, 0.06) 45%, transparent 70%)',
              filter: 'blur(20px)',
            }}
          />
          {/* Estrelas — cintilação bem discreta, posições fixas */}
          <svg
            className="absolute inset-0 h-full w-full"
            preserveAspectRatio="none"
            viewBox="0 0 100 100"
          >
            {ESTRELAS.map((e, i) => (
              <motion.circle
                key={i}
                cx={e.x}
                cy={e.y}
                r={e.tam * 0.15}
                fill="#e8eefa"
                initial={{ opacity: 0.15 }}
                animate={{ opacity: [0.15, 0.7, 0.15] }}
                transition={{
                  duration: 3.2,
                  repeat: Infinity,
                  ease: 'easeInOut',
                  delay: e.atraso,
                }}
              />
            ))}
          </svg>
        </>
      )}

      {/* ─── Sweep de holofotes — só no instante em que o modo dia acende ─── */}
      {mostrarHolofotes && (
        <svg
          className="absolute inset-0 h-full w-full"
          preserveAspectRatio="none"
          viewBox="0 0 100 100"
        >
          {[
            { origemX: 10, anguloDeg: 32, atraso: 0 },
            { origemX: 50, anguloDeg: 0, atraso: 0.08 },
            { origemX: 90, anguloDeg: -32, atraso: 0.16 },
          ].map((feixe, i) => (
            <motion.g
              key={i}
              initial={{ opacity: 0 }}
              animate={{ opacity: [0, 0.5, 0] }}
              transition={{ duration: 1.1, delay: feixe.atraso, ease: 'easeOut' }}
              style={{
                transformOrigin: `${feixe.origemX}% 0%`,
                transform: `rotate(${feixe.anguloDeg}deg)`,
              }}
            >
              <defs>
                <linearGradient id={`feixe-grad-${i}`} x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="rgba(255, 248, 225, 0.85)" />
                  <stop offset="100%" stopColor="rgba(255, 248, 225, 0)" />
                </linearGradient>
              </defs>
              <polygon
                points={`${feixe.origemX - 4},0 ${feixe.origemX + 4},0 ${feixe.origemX + 22},60 ${feixe.origemX - 22},60`}
                fill={`url(#feixe-grad-${i})`}
              />
            </motion.g>
          ))}
        </svg>
      )}

      {/* Flash de transição — dourado ao acender, azulado ao apagar */}
      <motion.div
        className="absolute rounded-full"
        style={{
          left: '50%',
          top: '15%',
          width: 900,
          height: 900,
          transform: 'translate(-50%, -50%)',
          background:
            flash.cor === 'quente'
              ? 'radial-gradient(circle, rgba(255, 245, 210, 1) 0%, rgba(255, 235, 180, 0.35) 35%, transparent 65%)'
              : 'radial-gradient(circle, rgba(180, 210, 255, 0.9) 0%, rgba(140, 175, 230, 0.3) 35%, transparent 65%)',
          filter: 'blur(40px)',
        }}
        animate={{ opacity: flash.opacidade }}
        transition={{ duration: flash.opacidade > 0 ? 0.5 : duracao, ease: 'easeInOut' }}
      />
    </div>
  )
}
