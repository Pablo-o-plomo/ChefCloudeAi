import { useCallback, useEffect, useState } from 'react'

export const TTK_CATEGORIES_STORAGE_KEY = 'klevo_ttk_categories_v1'

// Стартовый набор — пользователь может менять состав свободно, это не жёсткий список.
const DEFAULT_CATEGORIES = [
  'Холодные блюда',
  'Горячие блюда',
  'Супы',
  'Салаты',
  'Десерты',
  'Напитки',
  'Соусы',
  'Гарниры',
]

function isBrowserStorageAvailable() {
  return typeof localStorage !== 'undefined'
}

function readCategories() {
  if (!isBrowserStorageAvailable()) return DEFAULT_CATEGORIES
  try {
    const raw = localStorage.getItem(TTK_CATEGORIES_STORAGE_KEY)
    if (!raw) return DEFAULT_CATEGORIES
    const parsed = JSON.parse(raw)
    return Array.isArray(parsed) && parsed.length > 0 ? parsed : DEFAULT_CATEGORIES
  } catch {
    return DEFAULT_CATEGORIES
  }
}

function writeCategories(categories) {
  if (!isBrowserStorageAvailable()) return
  localStorage.setItem(TTK_CATEGORIES_STORAGE_KEY, JSON.stringify(categories))
}

export function useTtkCategoriesStore() {
  const [categories, setCategories] = useState([])

  useEffect(() => {
    setCategories(readCategories())
  }, [])

  const persist = useCallback(updater => {
    setCategories(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCategories(next)
      return next
    })
  }, [])

  const addCategory = useCallback(name => {
    const clean = String(name || '').trim()
    if (!clean) return

    persist(current => {
      const exists = current.some(c => c.trim().toLowerCase() === clean.toLowerCase())
      return exists ? current : [...current, clean]
    })
  }, [persist])

  const removeCategory = useCallback(name => {
    persist(current => current.filter(c => c !== name))
  }, [persist])

  const renameCategory = useCallback((oldName, newName) => {
    const clean = String(newName || '').trim()
    if (!clean) return

    persist(current => current.map(c => c === oldName ? clean : c))
  }, [persist])

  return { categories, addCategory, removeCategory, renameCategory }
}
