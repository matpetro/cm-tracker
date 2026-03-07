const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
require('dotenv').config()

const stateRouter       = require('./routes/state')
const teamsRouter       = require('./routes/teams')
const playerOwnersRouter = require('./routes/playerOwners')
const rulesRouter       = require('./routes/rules')

const app = express()
const PORT = process.env.PORT || 3001

// ─── Middleware ──────────────────────────────────────────────────────────────

app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'],
}))
app.use(express.json())

// ─── Routes ──────────────────────────────────────────────────────────────────

app.get('/health', (_req, res) => res.json({ status: 'ok' }))
app.use('/api/state',         stateRouter)
app.use('/api/teams',         teamsRouter)
app.use('/api/player-owners', playerOwnersRouter)
app.use('/api/rules',         rulesRouter)

// ─── 404 & Error handlers ────────────────────────────────────────────────────

app.use((_req, res) => res.status(404).json({ error: 'Not found' }))

app.use((err, _req, res, _next) => {
  console.error(err)
  res.status(500).json({ error: 'Internal server error' })
})

// ─── DB + Start ──────────────────────────────────────────────────────────────

const MONGO_URI = process.env.MONGO_URI
if (!MONGO_URI) {
  console.error('ERROR: MONGO_URI is not set in environment variables.')
  process.exit(1)
}

mongoose
  .connect(MONGO_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas')
    app.listen(PORT, () => console.log(`Server running on port ${PORT}`))
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })
