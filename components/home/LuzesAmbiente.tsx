'use client'

// LuzesAmbiente — v11.
//
//   Modo DIA: só o flash dourado (v8/v10) — sem sweep de holofotes.
//
//   Modo NOITE: arquibancada de jogo grande com as luzes apagadas —
//   estrelas + mar de flashes de celular da torcida + sinalizadores
//   vermelhos com fumaça (v10).
//
//   Entrada vinda do login (v11): antes, essa revelação era dividida entre
//   este arquivo e um CortinaSubindo separado, os dois brigando pela mesma
//   flag do sessionStorage — resultado era tela preta + pisca, duas
//   animações desencontradas. Agora é UMA coisa só, daqui: um véu preto
//   cobre a tela inteira instantaneamente ao montar (sem flash de conteúdo
//   errado por baixo), e some junto com o flash dourado acendendo — um
//   movimento contínuo, não duas transições empilhadas.

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'

const CHAVE_LUZES = 'palpitao_luzes_ligado_v3'
const CHAVE_CORTINA = 'palpitao_cortina_subir'
const CHAVE_ENTRADA = 'palpitao_entrada_teatral'
const ATRIBUTO_TEMA = 'data-tema'
const CLASSE_TRANSICAO = 'tema-transicionando'
const DURACAO_TRANSICAO_MS = 650

const DUR_TEATRAL = 0.8
const DUR_NORMAL = 1.6

export function lerLuzesLigadas(): boolean {
  if (typeof window === 'undefined') return true
  try {
    return sessionStorage.getItem(CHAVE_LUZES) !== '0'
  } catch {
    return true
  }
}

function aplicarTema(ligado: boolean) {
  if (typeof document === 'undefined') return
  const html = document.documentElement
  html.classList.add(CLASSE_TRANSICAO)
  html.setAttribute(ATRIBUTO_TEMA, ligado ? 'dia' : 'noite')
  window.setTimeout(() => {
    html.classList.remove(CLASSE_TRANSICAO)
  }, DURACAO_TRANSICAO_MS)
}

function pseudoAleatorio(semente: number): number {
  const x = Math.sin(semente * 12.9898) * 43758.5453
  return x - Math.floor(x)
}

function gerarEstrelas(qtd: number) {
  return Array.from({ length: qtd }, (_, i) => ({
    x: pseudoAleatorio(i * 3.1 + 1) * 100,
    y: pseudoAleatorio(i * 7.7 + 2) * 38,
    tam: 0.6 + pseudoAleatorio(i * 5.3 + 3) * 1.1,
    atraso: pseudoAleatorio(i * 9.1 + 4) * 4,
    duracao: 2.4 + pseudoAleatorio(i * 4.4 + 5) * 2.2,
  }))
}

function gerarFlashesCelular(qtd: number) {
  return Array.from({ length: qtd }, (_, i) => ({
    x: pseudoAleatorio(i * 6.2 + 11) * 100,
    y: 30 + pseudoAleatorio(i * 8.8 + 12) * 62,
    tam: 1.1 + pseudoAleatorio(i * 3.6 + 13) * 1.6,
    atraso: pseudoAleatorio(i * 11.3 + 14) * 5,
    duracao: 1.6 + pseudoAleatorio(i * 6.6 + 15) * 2.4,
    picoOpacidade: 0.5 + pseudoAleatorio(i * 2.9 + 16) * 0.4,
  }))
}

const SINALIZADORES = [
  { x: 12, y: 78, escala: 1.15, atraso: 0 },
  { x: 88, y: 82, escala: 0.9, atraso: 1.4 },
  { x: 50, y: 88, escala: 0.75, atraso: 2.8 },
] as const

