'use client'

// FigurinhaCapa — figurinhas soltas espalhadas pela capa do álbum (decoração,
// não interativas). Reaproveita os PNGs de public/stickers/ (recorte já
// pronto, fundo transparente) e aplica um efeito "die-cut vintage": um halo
// cor de papel envelhecido atrás da imagem colorida, simulando a borda
// recortada à mão de uma figurinha antiga.

export function StickerCapa({
  children,
  top,
  left,
  right,
  bottom,
  rotate = 0,
  zIndex = 3,
  centralizado = false,
}: {
  children: React.ReactNode
  top?: string
  left?: string
  right?: string
  bottom?: string
  rotate?: number
  zIndex?: number
  /** Centraliza horizontalmente (usar com left="50%"), somando translateX(-50%). */
  centralizado?: boolean
}) {
  return (
    <div
      className="absolute"
      style={{
        top,
        left,
        right,
        bottom,
        transform: `${centralizado ? 'translateX(-50%) ' : ''}rotate(${rotate}deg)`,
        zIndex,
        filter: 'drop-shadow(3px 4px 0 color-mix(in srgb, var(--parede-200) 52%, transparent))',
      }}
    >
      {children}
    </div>
  )
}

export function FigurinhaDieCut({ src, altura }: { src: string; altura: number }) {
  // Recolore a silhueta para um halo cor de papel (die-cut) e sobrepõe a
  // imagem original com sépia mais acentuada — aproxima o tom vívido dos
  // PNGs originais da paleta quente de couro/dourado da capa, sem alterar
  // o traço/estilo das imagens.
  const antiquePaper =
    'brightness(0) saturate(100%) invert(91%) sepia(20%) saturate(384%) hue-rotate(351deg) brightness(103%) contrast(90%) ' +
    'drop-shadow(2px 0 0 var(--papel-200)) drop-shadow(-2px 0 0 var(--papel-200)) drop-shadow(0 2px 0 var(--papel-200)) drop-shadow(0 -2px 0 var(--papel-200)) ' +
    'drop-shadow(1px 3px 2px color-mix(in srgb, var(--couro-600) 48%, transparent))'
  return (
    <div
      style={{
        position: 'relative',
        display: 'block',
        lineHeight: 0,
        filter: 'drop-shadow(2px 3px 1px color-mix(in srgb, var(--couro-600) 34%, transparent))',
      }}
    >
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: 0,
          height: altura,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
          transform: 'scale(1.08)',
          transformOrigin: 'center',
          filter: antiquePaper,
          opacity: 0.98,
        }}
        draggable={false}
      />
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={src}
        alt=""
        style={{
          position: 'relative',
          zIndex: 1,
          height: altura,
          width: 'auto',
          display: 'block',
          objectFit: 'contain',
          filter: 'sepia(0.42) saturate(0.6) brightness(0.88) contrast(0.85)',
        }}
        draggable={false}
      />
      <span
        aria-hidden="true"
        style={{
          position: 'absolute',
          inset: '8%',
          background:
            'radial-gradient(circle, color-mix(in srgb, var(--couro-400) 16%, transparent) 0 1px, transparent 1.4px)',
          backgroundSize: '8px 8px',
          mixBlendMode: 'multiply',
          opacity: 0.18,
          pointerEvents: 'none',
          WebkitMaskImage: `url(${src})`,
          maskImage: `url(${src})`,
          WebkitMaskRepeat: 'no-repeat',
          maskRepeat: 'no-repeat',
          WebkitMaskSize: 'contain',
          maskSize: 'contain',
          WebkitMaskPosition: 'center',
          maskPosition: 'center',
        }}
      />
    </div>
  )
}
