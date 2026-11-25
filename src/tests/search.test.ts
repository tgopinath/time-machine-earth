import { beforeAll, describe, expect, it } from 'vitest'
import { search, interpretQuestion } from '../lib/search'
import { makeQuiz } from '../lib/quiz'
import { loadTerritoryIndex } from '../lib/territoryIndex'


beforeAll(() => loadTerritoryIndex())

describe('natural-language search', () => {
  it('What existed in India in 500 BCE?', () => {
    expect(interpretQuestion('What existed in India in 500 BCE?')?.action).toEqual({ type: 'region', regionId: 'india', year: -499 })
  })
  it('Who ruled Egypt in 1000 BCE?', () => {
    expect(interpretQuestion('Who ruled Egypt in 1000 BCE?')?.action).toEqual({ type: 'region', regionId: 'egypt', year: -999 })
  })
  it('What did Europe look like in 1500?', () => {
    expect(interpretQuestion('What did Europe look like in 1500?')?.action).toEqual({ type: 'region', regionId: 'europe', year: 1500 })
  })
  it('When did the Roman Empire fall?', () => {
    expect(interpretQuestion('When did the Roman Empire fall?')?.action).toEqual({ type: 'civ', id: 'rome', year: 476 })
  })
  it('How did the borders of Germany change?', () => {
    const a = interpretQuestion('How did the borders of Germany change?')?.action
    expect(a?.type).toBe('borders')
  })
  it('What existed before Chennai became Madras?', () => {
    expect(interpretQuestion('What existed before Chennai became Madras?')?.action).toEqual({ type: 'city', id: 'chennai' })
  })
  it('finds entities by name, alias and ruler', () => {
    expect(search('Madras')[0].action).toEqual({ type: 'city', id: 'chennai' })
    expect(search('Tawantinsuyu')[0].action).toMatchObject({ type: 'civ', id: 'inca' })
    expect(search('Ashoka').some((r) => r.kind === 'Ruler')).toBe(true)
    expect(search('500 BCE')[0].action).toEqual({ type: 'year', year: -499 })
  })
})

describe('quiz generation', () => {
  it('produces valid 4-option questions deterministically', () => {
    const a = makeQuiz(42, 'medium', 10)
    const b = makeQuiz(42, 'medium', 10)
    expect(a.map((q) => q.id)).toEqual(b.map((q) => q.id))
    expect(a.length).toBe(10)
    for (const q of a) {
      expect(q.options).toHaveLength(4)
      expect(new Set(q.options).size).toBe(4)
      expect(q.answer).toBeGreaterThanOrEqual(0)
    }
  })
})
