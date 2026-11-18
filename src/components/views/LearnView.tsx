import { useMemo, useState } from 'react'
import { useApp } from '../../store/app'
import { makeQuiz, dailySeed, dailyDiscovery, type Difficulty, type QuizQuestion } from '../../lib/quiz'
import { formatYear } from '../../lib/chrono'
import { HistoricalMap } from '../HistoricalMap'
import { runAction } from '../../lib/navigate'
import { CloseButton, GhostButton, PrimaryButton, Badge } from '../ui'

const POINTS: Record<Difficulty, number> = { easy: 10, medium: 20, hard: 35 }

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

const KIND_LABEL: Record<string, string> = { region: 'Guess the empire', capital: 'Identify the capital', period: 'Match the period', order: 'Timeline challenge', border: 'Border change' }

export function LearnView() {
  const { setView, quiz, recordAnswer, awardBadge, setDailyDone, settings } = useApp()
  const [difficulty, setDifficulty] = useState<Difficulty>('medium')
  const [seed, setSeed] = useState<number | null>(null)
  const [daily, setDaily] = useState(false)
  const [i, setI] = useState(0)
  const [picked, setPicked] = useState<number | null>(null)
  const [score, setScore] = useState(0)
  const questions = useMemo(() => (seed === null ? [] : makeQuiz(seed, difficulty, daily ? 5 : 8)), [seed, difficulty, daily])
  const q: QuizQuestion | undefined = questions[i]
  const today = new Date().toISOString().slice(0, 10)
  const discovery = dailyDiscovery()

  const start = (isDaily: boolean) => {
    setDaily(isDaily)
    setSeed(isDaily ? dailySeed() : Math.floor(Math.random() * 1e9))
    setI(0)
    setPicked(null)
    setScore(0)
  }

  const answer = (k: number) => {
    if (picked !== null || !q) return
    setPicked(k)
    const ok = k === q.answer
    if (ok) setScore((s) => s + POINTS[difficulty])
    recordAnswer(q.kind, ok, POINTS[difficulty])
    const state = useApp.getState().quiz
    for (const b of BADGES) if (b.test(state)) awardBadge(b.id)
  }

  const next = () => {
    if (i + 1 >= questions.length) {
      if (daily) {
        setDailyDone(today)
        awardBadge('daily')
      }
      setI(questions.length)
      return
    }
    setI(i + 1)
    setPicked(null)
  }

  const accuracy = quiz.answered ? Math.round((quiz.correct / quiz.answered) * 100) : 0

  return (
    <div className="absolute inset-0 z-20 overflow-hidden bg-ivory">
      <div className="scroll-thin h-full overflow-y-auto">
        <div className="mx-auto max-w-6xl px-4 py-6 md:px-8">
          <div className="flex items-start justify-between">
            <div>
              <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-bronze">Educational mode</div>
              <h1 className="mt-1 font-serif text-[34px] leading-tight text-ink">Learn history through geography</h1>
            </div>
            <CloseButton onClick={() => setView('explore')} />
          </div>

          {seed === null || i >= questions.length ? (
            <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_340px]">
              <div className="space-y-5">
                {seed !== null && i >= questions.length && (
                  <div className="rounded-xl border border-bronze/40 bg-bronze-soft/60 p-5">
                    <div className="font-serif text-[24px] text-ink">Round complete — {score} points</div>
                    <p className="mt-1 text-[13.5px] text-ink-2">You can start another round or switch difficulty.</p>
                  </div>
                )}
                <div className="rounded-xl border border-line bg-paper p-5">
                  <h2 className="font-serif text-[22px] text-ink">Start a quiz</h2>
                  <p className="mt-1 text-[13.5px] text-ink-2">Questions are generated from the boundary dataset and the curated records: guess the empire, identify capitals, match periods, order events and read border changes.</p>
                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    {(['easy', 'medium', 'hard'] as Difficulty[]).map((d) => (
                      <GhostButton key={d} active={difficulty === d} onClick={() => setDifficulty(d)}>
                        {d[0].toUpperCase() + d.slice(1)} · {POINTS[d]} pts
                      </GhostButton>
                    ))}
                  </div>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <PrimaryButton onClick={() => start(false)}>Start 8-question round</PrimaryButton>
                    <GhostButton onClick={() => start(true)}>{quiz.dailyDone === today ? 'Replay today’s challenge' : 'Daily challenge (5)'}</GhostButton>
                  </div>
                </div>
                <div className="rounded-xl border border-line bg-paper p-5">
                  <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Today’s historical discovery</div>
                  <h3 className="mt-1 font-serif text-[20px] text-ink">{discovery.title}</h3>
                  <p className="text-[12px] text-muted">{formatYear(discovery.y, { circa: discovery.circa })} · {discovery.place}</p>
                  <p className="mt-2 text-[13.5px] text-ink-2">{discovery.description}</p>
                  <div className="mt-3"><GhostButton onClick={() => runAction({ type: 'event', id: discovery.id })}>See it on the map →</GhostButton></div>
                </div>
              </div>
              <Progress accuracy={accuracy} />
            </div>
          ) : (
            q && (
              <div className="mt-6 grid gap-5 lg:grid-cols-[1fr_420px]">
                <div className="relative h-[360px] overflow-hidden rounded-xl border border-line lg:h-[520px]">
                  <HistoricalMap
                    key={q.id}
                    year={q.year}
                    layers={['political', 'uncertainty']}
                    markers={false}
                    interactive
                    projection={settings.projection}
                    initialCamera={q.highlight ? { center: [q.highlight.lon, q.highlight.lat], zoom: q.kind === 'region' ? 3.2 : 4 } : { center: [40, 25], zoom: 1.5 }}
                    focusPoint={q.highlight ? [q.highlight.lon, q.highlight.lat] : null}
                    selectedName={picked !== null && q.highlight ? q.highlight.name : null}
                    hideLabels={q.kind === 'region' && picked === null}
                    className="absolute inset-0"
                    label="Quiz map"
                  />
                  <div className="absolute left-14 top-3 z-10 rounded-lg border border-line bg-paper/95 px-3 py-1.5 font-serif text-[18px] text-ink shadow">{formatYear(q.year)}</div>
                </div>
                <div className="rounded-xl border border-line bg-paper p-5">
                  <div className="flex items-center justify-between">
                    <Badge tone="bronze">{KIND_LABEL[q.kind]}</Badge>
                    <span className="text-[12px] tabular text-muted">Question {i + 1} / {questions.length} · {score} pts</span>
                  </div>
                  <h2 className="mt-3 font-serif text-[22px] leading-snug text-ink">{q.prompt}</h2>
                  {q.kind === 'region' && <p className="mt-1 text-[12px] text-muted">The ring marks the region. Territory labels are hidden until you answer.</p>}
                  <div className="mt-4 space-y-2">
                    {q.options.map((o, k) => {
                      const state = picked === null ? 'idle' : k === q.answer ? 'right' : k === picked ? 'wrong' : 'dim'
                      return (
                        <button key={o} onClick={() => answer(k)} disabled={picked !== null} className={`flex w-full items-center gap-3 rounded-lg border px-3.5 py-2.5 text-left text-[14px] transition ${state === 'idle' ? 'border-line hover:border-bronze hover:bg-parchment/50' : state === 'right' ? 'border-gain bg-gain/10 text-ink' : state === 'wrong' ? 'border-loss bg-loss/10 text-ink' : 'border-line text-muted'}`}>
                          <span className="flex h-6 w-6 shrink-0 items-center justify-center rounded-full border border-current text-[12px]">{'ABCD'[k]}</span>
                          {o}
                        </button>
                      )
                    })}
                  </div>
                  {picked !== null && (
                    <div className="mt-4 rounded-lg border border-line bg-ivory/70 p-3.5" aria-live="polite">
                      <div className={`text-[14px] font-medium ${picked === q.answer ? 'text-gain' : 'text-loss'}`}>{picked === q.answer ? `Correct! +${POINTS[difficulty]} points` : `Not quite — the answer is ${q.options[q.answer]}.`}</div>
                      <p className="mt-1 text-[13px] text-ink-2">{q.explanation}</p>
                      <p className="mt-2 text-[12.5px] italic text-ink-2">{q.fact}</p>
                      <div className="mt-3 flex gap-2">
                        <PrimaryButton onClick={next}>{i + 1 >= questions.length ? 'Finish' : 'Next question'}</PrimaryButton>
                        {q.civId && <GhostButton onClick={() => runAction({ type: 'civ', id: q.civId!, year: q.year })}>Explore on the map</GhostButton>}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )
          )}
        </div>
      </div>
    </div>
  )
}

function Progress({ accuracy }: { accuracy: number }) {
  const { quiz } = useApp()
  return (
    <div className="space-y-5">
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Your progress</div>
        <div className="mt-2 grid grid-cols-3 gap-2 text-center">
          <div><div className="font-serif text-[26px] text-ink">{quiz.points}</div><div className="text-[11px] text-muted">points</div></div>
          <div><div className="font-serif text-[26px] text-ink">{accuracy}%</div><div className="text-[11px] text-muted">accuracy</div></div>
          <div><div className="font-serif text-[26px] text-ink">{quiz.bestStreak}</div><div className="text-[11px] text-muted">best streak</div></div>
        </div>
        <div className="mt-4 space-y-1.5">
          {Object.entries(KIND_LABEL).map(([k, l]) => {
            const s = quiz.byKind[k]
            const pct = s?.answered ? (s.correct / s.answered) * 100 : 0
            return (
              <div key={k}>
                <div className="flex justify-between text-[12px]"><span className="text-ink-2">{l}</span><span className="tabular text-muted">{s ? `${s.correct}/${s.answered}` : '—'}</span></div>
                <div className="mt-0.5 h-1.5 rounded-full bg-parchment"><div className="h-1.5 rounded-full bg-bronze" style={{ width: `${pct}%` }} /></div>
              </div>
            )
          })}
        </div>
      </div>
      <div className="rounded-xl border border-line bg-paper p-5">
        <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Achievements · {quiz.badges.length}/{BADGES.length}</div>
        <ul className="mt-2 space-y-1.5">
          {BADGES.map((b) => {
            const has = quiz.badges.includes(b.id)
            return (
              <li key={b.id} className={`flex items-center gap-2.5 ${has ? '' : 'opacity-45'}`}>
                <span className={`flex h-7 w-7 items-center justify-center rounded-full ${has ? 'bg-bronze text-ivory' : 'bg-parchment text-muted'}`}>
                  <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor"><path d="M12 2l2.9 6.3 6.9.7-5.2 4.6 1.5 6.8L12 17l-6.1 3.4 1.5-6.8L2.2 9l6.9-.7z" /></svg>
                </span>
                <span><span className="block text-[13px] text-ink">{b.label}</span><span className="block text-[11px] text-muted">{b.desc}</span></span>
              </li>
            )
          })}
        </ul>
      </div>
    </div>
  )
}
