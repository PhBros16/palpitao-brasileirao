'use client'

// AberturaScreen — sequência cinematográfica completa: capa de couro (com
// medalhão/parallax/shimmer/poeira dourada ambiente) → flip 3D com espessura
// real → nuvem de poeira (assenta, depois sopra) → cascata de refletores por
// zona (goleiro→defesa→meio→ataque→banco) com o elenco saindo em fila única
// da lateral esquerda, na altura do meio-campo, e se espalhando pras posições.
//
// Cena de referência fixa em 390×844 (todo o layout — campo, banco, zonas de
// luz, vetores de corrida — é calibrado nesses px exatos) e escalada via
// ResizeObserver pra caber em qualquer viewport/contêiner real, sem recalcular
// a coreografia. Áudio sintetizado (somKit) dispara no toque de "Abrir o
// Álbum" — único gesto que libera som no navegador (CLAUDE.md Seção 4).

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import styles from './abertura.module.css'
import { BancoReservas } from './BancoReservas'
import { CapaAlbum } from './CapaAlbum'
import { CapaEspessura } from './CapaEspessura'
import { CapaVerso } from './CapaVerso'
import { CenaEstadio } from './CenaEstadio'
import {
  CONTAGEM_TIERS,
  DUR_FLIP,
  ENCOLHER_BANCO,
  calcularInicioTiers,
  estiloEntrada,
  INTERVALO_FILA,
} from './coreografia'
import { PoeiraTransicao, DUST_SETTLE_HOLD, DUST_BLOW_DUR } from './PoeiraTransicao'
import { somKit } from './somKit'
import { BANCO, TITULARES } from './elencoMock'
import type { FasePoeira } from './tipos'

const LARGURA_CENA = 390
const ALTURA_CENA = 844

