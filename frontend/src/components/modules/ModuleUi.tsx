import type { ReactNode } from 'react'
import type { BadgeTone } from './mockData'

export function ModuleHeader({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action: string }) {
  return (
    <header className="module-page-header">
      <div><span className="section-kicker">{eyebrow}</span><h1>{title}</h1><p>{description}</p></div>
      <button type="button" className="module-primary-action"><span aria-hidden="true">＋</span>{action}</button>
    </header>
  )
}

export function Badge({ tone = 'neutral', children }: { tone?: BadgeTone; children: ReactNode }) {
  return <span className={`module-badge module-badge--${tone}`}>{children}</span>
}

export function SearchField({ placeholder }: { placeholder: string }) {
  return <label className="module-search"><span aria-hidden="true">⌕</span><input type="text" placeholder={placeholder} readOnly aria-label={placeholder} /></label>
}

export function FilterChip({ active = false, children }: { active?: boolean; children: ReactNode }) {
  return <button type="button" className={`module-filter-chip${active ? ' is-active' : ''}`}>{children}</button>
}

export function SelectLike({ children }: { children: ReactNode }) {
  return <button type="button" className="module-select-like"><span>{children}</span><span aria-hidden="true">⌄</span></button>
}

export function StatCard({ icon, label, value, tone = 'neutral' }: { icon: string; label: string; value: string; tone?: BadgeTone }) {
  return <article className={`module-stat module-stat--${tone}`}><span className="module-stat__icon" aria-hidden="true">{icon}</span><div><span>{label}</span><strong>{value}</strong></div></article>
}
