import { useRef, type KeyboardEvent } from 'react'
import {
  CIRCLE_OF_FIFTHS,
  type CircleHighlight,
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

const RINGS: Record<KeyMode, { inner: number; outer: number; label: number; roman: number }> = {
  major: { inner: 140, outer: 210, label: 172, roman: 197 },
  minor: { inner: 84, outer: 140, label: 116, roman: 95 },
}
const SECTOR_DEGREES = 30

function point(radius: number, degrees: number): string {
  const rad = (degrees * Math.PI) / 180
  return `${(radius * Math.sin(rad)).toFixed(2)} ${(-radius * Math.cos(rad)).toFixed(2)}`
}

function sectorPath(index: number, ring: KeyMode): string {
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

function sectorSymbols(spelling: CircleSpelling, ring: KeyMode): string[] {
  const suffix = ring === 'minor' ? 'm' : ''
  const names =
    spelling.alternate === undefined ? [spelling.tonic] : [spelling.tonic, spelling.alternate]
  return names.map((name) => displaySymbol(name + suffix))
}

function sectorName(spelling: CircleSpelling, ring: KeyMode, roman: string | undefined): string {
  const names = [spelling.tonic, spelling.alternate].flatMap((n) =>
    n === undefined ? [] : [spokenNote(n)],
  )
  const name = `${names.join(' o ')} ${modeName(ring)}`
  return roman === undefined ? name : `${name}, grado ${roman}`
}

const sectorKey = (index: number, ring: KeyMode) => `${ring}-${index}`

export function CircleOfFifths({ selected, highlights, onSelect }: CircleOfFifthsProps) {
  const sectors = useRef(new Map<string, SVGGElement>())

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
    <svg className="circle" viewBox="-215 -215 430 430" aria-label="Círculo de quintas">
      {(['major', 'minor'] as const).flatMap((ring) =>
        CIRCLE_OF_FIFTHS.map((position) => {
          const { index } = position
          const spelling = position[ring]
          const highlight = highlights.find((h) => h.index === index && h.ring === ring)
          const isSelected = selected.index === index && selected.ring === ring
          const symbols = sectorSymbols(spelling, ring)
          const label = labelPosition(RINGS[ring].label, index)
          const roman = labelPosition(RINGS[ring].roman, index)
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
              role="button"
              tabIndex={isSelected ? 0 : -1}
              aria-pressed={isSelected}
              aria-label={sectorName(spelling, ring, highlight?.roman)}
              onClick={() => onSelect({ index, ring })}
              onKeyDown={(event) => handleKeyDown(event, index, ring)}
            >
              <path d={sectorPath(index, ring)} />
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
              {highlight !== undefined && (
                <text x={roman.x} y={roman.y} className="sector-roman">
                  {highlight.roman}
                </text>
              )}
            </g>
          )
        }),
      )}
    </svg>
  )
}
