'use client'

// Skeleton — placeholder animado pra estados de loading.

export function Skeleton({
  className = '',
  width,
  height,
  circle = false,
}: {
  className?: string
  width?: string | number
  height?: string | number
  circle?: boolean
}) {
  return (
    <div
      className={`animate-pulse bg-gradient-to-r from-papel-200 via-papel-300 to-papel-200 ${circle ? 'rounded-full' : 'rounded'} ${className}`}
      style={{
        width: width ?? '100%',
        height: height ?? '1rem',
        backgroundSize: '200% 100%',
        animation: 'shimmer 1.5s ease-in-out infinite',
      }}
    />
  )
}

export function SkeletonLinha({ largura = '100%' }: { largura?: string }) {
  return <Skeleton width={largura} height="14px" />
}

export function SkeletonAvatar({ size = 40 }: { size?: number }) {
  return <Skeleton circle width={size} height={size} />
}

export function SkeletonCard({ altura = '80px' }: { altura?: string }) {
  return <Skeleton height={altura} className="w-full" />
}
