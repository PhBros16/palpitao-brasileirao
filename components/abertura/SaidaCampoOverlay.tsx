'use client'

// SaidaCampoOverlay — o rasgo de verdade. Montado no layout raiz (fora da
// árvore de qualquer rota, ver SaidaContext), então sobrevive ao router.push
// que troca "/" por "/inicio" — a Home real já está sendo montada por trás
// dele desde o primeiro frame, não um fundo de madeira.
//
// Reconstrói uma cópia estática (sem animação de entrada — já "revelada")
// do mesmo campo que a AberturaScreen mostra, na mesma escala/posição, e
// aplica o rasgo nela:
//
//   0-120ms   tremor (o "rasgando de fato", ainda inteiro)
//   120-400ms a costura abre: clip-path morfa de borda reta -> borda
//             irregular (mesmo número de vértices nos dois estados, pra
//             interpolar suave em vez de saltar) — é isso que vende
//             "rasgando progressivamente" em vez de "cortando"
//   400-1000ms desliza pra fora (translateX + rotate), a rebarba se solta
//             ~150ms depois do início da costura e cai com física própria
//             (rotação crescente, queda, fade), separada da trajetória da
//             página principal — é a tira fina de papel que sobra quando
//             se rasga uma folha de caderno pela perfuração.
//
// clip-path tem que ter o MESMO número de pontos nos dois estados (reto vs
// rasgado) pra o navegador conseguir interpolar entre os dois; se os counts
// não baterem, o clip só troca de estado de uma vez, sem transição visível.

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { BancoReservas } from './BancoReservas'
import { CenaEstadio } from './CenaEstadio'
import { estiloEntrada, ENCOLHER_BANCO, CONTAGEM_TIERS, calcularInicioTiers, INTERVALO_FILA } from './coreografia'
import { BANCO, TECNICO, TITULARES } from './elencoMock'
import { useSaida } from './SaidaContext'

const LARGURA_CENA = 390
const ALTURA_CENA = 844
const TIER_BANCO = 4

// Duração total do rasgo — some do estado global essa quantidade de ms
// depois de iniciarSaida(). Deixa uma folga de 80ms sobre a última fase.
const DURACAO_MS = 1080

const FUROS_Y = [8, 20, 32, 44, 56, 68, 80, 92]

/** Gera as duas bordas (reta e rasgada) com o MESMO número de vértices —
 *  condição pra o navegador interpolar (morfar) entre elas em vez de saltar. */
function gerarBordas() {
  const pontos = 14
  let s = 4242
  const rand = () => { s = (s * 9301 + 49297) % 233280; return s / 233280 }
  const ys = Array.from({ length: pontos + 1 }, (_, i) => (i / pontos) * 100)
  const xsJagged = ys.map(() => rand() * 9)

  const reta = `polygon(100% 0%, ${ys.map((y) => `0% ${y.toFixed(1)}%`).join(', ')}, 100% 100%)`
  const rasgada = `polygon(100% 0%, ${ys.map((y, i) => `${xsJagged[i].toFixed(1)}% ${y.toFixed(1)}%`).join(', ')}, 100% 100%)`
  return { reta, rasgada }
}

