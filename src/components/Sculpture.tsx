import { useId } from 'react'
import type { Material } from '../lib/model'

export type View = 'front' | 'left' | 'right'
export type Finish = Material | 'clay' | 'fur' | 'sketch'

interface Props {
  view?: View
  finish?: Finish
  earDrop?: boolean
  grey?: boolean
  tilt?: boolean
  softEyes?: boolean
  plinth?: boolean
  /** Background panel behind the bust (photo-style framing). */
  backdrop?: boolean
  className?: string
  title?: string
}

// light / mid / shadow / accent per finish
const COLOR = 'stop-color 520ms cubic-bezier(0.16, 1, 0.3, 1)'
const SHAPE = 'transform 700ms var(--spring), opacity 700ms cubic-bezier(0.16, 1, 0.3, 1), d 700ms var(--spring)'

/** A path whose shape eases between states (CSS `d`), so a revised ear visibly drops into place. */
function Morph({ d, ...rest }: React.SVGProps<SVGPathElement> & { d: string }) {
  return <path d={d} style={{ d: `path('${d}')`, transition: SHAPE } as React.CSSProperties} {...rest} />
}

const TONES: Record<Finish, [string, string, string, string]> = {
  bronze: ['#d9a774', '#8f5a33', '#4a2c18', '#2a170c'],
  stone: ['#e7e3dc', '#b4ada3', '#7d766d', '#4c463f'],
  ceramic: ['#f6efe6', '#e0cfbd', '#b8a088', '#6a5646'],
  clay: ['#d79a76', '#b26a45', '#7c4428', '#4c2716'],
  fur: ['#f3d49c', '#dcae6b', '#a8773e', '#3b2a1c'],
  sketch: ['#ffffff', '#ffffff', '#ffffff', '#0d2a5a'],
}

/**
 * An illustrated bust of a Labrador. The same drawing is the dog's "photo" (finish="fur")
 * and every stage of the sculpture, so changes between likeness versions read clearly.
 */
