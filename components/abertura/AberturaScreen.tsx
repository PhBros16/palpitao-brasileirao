'use client'

// AberturaScreen — sequência cinematográfica completa: capa de couro → flip →
// campinho revelado. PIN correto → efeito de RASGO DE PÁGINA → navega pra Home.
//
// Estrutura da hierarquia 3D (crítico — não mexer sem testar em mobile):
//   root outerRef (fixed, contém FundoMesa e a cena escalada)
//     └─ .cena (390x844, scaled, perspective, contém tudo o resto)
//        └─ wrapper 3D (preserve-3d)
//           └─ div (backfaceVisibility hidden)
//              └─ onClick=handleFechar (cursor-pointer, overflow-hidden)
//                 ├─ CenaEstadio (revelado)
//                 ├─ BancoReservas
//                 ├─ gradiente sombra esquerda
//                 ├─ PoeiraTransicao
//                 └─ wrapper flip da CAPA (rotateY 0 → -180)
//                    ├─ CapaAlbum (frente)
//                    ├─ CapaVerso (verso)
//                    └─ CapaEspessura

import { useRouter } from 'next/navigation'
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
import { BANCO, TECNICO, TITULARES, buscarPinPorNome, type JogadorComPin } from './elencoMock'
import { PinModal } from './PinModal'
import { FundoMesa } from './FundoMesa'
import { RasgoParaHome } from './RasgoParaHome'
import { showToast } from '@/components/home/Toast'
import { vibrar } from '@/lib/haptic'
import type { FasePoeira, JogadorCampo } from './tipos'

const LARGURA_CENA = 390
const ALTURA_CENA = 844

