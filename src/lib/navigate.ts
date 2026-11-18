import { useApp } from '../store/app'
import { CIV_BY_ID } from '../data/civilizations'
import { CITY_BY_ID } from '../data/cities'
import { EVENT_BY_ID } from '../data/events'
import { COUNTRY_BY_ID } from '../data/countries'
import { REGIONS, SITES } from '../data/atlas'
import type { SearchAction } from './search'
import { clampYear } from './chrono'

/** Single entry point that keeps year, map camera, panel and view in sync. */
export function runAction(a: SearchAction) {
  const s = useApp.getState()
  s.setPlaying(false)
  switch (a.type) {
    case 'year':
      s.setView('explore')
      s.setYear(a.year)
      s.select({ kind: 'overview' })
      break
    case 'civ': {
      const c = CIV_BY_ID.get(a.id)
      if (!c) return
      s.setView('explore')
      s.setYear(clampYear(a.year ?? c.focusYear))
      s.fly({ center: c.center, zoom: c.zoom })
      s.select({ kind: 'civ', id: c.id })
      break
    }
    case 'city': {
      const c = CITY_BY_ID.get(a.id)
      if (!c) return
      s.setView('explore')
      if (s.year < c.foundedY) s.setYear(clampYear(c.foundedY))
      s.fly({ center: [c.lon, c.lat], zoom: 6 })
      s.select({ kind: 'city', id: c.id })
      break
    }
    case 'event': {
      const e = EVENT_BY_ID.get(a.id)
      if (!e) return
      s.setView('explore')
      s.setYear(clampYear(e.y))
      s.fly({ center: [e.lon, e.lat], zoom: Math.max(4, Math.min(6, useApp.getState().camera.zoom + 1)) })
      s.select({ kind: 'event', id: e.id })
      break
    }
    case 'country': {
      const c = COUNTRY_BY_ID.get(a.id)
      if (!c) return
      s.setView('explore')
      s.fly({ bbox: c.bbox })
      s.select({ kind: 'country', id: c.id })
      break
    }
    case 'territory':
      s.setView('explore')
      s.setYear(a.year)
      s.fly({ center: [a.lon, a.lat], zoom: 4 })
      s.select({ kind: 'territory', name: a.name, year: a.year })
      break
    case 'region': {
      const r = REGIONS.find((x) => x.id === a.regionId)
      if (!r) return
      s.setView('explore')
      s.setYear(a.year)
      s.fly({ bbox: r.bbox })
      s.select({ kind: 'region', regionId: r.id })
      break
    }
    case 'borders':
      s.setCompare(a.a, a.b, a.entity, 'borders')
      s.setView('compare')
      break
  }
}

export function openSite(id: string) {
  const site = SITES.find((x) => x.id === id)
  if (!site) return
  const s = useApp.getState()
  s.fly({ center: [site.lon, site.lat], zoom: 6 })
  s.select({ kind: 'site', id })
}
