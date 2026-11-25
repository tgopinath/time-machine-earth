import type { useApp } from '../store/app'

/** Learn-mode achievements (kept out of LearnView so the settings/profile modals don't pull in the map). */
export const BADGES: { id: string; label: string; desc: string; test: (q: ReturnType<typeof useApp.getState>['quiz']) => boolean }[] = [
  { id: 'first-answer', label: 'First Steps', desc: 'Answer your first question', test: (q) => q.answered >= 1 },
  { id: 'ten-correct', label: 'Apprentice Historian', desc: '10 correct answers', test: (q) => q.correct >= 10 },
  { id: 'fifty-correct', label: 'Chronicler', desc: '50 correct answers', test: (q) => q.correct >= 50 },
  { id: 'streak-5', label: 'On a Roll', desc: '5 correct in a row', test: (q) => q.bestStreak >= 5 },
  { id: 'cartographer', label: 'Cartographer', desc: '5 correct "which power controlled this region" answers', test: (q) => (q.byKind.region?.correct ?? 0) >= 5 },
  { id: 'capitals', label: 'Capital Collector', desc: '5 correct capital answers', test: (q) => (q.byKind.capital?.correct ?? 0) >= 5 },
  { id: 'borders', label: 'Border Watcher', desc: '3 correct border-change answers', test: (q) => (q.byKind.border?.correct ?? 0) >= 3 },
  { id: 'explorer', label: 'Explorer', desc: 'Open 10 civilizations, cities or countries', test: (q) => q.explored.length >= 10 },
  { id: 'daily', label: 'Daily Discoverer', desc: 'Complete a daily challenge', test: (q) => q.dailyDone !== null },
]
