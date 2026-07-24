'use client'

// AberturaScreen — sequência cinematográfica completa: capa de couro → flip →
// campinho revelado. PIN correto vira mais uma "página" do álbum (mesma
// estética do flip da capa) antes de navegar pra /inicio ou /admin.

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

  // Login integrado: jogador selecionado pra abrir o PinModal
  const [pinPlayer, setPinPlayer] = useState<JogadorComPin | null>(null)
  const [buscandoPin, setBuscandoPin] = useState(false)

  // Virada de página após PIN correto (mesma estética do flip da capa)
  const [virandoParaHome, setVirandoParaHome] = useState(false)
  const [mostrarVersoHome, setMostrarVersoHome] = useState(false)

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
    if (pinPlayer || virandoParaHome) return
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
  }, [limparTimers, pinPlayer, virandoParaHome])

  useEffect(() => () => limparTimers(), [limparTimers])

  const handleClickJogador = useCallback(async (j: JogadorCampo) => {
    if (buscandoPin || pinPlayer || virandoParaHome) return
    setBuscandoPin(true)
    try {
      const player = await buscarPinPorNome(j.nome)
      if (player) setPinPlayer(player)
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer, virandoParaHome])

  const handleClickAdmin = useCallback(async () => {
    if (buscandoPin || pinPlayer || virandoParaHome) return
    setBuscandoPin(true)
    try {
      const admin = await buscarPinPorNome('Administração')
      if (admin) setPinPlayer(admin)
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer, virandoParaHome])

  // PIN validado → salva sessão, dispara virada de página, navega no meio do flip.
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

    // Toca clack de refletor (som de página virando "clacado")
    try {
      somKit.playSpotlightClack(0)
    } catch { /* silencioso */ }

    // Inicia flip: a cena atual gira, o verso (papel envelhecido) aparece
    setVirandoParaHome(true)
    timers.current.push(setTimeout(() => setMostrarVersoHome(true), DUR_FLIP / 2))

    // No meio do flip, dispara navegação (assim quando o flip termina,
    // a página nova já está pronta)
    timers.current.push(
      setTimeout(() => {
        router.push(player.isAdmin ? '/admin' : '/inicio')
      }, DUR_FLIP / 2 + 100),
    )
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
        {/* Contêiner de flip — quando vira pra Home, a cena inteira gira */}
        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformOrigin: 'left center',
            transformStyle: 'preserve-3d',
            willChange: 'transform',
            transition: `transform ${DUR_FLIP}ms cubic-bezier(0.62,0,0.38,1)`,
            transform: virandoParaHome ? 'rotateY(-180deg)' : 'rotateY(0deg)',
          }}
        >
          {/* Frente: cena do campinho */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              visibility: mostrarVersoHome ? 'hidden' : 'visible',
              backfaceVisibility: 'hidden',
            }}
          >
            {/* Interior — campo, banco e poeira, revelados por trás da capa */}
            <div onClick={handleFechar} className="absolute inset-0 cursor-pointer overflow-hidden" style={{ isolation: 'isolate' }}>
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
            </div>

            {/* Capa (frente) */}
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

          {/* Verso: página envelhecida indo pra Home */}
          <div
            style={{
              position: 'absolute',
              inset: 0,
              visibility: mostrarVersoHome ? 'visible' : 'hidden',
              transformOrigin: 'left center',
              transform: 'rotateY(180deg) translateZ(14px)',
              backfaceVisibility: 'hidden',
              background: `
                radial-gradient(ellipse at 30% 25%, #F7E6BA 0%, #EBD9A4 45%, #D4C088 100%),
                #E8D4A0
              `,
            }}
          >
            {/* Textura de papel no verso */}
            <div
              className="absolute inset-0 opacity-60 mix-blend-multiply"
              style={{
                backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='400' height='400'%3E%3Cfilter id='p'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' seed='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0.42 0 0 0 0 0.28 0 0 0 0 0.13 0 0 0 0.4 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23p)'/%3E%3C/svg%3E")`,
                backgroundSize: '400px 400px',
              }}
            />

            {/* Sombra no vinco (canto esquerdo) */}
            <div
              className="absolute inset-y-0 left-0 w-8"
              style={{
                background: 'linear-gradient(90deg, rgba(60,40,20,0.4) 0%, rgba(60,40,20,0.1) 60%, transparent 100%)',
              }}
            />

            {/* Vinheta */}
            <div
              className="absolute inset-0"
              style={{
                background: 'radial-gradient(ellipse at center, transparent 40%, rgba(92,56,24,0.2) 90%, rgba(62,38,15,0.4) 100%)',
              }}
            />
          </div>
        </div>

        {/* Grão de filme (fica acima do flip, cobre tudo) */}
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

      {/* PIN modal — fica FORA da cena escalada, cobre a viewport inteira */}
      {pinPlayer && (
        <PinModal
          player={pinPlayer}
          onFechar={() => setPinPlayer(null)}
          onSucesso={handlePinSucesso}
        />
      )}
    </div>
  )
}
