import type { ReactNode } from 'react'
import type { Source } from '../data/types'
import { useApp, type SavedItem } from '../store/app'

export function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="border-t border-line/70 px-5 py-4 first:border-t-0">
      <div className="mb-2 flex items-center justify-between">
        <h3 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{title}</h3>
        {aside}
      </div>
      {children}
    </section>
  )
}

export function Badge({ children, tone = 'neutral' }: { children: ReactNode; tone?: 'neutral' | 'bronze' | 'warn' | 'ok' | 'navy' }) {
  const tones = {
    neutral: 'border-line bg-parchment/60 text-ink-2',
    bronze: 'border-bronze/30 bg-bronze-soft text-bronze-2',
    warn: 'border-loss/30 bg-loss/8 text-loss',
    ok: 'border-gain/30 bg-gain/10 text-gain',
    navy: 'border-navy/20 bg-navy/8 text-navy',
  }
  return <span className={`inline-flex items-center rounded-full border px-2 py-0.5 text-[11px] font-medium ${tones[tone]}`}>{children}</span>
}

export function Sources({ items }: { items: Source[] }) {
  if (!items.length) return null
  return (
    <ul className="space-y-1">
      {items.map((s) => (
        <li key={s.url} className="text-[12px]">
          <a href={s.url} target="_blank" rel="noreferrer" className="text-navy-2 underline decoration-line underline-offset-2 hover:decoration-navy-2">
            {s.label}
          </a>
        </li>
      ))}
    </ul>
  )
}

export function KV({ k, children }: { k: string; children: ReactNode }) {
  return (
    <div className="grid grid-cols-[108px_1fr] gap-2 py-1 text-[13px]">
      <dt className="text-muted">{k}</dt>
      <dd className="text-ink">{children}</dd>
    </div>
  )
}

export function Missing({ children = 'No reliable estimate available' }: { children?: ReactNode }) {
  return <span className="italic text-muted">{children}</span>
}

export function SaveButton({ item, label = 'Save' }: { item: Omit<SavedItem, 'id' | 'createdAt'>; label?: string }) {
  const { saved, save, unsave } = useApp()
  const existing = saved.find((s) => s.kind === item.kind && s.ref === item.ref && (item.kind !== 'year' || s.year === item.year))
  return (
    <button
      onClick={() => (existing ? unsave(existing.id) : save(item))}
      aria-pressed={!!existing}
      className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[12px] transition ${existing ? 'border-bronze bg-bronze-soft text-bronze-2' : 'border-line text-ink-2 hover:border-bronze hover:text-bronze-2'}`}
    >
      <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill={existing ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
        <path d="M6 3h12v18l-6-4-6 4z" />
      </svg>
      {existing ? 'Saved' : label}
    </button>
  )
}

export function PrimaryButton({ children, onClick, className = '' }: { children: ReactNode; onClick: () => void; className?: string }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-2 rounded-full bg-ink px-4 py-2 text-[13px] font-medium text-ivory transition hover:bg-bronze-2 ${className}`}>
      {children}
    </button>
  )
}

export function GhostButton({ children, onClick, className = '', active = false }: { children: ReactNode; onClick: () => void; className?: string; active?: boolean }) {
  return (
    <button onClick={onClick} className={`inline-flex items-center justify-center gap-1.5 rounded-full border px-3 py-1.5 text-[12.5px] transition ${active ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-2 hover:border-bronze hover:text-bronze-2'} ${className}`}>
      {children}
    </button>
  )
}

export function Modal({ title, onClose, children, wide = false }: { title: string; onClose: () => void; children: ReactNode; wide?: boolean }) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ink/35 p-4" onMouseDown={(e) => e.target === e.currentTarget && onClose()} role="dialog" aria-modal="true" aria-label={title}>
      <div className={`max-h-[88vh] w-full overflow-hidden rounded-xl border border-line bg-paper shadow-2xl ${wide ? 'max-w-4xl' : 'max-w-lg'}`}>
        <div className="flex items-center justify-between border-b border-line px-5 py-3">
          <h2 className="font-serif text-[20px] text-ink">{title}</h2>
          <CloseButton onClick={onClose} />
        </div>
        <div className="scroll-thin max-h-[calc(88vh-56px)] overflow-y-auto">{children}</div>
      </div>
    </div>
  )
}

export function CloseButton({ onClick, label = 'Close' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick} aria-label={label} className="flex h-8 w-8 items-center justify-center rounded-full text-muted hover:bg-parchment hover:text-ink">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2">
        <path d="M6 6l12 12M18 6L6 18" />
      </svg>
    </button>
  )
}
