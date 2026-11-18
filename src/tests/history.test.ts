import { describe, expect, it } from 'vitest'
import { snapshotFor, SNAPSHOTS, nextSnapshot, prevSnapshot } from '../lib/snapshots'
import { civsAt, civForFeature, CIVILIZATIONS } from '../data/civilizations'
import { eventsBetween } from '../data/events'
import { toAstro } from '../lib/chrono'
import { entriesAt, civAreaSeries, TERRITORY_INDEX } from '../lib/territoryIndex'
import { classifyTerritory } from '../lib/classify'

const ids = (y: number) => civsAt(y).map((c) => c.id)

describe('snapshot selection', () => {
  it('never uses a snapshot later than the requested year', () => {
    for (let y = -2999; y <= 2026; y += 37) {
      const { snapshot } = snapshotFor(y)
      expect(snapshot.year).toBeLessThanOrEqual(Math.max(y, SNAPSHOTS[0].year))
    }
  })
  it('picks the exact snapshot when one exists', () => {
    expect(snapshotFor(1500).snapshot.year).toBe(1500)
    expect(snapshotFor(1945).snapshot.year).toBe(1945)
    expect(snapshotFor(toAstro(3000, 'BCE')).snapshot.year).toBe(-2999)
  })
  it('falls back to the latest earlier snapshot', () => {
    expect(snapshotFor(1525).snapshot.year).toBe(1500)
    expect(snapshotFor(2026).snapshot.year).toBe(2010)
    expect(snapshotFor(1).snapshot.year).toBe(0) // 1 CE -> 1 BCE snapshot
  })
  it('has distinct data for different years (no single hard-coded map)', () => {
    const a = new Set(entriesAt(-499).map((x) => x.name))
    const b = new Set(entriesAt(1500).map((x) => x.name))
    expect(a.has('Achaemenid Empire')).toBe(true)
    expect(b.has('Achaemenid Empire')).toBe(false)
    expect(b.has('Ottoman Empire')).toBe(true)
  })
  it('navigates periods', () => {
    expect(nextSnapshot(1500)?.year).toBe(1530)
    expect(prevSnapshot(1500)?.year).toBe(1492)
  })
})

describe('historical interval queries', () => {
  it('1500 CE: Ottoman, Ming, Aztec, Inca, Vijayanagara exist; Mughal does not (founded 1526)', () => {
    const at = ids(1500)
    for (const id of ['ottoman', 'ming', 'aztec', 'inca', 'vijayanagara']) expect(at).toContain(id)
    expect(at).not.toContain('mughal')
    expect(ids(1530)).toContain('mughal')
  })
  it('3000 BCE: Egypt, Indus, Sumer, Minoan', () => {
    const at = ids(toAstro(3000, 'BCE'))
    for (const id of ['egypt', 'indus', 'sumer', 'minoan']) expect(at).toContain(id)
  })
  it('1 CE: Roman Empire and Han exist, Roman Republic does not', () => {
    expect(ids(1)).toEqual(expect.arrayContaining(['rome', 'han', 'parthia']))
    expect(ids(1)).not.toContain('roman-republic')
  })
  it('every curated civilization has a valid interval and sources', () => {
    for (const c of CIVILIZATIONS) {
      expect(c.start).toBeLessThanOrEqual(c.end)
      expect(c.sources.length).toBeGreaterThan(0)
      for (const r of c.rulers) expect(r.reignStart).toBeLessThanOrEqual(r.reignEnd)
      for (const k of c.capitals) expect(k.from).toBeLessThanOrEqual(k.to)
    }
  })
  it('does not link a dataset label to a civilization outside its documented period', () => {
    expect(civForFeature('Mauryan Empire', null, toAstro(300, 'BCE'))?.id).toBe('maurya')
    expect(civForFeature('Mauryan Empire', null, toAstro(100, 'BCE'))).toBeNull()
    expect(civForFeature('India', null, 1945)).toBeNull()
    expect(civForFeature('India', null, 1960)?.id).toBe('india')
  })
  it('links colonial dependencies to their empire through SUBJECTO', () => {
    expect(civForFeature('British Raj', 'United Kingdom', 1900)?.id).toBe('british-raj')
    expect(civForFeature('Gold Coast', 'United Kingdom', 1938)?.id).toBe('british-empire')
  })
  it('events between two years', () => {
    const e = eventsBetween(1700, 1950).map((x) => x.id)
    expect(e).toContain('plassey')
    expect(e).toContain('india-independence')
    expect(e).not.toContain('panipat-1526')
  })
  it('classifies modern states vs historical entities', () => {
    expect(classifyTerritory('Roman Empire', null, 100).key).toBe('empire')
    expect(classifyTerritory('Savanna hunter-gatherers', null, 100).key).toBe('cultural')
    expect(classifyTerritory('Indus valley civilization', null, -1999).key).toBe('archaeological')
    expect(classifyTerritory('Gold Coast', 'United Kingdom', 1938).key).toBe('colonial')
  })
  it('rise and decline series covers documented snapshots only', () => {
    const s = civAreaSeries('rome')
    expect(s.map((d) => d.year)).toEqual([0, 100, 200, 400])
    expect(s.every((d) => d.area > 0)).toBe(true)
  })
  it('the index covers 3000 BCE to 2010', () => {
    const years = new Set(Object.values(TERRITORY_INDEX).flatMap((l) => l.map((e) => e[0])))
    expect(years.has(-2999)).toBe(true)
    expect(years.has(2010)).toBe(true)
  })
})
