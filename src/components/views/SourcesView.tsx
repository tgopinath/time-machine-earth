import { useApp } from '../../store/app'
import { DATASETS, EVALUATED_SOURCES } from '../../data/sources'
import { DATA_NOTES } from '../../data/atlas'
import { SNAPSHOTS } from '../../lib/snapshots'
import { formatYear } from '../../lib/chrono'
import { CIVILIZATIONS } from '../../data/civilizations'
import { EVENTS } from '../../data/events'
import { CITIES } from '../../data/cities'
import { TERRITORY_NAMES, useTerritoryIndex } from '../../lib/territoryIndex'
import { CloseButton } from '../ui'

export function SourcesView() {
  const { setView } = useApp()
  useTerritoryIndex()
  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ivory">
      <div className="scroll-thin h-full overflow-y-auto">
        <div className="mx-auto max-w-4xl px-4 py-6 md:px-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">Data & sources</div>
              <h1 className="mt-1 font-serif text-[34px] leading-tight text-ink">Where the history comes from</h1>
            </div>
            <CloseButton onClick={() => setView('explore')} />
          </div>
          <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-4">
            {[[SNAPSHOTS.length, 'boundary snapshots'], [TERRITORY_NAMES.length.toLocaleString(), 'named territories'], [CIVILIZATIONS.length, 'curated civilizations'], [EVENTS.length + CITIES.length, 'events & cities']].map(([v, l]) => (
              <div key={String(l)} className="rounded-xl border border-line bg-paper p-4"><div className="font-serif text-[26px] text-ink">{v}</div><div className="text-[12px] text-muted">{l}</div></div>
            ))}
          </div>
          <h2 className="mt-8 font-serif text-[22px] text-ink">Datasets in use</h2>
          <ul className="mt-2 space-y-3">
            {DATASETS.map((d) => (
              <li key={d.url} className="rounded-xl border border-line bg-paper p-4">
                <a href={d.url} target="_blank" rel="noreferrer" className="font-medium text-navy-2 underline">{d.label}</a>
                <span className="ml-2 text-[12px] text-muted">{d.license}</span>
                <p className="mt-1 text-[13px] text-ink-2">{d.use}</p>
              </li>
            ))}
          </ul>
          <h2 className="mt-8 font-serif text-[22px] text-ink">How boundaries are handled</h2>
          <ul className="mt-2 list-disc space-y-1.5 pl-5 text-[13.5px] text-ink-2">
            <li>Borders exist only at the snapshot years: {SNAPSHOTS.map((s) => formatYear(s.year)).join(', ')}.</li>
            <li>For any selected year the map shows the latest snapshot at or before it. Borders are never interpolated or taken from a later year.</li>
            <li>The dataset's BORDERPRECISION attribute drives the styling: 1 = approximate (hatched, dashed), 2 = moderately precise, 3 = set by treaty or international law.</li>
            <li>SUBJECTO records the overlord of dependencies; it powers the colonial layer and colonial-empire totals.</li>
            <li>A dataset label is linked to a curated civilization only inside that civilization's documented dates. Outside them, the label is shown as the dataset has it, with a conflict note where one is known.</li>
            <li>Dates are stored as astronomical years (1 BCE = 0) so arithmetic across the BCE/CE boundary is correct; the display uses BCE/CE with no year zero.</li>
          </ul>
          <h2 className="mt-8 font-serif text-[22px] text-ink">Known dataset conflicts</h2>
          <ul className="mt-2 space-y-2">
            {DATA_NOTES.map((n) => (
              <li key={n.name + n.years.join()} className="rounded-lg border border-line bg-paper px-4 py-2.5 text-[13px] text-ink-2"><b className="text-ink">{n.name}</b> ({n.years.map((y) => formatYear(y)).join(', ')}): {n.note}</li>
            ))}
          </ul>
          <h2 className="mt-8 font-serif text-[22px] text-ink">Sources researched but not ingested</h2>
          <ul className="mt-2 space-y-2">
            {EVALUATED_SOURCES.map((s) => (
              <li key={s.name} className="text-[13px] text-ink-2"><a href={s.url} target="_blank" rel="noreferrer" className="font-medium text-navy-2 underline">{s.name}</a> — {s.finding}</li>
            ))}
          </ul>
          <p className="mt-8 pb-8 text-[12px] text-muted">Boundary data © A. Ourednik and contributors, GPL-3.0. Natural Earth is public domain. Relief tiles © Esri. Curated text summarises the cited references; check them for scholarly detail.</p>
        </div>
      </div>
    </div>
  )
}
