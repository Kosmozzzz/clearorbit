import { useId } from 'react'
import { BRAND } from '../constants/site'

/** A planet with a clean orbit ring and one satellite on it. */
export function OrbitMark({ className = 'h-9 w-9' }: { className?: string }) {
  const id = useId().replace(/:/g, '')
  return (
    <svg viewBox="0 0 48 48" className={className} aria-hidden="true">
      <defs>
        <radialGradient id={`${id}-p`} cx="0.35" cy="0.3" r="0.8">
          <stop offset="0" stopColor="#9feaff" />
          <stop offset="0.6" stopColor="#2f5bff" />
          <stop offset="1" stopColor="#0e1534" />
        </radialGradient>
      </defs>
      <circle cx="24" cy="24" r="11" fill={`url(#${id}-p)`} />
      <ellipse cx="24" cy="24" rx="21" ry="8" fill="none" stroke="#ffb36b" strokeWidth="1.6" transform="rotate(-24 24 24)" />
      <circle cx="42.5" cy="16" r="2.8" fill="#ff7a3d" />
    </svg>
  )
}

export function Logo() {
  return (
    <span className="inline-flex items-center gap-3">
      <OrbitMark />
      <span className="display text-[1.15rem] !normal-case tracking-[0.02em] text-white">{BRAND}</span>
    </span>
  )
}
