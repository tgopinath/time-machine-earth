import { CIVILIZATIONS, CIV_BY_ID } from '../data/civilizations'
import { EVENTS } from '../data/events'
import { formatYear } from './chrono'
import { TERRITORY_INDEX, entriesAt } from './territoryIndex'
import { SNAPSHOT_YEARS } from './snapshots'

export type Difficulty = 'easy' | 'medium' | 'hard'
export type QuizKind = 'region' | 'capital' | 'period' | 'order' | 'border'

export interface QuizQuestion {
  id: string
  kind: QuizKind
  prompt: string
  options: string[]
  answer: number
  explanation: string
  fact: string
  year: number
  /** territory to highlight after answering */
  highlight?: { name: string; year: number; lon: number; lat: number }
  civId?: string
}

/** Deterministic PRNG so a seed reproduces the same quiz (used for daily challenges and tests). */
export function rng(seed: number) {
  let s = seed >>> 0 || 1
  return () => {
    s ^= s << 13
    s ^= s >>> 17
    s ^= s << 5
    return ((s >>> 0) % 1_000_000) / 1_000_000
  }
}

function shuffle<T>(arr: T[], r: () => number): T[] {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(r() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

function pick<T>(arr: T[], r: () => number): T {
  return arr[Math.floor(r() * arr.length)]
}

function withOptions(correct: string, pool: string[], r: () => number): { options: string[]; answer: number } {
  const distractors = shuffle([...new Set(pool.filter((p) => p !== correct))], r).slice(0, 3)
  const options = shuffle([correct, ...distractors], r)
  return { options, answer: options.indexOf(correct) }
}

const FAMOUS = new Set(['rome', 'byzantine', 'ottoman', 'mughal', 'maurya', 'gupta', 'mongol', 'achaemenid', 'han', 'inca', 'aztec', 'british-empire', 'egypt', 'tang', 'ming', 'qing'])

function civPool(d: Difficulty) {
  return CIVILIZATIONS.filter((c) => c.type !== 'modern-state' && (d !== 'easy' || FAMOUS.has(c.id)))
}

/** Civs that have boundary data in some snapshot within their documented period. */
function civSnapshots(civId: string) {
  const civ = CIV_BY_ID.get(civId)!
  const out: { name: string; year: number; lon: number; lat: number; area: number }[] = []
  for (const n of civ.matchNames)
    for (const e of TERRITORY_INDEX[n] ?? []) if (e[0] >= civ.start && e[0] <= civ.end) out.push({ name: n, year: e[0], lon: e[1], lat: e[2], area: e[4] })
  return out
}

function regionQuestion(d: Difficulty, r: () => number): QuizQuestion | null {
  const candidates = civPool(d).filter((c) => civSnapshots(c.id).length)
  const civ = pick(candidates, r)
  const snap = pick(civSnapshots(civ.id), r)
  const others =
    d === 'hard'
      ? entriesAt(snap.year)
          .filter((x) => x.e[4] > 200_000 && x.name !== snap.name)
          .map((x) => x.name)
      : CIVILIZATIONS.filter((c) => c.id !== civ.id && c.type !== 'modern-state' && Math.abs(c.focusYear - snap.year) < 1500).map((c) => c.name)
  const { options, answer } = withOptions(civ.name, others, r)
  if (options.length < 4) return null
  return {
    id: `region-${civ.id}-${snap.year}`,
    kind: 'region',
    prompt: `Which ${civ.type === 'archaeological' || civ.type === 'cultural' ? 'civilization' : 'power'} controlled the highlighted region in ${formatYear(snap.year)}?`,
    ...{ options, answer },
    explanation: `In the ${formatYear(snap.year)} boundary snapshot this area belongs to the ${civ.name} (${formatYear(civ.start, { circa: civ.circa })} – ${formatYear(civ.end)}).`,
    fact: civ.description,
    year: snap.year,
    highlight: snap,
    civId: civ.id,
  }
}

function capitalQuestion(d: Difficulty, r: () => number): QuizQuestion | null {
  const civ = pick(civPool(d).filter((c) => c.capitals.length), r)
  const cap = pick(civ.capitals, r)
  const pool = CIVILIZATIONS.flatMap((c) => c.capitals.map((x) => x.name)).filter((n) => !civ.capitals.some((x) => x.name === n))
  const { options, answer } = withOptions(cap.name, pool, r)
  const y = Math.round((cap.from + cap.to) / 2)
  return {
    id: `capital-${civ.id}-${cap.name}`,
    kind: 'capital',
    prompt: `What was the capital of the ${civ.name} in ${formatYear(y)}?`,
    options,
    answer,
    explanation: `${cap.name} was the capital from ${formatYear(cap.from)} to ${formatYear(cap.to)}.`,
    fact: civ.timeline[0]?.text ?? civ.description,
    year: y,
    highlight: { name: cap.name, year: y, lon: cap.lon, lat: cap.lat },
    civId: civ.id,
  }
}

function periodQuestion(d: Difficulty, r: () => number): QuizQuestion | null {
  const civ = pick(civPool(d), r)
  const y = Math.round(civ.start + (civ.end - civ.start) * (0.2 + r() * 0.6))
  const pool = CIVILIZATIONS.filter((c) => c.type !== 'modern-state' && (y < c.start - 50 || y > c.end + 50)).map((c) => c.name)
  const { options, answer } = withOptions(civ.name, pool, r)
  return {
    id: `period-${civ.id}-${y}`,
    kind: 'period',
    prompt: `Which of these existed in ${formatYear(y)}?`,
    options,
    answer,
    explanation: `The ${civ.name} lasted from ${formatYear(civ.start, { circa: civ.circa })} to ${formatYear(civ.end)}. The others did not exist in ${formatYear(y)}.`,
    fact: civ.description,
    year: y,
    civId: civ.id,
  }
}

function orderQuestion(_d: Difficulty, r: () => number): QuizQuestion | null {
  const evs = shuffle(EVENTS, r).slice(0, 4)
  if (new Set(evs.map((e) => e.y)).size < 4) return null
  const first = [...evs].sort((a, b) => a.y - b.y)[0]
  const options = evs.map((e) => e.title)
  return {
    id: `order-${evs.map((e) => e.id).join('-')}`,
    kind: 'order',
    prompt: 'Which of these happened first?',
    options,
    answer: options.indexOf(first.title),
    explanation: evs
      .sort((a, b) => a.y - b.y)
      .map((e) => `${e.title}: ${formatYear(e.y, { circa: e.circa })}`)
      .join(' → '),
    fact: first.description,
    year: first.y,
    highlight: { name: first.place, year: first.y, lon: first.lon, lat: first.lat },
  }
}

function borderQuestion(d: Difficulty, r: () => number): QuizQuestion | null {
  const civ = pick(civPool(d).filter((c) => civSnapshots(c.id).length >= 2), r)
  const snaps = civSnapshots(civ.id)
  // aggregate by year
  const byYear = new Map<number, number>()
  for (const s of snaps) byYear.set(s.year, (byYear.get(s.year) ?? 0) + s.area)
  const years = [...byYear.keys()].sort((a, b) => a - b)
  if (years.length < 2) return null
  const i = Math.floor(r() * (years.length - 1))
  const a = years[i]
  const b = years[i + 1]
  const da = byYear.get(a)!
  const db = byYear.get(b)!
  const change = (db - da) / Math.max(1, da)
  if (Math.abs(change) < 0.05) return null
  const correct = change > 0 ? 'It expanded' : 'It contracted'
  const options = ['It expanded', 'It contracted', 'Its borders did not change', 'It did not exist in either year']
  return {
    id: `border-${civ.id}-${a}-${b}`,
    kind: 'border',
    prompt: `Between ${formatYear(a)} and ${formatYear(b)}, what happened to the territory of the ${civ.name}?`,
    options,
    answer: options.indexOf(correct),
    explanation: `Mapped area went from about ${Math.round(da / 1000).toLocaleString()} thousand km² to ${Math.round(db / 1000).toLocaleString()} thousand km² (${change > 0 ? '+' : ''}${Math.round(change * 100)}%), measured from the dataset polygons.`,
    fact: civ.timeline.find((t) => t.y >= a && t.y <= b)?.text ?? civ.description,
    year: b,
    civId: civ.id,
    highlight: snaps.find((s) => s.year === b),
  }
}

const MAKERS: Record<QuizKind, (d: Difficulty, r: () => number) => QuizQuestion | null> = {
  region: regionQuestion,
  capital: capitalQuestion,
  period: periodQuestion,
  order: orderQuestion,
  border: borderQuestion,
}

export function makeQuiz(seed: number, difficulty: Difficulty, count = 8, kinds: QuizKind[] = ['region', 'capital', 'period', 'order', 'border']): QuizQuestion[] {
  const r = rng(seed)
  const out: QuizQuestion[] = []
  const seen = new Set<string>()
  let guard = 0
  while (out.length < count && guard++ < 400) {
    const kind = kinds[out.length % kinds.length]
    const q = MAKERS[kind](difficulty, r)
    if (q && !seen.has(q.id) && q.options.length === 4 && q.answer >= 0) {
      seen.add(q.id)
      out.push(q)
    }
  }
  return out
}

export function dailySeed(d = new Date()): number {
  return d.getFullYear() * 10000 + (d.getMonth() + 1) * 100 + d.getDate()
}

export function dailyDiscovery(d = new Date()) {
  const r = rng(dailySeed(d))
  return EVENTS[Math.floor(r() * EVENTS.length)]
}

export const SNAPSHOT_COUNT = SNAPSHOT_YEARS.length
