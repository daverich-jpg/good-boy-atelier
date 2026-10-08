import { createContext, useContext, useEffect, useReducer, useRef, useState, type ReactNode } from 'react'
import { INCLUDED_ROUNDS, STAGES, type Commission, type Draft, type Feature, type Likeness, type Photo, type Update } from '../lib/model'

const KEY = 'gba:v3' // v3: a list of photos replaced six named slots
const DAY = 86_400_000

interface State {
  commission: Commission | null
  draft: Draft | null
}

type Action =
  | { type: 'draft'; draft: Draft | null }
  /** Photo checks resolve asynchronously and out of order, so they patch the latest draft. */
  | { type: 'addPhoto'; photo: Photo }
  | { type: 'removePhoto'; id: string }
  | { type: 'reserve' }
  | { type: 'demo' }
  | { type: 'reset' }
  | { type: 'approve' }
  | { type: 'requestChanges'; features: Feature[]; note: string }
  | { type: 'revised' }
  | { type: 'advance' }
  | { type: 'prefs'; prefs: Partial<Commission['prefs']> }
  | { type: 'pause'; paused: boolean }
  | { type: 'notes'; notes: string }

const uid = () => Math.random().toString(36).slice(2, 10)

export function emptyDraft(): Draft {
  return {
    step: 0,
    dog: { name: '', pronoun: 'he', breed: '', age: '' },
    piece: 'keychain',
    material: 'silver',
    weightLb: '',
    photos: [],
    notes: '',
    prefs: { updates: 'every', ifPasses: 'continue', delivery: 'ready' },
  }
}

const FIRST_LIKENESS: Likeness = { version: 1, earDrop: false, grey: false, tilt: false, softEyes: false }

function stageUpdate(stage: number, name: string, at: number, l?: Likeness, hold = true): Update {
  const id = uid()
  switch (STAGES[stage].key) {
    case 'received':
      return { id, at, stage, title: 'Meet Ines, your sculptor', body: `She has your photos and notes, and she’ll be the one making ${name}’s piece from start to finish. Nothing more is needed from you for now. Spend the time with ${name}.` }
    case 'study':
      return { id, at, stage, title: 'First study', body: `Ines has started blocking out ${name}’s head shape from the side photos. Next, she’ll build a digital likeness for you to check.`, image: 'study' }
    case 'likeness':
      return l && l.version > 1
        ? { id, at, stage, title: `Revised likeness, version ${l.version}`, body: 'Changed from your notes. Take a look when you’re ready.', image: 'likeness' }
        : { id, at, stage, title: `${name}’s likeness is ready for you`, body: 'This is the moment to tell us anything that isn’t quite right. Nothing is cast until you approve.', image: 'likeness' }
    case 'maquette':
      return { id, at, stage, title: 'Clay maquette', body: 'A small clay version, from the likeness you approved. One last look before casting.', image: 'maquette' }
    case 'cast':
      return { id, at, stage, title: 'Casting has begun', body: 'From here the shape is fixed. We’ll send a photo when it comes out of the mould.', image: 'cast' }
    case 'finish':
      return { id, at, stage, title: 'Finishing', body: 'Chasing, patina and sealing. The detail work.', image: 'finished' }
    default:
      return hold
        ? { id, at, stage, title: `${name}’s piece is finished`, body: 'We’ll keep it safe here for as long as you need. Ask for it whenever you’re ready, there’s no deadline.', image: 'finished' }
        : { id, at, stage, title: `${name}’s piece is on its way`, body: 'Finished and packed by hand. It should reach you in 3 to 5 days.', image: 'finished' }
  }
}

function seedDemo(): Commission {
  const now = Date.now()
  const name = 'Bo'
  return {
    id: 'demo',
    demo: true,
    dog: { name, pronoun: 'he', breed: 'Labrador', age: '13' },
    piece: 'urn',
    material: 'bronze',
    weightLb: '72',
    photos: (['front', 'left', 'right', 'front'] as const).map((angle, i) => ({ id: `demo${i}`, src: 'demo', issues: [], angle })),
    notes: 'He tilts his head to the left when you say “walk”. His muzzle has gone grey this past year. His ears are soft and flop forward.',
    stage: 2,
    roundsUsed: 0,
    likeness: FIRST_LIKENESS,
    feedback: [],
    revising: false,
    updates: [
      stageUpdate(2, name, now - 2 * 3600_000, FIRST_LIKENESS),
      stageUpdate(1, name, now - 6 * DAY),
      stageUpdate(0, name, now - 11 * DAY),
    ],
    prefs: { updates: 'every', ifPasses: 'continue', delivery: 'hold' },
    paused: false,
    createdAt: now - 11 * DAY,
  }
}

