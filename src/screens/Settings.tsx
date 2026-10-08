import { useState } from 'react'
import { Sculpture } from '../components/Sculpture'
import { Sheet, TopBar, go } from '../components/ui'
import { money, priceOf, type Delivery, type IfPasses, type UpdatePref } from '../lib/model'
import { useStore } from '../state/store'

export function Settings({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const c = state.commission!
  const name = c.dog.name
  const [reset, setReset] = useState(false)

  const radio = <T extends string>(group: string, value: T, current: T, onPick: (v: T) => void, t: string, d: string) => (
    <label key={value} className="choice">
      <input type="radio" name={group} checked={current === value} onChange={() => onPick(value)} />
      <span className="face"><span className="dot" /><span><span className="t">{t}</span><br /><span className="d">{d}</span></span></span>
    </label>
  )
  const setUpdates = (v: UpdatePref) => { dispatch({ type: 'prefs', prefs: { updates: v } }); onToast('Saved.') }
  const setIf = (v: IfPasses) => { dispatch({ type: 'prefs', prefs: { ifPasses: v } }); onToast('Saved.') }
  const setDelivery = (v: Delivery) => { dispatch({ type: 'prefs', prefs: { delivery: v } }); onToast('Saved.') }

  return (
    <>
      <TopBar title="Settings" onBack={() => go('/home', 'back')} />
      <main className="screen">
        <div className="stack-lg">
          <fieldset className="stack">
            <legend><h2>How often we contact you</h2></legend>
            {radio('up', 'every', c.prefs.updates, setUpdates, 'Every step', 'A short note and photo as each stage happens.')}
            {radio('up', 'approvals', c.prefs.updates, setUpdates, 'Only when I need to look', 'We’ll stay quiet unless something needs your approval.')}
            {radio('up', 'paused', c.prefs.updates, setUpdates, 'Not right now', 'No messages at all. The app still shows progress if you open it.')}
          </fieldset>

          <fieldset className="stack">
            <legend><h2>When it’s finished</h2></legend>
            {radio('deliv', 'ready', c.prefs.delivery, setDelivery, 'Send it to me', 'Usually 3 to 5 days after finishing.')}
            {radio('deliv', 'hold', c.prefs.delivery, setDelivery, 'Keep it safe until I ask', 'We hold it for as long as you need. There’s no deadline.')}
          </fieldset>

          <fieldset className="stack">
            <legend><h2>If {name} dies before it’s finished</h2></legend>
            {radio('ifp', 'continue', c.prefs.ifPasses, setIf, 'Keep going quietly', 'Ines carries on. We only contact you when you need to look at something.')}
            {radio('ifp', 'pause', c.prefs.ifPasses, setIf, 'Pause everything', 'Nothing happens until you tell us you’re ready.')}
          </fieldset>

          <section className="stack">
            <h2>Pause the commission</h2>
            <p className="muted">Stops all work and all messages. Resume whenever you like. Nothing is lost.</p>
            <button className="btn btn-secondary btn-block" onClick={() => { go('/home', 'back', () => dispatch({ type: 'pause', paused: !c.paused })); onToast(c.paused ? 'Resumed.' : 'Paused. Take all the time you need.') }}>
              {c.paused ? 'Resume the commission' : 'Pause the commission'}
            </button>
          </section>

          <section className="stack">
            <h2>Need to talk?</h2>
            <p className="muted">Ines and the studio team read every message themselves. Weekdays, 9 to 5.</p>
            <button className="btn btn-secondary btn-block" onClick={() => onToast('Messaging isn’t part of the prototype.')}>Message the studio</button>
          </section>

          {c.demo ? (
            <section className="note">
              <p className="eyebrow">Prototype</p>
              <p style={{ margin: '4px 0 12px' }}>This is an example commission.</p>
              <button className="btn btn-secondary btn-block" onClick={() => setReset(true)}>Leave the example</button>
            </section>
          ) : (
            <section className="note">
              <p className="eyebrow">Prototype</p>
              <p style={{ margin: '4px 0 12px' }}>Clear this commission and start again.</p>
              <button className="btn btn-secondary btn-block" onClick={() => setReset(true)}>Clear and start again</button>
            </section>
          )}
        </div>
      </main>

      <Sheet open={reset} onClose={() => setReset(false)} labelledBy="rs-h">
        <div className="stack">
          <h2 id="rs-h">{c.demo ? 'Leave Bo’s example?' : `Clear ${name}’s commission?`}</h2>
          <p className="muted">{c.demo ? 'You’ll return to the start. You can open the example again any time.' : 'This removes the photos and notes from this device. It can’t be undone.'}</p>
          <div className="actions">
            <button className="btn btn-primary btn-block" onClick={() => { setReset(false); go('/', 'fade', () => dispatch({ type: 'reset' })) }}>{c.demo ? 'Leave the example' : 'Clear it'}</button>
            <button className="btn btn-quiet" onClick={() => setReset(false)}>Cancel</button>
          </div>
        </div>
      </Sheet>
    </>
  )
}

export function Details({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const c = state.commission!
  const [notes, setNotes] = useState(c.notes)
  const locked = c.stage > 3
  const price = priceOf(c)
  const dirty = notes !== c.notes

  return (
    <>
      <TopBar title="Photos & notes" onBack={() => go('/home', 'back')} />
      <main className="screen">
        <div className="stack-lg">
          <section className="stack">
            <h2>{c.dog.name}’s photos</h2>
            <div className="slots" style={{ gridTemplateColumns: "repeat(3, 1fr)" }}>
              {c.photos.map((ph, i) => (
                <figure key={ph.id} className="slot filled" style={{ margin: 0, cursor: 'default' }}>
                  <div className="thumb">
                    {ph.src === 'demo'
                      ? <Sculpture view={ph.angle ?? 'left'} finish="fur" grey tilt softEyes backdrop plinth={false} />
                      : <img src={ph.src} alt={`${c.dog.name}, photo ${i + 1}`} />}
                  </div>
                </figure>
              ))}
            </div>
          </section>

          <section className="field">
            <label htmlFor="n2"><h2>Notes for Ines</h2></label>
            <span className="hint">{locked ? 'The shape is fixed now, so notes can’t change the sculpture.' : 'Remembered something? Add it here. Ines sees changes straight away.'}</span>
            <textarea id="n2" className="textarea" value={notes} readOnly={locked} onChange={(e) => setNotes(e.target.value)} />
            {!locked && (
              <button className="btn btn-secondary btn-block" disabled={!dirty} onClick={() => { dispatch({ type: 'notes', notes }); onToast('Notes saved and shared with Ines.') }}>
                Save notes
              </button>
            )}
          </section>

          <section className="card">
            <dl style={{ margin: 0 }}>
              <div className="kv"><dt>Total</dt><dd>{money(price.total)}</dd></div>
              <div className="kv"><dt>Deposit paid</dt><dd>{money(price.deposit)}</dd></div>
              <div className="kv"><dt>Due when it’s sent</dt><dd>{money(price.total - price.deposit)}</dd></div>
              <div className="kv"><dt>Deposit refundable</dt><dd>{c.stage <= 3 ? 'Yes, until the clay is approved' : 'No, casting has begun'}</dd></div>
            </dl>
          </section>
        </div>
      </main>
    </>
  )
}