export function LuzesAmbiente() {
  const [ligado, setLigado] = useState(true)
  const [pronto, setPronto] = useState(false)
  const [flash, setFlash] = useState<{ cor: string; opacidade: number }>({ cor: 'quente', opacidade: 0 })
  const [duracao, setDuracao] = useState(DUR_NORMAL)
  const [veuAtivo, setVeuAtivo] = useState(false)

  const estrelas = useMemo(() => gerarEstrelas(60), [])
  const flashesCelular = useMemo(() => gerarFlashesCelular(40), [])

  function piscarFlashQuente() {
    setFlash({ cor: 'quente', opacidade: 0.55 })
    setTimeout(() => setFlash((f) => ({ ...f, opacidade: 0 })), 1500)
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
        // Antes o CortinaSubindo apagava CHAVE_CORTINA por conta própria.
        // Agora essa responsabilidade é só daqui — se não apagar, a próxima
        // navegação pra Início nesta mesma aba re-acionaria a entrada
        // teatral por engano.
        sessionStorage.removeItem(CHAVE_CORTINA)
        sessionStorage.setItem(CHAVE_ENTRADA, '1')
      }
    } catch { /* ignora */ }

    let jaConfigurado = false
    try {
      jaConfigurado = sessionStorage.getItem(CHAVE_LUZES) !== null
    } catch { /* ignora */ }

    if (entradaTeatral) {
      // Nasce coberta pelo véu preto (instantâneo, sem transição própria)
      // + tema noite por baixo. O véu some junto com o flash dourado
      // acendendo, ~200ms depois — tempo pra Home terminar de montar por
      // baixo antes de revelar, sem um segundo sistema de fade brigando.
      setDuracao(DUR_TEATRAL)
      setLigado(false)
      aplicarTema(false)
      setVeuAtivo(true)
      setPronto(true)
      const t = setTimeout(() => {
        setLigado(true)
        aplicarTema(true)
        piscarFlashQuente()
        setVeuAtivo(false)
        try {
          sessionStorage.setItem(CHAVE_LUZES, '1')
          sessionStorage.removeItem(CHAVE_ENTRADA)
        } catch { /* ignora */ }
      }, 200)
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
    window.addEventListener('palpitao:alternarLuzes', handleToggle)
    window.addEventListener('palpitao:alternarInterruptor', handleToggle)
    return () => {
      window.removeEventListener('palpitao:alternarLuzes', handleToggle)
      window.removeEventListener('palpitao:alternarInterruptor', handleToggle)
    }
  }, [])

  if (!pronto) return null

  return (
    <>
      {veuAtivo && (
        <div
          className="pointer-events-none fixed inset-0"
          style={{ zIndex: 200, background: '#0a0503' }}
          aria-hidden="true"
        />
      )}
      <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 1 }} aria-hidden="true">
        {!ligado && (
          <>
            <div
              className="absolute rounded-full"
              style={{
                left: '50%',
                top: '-10%',
                width: 700,
                height: 700,
                transform: 'translateX(-50%)',
                background: 'radial-gradient(circle, rgba(210, 225, 245, 0.14) 0%, rgba(180, 200, 230, 0.05) 45%, transparent 70%)',
                filter: 'blur(20px)',
              }}
            />

            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {estrelas.map((e, i) => (
                <motion.circle
                  key={`estrela-${i}`}
                  cx={e.x}
                  cy={e.y}
                  r={e.tam * 0.14}
                  fill="#e8eefa"
                  initial={{ opacity: 0.12 }}
                  animate={{ opacity: [0.12, 0.65, 0.12] }}
                  transition={{ duration: e.duracao, repeat: Infinity, ease: 'easeInOut', delay: e.atraso }}
                />
              ))}
            </svg>

            <svg className="absolute inset-0 h-full w-full" preserveAspectRatio="none" viewBox="0 0 100 100">
              {flashesCelular.map((f, i) => (
                <motion.circle
                  key={`flash-${i}`}
                  cx={f.x}
                  cy={f.y}
                  r={f.tam * 0.16}
                  fill="#fff6d8"
                  initial={{ opacity: 0.06 }}
                  animate={{ opacity: [0.06, f.picoOpacidade, 0.06] }}
                  transition={{ duration: f.duracao, repeat: Infinity, ease: 'easeInOut', delay: f.atraso }}
                  style={{ filter: 'blur(0.15px)' }}
                />
              ))}
            </svg>

            {SINALIZADORES.map((s, i) => (
              <div key={`sinalizador-${i}`} className="absolute" style={{ left: `${s.x}%`, top: `${s.y}%` }}>
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    top: '50%',
                    width: 180 * s.escala,
                    height: 180 * s.escala,
                    transform: 'translate(-50%, -50%)',
                    background: 'radial-gradient(circle, rgba(220, 40, 30, 0.55) 0%, rgba(200, 30, 20, 0.22) 40%, transparent 70%)',
                    filter: 'blur(6px)',
                  }}
                  animate={{ opacity: [0.5, 1, 0.6, 0.9, 0.5] }}
                  transition={{ duration: 1.8, repeat: Infinity, ease: 'easeInOut', delay: s.atraso }}
                />
                <motion.div
                  className="absolute rounded-full"
                  style={{
                    left: '50%',
                    bottom: '50%',
                    width: 60 * s.escala,
                    height: 140 * s.escala,
                    transform: 'translateX(-50%)',
                    background: 'linear-gradient(to top, rgba(120, 60, 50, 0.28), transparent 80%)',
                    filter: 'blur(8px)',
                  }}
                  animate={{ y: [0, -40, -80], opacity: [0.35, 0.18, 0] }}
                  transition={{ duration: 4.5, repeat: Infinity, ease: 'easeOut', delay: s.atraso }}
                />
              </div>
            ))}
          </>
        )}

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
    </>
  )
}
