import { useMemo } from 'react'
import { useApp } from '../store/app'
import { CIV_BY_ID, civsAt, civForFeature, CIV_TYPE_LABEL } from '../data/civilizations'
import { EVENT_BY_ID, EVENT_TYPES, EVENT_COLOR, EVENTS } from '../data/events'
import { CITY_BY_ID } from '../data/cities'
import { COUNTRY_BY_ID, KIND_LABEL } from '../data/countries'
import { REGIONS, SITES, dataNoteFor } from '../data/atlas'
import { DATASETS, wp } from '../data/sources'
import { formatYear, eraName, clampYear } from '../lib/chrono'
import { snapshotFor } from '../lib/snapshots'
import { entriesAt, indexEntry, civAreaSeries, nameAreaSeries, TERRITORY_INDEX } from '../lib/territoryIndex'
import { classifyTerritory } from '../lib/classify'
import { formatArea, inBbox } from '../lib/geo'
import { PRECISION_LABEL } from '../lib/colors'
import { runAction } from '../lib/navigate'
import { eventWindow } from './HistoricalMap'
import { AreaChart } from './AreaChart'
import { Badge, CloseButton, KV, Missing, PrimaryButton, SaveButton, Section, Sources, GhostButton } from './ui'

export function InfoPanel() {
  const { selection, history, back, select, setPanelOpen } = useApp()
  return (
    <aside aria-label="Information panel" className="flex h-full flex-col bg-paper">
      <div className="flex h-11 shrink-0 items-center justify-between border-b border-line px-3">
        <div className="flex items-center gap-1">
          {history.length > 0 && selection.kind !== 'overview' ? (
            <button onClick={back} className="flex items-center gap-1 rounded-full px-2 py-1 text-[12.5px] text-ink-2 hover:bg-parchment" aria-label="Back">
              <svg viewBox="0 0 24 24" className="h-4 w-4" fill="none" stroke="currentColor" strokeWidth="2"><path d="M15 6l-6 6 6 6" /></svg>
              Back
            </button>
          ) : (
            <span className="px-2 text-[12px] font-medium uppercase tracking-[0.12em] text-muted">This moment</span>
          )}
          {selection.kind !== 'overview' && (
            <button onClick={() => select({ kind: 'overview' })} className="rounded-full px-2 py-1 text-[12.5px] text-ink-2 hover:bg-parchment">
              Overview
            </button>
          )}
        </div>
        <CloseButton onClick={() => setPanelOpen(false)} label="Close panel" />
      </div>
      <div className="scroll-thin min-h-0 flex-1 overflow-y-auto">
        {selection.kind === 'overview' && <YearOverview />}
        {selection.kind === 'territory' && <TerritoryPanel name={selection.name} snapYear={selection.year} />}
        {selection.kind === 'civ' && <CivPanel id={selection.id} />}
        {selection.kind === 'event' && <EventPanel id={selection.id} />}
        {selection.kind === 'city' && <CityPanel id={selection.id} />}
        {selection.kind === 'country' && <CountryPanel id={selection.id} />}
        {selection.kind === 'region' && <RegionPanel id={selection.regionId} />}
        {selection.kind === 'site' && <SitePanel id={selection.id} />}
      </div>
    </aside>
  )
}

function Header({ eyebrow, title, sub, badges }: { eyebrow: string; title: string; sub?: string; badges?: React.ReactNode }) {
  return (
    <header className="px-5 pb-3 pt-4">
      <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">{eyebrow}</div>
      <h2 className="mt-1 font-serif text-[26px] leading-[1.1] text-ink">{title}</h2>
      {sub && <p className="mt-1 text-[13px] text-ink-2">{sub}</p>}
      {badges && <div className="mt-2 flex flex-wrap gap-1.5">{badges}</div>}
    </header>
  )
}

