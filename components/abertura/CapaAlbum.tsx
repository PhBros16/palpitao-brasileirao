'use client'

import { useEffect, useRef, useState } from 'react'
import styles from './abertura.module.css'

// CapaAlbum — face frontal da capa de couro: rótulo "ÁLBUM OFICIAL", medalhão
// do troféu (silhueta ampulheta/diamante flat, com leve parallax de
// mouse/giroscópio + shimmer periódico), título com pulso de brilho sutil,
// botão de acabamento fosco com pulso, selo de temporada. Couro com grão +
// marcas de uso + luz ambiente quente + poeira dourada caindo + reflexo de
// verniz ocasional + vinheta respirando — tudo em loop contínuo, sutil, sem
// competir com a cascata de entrada validada.
export function CapaAlbum({
  onAbrir,
  parallax,
  sombraAbertura,
}: {
  onAbrir: () => void
  parallax: { x: number; y: number }
  /** 0..1 — escurece a capa conforme ela gira ao abrir (controlado pelo AberturaScreen). */
  sombraAbertura: number
}) {
  const [botaoVisivel, setBotaoVisivel] = useState(false)
  const [debug, setDebug] = useState('')
  const botaoRef = useRef<HTMLButtonElement>(null)
  useEffect(() => {
    const t = setTimeout(() => {
      setBotaoVisivel(true)
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          const cena = document.querySelector('[data-cena-raiz]') as HTMLElement | null
          if (cena) {
            const prev = cena.style.display
            cena.style.display = 'none'
            void cena.offsetHeight
            cena.style.display = prev
          }
        })
      })
    }, 1800)
    return () => clearTimeout(t)
  }, [])
  useEffect(() => {
    const t = setTimeout(() => {
      const el = botaoRef.current
      if (!el) { setDebug('botaoRef NULO'); return }
      const cs = getComputedStyle(el)
      const rect = el.getBoundingClientRect()
      const capaRoot = el.closest('.absolute.overflow-hidden') as HTMLElement | null
      const capaRect = capaRoot?.getBoundingClientRect()
      setDebug(JSON.stringify({
        botaoVisivel, opacity: cs.opacity,
        btnLeft: Math.round(rect.left), btnTop: Math.round(rect.top), btnW: Math.round(rect.width), btnH: Math.round(rect.height),
        capaLeft: capaRect ? Math.round(capaRect.left) : null,
        capaTop: capaRect ? Math.round(capaRect.top) : null,
        capaW: capaRect ? Math.round(capaRect.width) : null,
        capaH: capaRect ? Math.round(capaRect.height) : null,
        winW: window.innerWidth, winH: window.innerHeight,
        vvW: window.visualViewport?.width, vvH: window.visualViewport?.height,
      }, null, 1))
    }, 2500)
    return () => clearTimeout(t)
  }, [botaoVisivel])

  return (
    <div
      className="absolute overflow-hidden"
      style={{
        top: 0,
        left: 0,
        right: -2,
        bottom: -2,
        background: 'radial-gradient(120% 90% at 50% 25%, var(--couro-300) 0%, var(--couro-400) 48%, var(--couro-600) 100%)',
      }}
    >
      {/* grão de couro — cross-hatch fino + especkle, assíncrono */}
      <div
        className={`pointer-events-none absolute inset-0 ${styles.leatherContrastShift}`}
        style={{ background: 'repeating-linear-gradient(90deg, rgba(0,0,0,0) 0 1px, rgba(0,0,0,0.045) 1px 2px)' }}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${styles.leatherContrastShift}`}
        style={{ background: 'repeating-linear-gradient(0deg, color-mix(in srgb, var(--papel-100) 0%, transparent) 0 2px, color-mix(in srgb, var(--papel-100) 3%, transparent) 2px 3px)', animationDelay: '1.5s' }}
      />
      <div
        className={`pointer-events-none absolute inset-0 ${styles.leatherContrastShift}`}
        style={{ background: 'repeating-linear-gradient(125deg, rgba(0,0,0,0) 0 4px, rgba(0,0,0,0.05) 4px 5px)', animationDelay: '3s' }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{
          background:
            'radial-gradient(circle at 20% 30%, rgba(0,0,0,0.06) 0 0.5px, transparent 1px), ' +
            'radial-gradient(circle at 70% 60%, rgba(0,0,0,0.06) 0 0.5px, transparent 1px), ' +
            'radial-gradient(circle at 45% 80%, color-mix(in srgb, var(--papel-100) 5%, transparent) 0 0.5px, transparent 1px)',
          backgroundSize: '9px 9px, 13px 13px, 11px 11px',
        }}
      />
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(100% 80% at 50% 40%, color-mix(in srgb, var(--couro-50) 18%, transparent) 0%, transparent 55%)' }}
      />

      {/* marcas de uso — manchas irregulares que escurecem/clareiam devagar */}
      <div className={`pointer-events-none absolute inset-0 ${styles.leatherWearShift}`} style={{ background: 'radial-gradient(38% 22% at 28% 66%, rgba(0,0,0,0.16) 0%, transparent 70%)' }} />
      <div className={`pointer-events-none absolute inset-0 ${styles.leatherWearShift}`} style={{ background: 'radial-gradient(30% 18% at 76% 40%, color-mix(in srgb, var(--papel-100) 9%, transparent) 0%, transparent 70%)', animationDelay: '4s' }} />
      <div className={`pointer-events-none absolute inset-0 ${styles.leatherWearShift}`} style={{ background: 'radial-gradient(26% 30% at 55% 88%, rgba(0,0,0,0.12) 0%, transparent 70%)', animationDelay: '8s' }} />

      {/* luz ambiente quente incidindo de cima */}
      <div
        className="pointer-events-none absolute inset-0"
        style={{ background: 'radial-gradient(58% 42% at 50% 6%, color-mix(in srgb, var(--dourado-100) 40%, transparent) 0%, color-mix(in srgb, var(--dourado-400) 16%, transparent) 40%, transparent 72%)' }}
      />

      {/* poeira dourada caindo, concentrada perto da luz */}
      {POEIRA_DOURADA.map((p, i) => (
        <div
          key={i}
          className={styles.goldDustFall}
          style={{
            position: 'absolute',
            left: p.left,
            top: p.top,
            width: p.size,
            height: p.size,
            borderRadius: '50%',
            background: p.cor,
            ['--dfall' as string]: p.queda,
            ['--ddrift' as string]: p.deriva,
            ['--dop' as string]: p.opacidade,
            opacity: 0,
            animationDuration: p.duracao,
            animationDelay: p.atraso,
            pointerEvents: 'none',
          }}
        />
      ))}

      {/* sombra difusa ocasional cruzando a capa */}
      <div
        className={`pointer-events-none absolute ${styles.coverShadowPass}`}
        style={{ inset: '-20% -10%', opacity: 0, background: 'linear-gradient(100deg, transparent 40%, rgba(0,0,0,0.5) 50%, transparent 60%)' }}
      />

      {/* lombada (esquerda) */}
      <div
        className="absolute bottom-0 left-0 top-0"
        style={{
          width: 16,
          background:
            'repeating-linear-gradient(0deg, rgba(0,0,0,0) 0 5px, rgba(0,0,0,0.16) 5px 6px), linear-gradient(90deg, var(--lombada-300) 0%, var(--lombada-100) 55%, var(--couro-600) 100%)',
          boxShadow: 'inset -3px 0 7px rgba(0,0,0,0.55), inset 2px 0 2px color-mix(in srgb, var(--couro-50) 12%, transparent)',
        }}
      />
      <div
        className="absolute bottom-4 left-[11px] top-4 opacity-55"
        style={{ width: 1.5, background: 'repeating-linear-gradient(0deg, var(--dourado-700) 0 5px, rgba(0,0,0,0) 5px 10px)' }}
      />

      {/* moldura dourada dupla, fechada nos 4 cantos */}
      <div className="absolute rounded-lg border-2 border-dourado-500" style={{ inset: '26px 22px', boxShadow: 'inset 0 0 0 1px rgba(0,0,0,0.25)' }} />
      <div className="absolute rounded-md border border-dourado-300" style={{ inset: '32px 28px' }} />

      {/* conteúdo */}
      <div className="absolute flex flex-col items-center" style={{ inset: '32px 28px', padding: '38px 26px 34px' }}>
        <div className="font-mono text-[10px] font-medium tracking-[4px] text-dourado-400">ÁLBUM OFICIAL</div>

        {/* medalhão — parallax leve via mouse/giroscópio */}
        <div
          className="relative mt-[34px] flex items-center justify-center"
          style={{ width: 158, height: 158, transform: `translate(${(parallax.x * 5).toFixed(1)}px,${(parallax.y * 5).toFixed(1)}px)`, transition: 'transform 260ms ease-out' }}
        >
          <div
            className="absolute inset-0 rounded-full"
            style={{ background: 'radial-gradient(circle at 38% 32%, var(--dourado-50) 0%, var(--dourado-300) 42%, var(--dourado-600) 100%)', boxShadow: '0 6px 18px rgba(0,0,0,0.45), inset 0 0 0 3px var(--dourado-800)' }}
          />
          <div
            className="absolute rounded-full"
            style={{ inset: 14, background: 'radial-gradient(circle at 40% 35%, var(--couro-500) 0%, var(--couro-600) 70%, var(--parede-100) 100%)', boxShadow: 'inset 0 3px 8px rgba(0,0,0,0.6)' }}
          />
          <div className="absolute rounded-full border border-dourado-300/50" style={{ inset: 20 }} />

          {/* shimmer — varre o medalhão continuamente, sem zona morta inicial */}
          <div className="absolute inset-0 overflow-hidden rounded-full pointer-events-none">
            <div
              className={styles.medallionShimmer}
              style={{
                position: 'absolute',
                top: '-60%',
                left: '-150%',
                width: '62%',
                height: '220%',
                background: 'linear-gradient(100deg, transparent 25%, rgba(255,255,255,0.85) 50%, transparent 75%)',
                transform: 'rotate(18deg)',
              }}
            />
          </div>

          {/* troféu — silhueta ampulheta/diamante flat, sem gradiente metálico */}
          <svg viewBox="0 0 100 128" className="relative" style={{ width: 84, height: 108 }}>
            <rect x={20} y={99} width={60} height={18} rx={2.5} fill="var(--papel-300)" stroke="var(--couro-600)" strokeWidth={1.6} />
            <rect x={26} y={103} width={48} height={2.6} fill="var(--verde-badge)" />
            <path
              d="M12,8 Q50,18 88,8 C70,36 62,60 60,86 C62,92 66,95 66,99 L34,99 C34,95 38,92 40,86 C38,60 30,36 12,8 Z"
              fill="var(--papel-300)"
              stroke="var(--couro-600)"
              strokeWidth={1.6}
              strokeLinejoin="round"
            />
            <path d="M50,16 L70,44 L55,64 C57,74 57,82 61,92 L39,92 C43,82 43,74 45,64 L30,44 Z" fill="var(--dourado-300)" stroke="var(--madeira-100)" strokeWidth={1.4} strokeLinejoin="round" />
            <circle cx={50} cy={44} r={13} fill="var(--dourado-50)" stroke="var(--madeira-100)" strokeWidth={1} />
            <g stroke="var(--madeira-100)" strokeWidth={0.8} fill="none" strokeLinecap="round">
              <line x1={50} y1={39} x2={50} y2={31} />
              <line x1={54.33} y1={41.5} x2={61.26} y2={37.5} />
              <line x1={54.33} y1={46.5} x2={61.26} y2={50.5} />
              <line x1={50} y1={49} x2={50} y2={57} />
              <line x1={45.67} y1={46.5} x2={38.74} y2={50.5} />
              <line x1={45.67} y1={41.5} x2={38.74} y2={37.5} />
            </g>
            <polygon points="50,39 54.33,41.5 54.33,46.5 50,49 45.67,46.5 45.67,41.5" fill="none" stroke="var(--madeira-100)" strokeWidth={0.8} />
          </svg>
        </div>

        {/* título — cor sólida flat, só pulso periódico de brilho (sem gradiente/emboss) */}
        <div className="mt-[30px] text-center">
          <div className={`font-display text-[44px] font-bold uppercase leading-[0.92] tracking-[1px] text-dourado-100 ${styles.titleShimmerPulse}`}>PALPITÃO</div>
          <div className="mt-2 flex items-center justify-center gap-2.5">
            <span className="h-px w-[26px]" style={{ background: 'linear-gradient(90deg, transparent, var(--dourado-300))' }} />
            <span className={`font-display text-base font-bold tracking-[5px] text-dourado-300 ${styles.titleShimmerPulse}`} style={{ animationDelay: '0.3s' }}>
              BRASILEIRÃO
            </span>
            <span className="h-px w-[26px]" style={{ background: 'linear-gradient(90deg, var(--dourado-300), transparent)' }} />
          </div>
        </div>

        <div className="flex-1" />

        {/* botão — aparece só depois de 1.8s (dá tempo do usuário absorver a capa) */}
        <button
          ref={botaoRef}
          type="button"
          onClick={(e) => { e.stopPropagation(); onAbrir() }}
          className={`w-full cursor-pointer rounded-lg border font-mono text-sm font-bold tracking-[3px] text-couro-600 ${styles.buttonRevealLoop}`}
          style={{
            borderColor: 'var(--dourado-700)',
            padding: 16,
            background:
              'repeating-linear-gradient(100deg, rgba(255,255,255,0.05) 0 1px, rgba(0,0,0,0.04) 1px 2px), linear-gradient(180deg, var(--dourado-200) 0%, var(--dourado-500) 50%, var(--dourado-600) 100%)',
            boxShadow: '0 3px 10px rgba(0,0,0,0.35), inset 0 1px 0 rgba(255,255,255,0.25), inset 0 -2px 0 rgba(90,60,10,0.45)',
            pointerEvents: 'auto',
          }}
        >
          ABRIR O ÁLBUM
        </button>
        {debug && (
          <pre style={{ position: 'fixed', top: 0, left: 0, zIndex: 999999, background: 'black', color: 'lime', fontSize: 9, padding: 6, maxWidth: '100vw', whiteSpace: 'pre-wrap' }}>{debug}</pre>
        )}

        <div className="flex-1" />

        <div className="whitespace-nowrap font-mono text-[9px] tracking-[3px] text-couro-100">TEMPORADA 2026 · Nº 002</div>
      </div>

      {/* escurece conforme a capa gira ao abrir */}
      <div className="pointer-events-none absolute inset-0" style={{ background: '#000', opacity: sombraAbertura, transition: 'opacity 1200ms cubic-bezier(0.62,0,0.38,1)' }} />

      {/* reflexo de verniz — faixa diagonal clara cruzando ocasionalmente */}
      <div
        className={`pointer-events-none absolute ${styles.coverVarnishPass}`}
        style={{ inset: '-20% -10%', opacity: 0, background: 'linear-gradient(105deg, transparent 45%, color-mix(in srgb, var(--papel-100) 55%, transparent) 50%, transparent 55%)' }}
      />

      {/* vinheta — respiração lenta e contínua */}
      <div
        className={`pointer-events-none absolute inset-0 ${styles.coverVignetteBreathe}`}
        style={{ background: 'radial-gradient(120% 90% at 50% 42%, rgba(0,0,0,0) 55%, rgba(0,0,0,0.5) 100%)' }}
      />
    </div>
  )
}

const POEIRA_DOURADA = [
  { left: '32%', top: '8%', size: '2.5px', cor: 'var(--dourado-50)', queda: '130px', deriva: '8px', opacidade: '0.65', duracao: '6s', atraso: '0s' },
  { left: '58%', top: '5%', size: '2px', cor: 'var(--dourado-50)', queda: '150px', deriva: '-6px', opacidade: '0.6', duracao: '7.5s', atraso: '1.3s' },
  { left: '46%', top: '14%', size: '3px', cor: 'var(--dourado-50)', queda: '140px', deriva: '5px', opacidade: '0.55', duracao: '6.8s', atraso: '3s' },
  { left: '68%', top: '20%', size: '2px', cor: 'var(--dourado-50)', queda: '160px', deriva: '-9px', opacidade: '0.38', duracao: '8.5s', atraso: '0.5s' },
  { left: '22%', top: '24%', size: '2px', cor: 'var(--dourado-50)', queda: '170px', deriva: '7px', opacidade: '0.32', duracao: '9s', atraso: '4.5s' },
  { left: '40%', top: '48%', size: '1.8px', cor: 'var(--dourado-200)', queda: '180px', deriva: '4px', opacidade: '0.2', duracao: '10s', atraso: '2s' },
  { left: '63%', top: '62%', size: '1.8px', cor: 'var(--dourado-200)', queda: '190px', deriva: '-5px', opacidade: '0.16', duracao: '11s', atraso: '5.5s' },
  { left: '14%', top: '10%', size: '2px', cor: 'var(--dourado-50)', queda: '145px', deriva: '-7px', opacidade: '0.5', duracao: '7s', atraso: '2.5s' },
  { left: '78%', top: '9%', size: '2.5px', cor: 'var(--dourado-50)', queda: '135px', deriva: '9px', opacidade: '0.55', duracao: '6.5s', atraso: '4s' },
  { left: '50%', top: '3%', size: '2px', cor: 'var(--dourado-50)', queda: '155px', deriva: '-4px', opacidade: '0.45', duracao: '8s', atraso: '1s' },
  { left: '36%', top: '30%', size: '2px', cor: 'var(--dourado-200)', queda: '165px', deriva: '6px', opacidade: '0.3', duracao: '9.5s', atraso: '6s' },
  { left: '85%', top: '28%', size: '1.8px', cor: 'var(--dourado-200)', queda: '175px', deriva: '-8px', opacidade: '0.28', duracao: '10.3s', atraso: '3.5s' },
  { left: '8%', top: '40%', size: '2px', cor: 'var(--dourado-200)', queda: '160px', deriva: '5px', opacidade: '0.26', duracao: '9.3s', atraso: '1.5s' },
  { left: '55%', top: '36%', size: '1.8px', cor: 'var(--dourado-200)', queda: '170px', deriva: '-6px', opacidade: '0.22', duracao: '10.5s', atraso: '7s' },
  { left: '28%', top: '58%', size: '1.8px', cor: 'var(--dourado-200)', queda: '185px', deriva: '6px', opacidade: '0.18', duracao: '11.5s', atraso: '3.3s' },
]
