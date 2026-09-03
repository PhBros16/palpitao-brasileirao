'use client'

// AberturaScreen — sequência cinematográfica: capa de couro → flip →
// campinho revelado. PIN correto → fade escuro → navega pra Home.

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
import { buscarAvatares, buscarParticipantePorNome, gerarElenco, type JogadorComPin } from './elencoMock'
import { PinModal } from './PinModal'
import { FundoMesa } from './FundoMesa'
import { CortinaDescendo } from '@/components/home/CortinaTransicao'
import { showToast } from '@/components/home/Toast'
import { vibrar } from '@/lib/haptic'
import { lerFormacaoId } from '@/lib/appSettings'
import type { FasePoeira } from './tipos'

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

  const [formacaoId, setFormacaoId] = useState<string>('4-3-3')
  const [avatares, setAvatares] = useState<Map<string, string | null>>(new Map())

  useEffect(() => {
    lerFormacaoId()
      .then((id) => setFormacaoId(id))
      .catch(() => { /* silencioso */ })
    buscarAvatares()
      .then((m) => setAvatares(m))
      .catch(() => { /* silencioso — fica sem foto */ })
  }, [])

  const { TITULARES, BANCO, TECNICO } = useMemo(
    () => gerarElenco(formacaoId, avatares),
    [formacaoId, avatares],
  )

  const [dimensoes, setDimensoes] = useState<{
    safeTopPx: number
    alturaViewport: number
    escala: number
  } | null>(null)

  const [pinPlayer, setPinPlayer] = useState<JogadorComPin | null>(null)
  const [buscandoPin, setBuscandoPin] = useState(false)

  const [cortinaAtiva, setCortinaAtiva] = useState(false)
  const rotaDestinoRef = useRef<string | null>(null)

  const outerRef = useRef<HTMLDivElement>(null)
  const podeClicarCapa = useRef(false)

  const [botaoAparente, setBotaoAparente] = useState(false)

  useEffect(() => {
    const prevBodyOverflow = document.body.style.overflow
    const prevHtmlOverflow = document.documentElement.style.overflow
    document.body.style.overflow = 'hidden'
    document.documentElement.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prevBodyOverflow
      document.documentElement.style.overflow = prevHtmlOverflow
    }
  }, [])

  const iniciado = useRef(false)
  useEffect(() => {
    const t = setTimeout(() => {
      podeClicarCapa.current = true
      setBotaoAparente(true)
    }, 3200)
    return () => clearTimeout(t)
  }, [])

  const timers = useRef<Array<ReturnType<typeof setTimeout>>>([])

  const limparTimers = useCallback(() => {
    timers.current.forEach(clearTimeout)
    timers.current = []
  }, [])

  const [zoomPronto, setZoomPronto] = useState(false)

  useEffect(() => {
    function medirSafeTop(): number {
      try {
        const probe = document.createElement('div')
        probe.style.cssText = 'position:fixed;top:0;left:0;padding-top:env(safe-area-inset-top);visibility:hidden;pointer-events:none;'
        document.body.appendChild(probe)
        const st = parseFloat(getComputedStyle(probe).paddingTop) || 0
        document.body.removeChild(probe)
        return st
      } catch {
        return 0
      }
    }

    function calcular() {
      const safeTopPx = medirSafeTop()
      const w = window.visualViewport?.width || window.innerWidth || LARGURA_CENA
      const h = window.visualViewport?.height || window.innerHeight || ALTURA_CENA
      const hUtil = Math.max(h - safeTopPx, ALTURA_CENA * 0.5)
      const escala = Math.min(1, w / LARGURA_CENA, hUtil / ALTURA_CENA)
      setDimensoes({ safeTopPx, alturaViewport: h, escala })
    }

    calcular()
    window.addEventListener('resize', calcular)
    window.addEventListener('orientationchange', calcular)
    window.visualViewport?.addEventListener('resize', calcular)
    return () => {
      window.removeEventListener('resize', calcular)
      window.removeEventListener('orientationchange', calcular)
      window.visualViewport?.removeEventListener('resize', calcular)
    }
  }, [])

  // Zoom de entrada — a capa nasce pequena (como um objeto exposto, visto
  // de longe, dentro do cone de luz de FundoMesa) e só depois de um respiro
  // anima até o tamanho real calculado. Esse atraso é o que resolve o
  // "pisca de ajuste": o recálculo tardio de viewport do Safari mobile
  // (que já existia e só era suavizado por uma transição) acontece agora
  // ENQUANTO a capa ainda está pequena e longe — inaudível visualmente —
  // em vez de acontecer com ela já grande na tela.
  useEffect(() => {
    if (!dimensoes) return
    const t = setTimeout(() => setZoomPronto(true), 550)
    return () => clearTimeout(t)
  }, [dimensoes])

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
    if (pinPlayer || cortinaAtiva) return
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
  }, [limparTimers, pinPlayer, cortinaAtiva])

  useEffect(() => () => limparTimers(), [limparTimers])

  const [carregandoId, setCarregandoId] = useState<string | null>(null)

  const handleClickJogador = useCallback(async (j: { id: string; nome: string }) => {
    if (buscandoPin || pinPlayer || cortinaAtiva) return
    setBuscandoPin(true)
    setCarregandoId(j.id)
    try {
      const player = await buscarParticipantePorNome(j.nome)
      if (player) setPinPlayer(player)
    } finally {
      setBuscandoPin(false)
      setCarregandoId(null)
    }
  }, [buscandoPin, pinPlayer, cortinaAtiva])

  const handleClickAdmin = useCallback(async () => {
    if (buscandoPin || pinPlayer || cortinaAtiva) return
    setBuscandoPin(true)
    try {
      const admin = await buscarParticipantePorNome('Administração')
      if (admin) setPinPlayer(admin)
    } finally {
      setBuscandoPin(false)
    }
  }, [buscandoPin, pinPlayer, cortinaAtiva])

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

    const rotaDestino = player.isAdmin ? '/admin' : '/inicio'
    rotaDestinoRef.current = rotaDestino

    try { router.prefetch(rotaDestino) } catch { /* silencioso */ }

    setCortinaAtiva(true)
  }, [router])

  const handleCortinaCobriuTela = useCallback(() => {
    const rota = rotaDestinoRef.current
    if (rota) router.push(rota)
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
  }, [inicioTiers, revelado, TITULARES])

  const TIER_BANCO = 4
  const reservasComEntrada = useMemo(
    () =>
      BANCO.map((r, i) => ({
        ...r,
        entrada: estiloEntrada(r.xpx, r.ypx, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO] + i * INTERVALO_FILA, revelado),
      })),
    [inicioTiers, revelado, BANCO],
  )
    const adminComEntrada = useMemo(
    () => ({
      entrada: estiloEntrada(322, 734, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO] + (BANCO.length + 1) * INTERVALO_FILA, revelado),
      avatar: avatares.get('Administração') ?? null,
    }),
    [inicioTiers, revelado, BANCO, avatares],
  )
  const tecnicoComEntrada = useMemo(
    () => ({ ...TECNICO, entrada: estiloEntrada(TECNICO.xpx, TECNICO.ypx, false, ENCOLHER_BANCO, inicioTiers[TIER_BANCO], revelado) }),
    [inicioTiers, revelado, TECNICO],
  )

  if (!dimensoes) {
    return (
      <div
        style={{
          position: 'fixed',
          inset: 0,
          background: 'linear-gradient(180deg, #1a0f08 0%, #0a0503 100%)',
        }}
        aria-hidden="true"
      />
    )
  }

  const { safeTopPx, alturaViewport, escala } = dimensoes

  return (
    <div
      ref={outerRef}
      className="relative flex items-start justify-center overflow-hidden"
      style={{
        width: '100vw',
        height: `${alturaViewport}px`,
        paddingTop: `${safeTopPx}px`,
        boxSizing: 'border-box',
      }}
    >
      <FundoMesa />

      {capaVisivel && (
        <div
          role="button"
          tabIndex={0}
          onClick={(e) => { if (!podeClicarCapa.current) return; e.stopPropagation(); handleAbrir() }}
          onKeyDown={(e) => { if ((e.key === 'Enter' || e.key === ' ') && podeClicarCapa.current) { e.stopPropagation(); handleAbrir() } }}
          className={`cursor-pointer select-none rounded-lg border font-mono text-sm font-bold tracking-[3px] text-couro-600 text-center transition-transform duration-150 ease-out active:scale-95 ${styles.buttonPulse}`}
          style={{
            position: 'fixed',
            left: 0,
            right: 0,
            top: `calc(${safeTopPx}px + 422px * ${escala} + 138px * ${escala})`,
            margin: '0 auto',
            width: `calc(240px * ${escala})`,
            zIndex: 100,
            borderColor: 'var(--dourado-700)',
            padding: 13,
            background:
              'repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 2px), linear-gradient(180deg, var(--dourado-200) 0%, var(--dourado-500) 50%, var(--dourado-600) 100%)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(90,60,10,0.45)',
            pointerEvents: (aberto || !botaoAparente) ? 'none' : 'auto',
            opacity: aberto ? 0 : (botaoAparente ? 1 : 0),
            transform: botaoAparente ? 'translateY(0) scale(1)' : 'translateY(22px) scale(0.94)',
            transition: aberto ? 'opacity 250ms ease-in, transform 250ms ease-in' : 'opacity 1600ms ease-out, transform 1600ms ease-out',
          }}
        >
          ABRIR O ÁLBUM
        </div>
      )}

      <div
        data-cena-raiz
        style={{
          width: LARGURA_CENA,
          height: ALTURA_CENA,
          flex: 'none',
          position: 'relative',
          overflow: 'visible',
          perspective: 1700,
          perspectiveOrigin: '52% 45%',
          transform: `scale(${zoomPronto ? escala : escala * 0.32})`,
          transformOrigin: 'top center',
          transition: zoomPronto
            ? 'transform 1.1s cubic-bezier(0.22, 0.61, 0.36, 1)'
            : 'none',
          zIndex: 2,
          boxShadow: '0 40px 80px rgba(0, 0, 0, 0.6), 0 20px 40px rgba(0, 0, 0, 0.4)',
        }}
      >
        {/* Bancada de exposição — só faz sentido visualmente enquanto a
            capa está pequena (fase do zoom de entrada). Fica posicionada
            logo abaixo do limite da cena (844px) — como tudo aqui dentro
            escala junto via o transform do data-cena-raiz, ela nasce do
            tamanho certo durante o zoom, e no tamanho final (escala ~1,
            cena preenchendo a tela) ela naturalmente cai fora do quadro,
            exatamente como uma câmera se aproximando deixaria o pedestal
            pra trás. Sem lógica extra de opacidade — o próprio zoom resolve. */}
        <div
          aria-hidden="true"
          style={{
            position: 'absolute',
            top: ALTURA_CENA,
            left: '50%',
            transform: 'translateX(-50%)',
            width: 260,
            opacity: capaVisivel ? 1 : 0,
            transition: 'opacity 400ms ease-out',
          }}
        >
          {/* Topo da bancada — tábua de madeira vista de leve ângulo, onde
              a capa "repousa" */}
          <div
            style={{
              height: 22,
              borderRadius: '50% 50% 0 0 / 100% 100% 0 0',
              background: 'linear-gradient(180deg, var(--madeira-100) 0%, var(--madeira-200) 60%, var(--madeira-300) 100%)',
              boxShadow: 'inset 0 -3px 6px rgba(0,0,0,0.35), inset 0 2px 3px rgba(255,235,180,0.25)',
            }}
          />
          {/* Corpo da bancada — trapézio (mais estreito embaixo), tom mais
              escuro de madeira, com friso dourado sutil perto do topo */}
          <div
            style={{
              height: 130,
              margin: '0 auto',
              width: '86%',
              clipPath: 'polygon(4% 0%, 96% 0%, 88% 100%, 12% 100%)',
              background: 'linear-gradient(180deg, var(--madeira-200) 0%, var(--madeira-300) 45%, var(--madeira-400) 100%)',
              borderTop: '3px solid var(--dourado-500)',
              boxShadow: 'inset 8px 0 16px rgba(0,0,0,0.3), inset -8px 0 16px rgba(0,0,0,0.3)',
            }}
          />
          {/* Sombra de contato no chão, sob a bancada */}
          <div
            style={{
              height: 14,
              width: '70%',
              margin: '4px auto 0',
              borderRadius: '50%',
              background: 'radial-gradient(closest-side, rgba(0,0,0,0.5), transparent 75%)',
            }}
          />
        </div>

        <div
          style={{
            position: 'absolute',
            inset: 0,
            transformStyle: 'flat',
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
              <CenaEstadio revelado={revelado} titulares={titularesComEntrada} onEntrar={handleClickJogador} carregandoId={carregandoId} />
              <BancoReservas
                revelado={revelado}
                reservas={reservasComEntrada}
                admin={adminComEntrada}
                tecnico={tecnicoComEntrada}
                onEntrarAdmin={handleClickAdmin}
                onEntrarJogador={handleClickJogador}
                carregandoId={carregandoId}
              />

              <div
                className="pointer-events-none absolute bottom-0 left-0 top-0"
                style={{ width: 60, zIndex: 4, background: 'linear-gradient(90deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0.18) 45%, rgba(0,0,0,0) 100%)' }}
              />

              <PoeiraTransicao fase={fasePoeira} />

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
                    transform: 'rotateY(180deg) translateZ(24px)',
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

      <CortinaDescendo ativa={cortinaAtiva} onProntoParaNavegar={handleCortinaCobriuTela} />

      {pinPlayer && (
        <PinModal
          player={pinPlayer}
          onFechar={() => setPinPlayer(null)}
          onSucesso={handlePinSucesso as (player: any) => void}
        />
      )}
    </div>
  )
}
