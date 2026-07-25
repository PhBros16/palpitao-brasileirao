'use client'

import { motion, type Variants } from 'framer-motion'
import { ReactNode, ElementType } from 'react'

interface StaggerListProps {
  children: ReactNode
  className?: string
  itemClassName?: string
  as?: ElementType
  delay?: number
  duration?: number
  staggerDelay?: number
  yOffset?: number
}

const containerVariants = (delay: number, staggerDelay: number): Variants => ({
  hidden: {},
  visible: {
    transition: {
      delayChildren: delay,
      staggerChildren: staggerDelay,
    },
  },
})

const itemVariants = (duration: number, yOffset: number): Variants => ({
  hidden: { opacity: 0, y: yOffset },
  visible: {
    opacity: 1,
    y: 0,
    transition: {
      duration,
      ease: [0.32, 0.72, 0, 1] as const,
    },
  },
})

export default function StaggerList({
  children,
  className = '',
  itemClassName = '',
  as: Tag = 'div',
  delay = 0,
  duration = 0.35,
  staggerDelay = 0.07,
  yOffset = 16,
}: StaggerListProps) {
  const MotionComponent = motion(Tag as ElementType)
  const MotionItem = motion.div

  return (
    <MotionComponent
      variants={containerVariants(delay, staggerDelay)}
      initial="hidden"
      animate="visible"
      className={className}
    >
      {Array.isArray(children)
        ? children.map((child, i) => (
            <MotionItem
              key={i}
              variants={itemVariants(duration, yOffset)}
              className={itemClassName}
            >
              {child}
            </MotionItem>
          ))
        : (
          <MotionItem variants={itemVariants(duration, yOffset)} className={itemClassName}>
            {children}
          </MotionItem>
        )}
    </MotionComponent>
  )
}
