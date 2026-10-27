import { z } from 'zod'

// Trim and lowercase before validating, so "  Ana@Mail.com " is accepted as "ana@mail.com".
const email = z.string().trim().toLowerCase().pipe(z.email('Enter a valid email address'))

export const signupSchema = z.object({
  name: z.string().trim().min(1, 'Name is required').max(100, 'Name is too long'),
  email,
  // bcrypt only uses the first 72 bytes of a password, so longer passwords are rejected.
  password: z
    .string()
    .min(8, 'Password must be at least 8 characters')
    .max(72, 'Password must be at most 72 characters'),
})

export const loginSchema = z.object({
  email,
  password: z.string().min(1, 'Password is required').max(72),
})
