import { useSyncExternalStore } from 'react'
import { CIV_BY_ID } from '../data/civilizations'

/** [snapshotYear, lon, lat, borderPrecision, areaKm2, subjectTo] */
export type IndexEntry = [number, number, number, number, number, string | null]

/**
 * The territory index (~360 KB) is loaded on its own after the first paint
 * instead of being inlined in the main bundle. Both exports are filled in place
 * once it arrives; components that read them call useTerritoryIndex() so they
 * re-render when it is ready.
 */
export const TERRITORY_INDEX: Record<string, IndexEntry[]> = {}
export const TERRITORY_NAMES: string[] = []

let ready = false
let loading: Promise<void> | null = null
const listeners = new Set<() => void>()

export function loadTerritoryIndex(): Promise<void> {
  if (!loading) {
    loading = import('../data/generated/territory-index.json').then((m) => {
      const json = (m.default ?? m) as unknown as Record<string, IndexEntry[]>
      Object.assign(TERRITORY_INDEX, json)
      TERRITORY_NAMES.push(...Object.keys(json))
      ready = true
      listeners.forEach((l) => l())
    })
    loading.catch(() => { loading = null })
  }
  return loading
}

/** Re-render the caller once the territory index has loaded (starts loading it if needed). */
export function useTerritoryIndex(): boolean {
  return useSyncExternalStore(
    (cb) => {
      listeners.add(cb)
      void loadTerritoryIndex()
      return () => listeners.delete(cb)
    },
    () => ready,
    () => ready,
  )
}

export function entriesAt(year: number): { name: string; e: IndexEntry }[] {
  const out: { name: string; e: IndexEntry }[] = []
  for (const [name, list] of Object.entries(TERRITORY_INDEX)) {
    const e = list.find((x) => x[0] === year)
    if (e) out.push({ name, e })
  }
  return out
}

export function indexEntry(name: string, year: number): IndexEntry | null {
  return TERRITORY_INDEX[name]?.find((x) => x[0] === year) ?? null
}

/**
 * Area of a curated civilization in every snapshot inside its documented
 * period — the "rise and decline" series. Colonial dependencies are included
 * for entities with matchSubjects.
 */
export function civAreaSeries(civId: string): { year: number; area: number }[] {
  const civ = CIV_BY_ID.get(civId)
  if (!civ) return []
  const byYear = new Map<number, number>()
  for (const [name, list] of Object.entries(TERRITORY_INDEX)) {
    for (const e of list) {
      if (e[0] < civ.start || e[0] > civ.end) continue
      const match = civ.matchNames.includes(name) || (!!e[5] && !!civ.matchSubjects?.includes(e[5]))
      if (match) byYear.set(e[0], (byYear.get(e[0]) ?? 0) + e[4])
    }
  }
  return [...byYear.entries()].sort((a, b) => a[0] - b[0]).map(([year, area]) => ({ year, area }))
}

export function nameAreaSeries(name: string): { year: number; area: number }[] {
  return (TERRITORY_INDEX[name] ?? []).map((e) => ({ year: e[0], area: e[4] }))
}

/** Snapshot years in which a curated civ has boundary data inside its documented period. */
export function civSnapshotYears(civId: string): number[] {
  return civAreaSeries(civId).map((d) => d.year)
}

/** Entities present in snapshot `b` but not `a` and vice-versa (by name). */
export function diffSnapshots(a: number, b: number): { appeared: string[]; vanished: string[] } {
  const A = new Set(entriesAt(a).map((x) => x.name))
  const B = new Set(entriesAt(b).map((x) => x.name))
  return { appeared: [...B].filter((n) => !A.has(n)), vanished: [...A].filter((n) => !B.has(n)) }
}
