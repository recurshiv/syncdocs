import mongoose from 'mongoose'
import { env } from './config/env.js'
import { app } from './app.js'

async function start() {
  await mongoose.connect(env.MONGODB_URI)
  console.log('Connected to MongoDB')

  app.listen(env.PORT, () => {
    console.log(`API listening on http://localhost:${env.PORT}`)
  })
}

start().catch((err) => {
  console.error('Failed to start server:', err)
  process.exit(1)
})
