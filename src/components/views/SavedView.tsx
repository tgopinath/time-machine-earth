import { useState } from 'react'
import { useApp, type SavedItem } from '../../store/app'
import { formatYear } from '../../lib/chrono'
import { runAction } from '../../lib/navigate'
import { CloseButton, GhostButton, PrimaryButton, Badge } from '../ui'

const KIND: Record<SavedItem['kind'], string> = { view: 'Map view', year: 'Year', civ: 'Civilization', city: 'City', event: 'Event', comparison: 'Comparison' }

export function reopen(item: SavedItem) {
  const s = useApp.getState()
  if (item.layers) s.setLayers(item.layers)
  if (item.kind === 'comparison' && item.compare) {
    s.setCompare(item.compare.a, item.compare.b, item.compare.entity ?? null, item.compare.entity ? 'borders' : 'periods')
    s.setView('compare')
    return
  }
  if (item.kind === 'civ' && item.ref) runAction({ type: 'civ', id: item.ref, year: item.year })
  else if (item.kind === 'city' && item.ref) runAction({ type: 'city', id: item.ref })
  else if (item.kind === 'event' && item.ref) runAction({ type: 'event', id: item.ref })
  else {
    s.setView('explore')
    s.select({ kind: 'overview' })
  }
  s.setYear(item.year)
  if (item.camera) s.fly({ center: item.camera.center, zoom: item.camera.zoom })
}

export function SavedView() {
  const { saved, unsave, renameSaved, setView, save, year, camera, layers } = useApp()
  const [editing, setEditing] = useState<string | null>(null)
  const [filter, setFilter] = useState<SavedItem['kind'] | 'all'>('all')
  const list = saved.filter((s) => filter === 'all' || s.kind === filter)
  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ivory">
      <div className="scroll-thin h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">Saved places</div>
              <h1 className="mt-1 font-serif text-[34px] leading-tight text-ink">Your collection</h1>
              <p className="mt-1 text-[13.5px] text-ink-2">Saved on this device. Reopening restores the year, map position, zoom and layers.</p>
            </div>
            <CloseButton onClick={() => setView('explore')} />
          </div>
          <div className="mt-4 flex flex-wrap items-center gap-2">
            <PrimaryButton onClick={() => save({ kind: 'view', title: `Map view · ${formatYear(year)}`, year, camera, layers })}>Save current map view</PrimaryButton>
            <div className="ml-auto flex flex-wrap gap-1">
              {(['all', 'view', 'year', 'civ', 'city', 'event', 'comparison'] as const).map((k) => (
                <GhostButton key={k} active={filter === k} onClick={() => setFilter(k)}>{k === 'all' ? 'All' : KIND[k]}</GhostButton>
              ))}
            </div>
          </div>
          {list.length === 0 ? (
            <div className="mt-8 rounded-xl border border-dashed border-line p-10 text-center">
              <p className="font-serif text-[20px] text-ink">Nothing saved yet</p>
              <p className="mt-1 text-[13.5px] text-muted">Use the Save buttons on years, civilizations, cities, events and comparisons.</p>
            </div>
          ) : (
            <ul className="mt-5 grid gap-3 sm:grid-cols-2">
              {list.map((s) => (
                <li key={s.id} className="rounded-xl border border-line bg-paper p-4">
                  <div className="flex items-start justify-between gap-2">
                    <Badge tone="bronze">{KIND[s.kind]}</Badge>
                    <span className="text-[11px] text-muted">{new Date(s.createdAt).toLocaleDateString()}</span>
                  </div>
                  {editing === s.id ? (
                    <input autoFocus defaultValue={s.title} onBlur={(e) => { renameSaved(s.id, e.target.value || s.title); setEditing(null) }} onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()} className="mt-2 w-full rounded-md border border-bronze bg-ivory px-2 py-1 font-serif text-[18px]" aria-label="Rename" />
                  ) : (
                    <h3 className="mt-2 font-serif text-[18px] text-ink">{s.title}</h3>
                  )}
                  <p className="text-[12px] tabular text-muted">
                    {formatYear(s.year)}{s.camera ? ` · zoom ${s.camera.zoom.toFixed(1)}` : ''}{s.layers ? ` · ${s.layers.length} layers` : ''}
                    {s.compare ? ` · ${formatYear(s.compare.a)} vs ${formatYear(s.compare.b)}` : ''}
                  </p>
                  <div className="mt-3 flex gap-2">
                    <PrimaryButton onClick={() => reopen(s)}>Open</PrimaryButton>
                    <GhostButton onClick={() => setEditing(s.id)}>Rename</GhostButton>
                    <GhostButton onClick={() => unsave(s.id)}>Remove</GhostButton>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  )
}