export function AberturaScreen() {
  const router = useRouter()
  const [aberto, setAberto] = useState(false)
  const [mostrarVerso, setMostrarVerso] = useState(false)
  const [capaVisivel, setCapaVisivel] = useState(true)
  const [revelado, setRevelado] = useState(false)
  const [fasePoeira, setFasePoeira] = useState<FasePoeira>('oculta')
  const [parallax, setParallax] = useState({ x: 0, y: 0 })
  const [escala, setEscala] = useState(1)

  const [pinPlayer, setPinPlayer] = useState<JogadorComPin | null>(null)
  const [buscandoPin, setBuscandoPin] = useState(false)

  const [rasgando, setRasgando] = useState(false)
  const destinoNav = useRef<string>('/inicio')

  const outerRef = useRef<HTMLDivElement>(null)
  const iniciado = useRef(false)
  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const limparTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  useEffect(() => {
    const atualizar = () => {
      const el = outerRef.current
      const w = window.innerWidth || el?.clientWidth || LARGURA_CENA
      const h = window.innerHeight || el?.clientHeight || ALTURA_CENA
      const novoScale = Math.min(1, w / LARGURA_CENA, h / ALTURA_CENA)
      if (novoScale > 0) setEscala(novoScale)
    }
    atualizar()
    const ro = new ResizeObserver(atualizar)
    if (outerRef.current) ro.observe(outerRef.current)
    window.addEventListener('resize', atualizar)
    window.addEventListener('orientationchange', atualizar)
    return () => {
      ro.disconnect()
      window.removeEventListener('resize', atualizar)
      window.removeEventListener('orientationchange', atualizar)
    }
  }, [])

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
    import('@/components/home/PlayerMusica').then((m) => m.iniciarMusicaTema())
    setAberto(true)
    timers.current.push(setTimeout(() => setMostrarVerso(true), DUR_FLIP / 2))

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
                for (let tier = 0; tier < CONTAGEM_TIERS.length; tier++) {
                  timers.current.push(setTimeout(() => somKit.playSpotlightClack(0), tier * 180))
                }
              }, DUST_BLOW_DUR),
            )
          }, DUST_SETTLE_HOLD),
        )
      }, DUR_FLIP / 2),
    )
  }, [])

  const handleFechar = useCallback(() => {
    if (pinPlayer || rasgando) return
    limparTimers()
    setAberto(false)
    setRevelado(false)
    setFasePoeira('oculta')
    timers.current.push(
      setTimeout(() => {
        setMostrarVerso(false)
        setCapaVisivel(true)
      }, DUR_FLIP / 2),
    )
    iniciado.current = false
  }, [limparTimers, pinPlayer, rasgando])

  useEffect(() => () => limparTimers(), [limparTimers])

  const handleClickJogador = useCallback(async (j: JogadorCampo) => {
    if (buscandoPin || pinPlayer || rasgando) return
    setBuscandoPin(true)
    try {
      const player = await buscarPinPorNome(j.nome)
      if (player) setPinPlayer(player)
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer, rasgando])

  const handleClickAdmin = useCallback(async () => {
    if (buscandoPin || pinPlayer || rasgando) return
    setBuscandoPin(true)
    try {
      const admin = await buscarPinPorNome('Administração')
      if (admin) setPinPlayer(admin)
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer, rasgando])

  const handlePinSucesso = useCallback((player: JogadorComPin) => {
    localStorage.setItem(
      'palpitao_sessao',
      JSON.stringify({
        id: player.id,
        nome: player.nome,
      }),
    )

    setPinPlayer(null)
    vibrar('sucesso')
    showToast(`Bem-vindo, ${player.nome}! ⚽`, 'sucesso', 2500)

    destinoNav.current = player.isAdmin ? '/admin' : '/inicio'
    setRasgando(true)
  }, [])

  const handleRasgoCompleto = useCallback(() => {
    router.push(destinoNav.current)
  }, [router])

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
    () => ({ entrada: estiloEntrada(322, 734, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO] + (BANCO.length + 1) * INTERVALO_FILA, revelado) }),
    [inicioTiers, revelado],
  )
  const tecnicoComEntrada = useMemo(
    () => ({ entrada: estiloEntrada(TECNICO.xpx, TECNICO.ypx, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO], revelado) }),
    [inicioTiers, revelado],
  )

  return (
    <div
      ref={outerRef}
      className="relative flex items-center justify-center overflow-hidden"
      style={{
        width: '100vw',
        height: '100vh',
        minHeight: '-webkit-fill-available',
      }}
    >
      {/* Cenário externo: mesa de madeira envelhecida + cone de luz + poeira */}
      <FundoMesa />

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
          zIndex: 2,
          // Sombra projetada do álbum sobre a mesa (efeito profundidade)
          boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6), 0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Wrapper 3D — mantido igual ao original que funcionava */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'preserve-3d',
            willChange: 'transform',
          }}
        >
          <div
            style={{
              position: 'absolute',
              inset: 0,
              backfaceVisibility: 'hidden',
            }}
          >
            <div
              onClick={handleFechar}
              className="absolute inset-0 cursor-pointer overflow-hidden"
              style={{ isolation: 'isolate' }}
            >
              <CenaEstadio revelado={revelado} titulares={titularesComEntrada} onEntrar={handleClickJogador} />
              <BancoReservas
                revelado={revelado}
                reservas={reservasComEntrada}
                admin={adminComEntrada}
                tecnico={tecnicoComEntrada}
                onEntrarAdmin={handleClickAdmin}
              />

              <div
                className="pointer-events-none absolute bottom-0 left-0 top-0"
                style={{ width: 60, zIndex: 4, background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 100%)' }}
              />

              <PoeiraTransicao fase={fasePoeira} />

              {/* CAPA (frente + verso + espessura) — precisa ficar DENTRO do onClick handler */}
              <div
                style={{
                  position: 'absolute',
                  inset: 0,
                  transformOrigin: 'left center',
                  transformStyle: 'preserve-3d',
                  willChange: 'transform',
                  transition: `transform ${DUR_FLIP}ms cubic-bezier(0.62,0,0.38,1)`,
                  transform: aberto ? 'rotateY(-180deg)' : 'rotateY(0deg)',
                  opacity: capaVisivel ? 1 : 0,
                  pointerEvents: capaVisivel ? 'auto' : 'none',
                }}
              >
                <div style={{ position: 'absolute', inset: 0, visibility: mostrarVerso ? 'hidden' : 'visible', backfaceVisibility: 'hidden' }}>
                  <CapaAlbum onAbrir={handleAbrir} parallax={parallax} sombraAbertura={aberto ? 0.55 : 0} />
                </div>
                <div
                  style={{
                    position: 'absolute',
                    inset: 0,
                    visibility: mostrarVerso ? 'visible' : 'hidden',
                    transformOrigin: 'left center',
                    transform: 'rotateY(180deg) translateZ(14px)',
                    backfaceVisibility: 'hidden',
                  }}
                >
                  <CapaVerso />
                </div>
                <CapaEspessura />
              </div>
            </div>
          </div>
        </div>

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

      {pinPlayer && (
        <PinModal
          player={pinPlayer}
          onFechar={() => setPinPlayer(null)}
          onSucesso={handlePinSucesso as (player: any) => void}
        />
      )}

      {rasgando && <RasgoParaHome onCompleto={handleRasgoCompleto} />}
    </div>
  )
}
