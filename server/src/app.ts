import express from 'express'
import cookieParser from 'cookie-parser'
import { fileURLToPath } from 'node:url'
import { env } from './config/env.js'
import { authRouter } from './routes/auth.routes.js'
import { documentRouter } from './routes/document.routes.js'
import { requireSameOrigin } from './middleware/requireSameOrigin.js'
import { AppError } from './services/errors.js'

export const app = express()

if (env.NODE_ENV === 'production') {
  // Hosting platforms put a proxy in front of the app. Trusting one hop makes
  // req.ip the real client IP, which the login rate limiter depends on.
  app.set('trust proxy', 1)
}

app.use(express.json({ limit: '1mb' }))
app.use(cookieParser())

// CSRF defense for cookie-authenticated requests (see middleware file).
app.use('/api', requireSameOrigin)

// Health check: confirms the API process is running.
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' })
})

app.use('/api/auth', authRouter)
app.use('/api/documents', documentRouter)

// Unknown API routes get a JSON 404 instead of an HTML page.
app.use('/api', (_req, res) => {
  res.status(404).json({ error: 'Not found' })
})

if (env.NODE_ENV === 'production') {
  // In production, this server also serves the built React app, so the page
  // and the API share one origin (simple cookies, no CORS).
  const clientDist = fileURLToPath(new URL('../../client/dist', import.meta.url))
  app.use(express.static(clientDist))

  // Any other GET is a React Router route such as /document/123: send index.html
  // and let the client-side router render it.
  app.get('/{*path}', (_req, res) => {
    res.sendFile('index.html', { root: clientDist })
  })
}

// Central error handler. Never leak stack traces or database details to clients.
app.use(
  (
    err: unknown,
    _req: express.Request,
    res: express.Response,
    _next: express.NextFunction,
  ) => {
    if (err instanceof AppError) {
      res.status(err.status).json({ error: err.message })
      return
    }

    // express.json() throws a SyntaxError for malformed request bodies.
    if (err instanceof SyntaxError && 'body' in err) {
      res.status(400).json({ error: 'Invalid JSON' })
      return
    }

    // Payloads over the 1mb limit.
    if (typeof err === 'object' && err !== null && 'type' in err && err.type === 'entity.too.large') {
      res.status(413).json({ error: 'Document is too large' })
      return
    }

    console.error(err)
    res.status(500).json({ error: 'Something went wrong' })
  },
)
