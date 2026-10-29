import { expect, test, type Page } from '@playwright/test'

// v1.5: the public deploy serves vercel.json's headers; `vite preview` serves the same ones
// (vite.config.ts reads them), so these tests check what Vercel will send.

/** Every CSP violation the page reports, plus console errors and uncaught exceptions. */
async function watchForProblems(page: Page) {
  const problems: string[] = []
  page.on('console', (message) => {
    if (message.type() === 'error') problems.push(`console: ${message.text()}`)
  })
  page.on('pageerror', (error) => problems.push(`exception: ${error.message}`))
  await page.exposeFunction('reportCspViolation', (violation: string) =>
    problems.push(`csp: ${violation}`),
  )
  await page.addInitScript(() => {
    const spy = window as unknown as {
      reportCspViolation: (v: string) => void
      workerMessages: number
    }
    document.addEventListener('securitypolicyviolation', (event) => {
      spy.reportCspViolation(`${event.violatedDirective} blocked ${event.blockedURI || 'inline'}`)
    })
    // Counts messages from any worker, to prove one actually runs under the CSP.
    spy.workerMessages = 0
    const NativeWorker = window.Worker
    window.Worker = class extends NativeWorker {
      constructor(...args: ConstructorParameters<typeof Worker>) {
        super(...args)
        this.addEventListener('message', () => {
          spy.workerMessages += 1
        })
      }
    }
  })
  return problems
}

const directives = (csp: string) =>
  new Map(
    csp
      .split(';')
      .map((directive) => directive.trim().split(/\s+/))
      .filter(([name]) => name !== undefined && name !== '')
      .map(([name, ...sources]) => [name as string, sources]),
  )

test('the page is served with the security headers', async ({ page }) => {
  const response = await page.goto('/')
  const headers = response?.headers() ?? {}

  expect(headers['x-content-type-options']).toBe('nosniff')
  expect(headers['referrer-policy']).toBe('strict-origin-when-cross-origin')
  expect(headers['cross-origin-opener-policy']).toBe('same-origin')
  expect(headers['strict-transport-security']).toBe('max-age=63072000; includeSubDomains')
  expect(headers['permissions-policy']).toBe(
    'camera=(), microphone=(), geolocation=(), payment=(), usb=()',
  )
  // Every directive pinned, so any loosening (a new directive, a wider source) fails here.
  expect(Object.fromEntries(directives(headers['content-security-policy'] ?? ''))).toEqual({
    'default-src': ["'self'"],
    // Own files plus the one hashed inline theme script: never inline or eval at large.
    'script-src': ["'self'", expect.stringMatching(/^'sha256-[A-Za-z0-9+/]{43}='$/)],
    // Only Tone.js's clock, built from a blob: URL.
    'worker-src': ['blob:'],
    'style-src': ["'self'"],
    'img-src': ["'self'"],
    'object-src': ["'none'"],
    'base-uri': ["'none'"],
    'form-action': ["'none'"],
    'frame-ancestors': ["'none'"],
  })
})

test('the static assets carry the security headers too', async ({ page }) => {
  const responses: Array<{ url: string; nosniff: string | undefined }> = []
  page.on('response', (response) =>
    responses.push({ url: response.url(), nosniff: response.headers()['x-content-type-options'] }),
  )

  await page.goto('/')
  await expect(page.getByRole('radiogroup', { name: 'Tonalidades' })).toBeVisible()

  const assets = responses.filter(({ url }) => url.includes('/assets/'))
  expect(assets.length).toBeGreaterThan(0)
  expect(assets.filter(({ nosniff }) => nosniff !== 'nosniff')).toEqual([])
})

test('the app runs under the CSP: theme, audio and diagram', async ({ page }) => {
  const problems = await watchForProblems(page)

  // The hashed inline theme script runs here: a wrong hash shows up as a script-src violation.
  await page.goto('/?key=G')
  // Plays the chord, which loads Tone.js and starts its clock worker (no AudioWorklet: the
  // synth uses none, and script-src would block a blob: worklet if one is ever added).
  await page
    .getByRole('region', { name: 'Tonalidad seleccionada' })
    .getByRole('button', { name: /^V D$/ })
    .click()
  await expect(page.getByRole('img', { name: /^Diagrama de D/ }).locator('svg')).toBeVisible()
  // Tone's clock runs in a worker built from a blob: URL; a blocked worker never ticks.
  await expect
    .poll(() =>
      page.evaluate(() => (window as unknown as { workerMessages: number }).workerMessages),
    )
    .toBeGreaterThan(0)

  expect(problems).toEqual([])
})

test('hostile URL parameters fall back to defaults and run nothing', async ({ page }) => {
  const dialogs: string[] = []
  page.on('dialog', async (dialog) => {
    dialogs.push(dialog.message())
    await dialog.dismiss()
  })

  await page.goto(
    '/?key=%3Cimg%20src%3Dx%20onerror%3Dalert(1)%3E&mode=%3Cscript%3Ealert(2)%3C%2Fscript%3E' +
      '&chord=__proto__.1&lang=javascript:alert(3)' +
      // Starts with a valid extension, so a parser that only splits on commas would keep the 9.
      '&ext=9%2C%3Cscript%3Ealert(4)%3C%2Fscript%3E',
  )

  const keyPanel = page.getByRole('region', { name: 'Tonalidad seleccionada' })
  await expect(keyPanel.getByRole('heading')).toHaveText('C mayor')
  const extensions = keyPanel.getByRole('group', { name: 'Extensiones del acorde abierto' })
  await expect(extensions.getByRole('button', { name: '9' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(extensions.getByRole('button', { name: '11' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(extensions.getByRole('button', { name: '13' })).toHaveAttribute(
    'aria-pressed',
    'false',
  )
  await expect(page.locator('img[src="x"]')).toHaveCount(0)
  // The only inline script is index.html's theme script: nothing was injected.
  await expect(page.locator('script:not([src])')).toHaveCount(1)
  expect(dialogs).toEqual([])
})
