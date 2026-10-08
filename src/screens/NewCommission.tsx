import { useEffect, useRef, type ReactNode } from 'react'
import { Sculpture } from '../components/Sculpture'
import { TopBar, go, transition, useTweened } from '../components/ui'
import { PhotoPicker } from '../components/PhotoPicker'
import {
  PIECES, SCULPTOR, allowedMaterials, describe, materialOf, money, pieceOf, priceOf, pron, urnSize, weeksFor,
  type Draft, type Piece,
} from '../lib/model'
import { emptyDraft, useStore } from '../state/store'

const TITLES = ['Your dog', 'The keepsake', 'Material', 'Photos', 'What only you would notice', 'Review']

export function NewCommission({ onToast }: { onToast: (m: string) => void }) {
  const { state, dispatch, saved } = useStore()
  const d = state.draft ?? emptyDraft()
  const set = (patch: Partial<Draft>) => dispatch({ type: 'draft', draft: { ...d, ...patch } })
  const step = d.step
  const name = d.dog.name.trim()
  const nm = name || 'your dog'
  const p = pron(d.dog.pronoun)
  const heading = useRef<HTMLHeadingElement>(null)

  useEffect(() => {
    if (!state.draft) dispatch({ type: 'draft', draft: emptyDraft() })
  }, [state.draft, dispatch])
  // Move focus to the new step's heading so screen readers announce it.
  useEffect(() => heading.current?.focus(), [step])

  const blocker =
    step === 0 && !name ? 'Add their name to continue.' :
    null
  // On the photo step the capture card holds the one primary action; Continue appears once the needed photos exist.
  const hideContinue = step === 3 && d.photos.length === 0


  const next = () => (step < 5 ? transition(() => set({ step: step + 1 })) : reserve())
  const back = () => (step > 0 ? transition(() => set({ step: step - 1 }), 'back') : go('/', 'back'))
  const later = () => {
    go('/', 'back')
    onToast(saved ? `Saved. Pick up ${name ? name + '’s' : 'your'} commission any time.` : 'Couldn’t save in this browser. Your progress will be lost if you close it.')
  }
  const reserve = () => {
    go('/home', 'fade', () => dispatch({ type: 'reserve' }))
    onToast(`${nm}’s commission is reserved.`)
  }

  const price = priceOf(d)
  const shownTotal = useTweened(price.total)

  return (
    <>
      <TopBar title={`Step ${step + 1} of ${TITLES.length}`} onBack={back} />
      <div className="steps" aria-hidden="true">
        {TITLES.map((t, i) => <span key={t} className={i <= step ? 'on' : ''} />)}
      </div>

      <main className="screen" style={{ paddingTop: 'var(--s6)' }}>
        <div className="stack-lg">
          {step === 0 && (
            <Step h="Who are we sculpting?" headingRef={heading}>
              <div className="field">
                <label htmlFor="name">Their name</label>
                <input id="name" className="input" value={d.dog.name} autoComplete="off" onChange={(e) => set({ dog: { ...d.dog, name: e.target.value } })} />
              </div>
              <fieldset className="field">
                <legend className="legend">We’ll refer to them as</legend>
                <div className="seg" style={{ marginTop: 8 }}>
                  {(['he', 'she', 'they'] as const).map((v) => (
                    <label key={v} className="choice">
                      <input type="radio" name="pron" checked={d.dog.pronoun === v} onChange={() => set({ dog: { ...d.dog, pronoun: v } })} />
                      <span className="face center"><span className="t">{v === 'he' ? 'He / him' : v === 'she' ? 'She / her' : 'They'}</span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              <div className="row" style={{ gap: 12, alignItems: 'flex-start' }}>
                <div className="field" style={{ flex: 2 }}>
                  <label htmlFor="breed">Breed <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                  <input id="breed" className="input" value={d.dog.breed} placeholder="Or ‘mixed’" onChange={(e) => set({ dog: { ...d.dog, breed: e.target.value } })} />
                </div>
                <div className="field" style={{ flex: 1 }}>
                  <label htmlFor="age">Age <span className="muted" style={{ fontWeight: 400 }}>(opt.)</span></label>
                  <input id="age" className="input" inputMode="numeric" value={d.dog.age} onChange={(e) => set({ dog: { ...d.dog, age: e.target.value.replace(/[^0-9.]/g, '').slice(0, 4) } })} />
                </div>
              </div>
            </Step>
          )}

          {step === 1 && (
            <Step h={`What would you like to keep of ${nm}?`} sub="Each is sculpted from the same likeness. You can change your mind until casting begins." headingRef={heading}>
              <fieldset className="stack">
                <legend className="sr">Keepsake</legend>
                {PIECES.map((pc) => (
                  <label key={pc.id} className="choice">
                    <input type="radio" name="piece" checked={d.piece === pc.id} onChange={() => choosePiece(pc.id)} />
                    <span className="face piece">
                      <span className="piece-art" aria-hidden="true"><Sculpture view="left" finish={pc.materials[0]} form={pc.id} name={name} /></span>
                      <span>
                        <span className="t">{pc.label}</span><br />
                        <span className="d">{pc.detail}</span><br />
                        <span className="caption num">From {money(Math.min(...pc.materials.map((m) => priceOf({ piece: pc.id, material: m, weightLb: '1' }).total)))}</span>
                      </span>
                    </span>
                  </label>
                ))}
              </fieldset>
            </Step>
          )}

          {step === 2 && (
            <Step h={d.piece === 'urn' ? 'Material and size' : 'Material'} headingRef={heading}>
              <div className="stage-art" aria-hidden="true">
                <Sculpture view="left" finish={d.material} form={d.piece} name={name} />
              </div>
              <fieldset>
                <legend className="legend">Material</legend>
                <div className="stack" style={{ marginTop: 8 }}>
                  {allowedMaterials(d.piece).map((m) => (
                    <label key={m.id} className="choice">
                      <input type="radio" name="mat" checked={d.material === m.id} onChange={() => set({ material: m.id })} />
                      <span className="face"><span className="dot" /><span><span className="t">{m.label}</span><br /><span className="d">{m.detail}</span></span></span>
                    </label>
                  ))}
                </div>
              </fieldset>
              {d.piece === 'urn' && (
                <div className="field">
                  <label htmlFor="weight">{name ? `${name}’s` : 'Their'} weight, roughly <span className="muted" style={{ fontWeight: 400 }}>(lb)</span></label>
                  <input id="weight" className="input num" inputMode="decimal" value={d.weightLb} placeholder="Not sure? Leave it blank" onChange={(e) => set({ weightLb: e.target.value.replace(/[^0-9.]/g, '').slice(0, 5) })} aria-describedby="weight-hint" />
                  <span className="hint" id="weight-hint" aria-live="polite">
                    {urnSize(d.weightLb).sure
                      ? `${urnSize(d.weightLb).label} chamber, holds up to ${urnSize(d.weightLb).capacity} cubic inches.${urnSize(d.weightLb).extra ? ` Adds ${money(urnSize(d.weightLb).extra)}.` : ''}`
                      : 'We’ll price it as large and confirm with you before casting. Ashes take about one cubic inch per pound.'}
                  </span>
                </div>
              )}
            </Step>
          )}

          {step === 3 && (
            <Step h={`A few photos of ${nm}`} sub={`Choose ones you already love. Any angle, any day. Your sculptor will work out the rest, and only ask if they need something more.`} headingRef={heading}>
              <PhotoPicker
                name={nm}
                resting={`${p.sub}${d.dog.pronoun === 'they' ? '’re' : '’s'} resting`}
                photos={d.photos}
                onAdd={(photo) => dispatch({ type: 'addPhoto', photo })}
                onRemove={(id) => dispatch({ type: 'removePhoto', id })}
              />
              <p className="caption" style={{ textAlign: 'center' }}>Photos stay on this device in the prototype. The checks run on your phone.</p>
              {hideContinue && <div style={{ textAlign: 'center' }}><button className="btn btn-quiet" onClick={later}>Save and finish later</button></div>}
            </Step>
          )}

          {step === 4 && (
            <Step h="What only you would notice" sub={`The things a photo misses. How ${p.sub} hold${d.dog.pronoun === 'they' ? '' : 's'} ${p.pos} head, an ear that never sits right, the grey coming in.`} headingRef={heading}>
              <div className="field">
                <label htmlFor="notes">Notes for the sculptor <span className="muted" style={{ fontWeight: 400 }}>(optional)</span></label>
                <textarea id="notes" className="textarea" value={d.notes} onChange={(e) => set({ notes: e.target.value })} placeholder={`${name || 'He'} tilts ${p.pos} head when…`} />
                <span className="hint">You can add to this later, right up until the clay is approved.</span>
              </div>
            </Step>
          )}

          {step === 5 && (
            <Step h="Before you reserve" headingRef={heading}>
              <div className="card card-flush">
                <div className="row" style={{ padding: 16, gap: 16, borderBottom: '1px solid var(--line)' }}>
                  <div style={{ width: 72, flex: 'none', background: 'var(--tint)', borderRadius: 12 }}><Sculpture view="left" finish={d.material} form={d.piece} name={name} /></div>
                  <div>
                    <p style={{ fontWeight: 600 }}>{nm}</p>
                    <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>
                      {describe(d)}{d.piece === 'urn' ? ` · ${urnSize(d.weightLb).label.toLowerCase()} chamber` : ''}
                    </p>
                    <p className="caption">{d.photos.length} photo{d.photos.length === 1 ? '' : 's'} · {d.notes.trim() ? 'notes added' : 'no notes yet'}</p>
                  </div>
                </div>
                <dl style={{ margin: 0, padding: '4px 16px' }}>
                  <div className="kv"><dt>{pieceOf(d.piece).label}</dt><dd>{money(price.sculpture)}</dd></div>
                  {price.chamber > 0 && <div className="kv"><dt>{urnSize(d.weightLb).label} ash chamber</dt><dd>{money(price.chamber)}</dd></div>}
                  <div className="kv" style={{ borderTop: '1px solid var(--line)' }}><dt style={{ color: 'var(--ink)', fontWeight: 600 }}>Total</dt><dd className="total">{money(price.total)}</dd></div>
                  <div className="kv"><dt>Due today, as a deposit</dt><dd>{money(price.deposit)}</dd></div>
                  <div className="kv"><dt>Making time</dt><dd>{weeksFor(d)}</dd></div>
                </dl>
              </div>

              <section className="card sculptor" aria-labelledby="sc-h">
                <span className="avatar" aria-hidden="true">{SCULPTOR.initial}</span>
                <div>
                  <p className="eyebrow">Your sculptor</p>
                  <h3 id="sc-h">{SCULPTOR.full}</h3>
                  <p className="muted" style={{ fontSize: 'var(--t-sm)' }}>{SCULPTOR.bio} She’ll make {nm}’s piece herself, from start to finish.</p>
                </div>
              </section>

              <ul className="list card" style={{ padding: '4px 20px' }}>
                {[
                  ['Nothing is cast until you approve', 'You’ll check a digital likeness and a clay maquette. Two rounds of changes are included.'],
                  ['Change your mind', 'Your full deposit is refunded until you approve the clay.'],
                ].map(([t, b]) => (
                  <li key={t} style={{ padding: '14px 0' }}><p style={{ fontWeight: 600 }}>{t}</p><p className="muted" style={{ fontSize: 'var(--t-sm)' }}>{b}</p></li>
                ))}
              </ul>

              <fieldset>
                <legend className="legend">When it’s finished</legend>
                <div className="stack" style={{ marginTop: 8 }}>
                  {([
                    ['ready', 'Send it to me', 'Usually 3 to 5 days after finishing.'],
                    ['hold', 'Keep it safe until I ask', 'We hold it for as long as you need. There’s no deadline.'],
                  ] as const).map(([v, t, b]) => (
                    <label key={v} className="choice">
                      <input type="radio" name="deliv" checked={d.prefs.delivery === v} onChange={() => set({ prefs: { ...d.prefs, delivery: v } })} />
                      <span className="face"><span className="dot" /><span><span className="t">{t}</span><br /><span className="d">{b}</span></span></span>
                    </label>
                  ))}
                </div>
              </fieldset>

              <fieldset>
                <legend className="legend">If {nm} dies before it’s finished</legend>
                <div className="stack" style={{ marginTop: 8 }}>
                  {([
                    ['continue', 'Keep going quietly', `${SCULPTOR.name} carries on. We only contact you when you need to look at something.`],
                    ['pause', 'Pause everything', 'Nothing happens until you tell us you’re ready.'],
                  ] as const).map(([v, t, b]) => (
                    <label key={v} className="choice">
                      <input type="radio" name="ifp" checked={d.prefs.ifPasses === v} onChange={() => set({ prefs: { ...d.prefs, ifPasses: v } })} />
                      <span className="face"><span className="dot" /><span><span className="t">{t}</span><br /><span className="d">{b}</span></span></span>
                    </label>
                  ))}
                </div>
                <p className="caption" style={{ marginTop: 8 }}>You can change this at any time in settings.</p>
              </fieldset>
            </Step>
          )}
        </div>

        {!hideContinue && <div className="dock">
          {blocker && <p className="caption" role="status" style={{ textAlign: 'center', marginBottom: 8 }}>{blocker}</p>}
          {step === 2 && (
            <div className="row between" aria-live="polite" style={{ marginBottom: 12 }}>
              <span className="muted" style={{ fontSize: 'var(--t-sm)' }}>{describe(d)} · {weeksFor(d)}</span>
              <span className="total" style={{ fontVariantNumeric: 'tabular-nums' }}>{money(shownTotal)}</span>
            </div>
          )}
          <div className="actions">
            <button className="btn btn-primary btn-block" disabled={!!blocker} onClick={next}>
              {step === 5 ? `Reserve with ${money(price.deposit)} deposit` : 'Continue'}
            </button>
            {step === 5
              ? <p className="caption" style={{ textAlign: 'center' }}>Prototype: no payment is taken.</p>
              : <button className="btn btn-quiet" onClick={later}>Save and finish later</button>}
          </div>
        </div>}
      </main>
    </>
  )

  function choosePiece(pc: Piece) {
    const def = pieceOf(pc)
    // Each piece has its own materials and a sensible delivery default: a keychain is
    // wanted now, an urn is usually held until it's needed.
    const material = def.materials.includes(d.material) ? d.material : def.materials[0]
    set({ piece: pc, material, prefs: { ...d.prefs, delivery: def.delivery } })
    if (material !== d.material) onToast(`${def.label}s come in ${def.materials.map((m) => materialOf(m).label.toLowerCase()).join(' or ')}, so we’ve picked ${materialOf(material).label.toLowerCase()}.`)
  }

}

function Step({ h, sub, children, headingRef }: { h: string; sub?: string; children: ReactNode; headingRef: React.RefObject<HTMLHeadingElement | null> }) {
  return (
    <section className="stack-lg">
      <div className="stack" style={{ marginTop: 0 }}>
        <h1 ref={headingRef} tabIndex={-1} style={{ outline: 'none' }}>{h}</h1>
        {sub && <p className="muted">{sub}</p>}
      </div>
      {children}
    </section>
  )
}
