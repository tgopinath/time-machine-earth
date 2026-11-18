import { CIV_TYPE_LABEL, civForFeature } from '../data/civilizations'

/**
 * Distinguish what kind of entity a dataset polygon represents. Curated links win;
 * otherwise a conservative heuristic based on the dataset's own naming.
 */
export function classifyTerritory(name: string, subjectTo: string | null, year: number): { label: string; key: string } {
  const civ = civForFeature(name, subjectTo, year)
  if (civ && civ.matchNames.includes(name)) return { label: CIV_TYPE_LABEL[civ.type], key: civ.type }
  if (subjectTo) return { label: `Dependency / colony of ${subjectTo}`, key: 'colonial' }
  if (/hunter|gatherer|farmers|pastoral|culture|complex|peoples|tribes|nomad|foragers|fishing|shellfish/i.test(name))
    return { label: 'Cultural / ethnographic region', key: 'cultural' }
  if (/civilization/i.test(name)) return { label: 'Archaeological civilization', key: 'archaeological' }
  if (year >= 1945) return { label: 'Sovereign state or territory', key: 'modern-state' }
  if (/empire|caliphate|khanate|sultanate|dynasty/i.test(name)) return { label: 'Empire / imperial state', key: 'empire' }
  return { label: 'Political entity', key: 'political' }
}
