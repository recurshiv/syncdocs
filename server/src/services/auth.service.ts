import bcrypt from 'bcryptjs'
import crypto from 'node:crypto'
import { UserModel } from '../models/User.js'
import { SessionModel } from '../models/Session.js'
import { SESSION_TTL_MS } from '../config/session.js'
import { AppError } from './errors.js'

// The user object we are willing to send to the browser.
// passwordHash is never included.
export interface PublicUser {
  id: string
  name: string
  email: string
}

// Used when the email is unknown, so login takes about as long whether or not
// the account exists. Without this, response timing reveals registered emails.
const DUMMY_HASH = bcrypt.hashSync('not-a-real-password', 12)

// Only the hash of a session token is stored. A leaked database cannot be used
// to hijack sessions, because the cookie holds the raw token.
function hashToken(token: string) {
  return crypto.createHash('sha256').update(token).digest('hex')
}

function toPublicUser(user: { _id: { toString(): string }; name: string; email: string }): PublicUser {
  return { id: user._id.toString(), name: user.name, email: user.email }
}

function isDuplicateKeyError(err: unknown) {
  return typeof err === 'object' && err !== null && 'code' in err && err.code === 11000
}

export async function signup(input: { name: string; email: string; password: string }) {
  const passwordHash = await bcrypt.hash(input.password, 12)

  try {
    const user = await UserModel.create({
      name: input.name,
      email: input.email,
      passwordHash,
    })
    return toPublicUser(user)
  } catch (err) {
    // The unique index on email is the real guarantee against duplicates.
    // Checking with findOne first would still allow a race between two requests.
    if (isDuplicateKeyError(err)) {
      throw new AppError(409, 'An account with this email already exists')
    }
    throw err
  }
}

export async function authenticate(email: string, password: string) {
  const user = await UserModel.findOne({ email }).select('+passwordHash')

  const passwordMatches = await bcrypt.compare(password, user?.passwordHash ?? DUMMY_HASH)

  // Same message for both failures, so the response does not reveal which part was wrong.
  if (!user || !passwordMatches) {
    throw new AppError(401, 'Invalid email or password')
  }

  return toPublicUser(user)
}

export async function createSession(userId: string) {
  const token = crypto.randomBytes(32).toString('base64url')
  const expiresAt = new Date(Date.now() + SESSION_TTL_MS)

  await SessionModel.create({ tokenHash: hashToken(token), userId, expiresAt })

  return { token, expiresAt }
}

export async function findUserBySessionToken(token: string) {
  const session = await SessionModel.findOne({
    tokenHash: hashToken(token),
    expiresAt: { $gt: new Date() },
  })
  if (!session) return null

  const user = await UserModel.findById(session.userId)
  return user ? toPublicUser(user) : null
}

export async function deleteSession(token: string) {
  await SessionModel.deleteOne({ tokenHash: hashToken(token) })
}
