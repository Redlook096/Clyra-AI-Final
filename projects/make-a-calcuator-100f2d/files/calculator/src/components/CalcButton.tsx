import type { ReactNode } from 'react'
import './CalcButton.css'

type Variant = 'number' | 'operator' | 'clear' | 'equals' | 'function'

interface CalcButtonProps {
  label: string
  variant?: Variant
  span?: 1 | 2
  onClick: () => void
  ariaLabel?: string
  children?: ReactNode
}

export default function CalcButton({
  label,
  variant = 'number',
  span = 1,
  onClick,
  ariaLabel,
  children,
}: CalcButtonProps) {
  const classes = [
    'calc-btn',
    `calc-btn--${variant}`,
    span === 2 ? 'calc-btn--span-2' : '',
  ]
    .filter(Boolean)
    .join(' ')

  return (
    <button
      className={classes}
      onClick={onClick}
      aria-label={ariaLabel ?? label}
      type="button"
    >
      {children ?? label}
    </button>
  )
}
