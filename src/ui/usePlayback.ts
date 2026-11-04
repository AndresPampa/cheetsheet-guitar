import { useEffect, useRef, useState } from 'react'
import type { AudioPort } from '../audio/index.ts'

/**
 * Plays a progression one 4/4 bar per step (`240 / bpm` s), chaining a timeout per bar. Steps,
 * tempo and loop are read at each bar, so changing them does not stop it: the caller stops it.
 * `current` is the index of the step sounding, `null` when stopped.
 */
export function usePlayback(
  audio: AudioPort,
  steps: Array<{ notes: string[] }>,
  bpm: number,
  loop: boolean,
) {
  const [current, setCurrent] = useState<number | null>(null)
  const timer = useRef<ReturnType<typeof setTimeout>>(undefined)
  const latest = useRef({ steps, bpm, loop })
  useEffect(() => {
    latest.current = { steps, bpm, loop }
  })
  useEffect(() => () => clearTimeout(timer.current), [])

  // The first call runs inside the click, so WebKit lets the audio start.
  const playAt = (index: number) => {
    clearTimeout(timer.current)
    const seconds = 240 / latest.current.bpm
    audio.playChord(latest.current.steps[index]!.notes, seconds)
    setCurrent(index)
    timer.current = setTimeout(() => {
      const next = index + 1 < latest.current.steps.length ? index + 1 : 0
      if (next > 0 || latest.current.loop) playAt(next)
      else setCurrent(null)
    }, seconds * 1000)
  }

  const stop = () => {
    clearTimeout(timer.current)
    setCurrent(null)
  }

  return { current, play: () => playAt(0), stop }
}
