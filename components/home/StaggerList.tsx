'use client'

// StaggerList — wrapper que aplica entrada em cascata nos filhos.
// Cada filho aparece com delay incremental (fade + slide up sutil).

import { motion } from 'framer-motion'

const container = {
  hidden: { opacity: 1 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.05,
      delayChildren: 0.05,
    },
  },
}

const item = {
  hidden: { opacity: 0, y: 12 },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration: 0.35,
      ease: [0.32, 0.72, 0, 1],
    },
  },
}

export function StaggerList({
  children,
  className,
  as: Component = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'ul' | 'ol' | 'tbody'
}) {
  const MotionComponent = motion[Component as 'div']
  return (
    <MotionComponent
      variants={container}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {children}
    </MotionComponent>
  )
}

export function StaggerItem({
  children,
  className,
  as: Component = 'div',
}: {
  children: React.ReactNode
  className?: string
  as?: 'div' | 'li' | 'tr'
}) {
  const MotionComponent = motion[Component as 'div']
  return (
    <MotionComponent variants={item} className={className}>
      {children}
    </MotionComponent>
  )
}
