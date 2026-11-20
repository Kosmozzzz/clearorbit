import type { ReactNode } from 'react'

interface PageHeaderProps {
  eyebrow: string
  title: string
  sub?: string
  children?: ReactNode
}

/** Opening of every inner page: a label, a large headline, one line of context, faint orbit rings behind. */
export function PageHeader({ eyebrow, title, sub, children }: PageHeaderProps) {
  return (
    <header className="glow stars relative overflow-hidden border-b border-line px-5 pb-14 pt-[calc(var(--header-h)+3.5rem)] sm:px-10 sm:pb-20 sm:pt-[calc(var(--header-h)+5rem)]">
      <svg className="pointer-events-none absolute -right-32 top-6 hidden h-[34rem] w-[34rem] text-orbit/15 md:block" viewBox="0 0 200 200" fill="none" stroke="currentColor" aria-hidden="true">
        {[40, 62, 84].map((r, i) => (
          <ellipse key={r} cx="100" cy="100" rx={r * 1.15} ry={r * 0.45} transform={`rotate(${-20 + i * 14} 100 100)`} strokeWidth="0.5" strokeDasharray={i % 2 ? '2 4' : undefined} />
        ))}
        <circle cx="100" cy="100" r="22" fill="currentColor" fillOpacity="0.25" stroke="none" />
      </svg>
      <div className="relative mx-auto max-w-[1200px]">
        <p className="eyebrow rise-in">{eyebrow}</p>
        <h1 className="display rise-in mt-5 max-w-4xl text-[clamp(2.3rem,6vw,4.8rem)] text-balance" style={{ animationDelay: '0.08s' }}>
          {title}
        </h1>
        {sub && (
          <p className="rise-in mt-6 max-w-2xl text-lg leading-relaxed text-ice/75 sm:text-xl" style={{ animationDelay: '0.16s' }}>
            {sub}
          </p>
        )}
        {children && (
          <div className="rise-in mt-8" style={{ animationDelay: '0.24s' }}>
            {children}
          </div>
        )}
      </div>
    </header>
  )
}
