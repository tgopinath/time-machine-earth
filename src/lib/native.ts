/**
 * Native looks inside the app shells only.
 * - Android (Capacitor shell, or ?app=android): Material 3 via the Kolam M3 kit.
 * - iPhone (TimeMachineEarth-iOS shell, or ?app=ios): Apple HIG via the Kolam iOS kit.
 * In a normal browser both kits stay off and the website keeps its own look.
 * The kits are loaded from the Kolam CDN in index.html.
 */
import { useEffect, useRef } from 'react'
import { useApp, type View } from '../store/app'

type M3Ctl = { enabled: boolean; setActive: (id: string) => void; setTitle: (t: string) => void }
type Win = Window & {
  KolamM3?: { isAndroid: boolean; init: (o: Record<string, unknown>) => M3Ctl }
  KolamIOS?: {
    init: (o: Record<string, unknown>) => unknown
    navBar: { set: (o: Record<string, unknown>) => void }
    tabBar: { select: (id: string) => void }
  }
}

const TABS: { id: View; label: string; m3: string; ios: string }[] = [
  { id: 'explore', label: 'Explore', m3: 'public', ios: 'globe' },
  { id: 'events', label: 'Events', m3: 'event', ios: 'calendar' },
  { id: 'civilizations', label: 'Cultures', m3: 'account_balance', ios: 'flag' },
  { id: 'compare', label: 'Compare', m3: 'compare', ios: 'square.grid.2x2' },
  { id: 'learn', label: 'Learn', m3: 'school', ios: 'star' },
]

const TITLES: Record<View, string> = {
  explore: 'Time Machine Earth',
  events: 'Historical events',
  civilizations: 'Civilizations',
  compare: 'Compare maps',
  learn: 'Learn',
  saved: 'Saved places',
  sources: 'Data & sources',
}

/** Which tab lights up for a view (Saved and Sources are reached from the bar actions). */
const tabFor = (v: View): View => (TABS.some((t) => t.id === v) ? v : 'explore')

export function useNativeShell(openSettings: () => void) {
  const view = useApp((s) => s.view)
  const mode = useRef<'android' | 'ios' | null>(null)
  const m3 = useRef<M3Ctl | null>(null)
  const settingsRef = useRef(openSettings)
  settingsRef.current = openSettings

  useEffect(() => {
    const w = window as Win
    const go = (v: View) => useApp.getState().setView(v)
    const actions = (ios: boolean) => [
      { icon: ios ? 'bookmark' : 'bookmark', label: 'Saved places', onClick: () => go('saved') },
      { icon: ios ? 'gearshape' : 'settings', label: 'Settings', onClick: () => settingsRef.current() },
    ]
    if (w.KolamIOS) {
      const ok = w.KolamIOS.init({
        appName: 'Time Machine Earth',
        uaTokens: ['TimeMachineEarth-iOS'],
        style: 'glass',
        tint: { light: '#7f5626', dark: '#d9b27c' },
        navBar: { title: TITLES.explore, large: false, actions: actions(true) },
        tabs: TABS.map((t) => ({ id: t.id, label: t.label, icon: t.ios })),
        currentTab: 'explore',
        onTabSelect: (id: View) => { go(id); return false },
        swipeBack: false,
        enhance: false,
      })
      if (ok) { mode.current = 'ios'; return }
    }
    if (w.KolamM3?.isAndroid) {
      m3.current = w.KolamM3.init({
        primary: '#9a6b34',
        title: TITLES.explore,
        destinations: TABS.map((t) => ({ id: t.id, label: t.label, icon: t.m3, onSelect: () => go(t.id) })),
        active: 'explore',
        actions: actions(false),
        isRoot: () => true,
        onBack: () => {
          const s = useApp.getState()
          if (s.explorerCiv) { s.setExplorerCiv(null); return true }
          if (s.view !== 'explore') { s.setView('explore'); return true }
          return false
        },
      })
      if (m3.current?.enabled) mode.current = 'android'
    }
  }, [])

  useEffect(() => {
    const w = window as Win
    // The kits' own route listeners reset the active tab, so update after them.
    const t = setTimeout(() => {
      if (mode.current === 'ios' && w.KolamIOS) {
        w.KolamIOS.tabBar.select(tabFor(view))
        w.KolamIOS.navBar.set({
          title: TITLES[view],
          large: false,
          keepTitle: true,
          back: tabFor(view) === view ? null : { label: 'Explore', onClick: () => useApp.getState().setView('explore') },
          actions: [
            { icon: 'bookmark', label: 'Saved places', onClick: () => useApp.getState().setView('saved') },
            { icon: 'gearshape', label: 'Settings', onClick: () => settingsRef.current() },
          ],
        })
      } else if (mode.current === 'android' && m3.current) {
        m3.current.setActive(tabFor(view))
        m3.current.setTitle(TITLES[view])
      }
    }, 0)
    return () => clearTimeout(t)
  }, [view])
}
