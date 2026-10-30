import { AxeBuilder } from '@axe-core/playwright'
import { expect, test, type Page, type TestInfo } from '@playwright/test'

// PRD "Accessibility v1" + "Layout": what jsdom cannot measure — real contrast, real layout,
// the accessible names Chrome computes, and the inline theme script in index.html.

const WCAG_AA = ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa']
const THEME_KEY = 'cheetsheet-guitar:theme'
const OPEN_CHORD = '/?key=G&chords=7th&chord=dorian.4'
// Spec chord-extensions: C major I with 9 and 13 is Cmaj13, which chords-db can voice.
const EXTENDED_CHORD = '/?chords=7th&ext=9,13'
// WCAG 1.4.3: normal-size text (every circle label is under 18.66px bold).
const MIN_TEXT_CONTRAST = 4.5

const circle = (page: Page) => page.getByRole('radiogroup', { name: 'Tonalidades' })

/** The open chord's diagram is drawn after two lazy imports (chords-db, svguitar). */
async function waitForDiagram(page: Page, name: RegExp = /^Diagrama de C7/) {
  await expect(page.getByRole('img', { name }).locator('svg')).toBeVisible()
}
const CMAJ13_DIAGRAM = /^Diagrama de Cmaj13:/
// The harmonic minor table: augmented and diminished cells, measured by axe like any text.
const HARMONIC_CHORD = '/?key=A&mode=minor&chords=7th&scale=harmonic&chord=harmonic-minor.5'

async function axeViolations(page: Page, testInfo: TestInfo) {
  const { violations, incomplete } = await new AxeBuilder({ page }).withTags(WCAG_AA).analyze()
  const summary = (results: typeof violations) =>
    results.map(({ id, nodes }) => ({ id, targets: nodes.map((node) => node.target) }))
  // What axe could not decide (e.g. SVG text contrast, measured below) stays visible in the report.
  await testInfo.attach('axe-incomplete.json', {
    body: JSON.stringify(summary(incomplete), null, 2),
    contentType: 'application/json',
  })
  return summary(violations)
}

/** Every circle text against its own sector's fill: axe reads `color`, SVG paints `fill`. */
function circleTextContrasts(page: Page) {
  return page.evaluate(() => {
    const rgb = (color: string) => (color.match(/\d+(\.\d+)?/g) ?? []).slice(0, 3).map(Number)
    const luminance = (color: string) => {
      const [r = 0, g = 0, b = 0] = rgb(color).map((v) => {
        const c = v / 255
        return c <= 0.03928 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4
      })
      return 0.2126 * r + 0.7152 * g + 0.0722 * b
    }
    const ratio = (a: string, b: string) => {
      const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number]
      return (hi + 0.05) / (lo + 0.05)
    }
    return [...document.querySelectorAll('svg.circle g.sector')].flatMap((sector) => {
      const path = sector.querySelector('path')
      if (path === null) return []
      const background = getComputedStyle(path).fill
      return [...sector.querySelectorAll('text')].map((text) => ({
        text: text.textContent ?? '',
        sector: sector.getAttribute('class') ?? '',
        ratio: ratio(getComputedStyle(text).fill, background),
      }))
    })
  })
}

