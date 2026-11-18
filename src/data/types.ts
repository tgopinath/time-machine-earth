// Internal schema. All years are astronomical (see lib/chrono.ts).

export interface Source {
  label: string
  url: string
}

export type CivType =
  | 'empire'
  | 'kingdom'
  | 'dynasty'
  | 'caliphate'
  | 'republic'
  | 'confederacy'
  | 'colonial'
  | 'archaeological'
  | 'cultural'
  | 'modern-state'

export interface Ruler {
  name: string
  reignStart: number
  reignEnd: number
  circa?: boolean
  note?: string
}

export interface Capital {
  name: string
  lat: number
  lon: number
  from: number
  to: number
}

export interface Milestone {
  y: number
  circa?: boolean
  text: string
}

export interface Civilization {
  id: string
  name: string
  alternateNames: string[]
  start: number
  end: number
  circa?: boolean
  type: CivType
  region: string
  color: string
  capitals: Capital[]
  rulers: Ruler[]
  languages: string[]
  religions: string[]
  majorCities: string[]
  description: string
  /** short, sourced statements about population/extent; omitted when no reliable estimate exists */
  facts?: string[]
  timeline: Milestone[]
  /** feature NAME values in the historical-basemaps dataset that represent this entity */
  matchNames: string[]
  /** dependencies whose SUBJECTO equals one of these also belong to this entity (colonial empires) */
  matchSubjects?: string[]
  /** a good year to view this entity on the map */
  focusYear: number
  center: [number, number]
  zoom: number
  sources: Source[]
}

export type EventType = 'war' | 'political' | 'discovery' | 'revolution' | 'independence' | 'cultural' | 'trade'

export interface HistEvent {
  id: string
  title: string
  y: number
  yEnd?: number
  circa?: boolean
  dateLabel?: string
  place: string
  lat: number
  lon: number
  type: EventType
  participants: string[]
  description: string
  impact: string
  relatedCivs: string[]
  mapChange?: string
  sources: Source[]
}

export interface CityEra {
  y: number
  yEnd?: number
  circa?: boolean
  name?: string
  ruler?: string
  text: string
}

export interface City {
  id: string
  name: string
  alternateNames: string[]
  country: string
  lat: number
  lon: number
  founded: string
  foundedY: number
  population?: string
  significance: string
  landmarks: string[]
  eras: CityEra[]
  sources: Source[]
}

export interface Site {
  id: string
  name: string
  lat: number
  lon: number
  start: number
  end: number
  culture: string
  note: string
  source: Source
}

export interface TradeRoute {
  id: string
  name: string
  start: number
  end: number
  color: string
  coords: [number, number][]
  note: string
  source: Source
}

export type PeriodKind = 'archaeological' | 'cultural' | 'political' | 'colonial' | 'modern'

export interface CountryPeriod {
  label: string
  start: number
  end: number
  circa?: boolean
  kind: PeriodKind
  civId?: string
  text: string
}

export interface CountryHistory {
  id: string
  name: string
  aliases: string[]
  bbox: [number, number, number, number]
  modernName: string
  periods: CountryPeriod[]
  sources: Source[]
}
