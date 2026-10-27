import type { RequestHandler } from 'express'
import type { ZodType } from 'zod'
import { AppError } from '../services/errors.js'

// Checks req.body against a schema. On success, req.body is replaced with the
// parsed value, so later code only sees validated data.
export function validateBody(schema: ZodType): RequestHandler {
  return (req, _res, next) => {
    const result = schema.safeParse(req.body)
    if (!result.success) {
      next(new AppError(400, result.error.issues[0].message))
      return
    }
    req.body = result.data
    next()
  }
}
