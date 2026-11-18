import snapshotsJson from '../data/generated/snapshots.json'
import { formatYear } from './chrono'

export interface Snapshot {
  file: string
  /** astronomical year the boundaries were drawn for */
  year: number
  features: number
}

export const SNAPSHOTS: Snapshot[] = [...(snapshotsJson as Snapshot[])].sort((a, b) => a.year - b.year)
export const SNAPSHOT_YEARS = SNAPSHOTS.map((s) => s.year)

export const DATA_BASE = 'https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson'

export interface SnapshotPick {
  snapshot: Snapshot
  /** the requested year is earlier than the oldest snapshot */
  beforeCoverage: boolean
  /** years between the requested year and the snapshot drawn for it */
  gap: number
}

/**
 * Political boundaries are only documented at discrete snapshot years.
 * For a requested year we show the most recent snapshot at or before it —
 * never a later one, which would show borders that did not exist yet.
 * Boundaries are never interpolated between snapshots.
 */
export function snapshotFor(y: number, list: Snapshot[] = SNAPSHOTS): SnapshotPick {
  let pick = list[0]
  for (const s of list) {
    if (s.year <= y) pick = s
    else break
  }
  return { snapshot: pick, beforeCoverage: y < list[0].year, gap: Math.max(0, y - pick.year) }
}

export function snapshotIndex(y: number): number {
  return SNAPSHOTS.indexOf(snapshotFor(y).snapshot)
}

export function nextSnapshot(y: number): Snapshot | null {
  return SNAPSHOTS.find((s) => s.year > y) ?? null
}

export function prevSnapshot(y: number): Snapshot | null {
  const earlier = SNAPSHOTS.filter((s) => s.year < y)
  return earlier.length ? earlier[earlier.length - 1] : null
}

export function snapshotLabel(s: Snapshot): string {
  return formatYear(s.year)
}

export function snapshotUrl(s: Snapshot): string {
  return `${DATA_BASE}/${s.file}`
}
