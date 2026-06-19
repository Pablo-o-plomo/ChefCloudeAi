// useBackup.js — полное резервное копирование всех данных ChefCloud.
//
// БЕЗОПАСНОСТЬ:
// - Экспорт: только читает localStorage, ничего не пишет и не удаляет.
// - Импорт: пишет ТОЛЬКО в известные ключи (список STORAGE_KEYS).
//           Не вызывает localStorage.clear() — никогда.
//           При конфликте данных: побеждает импортируемый файл (merge по id),
//           но существующие записи, которых нет в файле, НЕ удаляются,
//           если только пользователь не выбрал режим «полной замены».
// - Ключи хранения не меняются — данные остаются совместимы со всеми хуками.

export const BACKUP_VERSION = 1

// Все ключи хранения, которые входят в полный бэкап.
// Если в будущем появятся новые хранилища — добавить сюда.
export const STORAGE_KEYS = {
  dishes:      'academy_printable_reference_ttk_v1',
  nomenclature:'klevo_nomenclature',
  products:    'klevo_products',
  semifinished:'klevo_semifinished',
  categories:  'klevo_ttk_categories_v1',
}

function safeRead(key) {
  try {
    const raw = localStorage.getItem(key)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function safeWrite(key, value) {
  try {
    localStorage.setItem(key, JSON.stringify(value))
    return true
  } catch (err) {
    // Чаще всего: QuotaExceededError — localStorage переполнен (фото base64 могут быть большими).
    console.error(`ChefCloud backup: не удалось записать ключ ${key}:`, err)
    return false
  }
}

// Собирает полный снэпшот всех данных из localStorage в один объект.
// Фото уже хранятся как base64 внутри объектов блюд — они включаются автоматически.
export function collectBackup() {
  const now = new Date()

  const dishes      = safeRead(STORAGE_KEYS.dishes)      ?? []
  const nomenclature= safeRead(STORAGE_KEYS.nomenclature) ?? []
  const products    = safeRead(STORAGE_KEYS.products)     ?? []
  const semifinished= safeRead(STORAGE_KEYS.semifinished) ?? []
  const categories  = safeRead(STORAGE_KEYS.categories)   ?? []

  return {
    // Метаданные бэкапа — помогают при восстановлении понять, откуда файл.
    _backup: {
      version:     BACKUP_VERSION,
      createdAt:   now.toISOString(),
      createdAtHuman: now.toLocaleString('ru-RU'),
      app:         'ChefCloud',
      counts: {
        dishes:       Array.isArray(dishes)       ? dishes.length       : 0,
        nomenclature: Array.isArray(nomenclature) ? nomenclature.length : 0,
        products:     Array.isArray(products)     ? products.length     : 0,
        semifinished: Array.isArray(semifinished) ? semifinished.length : 0,
        categories:   Array.isArray(categories)   ? categories.length   : 0,
      },
    },
    dishes,
    nomenclature,
    products,
    semifinished,
    categories,
  }
}

// Скачивает файл JSON на компьютер пользователя.
// filename — имя файла без пути; data — любой сериализуемый объект.
export function downloadBackupFile(filename, data) {
  const json = JSON.stringify(data, null, 2)
  const blob = new Blob([json], { type: 'application/json; charset=utf-8' })
  const url  = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

// Восстанавливает данные из объекта бэкапа.
//
// mode:
//   'merge'   — данные из файла объединяются с текущими по полю id.
//               Если id совпал — запись из файла побеждает (она свежее, раз мы восстанавливаем).
//               Записи, которых нет в файле, остаются нетронутыми.
//               ЭТО БЕЗОПАСНЫЙ РЕЖИМ — ничего не теряется из текущей базы.
//
//   'replace' — текущие данные ПОЛНОСТЬЮ заменяются данными из файла.
//               Используйте только если вы уверены, что файл полный и актуальный.
//               Записи, которых нет в файле, будут удалены (перезапись ключа целиком).
//
// Возвращает объект { ok: true, counts } при успехе или { ok: false, error } при ошибке.
export function restoreBackup(backupData, mode = 'merge') {
  // Базовая валидация: проверяем, что это действительно файл ChefCloud, а не случайный JSON.
  if (!backupData || typeof backupData !== 'object') {
    return { ok: false, error: 'Файл не является объектом JSON.' }
  }
  if (!backupData._backup || backupData._backup.app !== 'ChefCloud') {
    return { ok: false, error: 'Файл не является резервной копией ChefCloud. Убедитесь, что выбран правильный файл.' }
  }
  if (backupData._backup.version > BACKUP_VERSION) {
    return { ok: false, error: `Файл создан более новой версией ChefCloud (v${backupData._backup.version}). Обновите приложение.` }
  }

  const counts = {}
  const errors = []

  // Восстанавливаем каждое хранилище.
  for (const [section, storageKey] of Object.entries(STORAGE_KEYS)) {
    const incoming = backupData[section]
    if (!Array.isArray(incoming)) {
      // Секция отсутствует в файле — пропускаем, не трогаем текущие данные.
      counts[section] = 0
      continue
    }

    let finalData

    if (mode === 'replace') {
      finalData = incoming
    } else {
      // merge: объединяем текущие данные с файлом по id
      const current = safeRead(storageKey) ?? []
      const currentMap = new Map(
        current
          .filter(item => item && item.id)
          .map(item => [item.id, item])
      )
      // Данные из файла имеют приоритет (перезаписывают по id)
      for (const item of incoming) {
        if (item && item.id) currentMap.set(item.id, item)
      }
      // Записи без id из файла добавляем в конец
      const withoutId = incoming.filter(item => !item?.id)
      finalData = [...currentMap.values(), ...withoutId]
    }

    const success = safeWrite(storageKey, finalData)
    if (success) {
      counts[section] = finalData.length
    } else {
      errors.push(section)
    }
  }

  if (errors.length > 0) {
    return {
      ok: false,
      error: `Не удалось записать данные в: ${errors.join(', ')}. Возможно, localStorage переполнен из-за большого объёма фотографий. Попробуйте освободить место или уменьшить размер фото.`,
      counts,
    }
  }

  return { ok: true, counts }
}

// Читает файл через FileReader, парсит JSON, возвращает Promise<object>.
export function readBackupFile(file) {
  return new Promise((resolve, reject) => {
    if (!file) return reject(new Error('Файл не выбран.'))
    if (!file.name.endsWith('.json')) {
      return reject(new Error('Выберите файл с расширением .json'))
    }

    const reader = new FileReader()
    reader.onload  = () => {
      try {
        resolve(JSON.parse(reader.result))
      } catch {
        reject(new Error('Не удалось прочитать JSON. Файл повреждён или имеет неверный формат.'))
      }
    }
    reader.onerror = () => reject(new Error('Ошибка чтения файла.'))
    reader.readAsText(file, 'utf-8')
  })
}
