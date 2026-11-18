import { CIVILIZATIONS } from '../data/civilizations'
import { CITIES } from '../data/cities'
import { EVENTS } from '../data/events'
import { COUNTRIES } from '../data/countries'
import { REGIONS } from '../data/atlas'
import { parseYear, formatYear, clampYear } from './chrono'
import { TERRITORY_INDEX, TERRITORY_NAMES } from './territoryIndex'

export type SearchAction =
  | { type: 'year'; year: number }
  | { type: 'civ'; id: string; year?: number }
  | { type: 'city'; id: string }
  | { type: 'event'; id: string }
  | { type: 'country'; id: string }
  | { type: 'territory'; name: string; year: number; lon: number; lat: number }
  | { type: 'region'; regionId: string; year: number }
  | { type: 'borders'; entity: { kind: 'civ'; id: string } | { kind: 'name'; name: string }; a: number; b: number }

export interface SearchResult {
  kind: 'Question' | 'Year' | 'Civilization' | 'Ruler' | 'City' | 'Event' | 'Country history' | 'Territory'
  label: string
  sub: string
  action: SearchAction
  score: number
}

const norm = (s: string) => s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').trim()

function matchScore(q: string, target: string): number {
  const t = norm(target)
  if (!q) return 0
  if (t === q) return 100
  if (t.startsWith(q)) return 80
  if (t.split(/[\s,()-]+/).some((w) => w.startsWith(q))) return 60
  if (t.includes(q)) return 40
  return 0
}

function findRegion(q: string) {
  // prefer the longest matching phrase ("south india" over "india")
  let best: (typeof REGIONS)[number] | null = null
  let bestLen = 0
  for (const r of REGIONS)
    for (const n of r.names)
      if (new RegExp(`\\b${n}\\b`).test(q) && n.length > bestLen) {
        best = r
        bestLen = n.length
      }
  return best
}

function extractYear(q: string): number | null {
  const m = q.match(/(-?\d{1,4})\s*(bce|bc|ce|ad)?\b|\b(ad|ce)\s*(\d{1,4})|\btoday\b|\bnow\b/)
  if (!m) return null
  return parseYear(m[0])
}

/** Interpret natural-language questions. */
export function interpretQuestion(raw: string): SearchResult | null {
  const q = norm(raw)
  const year = extractYear(q)
  const region = findRegion(q)

  // "How did the borders of Germany change?"
  if (/border|boundar|territor/.test(q) && /chang|grow|shrink|evolv|expan/.test(q)) {
    const civ = CIVILIZATIONS.find((c) => [c.name, ...c.alternateNames].some((n) => q.includes(norm(n))))
    if (civ) {
      const years = (Object.entries(TERRITORY_INDEX).filter(([n]) => civ.matchNames.includes(n)).flatMap(([, l]) => l.map((e) => e[0])) as number[])
        .filter((y) => y >= civ.start && y <= civ.end)
        .sort((a, b) => a - b)
      if (years.length >= 2)
        return { kind: 'Question', label: `How the borders of the ${civ.name} changed`, sub: `${formatYear(years[0])} → ${formatYear(years[years.length - 1])}`, action: { type: 'borders', entity: { kind: 'civ', id: civ.id }, a: years[0], b: years[years.length - 1] }, score: 200 }
    }
    const name = TERRITORY_NAMES.find((n) => q.includes(norm(n)) && n.length > 3)
    if (name) {
      const list = TERRITORY_INDEX[name]
      return { kind: 'Question', label: `How the borders of ${name} changed`, sub: `${formatYear(list[0][0])} → ${formatYear(list[list.length - 1][0])}`, action: { type: 'borders', entity: { kind: 'name', name }, a: list[0][0], b: list[list.length - 1][0] }, score: 200 }
    }
  }

  // "When did the Roman Empire fall?" / "When was the Mughal Empire founded?"
  if (/^when\b/.test(q)) {
    const civ = CIVILIZATIONS.find((c) => [c.name, ...c.alternateNames].some((n) => q.includes(norm(n))))
    if (civ) {
      const end = /fall|end|collapse|decline/.test(q)
      const y = end ? civ.end : civ.start
      return { kind: 'Question', label: `${civ.name}: ${end ? 'ended' : 'began'} ${formatYear(y, { circa: civ.circa })}`, sub: `Open the ${civ.name} at ${formatYear(y)}`, action: { type: 'civ', id: civ.id, year: clampYear(y) }, score: 200 }
    }
  }

  // "What existed before Chennai became Madras?" and other city questions
  const city = CITIES.find((c) =>
    [c.name, ...c.alternateNames].some((n) => {
      const w = norm(n).split(' (')[0]
      return w.length > 2 && new RegExp(`\\b${w}\\b`).test(q)
    }),
  )
  if (city && (/before|became|history|evolv|origin|founded/.test(q) || q.split(' ').length > 3) && !region) {
    return { kind: 'Question', label: `History of ${city.name}`, sub: city.alternateNames.slice(0, 3).join(' · '), action: { type: 'city', id: city.id }, score: 190 }
  }

  // "What existed in India in 500 BCE?" / "Who ruled Egypt in 1000 BCE?" / "What did Europe look like in 1500?"
  if (region && year !== null) {
    const who = /who ruled|ruler|king|emperor/.test(q)
    return {
      kind: 'Question',
      label: `${who ? 'Who ruled' : 'What existed in'} ${region.names[0].replace(/\b\w/g, (c) => c.toUpperCase())} in ${formatYear(year)}`,
      sub: 'Jump to the map and list the entities in this region',
      action: { type: 'region', regionId: region.id, year: clampYear(year) },
      score: 210,
    }
  }
  return null
}

