'use client'

// AnimatedButton — botão universal com micro-interações elegantes.
// - Press-down (scale 0.96) ao clicar
// - Hover glow (sombra dourada expande)
// - Loading state com spinner
// - Vibração leve em mobile (haptic)
// - Disabled com opacidade suave
//
// Nota TS: estende HTMLMotionProps<'button'> (não ButtonHTMLAttributes) pra
// evitar conflito entre onAnimationStart do HTML (AnimationEventHandler) e
// o do Framer Motion (recebe AnimationDefinition).

import { motion, type HTMLMotionProps } from 'framer-motion'
import { forwardRef } from 'react'

export type ButtonVariant = 'gold' | 'green' | 'danger' | 'outline' | 'whatsapp' | 'ghost'

interface AnimatedButtonProps extends Omit<HTMLMotionProps<'button'>, 'onClick' | 'children'> {
  variant?: ButtonVariant
  loading?: boolean
  hapticFeedback?: boolean
  fullWidth?: boolean
  onClick?: () => void | Promise<void>
  children: React.ReactNode
}

const styles: Record<ButtonVariant, string> = {
  gold: 'bg-dourado-400 text-papel-50 border-transparent hover:bg-dourado-500 hover:shadow-[0_0_16px_rgba(184,134,11,0.4)]',
  green: 'bg-green-700 text-white border-transparent hover:bg-green-800 hover:shadow-[0_0_16px_rgba(21,128,61,0.4)]',
  danger: 'bg-red-600 text-papel-50 border-transparent hover:bg-red-700 hover:shadow-[0_0_16px_rgba(220,38,38,0.4)]',
  outline: 'bg-transparent text-tinta-200 border-papel-borda-300 hover:bg-papel-200',
  whatsapp: 'bg-[#25D366] text-papel-50 border-transparent hover:bg-[#1ebe5d] hover:shadow-[0_0_16px_rgba(37,211,102,0.4)]',
  ghost: 'bg-transparent text-tinta-200 border-transparent hover:bg-papel-100',
}

export const AnimatedButton = forwardRef<HTMLButtonElement, AnimatedButtonProps>(
  ({ variant = 'gold', loading, hapticFeedback = true, fullWidth, onClick, children, className = '', disabled, ...rest }, ref) => {
    async function handleClick() {
      if (loading || disabled) return
      if (hapticFeedback && typeof window !== 'undefined' && 'vibrate' in navigator) {
        try { navigator.vibrate(8) } catch { /* silencioso */ }
      }
      if (onClick) await onClick()
    }

    return (
      <motion.button
        ref={ref}
        whileTap={loading || disabled ? {} : { scale: 0.96 }}
        transition={{ duration: 0.12, ease: [0.32, 0.72, 0, 1] }}
        disabled={disabled || loading}
        onClick={handleClick}
        className={`inline-flex items-center justify-center gap-2 rounded-md border px-3 py-2 font-mono text-xs font-bold uppercase tracking-wider transition-all duration-200 disabled:cursor-not-allowed disabled:opacity-40 ${styles[variant]} ${fullWidth ? 'w-full' : ''} ${className}`}
        {...rest}
      >
        {loading ? (
          <>
            <Spinner />
            <span className="opacity-80">Carregando...</span>
          </>
        ) : (
          children
        )}
      </motion.button>
    )
  },
)

AnimatedButton.displayName = 'AnimatedButton'

function Spinner() {
  return (
    <motion.span
      className="inline-block h-3.5 w-3.5 rounded-full border-2 border-current border-t-transparent"
      animate={{ rotate: 360 }}
      transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
    />
  )
}
