/** Plays chords. The UI depends on this port, never on Tone.js; tests inject a fake. */
export interface AudioPort {
  /** Pitch classes in chord order (`['G', 'B', 'D']`); octaves are chosen for playback. */
  playChord(notes: string[]): void
}

export { playbackPitches } from './pitches.ts'
export { toneAudio } from './tone.ts'