export function AberturaScreen() {
  const [aberto, setAberto] = useState(false)
  const [mostrarVerso, setMostrarVerso] = useState(false)
  // O verso (miolo do livro), corretamente ancorado no mesmo pivô do pai,
  // cobre 100% da tela ao final do flip — geometricamente correto, mas
  // precisa dissolver em seguida, senão bloqueia a poeira/CenaEstadio pra
  // sempre. Some logo depois do flip assentar, não só depois de toda a
  // sequência de poeira (a poeira precisa aparecer POR CIMA do interior já
  // visível, não atrás da capa ainda fechada).
  const [capaVisivel, setCapaVisivel] = useState(true)
  const [revelado, setRevelado] = useState(false)
  const [fasePoeira, setFasePoeira] = useState<FasePoeira>('oculta')
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [escala, setEscala] = useState(1)

  const outerRef = useRef<HTMLDivElement>(null)
  const iniciado = useRef(false)
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const limparTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  // Escala a cena fixa (390×844) pra caber no contêiner real, sem recalcular
  // a coreografia (todos os px de layout assumem exatamente esse tamanho).
  useEffect(() => {
    const atualizar = () => {
      const el = outerRef.current
      const w = el?.clientWidth ?? window.innerWidth
      const h = el?.clientHeight ?? window.innerHeight
      setEscala(Math.min(1, w / LARGURA_CENA, h / ALTURA_CENA))
    }
    atualizar()
    const ro = new ResizeObserver(atualizar)
    if (outerRef.current) ro.observe(outerRef.current)
    window.addEventListener('resize', atualizar)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', atualizar)
    }
  }, [])

  // Parallax sutil do medalhão — mouse no desktop, giroscópio (best-effort,
  // sem prompt de permissão) no mobile. Sem gesto disponível, fica parado.
  useEffect(() => {
    let raf: number | null = null
    const onMouseMove = (e: MouseEvent) => {
      if (raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        setParallax({ x: (e.clientX / window.innerWidth - 0.5) * 2, y: (e.clientY / window.innerHeight - 0.5) * 2 })
      })
    }
    const onOrientation = (e: DeviceOrientationEvent) => {
      if (e.gamma == null || e.beta == null || raf) return
      raf = requestAnimationFrame(() => {
        raf = null
        setParallax({ x: Math.max(-1, Math.min(1, e.gamma! / 30)), y: Math.max(-1, Math.min(1, (e.beta! - 45) / 30)) })
      })
    }
    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('deviceorientation', onOrientation)
    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('deviceorientation', onOrientation)
      if (raf) cancelAnimationFrame(raf)
    }
  }, [])

  const handleAbrir = useCallback(() => {
    if (iniciado.current) return
    iniciado.current = true
    somKit.playTheme()
    setAberto(true)
    // troca de face no ponto médio do flip (edge-on = invisível, sem flash)
    timers.current.push(setTimeout(() => setMostrarVerso(true), DUR_FLIP / 2))

    // Quatro fases sequenciais, cada uma só começa quando a anterior termina:
    // 1) flip  2) poeira assenta e paira  3) poeira sopra embora  4) cascata
    // de luzes + elenco (Fase 6 já existente).
    timers.current.push(
      setTimeout(() => {
        setCapaVisivel(false)
        setFasePoeira('assentada')
        timers.current.push(
          setTimeout(() => {
            setFasePoeira('soprando')
            timers.current.push(
              setTimeout(() => {
                setRevelado(true)
                setFasePoeira('oculta')
                somKit.startCrowd(2.4, 0.22)
                // um "clac" por zona de refletor (goleiro→defesa→meio→ataque→banco)
                for (let tier = 0; tier < CONTAGEM_TIERS.length; tier++) {
                  timers.current.push(setTimeout(() => somKit.playSpotlightClack(0), tier * 180))
                }
              }, DUST_BLOW_DUR),
            )
          }, DUST_SETTLE_HOLD),
        )
      }, DUR_FLIP - 150),
    )
  }, [])

  const handleFechar = useCallback(() => {
    limparTimers()
    setAberto(false)
    setRevelado(false)
    setFasePoeira('oculta')
    setCapaVisivel(true)
    timers.current.push(setTimeout(() => setMostrarVerso(false), DUR_FLIP / 2))
    iniciado.current = false
  }, [limparTimers])

  useEffect(() => () => limparTimers(), [limparTimers])

  // Fila única: cada tier só libera seu primeiro membro depois que a própria
  // zona de luz termina de acender E a fila do tier anterior já saiu.
  const inicioTiers = useMemo(() => calcularInicioTiers(CONTAGEM_TIERS), [])

  const titularesComEntrada = useMemo(() => {
    const porTier: Record<number, number> = {}
    return TITULARES.map((j) => {
      const idx = porTier[j.tier] ?? 0
      porTier[j.tier] = idx + 1
      const atrasoFila = inicioTiers[j.tier] + idx * INTERVALO_FILA
      return { ...j, entrada: estiloEntrada(j.xpx, j.ypx, true, 1, atrasoFila, revelado) }
    })
  }, [inicioTiers, revelado])

  const TIER_BANCO = 4
  const reservasComEntrada = useMemo(
    () =>
      BANCO.map((r, i) => ({
        ...r,
        entrada: estiloEntrada(r.xpx, r.ypx, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO] + i * INTERVALO_FILA, revelado),
      })),
    [inicioTiers, revelado],
  )
  const adminComEntrada = useMemo(
    () => ({ entrada: estiloEntrada(322, 734, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO] + BANCO.length * INTERVALO_FILA, revelado) }),
    [inicioTiers, revelado],
  )

  return (
    <div ref={outerRef} className="relative flex h-full w-full items-center justify-center overflow-hidden bg-campo-noturno" style={{ width: '100dvw', height: '100dvh' }}>
      <div
        style={{
          width: LARGURA_CENA,
          height: ALTURA_CENA,
          flex: 'none',
          position: 'relative',
          overflow: 'hidden',
          perspective: 1700,
          perspectiveOrigin: '52% 45%',
          transform: `scale(${escala})`,
          transformOrigin: 'center center',
        }}
      >
        {/* Interior — campo, banco e poeira, revelados por trás da capa */}
        <div onClick={handleFechar} className="absolute inset-0 cursor-pointer overflow-hidden" style={{ isolation: 'isolate' }}>
          <CenaEstadio revelado={revelado} titulares={titularesComEntrada} />
          <BancoReservas revelado={revelado} reservas={reservasComEntrada} admin={adminComEntrada} />

          {/* sombra que a capa aberta projeta perto da lombada */}
          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0"
            style={{ width: 60, zIndex: 4, background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 100%)' }}
          />

          <PoeiraTransicao fase={fasePoeira} />
        </div>

        {/* Capa — dobradiça na lombada (borda esquerda). Depois que o flip
            assenta, o verso (miolo) cobre a tela por inteiro — correto
            geometricamente, mas precisa dissolver pra revelar a poeira/
            CenaEstadio por trás (ver capaVisivel/handleAbrir). */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transition: `transform ${DUR_FLIP}ms cubic-bezier(0.62,0,0.38,1), opacity 550ms ease-out`,
            transform: aberto ? 'rotateY(-180deg)' : 'rotateY(0deg)',
            opacity: capaVisivel ? 1 : 0,
            pointerEvents: capaVisivel ? 'auto' : 'none',
          }}
        >
          <div style={{ position: 'absolute', inset: 0, visibility: mostrarVerso ? 'hidden' : 'visible' }}>
            <CapaAlbum onAbrir={handleAbrir} parallax={parallax} sombraAbertura={aberto ? 0.55 : 0} />
          </div>
          {/* transformOrigin igual ao pai (lombada/borda esquerda) — sem isso
              duas rotações de 180° em pivôs diferentes compõem uma TRANSLAÇÃO,
              não uma rotação pura, e o verso acaba deslocado quase todo pra
              fora da tela (bug real encontrado e corrigido na fase anterior). */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              visibility: mostrarVerso ? 'visible' : 'hidden',
              transformOrigin: 'left center',
              transform: 'rotateY(180deg) translateZ(14px)',
            }}
          >
            <CapaVerso />
          </div>
          <CapaEspessura />
        </div>

        {/* grão de filme sobre toda a cena — sutilíssimo, nunca compromete legibilidade */}
        <div
          className={`pointer-events-none absolute ${styles.grainJitter}`}
          style={{
            inset: '-10%',
            zIndex: 50,
            opacity: 0.05,
            mixBlendMode: 'overlay',
            backgroundImage:
              "url('data:image/svg+xml,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%22120%22%20height%3D%22120%22%3E%3Cfilter%20id%3D%22n%22%3E%3CfeTurbulence%20type%3D%22fractalNoise%22%20baseFrequency%3D%220.9%22%20numOctaves%3D%222%22%20stitchTiles%3D%22stitch%22%2F%3E%3C%2Ffilter%3E%3Crect%20width%3D%22100%25%22%20height%3D%22100%25%22%20filter%3D%22url(%23n)%22%2F%3E%3C%2Fsvg%3E')",
            backgroundSize: '130px 130px',
          }}
        />
      </div>
    </div>
  )
}
