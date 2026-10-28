import { Interval } from 'tonal'

// Semitones above the root of each degree (1–7) of its major scale: the reference for `b`/`#`.
const MAJOR_SEMITONES = [0, 2, 4, 5, 7, 9, 11]

/**
 * The degree of each note above the first one (the root), altered against the root's major
 * scale: `['C', 'Eb', 'G']` → `['1', 'b3', '5']`, `['B', 'D', 'F', 'A']` → `['1', 'b3', 'b5', 'b7']`.
 */
export function getChordFormula(notes: string[]): string[] {
  const root = notes[0]!
  return notes.map((note) => {
    const { num, semitones } = Interval.get(Interval.distance(root, note))
    const diff = semitones - MAJOR_SEMITONES[num - 1]!
    return (diff < 0 ? 'b'.repeat(-diff) : '#'.repeat(diff)) + num
  })
}
