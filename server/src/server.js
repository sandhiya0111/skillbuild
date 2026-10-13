import 'dotenv/config'
import http from 'http'
import express from 'express'
import cors from 'cors'
import helmet from 'helmet'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'
import { Server as SocketServer } from 'socket.io'
import rateLimit from 'express-rate-limit'
import authRoutes from './routes/auth.js'
import requestRoutes from './routes/requests.js'
import organizationRoutes from './routes/organizations.js'
import dashboardRoutes from './routes/dashboard.js'
import adminRoutes from './routes/admin.js'
import publicRoutes from './routes/public.js'
import { notFound, errorHandler } from './middleware/errors.js'

if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
  console.error('JWT_SECRET must be configured with at least 32 characters in server/.env')
  process.exit(1)
}
const app = express()
const server = http.createServer(app)
const allowedOrigins = (process.env.CLIENT_URL || 'http://localhost:5173').split(',').map(s => s.trim())
const io = new SocketServer(server, { cors: { origin: allowedOrigins, methods: ['GET', 'POST', 'PATCH'] } })
app.set('io', io)
app.use(helmet())
app.use(cors({ origin: allowedOrigins }))
app.use(express.json({ limit: '30kb' }))
app.use('/api/auth', rateLimit({ windowMs: 15 * 60 * 1000, limit: 60, standardHeaders: 'draft-7', legacyHeaders: false }))
app.get('/api/health', (_req, res) => res.json({ status: 'ok', database: mongoose.connection.readyState === 1 ? 'connected' : 'not connected' }))
app.use('/api/auth', authRoutes)
app.use('/api/requests', requestRoutes)
app.use('/api/organizations', organizationRoutes)
app.use('/api/dashboard', dashboardRoutes)
app.use('/api/admin', adminRoutes)
app.use('/api/public', publicRoutes)
app.use(notFound)
app.use(errorHandler)
io.on('connection', socket => { socket.emit('connection:ready', { connected: true }) })
const PORT = Number(process.env.PORT || 5000)
let memoryServer = null

async function start() {
  const defaultLocalUri = 'mongodb://127.0.0.1:27017/sahaaya_community_support'
  const mongoUri = process.env.MONGODB_URI || defaultLocalUri

  try {
    await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 5000 })
    console.log('Connected to MongoDB')
  } catch (error) {
    const shouldUseMemoryDb = !process.env.MONGODB_URI || mongoUri === defaultLocalUri

    if (!shouldUseMemoryDb) {
      console.error('Could not connect to MongoDB:', error.message)
      console.error('Start MongoDB or set a valid MONGODB_URI in server/.env.')
      process.exit(1)
    }

    console.warn('MongoDB not available, starting an in-memory MongoDB instance for local development...')
    memoryServer = await MongoMemoryServer.create()
    const memoryUri = memoryServer.getUri()
    await mongoose.connect(memoryUri, { serverSelectionTimeoutMS: 10000 })
    console.log(`Connected to temporary MongoDB Memory Server at ${memoryUri}`)
  }

  server.listen(PORT, () => console.log(`Sahaaya API and Socket.IO listening on http://localhost:${PORT}`))
}
start()
process.on('SIGINT', async () => {
  await mongoose.disconnect()
  if (memoryServer) await memoryServer.stop()
  server.close(() => process.exit(0))
})
