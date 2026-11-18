import { useEffect, useMemo, useRef, useState } from 'react'
import { useApp } from '../../store/app'
import { HistoricalMap, SyncGroup } from '../HistoricalMap'
import { formatYear, parseYear, clampYear } from '../../lib/chrono'
import { snapshotFor } from '../../lib/snapshots'
import { loadSnapshot } from '../../lib/dataLoader'
import { compareBoundaries, featuresForEntity, formatArea, entityLabel, inBbox, type BorderComparison, type EntityRef } from '../../lib/geo'
import { CIVILIZATIONS, CIV_BY_ID, civsAt } from '../../data/civilizations'
import { eventsBetween, EVENT_COLOR } from '../../data/events'
import { CITIES } from '../../data/cities'
import { REGIONS } from '../../data/atlas'
import { diffSnapshots, entriesAt, TERRITORY_INDEX, TERRITORY_NAMES } from '../../lib/territoryIndex'
import { runAction } from '../../lib/navigate'
import { Badge, CloseButton, SaveButton } from '../ui'

type Layout = 'side' | 'swipe' | 'diff'

const PRESETS: { label: string; a: number; b: number; region?: string; entity?: EntityRef; mode: 'periods' | 'borders' }[] = [
  { label: 'India · 1700 vs 1950', a: 1700, b: 1950, region: 'india', mode: 'periods' },
  { label: 'Europe · 1914 vs 1945', a: 1914, b: 1945, region: 'europe', mode: 'periods' },
  { label: 'World · 1500 vs 2026', a: 1500, b: 2026, region: 'world', mode: 'periods' },
  { label: 'Roman Empire · 117 vs 476', a: 117, b: 476, entity: { kind: 'civ', id: 'rome' }, mode: 'borders' },
  { label: 'Mughal Empire · 1530 vs 1715', a: 1530, b: 1715, entity: { kind: 'civ', id: 'mughal' }, mode: 'borders' },
  { label: 'Ottoman Empire · 1500 vs 1914', a: 1500, b: 1914, entity: { kind: 'civ', id: 'ottoman' }, mode: 'borders' },
]

function YearField({ value, onChange, label }: { value: number; onChange: (y: number) => void; label: string }) {
  const [text, setText] = useState(formatYear(value))
  useEffect(() => setText(formatYear(value)), [value])
  return (
    <label className="flex items-center gap-2 text-[12px] text-muted">
      {label}
      <input
        value={text}
        onChange={(e) => setText(e.target.value)}
        onBlur={() => { const y = parseYear(text); if (y !== null) onChange(clampYear(y)); else setText(formatYear(value)) }}
        onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
        className="tabular w-[110px] rounded-md border border-line bg-paper px-2 py-1 font-serif text-[16px] text-ink focus:border-bronze focus:outline-none"
      />
    </label>
  )
}

