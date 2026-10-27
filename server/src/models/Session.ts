import { Schema, Types, model } from 'mongoose'

// Only a hash of the session token is stored. If the database leaks,
// the stored values cannot be used as live session cookies.
const sessionSchema = new Schema({
  tokenHash: { type: String, required: true, unique: true },
  userId: { type: Types.ObjectId, ref: 'User', required: true, index: true },
  expiresAt: { type: Date, required: true },
})

// MongoDB deletes expired sessions automatically.
sessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 })

export const SessionModel = model('Session', sessionSchema)
