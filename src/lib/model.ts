export type Pronoun = 'he' | 'she' | 'they'
export type Placement = 'grave' | 'garden' | 'home' | 'urn'
export type Material = 'bronze' | 'stone' | 'ceramic'
export type Size = 'small' | 'medium' | 'life'
export type SlotId = 'front' | 'left' | 'right' | 'top' | 'markings' | 'most'
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

export interface Ref {
  src: string // data URL, or 'demo' for the seeded illustration
  issues: string[]
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
  placement: Placement
  material: Material
  size: Size
  refs: Partial<Record<SlotId, Ref>>
  notes: string
  stage: number
  roundsUsed: number
  likeness: Likeness
  /** The version before the latest revision, for before/after comparison. */
  previous?: Likeness
  feedback: Feedback[]
  revising: boolean
  updates: Update[]
  prefs: { updates: UpdatePref; ifPasses: IfPasses }
  paused: boolean
  createdAt: number
}

/** A commission in progress through the order flow (not yet reserved). */
export type Draft = Omit<Commission, 'id' | 'stage' | 'roundsUsed' | 'likeness' | 'feedback' | 'revising' | 'updates' | 'paused' | 'createdAt' | 'demo'> & { step: number }

export const INCLUDED_ROUNDS = 2

export const STAGES = [
  { key: 'received', label: 'Photos received', approval: false },
  { key: 'study', label: 'Sculptor’s study', approval: false },
  { key: 'likeness', label: 'Digital likeness', approval: true },
  { key: 'maquette', label: 'Clay maquette', approval: true },
  { key: 'cast', label: 'Casting', approval: false },
  { key: 'finish', label: 'Finishing', approval: false },
  { key: 'held', label: 'Ready, held for you', approval: false },
] as const

export const SLOTS: { id: SlotId; label: string; tip: string; required: boolean }[] = [
  { id: 'front', label: 'Face, straight on', tip: 'Get down to their eye level. Daylight from a window is best.', required: true },
  { id: 'left', label: 'Left side', tip: 'Whole head and neck, side-on. Ears relaxed if you can.', required: true },
  { id: 'right', label: 'Right side', tip: 'The other side. Dogs are rarely symmetrical.', required: true },
  { id: 'top', label: 'From above', tip: 'Standing over them, looking down. Shows the shape of the head.', required: false },
  { id: 'markings', label: 'Markings up close', tip: 'Scars, patches, a grey muzzle, a nicked ear.', required: false },
  { id: 'most', label: 'The most them', tip: 'Any photo where they look exactly like themselves.', required: false },
]

export const FEATURES: { id: Feature; label: string }[] = [
  { id: 'expression', label: 'Expression' },
  { id: 'ears', label: 'Ears' },
  { id: 'eyes', label: 'Eyes' },
  { id: 'muzzle', label: 'Muzzle' },
  { id: 'head', label: 'Head shape' },
  { id: 'markings', label: 'Markings' },
]

export const PLACEMENTS: { id: Placement; label: string; detail: string }[] = [
  { id: 'grave', label: 'A grave marker', detail: 'Weatherproof, set on a footing. We install it when you ask.' },
  { id: 'garden', label: 'In the garden', detail: 'Weatherproof, to sit somewhere they loved.' },
  { id: 'home', label: 'At home', detail: 'For a shelf, mantel or windowsill.' },
  { id: 'urn', label: 'Holding their ashes', detail: 'A sealed chamber in the base. Indoors.' },
]

export const MATERIALS: { id: Material; label: string; detail: string; outdoor: boolean }[] = [
  { id: 'bronze', label: 'Bronze', detail: 'Lasts generations outdoors. Darkens gently over time.', outdoor: true },
  { id: 'stone', label: 'Cast stone', detail: 'Soft grey, weathers naturally. Outdoors or in.', outdoor: true },
  { id: 'ceramic', label: 'Glazed ceramic', detail: 'Warm and smooth. Indoors only.', outdoor: false },
]

export const SIZES: { id: Size; label: string; detail: string }[] = [
  { id: 'small', label: 'Keepsake', detail: 'About 15 cm tall' },
  { id: 'medium', label: 'Bust', detail: 'About 30 cm tall' },
  { id: 'life', label: 'Life size', detail: 'Head and chest, true to scale' },
]

const PRICE: Record<Size, Record<Material, number>> = {
  small: { ceramic: 620, stone: 780, bronze: 1450 },
  medium: { ceramic: 1150, stone: 1480, bronze: 2900 },
  life: { ceramic: 2100, stone: 2650, bronze: 5400 },
}

export const INSTALL_FEE = 240
export const DEPOSIT_RATE = 0.3

export function priceOf(c: { size: Size; material: Material; placement: Placement }) {
  const sculpture = PRICE[c.size][c.material]
  const install = c.placement === 'grave' ? INSTALL_FEE : 0
  const total = sculpture + install
  return { sculpture, install, total, deposit: Math.round(total * DEPOSIT_RATE) }
}

export function weeksFor(m: Material) {
  return m === 'bronze' ? '10–12 weeks' : '6–8 weeks'
}

export const money = (n: number) => '$' + n.toLocaleString('en-US')

export const pron = (p: Pronoun) =>
  p === 'he' ? { sub: 'he', obj: 'him', pos: 'his' } : p === 'she' ? { sub: 'she', obj: 'her', pos: 'her' } : { sub: 'they', obj: 'them', pos: 'their' }

/** Materials that can sit outside. Placement narrows the material choice. */
export function allowedMaterials(p: Placement) {
  return MATERIALS.filter((m) => (p === 'grave' || p === 'garden' ? m.outdoor : true))
}
