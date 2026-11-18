/**
 * Chronology engine.
 *
 * Internally every date is an ASTRONOMICAL year number (ISO 8601 style):
 *   1 CE  ->  1
 *   1 BCE ->  0
 *   2 BCE -> -1
 *   N BCE -> 1 - N
 *
 * The conventional BCE/CE calendar has no year zero (1 BCE is followed
 * directly by 1 CE). Astronomical numbering lets us do plain arithmetic for
 * intervals and ordering while the display layer converts back to BCE/CE.
 */

export type Era = 'BCE' | 'CE'

export type Precision = 'day' | 'year' | 'decade' | 'century' | 'millennium'

/** A historical date with explicit precision (most ancient dates are approximate). */
export interface HistDate {
  /** astronomical year */
  y: number
  precision?: Precision
  circa?: boolean
}

export const CURRENT_YEAR = new Date().getFullYear()
/** 3000 BCE */
export const MIN_YEAR = toAstro(3000, 'BCE')
export const MAX_YEAR = CURRENT_YEAR

export function toAstro(year: number, era: Era): number {
  if (!Number.isInteger(year) || year < 1) throw new RangeError(`Calendar years start at 1 (got ${year})`)
  return era === 'BCE' ? 1 - year : year
}

export function fromAstro(y: number): { year: number; era: Era } {
  return y <= 0 ? { year: 1 - y, era: 'BCE' } : { year: y, era: 'CE' }
}

export function formatYear(y: number, opts: { circa?: boolean; short?: boolean } = {}): string {
  const { year, era } = fromAstro(Math.round(y))
  const c = opts.circa ? 'c. ' : ''
  if (opts.short && era === 'CE') return `${c}${year}`
  return `${c}${year.toLocaleString('en-US', { useGrouping: false })} ${era}`
}

export function formatHistDate(d: HistDate): string {
  return formatYear(d.y, { circa: d.circa ?? (d.precision === 'century' || d.precision === 'millennium') })
}

export function formatRange(a: number, b: number, circa = false): string {
  const A = fromAstro(a)
  const B = fromAstro(b)
  const c = circa ? 'c. ' : ''
  if (A.era === B.era) return `${c}${A.year}–${B.year} ${A.era}`
  return `${c}${A.year} BCE – ${B.year} CE`
}

/** Number of calendar years elapsed between two astronomical years. */
export function yearsBetween(a: number, b: number): number {
  return Math.abs(b - a)
}

/**
 * Parse a free-text year. Accepts "500 BCE", "500 BC", "AD 1200", "1200 CE",
 * "c. 1500", "1500", "today", "now", "3rd century BCE" (-> midpoint is NOT
 * assumed: returns the first year of the century) and a leading minus sign,
 * which historians use for BCE ("-500" = 500 BCE).
 * Returns an astronomical year or null.
 */
export function parseYear(input: string): number | null {
  const s = input.trim().toLowerCase().replace(/[,.]/g, ' ').replace(/\s+/g, ' ')
  if (/^(today|now|present|present day)$/.test(s)) return CURRENT_YEAR
  const cent = s.match(/(\d{1,2})(?:st|nd|rd|th) century(?: (bce|bc|ce|ad))?/)
  if (cent) {
    const n = Number(cent[1])
    const bce = cent[2] === 'bce' || cent[2] === 'bc'
    return bce ? toAstro(n * 100, 'BCE') : (n - 1) * 100 + 1
  }
  const m = s.match(/(?:^|\s)(?:c\s|circa\s|ca\s)?(ad\s|ce\s)?(-)?(\d{1,4})\s?(bce|bc|b c e|b c|ce|ad|a d)?(?:\s|$)/)
  if (!m) return null
  const num = Number(m[3])
  if (num === 0) return null // there is no year 0 in BCE/CE
  const suffix = m[4]?.replace(/\s/g, '')
  const bce = m[2] === '-' || suffix === 'bce' || suffix === 'bc'
  return bce ? toAstro(num, 'BCE') : num
}

export function clampYear(y: number): number {
  return Math.min(MAX_YEAR, Math.max(MIN_YEAR, Math.round(y)))
}

/** Closed-interval membership: does [start, end] contain y? */
export function inInterval(y: number, start: number, end: number): boolean {
  return y >= start && y <= end
}

/** Do two closed intervals overlap? */
export function overlaps(a0: number, a1: number, b0: number, b1: number): boolean {
  return a0 <= b1 && b0 <= a1
}

export interface QuickPeriod {
  label: string
  y: number
}

export const QUICK_PERIODS: QuickPeriod[] = [
  { label: '3000 BCE', y: toAstro(3000, 'BCE') },
  { label: '2000 BCE', y: toAstro(2000, 'BCE') },
  { label: '1000 BCE', y: toAstro(1000, 'BCE') },
  { label: '500 BCE', y: toAstro(500, 'BCE') },
  { label: '1 CE', y: 1 },
  { label: '500', y: 500 },
  { label: '1000', y: 1000 },
  { label: '1200', y: 1200 },
  { label: '1500', y: 1500 },
  { label: '1700', y: 1700 },
  { label: '1800', y: 1800 },
  { label: '1900', y: 1900 },
  { label: '1945', y: 1945 },
  { label: '2000', y: 2000 },
  { label: 'Today', y: CURRENT_YEAR },
]

/** Era label used in the timeline header. */
export function eraName(y: number): string {
  if (y < toAstro(1200, 'BCE')) return 'Bronze Age'
  if (y < toAstro(500, 'BCE')) return 'Iron Age'
  if (y < 500) return 'Classical Antiquity'
  if (y < 1000) return 'Early Middle Ages'
  if (y < 1500) return 'High & Late Middle Ages'
  if (y < 1800) return 'Early Modern Period'
  if (y < 1914) return 'Age of Revolutions & Empire'
  if (y < 1946) return 'World Wars Era'
  if (y < 1991) return 'Cold War Era'
  return 'Contemporary'
}
