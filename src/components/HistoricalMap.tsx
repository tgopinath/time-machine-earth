import { useEffect, useRef, useState } from 'react'
import * as maplibregl from 'maplibre-gl'
import type { GeoJSONSource, Map as MLMap, MapGeoJSONFeature, StyleSpecification } from 'maplibre-gl'
import type { Feature, FeatureCollection, Point } from 'geojson'
import { snapshotFor } from '../lib/snapshots'
import { loadSnapshot, loadGeographyLabels, loadBaseLayer, type LoadedSnapshot } from '../lib/dataLoader'
import { CIVILIZATIONS } from '../data/civilizations'
import { EVENTS, EVENT_COLOR } from '../data/events'
import { SITES, TRADE_ROUTES } from '../data/atlas'
import { CITIES } from '../data/cities'
import type { LayerId, Selection, Camera } from '../store/app'
import type { BorderComparison } from '../lib/geo'
import type { EventType } from '../data/types'
import { classifyTerritory } from '../lib/classify'
import { eventWindow } from '../lib/eventWindow'

// The worker bundle is self-contained and copied verbatim to public/ (see the copy-worker
// script) so the dev server does not inject its client into it.
maplibregl.setWorkerUrl(`${import.meta.env.BASE_URL}maplibre-gl-worker.mjs`)

const EMPTY: FeatureCollection = { type: 'FeatureCollection', features: [] }
const FONT = 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf'

export { eventWindow }

/** A tiny pub/sub that keeps several maps' cameras in lockstep. */
export class SyncGroup {
  maps = new Set<MLMap>()
  private busy = false
  add(m: MLMap) {
    this.maps.add(m)
    const handler = () => {
      if (this.busy) return
      this.busy = true
      const c = { center: m.getCenter(), zoom: m.getZoom(), bearing: m.getBearing(), pitch: m.getPitch() }
      for (const o of this.maps) if (o !== m) o.jumpTo(c)
      this.busy = false
    }
    m.on('move', handler)
    return () => {
      m.off('move', handler)
      this.maps.delete(m)
    }
  }
}

