import { useEffect, useRef, useState } from 'react'
import { Sculpture, type Finish } from '../components/Sculpture'
import { Icon, Sheet, TopBar, go, when } from '../components/ui'
import { FEATURES, STAGES, describe, type Commission, type Update } from '../lib/model'
import { useStore } from '../state/store'

export function stageFinish(c: Commission, stage = c.stage): Finish {
  if (stage <= 2) return 'stone' // digital render: neutral grey
  if (stage === 3) return 'clay'
  return c.material
}

export function Home({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch } = useStore()
  const c = state.commission!
  const name = c.dog.name
  const stage = STAGES[c.stage]
  const [deliver, setDeliver] = useState(false)
  const lastFb = c.feedback[c.feedback.length - 1]
  const hold = c.prefs.delivery === 'hold'

  // Remember what this screen last showed, so changes since then can be animated in:
  // newly completed steps draw their check, and a new likeness version announces itself.
  const seen = useRef({ stage: c.stage, version: c.likeness.version })
  const [first] = useState(() => !readSeen(c.id))
  const [justDone, setJustDone] = useState<number[]>([])
  const [fresh, setFresh] = useState(false)
  useEffect(() => {
    const prev = readSeen(c.id) ?? seen.current
    if (c.stage > prev.stage) setJustDone(Array.from({ length: c.stage - prev.stage }, (_, i) => prev.stage + i))
    if (c.likeness.version > prev.version) setFresh(true)
    seen.current = { stage: c.stage, version: c.likeness.version }
    writeSeen(c.id, seen.current)
  }, [c.id, c.stage, c.likeness.version])

  // One sculpture element across "revising" and "needs your eyes", so when the new
  // version lands the ears drop and the head tilts in place, instead of a card swap.
  const art = (
    <div className="stage-art vt-likeness" style={{ marginTop: 12 }}>
      <Sculpture view="left" finish={stageFinish(c)} form={c.piece} name={name} {...c.likeness} />
      {c.revising && <div className="sculpting" aria-hidden="true" />}
    </div>
  )

  return (
    <>
      <TopBar
        title={<span className="brand">Good Boy Atelier</span>}
        right={<button className="icon-btn" onClick={() => go('/settings')} aria-label="Settings">{Icon.settings}</button>}
      />
      <main className="screen">
        <div className={`stack-lg${first ? ' reveal' : ''}`}>
          <Portrait c={c} />
          <div className="stack">
            <h1>{name}’s {c.piece}</h1>
            <p className="muted" style={{ marginTop: 4 }}>
              {describe(c)} · {hold ? 'held until you ask' : 'sent when it’s ready'}
            </p>
          </div>

          {/* What, if anything, needs the owner right now. Exactly one state shows. */}
          <section aria-labelledby="now-h" className="card stack">
            {c.paused ? (
              <>
                <span className="badge">Paused</span>
                <h2 id="now-h">Everything is on hold</h2>
                <p className="muted">Nothing will happen, and we won’t contact you, until you resume.</p>
                <button className="btn btn-primary btn-block" onClick={() => { dispatch({ type: 'pause', paused: false }); onToast('Resumed. Ines will pick up where she left off.') }}>Resume</button>
              </>
            ) : c.revising ? (
              <>
                <span className="badge badge-clay"><span className="pulse" aria-hidden="true" />Ines is working</span>
                {art}
                <h2 id="now-h">Revising the likeness</h2>
                <p className="muted">
                  From your notes on {lastFb.features.map((f) => FEATURES.find((x) => x.id === f)!.label.toLowerCase()).join(', ') || 'the overall likeness'}.
                  We’ll let you know when version {c.likeness.version + 1} is ready.
                </p>
                <p className="caption">In the prototype this takes a few seconds. In reality, two to four days.</p>
              </>
            ) : stage.approval ? (
              <>
                <span className={`badge badge-clay${fresh ? ' pop' : ''}`}>{fresh ? `Version ${c.likeness.version} has arrived` : 'Needs your eyes'}</span>
                {art}
                <h2 id="now-h">{c.stage === 3 ? `The clay ${name} is ready for you` : c.likeness.version > 1 ? `Version ${c.likeness.version} is ready for you` : `${name}’s likeness is ready for you`}</h2>
                <p className="muted">Look whenever you feel like it. Nothing moves forward without you.</p>
                <button className="btn btn-primary btn-block" onClick={() => go('/review')}>
                  {c.stage === 2 ? 'Review the likeness' : 'Review the clay'}
                </button>
              </>
            ) : stage.key === 'held' ? (
              <>
                <span className="badge badge-sage">Finished</span>
                <div className="stage-art" style={{ marginTop: 12 }}><Sculpture view="left" finish={c.material} form={c.piece} name={name} {...c.likeness} /></div>
                {hold ? (
                  <>
                    <h2 id="now-h">Kept safe until you need it</h2>
                    <p className="muted">There’s no deadline. Ask for it when the time is right.</p>
                    <button className="btn btn-secondary btn-block" onClick={() => setDeliver(true)}>Ask for it to be sent</button>
                  </>
                ) : (
                  <>
                    <h2 id="now-h">On its way to you</h2>
                    <p className="muted">Packed by hand. It should arrive in 3 to 5 days.</p>
                  </>
                )}
              </>
            ) : (
              <>
                <span className="badge">Nothing needed from you</span>
                <h2 id="now-h">{stage.label}</h2>
                <p className="muted">{c.stage === 0 ? 'Ines will begin with a study of the head shape.' : 'We’ll send a photo when there’s something to see.'}</p>
              </>
            )}
          </section>

          <section aria-labelledby="tl-h" className="stack">
            <h2 id="tl-h">Progress</h2>
            <ol className="timeline">
              {STAGES.map((s, i) => {
                const st = i < c.stage ? 'done' : i === c.stage ? 'now' : ''
                const anim = justDone.includes(i) ? ' just-done' : justDone.length && i === c.stage ? ' just-now' : ''
                return (
                  <li key={s.key} className={st + anim} style={{ '--d': `${justDone.indexOf(i) * 160}ms` } as React.CSSProperties} aria-current={i === c.stage ? 'step' : undefined}>
                    <span className="mark" aria-hidden="true">{i < c.stage ? <span style={{ width: 16 }}>{Icon.check}</span> : null}</span>
                    <span>
                      <span className="lbl">{s.label}</span>
                      {s.approval && <span className="sub" style={{ display: 'block' }}>You approve this{i < c.stage ? ' ✓' : ''}</span>}
                      <span className="sr">{st === 'done' ? ', complete' : st === 'now' ? ', current' : ', upcoming'}</span>
                    </span>
                  </li>
                )
              })}
            </ol>
          </section>

          <section aria-labelledby="up-h">
            <div className="row between">
              <h2 id="up-h">From the studio</h2>
              <button className="btn btn-quiet" onClick={() => go('/details')}>Photos & notes</button>
            </div>
            <ul className="list">
              {c.updates.map((u) => <UpdateRow key={u.id} u={u} c={c} />)}
            </ul>
          </section>

          {c.demo && !c.revising && !stage.approval && stage.key !== 'held' && !c.paused && (
            <div className="note">
              <p className="eyebrow">Prototype</p>
              <p style={{ margin: '4px 0 12px' }}>Weeks pass between steps in reality.</p>
              <button className="btn btn-secondary btn-block" onClick={() => dispatch({ type: 'advance' })}>Skip ahead to the next step</button>
            </div>
          )}
        </div>
      </main>

      <Sheet open={deliver} onClose={() => setDeliver(false)} labelledBy="dl-h">
        <div className="stack">
          <h2 id="dl-h">Send {name}’s {c.piece} to you?</h2>
          <p className="muted">We’ll message you to agree a day. If you’d rather we came at a quiet time, or left it with a neighbour, just say.</p>
          <div className="actions">
            <button className="btn btn-primary btn-block" onClick={() => { setDeliver(false); onToast('We’ll be in touch within a day to agree a time.') }}>Ask us to arrange it</button>
            <button className="btn btn-quiet" onClick={() => setDeliver(false)}>Not yet</button>
          </div>
        </div>
      </Sheet>
    </>
  )
}