export function SaidaCampoOverlay() {
  const { saindo, finalizarSaida } = useSaida()
  const [escala, setEscala] = useState(1)
  const [alturaViewport, setAlturaViewport] = useState<number | null>(null)

  useEffect(() => {
    const atualizar = () => {
      const w = window.visualViewport?.width || window.innerWidth || LARGURA_CENA
      const h = window.visualViewport?.height || window.innerHeight || ALTURA_CENA
      const novoScale = Math.min(1, w / LARGURA_CENA, h / ALTURA_CENA)
      if (novoScale > 0) setEscala(novoScale)
      setAlturaViewport(h)
    }
    atualizar()
    window.addEventListener('resize', atualizar)
    window.visualViewport?.addEventListener('resize', atualizar)
    return () => {
      window.removeEventListener('resize', atualizar)
      window.visualViewport?.removeEventListener('resize', atualizar)
    }
  }, [])

  useEffect(() => {
    if (!saindo) return
    const t = setTimeout(() => finalizarSaida(), DURACAO_MS)
    return () => clearTimeout(t)
  }, [saindo, finalizarSaida])

  const { reta, rasgada } = useMemo(() => gerarBordas(), [])

  // Elenco na posição final, já "revelado" — sem tocar a coreografia de
  // entrada (animar: false força o transform estático final, sem reanimar).
  const inicioTiers = useMemo(() => calcularInicioTiers(CONTAGEM_TIERS), [])
  const titulares = useMemo(
    () => TITULARES.map((j) => ({ ...j, entrada: { ...estiloEntrada(j.xpx, j.ypx, true, 1, 0, true), animar: false } })),
    [],
  )
  const reservas = useMemo(
    () => BANCO.map((r) => ({ ...r, entrada: { ...estiloEntrada(r.xpx, r.ypx, false, ENCOLHER_BANCO, 0, true), animar: false } })),
    [],
  )
  const admin = useMemo(
    () => ({ entrada: { ...estiloEntrada(322, 734, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO], true), animar: false } }),
    [inicioTiers],
  )
  const tecnico = useMemo(
    () => ({ ...TECNICO, entrada: { ...estiloEntrada(TECNICO.xpx, TECNICO.ypx, false, ENCOLHER_BANCO, 0, true), animar: false } }),
    [],
  )

  if (!saindo) return null

  return (
    <div className="pointer-events-none fixed inset-0 overflow-hidden" style={{ zIndex: 300 }}>
      {/* Flash dourado — luz "por trás" no instante em que o campo rasga.
          Emana da esquerda porque é o lado por onde a costura abre. */}
      <motion.div
        className="absolute inset-0"
        style={{
          background:
            'radial-gradient(ellipse at 25% 50%, #FFF4C4 0%, #FFD870 30%, #E8A020 70%, transparent 100%)',
        }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.85, 0.35, 0] }}
        transition={{ duration: DURACAO_MS / 1000, times: [0, 0.1, 0.3, 0.55, 1], ease: 'easeOut' }}
      />

      {/* Caixa da cena — mesma escala/centralização usada na AberturaScreen,
          pra encaixar sem salto visual no momento da troca de rota. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: alturaViewport ? alturaViewport / 2 : '50%',
          width: LARGURA_CENA,
          height: ALTURA_CENA,
          transform: `translate(-50%, -50%) scale(${escala})`,
          transformOrigin: 'center center',
        }}
      >
        {/* A página que rasga e sai */}
        <motion.div
          style={{
            position: 'absolute',
            inset: 0,
            filter: 'drop-shadow(-8px 6px 14px rgba(0,0,0,0.55))',
          }}
          initial={{ x: '0%', rotate: 0, clipPath: reta }}
          animate={{
            x: ['0%', '-0.6%', '0.6%', '0%', '0%', '-115%'],
            rotate: [0, -0.5, 0.5, 0, 0, -7],
            clipPath: [reta, reta, reta, reta, rasgada, rasgada],
          }}
          transition={{
            duration: DURACAO_MS / 1000,
            times: [0, 0.035, 0.07, 0.11, 0.37, 1],
            ease: [0.5, 0, 0.4, 1],
          }}
        >
          <CenaEstadio revelado titulares={titulares} carregandoId={null} />
          <BancoReservas revelado reservas={reservas} admin={admin} tecnico={tecnico} carregandoId={null} />

          {/* furos de perfuração — borda direita, o lado que "fica" */}
          {FUROS_Y.map((y) => (
            <div
              key={y}
              className="absolute rounded-full"
              style={{ right: 6, top: `${y}%`, width: 10, height: 10, background: 'rgba(0,0,0,0.5)' }}
            />
          ))}
        </motion.div>

        {/* Rebarba — a tira fina que se solta da costura e cai separada,
            com física própria (não segue a página: some pra baixo enquanto
            a página desliza pro lado). */}
        <motion.div
          className="pointer-events-none absolute"
          style={{
            left: -4,
            top: 0,
            bottom: 0,
            width: 26,
            background: 'rgba(20,14,8,0.55)',
            clipPath: 'polygon(0% 0%, 100% 6%, 82% 14%, 100% 24%, 84% 34%, 100% 46%, 86% 58%, 100% 70%, 82% 82%, 100% 92%, 0% 100%)',
          }}
          initial={{ x: '0%', y: 0, rotate: 0, opacity: 0 }}
          animate={{
            x: ['0%', '0%', '-6%', '-22%', '-48%'],
            y: [0, 0, 20, 90, 220],
            rotate: [0, 0, 18, 55, 130],
            opacity: [0, 1, 1, 0.6, 0],
          }}
          transition={{
            duration: DURACAO_MS / 1000,
            times: [0, 0.14, 0.32, 0.6, 1],
            ease: 'easeIn',
          }}
        >
          {FUROS_Y.map((y) => (
            <div
              key={y}
              className="absolute rounded-full"
              style={{ left: 4, top: `${y}%`, width: 8, height: 8, background: 'rgba(0,0,0,0.6)' }}
            />
          ))}
        </motion.div>
      </div>
    </div>
  )
}
