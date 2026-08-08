'use client'

// SaidaCampoOverlay — o campo É a página, e ela vira exatamente como a capa
// virou pra abrir o álbum. Mesma mecânica, espelhada: pivô na esquerda,
// preserve-3d, rotateY(0) -> rotateY(-180deg), frente/verso trocando de
// visibility na metade do giro, espessura própria com as paredes 3D — só
// que fina (página de papel), não os 24px de couro da capa.
//
// Montado no layout raiz (fora da árvore de qualquer rota, ver SaidaContext),
// então sobrevive ao router.push que troca "/" por "/inicio" — a Home real
// já está sendo montada por trás dele desde o primeiro frame.
//
// Timeline (DUR_FLIP = 1200ms, igual ao flip da capa):
//   frame 0        monta com rotateY(0) (precisa de 2x requestAnimationFrame
//                   antes de setar o alvo, senão o navegador não tem uma
//                   pintura intermediária pra animar a partir dela e o giro
//                   "salta" direto pro final sem transição visível)
//   0-1200ms        gira até rotateY(-180deg)
//   600ms (metade)  troca frente (campo) por verso (PaginaVerso) — o exato
//                   instante em que a página está de canto pro espectador
//   1200+140ms      finalizarSaida() — a Home (já montada por trás) fica
//                   visível sozinha

import { motion } from 'framer-motion'
import { useEffect, useMemo, useState } from 'react'
import { BancoReservas } from './BancoReservas'
import { CenaEstadio } from './CenaEstadio'
import { PaginaEspessura } from './PaginaEspessura'
import { PaginaVerso } from './PaginaVerso'
import { estiloEntrada, ENCOLHER_BANCO, CONTAGEM_TIERS, calcularInicioTiers, DUR_FLIP, EASE_LUZ } from './coreografia'
import { BANCO, TECNICO, TITULARES } from './elencoMock'
import { useSaida } from './SaidaContext'

const LARGURA_CENA = 390
const ALTURA_CENA = 844
const TIER_BANCO = 4
const ESPESSURA_PAGINA = 7

export function SaidaCampoOverlay() {
  const { saindo, finalizarSaida } = useSaida()
  const [escala, setEscala] = useState(1)
  const [alturaViewport, setAlturaViewport] = useState<number | null>(null)
  const [virado, setVirado] = useState(false)
  const [mostrarVerso, setMostrarVerso] = useState(false)

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
    if (!saindo) {
      setVirado(false)
      setMostrarVerso(false)
      return
    }
    // dupla rAF: garante que o navegador pinta o frame em rotateY(0) antes
    // de setar o alvo -180deg, senão não existe "de onde" animar.
    let raf2 = 0
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => setVirado(true))
    })
    const tVerso = setTimeout(() => setMostrarVerso(true), DUR_FLIP / 2)
    const tFim = setTimeout(() => finalizarSaida(), DUR_FLIP + 140)
    return () => {
      cancelAnimationFrame(raf1)
      cancelAnimationFrame(raf2)
      clearTimeout(tVerso)
      clearTimeout(tFim)
    }
  }, [saindo, finalizarSaida])

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
      {/* Brilho de canto — a luz pegando a borda da página bem no instante
          em que ela está de perfil pro espectador (meio do giro). */}
      <motion.div
        className="absolute inset-0"
        style={{ background: 'radial-gradient(ellipse at 50% 50%, #FFF4C4 0%, #FFD870 25%, transparent 65%)' }}
        initial={{ opacity: 0 }}
        animate={{ opacity: [0, 0, 0.55, 0.55, 0] }}
        transition={{ duration: (DUR_FLIP + 140) / 1000, times: [0, 0.42, 0.5, 0.58, 0.75], ease: 'easeOut' }}
      />

      {/* Caixa da cena — mesma escala/centralização/perspectiva usada na
          AberturaScreen, pra encaixar sem salto visual na troca de rota. */}
      <div
        style={{
          position: 'absolute',
          left: '50%',
          top: alturaViewport ? alturaViewport / 2 : '50%',
          width: LARGURA_CENA,
          height: ALTURA_CENA,
          transform: `translate(-50%, -50%) scale(${escala})`,
          transformOrigin: 'center center',
          perspective: 1700,
          perspectiveOrigin: '52% 45%',
        }}
      >
        {/* A página que vira — mesmíssima mecânica da capa, espelhada */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transition: `transform ${DUR_FLIP}ms ${EASE_LUZ}`,
            transform: virado ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            boxShadow: '0 30px 70px rgba(0,0,0,0.5)',
          }}
        >
          {/* frente — o campo de verdade */}
          <div style={{ position: 'absolute', inset: 0, visibility: mostrarVerso ? 'hidden' : 'visible', backfaceVisibility: 'hidden' }}>
            <CenaEstadio revelado titulares={titulares} carregandoId={null} />
            <BancoReservas revelado reservas={reservas} admin={admin} tecnico={tecnico} carregandoId={null} />
          </div>

          {/* verso — página de papel, não couro */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              visibility: mostrarVerso ? 'visible' : 'hidden',
              transformOrigin: 'left center',
              transform: `rotateY(180deg) translateZ(${ESPESSURA_PAGINA}px)`,
              backfaceVisibility: 'hidden',
            }}
          >
            <PaginaVerso />
          </div>

          <PaginaEspessura largura={ESPESSURA_PAGINA} />
        </div>
      </div>
    </div>
  )
}
