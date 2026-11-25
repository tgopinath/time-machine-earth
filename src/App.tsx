import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { AnimatePresence, motion } from 'framer-motion'
import { useApp, type View } from './store/app'
import { TopNav } from './components/TopNav'
import { Timeline } from './components/Timeline'
import { InfoPanel } from './components/InfoPanel'
import { LayersPanel } from './components/LayersPanel'
import { EventsDrawer } from './components/views/EventsDrawer'
import { loadTerritoryIndex } from './lib/territoryIndex'
import { SettingsModal, ProfileModal } from './components/Modals'
import { MAX_YEAR, formatYear } from './lib/chrono'
import { snapshotFor, nextSnapshot } from './lib/snapshots'
import { loadSnapshot } from './lib/dataLoader'
import { narrateTransition } from './lib/narration'
import { useNativeShell } from './lib/native'

// The map engine (MapLibre) and the secondary views load as their own chunks, so the
// app shell (top bar, panel, timeline) paints before ~1 MB of map code has arrived.
const loadMap = () => import('./components/HistoricalMap')
const HistoricalMap = lazy(() => loadMap().then((m) => ({ default: m.HistoricalMap })))
void loadMap()
const CivilizationsView = lazy(() => import('./components/views/CivilizationsView').then((m) => ({ default: m.CivilizationsView })))
const CompareView = lazy(() => import('./components/views/CompareView').then((m) => ({ default: m.CompareView })))
const LearnView = lazy(() => import('./components/views/LearnView').then((m) => ({ default: m.LearnView })))
const SavedView = lazy(() => import('./components/views/SavedView').then((m) => ({ default: m.SavedView })))
const SourcesView = lazy(() => import('./components/views/SourcesView').then((m) => ({ default: m.SourcesView })))
const CivExplorer = lazy(() => import('./components/views/CivExplorer').then((m) => ({ default: m.CivExplorer })))

/** Base playback rate at 1×: ten years per second. */
const YEARS_PER_SECOND = 10