function reduce(s: State, a: Action): State {
  const c = s.commission
  switch (a.type) {
    case 'draft':
      return { ...s, draft: a.draft }
    case 'addPhoto':
      return s.draft ? { ...s, draft: { ...s.draft, photos: [...s.draft.photos, a.photo] } } : s
    case 'removePhoto':
      return s.draft ? { ...s, draft: { ...s.draft, photos: s.draft.photos.filter((p) => p.id !== a.id) } } : s
    case 'demo':
      return { ...s, commission: seedDemo() }
    case 'reset':
      return { commission: null, draft: null }
    case 'reserve': {
      if (!s.draft) return s
      const { step: _step, ...d } = s.draft
      const now = Date.now()
      const name = d.dog.name.trim() || 'your dog'
      return {
        draft: null,
        commission: {
          ...d,
          dog: { ...d.dog, name },
          id: uid(),
          demo: false,
          stage: 0,
          roundsUsed: 0,
          likeness: FIRST_LIKENESS,
          feedback: [],
          revising: false,
          updates: [stageUpdate(0, name, now)],
          paused: false,
          createdAt: now,
        },
      }
    }
    case 'approve':
    case 'advance': {
      if (!c || c.stage >= STAGES.length - 1) return s
      const stage = c.stage + 1
      return { ...s, commission: { ...c, stage, revising: false, updates: [stageUpdate(stage, c.dog.name, Date.now(), c.likeness, c.prefs.delivery === 'hold'), ...c.updates] } }
    }
    case 'requestChanges': {
      if (!c) return s
      return {
        ...s,
        commission: {
          ...c,
          roundsUsed: c.roundsUsed + 1,
          revising: true,
          feedback: [...c.feedback, { round: c.roundsUsed + 1, stage: c.stage, features: a.features, note: a.note, at: Date.now() }],
        },
      }
    }
    case 'revised': {
      if (!c || !c.revising) return s
      const fb = c.feedback[c.feedback.length - 1]
      const f = new Set(fb?.features ?? [])
      const l = c.likeness
      const likeness: Likeness = {
        version: l.version + 1,
        // Each requested area is corrected toward the real dog (the seeded "Bo" profile).
        earDrop: l.earDrop || f.has('ears') || f.has('head'),
        grey: l.grey || f.has('muzzle') || f.has('markings'),
        tilt: l.tilt || f.has('expression'),
        softEyes: l.softEyes || f.has('eyes') || f.has('expression'),
      }
      return { ...s, commission: { ...c, revising: false, previous: l, likeness, updates: [stageUpdate(c.stage, c.dog.name, Date.now(), likeness), ...c.updates] } }
    }
    case 'prefs':
      return c ? { ...s, commission: { ...c, prefs: { ...c.prefs, ...a.prefs } } } : s
    case 'pause':
      return c ? { ...s, commission: { ...c, paused: a.paused } } : s
    case 'notes':
      return c ? { ...s, commission: { ...c, notes: a.notes } } : s
  }
}

function load(): State {
  try {
    const raw = localStorage.getItem(KEY)
    if (raw) return JSON.parse(raw) as State
  } catch {
    /* storage unavailable: start fresh */
  }
  return { commission: null, draft: null }
}

interface Ctx {
  state: State
  dispatch: (a: Action) => void
  /** False when the browser refused to save (private mode, or photos too large). */
  saved: boolean
  roundsLeft: number
}

const StoreCtx = createContext<Ctx | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reduce, undefined, load)
  const [saved, setSaved] = useState(true)
  const timer = useRef<number>(0)

  useEffect(() => {
    try {
      localStorage.setItem(KEY, JSON.stringify(state))
      setSaved(true)
    } catch {
      setSaved(false)
    }
  }, [state])

  // The sculptor "responds" to a change request. Fast in the prototype; days in reality.
  useEffect(() => {
    if (!state.commission?.revising) return
    timer.current = window.setTimeout(() => dispatch({ type: 'revised' }), 4500)
    return () => window.clearTimeout(timer.current)
  }, [state.commission?.revising])

  const roundsLeft = Math.max(0, INCLUDED_ROUNDS - (state.commission?.roundsUsed ?? 0))
  return <StoreCtx.Provider value={{ state, dispatch, saved, roundsLeft }}>{children}</StoreCtx.Provider>
}

export function useStore() {
  const ctx = useContext(StoreCtx)
  if (!ctx) throw new Error('useStore outside StoreProvider')
  return ctx
}