function baseStyle(): StyleSpecification {
  return {
    version: 8,
    glyphs: FONT,
    sources: {
      land: { type: 'geojson', data: EMPTY },
      lakes: { type: 'geojson', data: EMPTY },
      rivers: { type: 'geojson', data: EMPTY },
      modern: { type: 'geojson', data: EMPTY },
      terrain: {
        type: 'raster',
        tiles: ['https://server.arcgisonline.com/ArcGIS/rest/services/World_Shaded_Relief/MapServer/tile/{z}/{y}/{x}'],
        tileSize: 256,
        maxzoom: 13,
        attribution: 'Relief © Esri',
      },
      territories: { type: 'geojson', data: EMPTY, attribution: 'Historical borders: <a href="https://github.com/aourednik/historical-basemaps">historical-basemaps</a> (GPL-3.0)' },
      labels: { type: 'geojson', data: EMPTY },
      geo: { type: 'geojson', data: EMPTY, attribution: '<a href="https://www.naturalearthdata.com/">Natural Earth</a>' },
      diff: { type: 'geojson', data: EMPTY },
      routes: { type: 'geojson', data: EMPTY },
      sites: { type: 'geojson', data: EMPTY },
      capitals: { type: 'geojson', data: EMPTY },
      events: { type: 'geojson', data: EMPTY },
      cities: { type: 'geojson', data: EMPTY },
      focus: { type: 'geojson', data: EMPTY },
    },
    layers: [
      { id: 'ocean', type: 'background', paint: { 'background-color': '#1d3148' } },
      { id: 'land', type: 'fill', source: 'land', paint: { 'fill-color': '#e9dfc6' } },
      { id: 'terrain', type: 'raster', source: 'terrain', layout: { visibility: 'none' }, paint: { 'raster-opacity': 0.42, 'raster-saturation': -0.6 } },
      {
        id: 'territory-fill', type: 'fill', source: 'territories',
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.58, 'fill-opacity-transition': { duration: 350 } },
      },
      { id: 'territory-hatch', type: 'fill', source: 'territories', filter: ['<=', ['get', 'prec'], 1], paint: { 'fill-pattern': 'hatch', 'fill-opacity': 0.5 } },
      { id: 'lakes', type: 'fill', source: 'lakes', paint: { 'fill-color': '#2a4462' } },
      { id: 'rivers', type: 'line', source: 'rivers', minzoom: 2, paint: { 'line-color': '#5f7f9e', 'line-width': ['interpolate', ['linear'], ['zoom'], 2, 0.4, 6, 1.2], 'line-opacity': 0.8 } },
      { id: 'diff-fill', type: 'fill', source: 'diff', paint: { 'fill-color': ['match', ['get', 'k'], 'gained', '#3f7d4e', 'lost', '#b0473c', '#8a8170'], 'fill-opacity': ['match', ['get', 'k'], 'kept', 0.45, 0.72] } },
      { id: 'diff-line', type: 'line', source: 'diff', paint: { 'line-color': ['match', ['get', 'k'], 'gained', '#25542f', 'lost', '#7a2b24', '#4a453d'], 'line-width': 1 } },
      {
        id: 'territory-line', type: 'line', source: 'territories',
        paint: { 'line-color': '#5a4a36', 'line-opacity': 0.55, 'line-width': ['interpolate', ['linear'], ['zoom'], 1, 0.3, 6, 1.1], 'line-dasharray': ['case', ['<=', ['get', 'prec'], 1], ['literal', [2, 1.5]], ['literal', [1, 0]]] },
      },
      { id: 'colonial-line', type: 'line', source: 'territories', filter: ['!=', ['get', 'subj'], null], layout: { visibility: 'none' }, paint: { 'line-color': '#7f2d26', 'line-width': 1.6, 'line-dasharray': [3, 1.5] } },
      { id: 'modern-line', type: 'line', source: 'modern', layout: { visibility: 'none' }, paint: { 'line-color': '#1b1b1b', 'line-width': 0.9, 'line-dasharray': [1.5, 1.5], 'line-opacity': 0.75 } },
      { id: 'focus-line', type: 'line', source: 'territories', filter: ['==', ['get', 'name'], '__none__'], paint: { 'line-color': '#7f5626', 'line-width': 2.6 } },
      { id: 'routes-line', type: 'line', source: 'routes', layout: { visibility: 'none', 'line-cap': 'round' }, paint: { 'line-color': ['get', 'color'], 'line-width': 2.2, 'line-dasharray': [2, 1.2], 'line-opacity': 0.9 } },
      { id: 'routes-label', type: 'symbol', source: 'routes', layout: { visibility: 'none', 'symbol-placement': 'line', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-size': 11, 'text-letter-spacing': 0.05 }, paint: { 'text-color': '#2b2420', 'text-halo-color': '#f6f1e6', 'text-halo-width': 1.4 } },
      {
        id: 'geo-labels', type: 'symbol', source: 'geo',
        layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-size': ['interpolate', ['linear'], ['zoom'], 1, ['match', ['get', 'kind'], 'sea', 9, 9.5], 5, ['match', ['get', 'kind'], 'sea', 13, 11]], 'text-letter-spacing': ['match', ['get', 'kind'], 'sea', 0.18, 0.08], 'text-max-width': 8, 'symbol-sort-key': ['get', 'rank'], 'text-optional': true },
        paint: { 'text-color': ['match', ['get', 'kind'], 'sea', '#9db3c9', '#7a6448'], 'text-halo-color': ['match', ['get', 'kind'], 'sea', '#1d3148', '#e9dfc6'], 'text-halo-width': 0.8 },
      },
      ...((['major', 'mid', 'minor'] as const).map((tier) => ({
        id: `label-${tier}`,
        type: 'symbol' as const,
        source: 'labels',
        minzoom: tier === 'major' ? 0 : tier === 'mid' ? 2.6 : 4,
        filter: (tier === 'major' ? ['>=', ['get', 'area'], 600000] : tier === 'mid' ? ['all', ['<', ['get', 'area'], 600000], ['>=', ['get', 'area'], 40000]] : ['<', ['get', 'area'], 40000]) as maplibregl.FilterSpecification,
        layout: {
          'text-field': ['get', 'name'],
          'text-font': ['Noto Sans Medium'],
          'text-size': tier === 'major' ? ['interpolate', ['linear'], ['zoom'], 1, 10, 5, 15] : tier === 'mid' ? 11 : 10,
          'text-transform': tier === 'major' ? 'uppercase' : 'none',
          'text-letter-spacing': tier === 'major' ? 0.12 : 0.03,
          'text-max-width': 7,
          'symbol-sort-key': ['-', 0, ['get', 'area']],
          'text-padding': 4,
        } as maplibregl.SymbolLayerSpecification['layout'],
        paint: { 'text-color': '#2b2620', 'text-halo-color': 'rgba(246,241,230,0.9)', 'text-halo-width': 1.3, 'text-opacity': ['case', ['<=', ['get', 'prec'], 1], 0.78, 1] },
      })) as unknown as maplibregl.LayerSpecification[]),
      { id: 'sites', type: 'circle', source: 'sites', layout: { visibility: 'none' }, paint: { 'circle-radius': 4.5, 'circle-color': '#f6f1e6', 'circle-stroke-color': '#6b4a2a', 'circle-stroke-width': 1.6 } },
      { id: 'sites-label', type: 'symbol', source: 'sites', minzoom: 3.5, layout: { visibility: 'none', 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Italic'], 'text-size': 10.5, 'text-offset': [0, 1.1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': '#4d3a26', 'text-halo-color': '#f6f1e6', 'text-halo-width': 1.2 } },
      { id: 'cities', type: 'circle', source: 'cities', paint: { 'circle-radius': 3, 'circle-color': '#26231f', 'circle-stroke-color': '#f6f1e6', 'circle-stroke-width': 1 } },
      { id: 'cities-label', type: 'symbol', source: 'cities', minzoom: 3, layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Regular'], 'text-size': 10.5, 'text-offset': [0, 0.9], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': '#26231f', 'text-halo-color': '#f6f1e6', 'text-halo-width': 1.2 } },
      { id: 'capitals-ring', type: 'circle', source: 'capitals', paint: { 'circle-radius': 7.5, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#7f2d26', 'circle-stroke-width': 1.2 } },
      { id: 'capitals', type: 'circle', source: 'capitals', paint: { 'circle-radius': 4, 'circle-color': '#7f2d26', 'circle-stroke-color': '#fbf8f1', 'circle-stroke-width': 1.5 } },
      { id: 'capitals-label', type: 'symbol', source: 'capitals', minzoom: 2.5, layout: { 'text-field': ['get', 'name'], 'text-font': ['Noto Sans Medium'], 'text-size': 10.5, 'text-offset': [0, 1], 'text-anchor': 'top', 'text-optional': true }, paint: { 'text-color': '#5c1f1a', 'text-halo-color': '#f6f1e6', 'text-halo-width': 1.3 } },
      { id: 'events-halo', type: 'circle', source: 'events', paint: { 'circle-radius': 11, 'circle-color': ['get', 'color'], 'circle-opacity': ['interpolate', ['linear'], ['get', 'closeness'], 0, 0, 1, 0.25] } },
      { id: 'events', type: 'circle', source: 'events', paint: { 'circle-radius': 6, 'circle-color': ['get', 'color'], 'circle-stroke-color': '#fbf8f1', 'circle-stroke-width': 1.8, 'circle-opacity': ['interpolate', ['linear'], ['get', 'closeness'], 0, 0.55, 1, 1] } },
      { id: 'focus-point', type: 'circle', source: 'focus', paint: { 'circle-radius': 10, 'circle-color': 'rgba(0,0,0,0)', 'circle-stroke-color': '#9a6b34', 'circle-stroke-width': 3 } },
    ],
  }
}

function hatchImage(): ImageData {
  const size = 8
  const data = new Uint8ClampedArray(size * size * 4)
  for (let y = 0; y < size; y++)
    for (let x = 0; x < size; x++) {
      const on = (x + y) % size === 0 || (x + y) % size === size - 1
      const i = (y * size + x) * 4
      data[i] = 70
      data[i + 1] = 55
      data[i + 2] = 40
      data[i + 3] = on ? 110 : 0
    }
  return new ImageData(data, size, size)
}

export interface HistoricalMapProps {
  year: number
  layers: LayerId[]
  eventFilter?: EventType[]
  projection?: 'mercator' | 'globe'
  initialCamera?: Camera
  onCamera?: (c: Camera) => void
  flyTo?: { center?: [number, number]; zoom?: number; bbox?: [number, number, number, number]; nonce: number } | null
  onSelect?: (s: Selection) => void
  selectedName?: string | null
  focusCiv?: string | null
  outlineCiv?: string | null
  focusPoint?: [number, number] | null
  diff?: BorderComparison | null
  sync?: SyncGroup
  markers?: boolean
  onSnapshot?: (s: LoadedSnapshot | null, loading: boolean, error: string | null) => void
  interactive?: boolean
  hideLabels?: boolean
  attribution?: boolean
  reduceMotion?: boolean
  className?: string
  label?: string
}

export function HistoricalMap(props: HistoricalMapProps) {
  const {
    year, layers, eventFilter, projection = 'mercator', initialCamera, onCamera, flyTo, onSelect, selectedName, focusCiv, outlineCiv, focusPoint, diff, sync,
    markers = true, onSnapshot, interactive = true, hideLabels = false, attribution = true, reduceMotion, className, label,
  } = props
  const el = useRef<HTMLDivElement>(null)
  const mapRef = useRef<MLMap | null>(null)
  const [ready, setReady] = useState(false)
  const [hover, setHover] = useState<{ x: number; y: number; text: string; sub?: string } | null>(null)
  const [snapState, setSnapState] = useState<{ loading: boolean; error: string | null }>({ loading: true, error: null })
  const cb = useRef({ onSelect, onCamera, onSnapshot })
  cb.current = { onSelect, onCamera, onSnapshot }
  const latest = useRef({ layers, focusCiv, diff })
  latest.current = { layers, focusCiv, diff }
  const snapYear = snapshotFor(year).snapshot.year

  // --- create map once
  useEffect(() => {
    if (!el.current) return
    const map = new maplibregl.Map({
      container: el.current,
      style: baseStyle(),
      center: initialCamera?.center ?? [40, 25],
      zoom: initialCamera?.zoom ?? 1.6,
      minZoom: 0.6,
      maxZoom: 9,
      attributionControl: attribution ? { compact: true } : false,
      interactive,
      renderWorldCopies: true,
    })
    mapRef.current = map
    if (import.meta.env.DEV) ((window as unknown as { __maps: MLMap[] }).__maps ??= []).push(map)
    map.on('error', (e) => console.warn('[map]', e.error?.message ?? e))
    if (import.meta.env.DEV) {
      map.on('load', () => console.debug('[map] load'))
    }
    if (interactive) map.addControl(new maplibregl.NavigationControl({ visualizePitch: true }), 'top-left')
    map.on('styleimagemissing', (e) => {
      if (e.id === 'hatch' && !map.hasImage('hatch')) map.addImage('hatch', hatchImage())
    })
    map.on('load', () => {
      if (!map.hasImage('hatch')) map.addImage('hatch', hatchImage())
      setReady(true)
      // base geography is fetched on the main thread so it is cached in IndexedDB
      for (const key of ['land', 'lakes', 'rivers', 'modern'] as const)
        loadBaseLayer(key)
          .then((fc) => {
            if (import.meta.env.DEV) console.debug('[map] base', key, fc.features.length, !!map.getSource(key))
            ;(map.getSource(key) as GeoJSONSource | undefined)?.setData(fc)
          })
          .catch((err) => console.warn(`[map] ${key} failed`, err))
      loadGeographyLabels()
        .then((fc) => (map.getSource('geo') as GeoJSONSource | undefined)?.setData(fc))
        .catch(() => {})
    })
    map.on('moveend', () => {
      const c = map.getCenter()
      cb.current.onCamera?.({ center: [c.lng, c.lat], zoom: map.getZoom(), bearing: map.getBearing(), pitch: map.getPitch() })
    })
    const clickable = ['events', 'capitals', 'sites', 'cities', 'territory-fill']
    map.on('click', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: clickable.filter((l) => map.getLayer(l)) })
      const f = feats[0] as MapGeoJSONFeature | undefined
      if (!f) return
      const p = f.properties as Record<string, string>
      if (f.layer.id === 'events') cb.current.onSelect?.({ kind: 'event', id: p.id })
      else if (f.layer.id === 'capitals') cb.current.onSelect?.({ kind: 'civ', id: p.civ })
      else if (f.layer.id === 'sites') cb.current.onSelect?.({ kind: 'site', id: p.id })
      else if (f.layer.id === 'cities') cb.current.onSelect?.({ kind: 'city', id: p.id })
      else cb.current.onSelect?.({ kind: 'territory', name: p.name, year: Number(p.year) })
    })
    map.on('mousemove', (e) => {
      const feats = map.queryRenderedFeatures(e.point, { layers: clickable.filter((l) => map.getLayer(l)) })
      const f = feats[0]
      map.getCanvas().style.cursor = f ? 'pointer' : ''
      if (!f) return setHover(null)
      const p = f.properties as Record<string, string>
      const text = f.layer.id === 'events' ? p.title : p.name
      const sub = f.layer.id === 'territory-fill' ? (p.subj && p.subj !== 'null' ? `under ${p.subj}` : undefined) : f.layer.id === 'capitals' ? `Capital · ${p.civName}` : f.layer.id === 'events' ? p.date : undefined
      setHover({ x: e.point.x, y: e.point.y, text, sub })
    })
    map.on('mouseout', () => setHover(null))
    const unsync = sync?.add(map)
    return () => {
      unsync?.()
      map.remove()
      mapRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // --- projection
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    try {
      map.setProjection({ type: projection })
    } catch {
      /* older renderers */
    }
  }, [projection, ready])

  // --- territories for the snapshot
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    let cancelled = false
    const pick = snapshotFor(year).snapshot
    setSnapState({ loading: true, error: null })
    cb.current.onSnapshot?.(null, true, null)
    if (!reduceMotion && map.getLayer('territory-fill')) map.setPaintProperty('territory-fill', 'fill-opacity', 0.15)
    if (import.meta.env.DEV) console.debug('[map] load snapshot', pick.file)
    loadSnapshot(pick)
      .then((s) => {
        if (cancelled) return
        const terr = {
          ...s.territories,
          features: s.territories.features.map((f) => ({ ...f, properties: { ...f.properties, kind: classifyTerritory(f.properties.name, f.properties.subj, f.properties.year).key } })),
        }
        if (import.meta.env.DEV) console.debug('[map] territories', terr.features.length)
        ;(map.getSource('territories') as GeoJSONSource).setData(terr)
        ;(map.getSource('labels') as GeoJSONSource).setData(s.labels)
        setSnapState({ loading: false, error: null })
        cb.current.onSnapshot?.(s, false, null)
        applyEmphasis(map, latest.current.layers, latest.current.focusCiv, !!latest.current.diff)
      })
      .catch((err: Error) => {
        if (cancelled) return
        setSnapState({ loading: false, error: err.message })
        cb.current.onSnapshot?.(null, false, err.message)
        applyEmphasis(map, latest.current.layers, latest.current.focusCiv, !!latest.current.diff)
      })
    return () => {
      cancelled = true
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [snapYear, ready])

  // --- layer visibility & emphasis
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const vis = (id: string, on: boolean) => map.getLayer(id) && map.setLayoutProperty(id, 'visibility', on ? 'visible' : 'none')
    vis('terrain', layers.includes('terrain'))
    vis('modern-line', layers.includes('modern'))
    vis('colonial-line', layers.includes('colonial'))
    vis('routes-line', layers.includes('routes'))
    vis('routes-label', layers.includes('routes'))
    vis('sites', layers.includes('settlements'))
    vis('sites-label', layers.includes('settlements'))
    vis('capitals', markers && layers.includes('capitals'))
    vis('capitals-ring', markers && layers.includes('capitals'))
    vis('capitals-label', markers && layers.includes('capitals'))
    vis('territory-hatch', layers.includes('uncertainty'))
    const anyTerr = layers.some((l) => ['political', 'empires', 'civilizations', 'colonial'].includes(l))
    for (const id of ['territory-fill', 'territory-line']) vis(id, anyTerr)
    for (const id of ['label-major', 'label-mid', 'label-minor']) vis(id, anyTerr && !hideLabels)
    applyEmphasis(map, layers, focusCiv, !!diff)
  }, [layers, ready, markers, focusCiv, diff, hideLabels])

  // --- markers that depend on the exact year
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const set = (id: string, fc: FeatureCollection) => (map.getSource(id) as GeoJSONSource | undefined)?.setData(fc)
    const caps: Feature<Point>[] = []
    for (const c of CIVILIZATIONS) {
      if (year < c.start || year > c.end) continue
      for (const k of c.capitals) if (year >= k.from && year <= k.to) caps.push({ type: 'Feature', geometry: { type: 'Point', coordinates: [k.lon, k.lat] }, properties: { name: k.name, civ: c.id, civName: c.name } })
    }
    set('capitals', { type: 'FeatureCollection', features: caps })
    const w = eventWindow(year)
    const showWar = layers.includes('battles')
    const showOther = layers.includes('events')
    const evs = markers
      ? EVENTS.filter((e) => (e.type === 'war' ? showWar : showOther) && (!eventFilter || eventFilter.includes(e.type)) && e.y - w <= year && (e.yEnd ?? e.y) + w >= year)
      : []
    set('events', {
      type: 'FeatureCollection',
      features: evs.map((e) => {
        const d = year < e.y ? e.y - year : year > (e.yEnd ?? e.y) ? year - (e.yEnd ?? e.y) : 0
        return { type: 'Feature', geometry: { type: 'Point', coordinates: [e.lon, e.lat] }, properties: { id: e.id, title: e.title, color: EVENT_COLOR[e.type], closeness: 1 - Math.min(1, d / w), date: e.y <= 0 ? `${1 - e.y} BCE` : String(e.y) } }
      }),
    })
    set('sites', { type: 'FeatureCollection', features: SITES.filter((s) => year >= s.start && year <= s.end).map((s) => ({ type: 'Feature', geometry: { type: 'Point', coordinates: [s.lon, s.lat] }, properties: { id: s.id, name: s.name } })) })
    set('routes', { type: 'FeatureCollection', features: TRADE_ROUTES.filter((r) => year >= r.start && year <= r.end).map((r) => ({ type: 'Feature', geometry: { type: 'LineString', coordinates: r.coords }, properties: { id: r.id, name: r.name, color: r.color } })) })
    set('cities', {
      type: 'FeatureCollection',
      features: markers ? CITIES.filter((c) => year >= c.foundedY).map((c) => {
        const era = [...c.eras].reverse().find((e) => e.name && e.y <= year)
        return { type: 'Feature', geometry: { type: 'Point', coordinates: [c.lon, c.lat] }, properties: { id: c.id, name: era?.name ?? c.name } }
      }) : [],
    })
  }, [year, layers, eventFilter, ready, markers])

  // --- selection, focus
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const oc = outlineCiv ?? focusCiv
    const filter: maplibregl.FilterSpecification = oc
      ? ['==', ['get', 'civ'], oc]
      : ['==', ['get', 'name'], selectedName ?? '__none__']
    map.setFilter('focus-line', filter)
    ;(map.getSource('focus') as GeoJSONSource).setData(focusPoint ? { type: 'Feature', geometry: { type: 'Point', coordinates: focusPoint }, properties: {} } : EMPTY)
  }, [selectedName, focusCiv, outlineCiv, focusPoint, ready])

  // --- border diff
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready) return
    const feats: Feature[] = []
    if (diff?.kept) feats.push({ ...diff.kept, properties: { k: 'kept' } })
    if (diff?.gained) feats.push({ ...diff.gained, properties: { k: 'gained' } })
    if (diff?.lost) feats.push({ ...diff.lost, properties: { k: 'lost' } })
    ;(map.getSource('diff') as GeoJSONSource).setData({ type: 'FeatureCollection', features: feats })
  }, [diff, ready])

  // --- camera commands
  useEffect(() => {
    const map = mapRef.current
    if (!map || !ready || !flyTo) return
    const opts = { duration: reduceMotion ? 0 : 1400, essential: true }
    if (flyTo.bbox) map.fitBounds([[flyTo.bbox[0], flyTo.bbox[1]], [flyTo.bbox[2], flyTo.bbox[3]]], { padding: 60, ...opts, maxZoom: 7 })
    else map.flyTo({ center: flyTo.center, zoom: flyTo.zoom ?? map.getZoom(), ...opts })
  }, [flyTo?.nonce, ready, reduceMotion]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div className={`overflow-hidden ${className ?? 'relative'}`}>
      {/* inline position: maplibre's unlayered `.maplibregl-map { position: relative }` would beat a Tailwind class */}
      <div ref={el} style={{ position: 'absolute', inset: 0 }} aria-label={label ?? 'Historical map'} role="region" />
      {hover && (
        <div className="pointer-events-none absolute z-10 rounded-md border border-line bg-paper/95 px-2.5 py-1.5 shadow-sm" style={{ left: hover.x + 14, top: hover.y + 10 }}>
          <div className="text-[12.5px] font-medium text-ink">{hover.text}</div>
          {hover.sub && <div className="text-[11px] text-muted">{hover.sub}</div>}
        </div>
      )}
      {snapState.loading && (
        <div className="absolute left-1/2 top-3 z-10 -translate-x-1/2 rounded-full border border-line bg-paper/95 px-3 py-1 text-[12px] text-ink-2 shadow-sm">
          Loading boundaries…
        </div>
      )}
      {snapState.error && (
        <div className="absolute left-1/2 top-3 z-10 max-w-sm -translate-x-1/2 rounded-md border border-loss/40 bg-paper px-3 py-2 text-[12px] text-loss shadow-sm">
          Boundary data could not be loaded ({snapState.error}). Check your connection — the base map and markers still work.
        </div>
      )}
    </div>
  )
}

