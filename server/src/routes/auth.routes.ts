import { Router } from 'express'
import rateLimit from 'express-rate-limit'
import {
  loginController,
  logoutController,
  meController,
  signupController,
} from '../controllers/auth.controller.js'
import { requireAuth } from '../middleware/requireAuth.js'
import { validateBody } from '../middleware/validate.js'
import { loginSchema, signupSchema } from '../validation/auth.schemas.js'

export const authRouter = Router()

// Limits password guessing: at most 10 login attempts per IP every 15 minutes.
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  limit: 10,
  standardHeaders: 'draft-7',
  legacyHeaders: false,
  message: { error: 'Too many login attempts. Try again in 15 minutes.' },
})

authRouter.post('/signup', validateBody(signupSchema), signupController)
authRouter.post('/login', loginLimiter, validateBody(loginSchema), loginController)
authRouter.post('/logout', logoutController)
authRouter.get('/me', requireAuth, meController)
