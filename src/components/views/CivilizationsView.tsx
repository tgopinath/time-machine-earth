import { useMemo, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { useApp } from '../../store/app'
import { CIVILIZATIONS, CIV_TYPE_LABEL } from '../../data/civilizations'
import { COUNTRIES } from '../../data/countries'
import { CITIES } from '../../data/cities'
import { formatYear, MIN_YEAR, MAX_YEAR } from '../../lib/chrono'
import { runAction } from '../../lib/navigate'
import { CloseButton } from '../ui'
import { timeScale } from '../Timeline'

const REGION_ORDER = ['South Asia', 'East Asia', 'West Asia', 'Mesopotamia', 'Anatolia', 'North Africa', 'Mediterranean', 'Europe', 'Africa', 'Americas', 'Eurasia', 'Global']

function regionGroup(r: string): string {
  if (/South Asia|Indian Ocean/.test(r)) return 'South Asia'
  if (/East Asia|Southeast Asia/.test(r)) return 'East & Southeast Asia'
  if (/Mesopotamia|West Asia|Anatolia|Central/.test(r)) return 'West & Central Asia'
  if (/Africa/.test(r) && !/Mediterranean/.test(r)) return 'Africa'
  if (/Mediterranean|Aegean|Europe/.test(r)) return 'Europe & Mediterranean'
  if (/America|Andes/.test(r)) return 'Americas'
  return 'Transcontinental'
}

export function CivilizationsView() {
  const { setView, year } = useApp()
  const [type, setType] = useState<string>('all')
  const groups = useMemo(() => {
    const m = new Map<string, typeof CIVILIZATIONS>()
    for (const c of CIVILIZATIONS) {
      if (type !== 'all' && c.type !== type) continue
      const g = regionGroup(c.region)
      m.set(g, [...(m.get(g) ?? []), c].sort((a, b) => a.start - b.start))
    }
    return [...m.entries()].sort((a, b) => REGION_ORDER.indexOf(a[0]) - REGION_ORDER.indexOf(b[0]))
  }, [type])
  const x = scaleLinear().domain([0, 1]).range([0, 100])
  const types = [...new Set(CIVILIZATIONS.map((c) => c.type))]

  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ivory/97 backdrop-blur-sm">
      <div className="scroll-thin h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <div className="flex items-start justify-between gap-4">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">Civilizations</div>
              <h1 className="mt-1 font-serif text-[34px] leading-tight text-ink">Who was where, and when</h1>
              <p className="mt-1 max-w-2xl text-[14px] text-ink-2">
                {CIVILIZATIONS.length} curated records, each with documented dates and sources. Bars show documented duration on the same timeline as the map; the vertical line is {formatYear(year)}.
              </p>
            </div>
            <CloseButton onClick={() => setView('explore')} />
          </div>

          <div className="mt-4 flex flex-wrap gap-1.5">
            {['all', ...types].map((t) => (
              <button key={t} onClick={() => setType(t)} className={`rounded-full border px-3 py-1 text-[12px] ${type === t ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-2 hover:border-bronze'}`}>
                {t === 'all' ? 'All types' : CIV_TYPE_LABEL[t]}
              </button>
            ))}
          </div>

          <div className="mt-6 space-y-8">
            {groups.map(([g, civs]) => (
              <section key={g}>
                <h2 className="mb-2 border-b border-line pb-1 font-serif text-[20px] text-ink">{g}</h2>
                <div className="relative">
                  <div className="pointer-events-none absolute bottom-0 top-0 z-10 w-px bg-ink/60" style={{ left: `calc(220px + (100% - 220px) * ${timeScale(year)})` }} />
                  {civs.map((c) => (
                    <button key={c.id} onClick={() => runAction({ type: 'civ', id: c.id })} className="group grid w-full grid-cols-[220px_1fr] items-center gap-0 rounded-md py-1 text-left hover:bg-parchment/60">
                      <span className="truncate pr-3">
                        <span className="block truncate text-[13.5px] text-ink group-hover:underline">{c.name}</span>
                        <span className="block text-[11px] text-muted">{CIV_TYPE_LABEL[c.type]} · {formatYear(c.start, { circa: c.circa })}–{c.end >= 2026 ? 'now' : formatYear(c.end)}</span>
                      </span>
                      <span className="relative block h-5 rounded bg-parchment/50">
                        <span
                          className="absolute top-1 h-3 rounded-sm"
                          style={{
                            left: `${x(timeScale(Math.max(c.start, MIN_YEAR)))}%`,
                            width: `${Math.max(0.6, x(timeScale(Math.min(c.end, MAX_YEAR))) - x(timeScale(Math.max(c.start, MIN_YEAR))))}%`,
                            background: c.color,
                            opacity: c.type === 'archaeological' || c.type === 'cultural' ? 0.55 : 0.9,
                          }}
                        />
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ))}
          </div>

          <div className="mt-10 grid gap-6 md:grid-cols-2">
            <section>
              <h2 className="mb-2 font-serif text-[20px] text-ink">Country histories</h2>
              <div className="flex flex-wrap gap-2">
                {COUNTRIES.map((c) => (
                  <button key={c.id} onClick={() => runAction({ type: 'country', id: c.id })} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink hover:border-bronze">{c.name}</button>
                ))}
              </div>
            </section>
            <section>
              <h2 className="mb-2 font-serif text-[20px] text-ink">City evolution</h2>
              <div className="flex flex-wrap gap-2">
                {CITIES.map((c) => (
                  <button key={c.id} onClick={() => runAction({ type: 'city', id: c.id })} className="rounded-full border border-line px-3 py-1.5 text-[13px] text-ink hover:border-bronze">{c.name}</button>
                ))}
              </div>
            </section>
          </div>
        </div>
      </div>
    </div>
  )
}
