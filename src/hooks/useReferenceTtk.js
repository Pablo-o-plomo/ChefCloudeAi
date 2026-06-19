import { useCallback, useEffect, useState } from 'react'

const STORAGE_KEY = 'academy_printable_reference_ttk_v1'
const LEGACY_STORAGE_KEY = 'academy_reference_ttk_v1'

// Допустимые статусы карточки ТТК.
export const TTK_STATUSES = ['draft', 'review', 'approved']

const EMPTY_ROW = { qty: '', unit: '', name: '', type: 'product', description: '' }

function isBrowserStorageAvailable() {
  return typeof localStorage !== 'undefined'
}

function parseItems(raw) {
  try {
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed.map(normalizeReferenceTtk) : []
  } catch {
    return []
  }
}

function readItems() {
  if (!isBrowserStorageAvailable()) return []
  const current = localStorage.getItem(STORAGE_KEY)
  if (current) return parseItems(current)

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) return parseItems(legacy)

  return []
}

function writeItems(items) {
  if (!isBrowserStorageAvailable()) return
  localStorage.setItem(STORAGE_KEY, JSON.stringify(items))
}

export function makeReferenceTtkId() {
  return `ttk_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

export function createEmptyReferenceTtk() {
  const now = new Date().toISOString()
  return {
    id: makeReferenceTtkId(),
    title: '',
    category: '',
    output: '',
    assemblyTime: '',
    plate: '',
    dishDescription: '',
    rows: [{ ...EMPTY_ROW }],
    technology: '',
    serving: '',
    qualityPoints: '',
    chefComment: '',
    photo: null,
    status: 'draft',
    archived: false,
    createdAt: now,
    updatedAt: now,
  }
}

// Пытается отделить число от единицы измерения в старой строке вида "80 г" / "1.5 кг".
// Если распознать не удалось — всё количество остаётся в qty, unit пустой (ничего не теряем).
function splitQtyUnit(raw) {
  const value = String(raw || '').trim()
  if (!value) return { qty: '', unit: '' }

  const match = value.match(/^([\d.,]+)\s*([^\d.,\s]*)$/)
  if (match) {
    return { qty: match[1].replace(',', '.'), unit: match[2] || '' }
  }

  return { qty: value, unit: '' }
}

function normalizeRows(item) {
  if (Array.isArray(item?.rows)) {
    return item.rows.map(row => {
      // Новый формат уже содержит unit отдельно — не трогаем.
      if (row.unit !== undefined) {
        return {
          qty: row.qty || '',
          unit: row.unit || '',
          name: row.name || '',
          type: row.type || (row.semifinished ? 'semifinished' : 'product'),
          description: row.description || '',
        }
      }

      // Старый формат: qty содержит число+единицу слитно, semifinished использовался как заметка/единица.
      const { qty, unit } = splitQtyUnit(row.qty)
      return {
        qty,
        unit: unit || row.semifinished || '',
        name: row.name || '',
        type: row.type || (row.semifinished ? 'semifinished' : 'product'),
        description: row.description || '',
      }
    })
  }

  if (Array.isArray(item?.ingredients) && item.ingredients.length > 0) {
    return item.ingredients.map(row => ({
      qty: row.portionNetto || row.netto || row.brutto || '',
      unit: row.unit || '',
      name: row.name || '',
      type: row.type || 'product',
      description: row.comment || '',
    }))
  }

  if (Array.isArray(item?.semifinished) && item.semifinished.length > 0) {
    return item.semifinished.map(row => ({
      qty: row.quantity || '',
      unit: row.unit || '',
      name: row.name || '',
      type: 'semifinished',
      description: row.comment || '',
    }))
  }

  return [{ ...EMPTY_ROW }]
}

function normalizeStatus(status) {
  if (TTK_STATUSES.includes(status)) return status
  return 'draft'
}

export function normalizeReferenceTtk(item = {}) {
  const now = new Date().toISOString()
  return {
    id: item.id || makeReferenceTtkId(),
    title: item.title || item.name || '',
    category: item.category || '',
    output: item.output || '',
    assemblyTime: item.assemblyTime || item.time || '',
    plate: item.plate || item.dishware || '',
    dishDescription: item.dishDescription || item.menuDescription || item.descriptionText || '',
    rows: normalizeRows(item),
    technology: item.technology || item.cookingMethod || item.description || '',
    serving: item.serving || item.presentation || '',
    qualityPoints: item.qualityPoints || item.standard || item.qualityStandard || '',
    chefComment: item.chefComment || '',
    photo: item.photo || item.photos?.main || null,
    status: normalizeStatus(item.status),
    archived: Boolean(item.archived),
    createdAt: item.createdAt || now,
    updatedAt: item.updatedAt || now,
  }
}

export function useReferenceTtkStore() {
  const [items, setItems] = useState([])

  useEffect(() => {
    setItems(readItems())
  }, [])

  const persist = useCallback(updater => {
    setItems(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeItems(next)
      return next
    })
  }, [])

  const saveTtk = useCallback(ttk => {
    const now = new Date().toISOString()
    const normalized = normalizeReferenceTtk(ttk)
    const clean = {
      ...normalized,
      updatedAt: now,
      rows: normalized.rows.filter(row => row.qty || row.name || row.unit || row.description),
    }

    if (clean.rows.length === 0) clean.rows = [{ ...EMPTY_ROW }]

    persist(current => {
      const exists = current.some(item => item.id === clean.id)
      return exists
        ? current.map(item => item.id === clean.id ? clean : item)
        : [{ ...clean, createdAt: clean.createdAt || now }, ...current]
    })

    return clean
  }, [persist])

  const deleteTtk = useCallback(id => {
    persist(current => current.filter(item => item.id !== id))
  }, [persist])

  const duplicateTtk = useCallback(id => {
    const source = readItems().find(item => item.id === id)
    if (!source) return null

    const now = new Date().toISOString()
    const copy = {
      ...source,
      id: makeReferenceTtkId(),
      title: `${source.title || 'ТТК'} — копия`,
      status: 'draft',
      archived: false,
      createdAt: now,
      updatedAt: now,
    }

    persist(current => [copy, ...current])
    return copy
  }, [persist])

  // Архивирование — мягкое: карточка остаётся в хранилище, просто помечается archived=true
  // и не показывается в основном списке. Данные никогда не удаляются.
  const archiveTtk = useCallback(id => {
    const now = new Date().toISOString()
    persist(current => current.map(item =>
      item.id === id ? { ...item, archived: true, updatedAt: now } : item
    ))
  }, [persist])

  const restoreTtk = useCallback(id => {
    const now = new Date().toISOString()
    persist(current => current.map(item =>
      item.id === id ? { ...item, archived: false, updatedAt: now } : item
    ))
  }, [persist])

  // Полный экспорт всех карточек одним файлом — для резервной копии и переноса между браузерами/устройствами.
  const exportAll = useCallback(() => {
    return readItems()
  }, [])

  // Импорт массива карточек. По умолчанию объединяет с текущими по id (обновляет совпадающие, добавляет новые).
  // Существующие карточки, отсутствующие в импортируемом файле, не удаляются.
  const importAll = useCallback(importedItems => {
    if (!Array.isArray(importedItems)) return 0

    const normalized = importedItems.map(normalizeReferenceTtk)

    persist(current => {
      const byId = new Map(current.map(item => [item.id, item]))
      normalized.forEach(item => byId.set(item.id, item))
      return Array.from(byId.values())
    })

    return normalized.length
  }, [persist])

  return {
    items,
    saveTtk,
    deleteTtk,
    duplicateTtk,
    archiveTtk,
    restoreTtk,
    exportAll,
    importAll,
  }
}
