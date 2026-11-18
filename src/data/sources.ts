import type { Source } from './types'

export const wp = (page: string, label?: string): Source => ({
  label: label ?? `Wikipedia — ${page.replace(/_/g, ' ')}`,
  url: `https://en.wikipedia.org/wiki/${page}`,
})

export const brit = (path: string, label: string): Source => ({
  label: `Encyclopaedia Britannica — ${label}`,
  url: `https://www.britannica.com/${path}`,
})

/** BCE year -> astronomical year */
export const bce = (n: number) => 1 - n

export const DATASETS: (Source & { license: string; use: string })[] = [
  {
    label: 'historical-basemaps (A. Ourednik)',
    url: 'https://github.com/aourednik/historical-basemaps',
    license: 'GPL-3.0',
    use: 'Historical political boundaries for 48 snapshot years (3000 BCE – 2010 CE), with BORDERPRECISION and SUBJECTO attributes.',
  },
  {
    label: 'Natural Earth',
    url: 'https://www.naturalearthdata.com/',
    license: 'Public domain',
    use: 'Land, coastlines, rivers, lakes, marine and mountain-range labels, and current (de facto) country boundaries.',
  },
  {
    label: 'Esri World Shaded Relief',
    url: 'https://www.arcgis.com/home/item.html?id=9c5370d0b54f4de1b48a3792d7377ff2',
    license: 'Esri terms of use, attribution required',
    use: 'Optional terrain hillshade layer.',
  },
  {
    label: 'Wikipedia / Encyclopaedia Britannica',
    url: 'https://en.wikipedia.org/',
    license: 'CC BY-SA (Wikipedia); citation only (Britannica)',
    use: 'Reference for curated civilization, ruler, city and event records. Every curated record links its own references.',
  },
]

/** Researched but not ingested — kept here so the data-source page is honest about coverage. */
export const EVALUATED_SOURCES: { name: string; url: string; finding: string }[] = [
  { name: 'World Historical Gazetteer', url: 'https://whgazetteer.org/', finding: 'Place names with temporal attestations; points, not polygon boundaries. Candidate for future city-name variants.' },
  { name: 'Pleiades', url: 'https://pleiades.stoa.org/', finding: 'Ancient Mediterranean places (CC BY). Points and a few polygons; no political boundaries.' },
  { name: 'GeoNames', url: 'https://www.geonames.org/', finding: 'Modern gazetteer (CC BY). Useful for modern city coordinates, no historical borders.' },
  { name: 'Wikidata', url: 'https://www.wikidata.org/', finding: 'Start/end dates and capitals for states (CC0). Coverage uneven; no geometry.' },
  { name: 'Library of Congress / David Rumsey', url: 'https://www.davidrumsey.com/', finding: 'Scanned historical maps (rasters). Licensing varies per item; not vectorised, so not used for boundaries.' },
  { name: 'OpenStreetMap', url: 'https://www.openstreetmap.org/', finding: 'Modern context only (ODbL). Not used to avoid showing modern features as historical.' },
]
