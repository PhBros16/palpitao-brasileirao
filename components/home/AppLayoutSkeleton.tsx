'use client'

import { motion } from 'framer-motion'

function ShimmerBox({ className = '', style }: { className?: string; style?: React.CSSProperties }) {
  return (
    <motion.div
      animate={{ opacity: [0.4, 0.7, 0.4] }}
      transition={{ duration: 1.5, repeat: Infinity, ease: 'easeInOut' }}
      className={`rounded-md bg-gradient-to-r from-papel-300 via-papel-200 to-papel-300 ${className}`}
      style={{ backgroundSize: '200% 100%', ...style }}
    />
  )
}

export function SkeletonHeader() {
  return (
    <div className="flex items-center gap-3 rounded-lg border-2 border-dourado-300 bg-papel-50 px-3 py-2 shadow-sm">
      <ShimmerBox className="h-14 w-14 rounded-full" />
      <div className="flex-1 space-y-2">
        <ShimmerBox className="h-4 w-32" />
        <ShimmerBox className="h-2.5 w-20" />
      </div>
      <ShimmerBox className="h-7 w-8" />
      <ShimmerBox className="h-7 w-14" />
    </div>
  )
}

export function SkeletonNav() {
  return (
    <div className="rounded-lg border-2 border-dourado-300 bg-papel-50 shadow-sm">
      <div className="flex gap-1 p-1.5">
        {[80, 90, 80, 85, 100, 70].map((w, i) => (
          <ShimmerBox key={i} className="h-7 rounded-md" style={{ width: w }} />
        ))}
      </div>
    </div>
  )
}

export function SkeletonConteudo() {
  return (
    <div className="space-y-3">
      <ShimmerBox className="h-32" />
      <ShimmerBox className="h-24" />
      <ShimmerBox className="h-24" />
      <ShimmerBox className="h-40" />
    </div>
  )
}
