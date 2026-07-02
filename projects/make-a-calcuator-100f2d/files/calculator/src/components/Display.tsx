import { useRef, useEffect, useState } from 'react'
import './Display.css'

interface DisplayProps {
  value: string
  expression: string
}

export default function Display({ value, expression }: DisplayProps) {
  const ref = useRef<HTMLDivElement>(null)
  const [animate, setAnimate] = useState(false)
  const prevValue = useRef(value)

  useEffect(() => {
    if (prevValue.current !== value) {
      setAnimate(true)
      prevValue.current = value
      const timer = setTimeout(() => setAnimate(false), 200)
      return () => clearTimeout(timer)
    }
  }, [value])

  const displayValue =
    value === 'Error' ? 'Error' : parseFloat(value).toLocaleString(undefined, {
      maximumFractionDigits: 15,
    })

  return (
    <div className="display" ref={ref}>
      <div
        className={`display__expression${expression ? ' display__expression--active' : ''}`}
        aria-live="polite"
      >
        {expression || '\u00A0'}
      </div>
      <div
        className={`display__value${animate ? ' display__value--animate' : ''}`}
        aria-live="assertive"
        aria-atomic="true"
      >
        {displayValue}
      </div>
    </div>
  )
}
