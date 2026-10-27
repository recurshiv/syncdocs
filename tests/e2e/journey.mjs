// End-to-end check of SyncDocs in a real (headless) browser.
// Usage: node journey.mjs [base-url] [screenshot-dir]
// Needs both apps running (npm run dev in server/ and client/). Creates test users.
import { chromium } from 'playwright'

const BASE = process.argv[2] ?? 'http://localhost:5173'
const SHOTS = process.argv[3] ?? '.'
const results = []
const check = (name, ok, detail = '') => {
  results.push({ name, ok })
  console.log(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? `  (${detail})` : ''}`)
}
const uid = Date.now()
const consoleErrors = []

const browser = await chromium.launch()
const ctx = await browser.newContext()
const page = await ctx.newPage()
page.on('console', (m) => m.type() === 'error' && consoleErrors.push(m.text()))
page.on('pageerror', (e) => consoleErrors.push(String(e)))

const editor = page.locator('.tiptap-content')
const status = (text) => page.getByText(text, { exact: true })

// --- Protected route redirect
await page.goto(`${BASE}/dashboard`)
await page.waitForURL('**/login')
check('unauthenticated /dashboard redirects to /login', true)
await page.screenshot({ path: `${SHOTS}/login.png` })
await page.goto(`${BASE}/`)
await page.getByText('Documents that never').waitFor()
await page.screenshot({ path: `${SHOTS}/landing.png`, fullPage: true })

// --- Sign up
await page.goto(`${BASE}/signup`)
await page.getByLabel('Name').fill('Alice')
await page.getByLabel('Email').fill(`alice${uid}@example.com`)
await page.getByLabel('Password').fill('password123')
await page.getByRole('button', { name: 'Create account' }).click()
await page.waitForURL('**/dashboard')
await page.getByText('No documents yet').waitFor()
check('signup lands on empty dashboard', true)

// --- Create and edit
await page.getByRole('button', { name: 'New Document' }).click()
await page.waitForURL('**/document/*')
const docUrl = page.url()
await editor.waitFor()
check('new document opens editor', true)

await page.getByLabel('Document title').fill('Lesson plan')
await editor.click()
await page.getByLabel('Text style').selectOption('h1')
await page.keyboard.type('Week one')
await page.keyboard.press('Enter')
await page.keyboard.press('Control+b')
await page.keyboard.type('Bold intro.')
await page.keyboard.press('Control+b')
await page.keyboard.press('Enter')
await page.getByRole('button', { name: 'Bullet list' }).click()
await page.keyboard.type('First point')
await status('Saved').waitFor({ timeout: 5000 })
check('autosave reaches "Saved"', true)

// --- Persistence across reload
await page.reload()
await editor.waitFor()
const html = await editor.innerHTML()
check('title persists after reload', (await page.getByLabel('Document title').inputValue()) === 'Lesson plan')
check('heading persists', html.includes('<h1>Week one</h1>'), html.slice(0, 80))
check('bold persists', html.includes('<strong>Bold intro.</strong>'))
check('bullet list persists', html.includes('<ul>') && html.includes('First point'))

// --- Undo/redo
await editor.click()
await page.keyboard.press('End')
await page.keyboard.type(' extra')
await page.getByRole('button', { name: 'Undo' }).click()
const afterUndo = await editor.innerText()
await page.getByRole('button', { name: 'Redo' }).click()
const afterRedo = await editor.innerText()
check('undo removes typed text', !afterUndo.includes('extra'))
check('redo restores it', afterRedo.includes('extra'))
await status('Saved').waitFor({ timeout: 5000 })

// --- Slow saves: requests never overlap, final content wins
// Count overlap from the browser's own request lifecycle events.
let inFlight = 0
let maxInFlight = 0
let patches = 0
const isPatch = (req) => req.method() === 'PATCH' && req.url().includes('/api/documents/')
const onStart = (req) => {
  if (!isPatch(req)) return
  patches++
  maxInFlight = Math.max(maxInFlight, ++inFlight)
}
const onEnd = (req) => isPatch(req) && inFlight--
page.on('request', onStart)
page.on('requestfinished', onEnd)
page.on('requestfailed', onEnd)
await page.route('**/api/documents/*', async (route) => {
  if (route.request().method() !== 'PATCH') return route.continue()
  await new Promise((r) => setTimeout(r, 1500))
  await route.continue()
})
await editor.click()
await page.keyboard.press('Control+End')
await page.keyboard.press('Enter')
await page.keyboard.type('slow one')
await status('Saving…').waitFor({ timeout: 3000 })
await page.keyboard.type(' slow two') // typed while the first save is in flight
await status('Saved').waitFor({ timeout: 10000 })
await page.unroute('**/api/documents/*')
page.off('request', onStart)
page.off('requestfinished', onEnd)
page.off('requestfailed', onEnd)
check('saves never overlap', maxInFlight === 1, `max in flight ${maxInFlight}, ${patches} PATCHes`)
await page.reload()
await editor.waitFor()
check('edit typed during an in-flight save is persisted', (await editor.innerText()).includes('slow one slow two'))

// --- Failed save: error shown, leaving is blocked, retry works
await page.route('**/api/documents/*', (route) =>
  route.request().method() === 'PATCH' ? route.abort() : route.continue(),
)
await editor.click()
await page.keyboard.press('Control+End')
await page.keyboard.type(' offline edit')
await page.getByText("Couldn't save").waitFor({ timeout: 5000 })
check('failed save shows error', true)
await page.getByRole('button', { name: 'Back to dashboard' }).click()
await page.getByText("Your latest changes aren't saved").waitFor({ timeout: 5000 })
check('leaving with unsaved edits shows warning', page.url() === docUrl)
await page.getByRole('button', { name: 'Stay' }).click()
await page.unroute('**/api/documents/*')
await page.getByRole('button', { name: 'Retry' }).click()
await status('Saved').waitFor({ timeout: 5000 })
check('retry saves the kept edits', true)

// --- Back immediately after typing: saves first, then navigates
await editor.click()
await page.keyboard.press('Control+End')
await page.keyboard.type(' last words')
await page.getByRole('button', { name: 'Back to dashboard' }).click()
await page.waitForURL('**/dashboard')
await page.getByText('Lesson plan').first().waitFor()
await page.goto(docUrl)
await editor.waitFor()
check('back button flushes pending edits before leaving', (await editor.innerText()).includes('last words'))

// --- Dashboard: preview, rename, delete
await page.goto(`${BASE}/dashboard`)
await page.getByText('Week one Bold intro.').waitFor()
check('dashboard shows preview', true)
await page.getByRole('button', { name: 'New Document' }).click()
await page.waitForURL('**/document/*')
await page.getByRole('button', { name: 'Back to dashboard' }).click()
await page.waitForURL('**/dashboard')
await page.getByRole('button', { name: 'Rename Untitled document' }).click()
await page.getByLabel('Document title').fill('Homework')
await page.getByRole('button', { name: 'Save' }).click()
await page.getByText('Homework', { exact: true }).first().waitFor()
await page.reload()
await page.getByText('Homework', { exact: true }).first().waitFor()
check('rename persists', true)
await page.screenshot({ path: `${SHOTS}/dashboard-desktop.png` })
await page.getByRole('button', { name: 'Delete Homework' }).click()
await page.getByText("This can't be undone.").waitFor()
await page.getByRole('button', { name: 'Delete', exact: true }).click()
await page.getByText('Homework', { exact: true }).first().waitFor({ state: 'detached' })
await page.reload()
await page.getByText('Lesson plan').first().waitFor()
check('delete persists', (await page.getByText('Homework', { exact: true }).count()) === 0)

// --- Screenshots
await page.goto(docUrl)
await editor.waitFor()
await page.screenshot({ path: `${SHOTS}/editor-desktop.png` })
await page.setViewportSize({ width: 390, height: 844 })
await page.screenshot({ path: `${SHOTS}/editor-mobile.png` })
await page.goto(`${BASE}/dashboard`)
await page.getByText('Lesson plan').first().waitFor()
await page.screenshot({ path: `${SHOTS}/dashboard-mobile.png` })
const overflow = await page.evaluate(() => document.documentElement.scrollWidth > window.innerWidth)
check('no horizontal scroll on mobile dashboard', !overflow)

// --- Logout
await page.getByRole('button', { name: 'Log out' }).click()
await page.waitForURL('**/login')
await page.goto(`${BASE}/dashboard`)
await page.waitForURL('**/login')
check('logout ends session', true)

// --- Second user cannot open Alice's document
const ctxB = await browser.newContext()
const pageB = await ctxB.newPage()
await pageB.goto(`${BASE}/signup`)
await pageB.getByLabel('Name').fill('Bob')
await pageB.getByLabel('Email').fill(`bob${uid}@example.com`)
await pageB.getByLabel('Password').fill('password123')
await pageB.getByRole('button', { name: 'Create account' }).click()
await pageB.waitForURL('**/dashboard')
await pageB.goto(docUrl)
await pageB.getByText("Can't open this document").waitFor()
check("another user cannot open the document", true)

// --- Wrong password
await page.getByLabel('Email').fill(`alice${uid}@example.com`)
await page.getByLabel('Password').fill('wrong-password')
await page.getByRole('button', { name: 'Log in' }).click()
await page.getByText('Invalid email or password').waitFor()
check('wrong password shows error', true)

const unexpected = consoleErrors.filter((e) => !/Failed to load resource|ERR_FAILED|401|404/.test(e))
check('no unexpected console errors', unexpected.length === 0, unexpected.join(' | '))

await browser.close()
const failed = results.filter((r) => !r.ok).length
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
