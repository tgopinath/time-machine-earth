import { useEffect, useMemo, useRef, useState } from 'react'
import { scaleLinear } from 'd3-scale'
import { useApp } from '../store/app'
import { MIN_YEAR, MAX_YEAR, QUICK_PERIODS, formatYear, parseYear, eraName, clampYear } from '../lib/chrono'
import { SNAPSHOTS, snapshotFor, nextSnapshot, prevSnapshot } from '../lib/snapshots'
import { EVENTS, EVENT_COLOR } from '../data/events'

// Piecewise-linear scale gives recent centuries more room than the deep past.
export const timeScale = scaleLinear<number, number>()
  .domain([MIN_YEAR, -999, 0, 1000, 1500, 1800, 1900, MAX_YEAR])
  .range([0, 0.15, 0.29, 0.47, 0.61, 0.75, 0.85, 1])
  .clamp(true)

const TICKS: { y: number; major: boolean }[] = [
  ...[-2999, -1999, -999, 0, 1000, 2000].map((y) => ({ y, major: true })),
  ...[-2499, -1499, -499, 500, 1500].map((y) => ({ y, major: false })),
  ...[1100, 1200, 1300, 1400, 1600, 1700, 1800, 1900].map((y) => ({ y, major: false })),
]

export const SPEEDS = [0.5, 1, 2, 5, 10]

