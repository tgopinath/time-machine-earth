import { describe, expect, it } from 'vitest'
import * as turf from '@turf/turf'
import type { FeatureCollection, Polygon } from 'geojson'
import { compareBoundaries, territoryAt, featuresForEntity, unionAll } from '../lib/geo'

const sq = (x0: number, y0: number, x1: number, y1: number, name: string, extra: Record<string, unknown> = {}) =>
  turf.polygon([[[x0, y0], [x1, y0], [x1, y1], [x0, y1], [x0, y0]]], { name, subj: null, civ: null, ...extra })

describe('boundary comparison', () => {
  it('computes gained, lost and unchanged territory', () => {
    const before = [sq(0, 0, 2, 2, 'A')]
    const after = [sq(1, 0, 3, 2, 'A')]
    const r = compareBoundaries(before, after)
    // each 1x2 degree strip near the equator ≈ 24,700 km²
    expect(r.areaGained).toBeGreaterThan(20000)
    expect(r.areaLost).toBeGreaterThan(20000)
    expect(Math.abs(r.areaGained - r.areaLost) / r.areaGained).toBeLessThan(0.01)
    expect(r.areaKept).toBeGreaterThan(20000)
    expect(Math.abs(r.areaBefore - (r.areaKept + r.areaLost)) / r.areaBefore).toBeLessThan(0.01)
  })
  it('handles an entity that only exists in one year', () => {
    const r = compareBoundaries([], [sq(0, 0, 1, 1, 'A')])
    expect(r.areaBefore).toBe(0)
    expect(r.lost).toBeNull()
    expect(r.areaGained).toBeCloseTo(r.areaAfter, 0)
  })
  it('unions multiple polygons', () => {
    const u = unionAll([sq(0, 0, 1, 1, 'A'), sq(1, 0, 2, 1, 'A')])
    expect(turf.area(u!)).toBeCloseTo(turf.area(sq(0, 0, 2, 1, 'A')), -3)
  })
})

describe('geometry selection', () => {
  const fc: FeatureCollection<Polygon, { name: string; subj: string | null; civ: string | null }> = turf.featureCollection([
    sq(0, 0, 10, 10, 'Big'),
    sq(4, 4, 6, 6, 'Enclave'),
    sq(20, 20, 30, 30, 'Colony', { subj: 'United Kingdom' }),
  ]) as never
  it('picks the smallest containing polygon', () => {
    expect(territoryAt(fc, 5, 5)?.properties.name).toBe('Enclave')
    expect(territoryAt(fc, 1, 1)?.properties.name).toBe('Big')
    expect(territoryAt(fc, 50, 50)).toBeNull()
  })
  it('selects features for a curated colonial entity via SUBJECTO', () => {
    expect(featuresForEntity(fc, { kind: 'civ', id: 'british-empire' }).map((f) => f.properties.name)).toEqual(['Colony'])
    expect(featuresForEntity(fc, { kind: 'name', name: 'Big' })).toHaveLength(1)
  })
})
