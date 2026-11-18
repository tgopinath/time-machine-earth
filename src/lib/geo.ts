import type { Feature, FeatureCollection, MultiPolygon, Polygon } from 'geojson'
import * as turf from '@turf/turf'
import type { TerritoryProps } from './dataLoader'
import { CIV_BY_ID } from '../data/civilizations'

export type Area = Feature<Polygon | MultiPolygon>

/** A comparable entity: a curated civilization, or a raw dataset name. */
export type EntityRef = { kind: 'civ'; id: string } | { kind: 'name'; name: string }

export function entityLabel(e: EntityRef): string {
  return e.kind === 'civ' ? CIV_BY_ID.get(e.id)?.name ?? e.id : e.name
}

export function featuresForEntity<P extends Pick<TerritoryProps, 'name' | 'subj' | 'civ'>>(
  fc: FeatureCollection<Polygon | MultiPolygon, P>,
  e: EntityRef,
): Feature<Polygon | MultiPolygon, P>[] {
  if (e.kind === 'name') return fc.features.filter((f) => f.properties.name === e.name)
  const civ = CIV_BY_ID.get(e.id)
  if (!civ) return []
  // match by name (and colonial subject) regardless of the civ link, so that a
  // comparison can report "not present" vs "present" honestly for each year
  return fc.features.filter(
    (f) => f.properties.civ === e.id || civ.matchNames.includes(f.properties.name) || (!!f.properties.subj && !!civ.matchSubjects?.includes(f.properties.subj)),
  )
}

export function areaKm2(f: Area | null): number {
  if (!f) return 0
  try {
    return turf.area(f) / 1e6
  } catch {
    return 0
  }
}

function clean(f: Area): Area {
  try {
    return turf.simplify(turf.truncate(f, { precision: 4 }), { tolerance: 0.01, highQuality: false }) as Area
  } catch {
    return f
  }
}

/** Union of an entity's polygons (null when empty). */
export function unionAll(features: Area[]): Area | null {
  if (!features.length) return null
  const parts = features.map(clean)
  if (parts.length === 1) return parts[0]
  try {
    return (turf.union(turf.featureCollection(parts)) as Area | null) ?? null
  } catch {
    // fall back to a multipolygon without dissolving shared edges
    const coords: Polygon['coordinates'][] = []
    for (const p of parts) {
      if (p.geometry.type === 'Polygon') coords.push(p.geometry.coordinates)
      else coords.push(...p.geometry.coordinates)
    }
    return turf.multiPolygon(coords) as Area
  }
}

function safeDiff(a: Area | null, b: Area | null): Area | null {
  if (!a) return null
  if (!b) return a
  try {
    return (turf.difference(turf.featureCollection([a, b])) as Area | null) ?? null
  } catch {
    return null
  }
}

function safeIntersect(a: Area | null, b: Area | null): Area | null {
  if (!a || !b) return null
  try {
    return (turf.intersect(turf.featureCollection([a, b])) as Area | null) ?? null
  } catch {
    return null
  }
}

export interface BorderComparison {
  before: Area | null
  after: Area | null
  gained: Area | null
  lost: Area | null
  kept: Area | null
  areaBefore: number
  areaAfter: number
  areaGained: number
  areaLost: number
  areaKept: number
}

/** Territorial change between two boundary sets for the same entity. */
export function compareBoundaries(beforeFeatures: Area[], afterFeatures: Area[]): BorderComparison {
  const before = unionAll(beforeFeatures)
  const after = unionAll(afterFeatures)
  const gained = safeDiff(after, before)
  const lost = safeDiff(before, after)
  const kept = safeIntersect(before, after)
  return {
    before,
    after,
    gained,
    lost,
    kept,
    areaBefore: areaKm2(before),
    areaAfter: areaKm2(after),
    areaGained: areaKm2(gained),
    areaLost: areaKm2(lost),
    areaKept: areaKm2(kept),
  }
}

/** Geometry selection: which territory contains this point? Smallest wins (enclaves). */
export function territoryAt<P>(fc: FeatureCollection<Polygon | MultiPolygon, P>, lon: number, lat: number): Feature<Polygon | MultiPolygon, P> | null {
  const pt = turf.point([lon, lat])
  let best: Feature<Polygon | MultiPolygon, P> | null = null
  let bestArea = Infinity
  for (const f of fc.features) {
    try {
      if (turf.booleanPointInPolygon(pt, f.geometry)) {
        const a = turf.area(f.geometry)
        if (a < bestArea) {
          best = f
          bestArea = a
        }
      }
    } catch {
      /* invalid geometry */
    }
  }
  return best
}

export function bboxOf(f: Area): [number, number, number, number] {
  const b = turf.bbox(f)
  return [b[0], b[1], b[2], b[3]]
}

export function inBbox(lon: number, lat: number, b: [number, number, number, number]): boolean {
  return lon >= b[0] && lon <= b[2] && lat >= b[1] && lat <= b[3]
}

export function formatArea(km2: number, units: 'km' | 'mi' = 'km'): string {
  const v = units === 'mi' ? km2 * 0.386102 : km2
  const u = units === 'mi' ? 'mi²' : 'km²'
  if (v >= 1e6) return `${(v / 1e6).toFixed(2)} million ${u}`
  if (v >= 1e4) return `${Math.round(v / 1000).toLocaleString()} thousand ${u}`
  return `${Math.round(v).toLocaleString()} ${u}`
}