export function Timeline() {
  const { year, setYear, playing, setPlaying, speed, setSpeed } = useApp()
  const track = useRef<HTMLDivElement>(null)
  const [drag, setDrag] = useState(false)
  const [input, setInput] = useState(formatYear(year))
  const [editing, setEditing] = useState(false)
  const [inputError, setInputError] = useState(false)
  const snap = snapshotFor(year)

  useEffect(() => {
    if (!editing) setInput(formatYear(year))
  }, [year, editing])

  const fromClientX = (x: number) => {
    const r = track.current!.getBoundingClientRect()
    return Math.round(timeScale.invert((x - r.left) / r.width))
  }

  useEffect(() => {
    if (!drag) return
    const move = (e: PointerEvent) => setYear(fromClientX(e.clientX))
    const up = () => setDrag(false)
    window.addEventListener('pointermove', move)
    window.addEventListener('pointerup', up)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerup', up)
    }
  }, [drag, setYear])

  const commitInput = () => {
    const y = parseYear(input)
    setEditing(false)
    if (y === null) {
      setInputError(true)
      setInput(formatYear(year))
      setTimeout(() => setInputError(false), 1600)
      return
    }
    setYear(clampYear(y))
  }

  const prev = prevSnapshot(snap.snapshot.year === year ? year : year + 1) ?? SNAPSHOTS[0]
  const next = nextSnapshot(year)
  const eventMarks = useMemo(() => EVENTS.map((e) => ({ id: e.id, x: timeScale(e.y), color: EVENT_COLOR[e.type], title: `${e.title} · ${formatYear(e.y, { circa: e.circa })}` })), [])

  return (
    <section aria-label="Historical timeline" className="relative z-20 border-t border-line bg-paper/97 px-3 pb-2 pt-2 backdrop-blur md:px-5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        {/* year readout */}
        <div className="flex min-w-[190px] items-baseline gap-3">
          <input
            aria-label="Selected year — type a year such as 500 BCE"
            value={input}
            onFocus={(e) => {
              setEditing(true)
              e.currentTarget.select()
            }}
            onChange={(e) => setInput(e.target.value)}
            onBlur={commitInput}
            onKeyDown={(e) => {
              if (e.key === 'Enter') e.currentTarget.blur()
              if (e.key === 'Escape') {
                setEditing(false)
                setInput(formatYear(year))
                e.currentTarget.blur()
              }
            }}
            className={`tabular w-[150px] rounded-md border bg-transparent px-1.5 py-0.5 font-serif text-[28px] leading-none text-ink outline-none transition-colors ${inputError ? 'border-loss' : 'border-transparent hover:border-line focus:border-bronze'}`}
          />
          <div className="hidden leading-tight sm:block">
            <div className="text-[11px] font-medium uppercase tracking-[0.12em] text-bronze">{eraName(year)}</div>
            <div className="text-[11px] text-muted">
              Borders: {formatYear(snap.snapshot.year)} snapshot{snap.gap > 0 ? ` (${snap.gap} yr earlier)` : ''}
            </div>
          </div>
        </div>

        {/* transport */}
        <div className="flex items-center gap-1">
          <IconBtn label={`Previous period (${formatYear(prev.year)})`} onClick={() => setYear(prev.year)}>
            <path d="M6 5v14M18 5l-9 7 9 7z" />
          </IconBtn>
          <button
            onClick={() => setPlaying(!playing)}
            aria-label={playing ? 'Pause playback' : 'Play history'}
            className="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-ivory transition hover:bg-bronze-2"
          >
            <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
              {playing ? <path d="M7 5h4v14H7zM13 5h4v14h-4z" /> : <path d="M8 5l11 7-11 7z" />}
            </svg>
          </button>
          <IconBtn label={next ? `Next period (${formatYear(next.year)})` : 'Latest snapshot'} onClick={() => next ? setYear(next.year) : setYear(MAX_YEAR)}>
            <path d="M18 5v14M6 5l9 7-9 7z" />
          </IconBtn>
          <label className="ml-1 flex items-center gap-1 text-[12px] text-muted">
            <span className="sr-only">Playback speed</span>
            <select value={speed} onChange={(e) => setSpeed(Number(e.target.value))} className="rounded-md border border-line bg-paper px-1.5 py-1 text-[12px] text-ink">
              {SPEEDS.map((s) => (
                <option key={s} value={s}>
                  {s}×
                </option>
              ))}
            </select>
          </label>
        </div>

        {/* quick periods */}
        <div className="scroll-thin -mx-1 flex min-w-0 flex-1 gap-1 overflow-x-auto px-1 py-0.5" role="group" aria-label="Quick periods">
          {QUICK_PERIODS.map((p) => (
            <button
              key={p.label}
              onClick={() => setYear(p.y)}
              className={`shrink-0 rounded-full border px-2.5 py-0.5 text-[11.5px] transition ${year === p.y ? 'border-ink bg-ink text-ivory' : 'border-line text-ink-2 hover:border-bronze hover:text-bronze-2'}`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* track */}
      <div
        ref={track}
        role="slider"
        tabIndex={0}
        aria-label="Year"
        aria-valuemin={MIN_YEAR}
        aria-valuemax={MAX_YEAR}
        aria-valuenow={year}
        aria-valuetext={formatYear(year)}
        onPointerDown={(e) => {
          setDrag(true)
          setYear(fromClientX(e.clientX))
        }}
        onKeyDown={(e) => {
          const step = e.shiftKey ? 100 : 10
          if (e.key === 'ArrowRight') setYear(year + step)
          else if (e.key === 'ArrowLeft') setYear(year - step)
          else if (e.key === 'PageUp') setYear(next?.year ?? MAX_YEAR)
          else if (e.key === 'PageDown') setYear(prev.year)
          else if (e.key === 'Home') setYear(MIN_YEAR)
          else if (e.key === 'End') setYear(MAX_YEAR)
          else return
          e.preventDefault()
        }}
        className="relative mt-2 h-[46px] cursor-pointer touch-none select-none"
      >
        <div className="absolute inset-x-0 top-[18px] h-[6px] rounded-full bg-parchment" />
        <div className="absolute left-0 top-[18px] h-[6px] rounded-full bg-bronze/40" style={{ width: `${timeScale(year) * 100}%` }} />
        {/* snapshot ticks */}
        {SNAPSHOTS.map((s) => (
          <div key={s.file} title={`Boundary snapshot: ${formatYear(s.year)}`} className={`absolute top-[15px] h-[12px] w-px ${s.year === snap.snapshot.year ? 'bg-bronze-2' : 'bg-ink/25'}`} style={{ left: `${timeScale(s.year) * 100}%` }} />
        ))}
        {/* events */}
        {eventMarks.map((m) => (
          <div key={m.id} title={m.title} className="absolute top-[8px] h-[5px] w-[5px] -translate-x-1/2 rounded-full" style={{ left: `${m.x * 100}%`, background: m.color }} />
        ))}
        {/* labels */}
        {TICKS.map((t) => (
          <div key={t.y} className="absolute top-[28px] -translate-x-1/2 text-[10px] tabular text-muted" style={{ left: `${timeScale(t.y) * 100}%` }}>
            <div className={`mx-auto mb-0.5 h-[4px] w-px ${t.major ? 'bg-ink/50' : 'bg-ink/25'}`} />
            <span className={t.major ? `font-medium text-ink-2 ${t.y === -1999 || t.y === -999 ? 'hidden sm:inline' : ''}` : 'hidden md:inline'}>{t.y === 0 ? '1 BCE|CE' : formatYear(t.y, { short: true })}</span>
          </div>
        ))}
        {/* handle */}
        <div className="pointer-events-none absolute top-[11px] -translate-x-1/2" style={{ left: `${timeScale(year) * 100}%`, transition: playing || drag ? 'none' : 'left 250ms ease' }}>
          <div className="h-[20px] w-[20px] rounded-full border-[3px] border-paper bg-bronze shadow-[0_1px_4px_rgba(0,0,0,0.25)]" />
        </div>
      </div>
    </section>
  )
}

function IconBtn({ label, onClick, children }: { label: string; onClick: () => void; children: React.ReactNode }) {
  return (
    <button onClick={onClick} aria-label={label} title={label} className="flex h-8 w-8 items-center justify-center rounded-full text-ink-2 transition hover:bg-parchment hover:text-ink">
      <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
        {children}
      </svg>
    </button>
  )
}
