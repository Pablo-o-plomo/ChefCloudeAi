/**
 * Интеграция с Claude API (Anthropic)
 *
 * API key берётся только из env переменной ANTHROPIC_API_KEY
 * НИКОГДА не из frontend
 */

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY
const ANTHROPIC_MODEL = 'claude-3-5-sonnet-20241022'
const ANTHROPIC_API_URL = 'https://api.anthropic.com/v1/messages'

/**
 * Запрашивает подсказку по КБЖУ у Claude
 * @param {object} input - { name, category, type, unit }
 * @returns {Promise<object>} { success, data, message }
 */
export async function suggestNutrition(input) {
  if (!ANTHROPIC_API_KEY) {
    return {
      success: false,
      message: 'ANTHROPIC_API_KEY not configured',
    }
  }

  try {
    // Построение prompt'а
    const prompt = buildNutritionPrompt(input)

    // Вызов Claude API
    const response = await fetch(ANTHROPIC_API_URL, {
      method: 'POST',
      headers: {
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
        'content-type': 'application/json',
      },
      body: JSON.stringify({
        model: ANTHROPIC_MODEL,
        max_tokens: 500,
        messages: [
          {
            role: 'user',
            content: prompt,
          },
        ],
      }),
    })

    if (!response.ok) {
      const errorData = await response.json()
      console.error('Claude API error:', errorData)
      return {
        success: false,
        message: `Claude API error: ${response.status}`,
      }
    }

    const data = await response.json()
    const responseText = data.content[0].text

    // Парсим ответ
    const parsed = parseNutritionResponse(responseText)

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
 * Построение prompt'а для Claude
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
 * Парсинг ответа от Claude
 */
function parseNutritionResponse(text) {
  try {
    // Попытка найти JSON в тексте
    const jsonMatch = text.match(/\{[\s\S]*\}/)
    if (!jsonMatch) {
      throw new Error('No JSON found in response')
    }

    const parsed = JSON.parse(jsonMatch[0])

    // Если продукт не пищевой
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

    // Валидация чисел
    const result = {
      proteinPer100: parseFloat(parsed.proteinPer100) || 0,
      fatPer100: parseFloat(parsed.fatPer100) || 0,
      carbsPer100: parseFloat(parsed.carbsPer100) || 0,
      caloriesPer100: parseFloat(parsed.caloriesPer100) || 0,
      comment: (parsed.comment || '').substring(0, 500),
      confidence: Math.min(Math.max(parseFloat(parsed.confidence) || 0.5, 0), 1),
      notApplicable: false,
    }

    // Санитизация отрицательных значений
    if (result.proteinPer100 < 0) result.proteinPer100 = 0
    if (result.fatPer100 < 0) result.fatPer100 = 0
    if (result.carbsPer100 < 0) result.carbsPer100 = 0
    if (result.caloriesPer100 < 0) result.caloriesPer100 = 0

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
