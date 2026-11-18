import type { Feature, FeatureCollection, Geometry, Point, Polygon, MultiPolygon } from 'geojson'
import { get as idbGet, set as idbSet } from 'idb-keyval'
import * as turf from '@turf/turf'
import { type Snapshot, snapshotUrl } from './snapshots'
import { civForFeature, CIV_BY_ID } from '../data/civilizations'
import { hashColor } from './colors'

export interface TerritoryProps {
  _id: number
  name: string
  subj: string | null
  prec: number
  civ: string | null
  color: string
  year: number
}

export type TerritoryFC = FeatureCollection<Polygon | MultiPolygon, TerritoryProps>

export interface LoadedSnapshot {
  snapshot: Snapshot
  territories: TerritoryFC
  labels: FeatureCollection<Point, { name: string; area: number; prec: number; civ: string | null }>
}

const CACHE_VERSION = 'v1'
const memory = new Map<string, Promise<LoadedSnapshot>>()

/** Resolve to undefined if IndexedDB does not answer quickly (some locked-down browsers never do). */
function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | undefined> {
  return Promise.race([p, new Promise<undefined>((r) => setTimeout(() => r(undefined), ms))])
}

async function fetchJson(url: string, cacheKey: string): Promise<FeatureCollection> {
  try {
    const cached = await withTimeout(idbGet(cacheKey), 1500)
    if (cached) return cached as FeatureCollection
  } catch {
    // IndexedDB unavailable (private mode) — fall through to network
  }
  if (import.meta.env.DEV) console.debug('[data] fetch', url)
  const res = await fetch(url)
  if (!res.ok) throw new Error(`Could not load ${url} (${res.status})`)
  const json = (await res.json()) as FeatureCollection
  if (import.meta.env.DEV) console.debug('[data] loaded', url, json.features?.length)
  try {
    void withTimeout(idbSet(cacheKey, json), 5000)
  } catch {
    /* quota or private mode: ignore */
  }
  return json
}

/** Normalise one historical-basemaps snapshot into the internal schema. */
export function normalizeSnapshot(raw: FeatureCollection, year: number): LoadedSnapshot['territories'] {
  const out: Feature<Polygon | MultiPolygon, TerritoryProps>[] = []
  raw.features.forEach((f, i) => {
    const g = f.geometry as Geometry | null
    if (!g || (g.type !== 'Polygon' && g.type !== 'MultiPolygon')) return
    const p = (f.properties ?? {}) as Record<string, unknown>
    const name = String(p.NAME ?? '').trim()
    if (!name) return
    const subjRaw = String(p.SUBJECTO ?? '').trim()
    const subj = subjRaw && subjRaw !== name ? subjRaw : null
    const civ = civForFeature(name, subj, year)
    const prec = Number(p.BORDERPRECISION ?? 0) || 0
    out.push({
      type: 'Feature',
      geometry: g,
      properties: {
        _id: i,
        name,
        subj,
        prec,
        civ: civ?.id ?? null,
        color: civ ? CIV_BY_ID.get(civ.id)!.color : hashColor(subj ?? name),
        year,
      },
    })
  })
  return { type: 'FeatureCollection', features: out }
}

/** One label point per entity name, placed in its largest polygon. */
export function buildLabels(fc: TerritoryFC): LoadedSnapshot['labels'] {
  const byName = new Map<string, { area: number; best: Feature<Polygon> | null; bestArea: number; prec: number; civ: string | null }>()
  for (const f of fc.features) {
    const polys: Polygon[] = f.geometry.type === 'Polygon' ? [f.geometry] : f.geometry.coordinates.map((c) => ({ type: 'Polygon', coordinates: c }))
    const entry = byName.get(f.properties.name) ?? { area: 0, best: null, bestArea: -1, prec: f.properties.prec, civ: f.properties.civ }
    for (const p of polys) {
      let a = 0
      try {
        a = turf.area(p) / 1e6
      } catch {
        /* degenerate ring */
      }
      entry.area += a
      if (a > entry.bestArea) {
        entry.bestArea = a
        entry.best = turf.feature(p)
      }
    }
    byName.set(f.properties.name, entry)
  }
  const features: Feature<Point, { name: string; area: number; prec: number; civ: string | null }>[] = []
  for (const [name, e] of byName) {
    if (!e.best) continue
    let pt: Feature<Point>
    try {
      pt = turf.centerOfMass(e.best)
      if (!turf.booleanPointInPolygon(pt, e.best)) pt = turf.pointOnFeature(e.best)
    } catch {
      continue
    }
    features.push({ type: 'Feature', geometry: pt.geometry, properties: { name, area: Math.round(e.area), prec: e.prec, civ: e.civ } })
  }
  return { type: 'FeatureCollection', features }
}

