import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { clampYear } from '../lib/chrono'
import type { EventType } from '../data/types'
import type { EntityRef } from '../lib/geo'

export type LayerId =
  | 'political'
  | 'empires'
  | 'civilizations'
  | 'settlements'
  | 'routes'
  | 'battles'
  | 'events'
  | 'capitals'
  | 'colonial'
  | 'modern'
  | 'terrain'
  | 'uncertainty'

export type View = 'explore' | 'events' | 'civilizations' | 'compare' | 'learn' | 'saved' | 'sources'

export type Selection =
  | { kind: 'overview' }
  | { kind: 'territory'; name: string; year: number }
  | { kind: 'civ'; id: string }
  | { kind: 'event'; id: string }
  | { kind: 'city'; id: string }
  | { kind: 'country'; id: string }
  | { kind: 'region'; regionId: string }
  | { kind: 'site'; id: string }

export interface Camera {
  center: [number, number]
  zoom: number
  bearing?: number
  pitch?: number
}

export interface SavedItem {
  id: string
  kind: 'view' | 'civ' | 'city' | 'event' | 'comparison' | 'year'
  title: string
  note?: string
  createdAt: number
  year: number
  camera?: Camera
  layers?: LayerId[]
  ref?: string
  compare?: { a: number; b: number; entity?: EntityRef }
}

export interface QuizStats {
  answered: number
  correct: number
  points: number
  streak: number
  bestStreak: number
  byKind: Record<string, { answered: number; correct: number }>
  dailyDone: string | null
  badges: string[]
  explored: string[]
}

export interface Settings {
  projection: 'mercator' | 'globe'
  units: 'km' | 'mi'
  narration: boolean
  speech: boolean
  reduceMotion: boolean
  labelDensity: 'low' | 'normal' | 'high'
}

interface FlyTarget {
  center?: [number, number]
  zoom?: number
  bbox?: [number, number, number, number]
  nonce: number
}

interface AppState {
  year: number
  playing: boolean
  speed: number
  view: View
  selection: Selection
  history: Selection[]
  layers: LayerId[]
  eventFilter: EventType[]
  camera: Camera
  flyTo: FlyTarget | null
  compareYears: [number, number]
  compareEntity: EntityRef | null
  compareMode: 'periods' | 'borders'
  panelOpen: boolean
  saved: SavedItem[]
  quiz: QuizStats
  settings: Settings
  profileName: string
  narrationText: string | null
  explorerCiv: string | null
  focusCiv: string | null
  setExplorerCiv: (id: string | null) => void
  setFocusCiv: (id: string | null) => void

  setYear: (y: number) => void
  setPlaying: (p: boolean) => void
  setSpeed: (s: number) => void
  setView: (v: View) => void
  select: (s: Selection) => void
  back: () => void
  toggleLayer: (l: LayerId) => void
  setLayers: (l: LayerId[]) => void
  toggleEventType: (t: EventType) => void
  setCamera: (c: Camera) => void
  fly: (t: Omit<FlyTarget, 'nonce'>) => void
  setCompare: (a: number, b: number, entity?: EntityRef | null, mode?: 'periods' | 'borders') => void
  setPanelOpen: (o: boolean) => void
  save: (item: Omit<SavedItem, 'id' | 'createdAt'>) => void
  unsave: (id: string) => void
  renameSaved: (id: string, title: string) => void
  recordAnswer: (kind: string, correct: boolean, points: number) => void
  awardBadge: (b: string) => void
  markExplored: (key: string) => void
  setDailyDone: (d: string) => void
  updateSettings: (s: Partial<Settings>) => void
  setProfileName: (n: string) => void
  setNarration: (t: string | null) => void
  resetProgress: () => void
}

const DEFAULT_LAYERS: LayerId[] = ['political', 'capitals', 'events', 'battles', 'uncertainty']

const emptyQuiz: QuizStats = { answered: 0, correct: 0, points: 0, streak: 0, bestStreak: 0, byKind: {}, dailyDone: null, badges: [], explored: [] }

