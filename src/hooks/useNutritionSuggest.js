/**
 * Hook для вызова API подсказки КБЖУ
 * POST /api/ai/nutrition/suggest
 */

import { useState, useCallback } from 'react'

export function useNutritionSuggest() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [result, setResult] = useState(null)

  const suggest = useCallback(async (name, category = '', type = '', unit = 'г') => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const response = await fetch('/api/ai/nutrition/suggest', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          category,
          type,
          unit,
        }),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.message || `HTTP ${response.status}`)
      }

      const data = await response.json()
      setResult(data)
      return data
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error'
      setError(errorMessage)
      console.error('useNutritionSuggest error:', err)
      return null
    } finally {
      setLoading(false)
    }
  }, [])

  const reset = useCallback(() => {
    setLoading(false)
    setError(null)
    setResult(null)
  }, [])

  return {
    loading,
    error,
    result,
    suggest,
    reset,
  }
}
