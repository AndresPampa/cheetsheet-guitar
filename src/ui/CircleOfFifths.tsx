import { useRef, useState, type FocusEvent, type KeyboardEvent } from 'react'
import {
  CIRCLE_OF_FIFTHS,
  type CircleHighlight,
  type CircleRing,
  type CircleSpelling,
  type KeyMode,
} from '../theory/index.ts'
import { displaySymbol, modeName, spokenNote } from './notation.ts'
import './CircleOfFifths.css'

export interface CircleSelection {
  index: number
  ring: KeyMode
}

interface CircleOfFifthsProps {
  selected: CircleSelection
  highlights: CircleHighlight[]
  onSelect: (selection: CircleSelection) => void
}

const RINGS: Record<CircleRing, { inner: number; outer: number; label: number; roman: number }> = {
  major: { inner: 150, outer: 210, label: 178, roman: 201 },
  minor: { inner: 100, outer: 150, label: 128, roman: 108 },
  diminished: { inner: 52, outer: 100, label: 80, roman: 61 },
}
const SUFFIX: Record<CircleRing, string> = { major: '', minor: 'm', diminished: '°' }
const SECTOR_DEGREES = 30

function point(radius: number, degrees: number): string {
  const rad = (degrees * Math.PI) / 180
  return `${(radius * Math.sin(rad)).toFixed(2)} ${(-radius * Math.cos(rad)).toFixed(2)}`
}

function sectorPath(index: number, ring: CircleRing): string {
  const { inner, outer } = RINGS[ring]
  const from = index * SECTOR_DEGREES - SECTOR_DEGREES / 2
  const to = from + SECTOR_DEGREES
  return [
    `M ${point(outer, from)}`,
    `A ${outer} ${outer} 0 0 1 ${point(outer, to)}`,
    `L ${point(inner, to)}`,
    `A ${inner} ${inner} 0 0 0 ${point(inner, from)}`,
    'Z',
  ].join(' ')
}

function labelPosition(radius: number, index: number): { x: number; y: number } {
  const rad = (index * SECTOR_DEGREES * Math.PI) / 180
  return { x: radius * Math.sin(rad), y: -radius * Math.cos(rad) }
}

/** A highlighted sector shows the chord as spelled in the key; otherwise every spelling. */
function sectorSymbols(
  spelling: CircleSpelling,
  ring: CircleRing,
  highlight: CircleHighlight | undefined,
): string[] {
  if (highlight !== undefined) return [displaySymbol(highlight.symbol)]
  const names =
    spelling.alternate === undefined ? [spelling.tonic] : [spelling.tonic, spelling.alternate]
  return names.map((name) => displaySymbol(name + SUFFIX[ring]))
}

/** Chord name (one or two spellings) plus, when the chord is in the key, its degree. */
function SectorText({
  index,
  ring,
  symbols,
  roman,
}: {
  index: number
  ring: CircleRing
  symbols: string[]
  roman: string | undefined
}) {
  const label = labelPosition(RINGS[ring].label, index)
  const romanAt = labelPosition(RINGS[ring].roman, index)
  return (
    <>
      <text
        x={label.x}
        y={label.y}
        className={symbols.length > 1 ? 'sector-label is-double' : 'sector-label'}
      >
        {symbols.length > 1
          ? symbols.map((symbol, i) => (
              <tspan key={symbol} x={label.x} dy={i === 0 ? '-0.45em' : '1.1em'}>
                {symbol}
              </tspan>
            ))
          : symbols[0]}
      </text>
      {roman !== undefined && (
        <text x={romanAt.x} y={romanAt.y} className="sector-roman">
          {roman}
        </text>
      )}
    </>
  )
}

function sectorName(
  spelling: CircleSpelling,
  ring: KeyMode,
  highlight: CircleHighlight | undefined,
): string {
  if (highlight !== undefined) {
    return `${spokenNote(highlight.symbol)} ${modeName(ring)}, grado ${highlight.roman}`
  }
  const names = [spelling.tonic, spelling.alternate].flatMap((n) =>
    n === undefined ? [] : [spokenNote(n)],
  )
  return `${names.join(' o ')} ${modeName(ring)}`
}

