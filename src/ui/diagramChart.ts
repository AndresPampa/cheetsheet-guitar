import type { Voicing } from '../voicings/index.ts'

// Pure mapping from a voicing to svguitar's chart model, kept apart from the drawing so it is
// unit-tested (only the svguitar draw call needs a real browser).

export type ChartFinger = [string: number, fret: number | 'x' | 0, label?: string]

export interface ChartBarre {
  fret: number
  fromString: number
  toString: number
  /** The finger that holds the barre. */
  text: string
}

export interface Chart {
  fingers: ChartFinger[]
  barres: ChartBarre[]
  /** First fret of the diagram window; svguitar labels it ("3fr") when it is not the nut. */
  position: number
}

/** Strings in svguitar go from 1 (high E) to 6 (low E); a voicing lists the 6th string first. */
const svgString = (index: number) => 6 - index

export function toChart({ frets, fingers, baseFret, barres }: Voicing): Chart {
  const relative = (fret: number) => fret - baseFret + 1
  const barreFinger = (fret: number) => fingers[frets.indexOf(fret)]
  const chartFingers = frets.flatMap((fret, i): ChartFinger[] => {
    if (fret < 0) return [[svgString(i), 'x']]
    if (fret === 0) return [[svgString(i), 0]]
    // Strings held by a barre's finger are drawn by the barre itself.
    if (barres.includes(fret) && fingers[i] === barreFinger(fret)) return []
    return [[svgString(i), relative(fret), String(fingers[i])]]
  })
  const chartBarres = barres.map((fret) => ({
    fret: relative(fret),
    fromString: svgString(frets.indexOf(fret)),
    toString: svgString(frets.lastIndexOf(fret)),
    text: String(barreFinger(fret)),
  }))
  return { fingers: chartFingers, barres: chartBarres, position: baseFret }
}
