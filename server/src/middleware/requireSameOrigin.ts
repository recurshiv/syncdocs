import type { RequestHandler } from 'express'
import { AppError } from '../services/errors.js'

// CSRF defense. A malicious site can make the browser send a POST to our API
// with the session cookie attached. Browsers send an Origin header on such
// requests, so we allow state-changing requests only when Origin matches the
// host we are serving. The SameSite=Lax cookie is a second layer of defense.
const UNSAFE_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE'])

export const requireSameOrigin: RequestHandler = (req, _res, next) => {
  if (!UNSAFE_METHODS.has(req.method)) {
    next()
    return
  }

  const origin = req.get('origin')
  // In development, Vite's proxy must keep the browser's Host header
  // (changeOrigin: false in vite.config.ts) for this comparison to work.
  if (!origin || new URL(origin).host !== req.get('host')) {
    next(new AppError(403, 'Cross-origin request blocked'))
    return
  }

  next()
}
