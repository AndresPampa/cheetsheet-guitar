import type { AudioPort } from './index.ts'
import { playbackPitches } from './pitches.ts'

// Tone.js adapter. Verified by ear, not by unit tests (TESTING.md §17 excludes it from coverage):
// components get the AudioPort injected and tests pass a fake.

/** Delay between strings, so the chord sounds strummed rather than struck as a block. */
const STRUM_SECONDS = 0.025
const RING_SECONDS = 1.6

type ToneModule = typeof import('tone')
type Ready = { Tone: ToneModule; synth: InstanceType<ToneModule['PolySynth']> }

let context: AudioContext | null = null
let ready: Promise<Ready> | null = null

// Runs synchronously inside the click: WebKit only lets an AudioContext start from the user's
// gesture itself, not after an `await`. Called on every play, so a context the OS suspended
// (iOS interruptions) is resumed by the next click.
function unlock(): AudioContext {
  context ??= new AudioContext()
  if (context.state !== 'running') void context.resume()
  return context
}

// Tone.js is loaded on the first click, which keeps it out of the initial bundle. A failed
// load is forgotten so the next click retries instead of staying silent for the session.
function load(audioContext: AudioContext): Promise<Ready> {
  ready ??= import('tone')
    .then((Tone) => {
      Tone.setContext(audioContext)
      const synth = new Tone.PolySynth(Tone.Synth, {
        oscillator: { type: 'triangle' },
        envelope: { attack: 0.004, decay: 0.4, sustain: 0.15, release: 1.2 },
      }).toDestination()
      synth.volume.value = -8
      return { Tone, synth }
    })
    .catch((error: unknown) => {
      ready = null
      throw error
    })
  return ready
}

export const toneAudio: AudioPort = {
  playChord(notes) {
    const pitches = playbackPitches(notes)
    load(unlock())
      .then(({ Tone, synth }) => {
        // The previous chord stops, so quick comparisons do not blur into each other.
        synth.releaseAll()
        const start = Tone.immediate()
        pitches.forEach((pitch, i) => {
          synth.triggerAttackRelease(pitch, RING_SECONDS, start + i * STRUM_SECONDS)
        })
      })
      .catch((error: unknown) => console.error('[audio] could not play the chord', error))
  },
}
