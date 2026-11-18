// Data ingestion pipeline: fetches every historical-basemaps snapshot and
// normalises it into a compact territory index used by search, quizzes and
// civilization matching. Geometry itself is streamed at runtime per snapshot.
//   node scripts/build-index.mjs
import { writeFileSync } from 'node:fs'
import * as turf from '@turf/turf'

const REPO = 'https://cdn.jsdelivr.net/gh/aourednik/historical-basemaps@master/geojson'
const FILES = ['bc3000','bc2000','bc1500','bc1000','bc700','bc500','bc400','bc323','bc300','bc200','bc100','bc1',
  '100','200','300','400','500','600','700','800','900','1000','1100','1200','1279','1300','1400','1492','1500',
  '1530','1600','1650','1700','1715','1783','1800','1815','1880','1900','1914','1920','1930','1938','1945','1960','1994','2000','2010']
const astro = (f) => f.startsWith('bc') ? 1 - Number(f.slice(2)) : Number(f)

const index = {} // name -> [[year, lon, lat, precision, areaKm2, subjectTo|null], ...]
const snapshots = []
for (const f of FILES) {
  const res = await fetch(`${REPO}/world_${f}.geojson`)
  if (!res.ok) throw new Error(`${f}: ${res.status}`)
  const gj = await res.json()
  const year = astro(f)
  const byName = new Map()
  for (const ft of gj.features) {
    const name = (ft.properties?.NAME || '').trim()
    if (!name || !ft.geometry) continue
    const cur = byName.get(name) || { area: 0, best: null, bestArea: -1, prec: ft.properties.BORDERPRECISION ?? 1, subj: ft.properties.SUBJECTO }
    let a = 0
    try { a = turf.area(ft) / 1e6 } catch {}
    cur.area += a
    if (a > cur.bestArea) { cur.bestArea = a; cur.best = ft }
    byName.set(name, cur)
  }
  for (const [name, v] of byName) {
    let c = [0, 0]
    try { c = turf.centerOfMass(v.best).geometry.coordinates } catch {}
    const subj = v.subj && v.subj.trim() && v.subj.trim() !== name ? v.subj.trim() : null
    ;(index[name] ||= []).push([year, +c[0].toFixed(2), +c[1].toFixed(2), v.prec, Math.round(v.area), subj])
  }
  snapshots.push({ file: `world_${f}.geojson`, year, features: gj.features.length })
  console.log(f, year, gj.features.length)
}
writeFileSync('src/data/generated/territory-index.json', JSON.stringify(index))
writeFileSync('src/data/generated/snapshots.json', JSON.stringify(snapshots, null, 1))
console.log('names', Object.keys(index).length)
