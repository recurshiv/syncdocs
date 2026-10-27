import type { RequestHandler } from 'express'
import { SESSION_COOKIE_NAME } from '../config/session.js'
import { findUserBySessionToken } from '../services/auth.service.js'
import { AppError } from '../services/errors.js'

// Lets a route run only for a logged-in user. The user is stored in
// res.locals.user for the controller to read.
export const requireAuth: RequestHandler = async (req, res, next) => {
  const token: string | undefined = req.cookies[SESSION_COOKIE_NAME]
  const user = token ? await findUserBySessionToken(token) : null

  if (!user) {
    next(new AppError(401, 'Please log in'))
    return
  }

  res.locals.user = user
  next()
}
