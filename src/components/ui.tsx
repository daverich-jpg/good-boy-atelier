import { useEffect, useRef, useState, useSyncExternalStore, type ReactNode } from 'react'
import { flushSync } from 'react-dom'

/* ---------- hash router ---------- */
const listeners = new Set<() => void>()
const notify = () => listeners.forEach((l) => l())
const sub = (cb: () => void) => {
  listeners.add(cb)
  window.addEventListener('hashchange', cb)
  return () => { listeners.delete(cb); window.removeEventListener('hashchange', cb) }
}
export function useRoute() {
  return useSyncExternalStore(sub, () => window.location.hash.slice(1) || '/')
}

export type Dir = 'forward' | 'back' | 'fade'
const reduced = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches

/**
 * Runs a DOM-changing update inside a View Transition, so screens slide instead of
 * hard-cutting and named elements (the sculpture, the step bar) morph between states.
 * `dir` picks the slide direction via a data attribute the CSS reads.
 */
export function transition(update: () => void, dir: Dir = 'forward') {
  const doc = document as Document & { startViewTransition?: (cb: () => void) => unknown }
  if (!doc.startViewTransition || reduced()) return update()
  document.documentElement.dataset.dir = dir
  doc.startViewTransition(() => flushSync(update))
}

/** Navigate. `withState` runs inside the same transition, so the new screen and the new data arrive together. */
export function go(path: string, dir: Dir = 'forward', withState?: () => void) {
  transition(() => {
    withState?.()
    history.pushState(null, '', '#' + path)
    notify()
    window.scrollTo(0, 0)
  }, dir)
}

export function Redirect({ to }: { to: string }) {
  useEffect(() => { window.location.replace('#' + to) }, [to])
  return null
}

/* ---------- icons ---------- */
const P = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const
export const Icon = {
  back: <svg viewBox="0 0 24 24" {...P}><path d="M15 5l-7 7 7 7" /></svg>,
  close: <svg viewBox="0 0 24 24" {...P}><path d="M6 6l12 12M18 6L6 18" /></svg>,
  settings: <svg viewBox="0 0 24 24" {...P}><circle cx="12" cy="12" r="3" /><path d="M12 2v3M12 19v3M4.2 4.2l2.1 2.1M17.7 17.7l2.1 2.1M2 12h3M19 12h3M4.2 19.8l2.1-2.1M17.7 6.3l2.1-2.1" /></svg>,
  camera: <svg viewBox="0 0 24 24" {...P}><path d="M4 8h3l2-3h6l2 3h3v11H4z" /><circle cx="12" cy="13" r="3.5" /></svg>,
  check: <svg viewBox="0 0 24 24" {...P} strokeWidth={2.4}><path d="M5 12.5l4.5 4.5L19 7.5" /></svg>,
}

/* ---------- top bar ---------- */
export function TopBar({ title, onBack, backIcon = 'back', right }: { title?: ReactNode; onBack?: () => void; backIcon?: 'back' | 'close'; right?: ReactNode }) {
  return (
    <header className="topbar">
      <div className="tb-slot">
        {onBack && (
          <button className="icon-btn" onClick={onBack} aria-label={backIcon === 'close' ? 'Close' : 'Back'}>
            {Icon[backIcon]}
          </button>
        )}
      </div>
      <div className="title">{title}</div>
      <div className="tb-slot">{right}</div>
    </header>
  )
}

/* ---------- bottom sheet (native <dialog>: focus trap, Esc, inert page for free) ---------- */
export function Sheet({ open, onClose, labelledBy, children }: { open: boolean; onClose: () => void; labelledBy: string; children: ReactNode }) {
  const ref = useRef<HTMLDialogElement>(null)
  // Keep content mounted while the exit animation plays, so it never just vanishes.
  const [shown, setShown] = useState(open)
  useEffect(() => {
    const d = ref.current
    if (!d) return
    if (open) {
      setShown(true)
      d.classList.remove('closing')
      if (!d.open) d.showModal()
      return
    }
    if (!d.open) return
    if (reduced()) { d.close(); setShown(false); return }
    d.classList.add('closing')
    const t = window.setTimeout(() => { d.close(); d.classList.remove('closing'); setShown(false) }, 160)
    return () => window.clearTimeout(t)
  }, [open])
  return (
    <dialog
      ref={ref}
      className="sheet"
      aria-labelledby={labelledBy}
      onCancel={(e) => { e.preventDefault(); onClose() }}
      onClick={(e) => e.target === ref.current && onClose()}
    >
      {shown && children}
    </dialog>
  )
}

/* ---------- toast ---------- */
export function useToast() {
  const [msg, setMsg] = useState<string | null>(null)
  const [leaving, setLeaving] = useState(false)
  useEffect(() => {
    if (!msg) return
    setLeaving(false)
    const a = window.setTimeout(() => setLeaving(true), 3000)
    const b = window.setTimeout(() => setMsg(null), 3160)
    return () => { window.clearTimeout(a); window.clearTimeout(b) }
  }, [msg])
  const node = (
    <div aria-live="polite">
      {msg && <div key={msg} className={`toast${leaving ? ' leaving' : ''}`} role="status">{msg}</div>}
    </div>
  )
  return [node, setMsg] as const
}

/** Eases a number toward its target, so a price change reads as a change, not a flicker. */
export function useTweened(target: number, ms = 380) {
  const [v, setV] = useState(target)
  const from = useRef(target)
  useEffect(() => {
    if (reduced()) { setV(target); from.current = target; return }
    const start = performance.now()
    const a = from.current
    let raf = 0
    const tick = (t: number) => {
      const k = Math.min(1, (t - start) / ms)
      const e = 1 - Math.pow(1 - k, 3)
      const x = Math.round(a + (target - a) * e)
      setV(x)
      from.current = x
      if (k < 1) raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(raf)
  }, [target, ms])
  return v
}

export function when(t: number) {
  const d = Date.now() - t
  const m = Math.round(d / 60000)
  if (m < 1) return 'Just now'
  if (m < 60) return `${m} min ago`
  const h = Math.round(m / 60)
  if (h < 24) return `${h} hr ago`
  const days = Math.round(h / 24)
  return days === 1 ? 'Yesterday' : `${days} days ago`
}
