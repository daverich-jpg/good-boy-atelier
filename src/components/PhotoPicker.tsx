import { useRef, useState } from 'react'
import { Sculpture } from './Sculpture'
import { Icon } from './ui'
import { readPhoto } from '../lib/photo'
import { framesFrom } from '../lib/video'
import { MAX_PHOTOS, type Photo } from '../lib/model'

interface Pending { id: string; preview?: string; label?: string }

const uid = () => Math.random().toString(36).slice(2, 10)

/**
 * One gesture, not six photoshoots. The owner picks several photos they already love
 * (or films one short video), and the sculptor works out the angles. Every chosen photo
 * appears at once and is checked in turn, so the wait reads as progress.
 */
export function PhotoPicker({ name, resting, photos, onAdd, onRemove }: { name: string; resting: string; photos: Photo[]; onAdd: (p: Photo) => void; onRemove: (id: string) => void }) {
  const [pending, setPending] = useState<Pending[]>([])
  const [note, setNote] = useState<string | null>(null)
  const library = useRef<HTMLInputElement>(null)
  const video = useRef<HTMLInputElement>(null)
  const room = MAX_PHOTOS - photos.length - pending.length
  const busy = pending.length > 0

  const addFiles = async (files: File[], fromVideo = false) => {
    const take = files.slice(0, Math.max(0, room))
    const dropped = files.length - take.length
    const queue = take.map((f) => ({ id: uid(), file: f, preview: URL.createObjectURL(f) }))
    // Optimistic: every photo shows immediately, then each is checked in turn.
    setPending((p) => [...p, ...queue.map(({ id, preview }) => ({ id, preview }))])
    let unreadable = 0
    for (const q of queue) {
      const [r] = await Promise.all([readPhoto(q.file), new Promise((res) => setTimeout(res, 260))])
      if (r.src) onAdd({ id: q.id, src: r.src, issues: r.issues, fromVideo })
      else unreadable++
      setPending((p) => p.filter((x) => x.id !== q.id))
      URL.revokeObjectURL(q.preview)
    }
    const parts = []
    if (unreadable) parts.push(`${unreadable} file${unreadable > 1 ? 's' : ''} couldn’t be opened as a photo.`)
    if (dropped > 0) parts.push(`We kept the first ${take.length}; ${MAX_PHOTOS} is plenty.`)
    setNote(parts.length ? parts.join(' ') : null)
  }

  const addVideo = async (file: File) => {
    const id = uid()
    setPending((p) => [...p, { id, label: 'Finding the clearest moments…' }])
    setNote(null)
    try {
      const frames = await framesFrom(file, Math.min(5, Math.max(1, room)))
      setPending((p) => p.filter((x) => x.id !== id))
      await addFiles(frames, true)
    } catch {
      setPending((p) => p.filter((x) => x.id !== id))
      setNote('We couldn’t read that video on this phone. Choosing a few photos works just as well.')
    }
  }

  const remove = onRemove
  const weak = photos.filter((p) => p.issues.length).length

  const inputs = (
    <>
      <input ref={library} type="file" accept="image/*" multiple hidden onChange={(e) => { const f = [...(e.target.files ?? [])]; e.target.value = ''; if (f.length) void addFiles(f) }} />
      <input ref={video} type="file" accept="video/*" capture="environment" hidden onChange={(e) => { const f = e.target.files?.[0]; e.target.value = ''; if (f) void addVideo(f) }} />
    </>
  )

  if (!photos.length && !busy) {
    return (
      <section className="card picker-empty">
        {inputs}
        <div className="polaroids" aria-hidden="true">
          <span style={{ rotate: '-8deg' }}><Sculpture view="left" finish="sketch" plinth={false} /></span>
          <span style={{ rotate: '3deg', zIndex: 1 }}><Sculpture view="front" finish="sketch" plinth={false} /></span>
          <span style={{ rotate: '9deg' }}><Sculpture view="right" finish="sketch" plinth={false} /></span>
        </div>
        <div className="actions">
          <button className="btn btn-primary btn-block" onClick={() => library.current?.click()}>Choose photos</button>
          <button className="btn btn-secondary btn-block" onClick={() => video.current?.click()}>{Icon.camera}Film a short video instead</button>
        </div>
        <p className="caption" style={{ textAlign: 'center', marginTop: 12 }}>
          For a video, move slowly around {name} for about ten seconds. It works well if {resting}.
        </p>
        {note && <p className="note note-amber" role="status" style={{ marginTop: 12 }}>{note}</p>}
      </section>
    )
  }

  return (
    <section className="stack">
      {inputs}
      <ul className="tiles" aria-label={`Photos of ${name}`}>
        {photos.map((p, i) => (
          <li key={p.id} className={`tile pop${p.issues.length ? ' weak' : ''}`}>
            {p.src === 'demo'
              ? <Sculpture view={p.angle ?? 'left'} finish="fur" grey tilt softEyes backdrop plinth={false} />
              : <img src={p.src} alt={`Photo ${i + 1} of ${name}${p.fromVideo ? ', from your video' : ''}`} />}
            {p.issues.length > 0 && <span className="tile-flag" title={p.issues[0]} aria-label={p.issues[0]}>!</span>}
            <button className="tile-x" onClick={() => remove(p.id)} aria-label={`Remove photo ${i + 1}`}>{Icon.close}</button>
          </li>
        ))}
        {pending.map((p) => (
          <li key={p.id} className="tile pending" aria-label="Checking">
            {p.preview ? <img src={p.preview} alt="" /> : <span className="tile-label">{p.label}</span>}
            <span className="scan" aria-hidden="true" />
          </li>
        ))}
        {room > 0 && !busy && (
          <li className="tile add">
            <button onClick={() => library.current?.click()}><span aria-hidden="true">+</span>Add more</button>
          </li>
        )}
      </ul>

      <p className="muted" role="status" aria-live="polite" style={{ fontSize: 'var(--t-sm)' }}>
        {busy
          ? `Checking light and focus…`
          : photos.length >= 3
            ? `${photos.length} photos. That’s plenty for Ines to work from.`
            : `${photos.length === 1 ? 'One photo is' : 'Two photos are'} enough to start. Another from a different side helps, if you have one.`}
        {!busy && weak > 0 && ` ${weak === 1 ? 'One is' : `${weak} are`} a little dark or soft, which Ines can usually work with.`}
      </p>
      {note && <p className="note note-amber" role="status">{note}</p>}
      {!busy && photos.length > 0 && photos.length < 3 && (
        <button className="btn btn-quiet" style={{ alignSelf: 'flex-start', paddingLeft: 0 }} onClick={() => video.current?.click()}>Or film a short video instead</button>
      )}
    </section>
  )
}
