/**
 * Модуль расчётов питательной ценности товаров
 * ФАЗА 1.5: Интеграция с AI будет добавлена позже
 */

/**
 * Рассчитывает питательную ценность продукта для конкретного количества
 * @param {number} qty - Количество (в граммах или единицах)
 * @param {object} product - Товар с полями proteinPer100, fatPer100, carbsPer100, caloriesPer100
 * @returns {object} { protein, fat, carbs, calories } - Рассчитанные значения
 */
export function calculateProductNutrition(qty, product) {
  if (!product) return { protein: 0, fat: 0, carbs: 0, calories: 0 }

  const factor = qty / 100
  return {
    protein: (product.proteinPer100 || 0) * factor,
    fat: (product.fatPer100 || 0) * factor,
    carbs: (product.carbsPer100 || 0) * factor,
    calories: (product.caloriesPer100 || 0) * factor,
  }
}

/**
 * Placeholder для AI-подсказки КБЖУ по названию продукта
 * РЕАЛИЗАЦИЯ: Фаза 1.5
 * @param {string} productName - Название товара
 * @returns {Promise<object>} { success, data, error, message }
 */
export async function suggestNutrition(productName) {
  // TODO: Интегрировать с API (Claude, USDA, или другой источник)
  return {
    success: false,
    message: 'Функция будет доступна в следующем обновлении',
  }
}
