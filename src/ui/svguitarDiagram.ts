import type { Voicing } from '../voicings/index.ts'
import { toChart } from './diagramChart.ts'

// svguitar (MIT) drawer: just the draw call, verified visually (TESTING.md §17 excludes it from
// coverage) because jsdom has no SVG layout (getBBox). The mapping is in diagramChart.ts.

/** Draws one voicing into `container`, replacing whatever was there. */
export type DiagramDrawer = (container: HTMLElement, voicing: Voicing) => void

export const svguitarDiagram: DiagramDrawer = (container, voicing) => {
  void import('svguitar')
    .then(({ SVGuitarChord }) => {
      // The panel may have moved on (or unmounted) while svguitar was loading.
      if (!container.isConnected) return
      container.replaceChildren()
      // svguitar writes colors as SVG attributes, where CSS variables do not resolve: read the
      // theme's resolved colors instead (text for lines and dots, page background for labels).
      const color = getComputedStyle(container).color
      const background = getComputedStyle(document.body).backgroundColor
      new SVGuitarChord(container)
        .configure({ color, fingerTextColor: background })
        .chord(toChart(voicing))
        .draw()
    })
    .catch((error: unknown) => console.error('[diagram] could not draw the chord', error))
}
