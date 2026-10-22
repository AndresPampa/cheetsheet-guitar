import { Note } from 'tonal'

const ROOT_OCTAVE = 3

/**
 * Close-position voicing for playback: the root in octave 3 and each next note in the lowest
 * octave that is strictly above the previous one. `['G','B','D']` → `['G3','B3','D4']`.
 */
export function playbackPitches(notes: string[]): string[] {
  const pitches: string[] = []
  let previous = -Infinity
  for (const note of notes) {
    // An unparseable name has no midi number and would loop forever below.
    if (Note.midi(`${note}${ROOT_OCTAVE}`) === null) throw new RangeError(`unknown note "${note}"`)
    let octave = ROOT_OCTAVE
    while (Note.midi(`${note}${octave}`)! <= previous) octave += 1
    const pitch = `${note}${octave}`
    previous = Note.midi(pitch)!
    pitches.push(pitch)
  }
  return pitches
}
