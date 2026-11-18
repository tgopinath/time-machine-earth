import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp, type View } from '../store/app'
import { search, type SearchResult } from '../lib/search'
import { runAction } from '../lib/navigate'

const NAV: { id: View; label: string }[] = [
  { id: 'explore', label: 'Explore' },
  { id: 'events', label: 'Historical Events' },
  { id: 'civilizations', label: 'Civilizations' },
  { id: 'compare', label: 'Compare Maps' },
  { id: 'learn', label: 'Learn' },
  { id: 'saved', label: 'Saved Places' },
]

const EXAMPLES = ['What existed in India in 500 BCE?', 'Who ruled Egypt in 1000 BCE?', 'What did Europe look like in 1500?', 'When did the Roman Empire fall?', 'How did the borders of Germany change?', 'What existed before Chennai became Madras?']

export function TopNav({ onSettings, onProfile }: { onSettings: () => void; onProfile: () => void }) {
  const { view, setView, profileName, quiz } = useApp()
  const [menu, setMenu] = useState(false)
  return (
    <header className="relative z-30 flex h-14 shrink-0 items-center gap-3 border-b border-line bg-paper px-3 md:px-5">
      <button onClick={() => setView('explore')} className="tme-web-only flex items-center gap-2.5" aria-label="Time Machine Earth home">
        <Logo />
        <span className="hidden font-serif text-[19px] leading-none tracking-tight text-ink sm:inline">
          Time Machine <span className="italic text-bronze-2">Earth</span>
        </span>
      </button>
      <nav className="tme-web-only ml-3 hidden items-center gap-0.5 lg:flex" aria-label="Main">
        {NAV.map((n) => (
          <button key={n.id} onClick={() => setView(n.id)} aria-current={view === n.id ? 'page' : undefined} className={`rounded-full px-3 py-1.5 text-[13px] transition ${view === n.id ? 'bg-ink text-ivory' : 'text-ink-2 hover:bg-parchment'}`}>
            {n.label}
          </button>
        ))}
      </nav>
      <div className="tme-searchrow ml-auto flex min-w-0 flex-1 items-center justify-end gap-2 lg:flex-none">
        <SearchBox />
        <button onClick={onSettings} aria-label="Settings" title="Settings" className="tme-web-only flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-ink-2 hover:bg-parchment">
          <svg viewBox="0 0 24 24" className="h-[18px] w-[18px]" fill="none" stroke="currentColor" strokeWidth="1.8"><circle cx="12" cy="12" r="3" /><path d="M19.4 15a1.7 1.7 0 0 0 .3 1.8l.1.1a2 2 0 1 1-2.8 2.8l-.1-.1a1.7 1.7 0 0 0-1.8-.3 1.7 1.7 0 0 0-1 1.5V21a2 2 0 1 1-4 0v-.1a1.7 1.7 0 0 0-1.1-1.5 1.7 1.7 0 0 0-1.8.3l-.1.1a2 2 0 1 1-2.8-2.8l.1-.1a1.7 1.7 0 0 0 .3-1.8 1.7 1.7 0 0 0-1.5-1H3a2 2 0 1 1 0-4h.1a1.7 1.7 0 0 0 1.5-1.1 1.7 1.7 0 0 0-.3-1.8l-.1-.1a2 2 0 1 1 2.8-2.8l.1.1a1.7 1.7 0 0 0 1.8.3H9a1.7 1.7 0 0 0 1-1.5V3a2 2 0 1 1 4 0v.1a1.7 1.7 0 0 0 1 1.5 1.7 1.7 0 0 0 1.8-.3l.1-.1a2 2 0 1 1 2.8 2.8l-.1.1a1.7 1.7 0 0 0-.3 1.8V9a1.7 1.7 0 0 0 1.5 1H21a2 2 0 1 1 0 4h-.1a1.7 1.7 0 0 0-1.5 1z" /></svg>
        </button>
        <button onClick={onProfile} aria-label={`Profile: ${profileName}, ${quiz.points} points`} title="Profile & progress" className="flex h-9 shrink-0 items-center gap-2 rounded-full border border-line pl-1 pr-2.5 hover:border-bronze">
          <span className="flex h-7 w-7 items-center justify-center rounded-full bg-bronze-soft font-serif text-[14px] text-bronze-2">{profileName.slice(0, 1).toUpperCase()}</span>
          <span className="hidden text-[12px] tabular text-ink-2 sm:inline">{quiz.points} pts</span>
        </button>
        <button onClick={() => setMenu(!menu)} aria-label="Menu" aria-expanded={menu} className="tme-web-only flex h-9 w-9 items-center justify-center rounded-full text-ink-2 hover:bg-parchment lg:hidden">
          <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2"><path d="M4 7h16M4 12h16M4 17h16" /></svg>
        </button>
      </div>
      {menu && (
        <nav className="absolute right-3 top-14 z-40 w-56 rounded-xl border border-line bg-paper p-1.5 shadow-xl lg:hidden" aria-label="Main (mobile)">
          {NAV.map((n) => (
            <button key={n.id} onClick={() => { setView(n.id); setMenu(false) }} className={`block w-full rounded-lg px-3 py-2 text-left text-[14px] ${view === n.id ? 'bg-ink text-ivory' : 'text-ink hover:bg-parchment'}`}>
              {n.label}
            </button>
          ))}
          <button onClick={() => { setView('sources'); setMenu(false) }} className="block w-full rounded-lg px-3 py-2 text-left text-[14px] text-ink hover:bg-parchment">Data & sources</button>
        </nav>
      )}
    </header>
  )
}

