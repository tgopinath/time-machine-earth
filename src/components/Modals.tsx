import { useApp } from '../store/app'
import { Modal, GhostButton, Badge } from './ui'
import { BADGES } from '../data/badges'
import { clear as idbClear } from 'idb-keyval'
import { useState } from 'react'

export function SettingsModal({ onClose }: { onClose: () => void }) {
  const { settings, updateSettings, setView } = useApp()
  const [cleared, setCleared] = useState(false)
  const Row = ({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) => (
    <div className="flex items-center justify-between gap-4 border-b border-line/70 px-5 py-3.5 last:border-b-0">
      <div><div className="text-[13.5px] text-ink">{label}</div>{hint && <div className="text-[11.5px] text-muted">{hint}</div>}</div>
      <div className="shrink-0">{children}</div>
    </div>
  )
  return (
    <Modal title="Settings" onClose={onClose}>
      <Row label="Map projection" hint="3D globe or flat map">
        <div className="flex gap-1">
          <GhostButton active={settings.projection === 'mercator'} onClick={() => updateSettings({ projection: 'mercator' })}>Flat</GhostButton>
          <GhostButton active={settings.projection === 'globe'} onClick={() => updateSettings({ projection: 'globe' })}>Globe</GhostButton>
        </div>
      </Row>
      <Row label="Area units">
        <div className="flex gap-1">
          <GhostButton active={settings.units === 'km'} onClick={() => updateSettings({ units: 'km' })}>km²</GhostButton>
          <GhostButton active={settings.units === 'mi'} onClick={() => updateSettings({ units: 'mi' })}>mi²</GhostButton>
        </div>
      </Row>
      <Row label="Playback narration" hint="Summaries of what changed at each snapshot">
        <input type="checkbox" className="h-4 w-4 accent-[#9a6b34]" checked={settings.narration} onChange={(e) => updateSettings({ narration: e.target.checked })} />
      </Row>
      <Row label="Read narration aloud" hint="Uses your browser's speech synthesis">
        <input type="checkbox" className="h-4 w-4 accent-[#9a6b34]" checked={settings.speech} disabled={!('speechSynthesis' in window)} onChange={(e) => updateSettings({ speech: e.target.checked })} />
      </Row>
      <Row label="Reduce motion" hint="Instant camera moves, no fades">
        <input type="checkbox" className="h-4 w-4 accent-[#9a6b34]" checked={settings.reduceMotion} onChange={(e) => updateSettings({ reduceMotion: e.target.checked })} />
      </Row>
      <Row label="Cached map data" hint="Boundary snapshots stored in this browser for faster loading">
        <GhostButton onClick={() => idbClear().then(() => setCleared(true)).catch(() => setCleared(true))}>{cleared ? 'Cleared' : 'Clear cache'}</GhostButton>
      </Row>
      <Row label="Data & sources" hint="Datasets, licences and known conflicts">
        <GhostButton onClick={() => { setView('sources'); onClose() }}>Open</GhostButton>
      </Row>
    </Modal>
  )
}

export function ProfileModal({ onClose }: { onClose: () => void }) {
  const { profileName, setProfileName, quiz, saved, resetProgress, setView } = useApp()
  const acc = quiz.answered ? Math.round((quiz.correct / quiz.answered) * 100) : 0
  return (
    <Modal title="Profile" onClose={onClose}>
      <div className="px-5 py-4">
        <label className="text-[12px] text-muted">Display name
          <input value={profileName} onChange={(e) => setProfileName(e.target.value.slice(0, 40))} className="mt-1 block w-full rounded-md border border-line bg-ivory px-3 py-2 text-[14px] text-ink focus:border-bronze focus:outline-none" />
        </label>
        <p className="mt-2 text-[11.5px] text-muted">Your profile, progress and saved places are stored only in this browser. No account is needed.</p>
        <div className="mt-4 grid grid-cols-4 gap-2 text-center">
          {[[quiz.points, 'points'], [`${acc}%`, 'accuracy'], [quiz.explored.length, 'explored'], [saved.length, 'saved']].map(([v, l]) => (
            <div key={String(l)} className="rounded-lg border border-line bg-ivory/60 py-2"><div className="font-serif text-[22px] text-ink">{v}</div><div className="text-[11px] text-muted">{l}</div></div>
          ))}
        </div>
        <div className="mt-4">
          <div className="text-[10.5px] font-semibold uppercase tracking-[0.14em] text-muted">Badges</div>
          <div className="mt-1.5 flex flex-wrap gap-1.5">
            {quiz.badges.length === 0 && <span className="text-[12.5px] italic text-muted">None yet — try Learn mode.</span>}
            {quiz.badges.map((b) => <Badge key={b} tone="bronze">{BADGES.find((x) => x.id === b)?.label ?? b}</Badge>)}
          </div>
        </div>
        <div className="mt-5 flex gap-2">
          <GhostButton onClick={() => { setView('learn'); onClose() }}>Go to Learn</GhostButton>
          <GhostButton onClick={() => { setView('saved'); onClose() }}>Saved places</GhostButton>
          <GhostButton onClick={() => confirm('Reset quiz progress and badges?') && resetProgress()}>Reset progress</GhostButton>
        </div>
      </div>
    </Modal>
  )
}