export function search(raw: string, limit = 12): SearchResult[] {
  const q = norm(raw)
  if (!q) return []
  const results: SearchResult[] = []
  const question = interpretQuestion(raw)
  if (question) results.push(question)

  const y = /^[-\d]|bce|bc\b|ce\b|ad\b|today|century/.test(q) && q.split(' ').length <= 3 ? parseYear(q) : null
  if (y !== null) results.push({ kind: 'Year', label: formatYear(clampYear(y)), sub: 'Travel to this year', action: { type: 'year', year: clampYear(y) }, score: 150 })

  for (const c of CIVILIZATIONS) {
    const s = Math.max(...[c.name, ...c.alternateNames].map((n) => matchScore(q, n)))
    if (s) results.push({ kind: 'Civilization', label: c.name, sub: `${formatYear(c.start, { circa: c.circa })} – ${formatYear(c.end)} · ${c.region}`, action: { type: 'civ', id: c.id }, score: s + 10 })
    for (const r of c.rulers) {
      const rs = matchScore(q, r.name)
      if (rs >= 60) results.push({ kind: 'Ruler', label: r.name, sub: `${c.name} · ${formatYear(r.reignStart, { circa: r.circa })}–${formatYear(r.reignEnd)}`, action: { type: 'civ', id: c.id, year: clampYear(r.reignStart) }, score: rs })
    }
  }
  for (const c of COUNTRIES) {
    const s = Math.max(...[c.name, ...c.aliases].map((n) => matchScore(q, n)))
    if (s) results.push({ kind: 'Country history', label: `${c.name} through time`, sub: `${c.periods.length} periods · ${c.modernName}`, action: { type: 'country', id: c.id }, score: s + 5 })
  }
  for (const c of CITIES) {
    const s = Math.max(...[c.name, ...c.alternateNames].map((n) => matchScore(q, n)))
    if (s) results.push({ kind: 'City', label: c.name, sub: `${c.country} · ${c.alternateNames.slice(0, 2).join(', ')}`, action: { type: 'city', id: c.id }, score: s + 8 })
  }
  for (const e of EVENTS) {
    const s = matchScore(q, e.title)
    if (s) results.push({ kind: 'Event', label: e.title, sub: `${formatYear(e.y, { circa: e.circa })} · ${e.place}`, action: { type: 'event', id: e.id }, score: s })
  }
  if (q.length >= 3) {
    let n = 0
    for (const name of TERRITORY_NAMES) {
      const s = matchScore(q, name)
      if (s < 60) continue
      const list = TERRITORY_INDEX[name]
      const e = list[0]
      results.push({ kind: 'Territory', label: name, sub: `Boundary data in ${list.length} snapshot${list.length > 1 ? 's' : ''} · from ${formatYear(e[0])}`, action: { type: 'territory', name, year: e[0], lon: e[1], lat: e[2] }, score: s - 15 })
      if (++n > 30) break
    }
  }
  return results.sort((a, b) => b.score - a.score).slice(0, limit)
}