function usePlayback() {
  const playing = useApp((s) => s.playing)
  useEffect(() => {
    if (!playing) return
    let raf = 0
    let last = performance.now()
    let acc = useApp.getState().year
    const tick = (t: number) => {
      const dt = Math.min(0.1, (t - last) / 1000)
      last = t
      const s = useApp.getState()
      acc += dt * YEARS_PER_SECOND * s.speed
      if (acc >= MAX_YEAR) {
        s.setYear(MAX_YEAR)
        s.setPlaying(false)
        return
      }
      if (Math.round(acc) !== s.year) s.setYear(Math.round(acc))
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [playing])
}

/** Narrate documented changes whenever playback crosses into a new snapshot, and (while playing) prefetch the next one. */
function useNarration() {
  const year = useApp((s) => s.year)
  const playing = useApp((s) => s.playing)
  const settings = useApp((s) => s.settings)
  const setNarration = useApp((s) => s.setNarration)
  const prevSnap = useRef(snapshotFor(year).snapshot.year)
  useEffect(() => {
    const snap = snapshotFor(year).snapshot.year
    const nxt = nextSnapshot(year)
    // prefetch the next era only while playing, so a first visit downloads just the era on screen
    if (nxt && playing) loadSnapshot(nxt).catch(() => {})
    if (snap !== prevSnap.current) {
      if (playing && settings.narration) {
        const text = narrateTransition(prevSnap.current, snap)
        if (text) {
          setNarration(text)
          if (settings.speech && 'speechSynthesis' in window) {
            window.speechSynthesis.cancel()
            window.speechSynthesis.speak(new SpeechSynthesisUtterance(text.replace(/→/g, 'to')))
          }
        }
      }
      prevSnap.current = snap
    }
  }, [year, playing, settings.narration, settings.speech, setNarration])
  useEffect(() => {
    if (!playing) window.speechSynthesis?.cancel?.()
  }, [playing])
}

function useKeyboard() {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const tag = (document.activeElement?.tagName ?? '').toLowerCase()
      if (tag === 'input' || tag === 'select' || tag === 'textarea') return
      const s = useApp.getState()
      if (e.key === ' ' && (document.activeElement === document.body || document.activeElement?.getAttribute('role') === 'region')) {
        e.preventDefault()
        s.setPlaying(!s.playing)
      }
      if (e.key === 'Escape') {
        if (s.explorerCiv) s.setExplorerCiv(null)
        else if (s.view !== 'explore') s.setView('explore')
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])
}

export default function App() {
  usePlayback()
  useNarration()
  useKeyboard()
  const { year, layers, eventFilter, settings, camera, setCamera, flyTo, select, selection, view, panelOpen, setPanelOpen, explorerCiv, narrationText, setNarration, focusCiv } = useApp()
  const [modal, setModal] = useState<'settings' | 'profile' | null>(null)
  useNativeShell(() => setModal('settings'))

  // Deep link: ?view=civilizations (also ?year=-500) opens that view and year.
  useEffect(() => {
    const q = new URLSearchParams(location.search)
    const v = q.get('view') as View | null
    const views: View[] = ['explore', 'events', 'civilizations', 'compare', 'learn', 'saved', 'sources']
    if (v && views.includes(v)) useApp.getState().setView(v)
    const y = Number(q.get('year'))
    if (q.has('year') && Number.isFinite(y)) useApp.getState().setYear(y)
  }, [])

  // Territory facts (search, panel stats) load right after the first paint.
  useEffect(() => {
    const t = setTimeout(() => void loadTerritoryIndex(), 50)
    return () => clearTimeout(t)
  }, [])

  useEffect(() => {
    if (!narrationText) return
    const t = setTimeout(() => setNarration(null), 6500)
    return () => clearTimeout(t)
  }, [narrationText, setNarration])

  useEffect(() => {
    document.title = `${formatYear(year)} · Time Machine Earth`
  }, [year])

  const selectedName = selection.kind === 'territory' ? selection.name : null
  const outlineCiv = focusCiv ?? (selection.kind === 'civ' ? selection.id : null)

  return (
    <div className="flex h-full flex-col">
      <TopNav onSettings={() => setModal('settings')} onProfile={() => setModal('profile')} />
      <main className="relative flex min-h-0 flex-1">
        <div className="relative min-w-0 flex-1">
          <Suspense fallback={<div className="absolute inset-0 bg-paper" aria-hidden="true" />}>
          <HistoricalMap
            year={year}
            layers={layers}
            eventFilter={eventFilter}
            projection={settings.projection}
            initialCamera={camera}
            onCamera={setCamera}
            flyTo={flyTo}
            onSelect={select}
            selectedName={selectedName}
            outlineCiv={outlineCiv}
            reduceMotion={settings.reduceMotion}
            className="absolute inset-0"
            label={`Political map, ${formatYear(year)}`}
          />
          </Suspense>
          {view === 'explore' || view === 'events' ? <LayersPanel /> : null}
          {view === 'events' && <EventsDrawer />}
          {!panelOpen && view === 'explore' && (
            <button onClick={() => setPanelOpen(true)} className="absolute right-3 top-3 z-10 rounded-full border border-line bg-paper px-3.5 py-2 text-[13px] text-ink shadow-md hover:border-bronze">
              Show panel
            </button>
          )}
          <AnimatePresence>
            {narrationText && (
              <motion.div initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="absolute bottom-16 left-1/2 z-20 w-[min(560px,calc(100%-24px))] -translate-x-1/2 rounded-xl border border-line bg-paper/97 px-4 py-3 text-[13px] leading-relaxed text-ink-2 shadow-xl" role="status" aria-live="polite">
                <div className="mb-0.5 text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">Narration</div>
                {narrationText}
              </motion.div>
            )}
          </AnimatePresence>
          <Suspense fallback={null}>
          {view === 'civilizations' && <CivilizationsView />}
          {view === 'compare' && <CompareView />}
          {view === 'learn' && <LearnView />}
          {view === 'saved' && <SavedView />}
          {view === 'sources' && <SourcesView />}
          </Suspense>
        </div>
        {panelOpen && (view === 'explore' || view === 'events') && (
          <div className="absolute inset-x-0 bottom-0 z-20 h-[52%] border-t border-line shadow-2xl md:static md:z-auto md:h-auto md:w-[380px] md:shrink-0 md:border-l md:border-t-0 md:shadow-none">
            <InfoPanel />
          </div>
        )}
      </main>
      {(view === 'explore' || view === 'events' || view === 'civilizations') && <Timeline />}
      {explorerCiv && <Suspense fallback={null}><CivExplorer id={explorerCiv} /></Suspense>}
      {modal === 'settings' && <SettingsModal onClose={() => setModal(null)} />}
      {modal === 'profile' && <ProfileModal onClose={() => setModal(null)} />}
    </div>
  )
}
