import { useEffect, useRef, useState } from 'react'
import { Sculpture, type View } from './Sculpture'
import { Icon, transition } from './ui'
import { readPhoto } from '../lib/photo'
import { SLOTS, type Ref, type SlotId } from '../lib/model'

const VIEW: Partial<Record<SlotId, View>> = { front: 'front', left: 'left', right: 'right' }
const ADVANCE_MS = 900

type Refs = Partial<Record<SlotId, Ref>>

/**
 * Guided capture: one photo at a time. A single focus card asks for one angle; the rest
 * wait in a filmstrip. Thumbnails and the card share view-transition names, so the next
 * request grows out of the strip and a finished photo shrinks back into it.
 */
export function PhotoCapture({ name, refs, onChange, onFinished }: { name: string; refs: Refs; onChange: (id: SlotId, r: Ref) => void; onFinished?: (done: boolean) => void }) {
  const firstOpen = () => {
    const i = SLOTS.findIndex((s) => !refs[s.id]?.src)
    return i === -1 ? SLOTS.length : i
  }
  // SLOTS.length is the "all done" card.
  const [active, setActive] = useState(firstOpen)
  const [skipped, setSkipped] = useState<Set<SlotId>>(new Set())
  const [preview, setPreview] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [justTaken, setJustTaken] = useState(false)
  const camera = useRef<HTMLInputElement>(null)
  const library = useRef<HTMLInputElement>(null)
  const timer = useRef(0)
  useEffect(() => () => window.clearTimeout(timer.current), [])

  const done = active >= SLOTS.length
  useEffect(() => onFinished?.(done), [done, onFinished])
  const slot = SLOTS[active]
  const ref = slot ? refs[slot.id] : undefined
  const has = !!ref?.src
  const issues = ref?.issues ?? []
  const requiredLeft = SLOTS.filter((s) => s.required && !refs[s.id]?.src)

  /** The next shot that still needs something, after `from`. Falls through to the done card. */
  const nextOpen = (from: number, taken: Refs = refs, skip = skipped) => {
    for (let i = from + 1; i < SLOTS.length; i++) if (!taken[SLOTS[i].id]?.src && !skip.has(SLOTS[i].id)) return i
    const req = SLOTS.findIndex((s) => s.required && !taken[s.id]?.src)
    return req === -1 ? SLOTS.length : req
  }
  const goTo = (i: number) => {
    window.clearTimeout(timer.current)
    setJustTaken(false)
    transition(() => setActive(i), i < active ? 'back' : 'forward')
  }

  const take = async (file: File | undefined) => {
    if (!file || !slot) return
    window.clearTimeout(timer.current)
    const url = URL.createObjectURL(file)
    setPreview(url)
    setBusy(true)
    try {
      // The check takes ~50ms; holding the scan for a beat shows the photo was really looked at.
      const [r] = await Promise.all([readPhoto(file), new Promise((res) => setTimeout(res, 700))])
      onChange(slot.id, r)
      setJustTaken(true)
      if (r.src && !r.issues.length) {
        const taken = { ...refs, [slot.id]: r }
        timer.current = window.setTimeout(() => goTo(nextOpen(active, taken)), ADVANCE_MS)
      }
    } finally {
      setBusy(false)
      setPreview(null)
      URL.revokeObjectURL(url)
    }
  }

  const skip = (all = false) => {
    const s = new Set(skipped)
    SLOTS.forEach((x, i) => { if (!x.required && (all ? i >= active : i === active)) s.add(x.id) })
    setSkipped(s)
    goTo(nextOpen(active, refs, s))
  }

  const status = (id: SlotId) => {
    const r = refs[id]
    if (r?.src) return r.issues.length ? 'warn' : 'ok'
    return skipped.has(id) ? 'skipped' : 'empty'
  }

  return (
    <div className="capture">
      <ol className="filmstrip" aria-label="Photos">
        {SLOTS.map((s, i) => {
          const st = status(s.id)
          const r = refs[s.id]
          return (
            <li key={s.id}>
              <button
                className={`frame ${st}${i === active ? ' current' : ''}`}
                style={{ viewTransitionName: i === active ? undefined : `ph-${s.id}` }}
                onClick={() => goTo(i)}
                aria-current={i === active ? 'step' : undefined}
                aria-label={`${s.label}${s.required ? '' : ', optional'}: ${st === 'ok' ? 'done' : st === 'warn' ? 'taken, has a note' : st === 'skipped' ? 'skipped' : 'not taken yet'}`}
              >
                {r?.src ? <Thumb id={s.id} src={r.src} /> : <Sculpture view={VIEW[s.id] ?? 'left'} finish="sketch" plinth={false} />}
                {st === 'ok' && <span className="tick" aria-hidden="true">{Icon.check}</span>}
                {st === 'warn' && <span className="tick alert" aria-hidden="true">!</span>}
              </button>
            </li>
          )
        })}
      </ol>

      {done ? (
        <section className="shot card" aria-live="polite">
          <div className="shot-frame done-frame">
            <div className="done-grid">
              {SLOTS.filter((s) => refs[s.id]?.src).map((s) => <Thumb key={s.id} id={s.id} src={refs[s.id]!.src} />)}
            </div>
          </div>
          <div className="stack" style={{ marginTop: 14 }}>
            <h2>That’s everything we need</h2>
            <p className="muted">
              {SLOTS.filter((s) => refs[s.id]?.src).length} photos of {name}. Tap any of them above to retake it.
            </p>
          </div>
        </section>
      ) : (
        <section className="shot card" aria-labelledby="shot-h">
          <div className="shot-meta">
            <span className="caption num" aria-live="polite">Photo {active + 1} of {SLOTS.length}</span>
            <span className={`badge${slot.required ? '' : ' badge-quiet'}`}>{slot.required ? 'Needed' : 'Optional'}</span>
          </div>

          <div className="shot-frame" style={{ viewTransitionName: `ph-${slot.id}` }}>
            {preview || has ? (
              <>
                {preview ? <img src={preview} alt="" /> : <Thumb id={slot.id} src={ref!.src} alt={`${name}, ${slot.label.toLowerCase()}`} />}
                {busy && <span className="scan" aria-hidden="true" />}
              </>
            ) : (
              // The pose to match: the same angle, drawn as a guide.
              <div className="guide" aria-hidden="true"><Sculpture view={VIEW[slot.id] ?? 'left'} finish="sketch" plinth={false} /></div>
            )}
            {!busy && justTaken && has && (
              <span className={`verdict pop ${issues.length ? 'warn' : 'ok'}`} role="status">
                {issues.length ? 'Worth a retake' : <><span className="v-tick">{Icon.check}</span>Good to use</>}
              </span>
            )}
          </div>

          <div className="stack" style={{ marginTop: 14 }}>
            <h2 id="shot-h">{slot.label}</h2>
            <p className={issues.length && has ? 'shot-tip warn' : 'shot-tip muted'} aria-live="polite">
              {busy ? 'Checking light and focus…' : has && issues.length ? issues[0] : slot.tip}
            </p>
          </div>

          <input ref={camera} type="file" accept="image/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void take(f) }} />
          <input ref={library} type="file" accept="image/*" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; void take(f) }} />

          <div className="actions" style={{ marginTop: 16, gap: 4 }}>
            {has && !issues.length && !busy ? (
              <>
                <button className="btn btn-primary btn-block" onClick={() => goTo(nextOpen(active))}>{nextLabel(nextOpen(active))}</button>
                <button className="btn btn-secondary btn-block" onClick={() => camera.current?.click()}>Retake</button>
              </>
            ) : has && issues.length && !busy ? (
              <>
                <button className="btn btn-primary btn-block" onClick={() => camera.current?.click()}>Retake</button>
                <button className="btn btn-secondary btn-block" onClick={() => goTo(nextOpen(active))}>Use it anyway</button>
              </>
            ) : (
              <>
                <button className="btn btn-primary btn-block" disabled={busy} onClick={() => camera.current?.click()}>{Icon.camera}Take photo</button>
                <button className="btn btn-quiet" disabled={busy} onClick={() => library.current?.click()}>or choose one you already have</button>
              </>
            )}
            {!slot.required && !has && !busy && (
              <div className="row" style={{ justifyContent: 'center', gap: 4 }}>
                <button className="btn btn-quiet" onClick={() => skip()}>Skip this one</button>
                {active < SLOTS.length - 1 && <button className="btn btn-quiet" onClick={() => skip(true)}>Skip the rest</button>}
              </div>
            )}
          </div>
        </section>
      )}

      {!done && requiredLeft.length > 0 && active >= 3 && (
        <p className="caption" style={{ textAlign: 'center' }}>Still needed: {requiredLeft.map((s) => s.label.toLowerCase()).join(', ')}.</p>
      )}
    </div>
  )

  function nextLabel(i: number) {
    if (i >= SLOTS.length) return 'Done'
    return `Next: ${SLOTS[i].label.toLowerCase()}`
  }
}

function Thumb({ id, src, alt = '' }: { id: SlotId; src: string; alt?: string }) {
  return src === 'demo'
    ? <Sculpture view={VIEW[id] ?? 'left'} finish="fur" grey tilt softEyes backdrop plinth={false} />
    : <img src={src} alt={alt} />
}
