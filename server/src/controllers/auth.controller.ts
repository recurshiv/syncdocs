import type { Response, RequestHandler } from 'express'
import { env } from '../config/env.js'
import { SESSION_COOKIE_NAME } from '../config/session.js'
import {
  authenticate,
  createSession,
  deleteSession,
  signup,
} from '../services/auth.service.js'

// Session cookie settings. HttpOnly keeps JavaScript from reading the token.
// SameSite=Lax blocks it on cross-site POST requests. Secure is enabled in
// production so it is only sent over HTTPS.
function setSessionCookie(res: Response, token: string, expiresAt: Date) {
  res.cookie(SESSION_COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
    path: '/',
    expires: expiresAt,
  })
}

export const signupController: RequestHandler = async (req, res) => {
  const user = await signup(req.body)
  const { token, expiresAt } = await createSession(user.id)

  setSessionCookie(res, token, expiresAt)
  res.status(201).json({ user })
}

export const loginController: RequestHandler = async (req, res) => {
  const user = await authenticate(req.body.email, req.body.password)
  const { token, expiresAt } = await createSession(user.id)

  setSessionCookie(res, token, expiresAt)
  res.json({ user })
}

export const logoutController: RequestHandler = async (req, res) => {
  const token: string | undefined = req.cookies[SESSION_COOKIE_NAME]
  if (token) {
    await deleteSession(token)
  }

  res.clearCookie(SESSION_COOKIE_NAME, { path: '/' })
  res.status(204).end()
}

export const meController: RequestHandler = (_req, res) => {
  res.json({ user: res.locals.user })
}
