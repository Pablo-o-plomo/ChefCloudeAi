// useCollections.js — хранение пользовательских коллекций блюд.
//
// Архитектура:
// - Коллекции хранятся ОТДЕЛЬНО от блюд (ключ chefcloud_collections_v1).
// - Каждая коллекция содержит список id блюд (dishIds).
// - Одно блюдо может входить в неограниченное число коллекций.
// - Системные коллекции (favorites, cookbook) создаются автоматически,
//   но их данные хранятся так же, как пользовательских коллекций.
// - Ключи ТТК (academy_printable_reference_ttk_v1 и др.) не трогаются.

import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'chefcloud_collections_v1'

export const SYSTEM_COLLECTION_IDS = {
  FAVORITES: '__favorites__',
  COOKBOOK:  '__cookbook__',
}

const DEFAULT_COLLECTIONS = [
  {
    id:          SYSTEM_COLLECTION_IDS.FAVORITES,
    name:        'Избранное',
    description: 'Лучшие блюда',
    color:       '#b99150',
    icon:        'star',
    system:      true,
    dishIds:     [],
    createdAt:   new Date().toISOString(),
  },
  {
    id:          SYSTEM_COLLECTION_IDS.COOKBOOK,
    name:        'Кулинарная книга',
    description: 'Авторская коллекция для будущей вёрстки книги ресторана',
    color:       '#16332b',
    icon:        'book',
    system:      true,
    dishIds:     [],
    createdAt:   new Date().toISOString(),
  },
]

function readCollections() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return DEFAULT_COLLECTIONS
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed) || parsed.length === 0) return DEFAULT_COLLECTIONS

    // Убедимся что системные коллекции всегда присутствуют
    const byId = new Map(parsed.map(c => [c.id, c]))
    DEFAULT_COLLECTIONS.forEach(def => {
      if (!byId.has(def.id)) byId.set(def.id, def)
    })
    return Array.from(byId.values())
  } catch {
    return DEFAULT_COLLECTIONS
  }
}

function writeCollections(collections) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(collections))
  } catch { /* переполнение localStorage — некритично */ }
}

export function makeCollectionId() {
  return `col_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`
}

export function useCollectionsStore() {
  const [collections, setCollections] = useState([])

  useEffect(() => {
    setCollections(readCollections())
  }, [])

  const persist = useCallback(updater => {
    setCollections(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeCollections(next)
      return next
    })
  }, [])

  // Создать новую коллекцию
  const createCollection = useCallback(({ name, description = '', color = '#16332b', icon = 'folder' }) => {
    const col = {
      id:          makeCollectionId(),
      name:        name.trim(),
      description: description.trim(),
      color,
      icon,
      system:      false,
      dishIds:     [],
      createdAt:   new Date().toISOString(),
    }
    persist(current => [...current, col])
    return col
  }, [persist])

  // Переименовать / изменить коллекцию
  const updateCollection = useCallback((id, patch) => {
    persist(current => current.map(c => c.id === id ? { ...c, ...patch } : c))
  }, [persist])

  // Удалить коллекцию (системные не удаляются)
  const deleteCollection = useCallback(id => {
    persist(current => current.filter(c => c.id === id ? !c.system : true))
  }, [persist])

  // Добавить блюдо в коллекцию
  const addDishToCollection = useCallback((collectionId, dishId) => {
    persist(current => current.map(c =>
      c.id === collectionId && !c.dishIds.includes(dishId)
        ? { ...c, dishIds: [...c.dishIds, dishId] }
        : c
    ))
  }, [persist])

  // Убрать блюдо из коллекции
  const removeDishFromCollection = useCallback((collectionId, dishId) => {
    persist(current => current.map(c =>
      c.id === collectionId
        ? { ...c, dishIds: c.dishIds.filter(id => id !== dishId) }
        : c
    ))
  }, [persist])

  // Добавить блюдо в несколько коллекций сразу
  const addDishToCollections = useCallback((collectionIds, dishId) => {
    persist(current => current.map(c =>
      collectionIds.includes(c.id) && !c.dishIds.includes(dishId)
        ? { ...c, dishIds: [...c.dishIds, dishId] }
        : c
    ))
  }, [persist])

  // Переключить избранное
  const toggleFavorite = useCallback(dishId => {
    persist(current => current.map(c => {
      if (c.id !== SYSTEM_COLLECTION_IDS.FAVORITES) return c
      const inFav = c.dishIds.includes(dishId)
      return { ...c, dishIds: inFav ? c.dishIds.filter(id => id !== dishId) : [...c.dishIds, dishId] }
    }))
  }, [persist])

  // Получить коллекции, в которых есть блюдо
  const getCollectionsForDish = useCallback(dishId => {
    return collections.filter(c => c.dishIds.includes(dishId))
  }, [collections])

  // Является ли блюдо избранным
  const isFavorite = useCallback(dishId => {
    const fav = collections.find(c => c.id === SYSTEM_COLLECTION_IDS.FAVORITES)
    return fav ? fav.dishIds.includes(dishId) : false
  }, [collections])

  // Создать коллекцию из массива dishIds (для результата AI)
  const createCollectionFromDishes = useCallback(({ name, description = '', color = '#16332b', dishIds = [] }) => {
    const col = {
      id:          makeCollectionId(),
      name:        name.trim(),
      description: description.trim(),
      color,
      icon:        'sparkle',
      system:      false,
      dishIds:     [...new Set(dishIds)],
      createdAt:   new Date().toISOString(),
    }
    persist(current => [col, ...current])
    return col
  }, [persist])

  const userCollections  = collections.filter(c => !c.system)
  const systemCollections = collections.filter(c => c.system)

  return {
    collections,
    userCollections,
    systemCollections,
    createCollection,
    updateCollection,
    deleteCollection,
    addDishToCollection,
    addDishToCollections,
    removeDishFromCollection,
    toggleFavorite,
    getCollectionsForDish,
    isFavorite,
    createCollectionFromDishes,
  }
}
