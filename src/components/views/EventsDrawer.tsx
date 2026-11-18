import { useMemo, useState } from 'react'
import { useApp } from '../../store/app'
import { EVENTS, EVENT_TYPES, EVENT_COLOR } from '../../data/events'
import { formatYear } from '../../lib/chrono'
import { runAction } from '../../lib/navigate'
import { CloseButton } from '../ui'

export function EventsDrawer() {
  const { eventFilter, toggleEventType, setView, year, selection } = useApp()
  const [q, setQ] = useState('')
  const list = useMemo(
    () => EVENTS.filter((e) => eventFilter.includes(e.type) && (!q || (e.title + e.place + e.participants.join(' ')).toLowerCase().includes(q.toLowerCase()))).sort((a, b) => a.y - b.y),
    [eventFilter, q],
  )
  return (
    <div className="absolute left-3 top-3 z-20 flex max-h-[calc(100%-80px)] w-[340px] max-w-[calc(100%-24px)] flex-col overflow-hidden rounded-xl border border-line bg-paper/98 shadow-xl">
      <div className="flex items-center justify-between border-b border-line px-4 py-2.5">
        <h2 className="font-serif text-[18px] text-ink">Historical events</h2>
        <CloseButton onClick={() => setView('explore')} />
      </div>
      <div className="border-b border-line px-4 py-3">
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Filter events…" aria-label="Filter events" className="h-8 w-full rounded-full border border-line bg-ivory px-3 text-[13px] focus:border-bronze focus:outline-none" />
        <div className="mt-2.5 flex flex-wrap gap-1.5">
          {EVENT_TYPES.map((t) => {
            const on = eventFilter.includes(t.id)
            return (
              <button key={t.id} onClick={() => toggleEventType(t.id)} aria-pressed={on} className={`flex items-center gap-1.5 rounded-full border px-2 py-0.5 text-[11.5px] transition ${on ? 'border-ink/30 bg-paper text-ink' : 'border-line text-muted line-through'}`}>
                <span className="h-2 w-2 rounded-full" style={{ background: on ? t.color : '#ccc' }} />
                {t.label}
              </button>
            )
          })}
        </div>
        <p className="mt-2 text-[11px] text-muted">Map markers use the same filters. Selecting an event travels to its year.</p>
      </div>
      <ul className="scroll-thin min-h-0 flex-1 overflow-y-auto p-1.5">
        {list.map((e) => {
          const near = Math.abs(e.y - year) < 25
          const sel = selection.kind === 'event' && selection.id === e.id
          return (
            <li key={e.id}>
              <button onClick={() => runAction({ type: 'event', id: e.id })} className={`flex w-full items-start gap-2.5 rounded-lg px-2.5 py-2 text-left hover:bg-parchment/70 ${sel ? 'bg-bronze-soft' : ''}`}>
                <span className="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />
                <span className="min-w-0">
                  <span className={`block text-[13px] ${near ? 'font-medium text-ink' : 'text-ink'}`}>{e.title}</span>
                  <span className="block text-[11.5px] tabular text-muted">{formatYear(e.y, { circa: e.circa })}{e.yEnd ? `–${formatYear(e.yEnd)}` : ''} · {e.place}</span>
                </span>
              </button>
            </li>
          )
        })}
        {list.length === 0 && <li className="p-4 text-[13px] text-muted">No events match these filters.</li>}
      </ul>
    </div>
  )
}