for (const colorScheme of ['dark', 'light'] as const) {
  test.describe(`${colorScheme} theme`, () => {
    // No fill transition in flight while colors are measured.
    test.use({ colorScheme, reducedMotion: 'reduce' })

    test('the start page has no WCAG 2.1 AA violations', async ({ page }, testInfo) => {
      await page.goto('/')
      await expect(page.locator('html')).toHaveAttribute('data-theme', colorScheme)
      await expect(circle(page)).toBeVisible()

      expect(await axeViolations(page, testInfo)).toEqual([])
    })

    test('an open chord with sevenths has no WCAG 2.1 AA violations', async ({
      page,
    }, testInfo) => {
      await page.goto(OPEN_CHORD)
      await waitForDiagram(page)

      expect(await axeViolations(page, testInfo)).toEqual([])
    })

    test('an open chord with extensions has no WCAG 2.1 AA violations', async ({
      page,
    }, testInfo) => {
      await page.goto(EXTENDED_CHORD)
      await waitForDiagram(page, CMAJ13_DIAGRAM)

      expect(await axeViolations(page, testInfo)).toEqual([])
    })

    test('the harmonic minor table has no WCAG 2.1 AA violations', async ({ page }, testInfo) => {
      await page.goto(HARMONIC_CHORD)
      await waitForDiagram(page, /^Diagrama de E7:/)

      expect(await axeViolations(page, testInfo)).toEqual([])
    })

    test('every circle label contrasts at least 4.5:1 with its sector', async ({ page }) => {
      // G major: free, diatonic and selected sectors on all three rings.
      await page.goto('/?key=G')
      await expect(circle(page)).toBeVisible()

      const contrasts = await circleTextContrasts(page)

      expect(contrasts.length).toBeGreaterThanOrEqual(36)
      // Written as "not >=" so an unparseable color (NaN) fails too.
      expect(contrasts.filter(({ ratio }) => !(ratio >= MIN_TEXT_CONTRAST))).toEqual([])
    })
  })
}

test('the page never scrolls sideways, even with a chord open', async ({ page }) => {
  await page.goto(OPEN_CHORD)
  await waitForDiagram(page)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('the page reflows at 320px without sideways scrolling', async ({ page }) => {
  // WCAG 1.4.10: 320 CSS px is the narrowest width content must reflow to.
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto(OPEN_CHORD)
  await waitForDiagram(page)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test('the page reflows at 320px with extensions chosen', async ({ page }) => {
  await page.setViewportSize({ width: 320, height: 640 })
  await page.goto(EXTENDED_CHORD)
  await waitForDiagram(page, CMAJ13_DIAGRAM)

  const overflow = await page.evaluate(
    () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
  )
  expect(overflow).toBe(0)
})

test.describe('theme before first paint', () => {
  test.use({ colorScheme: 'dark' })

  test('a saved light theme wins over a dark system before the app loads', async ({ page }) => {
    await page.addInitScript((key) => localStorage.setItem(key, 'light'), THEME_KEY)
    // Only the inline script in index.html may run: the app bundle never arrives.
    await page.route('**/assets/*.js', (route) => route.abort())

    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })

  test('with nothing saved, a dark system gives the dark theme before the app loads', async ({
    page,
  }) => {
    await page.route('**/assets/*.js', (route) => route.abort())

    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'dark')
  })
})

test.describe('theme before first paint, light system', () => {
  test.use({ colorScheme: 'light' })

  test('with nothing saved, a light system gives the light theme before the app loads', async ({
    page,
  }) => {
    await page.route('**/assets/*.js', (route) => route.abort())

    await page.goto('/')

    await expect(page.locator('html')).toHaveAttribute('data-theme', 'light')
  })
})

test('the text for screen readers stays out of a copy', async ({ page }) => {
  await page.goto('/')
  const hidden = page.getByRole('table', { name: 'Fórmula de C' }).locator('th .sr-only').first()

  expect(await hidden.evaluate((node) => getComputedStyle(node).userSelect)).toBe('none')
})

// Answers what jsdom could not: Chrome's real accessible name for a cell. It does NOT guard the
// leading spaces inside the sr-only spans — the stacked flex layout already separates the words
// in Chrome; the unit tests in src/ui guard those spaces.
test('Chrome names a mode-table cell with its hidden hints as separate words', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('table', { name: 'Modos de la escala mayor de C' })).toBeVisible()
  const cdp = await page.context().newCDPSession(page)
  await cdp.send('Accessibility.enable')

  const { nodes } = await cdp.send('Accessibility.getFullAXTree')
  const names = nodes
    .filter((node) => node.role?.value === 'button')
    .map((node) => String(node.name?.value ?? ''))

  // C dorian IV: F holds the characteristic A and is the mode's star.
  expect(names).toContain('IV F (más representativo) (característica)')
})
