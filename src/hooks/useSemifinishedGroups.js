import { useCallback, useEffect, useState } from 'react'

export const SEMIFINISHED_GROUPS_KEY = 'klevo_semifinished_groups'

function nowIso() {
  return new Date().toISOString()
}

export function createGroupId() {
  return `grp_${Date.now()}_${Math.random().toString(36).slice(2, 8)}`
}

function readGroups() {
  try {
    const raw = localStorage.getItem(SEMIFINISHED_GROUPS_KEY)
    const parsed = raw ? JSON.parse(raw) : []
    return Array.isArray(parsed) ? parsed : []
  } catch {
    return []
  }
}

function writeGroups(items) {
  localStorage.setItem(SEMIFINISHED_GROUPS_KEY, JSON.stringify(items))
}

export function useSemifinishedGroupsStore() {
  const [groups, setGroups] = useState([])

  useEffect(() => {
    setGroups(readGroups())
  }, [])

  const persist = useCallback(updater => {
    setGroups(current => {
      const next = typeof updater === 'function' ? updater(current) : updater
      writeGroups(next)
      return next
    })
  }, [])

  const addGroup = useCallback(name => {
    const cleanName = (name || '').trim()
    if (!cleanName) return null

    // Проверить дублирование
    if (groups.some(g => g.name.toLowerCase() === cleanName.toLowerCase())) {
      return groups.find(g => g.name.toLowerCase() === cleanName.toLowerCase())
    }

    const newGroup = {
      id: createGroupId(),
      name: cleanName,
      createdAt: nowIso(),
    }

    persist(current => [newGroup, ...current])
    return newGroup
  }, [groups, persist])

  const deleteGroup = useCallback(id => {
    persist(current => current.filter(g => g.id !== id))
  }, [persist])

  return {
    groups,
    addGroup,
    deleteGroup,
    groupNames: groups.map(g => g.name).sort(),
  }
}