function isFocusVisible(element: Element): boolean {
  try {
    return element.matches(':focus-visible')
  } catch {
    return true // engines without :focus-visible: always show the ring
  }
}

/** Drawn after every sector so neighbours never paint over it; dark halo + light line. */
function Outline({ at, variant }: { at: CircleSelection; variant: 'selected' | 'focus' }) {
  const d = sectorPath(at.index, at.ring)
  return (
    <g className={`outline outline--${variant}`} aria-hidden="true">
      <path className="outline-halo" d={d} />
      <path className="outline-line" d={d} />
    </g>
  )
}

const sectorKey = (index: number, ring: CircleRing) => `${ring}-${index}`

export function CircleOfFifths({ selected, highlights, onSelect }: CircleOfFifthsProps) {
  const sectors = useRef(new Map<string, SVGGElement>())
  const [focused, setFocused] = useState<CircleSelection | null>(null)

  const handleFocus = (event: FocusEvent<SVGGElement>, index: number, ring: KeyMode) => {
    setFocused(isFocusVisible(event.currentTarget) ? { index, ring } : null)
  }

  const focusSector = (index: number, ring: KeyMode) => {
    sectors.current.get(sectorKey((index + 12) % 12, ring))?.focus()
  }

  const handleKeyDown = (event: KeyboardEvent, index: number, ring: KeyMode) => {
    switch (event.key) {
      case 'Enter':
      case ' ':
        onSelect({ index, ring })
        break
      case 'ArrowRight':
        focusSector(index + 1, ring)
        break
      case 'ArrowLeft':
        focusSector(index - 1, ring)
        break
      case 'ArrowDown':
      case 'ArrowUp':
        focusSector(index, ring === 'major' ? 'minor' : 'major')
        break
      default:
        return
    }
    event.preventDefault()
  }

  return (
    <svg className="circle" viewBox="-215 -215 430 430" role="radiogroup" aria-label="Tonalidades">
      {(['major', 'minor'] as const).flatMap((ring) =>
        CIRCLE_OF_FIFTHS.map((position) => {
          const { index } = position
          const spelling = position[ring]
          const highlight = highlights.find((h) => h.index === index && h.ring === ring)
          const isSelected = selected.index === index && selected.ring === ring
          const symbols = sectorSymbols(spelling, ring, highlight)
          const className = [
            'sector',
            `sector--${ring}`,
            highlight === undefined ? '' : 'is-diatonic',
            isSelected ? 'is-selected' : '',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <g
              key={sectorKey(index, ring)}
              ref={(node) => {
                if (node === null) sectors.current.delete(sectorKey(index, ring))
                else sectors.current.set(sectorKey(index, ring), node)
              }}
              className={className}
              role="radio"
              tabIndex={isSelected ? 0 : -1}
              aria-checked={isSelected}
              aria-label={sectorName(spelling, ring, highlight)}
              onClick={() => onSelect({ index, ring })}
              onKeyDown={(event) => handleKeyDown(event, index, ring)}
              onFocus={(event) => handleFocus(event, index, ring)}
              onBlur={() => setFocused(null)}
            >
              <path d={sectorPath(index, ring)} />
              <SectorText index={index} ring={ring} symbols={symbols} roman={highlight?.roman} />
            </g>
          )
        }),
      )}
      {/* Read-only ring: the vii° is a chord, not a key, so it is not a radio. The key panel
          already lists it for screen readers. */}
      <g aria-hidden="true">
        {CIRCLE_OF_FIFTHS.map(({ index, diminished }) => {
          const highlight = highlights.find((h) => h.index === index && h.ring === 'diminished')
          const className = [
            'sector',
            'sector--diminished',
            highlight === undefined ? '' : 'is-diatonic',
          ]
            .filter(Boolean)
            .join(' ')
          return (
            <g key={sectorKey(index, 'diminished')} className={className}>
              <path d={sectorPath(index, 'diminished')} />
              <SectorText
                index={index}
                ring="diminished"
                symbols={sectorSymbols(diminished, 'diminished', highlight)}
                roman={highlight?.roman}
              />
            </g>
          )
        })}
      </g>
      <Outline at={selected} variant="selected" />
      {focused !== null && <Outline at={focused} variant="focus" />}
    </svg>
  )
}
