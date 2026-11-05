/** Plays chords. The UI depends on this port, never on Tone.js; tests inject a fake. */
export interface AudioPort {
  /**
   * Pitch classes in chord order (`['G', 'B', 'D']`); octaves are chosen for playback. Each note
   * rings for `seconds` (a bar of the progression), or a short default.
   */
  playChord(notes: string[], seconds?: number): void
}

export { playbackPitches } from './pitches.ts'
export { toneAudio } from './tone.ts'
