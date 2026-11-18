import { useState } from 'react'
import { useApp, type LayerId } from '../store/app'
import { EVENT_TYPES } from '../data/events'

export const LAYER_DEFS: { id: LayerId; label: string; hint: string }[] = [
  { id: 'political', label: 'Political map', hint: 'All territories in the snapshot' },
  { id: 'empires', label: 'Empire map', hint: 'Emphasise empires, caliphates, dynasties, colonial empires' },
  { id: 'civilizations', label: 'Civilization map', hint: 'Emphasise curated civilizations' },
  { id: 'settlements', label: 'Ancient settlements', hint: 'Archaeological and ancient sites' },
  { id: 'routes', label: 'Historical trade routes', hint: 'Schematic routes active this year' },
  { id: 'battles', label: 'Historical battles', hint: 'Wars & battles near this year' },
  { id: 'events', label: 'Other historical events', hint: 'Political, cultural, discoveries…' },
  { id: 'capitals', label: 'Capital cities', hint: 'Curated capitals valid this year' },
  { id: 'colonial', label: 'Colonial territories', hint: 'Dependencies outlined in red' },
  { id: 'modern', label: 'Modern political boundaries', hint: "Today's borders (Natural Earth) for reference" },
  { id: 'terrain', label: 'Geographic terrain', hint: 'Shaded relief' },
  { id: 'uncertainty', label: 'Show border uncertainty', hint: 'Hatch approximate territories' },
]

export function LayersPanel() {
  const { layers, toggleLayer } = useApp()
  const [open, setOpen] = useState(false)
  return (
    <div className="absolute bottom-3 left-3 z-10 flex flex-col items-start gap-2">
      {open && (
        <div className="w-[272px] rounded-xl border border-line bg-paper/97 p-3 shadow-xl backdrop-blur" role="group" aria-label="Map layers">
          <div className="mb-2 flex items-center justify-between">
            <span className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Map layers</span>
            <span className="text-[11px] text-muted">{layers.length} on</span>
          </div>
          <ul className="space-y-0.5">
            {LAYER_DEFS.map((l) => (
              <li key={l.id}>
                <label className="flex cursor-pointer items-start gap-2.5 rounded-md px-1.5 py-1 hover:bg-parchment/70">
                  <input type="checkbox" checked={layers.includes(l.id)} onChange={() => toggleLayer(l.id)} className="mt-0.5 h-4 w-4 accent-[#9a6b34]" />
                  <span>
                    <span className="block text-[13px] text-ink">{l.label}</span>
                    <span className="block text-[11px] leading-tight text-muted">{l.hint}</span>
                  </span>
                </label>
              </li>
            ))}
          </ul>
          <Legend />
        </div>
      )}
      <button onClick={() => setOpen(!open)} aria-expanded={open} className="flex items-center gap-2 rounded-full border border-line bg-paper/97 px-3.5 py-2 text-[13px] text-ink shadow-md hover:border-bronze">
        <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="1.8"><path d="M12 3l9 5-9 5-9-5 9-5zM3 13l9 5 9-5M3 17l9 5 9-5" /></svg>
        Layers & legend
      </button>
    </div>
  )
}

function Legend() {
  return (
    <div className="mt-3 border-t border-line pt-3 text-[11.5px] text-ink-2">
      <div className="mb-1.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Legend</div>
      <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
        <span className="flex items-center gap-2"><span className="h-3 w-4 rounded-sm border border-[#5a4a36]/60 bg-[#c9a46a]/60" />Precise border</span>
        <span className="flex items-center gap-2"><span className="h-3 w-4 rounded-sm border border-dashed border-[#5a4a36]/70" style={{ background: 'repeating-linear-gradient(135deg, rgba(70,55,40,.35) 0 1px, transparent 1px 4px)' }} />Approximate</span>
        <span className="flex items-center gap-2"><span className="h-0 w-4 border-t-2 border-dashed border-[#7f2d26]" />Colonial</span>
        <span className="flex items-center gap-2"><span className="h-0 w-4 border-t border-dashed border-ink" />Modern border</span>
        <span className="flex items-center gap-2"><span className="flex h-3.5 w-3.5 items-center justify-center rounded-full border border-[#7f2d26]"><span className="h-2 w-2 rounded-full bg-[#7f2d26]" /></span>Capital</span>
        <span className="flex items-center gap-2"><span className="h-2.5 w-2.5 rounded-full border-[1.5px] border-[#6b4a2a] bg-paper" />Ancient site</span>
      </div>
      <div className="mt-2 flex flex-wrap gap-x-3 gap-y-1">
        {EVENT_TYPES.map((t) => (
          <span key={t.id} className="flex items-center gap-1.5"><span className="h-2 w-2 rounded-full" style={{ background: t.color }} />{t.label}</span>
        ))}
      </div>
    </div>
  )
}
