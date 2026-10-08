export type Pronoun = 'he' | 'she' | 'they'
export type Piece = 'keychain' | 'sculpture' | 'urn'
export type Material = 'silver' | 'bronze' | 'stone' | 'ceramic'
export type Delivery = 'ready' | 'hold'
export type Feature = 'ears' | 'eyes' | 'muzzle' | 'head' | 'expression' | 'markings'
export type UpdatePref = 'every' | 'approvals' | 'paused'
export type IfPasses = 'continue' | 'pause'

/** The sculpt itself: which details the sculptor has captured so far. */
export interface Likeness {
  version: number
  earDrop: boolean
  grey: boolean
  tilt: boolean
  softEyes: boolean
}

export interface Photo {
  id: string
  src: string // data URL, or 'demo' for the seeded illustration
  issues: string[]
  /** Known only for the seeded demo; real photos are sorted by the sculptor, not the owner. */
  angle?: 'front' | 'left' | 'right'
  /** A frame pulled from the owner's video. */
  fromVideo?: boolean
}

export interface Feedback {
  round: number
  stage: number
  features: Feature[]
  note: string
  at: number
}

export interface Update {
  id: string
  at: number
  stage: number
  title: string
  body: string
  image?: 'study' | 'likeness' | 'maquette' | 'cast' | 'finished'
}

export interface Commission {
  id: string
  demo: boolean
  dog: { name: string; pronoun: Pronoun; breed: string; age: string }
  piece: Piece
  material: Material
  /** Urns only: sizes the ash chamber. Blank means "not sure"; we confirm before casting. */
  weightLb: string
  photos: Photo[]
  notes: string
  stage: number
  roundsUsed: number
  likeness: Likeness
  /** The version before the latest revision, for before/after comparison. */
  previous?: Likeness
  feedback: Feedback[]
  revising: boolean
  updates: Update[]
  prefs: { updates: UpdatePref; ifPasses: IfPasses; delivery: Delivery }
  paused: boolean
  createdAt: number
}

/** A commission in progress through the order flow (not yet reserved). */
export type Draft = Omit<Commission, 'id' | 'stage' | 'roundsUsed' | 'likeness' | 'feedback' | 'revising' | 'updates' | 'paused' | 'createdAt' | 'demo'> & { step: number }

/** One named sculptor makes each piece. Introduced at review (step 6), not before: until then she's "your sculptor". */
export const SCULPTOR = { name: 'Ines', full: 'Ines Moreau', initial: 'I', bio: 'Has sculpted animals for 14 years.' }

export const INCLUDED_ROUNDS = 2

export const STAGES = [
  { key: 'received', label: 'Photos received', approval: false },
  { key: 'study', label: 'Sculptor’s study', approval: false },
  { key: 'likeness', label: 'Digital likeness', approval: true },
  { key: 'maquette', label: 'Clay maquette', approval: true },
  { key: 'cast', label: 'Casting', approval: false },
  { key: 'finish', label: 'Finishing', approval: false },
  { key: 'held', label: 'Ready for you', approval: false },
] as const

/** The most photos one commission keeps; enough for any angle, small enough for browser storage. */
export const MAX_PHOTOS = 12

export const FEATURES: { id: Feature; label: string }[] = [
  { id: 'expression', label: 'Expression' },
  { id: 'ears', label: 'Ears' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'muzzle', label: 'Muzzle' },
  { id: 'head', label: 'Head shape' },
  { id: 'markings', label: 'Markings' },
]

export const PIECES: { id: Piece; label: string; detail: string; materials: Material[]; delivery: Delivery }[] = [
  { id: 'keychain', label: 'Keychain', detail: 'Their head, about 4 cm. Small enough to carry everywhere.', materials: ['silver', 'bronze'], delivery: 'ready' },
  { id: 'sculpture', label: 'Sculpture', detail: 'Head and chest, about 25 cm tall. For a shelf or mantel.', materials: ['bronze', 'stone', 'ceramic'], delivery: 'ready' },
  { id: 'urn', label: 'Urn', detail: 'Their likeness on a sealed vessel that holds their ashes.', materials: ['bronze', 'ceramic', 'stone'], delivery: 'hold' },
]

export const MATERIALS: { id: Material; label: string; detail: string }[] = [
  { id: 'silver', label: 'Sterling silver', detail: 'Bright, and softens with handling. Hallmarked.' },
  { id: 'bronze', label: 'Bronze', detail: 'Warm, and darkens gently over the years.' },
  { id: 'stone', label: 'Cast stone', detail: 'Soft grey and matte. Quietly heavy.' },
  { id: 'ceramic', label: 'Glazed ceramic', detail: 'Smooth and warm to the touch.' },
]

const PRICE: Record<Piece, Partial<Record<Material, number>>> = {
  keychain: { silver: 340, bronze: 260 },
  sculpture: { ceramic: 1150, stone: 1480, bronze: 2900 },
  urn: { ceramic: 1350, stone: 1700, bronze: 3200 },
}

/** Ash volume is roughly 1 cubic inch per pound of body weight. */
export function urnSize(weightLb: string) {
  const w = parseFloat(weightLb)
  if (!(w > 0)) return { label: 'Large', capacity: 100, extra: 280, sure: false }
  if (w <= 40) return { label: 'Standard', capacity: 50, extra: 0, sure: true }
  if (w <= 100) return { label: 'Large', capacity: 120, extra: 280, sure: true }
  return { label: 'Extra large', capacity: 200, extra: 520, sure: true }
}

export const DEPOSIT_RATE = 0.3

export function priceOf(c: { piece: Piece; material: Material; weightLb: string }) {
  const sculpture = PRICE[c.piece][c.material] ?? 0
  const chamber = c.piece === 'urn' ? urnSize(c.weightLb).extra : 0
  const total = sculpture + chamber
  return { sculpture, chamber, total, deposit: Math.round(total * DEPOSIT_RATE) }
}

export function weeksFor(c: { piece: Piece; material: Material }) {
  if (c.piece === 'keychain') return '3–4 weeks'
  return c.material === 'bronze' ? '10–12 weeks' : '6–8 weeks'
}

export const money = (n: number) => '$' + n.toLocaleString('en-US')

export const pron = (p: Pronoun) =>
  p === 'he' ? { sub: 'he', obj: 'him', pos: 'his' } : p === 'she' ? { sub: 'she', obj: 'her', pos: 'her' } : { sub: 'they', obj: 'them', pos: 'their' }

export const pieceOf = (id: Piece) => PIECES.find((p) => p.id === id)!
export const materialOf = (id: Material) => MATERIALS.find((m) => m.id === id)!
/** "Bronze urn", "Sterling silver keychain". */
export const describe = (c: { piece: Piece; material: Material }) => `${materialOf(c.material).label} ${pieceOf(c.piece).label.toLowerCase()}`
export const allowedMaterials = (p: Piece) => pieceOf(p).materials.map(materialOf)