export function CompareView() {
  const { compareYears, setCompare, compareEntity, compareMode, setView, layers, settings, camera } = useApp()
  const [a, b] = compareYears
  const [layout, setLayout] = useState<Layout>(compareMode === 'borders' ? 'diff' : 'side')
  const [region, setRegion] = useState<string>('world')
  const [swipe, setSwipe] = useState(50)
  const [diff, setDiff] = useState<BorderComparison | null>(null)
  const [computing, setComputing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const sync = useMemo(() => new SyncGroup(), [])
  const [fly, setFly] = useState<{ bbox?: [number, number, number, number]; center?: [number, number]; zoom?: number; nonce: number } | null>(null)
  const entity = compareEntity ?? { kind: 'civ', id: 'rome' }
  const civ = entity.kind === 'civ' ? CIV_BY_ID.get(entity.id) : null
  const snapA = snapshotFor(a).snapshot.year
  const snapB = snapshotFor(b).snapshot.year

  useEffect(() => {
    if (compareMode === 'borders' && layout === 'side') return
    setLayout((l) => (compareMode === 'borders' ? (l === 'side' || l === 'swipe' ? l : 'diff') : l === 'diff' ? 'side' : l))
  }, [compareMode]) // eslint-disable-line react-hooks/exhaustive-deps

  // focus camera on entity / region
  useEffect(() => {
    if (compareMode === 'borders' && civ) setFly({ center: civ.center, zoom: civ.zoom, nonce: Date.now() })
    else if (compareMode === 'borders' && entity.kind === 'name') {
      const e = TERRITORY_INDEX[entity.name]?.[0]
      if (e) setFly({ center: [e[1], e[2]], zoom: 4, nonce: Date.now() })
    } else {
      const r = REGIONS.find((x) => x.id === region)
      if (r) setFly({ bbox: r.bbox, nonce: Date.now() })
    }
  }, [compareMode, entity.kind === 'civ' ? entity.id : entity.name, region]) // eslint-disable-line react-hooks/exhaustive-deps

  // border computation
  useEffect(() => {
    if (compareMode !== 'borders') return
    let cancelled = false
    setComputing(true)
    setError(null)
    Promise.all([loadSnapshot(snapshotFor(a).snapshot), loadSnapshot(snapshotFor(b).snapshot)])
      .then(([A, B]) => new Promise<BorderComparison>((res) => setTimeout(() => res(compareBoundaries(featuresForEntity(A.territories, entity), featuresForEntity(B.territories, entity))), 30)))
      .then((r) => { if (!cancelled) { setDiff(r); setComputing(false) } })
      .catch((e: Error) => { if (!cancelled) { setError(e.message); setComputing(false) } })
    return () => { cancelled = true }
  }, [compareMode, snapA, snapB, entity.kind === 'civ' ? entity.id : entity.name]) // eslint-disable-line react-hooks/exhaustive-deps

  const lo = Math.min(a, b)
  const hi = Math.max(a, b)
  const events = useMemo(() => {
    const all = eventsBetween(lo, hi)
    if (compareMode === 'borders' && civ) return all.filter((e) => e.relatedCivs.includes(civ.id))
    const r = REGIONS.find((x) => x.id === region)
    return r && region !== 'world' ? all.filter((e) => inBbox(e.lon, e.lat, r.bbox)) : all
  }, [lo, hi, compareMode, civ, region])

  const summary = useMemo(() => {
    const r = REGIONS.find((x) => x.id === region)!
    const inR = (name: string, y: number) => {
      const e = TERRITORY_INDEX[name]?.find((x) => x[0] === y)
      return e ? region === 'world' || inBbox(e[1], e[2], r.bbox) : false
    }
    const d = diffSnapshots(snapA, snapB)
    const big = (n: string, y: number) => (TERRITORY_INDEX[n]?.find((x) => x[0] === y)?.[4] ?? 0) > 150000
    const appeared = d.appeared.filter((n) => inR(n, snapB) && big(n, snapB))
    const vanished = d.vanished.filter((n) => inR(n, snapA) && big(n, snapA))
    const civA = new Set(civsAt(a).map((c) => c.id))
    const civB = new Set(civsAt(b).map((c) => c.id))
    const ended = [...civA].filter((x) => !civB.has(x)).map((x) => CIV_BY_ID.get(x)!).filter((c) => region === 'world' || inBbox(c.center[0], c.center[1], r.bbox))
    const began = [...civB].filter((x) => !civA.has(x)).map((x) => CIV_BY_ID.get(x)!).filter((c) => region === 'world' || inBbox(c.center[0], c.center[1], r.bbox))
    const cityChanges = CITIES.filter((c) => region === 'world' || inBbox(c.lon, c.lat, r.bbox)).map((c) => {
      const nameAt = (y: number) => (y < c.foundedY ? null : [...c.eras].reverse().find((e) => e.name && e.y <= y)?.name ?? c.name)
      return { c, na: nameAt(a), nb: nameAt(b) }
    }).filter((x) => x.na !== x.nb)
    const countA = entriesAt(snapA).filter((x) => inR(x.name, snapA)).length
    const countB = entriesAt(snapB).filter((x) => inR(x.name, snapB)).length
    return { appeared, vanished, ended, began, cityChanges, countA, countB }
  }, [a, b, snapA, snapB, region])

  const mapLayers = layers.filter((l) => l !== 'events' && l !== 'battles')
  const focusCiv = compareMode === 'borders' && civ ? civ.id : null
  const selName = compareMode === 'borders' && entity.kind === 'name' ? entity.name : null

  return (
    <div className="absolute inset-0 z-20 flex flex-col bg-ivory">
      {/* controls */}
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-b border-line bg-paper px-4 py-2.5">
        <div className="flex rounded-full border border-line p-0.5" role="tablist">
          {(['periods', 'borders'] as const).map((m) => (
            <button key={m} role="tab" aria-selected={compareMode === m} onClick={() => setCompare(a, b, compareEntity, m)} className={`rounded-full px-3 py-1 text-[12.5px] ${compareMode === m ? 'bg-ink text-ivory' : 'text-ink-2'}`}>
              {m === 'periods' ? 'Compare periods' : 'Border change'}
            </button>
          ))}
        </div>
        <YearField label="From" value={a} onChange={(y) => setCompare(y, b)} />
        <YearField label="To" value={b} onChange={(y) => setCompare(a, y)} />
        {compareMode === 'periods' ? (
          <label className="flex items-center gap-2 text-[12px] text-muted">
            Region
            <select value={region} onChange={(e) => setRegion(e.target.value)} className="rounded-md border border-line bg-paper px-2 py-1 text-[13px] text-ink">
              {REGIONS.map((r) => <option key={r.id} value={r.id}>{r.names[0].replace(/\b\w/g, (m) => m.toUpperCase())}</option>)}
            </select>
          </label>
        ) : (
          <EntityPicker value={entity} onChange={(e) => setCompare(a, b, e)} />
        )}
        <div className="flex rounded-full border border-line p-0.5">
          {(compareMode === 'borders' ? (['diff', 'side', 'swipe'] as Layout[]) : (['side', 'swipe'] as Layout[])).map((l) => (
            <button key={l} onClick={() => setLayout(l)} aria-pressed={layout === l} className={`rounded-full px-3 py-1 text-[12.5px] ${layout === l ? 'bg-bronze text-ivory' : 'text-ink-2'}`}>
              {l === 'diff' ? 'Change map' : l === 'side' ? 'Side by side' : 'Swipe'}
            </button>
          ))}
        </div>
        <div className="ml-auto flex items-center gap-2">
          <SaveButton item={{ kind: 'comparison', title: compareMode === 'borders' ? `${entityLabel(entity)}: ${formatYear(a)} vs ${formatYear(b)}` : `${REGIONS.find((r) => r.id === region)?.names[0]}: ${formatYear(a)} vs ${formatYear(b)}`, year: b, ref: `${compareMode}:${a}:${b}:${entityLabel(entity)}:${region}`, compare: { a, b, entity: compareMode === 'borders' ? entity : undefined }, camera }} label="Save comparison" />
          <CloseButton onClick={() => setView('explore')} />
        </div>
      </div>
      <div className="scroll-thin flex gap-1.5 overflow-x-auto border-b border-line bg-paper px-4 py-1.5">
        {PRESETS.map((p) => (
          <button key={p.label} onClick={() => { setCompare(p.a, p.b, p.entity ?? compareEntity, p.mode); if (p.region) setRegion(p.region); setLayout(p.mode === 'borders' ? 'diff' : 'side') }} className="shrink-0 rounded-full border border-line px-2.5 py-0.5 text-[11.5px] text-ink-2 hover:border-bronze">
            {p.label}
          </button>
        ))}
      </div>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        {/* maps */}
        <div className="relative min-h-[320px] flex-1">
          {layout === 'diff' && (
            <>
              <HistoricalMap year={b} layers={mapLayers} diff={diff} markers={false} projection={settings.projection} initialCamera={camera} flyTo={fly} className="absolute inset-0" label={`Border change map ${formatYear(a)} to ${formatYear(b)}`} reduceMotion={settings.reduceMotion} />
              <div className="absolute left-3 top-3 z-10 rounded-lg border border-line bg-paper/95 px-3 py-2 text-[12px] shadow">
                <div className="mb-1 font-medium text-ink">{entityLabel(entity)}: {formatYear(snapA)} → {formatYear(snapB)}</div>
                <div className="flex gap-3">
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-gain" />Added</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-loss" />Lost</span>
                  <span className="flex items-center gap-1.5"><span className="h-3 w-3 rounded-sm bg-keep/70" />Unchanged</span>
                </div>
              </div>
              {computing && <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-line bg-paper px-3 py-1 text-[12px]">Computing territorial change…</div>}
            </>
          )}
          {layout === 'side' && (
            <div className="absolute inset-0 grid grid-cols-1 grid-rows-2 gap-px bg-line md:grid-cols-2 md:grid-rows-1">
              {[a, b].map((y, i) => (
                <div key={i} className="relative">
                  <HistoricalMap year={y} layers={mapLayers} sync={sync} markers={false} focusCiv={focusCiv} selectedName={selName} projection={settings.projection} initialCamera={camera} flyTo={fly} className="absolute inset-0" attribution={i === 1} label={`Map of ${formatYear(y)}`} reduceMotion={settings.reduceMotion} />
                  <YearTag y={y} snap={snapshotFor(y).snapshot.year} side={i === 0 ? 'left' : 'right'} />
                </div>
              ))}
            </div>
          )}
          {layout === 'swipe' && <SwipeMaps a={a} b={b} pos={swipe} setPos={setSwipe} sync={sync} layers={mapLayers} focusCiv={focusCiv} selName={selName} fly={fly} />}
        </div>

        {/* analysis */}
        <aside className="scroll-thin max-h-[45vh] w-full shrink-0 overflow-y-auto border-t border-line bg-paper lg:max-h-none lg:w-[360px] lg:border-l lg:border-t-0">
          <div className="px-5 py-4">
            <p className="text-[11.5px] leading-relaxed text-muted">
              Boundaries come from documented snapshots: {formatYear(a)} uses {formatYear(snapA)}{a !== snapA ? ' (nearest earlier)' : ''}, {formatYear(b)} uses {formatYear(snapB)}{b !== snapB ? ' (nearest earlier)' : ''}.
            </p>
          </div>
          {compareMode === 'borders' ? (
            <div className="border-t border-line px-5 py-4">
              <h3 className="font-serif text-[20px] text-ink">{entityLabel(entity)}</h3>
              {error && <p className="mt-2 text-[12.5px] text-loss">Could not compute: {error}</p>}
              {diff && !computing && (
                <>
                  {diff.areaBefore === 0 && <p className="mt-2 text-[12.5px] text-loss">No boundary for this entity in the {formatYear(snapA)} snapshot.</p>}
                  {diff.areaAfter === 0 && <p className="mt-2 text-[12.5px] text-loss">No boundary for this entity in the {formatYear(snapB)} snapshot.</p>}
                  <dl className="mt-3 grid grid-cols-2 gap-2">
                    <Stat label={`Area ${formatYear(snapA)}`} value={formatArea(diff.areaBefore, settings.units)} />
                    <Stat label={`Area ${formatYear(snapB)}`} value={formatArea(diff.areaAfter, settings.units)} />
                    <Stat label="Area gained" value={formatArea(diff.areaGained, settings.units)} tone="gain" />
                    <Stat label="Area lost" value={formatArea(diff.areaLost, settings.units)} tone="loss" />
                  </dl>
                  <p className="mt-2 text-[11.5px] text-muted">Areas are computed from simplified dataset polygons; treat them as approximate, especially where borders are marked approximate.</p>
                  {civ?.id === 'rome' && <p className="mt-2 text-[11.5px] text-ink-2">From 395 the dataset draws the eastern half as a separate “Eastern Roman Empire”, recorded here under the Byzantine Empire, so it shows as lost from the western Roman Empire.</p>}
                </>
              )}
              {civ && (
                <div className="mt-4">
                  <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Documented milestones in this interval</h4>
                  <ul className="mt-1.5 space-y-1">
                    {civ.timeline.filter((m) => m.y >= lo && m.y <= hi).map((m) => <li key={m.text} className="text-[12.5px] text-ink-2"><span className="tabular text-bronze-2">{formatYear(m.y, { circa: m.circa })}</span> — {m.text}</li>)}
                    {civ.timeline.filter((m) => m.y >= lo && m.y <= hi).length === 0 && <li className="text-[12.5px] italic text-muted">None recorded.</li>}
                  </ul>
                </div>
              )}
            </div>
          ) : (
            <div className="border-t border-line px-5 py-4 text-[13px]">
              <h3 className="font-serif text-[20px] text-ink">What changed</h3>
              <p className="mt-1 text-ink-2">
                {summary.countA} mapped entities in {formatYear(snapA)} → {summary.countB} in {formatYear(snapB)} in this region.
              </p>
              <ChangeList title="Large entities that disappear" items={summary.vanished} tone="warn" />
              <ChangeList title="Large entities that appear" items={summary.appeared} tone="ok" />
              <div className="mt-3">
                <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Curated civilizations</h4>
                <p className="mt-1 text-[12.5px] text-ink-2">
                  {summary.ended.length ? <>Ended: {summary.ended.map((c) => c.name).join(', ')}. </> : null}
                  {summary.began.length ? <>Began: {summary.began.map((c) => c.name).join(', ')}.</> : null}
                  {!summary.ended.length && !summary.began.length && 'No change among curated records.'}
                </p>
              </div>
              {summary.cityChanges.length > 0 && (
                <div className="mt-3">
                  <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">City changes</h4>
                  <ul className="mt-1 space-y-0.5">
                    {summary.cityChanges.map(({ c, na, nb }) => <li key={c.id} className="text-[12.5px] text-ink-2">{na ?? 'not founded'} → <b className="font-medium text-ink">{nb ?? 'not founded'}</b></li>)}
                  </ul>
                </div>
              )}
            </div>
          )}
          <div className="border-t border-line px-5 py-4">
            <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{compareMode === 'borders' ? 'Wars, treaties & events behind the change' : 'Events in between'}</h4>
            <ul className="mt-1.5">
              {events.slice(0, 25).map((e) => (
                <li key={e.id}>
                  <button onClick={() => { runAction({ type: 'event', id: e.id }) }} className="flex w-full items-start gap-2 rounded-md py-1 text-left hover:bg-parchment/60">
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />
                    <span className="text-[12.5px] text-ink">{e.title} <span className="tabular text-muted">· {formatYear(e.y, { circa: e.circa })}</span>{e.mapChange && <span className="block text-[11.5px] text-muted">{e.mapChange}</span>}</span>
                  </button>
                </li>
              ))}
              {events.length === 0 && <li className="text-[12.5px] italic text-muted">No curated events recorded for this interval{compareMode === 'borders' ? ' and entity' : ''}.</li>}
            </ul>
          </div>
        </aside>
      </div>
    </div>
  )
}

function YearTag({ y, snap, side }: { y: number; snap: number; side: 'left' | 'right' }) {
  return (
    <div className={`pointer-events-none absolute top-3 z-10 rounded-lg border border-line bg-paper/95 px-3 py-1.5 shadow ${side === 'left' ? 'left-14' : 'right-3'}`}>
      <div className="font-serif text-[20px] leading-none text-ink">{formatYear(y)}</div>
      {snap !== y && <div className="mt-0.5 text-[10.5px] text-muted">borders: {formatYear(snap)}</div>}
    </div>
  )
}

function Stat({ label, value, tone }: { label: string; value: string; tone?: 'gain' | 'loss' }) {
  return (
    <div className="rounded-lg border border-line bg-ivory/60 px-3 py-2">
      <dt className="text-[11px] text-muted">{label}</dt>
      <dd className={`text-[14px] font-medium tabular ${tone === 'gain' ? 'text-gain' : tone === 'loss' ? 'text-loss' : 'text-ink'}`}>{value}</dd>
    </div>
  )
}

function ChangeList({ title, items, tone }: { title: string; items: string[]; tone: 'ok' | 'warn' }) {
  return (
    <div className="mt-3">
      <h4 className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">{title} <span className="font-normal normal-case tracking-normal">({items.length})</span></h4>
      <div className="mt-1 flex flex-wrap gap-1">
        {items.slice(0, 18).map((n) => <Badge key={n} tone={tone}>{n}</Badge>)}
        {items.length === 0 && <span className="text-[12.5px] italic text-muted">None</span>}
        {items.length > 18 && <span className="text-[11.5px] text-muted">+{items.length - 18} more</span>}
      </div>
    </div>
  )
}

function EntityPicker({ value, onChange }: { value: EntityRef; onChange: (e: EntityRef) => void }) {
  const [text, setText] = useState(value.kind === 'name' ? value.name : '')
  const civs = CIVILIZATIONS.filter((c) => c.matchNames.length || c.matchSubjects?.length)
  return (
    <div className="flex items-center gap-2 text-[12px] text-muted">
      Entity
      <select
        value={value.kind === 'civ' ? value.id : '__name'}
        onChange={(e) => e.target.value !== '__name' && onChange({ kind: 'civ', id: e.target.value })}
        className="max-w-[200px] rounded-md border border-line bg-paper px-2 py-1 text-[13px] text-ink"
      >
        {civs.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
        <option value="__name">Other dataset name…</option>
      </select>
      <input
        list="territory-names"
        value={text}
        placeholder="or type any territory"
        onChange={(e) => setText(e.target.value)}
        onKeyDown={(e) => e.key === 'Enter' && TERRITORY_INDEX[text] && onChange({ kind: 'name', name: text })}
        onBlur={() => TERRITORY_INDEX[text] && onChange({ kind: 'name', name: text })}
        className="w-[170px] rounded-md border border-line bg-paper px-2 py-1 text-[13px] text-ink"
        aria-label="Territory name from the dataset"
      />
      <datalist id="territory-names">
        {TERRITORY_NAMES.filter((n) => (TERRITORY_INDEX[n]?.length ?? 0) > 1).slice(0, 2000).map((n) => <option key={n} value={n} />)}
      </datalist>
    </div>
  )
}

function SwipeMaps({ a, b, pos, setPos, sync, layers, focusCiv, selName, fly }: {
  a: number; b: number; pos: number; setPos: (n: number) => void; sync: SyncGroup; layers: ReturnType<typeof useApp.getState>['layers']; focusCiv: string | null; selName: string | null
  fly: { bbox?: [number, number, number, number]; center?: [number, number]; zoom?: number; nonce: number } | null
}) {
  const box = useRef<HTMLDivElement>(null)
  const { settings, camera } = useApp()
  const [drag, setDrag] = useState(false)
  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => {
      const r = box.current!.getBoundingClientRect()
      setPos(Math.max(2, Math.min(98, ((e.clientX - r.left) / r.width) * 100)))
    }
    const up = () => setDrag(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => { window.removeEventListener('pointermove', move); window.removeEventListener('pointerup', up) }
  }, [drag, setPos])
  return (
    <div ref={box} className="absolute inset-0">
      <HistoricalMap year={b} layers={layers} sync={sync} markers={false} focusCiv={focusCiv} selectedName={selName} projection={settings.projection} initialCamera={camera} flyTo={fly} className="absolute inset-0" label={`Map of ${formatYear(b)}`} reduceMotion={settings.reduceMotion} />
      <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - pos}% 0 0)` }}>
        <HistoricalMap year={a} layers={layers} sync={sync} markers={false} focusCiv={focusCiv} selectedName={selName} projection={settings.projection} initialCamera={camera} flyTo={fly} className="absolute inset-0" attribution={false} label={`Map of ${formatYear(a)}`} reduceMotion={settings.reduceMotion} />
      </div>
      <div className="absolute bottom-0 top-0 z-10 w-[3px] -translate-x-1/2 bg-paper shadow" style={{ left: `${pos}%` }}>
        <button
          onPointerDown={() => setDrag(true)}
          onKeyDown={(e) => { if (e.key === 'ArrowLeft') setPos(Math.max(2, pos - 5)); if (e.key === 'ArrowRight') setPos(Math.min(98, pos + 5)) }}
          aria-label="Drag to compare"
          role="slider"
          aria-valuenow={Math.round(pos)}
          aria-valuemin={0}
          aria-valuemax={100}
          className="absolute top-1/2 left-1/2 flex h-10 w-10 -translate-x-1/2 -translate-y-1/2 cursor-ew-resize touch-none items-center justify-center rounded-full border border-line bg-paper text-ink shadow-lg"
        >
          <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M9 6l-6 6 6 6M15 6l6 6-6 6" /></svg>
        </button>
      </div>
      <YearTag y={a} snap={snapshotFor(a).snapshot.year} side="left" />
      <YearTag y={b} snap={snapshotFor(b).snapshot.year} side="right" />
    </div>
  )
}

