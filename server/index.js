/**
 * ChefCloud Backend Server
 * Middleware-based Express server for Vite + SPA frontend
 *
 * Production: Serves dist/ folder for React SPA
 * Development: API proxy, CORS enabled
 *
 * API key хранится в env переменных, НИКОГДА не в frontend
 * Все запросы валидируются и rate-limited
 */

import express from 'express'
import cors from 'cors'
import dotenv from 'dotenv'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

dotenv.config({ path: '.env.local' })

const app = express()

// Middleware
app.use(express.json({ limit: '10mb' }))
app.use(express.urlencoded({ limit: '10mb', extended: true }))

// CORS только для локальной разработки
// На Railway это не нужно (same-origin)
if (process.env.NODE_ENV !== 'production') {
  app.use(cors({ origin: 'http://localhost:5173' }))
}

// Логирование запросов (dev)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`[${new Date().toISOString()}] ${req.method} ${req.path}`)
    next()
  })
}

// Health check
app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() })
})

// Serve static frontend from dist/ (production)
const distPath = path.join(__dirname, '..', 'dist')
app.use(express.static(distPath))

// SPA fallback: все non-API requests идут на index.html
// Это позволяет React Router обрабатывать клиентские маршруты
app.get('*', (req, res) => {
  // Если это не /api/* и не известный статический файл, отправить index.html
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(distPath, 'index.html'))
  } else {
    res.status(404).json({ error: 'API endpoint not found' })
  }
})

// Error handler
app.use((err, req, res, next) => {
  console.error('Error:', err)
  res.status(500).json({
    error: 'Internal server error',
    message: process.env.NODE_ENV === 'production' ? undefined : err.message,
  })
})

export default app
