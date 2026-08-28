'use client'

// LuzesAmbiente — v8. Deixou de ser um véu preto por cima da tela e virou
// o motor do tema noite/dia de verdade.
//
// Antes (v7): "apagar a luz" era só uma camada preta a 90% de opacidade
// cobrindo tudo. Nenhum elemento da interface era redesenhado pro
// contexto escuro — e é exatamente por isso que bordas douradas e badges
// coloridos, feitos pra viver sobre papel claro, viravam "neon" contra
// o fundo quase-preto.
//
// Agora: o toggle escreve data-tema="noite"/"dia" em <html>. Como todas
// as cores do app (bg-papel-*, border-dourado-*, text-tinta-* etc.) já
// resolvem via variável CSS (ver tailwind.config.ts → styles/tokens.css),
// o app inteiro se redesenha sozinho pro tema noturno — sem tocar em
// nenhum outro componente.
//
// O flash dourado (entrando) e o flash frio (saindo) continuam existindo,
// só que agora são só o MOMENTO da transição — não uma camada permanente.
// Quem cuida do "escuro de verdade" enquanto a luz fica apagada são as
// variáveis do tema noite em tokens.css.

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
      {/* Flash de transição — só existe durante o instante da troca.
          Quente (dourado) quando acende, frio (azulado) quando apaga.
          O "escuro de verdade" enquanto a luz fica apagada não vem mais
          daqui — vem do tema noite em tokens.css. */}
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
