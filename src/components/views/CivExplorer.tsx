import { useEffect, useMemo, useState } from 'react'
import { useApp } from '../../store/app'
import { CIV_BY_ID, CIV_TYPE_LABEL } from '../../data/civilizations'
import { EVENTS, EVENT_COLOR } from '../../data/events'
import { civAreaSeries } from '../../lib/territoryIndex'
import { formatYear, clampYear } from '../../lib/chrono'
import { formatArea } from '../../lib/geo'
import { HistoricalMap } from '../HistoricalMap'
import { AreaChart } from '../AreaChart'
import { CloseButton, GhostButton, PrimaryButton, Badge, Sources } from '../ui'
import { runAction } from '../../lib/navigate'

/** Dedicated exploration view: step through a civilization's documented snapshots. */
export function CivExplorer({ id }: { id: string }) {
  const { setExplorerCiv, settings } = useApp()
  const c = CIV_BY_ID.get(id)!
  const series = useMemo(() => civAreaSeries(id), [id])
  const stops = useMemo(() => {
    const ys = new Set<number>(series.map((s) => s.year))
    for (const m of c.timeline) ys.add(clampYear(m.y))
    return [...ys].filter((y) => y >= Math.max(c.start, -2999) && y <= c.end).sort((a, b) => a - b)
  }, [series, c])
  const [idx, setIdx] = useState(0)
  const [playing, setPlaying] = useState(false)
  const y = stops[idx] ?? clampYear(c.focusYear)
  const milestone = c.timeline.find((m) => clampYear(m.y) === y)
  const ruler = c.rulers.find((r) => y >= r.reignStart && y <= r.reignEnd)
  const capital = c.capitals.find((k) => y >= k.from && y <= k.to)
  const area = series.find((s) => s.year === y)?.area
  const events = EVENTS.filter((e) => e.relatedCivs.includes(id))

  useEffect(() => {
    if (!playing) return
    const t = setInterval(() => setIdx((i) => (i + 1 >= stops.length ? (setPlaying(false), i) : i + 1)), 2600 / Math.max(0.5, useApp.getState().speed))
    return () => clearInterval(t)
  }, [playing, stops.length])

  return (
    <div className="fixed inset-0 z-40 flex flex-col bg-ivory" role="dialog" aria-label={`Explore ${c.name}`}>
      <div className="flex items-center gap-3 border-b border-line bg-paper px-4 py-2.5">
        <span className="h-3.5 w-3.5 rounded-sm" style={{ background: c.color }} />
        <div className="min-w-0">
          <h1 className="truncate font-serif text-[22px] leading-tight text-ink">{c.name}</h1>
          <div className="text-[12px] text-muted">{CIV_TYPE_LABEL[c.type]} · {formatYear(c.start, { circa: c.circa })} – {c.end >= 2026 ? 'present' : formatYear(c.end)}</div>
        </div>
        <div className="ml-auto flex items-center gap-2">
          <GhostButton onClick={() => { setExplorerCiv(null); runAction({ type: 'civ', id, year: y }) }}>Open in main map</GhostButton>
          <CloseButton onClick={() => setExplorerCiv(null)} />
        </div>
      </div>
      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <div className="relative min-h-[300px] flex-1">
          <HistoricalMap year={y} layers={['political', 'capitals', 'uncertainty', 'routes']} focusCiv={id} markers projection={settings.projection} initialCamera={{ center: c.center, zoom: c.zoom }} className="absolute inset-0" label={`${c.name} in ${formatYear(y)}`} reduceMotion={settings.reduceMotion} />
          <div className="absolute left-14 top-3 z-10 max-w-[70%] rounded-lg border border-line bg-paper/95 px-3.5 py-2 shadow">
            <div className="font-serif text-[24px] leading-none text-ink">{formatYear(y)}</div>
            {milestone && <div className="mt-1 text-[12.5px] text-ink-2">{milestone.text}</div>}
            {!series.some((s) => s.year === y) && <div className="mt-1 text-[11px] text-muted">No boundary drawn for this entity in the snapshot shown.</div>}
          </div>
          <div className="absolute inset-x-3 bottom-3 z-10 rounded-xl border border-line bg-paper/97 p-3 shadow-lg">
            <div className="flex items-center gap-2">
              <button onClick={() => setIdx(Math.max(0, idx - 1))} aria-label="Previous stop" className="h-8 w-8 rounded-full hover:bg-parchment">‹</button>
              <button onClick={() => { if (idx >= stops.length - 1) setIdx(0); setPlaying(!playing) }} aria-label={playing ? 'Pause' : 'Play'} className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">{playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5l11 7-11 7z" />}</svg>
              </button>
              <button onClick={() => setIdx(Math.min(stops.length - 1, idx + 1))} aria-label="Next stop" className="h-8 w-8 rounded-full hover:bg-parchment">›</button>
              <div className="scroll-thin flex flex-1 gap-1 overflow-x-auto">
                {stops.map((s, i) => (
                  <button key={s} onClick={() => setIdx(i)} className={`shrink-0 rounded-full border px-2 py-0.5 text-[11px] tabular ${i === idx ? 'border-ink bg-ink text-ivory' : series.some((d) => d.year === s) ? 'border-bronze/50 text-ink' : 'border-line text-muted'}`}>
                    {formatYear(s)}
                  </button>
                ))}
              </div>
            </div>
            <p className="mt-1.5 text-[11px] text-muted">Bronze stops have boundary polygons; grey stops are documented milestones shown on the nearest earlier snapshot.</p>
          </div>
        </div>
        <aside className="scroll-thin max-h-[45vh] w-full shrink-0 overflow-y-auto border-t border-line bg-paper px-5 py-4 lg:max-h-none lg:w-[380px] lg:border-l lg:border-t-0">
          <div className="flex flex-wrap gap-1.5">{c.alternateNames.map((n) => <Badge key={n}>{n}</Badge>)}</div>
          <p className="mt-3 text-[13.5px] leading-relaxed text-ink-2">{c.description}</p>
          <dl className="mt-4 space-y-1 text-[13px]">
            <div className="flex justify-between gap-3"><dt className="text-muted">Capital in {formatYear(y)}</dt><dd className="text-right text-ink">{capital?.name ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Ruler</dt><dd className="text-right text-ink">{ruler?.name ?? '—'}</dd></div>
            <div className="flex justify-between gap-3"><dt className="text-muted">Mapped area</dt><dd className="text-right text-ink">{area ? formatArea(area, settings.units) : '—'}</dd></div>
          </dl>
          <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Rise and decline</h3>
          <div className="mt-2"><AreaChart series={series} start={Math.max(c.start, -2999)} end={Math.min(c.end, 2026)} current={y} color={c.color} units={settings.units} onPick={(yy) => setIdx(Math.max(0, stops.indexOf(yy)))} /></div>
          {c.capitals.length > 0 && (
            <>
              <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Capitals</h3>
              <ul className="mt-1.5 space-y-1">{c.capitals.map((k) => <li key={k.name + k.from} className="text-[13px] text-ink">{k.name} <span className="tabular text-muted">· {formatYear(k.from)}–{formatYear(k.to)}</span></li>)}</ul>
            </>
          )}
          {c.rulers.length > 0 && (
            <>
              <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Rulers</h3>
              <ul className="mt-1.5 space-y-1">{c.rulers.map((r) => <li key={r.name} className={`rounded px-1.5 text-[13px] ${ruler?.name === r.name ? 'bg-bronze-soft' : ''}`}>{r.name} <span className="tabular text-muted">· {formatYear(r.reignStart, { circa: r.circa })}–{formatYear(r.reignEnd)}</span></li>)}</ul>
            </>
          )}
          {events.length > 0 && (
            <>
              <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Events</h3>
              <ul className="mt-1.5 space-y-1">
                {events.map((e) => (
                  <li key={e.id}>
                    <button onClick={() => { setExplorerCiv(null); runAction({ type: 'event', id: e.id }) }} className="flex items-start gap-2 text-left text-[13px] text-ink hover:underline">
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />{e.title} <span className="tabular text-muted">· {formatYear(e.y, { circa: e.circa })}</span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
          <h3 className="mt-5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Sources</h3>
          <div className="mt-1.5"><Sources items={c.sources} /></div>
          <div className="mt-5 pb-4"><PrimaryButton onClick={() => { setExplorerCiv(null); runAction({ type: 'borders', entity: { kind: 'civ', id }, a: series[0]?.year ?? c.start, b: series[series.length - 1]?.year ?? c.end }) }}>Compare its borders</PrimaryButton></div>
        </aside>
      </div>
    </div>
  )
}
