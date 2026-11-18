import { describe, expect, it } from 'vitest'
import { toAstro, fromAstro, formatYear, parseYear, yearsBetween, inInterval, overlaps, clampYear, MIN_YEAR } from '../lib/chrono'

describe('BCE/CE conversion', () => {
  it('maps 1 BCE to astronomical 0 and 1 CE to 1 (no year zero)', () => {
    expect(toAstro(1, 'BCE')).toBe(0)
    expect(toAstro(1, 'CE')).toBe(1)
    expect(toAstro(500, 'BCE')).toBe(-499)
    expect(toAstro(3000, 'BCE')).toBe(-2999)
  })
  it('round-trips', () => {
    for (const y of [-2999, -499, -1, 0, 1, 2, 1500, 2026]) {
      const { year, era } = fromAstro(y)
      expect(toAstro(year, era)).toBe(y)
    }
  })
  it('rejects year 0 and non-integers', () => {
    expect(() => toAstro(0, 'CE')).toThrow()
    expect(() => toAstro(1.5, 'BCE')).toThrow()
  })
  it('formats', () => {
    expect(formatYear(0)).toBe('1 BCE')
    expect(formatYear(1)).toBe('1 CE')
    expect(formatYear(-499)).toBe('500 BCE')
    expect(formatYear(-2559, { circa: true })).toBe('c. 2560 BCE')
    expect(formatYear(1500, { short: true })).toBe('1500')
  })
  it('counts elapsed years across the era boundary correctly', () => {
    // 1 BCE -> 1 CE is one year, not two
    expect(yearsBetween(toAstro(1, 'BCE'), toAstro(1, 'CE'))).toBe(1)
    // 44 BCE -> 14 CE = 57 years
    expect(yearsBetween(toAstro(44, 'BCE'), 14)).toBe(57)
  })
})

describe('parseYear', () => {
  it.each([
    ['500 BCE', -499],
    ['500 BC', -499],
    ['500 b.c.', -499],
    ['-500', -499],
    ['AD 1200', 1200],
    ['1200 CE', 1200],
    ['c. 1500', 1500],
    ['1500', 1500],
    ['1 CE', 1],
    ['1 BCE', 0],
    ['3rd century BCE', -299],
    ['15th century', 1401],
  ])('%s -> %i', (s, y) => expect(parseYear(s)).toBe(y))
  it('returns null for year 0 and junk', () => {
    expect(parseYear('0')).toBeNull()
    expect(parseYear('hello')).toBeNull()
  })
  it('understands today', () => expect(parseYear('today')).toBe(new Date().getFullYear()))
})

describe('intervals', () => {
  it('closed intervals', () => {
    expect(inInterval(1526, 1526, 1857)).toBe(true)
    expect(inInterval(1500, 1526, 1857)).toBe(false)
    expect(overlaps(-499, -321, -321, -184)).toBe(true)
    expect(overlaps(1, 10, 11, 20)).toBe(false)
  })
  it('clamps to the supported range', () => {
    expect(clampYear(-5000)).toBe(MIN_YEAR)
    expect(clampYear(99999)).toBe(new Date().getFullYear())
  })
})
