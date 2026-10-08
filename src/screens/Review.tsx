import { useState } from 'react'
import { Sculpture, type View } from '../components/Sculpture'
import { Redirect, Sheet, TopBar, go } from '../components/ui'
import { FEATURES, INCLUDED_ROUNDS, STAGES, pron, type Feature } from '../lib/model'
import { useStore } from '../state/store'
import { stageFinish } from './Home'

const VIEWS: { id: View; label: string }[] = [
  { id: 'front', label: 'Front' },
  { id: 'left', label: 'Left' },
  { id: 'right', label: 'Right' },
]
const EXTRA_ROUND = 120

export function Review({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch, roundsLeft } = useStore()
  const c = state.commission!
  const name = c.dog.name
  const p = pron(c.dog.pronoun)
  const clay = c.stage === 3
  const [view, setView] = useState<View>('left')
  const [seen, setSeen] = useState<Set<View>>(new Set(['left']))
  const [sheet, setSheet] = useState<null | 'approve' | 'change'>(null)
  const [features, setFeatures] = useState<Feature[]>([])
  const [note, setNote] = useState('')

  if (!STAGES[c.stage].approval || c.revising) {
    return <Redirect to="/home" />
  }

  // Casting is the one step that can't be undone, so the clay asks for all three angles first.
  const allSeen = seen.size === VIEWS.length
  const canApprove = !clay || allSeen
  // Demo photos know their angle; real ones don't, so the owner flips to the one that matches.
  const [photoIdx, setPhotoIdx] = useState(0)
  const matched = c.photos.find((ph) => ph.angle === view)
  const ref = matched ?? c.photos[photoIdx % Math.max(1, c.photos.length)]
  const canFlip = !matched && c.photos.length > 1
  const fb = c.feedback[c.feedback.length - 1]
  const lastFb = fb && fb.stage === c.stage ? fb : null
  // Press-and-hold before/after: the sculpture morphs back to the previous version and
  // forward again, so the owner sees exactly what Ines changed rather than hunting for it.
  const [holding, setHolding] = useState(false)
  const prev = !clay && c.previous && c.previous.version < c.likeness.version ? c.previous : null
  const shown = holding && prev ? prev : c.likeness
  const pick = (v: View) => { setView(v); setSeen((s) => new Set(s).add(v)) }

  const approve = () => {
    setSheet(null)
    go('/home', 'back', () => dispatch({ type: 'approve' }))
    onToast(clay ? `Approved. ${name}’s sculpture is going to the foundry.` : `Approved. Ines will start the clay.`)
  }
  const send = () => {
    setSheet(null)
    go('/home', 'back', () => dispatch({ type: 'requestChanges', features, note: note.trim() }))
    onToast('Sent to Ines. She’ll reply with a new version.')
  }

  return (
    <>
      <TopBar title={clay ? 'Clay maquette' : `Likeness · version ${c.likeness.version}`} onBack={() => go('/home', 'back')} />
      <main className="screen">
        <div className="stack-lg">
          <div className="stack">
            <h1>Does this look like {name}?</h1>
            <p className="muted">
              {clay
                ? `This is the last look before casting. After you approve, the shape can’t be changed.`
                : `Take your time. Compare ${p.obj} from each side. Small things matter, so say so if anything feels off.`}
            </p>
          </div>

          <div className="stack">
            <div className="tabs" role="group" aria-label="Angle" style={{ '--i': VIEWS.findIndex((v) => v.id === view) } as React.CSSProperties}>
              <span className="tabs-thumb" aria-hidden="true" />
              {VIEWS.map((v) => (
                <button key={v.id} aria-pressed={view === v.id} onClick={() => pick(v.id)}>
                  {v.label}{clay && seen.has(v.id) ? ' ✓' : ''}
                </button>
              ))}
            </div>
            <div className="compare">
              <figure>
                <div className="pic">
                  {/* Keyed on angle: each switch plays a short turntable squash, so it reads as turning the piece, not swapping images. */}
                  <div key={view} className="turn">
                    {ref?.src === 'demo' ? (
                      <Sculpture view={view} finish="fur" grey tilt softEyes backdrop plinth={false} title={`Photo of ${name}, ${view}`} />
                    ) : ref?.src ? (
                      <img src={ref.src} alt={`Your photo of ${name}`} />
                    ) : (
                      <p className="caption" style={{ padding: 12, textAlign: 'center' }}>No photo</p>
                    )}
                  </div>
                  {canFlip && (
                    <button className="flip" onClick={() => setPhotoIdx((i) => (i + 1) % c.photos.length)} aria-label={`Show your next photo (${(photoIdx % c.photos.length) + 1} of ${c.photos.length})`}>
                      <span className="num">{(photoIdx % c.photos.length) + 1}/{c.photos.length}</span> ›
                    </button>
                  )}
                </div>
                <figcaption>{canFlip ? 'Your photos, tap › for the closest angle' : 'Your photo'}</figcaption>
              </figure>
              <figure>
                <div className="pic likeness-well vt-likeness">
                  <div key={view} className="turn">
                    <Sculpture view={view} finish={stageFinish(c)} form={c.piece} name={name} {...shown} title={`Sculpture of ${name}, ${view} view, version ${shown.version}`} />
                  </div>
                  {holding && <span className="pic-tag pop">Version {shown.version}</span>}
                </div>
                <figcaption aria-live="polite">{clay ? 'Clay' : `Likeness v${shown.version}`}</figcaption>
              </figure>
            </div>
            {prev && (
              <button
                className={`hold${holding ? ' held' : ''}`}
                onPointerDown={(e) => { e.currentTarget.setPointerCapture(e.pointerId); setHolding(true) }}
                onPointerUp={() => setHolding(false)}
                onPointerCancel={() => setHolding(false)}
                onKeyDown={(e) => { if ((e.key === ' ' || e.key === 'Enter') && !e.repeat) { e.preventDefault(); setHolding(true) } }}
                onKeyUp={() => setHolding(false)}
                onBlur={() => setHolding(false)}
                onContextMenu={(e) => e.preventDefault()}
              >
                {holding ? `Showing version ${prev.version}. Let go to return.` : `Press and hold to see version ${prev.version}`}
              </button>
            )}
          </div>

          {c.notes.trim() && (
            <div className="note">
              <p className="eyebrow">Your notes</p>
              <p style={{ marginTop: 4 }}>{c.notes}</p>
            </div>
          )}

          {lastFb && (
            <div className="note note-sage">
              <p className="eyebrow" style={{ color: 'inherit' }}>Changed since your last look</p>
              <p style={{ marginTop: 4 }}>
                {lastFb.features.map((f) => FEATURES.find((x) => x.id === f)!.label).join(', ') || 'Overall likeness'}
                {lastFb.note && <>: “{lastFb.note}”</>}
              </p>
            </div>
          )}
        </div>

        <div className="dock">
          {!canApprove && <p className="caption" role="status" style={{ textAlign: 'center', marginBottom: 8 }}>Look at all three sides before approving the clay.</p>}
          <div className="actions">
            <button className="btn btn-primary btn-block" disabled={!canApprove} onClick={() => setSheet('approve')}>
              {clay ? 'Approve for casting' : 'Yes, this is ' + name}
            </button>
            <button className="btn btn-secondary btn-block" onClick={() => setSheet('change')}>Something isn’t right</button>
          </div>
        </div>
      </main>

      <Sheet open={sheet === 'approve'} onClose={() => setSheet(null)} labelledBy="ap-h">
        <div className="stack">
          <h2 id="ap-h">{clay ? `Send ${name} to be cast?` : `Approve ${name}’s likeness?`}</h2>
          <p className="muted">
            {clay
              ? 'Once casting begins, the shape is fixed and your deposit is no longer refundable.'
              : 'Ines will start the clay maquette from this. You’ll still get one more look, and can ask for changes then.'}
          </p>
          <div className="actions">
            <button className="btn btn-primary btn-block" onClick={approve}>{clay ? 'Approve for casting' : 'Approve likeness'}</button>
            <button className="btn btn-quiet" onClick={() => setSheet(null)}>Keep looking</button>
          </div>
        </div>
      </Sheet>

      <Sheet open={sheet === 'change'} onClose={() => setSheet(null)} labelledBy="ch-h">
        <div className="stack">
          <h2 id="ch-h">What isn’t quite {name}?</h2>
          <fieldset>
            <legend className="legend">Choose any that apply</legend>
            <div className="chips" style={{ marginTop: 8 }}>
              {FEATURES.map((f) => (
                <label key={f.id} className="choice chip">
                  <input type="checkbox" checked={features.includes(f.id)} onChange={(e) => setFeatures((xs) => (e.target.checked ? [...xs, f.id] : xs.filter((x) => x !== f.id)))} />
                  <span className="face">{f.label}</span>
                </label>
              ))}
            </div>
          </fieldset>
          <div className="field">
            <label htmlFor="fb">Tell Ines in your own words</label>
            <textarea id="fb" className="textarea" style={{ minHeight: 96 }} value={note} onChange={(e) => setNote(e.target.value)} placeholder={`${p.pos[0].toUpperCase() + p.pos.slice(1)} head tilts more, and ${p.pos} ears sit lower…`} />
          </div>
          <p className={`note${roundsLeft === 0 ? ' note-amber' : ''}`}>
            {roundsLeft > 0
              ? `This uses 1 of your ${INCLUDED_ROUNDS} included rounds of changes. ${roundsLeft - 1} will be left.`
              : `You’ve used your ${INCLUDED_ROUNDS} included rounds. Further rounds are $${EXTRA_ROUND} each, added to your final balance.`}
          </p>
          <div className="actions">
            <button className="btn btn-primary btn-block" disabled={!features.length && !note.trim()} onClick={send}>Send to Ines</button>
            <button className="btn btn-quiet" onClick={() => setSheet(null)}>Cancel</button>
          </div>
        </div>
      </Sheet>
    </>
  )
}
