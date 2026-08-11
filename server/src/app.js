import express from 'express'
import cors from 'cors'
import itemsRouter from './routes/items.js'
import './db.js'

const app = express()
app.use(cors())
app.use(express.json())

app.use('/api/items', itemsRouter)

app.get('/api/health', (req, res) => res.json({ ok: true }))

const PORT = process.env.PORT || 4000
app.listen(PORT, () => {
  console.log(`API server running on http://localhost:${PORT}`)
})
