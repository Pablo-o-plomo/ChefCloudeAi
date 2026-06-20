import { useCallback, useEffect, useState } from 'react'
import { supabase } from '../lib/supabaseClient'

const STORAGE_KEY = 'academy_printable_reference_ttk_v1'
const LEGACY_STORAGE_KEY = 'academy_reference_ttk_v1'
const MIGRATED_KEY = 'academy_printable_reference_ttk_migrated_v1'
const TABLE_NAME = 'reference_ttk'
const PHOTO_BUCKET = 'reference-ttk-photos'

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

function readLegacyItems() {
  if (!isBrowserStorageAvailable()) return []

  const current = localStorage.getItem(STORAGE_KEY)
  if (current) return parseItems(current)

  const legacy = localStorage.getItem(LEGACY_STORAGE_KEY)
  if (legacy) return parseItems(legacy)

  return []
}

function persistLocalCache(itemsToSave) {
  if (!isBrowserStorageAvailable()) return
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(itemsToSave))
  } catch (err) {
    console.warn('Не удалось сохранить кэш ТТК в localStorage:', err)
  }
}

function markMigrated() {
  if (!isBrowserStorageAvailable()) return
  localStorage.setItem(MIGRATED_KEY, 'true')
}

function wasMigrated() {
  if (!isBrowserStorageAvailable()) return true
  return localStorage.getItem(MIGRATED_KEY) === 'true'
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
      if (row.unit !== undefined) {
        return {
          qty: row.qty || '',
          unit: row.unit || '',
          name: row.name || '',
          type: row.type || (row.semifinished ? 'semifinished' : 'product'),
          description: row.description || '',
        }
      }

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

function dataUrlToFile(dataUrl, fileName) {
  const [meta, base64] = dataUrl.split(',')
  const mime = meta.match(/data:(.*?);base64/)?.[1] || 'image/jpeg'
  const binary = atob(base64)
  const bytes = new Uint8Array(binary.length)

  for (let i = 0; i < binary.length; i += 1) {
    bytes[i] = binary.charCodeAt(i)
  }

  return new File([bytes], fileName, { type: mime })
}

function getPhotoDataUrl(ttk) {
  if (typeof ttk?.photo === 'string' && ttk.photo.startsWith('data:image')) return ttk.photo
  if (ttk?.photo?.dataUrl?.startsWith?.('data:image')) return ttk.photo.dataUrl
  if (ttk?.image?.startsWith?.('data:image')) return ttk.image
  return null
}

async function uploadPhotoIfNeeded(ttk) {
  if (!supabase) return ttk

  const dataUrl = getPhotoDataUrl(ttk)
  if (!dataUrl) return ttk

  try {
    const ext = dataUrl.includes('image/png') ? 'png' : 'jpg'
    const path = `${ttk.id}/${Date.now()}.${ext}`
    const file = dataUrlToFile(dataUrl, path)

    const { error } = await supabase.storage
      .from(PHOTO_BUCKET)
      .upload(path, file, {
        cacheControl: '3600',
        upsert: true,
        contentType: file.type,
      })

    if (error) throw error

    const { data } = supabase.storage
      .from(PHOTO_BUCKET)
      .getPublicUrl(path)

    const publicUrl = data?.publicUrl

    if (!publicUrl) return ttk

    return {
      ...ttk,
      imageUrl: publicUrl,
      photoUrl: publicUrl,
      photo: {
        ...(typeof ttk.photo === 'object' && ttk.photo ? ttk.photo : {}),
        url: publicUrl,
        dataUrl: undefined,
      },
      image: undefined,
    }
  } catch (err) {
    console.warn('Не удалось загрузить фото ТТК в Supabase Storage:', err)
    return ttk
  }
}

async function fetchRemoteItems() {
  if (!supabase) return null

  let data, error
  try {
    ;({ data, error } = await supabase
      .from(TABLE_NAME)
      .select('*')
      .order('updated_at', { ascending: false }))
  } catch (err) {
    console.warn('Не удалось загрузить ТТК из Supabase:', err)
    return null
  }

  if (error) {
    console.warn('Не удалось загрузить ТТК из Supabase:', error)
    return null
  }

  return (data || []).map(row => normalizeReferenceTtk({
    ...(row.data || {}),
    id: row.id,
    title: row.title || row.data?.title || '',
    createdAt: row.created_at || row.data?.createdAt,
    updatedAt: row.updated_at || row.data?.updatedAt,
  }))
}

async function upsertRemoteItem(ttk) {
  if (!supabase) return ttk

  const itemWithPhoto = await uploadPhotoIfNeeded(ttk)
  const normalized = normalizeReferenceTtk(itemWithPhoto)

  const { error } = await supabase
    .from(TABLE_NAME)
    .upsert({
      id: normalized.id,
      title: normalized.title,
      data: normalized,
      updated_at: normalized.updatedAt,
    })

  if (error) {
    console.warn('Не удалось сохранить ТТК в Supabase:', error)
  }

  return normalized
}

async function deleteRemoteItem(id) {
  if (!supabase) return

  const { error } = await supabase
    .from(TABLE_NAME)
    .delete()
    .eq('id', id)

  if (error) {
    console.warn('Не удалось удалить ТТК из Supabase:', error)
  }
}

async function migrateLegacyToSupabaseIfNeeded(remoteItems) {
  if (!supabase || wasMigrated()) return remoteItems

  const legacyItems = readLegacyItems()
  if (legacyItems.length === 0) {
    markMigrated()
    return remoteItems
  }

  if (remoteItems.length > 0) {
    markMigrated()
    return remoteItems
  }

  const saved = []

  for (const item of legacyItems) {
    const normalized = normalizeReferenceTtk(item)
    const uploaded = await upsertRemoteItem(normalized)
    saved.push(uploaded)
  }

  markMigrated()
  return saved
}

export function useReferenceTtkStore() {
  const [items, setItems] = useState([])
  const [source, setSource] = useState('local')

  const reload = useCallback(async () => {
    if (!supabase) {
      setItems(readLegacyItems())
      setSource('local')
      return
    }

    const remoteItems = await fetchRemoteItems()

    if (remoteItems === null) {
      setItems(readLegacyItems())
      setSource('local')
      return
    }

    const finalItems = await migrateLegacyToSupabaseIfNeeded(remoteItems)
    setItems(finalItems)
    setSource('supabase')
    persistLocalCache(finalItems)
  }, [])

  useEffect(() => {
    reload()
  }, [reload])

  const saveTtk = useCallback(ttk => {
    const now = new Date().toISOString()
    const normalized = normalizeReferenceTtk(ttk)

    const clean = {
      ...normalized,
      updatedAt: now,
      rows: normalized.rows.filter(row => row.qty || row.name || row.unit || row.description),
    }

    if (clean.rows.length === 0) clean.rows = [{ ...EMPTY_ROW }]

    setItems(current => {
      const exists = current.some(item => item.id === clean.id)
      const next = exists
        ? current.map(item => item.id === clean.id ? clean : item)
        : [{ ...clean, createdAt: clean.createdAt || now }, ...current]
      persistLocalCache(next)
      return next
    })

    upsertRemoteItem(clean).then(saved => {
      setItems(current => {
        const next = current.map(item => item.id === saved.id ? saved : item)
        persistLocalCache(next)
        return next
      })
    })

    return clean
  }, [])

  const deleteTtk = useCallback(id => {
    setItems(current => {
      const next = current.filter(item => item.id !== id)
      persistLocalCache(next)
      return next
    })
    deleteRemoteItem(id)
  }, [])

  const duplicateTtk = useCallback(id => {
    const original = items.find(item => item.id === id)
    if (!original) return null

    const now = new Date().toISOString()
    const copy = {
      ...original,
      id: makeReferenceTtkId(),
      title: `${original.title || 'ТТК'} — копия`,
      status: 'draft',
      archived: false,
      createdAt: now,
      updatedAt: now,
    }

    setItems(current => {
      const next = [copy, ...current]
      persistLocalCache(next)
      return next
    })
    upsertRemoteItem(copy)

    return copy
  }, [items])

  const archiveTtk = useCallback(id => {
    const now = new Date().toISOString()
    let changed = null

    setItems(current => {
      const next = current.map(item => {
        if (item.id !== id) return item
        changed = { ...item, archived: true, updatedAt: now }
        return changed
      })
      persistLocalCache(next)
      return next
    })

    setTimeout(() => {
      if (changed) upsertRemoteItem(changed)
    }, 0)
  }, [])

  const restoreTtk = useCallback(id => {
    const now = new Date().toISOString()
    let changed = null

    setItems(current => {
      const next = current.map(item => {
        if (item.id !== id) return item
        changed = { ...item, archived: false, updatedAt: now }
        return changed
      })
      persistLocalCache(next)
      return next
    })

    setTimeout(() => {
      if (changed) upsertRemoteItem(changed)
    }, 0)
  }, [])

  const exportAll = useCallback(() => {
    return items
  }, [items])

  const importAll = useCallback(importedItems => {
    if (!Array.isArray(importedItems)) return 0

    const normalized = importedItems.map(normalizeReferenceTtk)

    setItems(current => {
      const byId = new Map(current.map(item => [item.id, item]))
      normalized.forEach(item => byId.set(item.id, item))
      const next = Array.from(byId.values())
      persistLocalCache(next)
      return next
    })

    normalized.forEach(item => {
      upsertRemoteItem(item)
    })

    return normalized.length
  }, [])

  return {
    items,
    saveTtk,
    deleteTtk,
    duplicateTtk,
    archiveTtk,
    restoreTtk,
    exportAll,
    importAll,
    reload,
    source,
    isRemote: source === 'supabase',
  }
}