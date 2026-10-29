import { expect, test, type Page } from '@playwright/test'

// PRD "Testing Decisions": the 2–3 critical journeys through the assembled app.

const keyPanel = (page: Page) => page.getByRole('region', { name: 'Tonalidad seleccionada' })
const diatonicChords = (page: Page) =>
  keyPanel(page).getByRole('list', { name: 'Acordes diatónicos' }).getByRole('button')
const modeRow = (page: Page, mode: string) =>
  page.getByRole('row').filter({ has: page.getByRole('rowheader', { name: new RegExp(mode) }) })

test('clicking G on the circle highlights its seven diatonic chords', async ({ page }) => {
  await page.goto('/')

  await page.getByRole('radio', { name: /^G mayor/ }).click()

  await expect(page.getByRole('radio', { name: /^G mayor, grado I/ })).toBeChecked()
  await expect(page.getByRole('radio', { name: /^C mayor, grado IV/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^D mayor, grado V/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^A menor, grado ii/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^B menor, grado iii/ })).toBeVisible()
  await expect(page.getByRole('radio', { name: /^E menor, grado vi/ })).toBeVisible()
  // The vii° lives on the read-only inner ring (aria-hidden: the key panel announces it).
  await expect(page.locator('svg.circle .sector--diminished.is-diatonic')).toHaveText(['F♯°vii°'])
  await expect(keyPanel(page).getByRole('heading')).toHaveText('G mayor')
  await expect(diatonicChords(page)).toHaveText([
    'I G',
    'ii Am',
    'iii Bm',
    'IV C',
    'V D',
    'vi Em',
    'vii° F♯°',
  ])
})

test('switching to sevenths updates the key panel and the modes table', async ({ page }) => {
  await page.goto('/?key=G')

  await keyPanel(page).getByRole('button', { name: 'Séptimas' }).click()

  await expect(diatonicChords(page)).toHaveText([
    'Imaj7 Gmaj7',
    'ii7 Am7',
    'iii7 Bm7',
    'IVmaj7 Cmaj7',
    'V7 D7',
    'vi7 Em7',
    'viiø7 F♯m7♭5',
  ])
  await expect(modeRow(page, 'Dórico').getByRole('button', { name: /^IV7 C7/ })).toBeVisible()
  // Decision 18: the circle always stays in triads.
  await expect(page.getByRole('radio', { name: /^D mayor, grado V$/ })).not.toContainText('7')
})

test('the selection survives a reload through the URL', async ({ page }) => {
  await page.goto('/')
  await page.getByRole('radio', { name: /^E menor/ }).click()
  await keyPanel(page).getByRole('button', { name: 'Séptimas' }).click()
  // The URL is what carries the state across the reload: wait until it holds all of it.
  await expect(page).toHaveURL(/key=E&mode=minor&chords=7th/)

  await page.reload()

  await expect(page.getByRole('radio', { name: /^E menor, grado i/ })).toBeChecked()
  await expect(keyPanel(page).getByRole('heading')).toHaveText('E menor')
  await expect(keyPanel(page).getByRole('button', { name: 'Séptimas' })).toHaveAttribute(
    'aria-pressed',
    'true',
  )
})

// Spec chord-extensions, "Flujo Cmaj13 (E2E)".
test('a Cmaj13 built with two extensions shows its formula and survives a reload', async ({
  page,
}) => {
  const chordPanel = page.getByRole('region', { name: 'Acorde seleccionado' })
  // The selector lives in the key panel; it changes the chord open in the chord panel.
  const extension = (name: string) =>
    keyPanel(page)
      .getByRole('group', { name: 'Extensiones del acorde abierto' })
      .getByRole('button', { name, exact: true })
  await page.goto('/')

  await keyPanel(page).getByRole('button', { name: 'Séptimas' }).click()
  await extension('9').click()
  await extension('13').click()

  await expect(chordPanel.getByRole('heading', { name: 'Cmaj13' })).toBeVisible()
  await expect(
    chordPanel.getByRole('table', { name: 'Fórmula de Cmaj13' }).locator('th [aria-hidden="true"]'),
  ).toHaveText(['1', '3', '5', '7', '9', '13'])
  await expect(page).toHaveURL(/chords=7th/)
  await expect(page).toHaveURL(/ext=9(,|%2C)13/)

  await page.reload()

  await expect(chordPanel.getByRole('heading', { name: 'Cmaj13' })).toBeVisible()
  await expect(extension('9')).toHaveAttribute('aria-pressed', 'true')
  await expect(extension('13')).toHaveAttribute('aria-pressed', 'true')
})
