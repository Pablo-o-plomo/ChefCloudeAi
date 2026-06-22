/**
 * Nutrition suggestion service
 * Uses provider-agnostic AIProvider (OpenAI or Anthropic)
 *
 * No knowledge of specific AI provider - all logic abstracted through AIProvider interface
 */

import { AIProviderFactory } from '../ai/AIProviderFactory.js'

/**
 * Request nutrition suggestion from AI
 * @param {object} input - { name, category, type, unit }
 * @returns {Promise<object>} - { proteinPer100, fatPer100, carbsPer100, caloriesPer100, comment, confidence, notApplicable }
 */
export async function suggestNutrition(input) {
  const { name, category, type, unit } = input

  try {
    // Get AI provider (abstracted - could be OpenAI or Anthropic)
    const aiProvider = AIProviderFactory.createFromEnv()

    // Build prompt
    const prompt = buildNutritionPrompt({ name, category, type, unit })

    // Call AI through provider-agnostic interface
    const response = await aiProvider.generateText(prompt, {
      temperature: 0.3, // Lower temperature for more consistent nutrition data
      maxTokens: 500,
    })

    // Parse response
    const parsed = parseNutritionResponse(response)

    return {
      success: true,
      data: parsed,
    }
  } catch (error) {
    console.error('suggestNutrition error:', error)
    return {
      success: false,
      message: error.message,
    }
  }
}

/**
 * Build prompt for nutrition suggestion
 * @private
 */
function buildNutritionPrompt(input) {
  const { name, category, type, unit } = input

  const typeInfo = type ? ` Тип: ${type}.` : ''
  const categoryInfo = category ? ` Категория: ${category}.` : ''
  const unitInfo = unit ? ` Единица измерения: ${unit}.` : ''

  return `Ты - эксперт по питанию продуктов. Определи КБЖУ (калории, белки, жиры, углеводы) для следующего продукта.

Продукт: "${name}".${typeInfo}${categoryInfo}${unitInfo}

Верни ТОЛЬКО JSON без markdown-кода и без пояснений. JSON должен быть валидным.

Если продукт НЕ пищевой (упаковка, хозтовар, инвентарь) - верни: {"notApplicable": true}

Если неуверен - всё равно верни значения с честной confidence.

JSON формат:
{
  "proteinPer100": число (граммы на 100г),
  "fatPer100": число,
  "carbsPer100": число,
  "caloriesPer100": число,
  "comment": "краткий комментарий",
  "confidence": число 0-1 (уровень уверенности),
  "notApplicable": false
}

Ответ:`
}

/**
 * Parse AI response into structured data
 * @private
 */
function parseNutritionResponse(text) {
  try {
    // Find JSON in response
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Handle non-applicable products
    if (parsed.notApplicable === true) {
      return {
        proteinPer100: 0,
        fatPer100: 0,
        carbsPer100: 0,
        caloriesPer100: 0,
        comment: 'Продукт не пищевой',
        confidence: 1,
        notApplicable: true,
      }
    }

    // Validate and normalize numbers
    const result = {
      proteinPer100: Math.max(0, parseFloat(parsed.proteinPer100) || 0),
      fatPer100: Math.max(0, parseFloat(parsed.fatPer100) || 0),
      carbsPer100: Math.max(0, parseFloat(parsed.carbsPer100) || 0),
      caloriesPer100: Math.max(0, parseFloat(parsed.caloriesPer100) || 0),
      comment: (parsed.comment || '').substring(0, 500),
      confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
      notApplicable: false,
    }

    return result
  } catch (error) {
    console.error('Failed to parse nutrition response:', error, text)
    return {
      proteinPer100: 0,
      fatPer100: 0,
      carbsPer100: 0,
      caloriesPer100: 0,
      comment: 'Ошибка при обработке ответа',
      confidence: 0,
      notApplicable: false,
    }
  }
}
