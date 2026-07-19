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
//
// Login integrado: ao clicar num titular no campo revelado, abre o PinModal
// aqui mesmo (não navega mais pra /login — que agora só redireciona pra /).
// PIN validado contra Supabase (participants.name → participants.pin) via
// buscarPinPorNome() do elencoMock.ts. Sessão gravada em localStorage
// (chave 'palpitao_sessao') igual ao fluxo já usado por /palpites.

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
    // Inicia música tema real (gesto do usuário libera autoplay do navegador).
    // Silencioso se o mp3 ainda não existir.
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
    // Se o modal de PIN está aberto, prioriza fechar ele — não recolhe a capa.
    if (pinPlayer) return
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
  }, [limparTimers, pinPlayer])

  useEffect(() => () => limparTimers(), [limparTimers])

  // Click num titular no campo revelado → busca PIN real do Supabase → abre modal.
  const handleClickJogador = useCallback(async (j: JogadorCampo) => {
    if (buscandoPin || pinPlayer) return
    setBuscandoPin(true)
    try {
      const player = await buscarPinPorNome(j.nome)
      if (player) setPinPlayer(player)
      // Se não achou (nome não bate com nenhum participant), não faz nada silenciosamente.
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer])

  // PIN validado → grava sessão → navega pra Home (/inicio).
  const handlePinSucesso = useCallback((player: JogadorComPin) => {
    localStorage.setItem('palpitao_sessao', JSON.stringify({ id: player.id, nome: player.nome }))
    setPinPlayer(null)
    router.push('/inicio')
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
        {/* Interior — campo, banco e poeira, revelados por trás da capa */}
        <div onClick={handleFechar} className="absolute inset-0 cursor-pointer overflow-hidden" style={{ isolation: 'isolate' }}>
          <CenaEstadio revelado={revelado} titulares={titularesComEntrada} onEntrar={handleClickJogador} />
          <BancoReservas revelado={revelado} reservas={reservasComEntrada} admin={adminComEntrada} tecnico={tecnicoComEntrada} />

          <div
            className="pointer-events-none absolute bottom-0 left-0 top-0"
            style={{ width: 60, zIndex: 4, background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 100%)' }}
          />

          <PoeiraTransicao fase={fasePoeira} />
        </div>

        {/* Capa */}
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

        {/* Grão de filme */}
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
