/**
 * Endpoint для подсказки КБЖУ
 * POST /api/ai/nutrition/suggest
 *
 * Input: { name, category, type, unit }
 * Output: { proteinPer100, fatPer100, carbsPer100, caloriesPer100, comment, confidence, notApplicable }
 *
 * Uses provider-agnostic AI layer (OpenAI or Anthropic)
 */

import express from 'express'
import { suggestNutrition } from '../services/nutritionService.js'
import { validateNutritionInput } from '../services/validation.js'

const router = express.Router()

// Rate limiting: простой in-memory счётчик для локальной разработки
const requestCounts = new Map()

function checkRateLimit(ip, limit = 10, windowMs = 60000) {
  const now = Date.now()
  const key = `${ip}:nutrition`

  if (!requestCounts.has(key)) {
    requestCounts.set(key, [])
  }

  const requests = requestCounts.get(key)
  const recentRequests = requests.filter(t => now - t < windowMs)

  if (recentRequests.length >= limit) {
    return false
  }

  recentRequests.push(now)
  requestCounts.set(key, recentRequests)
  return true
}

router.post('/ai/nutrition/suggest', async (req, res) => {
  try {
    // Rate limiting
    const ip = req.ip || req.connection.remoteAddress || 'unknown'
    if (!checkRateLimit(ip)) {
      return res.status(429).json({
        error: 'Too many requests',
        message: 'Максимум 10 запросов в минуту',
      })
    }

    // Валидация
    const { valid, errors } = validateNutritionInput(req.body)
    if (!valid) {
      return res.status(400).json({
        error: 'Invalid input',
        details: errors,
      })
    }

    const { name, category, type, unit } = req.body

    // Вызов AI
    const result = await suggestNutrition({
      name,
      category,
      type,
      unit,
    })

    if (!result.success) {
      return res.status(400).json({
        error: 'AI suggestion failed',
        message: result.message,
      })
    }

    res.json(result.data)
  } catch (error) {
    console.error('Error in /api/ai/nutrition/suggest:', error)
    res.status(500).json({
      error: 'Server error',
      message: process.env.NODE_ENV === 'production' ? undefined : error.message,
    })
  }
})

export default router