function applyEmphasis(map: MLMap, layers: LayerId[], focusCiv?: string | null, diffMode = false) {
  if (!map.getLayer('territory-fill')) return
  const modes: unknown[] = []
  if (layers.includes('empires')) modes.push(['in', ['get', 'kind'], ['literal', ['empire', 'caliphate', 'dynasty', 'colonial']]])
  if (layers.includes('civilizations')) modes.push(['!=', ['get', 'civ'], null])
  if (layers.includes('colonial')) modes.push(['!=', ['get', 'subj'], null])
  const political = layers.includes('political')
  let opacity: unknown = 0.58
  if (diffMode) opacity = 0.12
  else if (focusCiv) opacity = ['case', ['==', ['get', 'civ'], focusCiv], 0.75, 0.18]
  else if (modes.length) opacity = ['case', ['any', ...modes], 0.72, political ? 0.16 : 0]
  map.setPaintProperty('territory-fill', 'fill-opacity', opacity as never)
  const civColor: unknown = ['get', 'color']
  map.setPaintProperty('territory-fill', 'fill-color', civColor as never)
  for (const id of ['label-major', 'label-mid', 'label-minor']) {
    if (!map.getLayer(id)) continue
    const filterBase = id === 'label-major' ? ['>=', ['get', 'area'], 600000] : id === 'label-mid' ? ['all', ['<', ['get', 'area'], 600000], ['>=', ['get', 'area'], 40000]] : ['<', ['get', 'area'], 40000]
    const emph = layers.includes('civilizations') && !political ? ['!=', ['get', 'civ'], null] : null
    map.setFilter(id, (emph ? ['all', filterBase, emph] : filterBase) as maplibregl.FilterSpecification)
  }
}

