import { Note } from 'tonal'

// Where the close voicing starts; the root then drops one octave below it.
const VOICING_OCTAVE = 3

/**
 * Voicing for playback: the close position (root in octave 3, each next note in the lowest octave
 * strictly above the previous one), then the root alone one octave down, so a chord and the one a
 * third above it (Dm9, Fmaj7) differ by a clear bass. `['G','B','D']` → `['G2','B3','D4']`.
 */
export function playbackPitches(notes: string[]): string[] {
  const pitches: string[] = []
  let previous = -Infinity
  for (const note of notes) {
    // An unparseable name has no midi number and would loop forever below.
    if (Note.midi(`${note}${VOICING_OCTAVE}`) === null)
      throw new RangeError(`unknown note "${note}"`)
    let octave = VOICING_OCTAVE
    while (Note.midi(`${note}${octave}`)! <= previous) octave += 1
    previous = Note.midi(`${note}${octave}`)!
    // Tone.js cannot read a triple accidental (only C♭ superlocrian ♭♭7 has one): play its pitch.
    pitches.push(note.includes('bbb') ? Note.fromMidi(previous) : `${note}${octave}`)
  }
  if (pitches.length > 0) pitches[0] = Note.transpose(pitches[0]!, '-8P')
  return pitches
}