export function Sculpture({ view = 'left', finish = 'bronze', earDrop = true, grey = false, tilt = false, softEyes = false, plinth = true, backdrop = false, className, title }: Props) {
  const id = useId().replace(/:/g, '')
  const [lt, md, sh, ac] = TONES[finish]
  const sketch = finish === 'sketch'
  const fill = sketch ? lt : `url(#g${id})`
  const stroke = sketch ? ac : 'none'
  const sw = sketch ? 1.6 : 0
  const ear = sketch ? lt : `url(#e${id})`
  const greyFill = finish === 'fur' ? '#e9e2d6' : lt
  const eyeR = softEyes ? 5.6 : 4.4
  const mirror = view === 'right'
  const tiltDeg = tilt ? (view === 'front' ? -9 : view === 'left' ? -7 : 7) : 0

  return (
    <svg viewBox="0 0 240 260" className={className} preserveAspectRatio={backdrop ? 'xMidYMid slice' : undefined} style={backdrop ? { width: '100%', height: '100%' } : undefined} role={title ? 'img' : undefined} aria-hidden={title ? undefined : true} aria-label={title}>
      <defs>
        <radialGradient id={`g${id}`} cx="0.38" cy="0.3" r="0.85">
          <stop offset="0" style={{ stopColor: lt, transition: COLOR }} />
          <stop offset="0.55" style={{ stopColor: md, transition: COLOR }} />
          <stop offset="1" style={{ stopColor: sh, transition: COLOR }} />
        </radialGradient>
        <linearGradient id={`e${id}`} x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" style={{ stopColor: md, transition: COLOR }} />
          <stop offset="1" style={{ stopColor: sh, transition: COLOR }} />
        </linearGradient>
        <linearGradient id={`p${id}`} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stopColor="#d8cfc4" />
          <stop offset="1" stopColor="#a99d90" />
        </linearGradient>
        <filter id={`f${id}`} x="-30%" y="-30%" width="160%" height="160%"><feGaussianBlur stdDeviation="4" /></filter>
        <radialGradient id={`b${id}`} cx="0.5" cy="0.35" r="0.8">
          <stop offset="0" stopColor="#efe4d4" />
          <stop offset="1" stopColor="#c9b79f" />
        </radialGradient>
      </defs>

      {backdrop && <rect width="240" height="260" fill={`url(#b${id})`} />}

      <g transform={mirror ? 'translate(240 0) scale(-1 1)' : undefined}>
        {plinth && !backdrop && (
          <g>
            <rect x="52" y="224" width="136" height="30" rx="3" fill={sketch ? lt : `url(#p${id})`} stroke={stroke} strokeWidth={sw} />
            <rect x="46" y="218" width="148" height="10" rx="2" fill={sketch ? lt : '#e4dcd2'} stroke={stroke} strokeWidth={sw} />
          </g>
        )}

        {/* chest and neck */}
        {view === 'front' ? (
          <path d="M62 222 C62 182 82 158 96 146 L144 146 C158 158 178 182 178 222 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
        ) : (
          <path d="M66 222 C64 186 70 160 84 132 L150 140 C164 162 178 190 180 222 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
        )}

        <g transform={`rotate(${tiltDeg} 120 110)`} style={{ transition: SHAPE }}>
          {view === 'front' ? (
            <>
              {/* ears */}
              <Morph d={earDrop ? 'M78 74 C58 80 52 118 60 146 C66 160 82 156 86 140 C90 118 92 92 78 74 Z' : 'M80 70 C60 70 50 98 56 124 C60 138 76 136 82 122 C88 104 92 84 80 70 Z'} fill={ear} stroke={stroke} strokeWidth={sw} />
              <Morph d={earDrop ? 'M162 74 C182 80 188 118 180 146 C174 160 158 156 154 140 C150 118 148 92 162 74 Z' : 'M160 70 C180 70 190 98 184 124 C180 138 164 136 158 122 C152 104 148 84 160 70 Z'} fill={ear} stroke={stroke} strokeWidth={sw} />
              {/* skull */}
              <ellipse cx="120" cy="100" rx="46" ry="44" fill={fill} stroke={stroke} strokeWidth={sw} />
              {/* muzzle */}
              <ellipse cx="120" cy="132" rx="27" ry="23" fill={fill} stroke={stroke} strokeWidth={sw} />
              <ellipse cx="120" cy="138" rx="20" ry="14" fill={greyFill} opacity={grey ? (finish === 'fur' ? 0.85 : 0.75) : 0} filter={`url(#f${id})`} style={{ transition: SHAPE }} />
              <path d="M120 120 L120 140 M120 140 Q110 150 102 144 M120 140 Q130 150 138 144" stroke={ac} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
              <ellipse cx="120" cy="120" rx="10" ry="7" fill={ac} />
              <ellipse cx="100" cy="96" rx={eyeR} ry={eyeR - 0.6} fill={ac} />
              <ellipse cx="140" cy="96" rx={eyeR} ry={eyeR - 0.6} fill={ac} />
              {!sketch && <><circle cx="101.5" cy="94.5" r="1.3" fill="#fff" opacity="0.8" /><circle cx="141.5" cy="94.5" r="1.3" fill="#fff" opacity="0.8" /></>}
              {softEyes && <path d="M92 89 Q100 85 108 89 M132 89 Q140 85 148 89" stroke={ac} strokeWidth="1.6" fill="none" opacity="0.5" strokeLinecap="round" />}
            </>
          ) : (
            <>
              {/* skull */}
              <ellipse cx="114" cy="102" rx="48" ry="42" fill={fill} stroke={stroke} strokeWidth={sw} />
              {/* muzzle */}
              <path d="M140 86 C170 84 194 92 202 106 C208 120 200 138 182 142 L142 144 Z" fill={fill} stroke={stroke} strokeWidth={sw} />
              <ellipse cx="180" cy="126" rx="22" ry="12" fill={greyFill} opacity={grey ? (finish === 'fur' ? 0.85 : 0.75) : 0} filter={`url(#f${id})`} style={{ transition: SHAPE }} />
              <ellipse cx="201" cy="104" rx="8" ry="6.5" fill={ac} />
              <path d="M198 128 Q184 138 162 133" stroke={ac} strokeWidth="2" fill="none" strokeLinecap="round" opacity="0.7" />
              {/* eye + brow */}
              <ellipse cx="150" cy="92" rx={eyeR} ry={eyeR - 0.8} fill={ac} />
              {!sketch && <circle cx="151.5" cy="90.6" r="1.3" fill="#fff" opacity="0.8" />}
              <path d={softEyes ? 'M140 83 Q150 79 160 84' : 'M141 84 Q150 81 159 85'} stroke={ac} strokeWidth="1.6" fill="none" opacity="0.45" strokeLinecap="round" />
              {/* ear */}
              <Morph d={earDrop ? 'M104 66 C82 68 74 100 80 134 C84 152 104 152 110 134 C116 112 116 84 104 66 Z' : 'M106 62 C86 60 74 86 78 114 C80 130 98 132 104 118 C112 98 116 76 106 62 Z'} fill={ear} stroke={stroke} strokeWidth={sw} />
            </>
          )}
        </g>
      </g>
    </svg>
  )
}
