/**
 * Валидация input'ов для API endpoints
 */

export function validateNutritionInput(input = {}) {
  const errors = []

  // name (обязательно)
  if (!input.name || typeof input.name !== 'string' || input.name.trim().length === 0) {
    errors.push('name: required, must be non-empty string')
  } else if (input.name.length > 200) {
    errors.push('name: must be <= 200 characters')
  }

  // category (опционально, но если есть то string)
  if (input.category !== undefined && input.category !== null) {
    if (typeof input.category !== 'string' || input.category.length > 100) {
      errors.push('category: must be string <= 100 characters')
    }
  }

  // type (опционально)
  if (input.type !== undefined && input.type !== null) {
    if (typeof input.type !== 'string' || input.type.length > 50) {
      errors.push('type: must be string <= 50 characters')
    }
  }

  // unit (опционально)
  if (input.unit !== undefined && input.unit !== null) {
    if (typeof input.unit !== 'string' || input.unit.length > 20) {
      errors.push('unit: must be string <= 20 characters')
    }
  }

  return {
    valid: errors.length === 0,
    errors,
  }
}