// ------------------------------------------------------------------ overview
function YearOverview() {
  const { year, select, fly } = useApp()
  const snap = snapshotFor(year)
  const civs = useMemo(() => civsAt(year), [year])
  const w = eventWindow(year)
  const events = useMemo(() => EVENTS.filter((e) => e.y - w <= year && (e.yEnd ?? e.y) + w >= year).sort((a, b) => Math.abs(a.y - year) - Math.abs(b.y - year)).slice(0, 8), [year, w])
  const entries = useMemo(() => entriesAt(snap.snapshot.year), [snap.snapshot.year])
  const precise = entries.filter((x) => x.e[3] >= 2).length
  return (
    <div>
      <Header eyebrow={eraName(year)} title={formatYear(year)} sub={`Map shows the ${formatYear(snap.snapshot.year)} boundary snapshot${snap.gap ? `, the latest documented before ${formatYear(year)}` : ''}.`} badges={<SaveButton item={{ kind: 'year', title: `World in ${formatYear(year)}`, year, ref: String(year), camera: useApp.getState().camera, layers: useApp.getState().layers }} label="Save year" />} />
      {year > 2010 && (
        <div className="mx-5 mb-3 rounded-md border border-line bg-parchment/50 px-3 py-2 text-[12px] text-ink-2">
          The newest historical snapshot is 2010. Turn on <b>Modern boundaries</b> in Layers to overlay current Natural Earth borders (e.g. South Sudan, 2011).
        </div>
      )}
      <Section title={`Documented civilizations in ${formatYear(year)}`} aside={<span className="text-[11px] text-muted">{civs.length}</span>}>
        {civs.length === 0 ? (
          <Missing>No curated civilization records for this year. Click any territory for its dataset record.</Missing>
        ) : (
          <ul className="-mx-2">
            {civs.map((c) => (
              <li key={c.id}>
                <button onClick={() => { select({ kind: 'civ', id: c.id }); fly({ center: c.center, zoom: c.zoom }) }} className="flex w-full items-center gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-parchment/70">
                  <span className="h-2.5 w-2.5 shrink-0 rounded-sm" style={{ background: c.color }} />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate text-[13.5px] text-ink">{c.name}</span>
                    <span className="block text-[11.5px] text-muted">{CIV_TYPE_LABEL[c.type]} · {formatYear(c.start, { circa: c.circa })} – {c.end >= 2026 ? 'present' : formatYear(c.end)}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Events around this time" aside={<span className="text-[11px] text-muted">±{w} yrs</span>}>
        {events.length === 0 ? (
          <Missing>No curated events within {w} years.</Missing>
        ) : (
          <ul className="-mx-2">
            {events.map((e) => (
              <li key={e.id}>
                <button onClick={() => runAction({ type: 'event', id: e.id })} className="flex w-full items-start gap-2.5 rounded-md px-2 py-1.5 text-left hover:bg-parchment/70">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />
                  <span>
                    <span className="block text-[13px] text-ink">{e.title}</span>
                    <span className="block text-[11.5px] text-muted">{formatYear(e.y, { circa: e.circa })} · {e.place}</span>
                  </span>
                </button>
              </li>
            ))}
          </ul>
        )}
      </Section>
      <Section title="Boundary data for this snapshot">
        <dl>
          <KV k="Snapshot">{formatYear(snap.snapshot.year)}</KV>
          <KV k="Entities">{entries.length.toLocaleString()} named territories</KV>
          <KV k="Precision">{precise} moderately or precisely bounded · {entries.length - precise} approximate</KV>
        </dl>
        <p className="mt-2 text-[12px] leading-relaxed text-muted">Hatched areas with dashed borders are approximate. Borders are never interpolated between snapshots.</p>
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ territory
function TerritoryPanel({ name, snapYear }: { name: string; snapYear: number }) {
  const { year, settings, select, fly } = useApp()
  const e = indexEntry(name, snapYear)
  const subj = e?.[5] ?? null
  const civ = civForFeature(name, subj, snapYear)
  const kind = classifyTerritory(name, subj, snapYear)
  const note = dataNoteFor(name, snapYear)
  const series = nameAreaSeries(name)
  const allYears = TERRITORY_INDEX[name]?.map((x) => x[0]) ?? []
  return (
    <div>
      <Header
        eyebrow={kind.label}
        title={name}
        sub={`As drawn in the ${formatYear(snapYear)} boundary snapshot${snapYear !== year ? ` (viewing ${formatYear(year)})` : ''}`}
        badges={
          <>
            {e && <Badge tone={e[3] >= 3 ? 'ok' : e[3] === 2 ? 'navy' : 'bronze'}>{PRECISION_LABEL[e[3]] ?? 'Unknown precision'}</Badge>}
            {subj && <Badge tone="warn">Subject to {subj}</Badge>}
          </>
        }
      />
      {note && (
        <div className="mx-5 mb-3 rounded-md border border-loss/30 bg-loss/5 px-3 py-2 text-[12.5px] leading-relaxed text-ink-2">
          <b className="text-loss">Data conflict.</b> {note}
        </div>
      )}
      {civ ? (
        <Section title="Curated record">
          <button onClick={() => select({ kind: 'civ', id: civ.id })} className="w-full rounded-lg border border-line bg-ivory/60 p-3 text-left transition hover:border-bronze">
            <div className="flex items-center gap-2">
              <span className="h-3 w-3 rounded-sm" style={{ background: civ.color }} />
              <span className="font-serif text-[17px] text-ink">{civ.name}</span>
            </div>
            <p className="mt-1 line-clamp-3 text-[12.5px] leading-relaxed text-ink-2">{civ.description}</p>
            <span className="mt-2 inline-block text-[12px] font-medium text-bronze-2">Open details →</span>
          </button>
        </Section>
      ) : (
        <Section title="Curated record">
          <p className="text-[12.5px] leading-relaxed text-muted">
            This entity has no curated record yet, so only the dataset's attributes are shown. No ruler, capital or population is invented for it.
          </p>
          <a className="mt-2 inline-block text-[12.5px] text-navy-2 underline" href={`https://en.wikipedia.org/w/index.php?search=${encodeURIComponent(name)}`} target="_blank" rel="noreferrer">
            Look it up on Wikipedia
          </a>
        </Section>
      )}
      <Section title="Mapped extent">
        <dl>
          <KV k="Area (mapped)">{e ? formatArea(e[4], settings.units) : <Missing />}</KV>
          <KV k="In snapshots">{allYears.length ? `${formatYear(allYears[0])} – ${formatYear(allYears[allYears.length - 1])} (${allYears.length})` : <Missing />}</KV>
        </dl>
        {series.length > 1 && (
          <div className="mt-2">
            <AreaChart series={series} start={series[0].year} end={series[series.length - 1].year} current={snapYear} units={settings.units} onPick={(y) => useApp.getState().setYear(y)} color={civ?.color ?? '#9a6b34'} />
          </div>
        )}
        {e && (
          <div className="mt-3 flex gap-2">
            <GhostButton onClick={() => fly({ center: [e[1], e[2]], zoom: 4.5 })}>Zoom to</GhostButton>
            {allYears.length > 1 && (
              <GhostButton onClick={() => runAction({ type: 'borders', entity: civ ? { kind: 'civ', id: civ.id } : { kind: 'name', name }, a: allYears[0], b: allYears[allYears.length - 1] })}>
                Compare borders
              </GhostButton>
            )}
          </div>
        )}
      </Section>
      <Section title="Sources">
        <Sources items={[{ label: `${DATASETS[0].label} — world_${snapYear <= 0 ? 'bc' + (1 - snapYear) : snapYear}.geojson`, url: DATASETS[0].url }, ...(civ?.sources ?? [])]} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ civilization
function CivPanel({ id }: { id: string }) {
  const { year, setYear, settings, setExplorerCiv, fly } = useApp()
  const c = CIV_BY_ID.get(id)
  const series = useMemo(() => civAreaSeries(id), [id])
  if (!c) return <Missing>Unknown civilization.</Missing>
  const exists = year >= c.start && year <= c.end
  const ref = exists ? year : Math.min(Math.max(year, c.start), c.end)
  const capital = c.capitals.find((k) => ref >= k.from && ref <= k.to)
  const ruler = c.rulers.find((r) => ref >= r.reignStart && ref <= r.reignEnd)
  const snapY = snapshotFor(year).snapshot.year
  const areaNow = series.find((d) => d.year === snapY)?.area
  const related = EVENTS.filter((e) => e.relatedCivs.includes(c.id)).sort((a, b) => a.y - b.y)
  return (
    <div>
      <Header
        eyebrow={`${CIV_TYPE_LABEL[c.type]} · ${c.region}`}
        title={c.name}
        sub={`${formatYear(c.start, { circa: c.circa })} – ${c.end >= 2026 ? 'present' : formatYear(c.end)}`}
        badges={
          <>
            {exists ? <Badge tone="ok">Exists in {formatYear(year)}</Badge> : <Badge tone="warn">Did not exist in {formatYear(year)}</Badge>}
            {c.alternateNames.slice(0, 2).map((n) => <Badge key={n}>{n}</Badge>)}
          </>
        }
      />
      <div className="flex flex-wrap gap-2 px-5 pb-4">
        <PrimaryButton onClick={() => setExplorerCiv(c.id)}>Explore This Civilization</PrimaryButton>
        {!exists && <GhostButton onClick={() => { setYear(clampYear(c.focusYear)); fly({ center: c.center, zoom: c.zoom }) }}>Go to {formatYear(c.focusYear)}</GhostButton>}
        <SaveButton item={{ kind: 'civ', title: c.name, year: clampYear(c.focusYear), ref: c.id, camera: { center: c.center, zoom: c.zoom } }} />
      </div>
      <Section title="Overview">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{c.description}</p>
      </Section>
      <Section title={exists ? `In ${formatYear(year)}` : `Key facts (as of ${formatYear(ref)})`}>
        <dl>
          <KV k="Capital">{capital ? capital.name : c.capitals.length ? <Missing>No capital recorded for this year</Missing> : <Missing>No documented capital</Missing>}</KV>
          <KV k="Ruler">{ruler ? `${ruler.name}${ruler.note ? ` — ${ruler.note}` : ''}` : <Missing>{c.rulers.length ? 'No ruler in the curated list for this year' : 'Rulers not documented'}</Missing>}</KV>
          <KV k="Coverage">{c.region}</KV>
          <KV k="Mapped area">{areaNow ? `${formatArea(areaNow, settings.units)} (${formatYear(snapY)})` : <Missing>{exists ? 'No polygon in this snapshot' : '—'}</Missing>}</KV>
          <KV k="Population">{c.facts?.length ? c.facts.join(' ') : <Missing />}</KV>
          <KV k="Major cities">{c.majorCities.length ? c.majorCities.join(', ') : <Missing>None recorded</Missing>}</KV>
          <KV k="Languages">{c.languages.join('; ')}</KV>
          <KV k="Religion">{c.religions.join('; ')}</KV>
        </dl>
      </Section>
      <Section title="Rise and decline">
        <AreaChart series={series} start={c.start} end={Math.min(c.end, 2026)} current={year} color={c.color} units={settings.units} onPick={(y) => setYear(y)} />
      </Section>
      <Section title="Timeline">
        <ol className="relative ml-1 border-l border-line pl-4">
          {c.timeline.map((m) => (
            <li key={m.y + m.text} className="mb-2.5">
              <span className="absolute -left-[4.5px] mt-1.5 h-2 w-2 rounded-full border border-paper" style={{ background: c.color }} />
              <button onClick={() => setYear(clampYear(m.y))} className="text-left">
                <span className="block text-[11.5px] font-medium tabular text-bronze-2">{formatYear(m.y, { circa: m.circa })}</span>
                <span className="block text-[13px] text-ink hover:underline">{m.text}</span>
              </button>
            </li>
          ))}
        </ol>
      </Section>
      {c.rulers.length > 0 && (
        <Section title="Notable rulers">
          <ul className="space-y-1.5">
            {c.rulers.map((r) => (
              <li key={r.name}>
                <button onClick={() => setYear(clampYear(r.reignStart))} className={`w-full rounded-md px-2 py-1 text-left hover:bg-parchment/70 ${ruler?.name === r.name ? 'bg-bronze-soft' : ''}`}>
                  <span className="text-[13px] text-ink">{r.name}</span>
                  <span className="ml-2 text-[11.5px] tabular text-muted">{formatYear(r.reignStart, { circa: r.circa })}–{formatYear(r.reignEnd)}</span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      {related.length > 0 && (
        <Section title="Related events">
          <ul className="-mx-2">
            {related.map((e) => (
              <li key={e.id}>
                <button onClick={() => runAction({ type: 'event', id: e.id })} className="flex w-full items-start gap-2 rounded-md px-2 py-1 text-left hover:bg-parchment/70">
                  <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full" style={{ background: EVENT_COLOR[e.type] }} />
                  <span className="text-[13px] text-ink">{e.title} <span className="text-[11.5px] text-muted">· {formatYear(e.y, { circa: e.circa })}</span></span>
                </button>
              </li>
            ))}
          </ul>
        </Section>
      )}
      <Section title="Sources">
        <Sources items={c.sources} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ event
function EventPanel({ id }: { id: string }) {
  const e = EVENT_BY_ID.get(id)
  const { setYear, fly } = useApp()
  if (!e) return <Missing>Unknown event.</Missing>
  const type = EVENT_TYPES.find((t) => t.id === e.type)!
  return (
    <div>
      <Header
        eyebrow={type.label}
        title={e.title}
        sub={`${e.dateLabel ?? formatYear(e.y, { circa: e.circa })}${e.yEnd ? ` – ${formatYear(e.yEnd)}` : ''} · ${e.place}`}
        badges={<SaveButton item={{ kind: 'event', title: e.title, year: clampYear(e.y), ref: e.id, camera: { center: [e.lon, e.lat], zoom: 5 } }} />}
      />
      <Section title="What happened">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{e.description}</p>
      </Section>
      <Section title="Historical impact">
        <p className="text-[13.5px] leading-relaxed text-ink-2">{e.impact}</p>
      </Section>
      <Section title="Participants">
        <div className="flex flex-wrap gap-1.5">{e.participants.map((p) => <Badge key={p}>{p}</Badge>)}</div>
        {e.relatedCivs.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-1.5">
            {e.relatedCivs.map((cid) => {
              const c = CIV_BY_ID.get(cid)
              return c ? <GhostButton key={cid} onClick={() => useApp.getState().select({ kind: 'civ', id: cid })}>{c.name} →</GhostButton> : null
            })}
          </div>
        )}
      </Section>
      {e.mapChange && (
        <Section title="Related map changes">
          <p className="text-[13px] leading-relaxed text-ink-2">{e.mapChange}</p>
        </Section>
      )}
      <Section title="On the map">
        <div className="flex gap-2">
          <GhostButton onClick={() => { setYear(clampYear(e.y)); fly({ center: [e.lon, e.lat], zoom: 6 }) }}>Locate</GhostButton>
          <GhostButton onClick={() => setYear(clampYear(e.y - 20))}>20 years before</GhostButton>
          <GhostButton onClick={() => setYear(clampYear((e.yEnd ?? e.y) + 20))}>20 years after</GhostButton>
        </div>
      </Section>
      <Section title="Sources">
        <Sources items={e.sources} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ city
function CityPanel({ id }: { id: string }) {
  const c = CITY_BY_ID.get(id)
  const { year, setYear, fly } = useApp()
  if (!c) return <Missing>Unknown city.</Missing>
  const current = [...c.eras].reverse().find((e) => e.y <= year)
  const histName = [...c.eras].reverse().find((e) => e.name && e.y <= year)?.name
  return (
    <div>
      <Header
        eyebrow={`City · ${c.country}`}
        title={c.name}
        sub={c.alternateNames.join(' · ')}
        badges={<SaveButton item={{ kind: 'city', title: c.name, year, ref: c.id, camera: { center: [c.lon, c.lat], zoom: 6 } }} />}
      />
      <Section title="At a glance">
        <dl>
          <KV k={`Name in ${formatYear(year)}`}>{year < c.foundedY ? <Missing>Not yet founded (as {c.name})</Missing> : histName ?? c.name}</KV>
          <KV k="Modern name">{c.name}</KV>
          <KV k="Founded">{c.founded}</KV>
          <KV k="Population">{c.population ?? <Missing />}</KV>
          <KV k="Landmarks">{c.landmarks.join(', ')}</KV>
        </dl>
        <p className="mt-2 text-[13px] leading-relaxed text-ink-2">{c.significance}</p>
      </Section>
      <Section title="Evolution timeline">
        <ol className="relative ml-1 border-l border-line pl-4">
          {c.eras.map((e) => {
            const active = current === e
            return (
              <li key={e.y + e.text} className="mb-3">
                <span className={`absolute -left-[5px] mt-1.5 h-2.5 w-2.5 rounded-full border-2 border-paper ${active ? 'bg-bronze' : 'bg-ink/30'}`} />
                <button onClick={() => { setYear(clampYear(e.y)); fly({ center: [c.lon, c.lat], zoom: 6 }) }} className={`w-full rounded-md px-2 py-1 text-left hover:bg-parchment/70 ${active ? 'bg-bronze-soft/70' : ''}`}>
                  <span className="block text-[11.5px] font-medium tabular text-bronze-2">
                    {formatYear(e.y, { circa: e.circa })}{e.yEnd ? `–${formatYear(e.yEnd)}` : ''}{e.name ? ` · “${e.name}”` : ''}
                  </span>
                  {e.ruler && <span className="block text-[11.5px] text-muted">{e.ruler}</span>}
                  <span className="block text-[13px] text-ink">{e.text}</span>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="text-[11.5px] text-muted">Historical photographs are not included: none are bundled under a licence that allows reuse here.</p>
      </Section>
      <Section title="Sources">
        <Sources items={c.sources} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ country history
function CountryPanel({ id }: { id: string }) {
  const c = COUNTRY_BY_ID.get(id)
  const { year, setYear, fly } = useApp()
  if (!c) return <Missing>Unknown country.</Missing>
  const tone = { archaeological: 'bronze', cultural: 'neutral', political: 'navy', colonial: 'warn', modern: 'ok' } as const
  return (
    <div>
      <Header eyebrow="Country history explorer" title={c.name} sub={`Modern state: ${c.modernName}. Select a period to see its map.`} />
      <div className="flex flex-wrap gap-1.5 px-5 pb-3">
        {Object.entries(KIND_LABEL).map(([k, l]) => <Badge key={k} tone={tone[k as keyof typeof tone]}>{l}</Badge>)}
      </div>
      <Section title="Chronology">
        <ol className="space-y-1.5">
          {c.periods.map((p) => {
            const active = year >= p.start && year <= p.end
            const civ = p.civId ? CIV_BY_ID.get(p.civId) : null
            return (
              <li key={p.label}>
                <button
                  onClick={() => {
                    const y = clampYear(p.kind === 'modern' ? Math.max(p.start, Math.min(p.end, 2010)) : Math.round((Math.max(p.start, -2999) + p.end) / 2))
                    setYear(y)
                    fly({ bbox: c.bbox })
                    if (civ) useApp.getState().setFocusCiv(civ.id)
                  }}
                  className={`w-full rounded-lg border px-3 py-2 text-left transition ${active ? 'border-bronze bg-bronze-soft/60' : 'border-line hover:border-bronze/60'}`}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[13.5px] font-medium text-ink">{p.label}</span>
                    <Badge tone={tone[p.kind]}>{KIND_LABEL[p.kind]}</Badge>
                  </div>
                  <div className="text-[11.5px] tabular text-muted">{formatYear(p.start, { circa: p.circa })} – {p.end >= 2026 ? 'present' : formatYear(p.end)}</div>
                  <p className="mt-0.5 text-[12.5px] text-ink-2">{p.text}</p>
                </button>
              </li>
            )
          })}
        </ol>
        <p className="mt-3 text-[11.5px] leading-relaxed text-muted">Modern borders of {c.name} are not projected onto earlier periods. Each period shows the boundary snapshot for that time.</p>
      </Section>
      <Section title="Sources">
        <Sources items={c.sources} />
      </Section>
    </div>
  )
}

// ------------------------------------------------------------------ region ("what existed here?")
function RegionPanel({ id }: { id: string }) {
  const { year, select, settings } = useApp()
  const r = REGIONS.find((x) => x.id === id)
  const snapY = snapshotFor(year).snapshot.year
  const entries = useMemo(() => (r ? entriesAt(snapY).filter((x) => inBbox(x.e[1], x.e[2], r.bbox)).sort((a, b) => b.e[4] - a.e[4]) : []), [r, snapY])
  if (!r) return <Missing>Unknown region.</Missing>
  const civs = civsAt(year).filter((c) => c.capitals.some((k) => year >= k.from && year <= k.to && inBbox(k.lon, k.lat, r.bbox)) || inBbox(c.center[0], c.center[1], r.bbox))
  const title = r.names[0].replace(/\b\w/g, (m) => m.toUpperCase())
  return (
    <div>
      <Header eyebrow="What existed here" title={`${title} in ${formatYear(year)}`} sub={`From the ${formatYear(snapY)} boundary snapshot and curated records`} />
      <Section title="Rulers and states (curated)">
        {civs.length === 0 ? <Missing>No curated civilization is centred here in {formatYear(year)}.</Missing> : (
          <ul className="space-y-1.5">
            {civs.map((c) => {
              const ruler = c.rulers.find((x) => year >= x.reignStart && year <= x.reignEnd)
              return (
                <li key={c.id}>
                  <button onClick={() => select({ kind: 'civ', id: c.id })} className="w-full rounded-md px-2 py-1.5 text-left hover:bg-parchment/70">
                    <span className="flex items-center gap-2 text-[13.5px] text-ink"><span className="h-2.5 w-2.5 rounded-sm" style={{ background: c.color }} />{c.name}</span>
                    <span className="block pl-[18px] text-[12px] text-muted">{ruler ? `Ruler: ${ruler.name} (${formatYear(ruler.reignStart, { circa: ruler.circa })}–${formatYear(ruler.reignEnd)})` : 'No ruler in the curated list for this exact year'}</span>
                  </button>
                </li>
              )
            })}
          </ul>
        )}
      </Section>
      <Section title="Territories in the dataset" aside={<span className="text-[11px] text-muted">{entries.length}</span>}>
        <ul className="-mx-2">
          {entries.slice(0, 40).map(({ name, e }) => (
            <li key={name}>
              <button onClick={() => select({ kind: 'territory', name, year: snapY })} className="flex w-full items-center justify-between gap-2 rounded-md px-2 py-1 text-left hover:bg-parchment/70">
                <span className="truncate text-[13px] text-ink">{name}</span>
                <span className="shrink-0 text-[11px] tabular text-muted">{formatArea(e[4], settings.units)}{e[3] <= 1 ? ' · approx.' : ''}</span>
              </button>
            </li>
          ))}
        </ul>
        {entries.length > 40 && <p className="mt-1 text-[11.5px] text-muted">+{entries.length - 40} smaller entities — zoom the map to see them.</p>}
      </Section>
      <Section title="Sources">
        <Sources items={[{ label: DATASETS[0].label, url: DATASETS[0].url }, wp('Category:Historical_regions', 'Wikipedia — Historical regions')]} />
      </Section>
    </div>
  )
}

function SitePanel({ id }: { id: string }) {
  const s = SITES.find((x) => x.id === id)
  if (!s) return <Missing>Unknown site.</Missing>
  return (
    <div>
      <Header eyebrow={`Ancient settlement · ${s.culture}`} title={s.name} sub={`Occupied c. ${formatYear(s.start)} – ${s.end >= 2026 ? 'present' : formatYear(s.end)}`} />
      <Section title="About">
        <p className="text-[13.5px] text-ink-2">{s.note}</p>
        <p className="mt-2 text-[11.5px] text-muted">Occupation ranges are approximate and simplified from the cited source.</p>
      </Section>
      <Section title="Sources">
        <Sources items={[s.source]} />
      </Section>
    </div>
  )
}
