import { useState } from 'react'
import { Sculpture } from '../components/Sculpture'
import { Sheet, go } from '../components/ui'
import { useStore, emptyDraft } from '../state/store'

export function Welcome() {
  const { state, dispatch } = useStore()
  const [passed, setPassed] = useState(false)
  const draft = state.draft
  const draftName = draft?.dog.name.trim()

  const start = () => {
    go('/new', 'forward', () => { if (!draft) dispatch({ type: 'draft', draft: emptyDraft() }) })
  }
  const demo = () => {
    go('/home', 'forward', () => dispatch({ type: 'demo' }))
  }

  return (
    <main className="screen reveal">
      <p className="brand" style={{ textAlign: 'center', paddingTop: 'var(--s5)' }}>Good Boy Atelier</p>
      <div className="portrait hero" aria-hidden="true">
        <div className="ring"><Sculpture view="left" finish="bronze" tilt grey softEyes /></div>
        <span className="sticker" style={{ left: '6%', top: '30%' }}>🦴</span>
        <span className="sticker sm" style={{ left: '22%', top: '10%' }}>🧸</span>
        <span className="sticker" style={{ right: '8%', top: '12%' }}>🌳</span>
        <span className="sticker" style={{ right: '16%', bottom: '4%', width: 60, height: 60, fontSize: 32 }}>🎾</span>
        <span className="pill-tag" style={{ left: '2%', bottom: '14%', rotate: '-7deg' }}>Good boy,</span>
        <span className="pill-tag lime" style={{ right: '3%', top: '44%', rotate: '6deg' }}>forever</span>
      </div>

      <div className="stack-lg">
        <div className="stack">
          <h1 className="display">A sculpture of your dog, made while they’re <em>still beside you.</em></h1>
          <p className="muted">A keychain to carry, a sculpture for home, or an urn to hold them. Take the photos together on a good day, and we’ll sculpt slowly and show you every step.</p>
        </div>

        <ol className="list card" style={{ padding: '4px 20px' }} aria-label="How it works">
          {[
            ['Photos, together', 'A short guided set, taken at home. About 15 minutes.'],
            ['You approve the likeness', 'Nothing is cast until you say it looks like them.'],
            ['Yours when you want it', 'A keychain to carry now, or an urn held safe until it’s needed.'],
          ].map(([t, d], i) => (
            <li key={t} className="row" style={{ padding: '14px 0', alignItems: 'flex-start' }}>
              <span className="serif num" style={{ fontSize: 26, width: 22, flex: 'none', lineHeight: 1 }}>{i + 1}</span>
              <span>
                <span style={{ fontWeight: 600, display: 'block' }}>{t}</span>
                <span className="muted" style={{ fontSize: 'var(--t-sm)' }}>{d}</span>
              </span>
            </li>
          ))}
        </ol>

        <div className="actions">
          <button className="btn btn-primary btn-block" onClick={start}>
            {draft ? `Continue ${draftName ? draftName + '’s' : 'your'} commission` : 'Begin a commission'}
          </button>
          {draft && (
            <button className="btn btn-secondary btn-block" onClick={() => go('/new', 'forward', () => dispatch({ type: 'draft', draft: emptyDraft() }))}>
              Start over
            </button>
          )}
          <button className="btn btn-secondary btn-block" onClick={demo}>See an example: Bo’s commission</button>
          <button className="btn btn-quiet" onClick={() => setPassed(true)}>My dog has already passed</button>
        </div>
      </div>

      <Sheet open={passed} onClose={() => setPassed(false)} labelledBy="passed-h">
        <div className="stack">
          <h2 id="passed-h">We’re so sorry.</h2>
          <p className="muted">
            This service is designed for the time before, so we can take reference photos together. We can still work from the photos you already have.
            The likeness takes a little longer, and we’ll ask more questions along the way.
          </p>
          <div className="actions">
            <button className="btn btn-primary btn-block" onClick={() => { setPassed(false); start() }}>Continue with my photos</button>
            <button className="btn btn-quiet" onClick={() => setPassed(false)}>Not right now</button>
          </div>
        </div>
      </Sheet>
    </main>
  )
}