function Logo() {
  return (
    <svg viewBox="0 0 32 32" className="h-8 w-8" aria-hidden>
      <circle cx="16" cy="16" r="14" fill="#1d3148" />
      <path d="M5 13c4 1 6-2 9-1s3 4 6 3 5-3 7-2M4.5 19c3 0 5 2 8 1s4-3 7-2 4 3 8 1" stroke="#e9dfc6" strokeWidth="1.6" fill="none" strokeLinecap="round" />
      <circle cx="16" cy="16" r="14" fill="none" stroke="#9a6b34" strokeWidth="1.5" />
      <path d="M16 7v9l5 3" stroke="#f0e2c9" strokeWidth="1.8" fill="none" strokeLinecap="round" />
    </svg>
  )
}

function SearchBox() {
  const [q, setQ] = useState('')
  const [open, setOpen] = useState(false)
  const [active, setActive] = useState(0)
  const ref = useRef<HTMLInputElement>(null)
  const results = useMemo(() => search(q), [q])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.key === '/' || (e.key === 'k' && (e.metaKey || e.ctrlKey))) && document.activeElement?.tagName !== 'INPUT') {
        e.preventDefault()
        ref.current?.focus()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const choose = (r: SearchResult) => {
    runAction(r.action)
    setOpen(false)
    setQ('')
    ref.current?.blur()
  }

  return (
    <div className="tme-search relative w-full max-w-[380px]">
      <svg viewBox="0 0 24 24" className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" fill="none" stroke="currentColor" strokeWidth="2"><circle cx="11" cy="11" r="7" /><path d="M20 20l-3.5-3.5" /></svg>
      <input
        ref={ref}
        value={q}
        onChange={(e) => { setQ(e.target.value); setActive(0); setOpen(true) }}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown') { setActive((a) => Math.min(a + 1, results.length - 1)); e.preventDefault() }
          if (e.key === 'ArrowUp') { setActive((a) => Math.max(a - 1, 0)); e.preventDefault() }
          if (e.key === 'Enter' && results[active]) choose(results[active])
          if (e.key === 'Escape') ref.current?.blur()
        }}
        placeholder="Search places, empires, events, years…"
        aria-label="Search history"
        role="combobox"
        aria-expanded={open}
        aria-controls="search-results"
        className="h-9 w-full rounded-full border border-line bg-ivory pl-9 pr-10 text-[13px] text-ink placeholder:text-muted focus:border-bronze focus:outline-none"
      />
      <kbd className="pointer-events-none absolute right-3 top-1/2 hidden -translate-y-1/2 rounded border border-line px-1.5 text-[10px] text-muted md:block">/</kbd>
      {open && (
        <div id="search-results" role="listbox" className="absolute right-0 top-11 z-50 w-[min(440px,calc(100vw-24px))] overflow-hidden rounded-xl border border-line bg-paper shadow-2xl">
          {q.trim() === '' ? (
            <div className="p-3">
              <div className="mb-1.5 px-1 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Try asking</div>
              {EXAMPLES.map((ex) => (
                <button key={ex} onMouseDown={(e) => e.preventDefault()} onClick={() => { setQ(ex); setOpen(true) }} className="block w-full rounded-md px-2 py-1.5 text-left text-[13px] text-ink-2 hover:bg-parchment">
                  {ex}
                </button>
              ))}
            </div>
          ) : results.length === 0 ? (
            <div className="p-4 text-[13px] text-muted">Nothing found for “{q}”. Try a year (e.g. 1200 CE), an empire, a city or a question.</div>
          ) : (
            <ul className="scroll-thin max-h-[60vh] overflow-y-auto p-1.5">
              {results.map((r, i) => (
                <li key={r.kind + r.label + i} role="option" aria-selected={i === active}>
                  <button onMouseDown={(e) => e.preventDefault()} onClick={() => choose(r)} onMouseEnter={() => setActive(i)} className={`flex w-full items-start gap-3 rounded-lg px-2.5 py-2 text-left ${i === active ? 'bg-parchment' : ''}`}>
                    <span className={`mt-0.5 shrink-0 rounded px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wider ${r.kind === 'Question' ? 'bg-bronze text-ivory' : 'bg-parchment text-ink-2'}`}>{r.kind}</span>
                    <span className="min-w-0">
                      <span className="block truncate text-[13.5px] text-ink">{r.label}</span>
                      <span className="block truncate text-[11.5px] text-muted">{r.sub}</span>
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  )
}