export const useApp = create<AppState>()(
  persist(
    (set, get) => ({
      year: 1500,
      playing: false,
      speed: 1,
      view: 'explore',
      selection: { kind: 'overview' },
      history: [],
      layers: DEFAULT_LAYERS,
      eventFilter: ['war', 'political', 'discovery', 'revolution', 'independence', 'cultural', 'trade'],
      camera: { center: [40, 25], zoom: 1.6 },
      flyTo: null,
      compareYears: [1700, 1960],
      compareEntity: null,
      compareMode: 'periods',
      panelOpen: true,
      saved: [],
      quiz: emptyQuiz,
      settings: { projection: 'mercator', units: 'km', narration: true, speech: false, reduceMotion: false, labelDensity: 'normal' },
      profileName: 'Explorer',
      narrationText: null,
      explorerCiv: null,
      focusCiv: null,
      setExplorerCiv: (id) => set({ explorerCiv: id }),
      setFocusCiv: (id) => set({ focusCiv: id }),

      setYear: (y) => set({ year: clampYear(y) }),
      setPlaying: (p) => set({ playing: p }),
      setSpeed: (s) => set({ speed: s }),
      setView: (v) => set({ view: v }),
      select: (s) => {
        const cur = get().selection
        set({ focusCiv: null, selection: s, history: cur.kind === 'overview' && s.kind === 'overview' ? [] : [...get().history, cur].slice(-20), panelOpen: true })
        if (s.kind === 'civ' || s.kind === 'city' || s.kind === 'country') get().markExplored(`${s.kind}:${s.id}`)
      },
      back: () => {
        const h = [...get().history]
        const prev = h.pop() ?? { kind: 'overview' as const }
        set({ selection: prev, history: h })
      },
      toggleLayer: (l) => {
        const has = get().layers.includes(l)
        set({ layers: has ? get().layers.filter((x) => x !== l) : [...get().layers, l] })
      },
      setLayers: (l) => set({ layers: l }),
      toggleEventType: (t) => {
        const has = get().eventFilter.includes(t)
        set({ eventFilter: has ? get().eventFilter.filter((x) => x !== t) : [...get().eventFilter, t] })
      },
      setCamera: (c) => set({ camera: c }),
      fly: (t) => set({ flyTo: { ...t, nonce: Date.now() + Math.random() } }),
      setCompare: (a, b, entity, mode) =>
        set({ compareYears: [clampYear(a), clampYear(b)], compareEntity: entity === undefined ? get().compareEntity : entity, compareMode: mode ?? get().compareMode }),
      setPanelOpen: (o) => set({ panelOpen: o }),
      save: (item) => set({ saved: [{ ...item, id: crypto.randomUUID(), createdAt: Date.now() }, ...get().saved] }),
      unsave: (id) => set({ saved: get().saved.filter((s) => s.id !== id) }),
      renameSaved: (id, title) => set({ saved: get().saved.map((s) => (s.id === id ? { ...s, title } : s)) }),
      recordAnswer: (kind, correct, points) => {
        const q = get().quiz
        const k = q.byKind[kind] ?? { answered: 0, correct: 0 }
        const streak = correct ? q.streak + 1 : 0
        set({
          quiz: {
            ...q,
            answered: q.answered + 1,
            correct: q.correct + (correct ? 1 : 0),
            points: q.points + (correct ? points : 0),
            streak,
            bestStreak: Math.max(q.bestStreak, streak),
            byKind: { ...q.byKind, [kind]: { answered: k.answered + 1, correct: k.correct + (correct ? 1 : 0) } },
          },
        })
      },
      awardBadge: (b) => {
        const q = get().quiz
        if (!q.badges.includes(b)) set({ quiz: { ...q, badges: [...q.badges, b] } })
      },
      markExplored: (key) => {
        const q = get().quiz
        if (!q.explored.includes(key)) set({ quiz: { ...q, explored: [...q.explored, key] } })
      },
      setDailyDone: (d) => set({ quiz: { ...get().quiz, dailyDone: d } }),
      updateSettings: (s) => set({ settings: { ...get().settings, ...s } }),
      setProfileName: (n) => set({ profileName: n }),
      setNarration: (t) => set({ narrationText: t }),
      resetProgress: () => set({ quiz: emptyQuiz }),
    }),
    {
      name: 'time-machine-earth',
      version: 1,
      storage: createJSONStorage(() => {
        try {
          localStorage.setItem('__tme', '1')
          localStorage.removeItem('__tme')
          return localStorage
        } catch {
          const mem = new Map<string, string>()
          return { getItem: (k) => mem.get(k) ?? null, setItem: (k, v) => void mem.set(k, v), removeItem: (k) => void mem.delete(k) }
        }
      }),
      partialize: (s) => ({ saved: s.saved, quiz: s.quiz, settings: s.settings, profileName: s.profileName, layers: s.layers, speed: s.speed }),
    },
  ),
)
