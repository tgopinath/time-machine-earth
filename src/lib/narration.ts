import { civsAt, CIV_BY_ID } from '../data/civilizations'
import { eventsBetween } from '../data/events'
import { formatYear } from './chrono'

/**
 * A factual summary of a transition between two snapshot years, built only
 * from curated records (no generated prose about undocumented changes).
 */
export function narrateTransition(fromYear: number, toYear: number): string | null {
  const a = new Set(civsAt(fromYear).map((c) => c.id))
  const b = new Set(civsAt(toYear).map((c) => c.id))
  const began = [...b].filter((x) => !a.has(x)).map((x) => CIV_BY_ID.get(x)!.name)
  const ended = [...a].filter((x) => !b.has(x)).map((x) => CIV_BY_ID.get(x)!.name)
  const evs = eventsBetween(fromYear + 1, toYear).slice(0, 3)
  const parts: string[] = []
  if (began.length) parts.push(`${list(began)} ${began.length > 1 ? 'appear' : 'appears'}`)
  if (ended.length) parts.push(`${list(ended)} ${ended.length > 1 ? 'end' : 'ends'}`)
  if (evs.length) parts.push(`events: ${evs.map((e) => `${e.title} (${formatYear(e.y, { circa: e.circa })})`).join('; ')}`)
  if (!parts.length) return null
  return `${formatYear(fromYear)} → ${formatYear(toYear)}: ${parts.join('. ')}.`
}

function list(xs: string[]): string {
  if (xs.length <= 2) return xs.join(' and ')
  return `${xs.slice(0, 2).join(', ')} and ${xs.length - 2} more`
}