export function loadSnapshot(s: Snapshot): Promise<LoadedSnapshot> {
  let p = memory.get(s.file)
  if (!p) {
    p = fetchJson(snapshotUrl(s), `${CACHE_VERSION}:${s.file}`).then((raw) => {
      const territories = normalizeSnapshot(raw, s.year)
      return { snapshot: s, territories, labels: buildLabels(territories) }
    })
    p.catch(() => memory.delete(s.file))
    memory.set(s.file, p)
  }
  return p
}

export function isSnapshotLoaded(s: Snapshot): boolean {
  return memory.has(s.file)
}

// ---- Natural Earth reference layers ----
const NE = 'https://cdn.jsdelivr.net/gh/nvkelso/natural-earth-vector@master/geojson'
export const NE_URLS = {
  land: `${NE}/ne_50m_land.geojson`,
  lakes: `${NE}/ne_50m_lakes.geojson`,
  rivers: `${NE}/ne_50m_rivers_lake_centerlines.geojson`,
  modern: `${NE}/ne_110m_admin_0_countries.geojson`,
  marine: `${NE}/ne_50m_geography_marine_polys.geojson`,
  regions: `${NE}/ne_50m_geography_regions_polys.geojson`,
}

const baseCache = new Map<string, Promise<FeatureCollection>>()
/** Natural Earth reference layers, cached in memory and IndexedDB. */
export function loadBaseLayer(key: keyof typeof NE_URLS): Promise<FeatureCollection> {
  let p = baseCache.get(key)
  if (!p) {
    p = fetchJson(NE_URLS[key], `${CACHE_VERSION}:ne-${key}`)
    p.catch(() => baseCache.delete(key))
    baseCache.set(key, p)
  }
  return p
}

export async function loadGeographyLabels(): Promise<FeatureCollection<Point, { name: string; kind: 'sea' | 'range'; rank: number }>> {
  const [marine, regions] = await Promise.all([
    fetchJson(NE_URLS.marine, `${CACHE_VERSION}:ne-marine`),
    fetchJson(NE_URLS.regions, `${CACHE_VERSION}:ne-regions`),
  ])
  const out: Feature<Point, { name: string; kind: 'sea' | 'range'; rank: number }>[] = []
  for (const f of marine.features) {
    const p = f.properties as Record<string, unknown>
    const name = String(p.name ?? p.NAME ?? '')
    if (!name) continue
    try {
      out.push({ type: 'Feature', geometry: turf.pointOnFeature(f as Feature<Polygon>).geometry, properties: { name, kind: 'sea', rank: Number(p.scalerank ?? 5) } })
    } catch {
      /* skip */
    }
  }
  for (const f of regions.features) {
    const p = f.properties as Record<string, unknown>
    if (!/Range\/mtn|Plateau/.test(String(p.featurecla))) continue
    const name = String(p.name ?? p.NAME ?? '')
    if (!name) continue
    try {
      out.push({ type: 'Feature', geometry: turf.centroid(f as Feature<Polygon>).geometry, properties: { name, kind: 'range', rank: Number(p.scalerank ?? 5) } })
    } catch {
      /* skip */
    }
  }
  return { type: 'FeatureCollection', features: out }
}