/** The dog at the centre of their own tracker: photo in a ring, name and age as stickers. */
function Portrait({ c }: { c: Commission }) {
  const front = c.refs.front?.src || c.refs.most?.src
  const age = parseFloat(c.dog.age)
  const date = new Date().toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric' }).replace(',', ',\n')
  return (
    <div className="stack" style={{ marginTop: 0 }}>
      <p className="date" style={{ whiteSpace: 'pre-line' }}>{date}</p>
      <div className="portrait" style={{ paddingTop: 'var(--s2)' }}>
        <div className={`ring${front && front !== 'demo' ? '' : ' warm'}`}>
          {front && front !== 'demo'
            ? <img src={front} alt={`${c.dog.name}`} />
            : <Sculpture view="front" finish="fur" grey tilt softEyes plinth={false} title={c.dog.name} />}
        </div>
        <span className="pill-tag" style={{ left: '4%', bottom: '18%', rotate: '-6deg' }} aria-hidden="true">{c.dog.name}</span>
        <span className="pill-tag lime" style={{ right: '2%', top: '20%', rotate: '5deg', textAlign: 'center' }} aria-hidden="true">
          {age > 0 ? <><span className="big num">{age}</span>years good</> : 'very good'}
        </span>
        <span className="sticker" style={{ left: '10%', top: '12%' }} aria-hidden="true">🦴</span>
        <span className="sticker sm" style={{ right: '22%', top: '2%' }} aria-hidden="true">🧸</span>
        <span className="sticker" style={{ right: '14%', bottom: '2%', width: 58, height: 58, fontSize: 30 }} aria-hidden="true">🎾</span>
      </div>
    </div>
  )
}

const SEEN = 'gba:seen'
function readSeen(id: string): { stage: number; version: number } | null {
  try { const v = JSON.parse(sessionStorage.getItem(SEEN) ?? 'null'); return v?.id === id ? v : null } catch { return null }
}
function writeSeen(id: string, v: { stage: number; version: number }) {
  try { sessionStorage.setItem(SEEN, JSON.stringify({ id, ...v })) } catch { /* fine: animation only */ }
}
function UpdateRow({ u, c }: { u: Update; c: Commission }) {
  return (
    <li className="update">
      {u.image ? (
        <div className="art" aria-hidden="true">
          <Sculpture view="left" finish={u.image === 'study' ? 'sketch' : stageFinish(c, u.stage)} plinth={false} form={u.image === 'study' ? 'sculpture' : c.piece} {...(u.image === 'study' ? {} : c.likeness)} />
        </div>
      ) : (
        <div className="avatar" aria-hidden="true">I</div>
      )}
      <div>
        <p style={{ fontWeight: 600 }}>{u.title}</p>
        <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>{u.body}</p>
        <p className="caption" style={{ marginTop: 4 }}>Ines, sculptor · {when(u.at)}</p>
      </div>
    </li>
  )
}
