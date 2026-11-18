import { useMemo } from 'react'
import { scaleLinear } from 'd3-scale'
import { max } from 'd3-array'
import { formatYear } from '../lib/chrono'
import { formatArea } from '../lib/geo'

/** Rise-and-decline chart: mapped area per boundary snapshot. Points only at documented snapshots. */
export function AreaChart({ series, current, start, end, onPick, color = '#9a6b34', units = 'km' }: {
  series: { year: number; area: number }[]
  current?: number
  start: number
  end: number
  onPick?: (y: number) => void
  color?: string
  units?: 'km' | 'mi'
}) {
  const W = 320
  const H = 96
  const pad = { l: 6, r: 6, t: 10, b: 18 }
  const x = useMemo(() => scaleLinear().domain([start, end]).range([pad.l, W - pad.r]), [start, end, pad.l, pad.r])
  const y = useMemo(() => scaleLinear().domain([0, max(series, (d) => d.area) ?? 1]).range([H - pad.b, pad.t]), [series, pad.b, pad.t])
  if (series.length === 0)
    return <p className="text-[12.5px] italic text-muted">No boundary polygons for this entity in the dataset, so its extent over time cannot be charted.</p>
  const path = series.map((d, i) => `${i ? 'L' : 'M'}${x(d.year).toFixed(1)},${y(d.area).toFixed(1)}`).join('')
  const area = `${path}L${x(series[series.length - 1].year)},${H - pad.b}L${x(series[0].year)},${H - pad.b}Z`
  const peak = series.reduce((a, b) => (b.area > a.area ? b : a))
  return (
    <figure>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" role="img" aria-label={`Mapped area across ${series.length} snapshots; peak ${formatArea(peak.area, units)} in ${formatYear(peak.year)}`}>
        <line x1={pad.l} x2={W - pad.r} y1={H - pad.b} y2={H - pad.b} stroke="#ddd2bb" />
        <path d={area} fill={color} opacity={0.16} />
        <path d={path} fill="none" stroke={color} strokeWidth={1.8} />
        {current !== undefined && current >= start && current <= end && <line x1={x(current)} x2={x(current)} y1={pad.t - 4} y2={H - pad.b} stroke="#26231f" strokeDasharray="2 2" strokeWidth={1} />}
        {series.map((d) => (
          <g key={d.year} onClick={() => onPick?.(d.year)} className={onPick ? 'cursor-pointer' : ''}>
            <title>{`${formatYear(d.year)} — ${formatArea(d.area, units)}`}</title>
            <circle cx={x(d.year)} cy={y(d.area)} r={8} fill="transparent" />
            <circle cx={x(d.year)} cy={y(d.area)} r={2.8} fill="#fbf8f1" stroke={color} strokeWidth={1.6} />
          </g>
        ))}
        <text x={pad.l} y={H - 4} fontSize={9.5} fill="#7b7366">{formatYear(start)}</text>
        <text x={W - pad.r} y={H - 4} fontSize={9.5} fill="#7b7366" textAnchor="end">{formatYear(end)}</text>
      </svg>
      <figcaption className="mt-1 text-[11.5px] text-muted">
        Peak mapped extent {formatArea(peak.area, units)} ({formatYear(peak.year)} snapshot). Points are documented snapshots only — nothing is interpolated between them.
      </figcaption>
    </figure>
  )
}
