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
// ВАЖНО: значения по этим ключам должны быть МАССИВАМИ объектов с полем id —
// для них работает общая merge/replace-логика restoreBackup() ниже.
export const STORAGE_KEYS = {
  dishes:      'academy_printable_reference_ttk_v1',
  nomenclature:'klevo_nomenclature',
  products:    'klevo_products',
  semifinished:'klevo_semifinished',
  categories:  'klevo_ttk_categories_v1',
  collections: 'chefcloud_collections_v1',
  productionTasks: 'chefcloud_production_tasks',
}

// Хранится не массивом, а объектом { tasks, comments, manualLinks, uploads } —
// обрабатывается отдельно от STORAGE_KEYS (см. collectBackup/restoreBackup).
export const WORKFLOW_STORAGE_KEY = 'ttk_network_workflow_v1'

function emptyWorkflow() {
  return { tasks: [], comments: [], manualLinks: [], uploads: [] }
}

// Слияние массива объектов с полем id: запись из файла побеждает при совпадении id,
// записи без id просто добавляются в конец (тот же принцип, что и в restoreBackup ниже).
function mergeArrayById(current = [], incoming = []) {
  const map = new Map(
    (Array.isArray(current) ? current : []).filter(item => item && item.id).map(item => [item.id, item])
  )
  ;(Array.isArray(incoming) ? incoming : []).forEach(item => {
    if (item && item.id) map.set(item.id, item)
  })
  const withoutId = (Array.isArray(incoming) ? incoming : []).filter(item => !item?.id)
  return [...map.values(), ...withoutId]
}

// manualLinks не имеют поля id — уникальны по паре restaurant+dishId (см. addManualLink в useWorkflowStore.js).
function mergeManualLinks(current = [], incoming = []) {
  const key = link => `${link?.restaurant}__${link?.dishId}`
  const map = new Map((Array.isArray(current) ? current : []).map(link => [key(link), link]))
  ;(Array.isArray(incoming) ? incoming : []).forEach(link => map.set(key(link), link))
  return Array.from(map.values())
}

function mergeWorkflow(current, incoming) {
  return {
    tasks:       mergeArrayById(current.tasks, incoming.tasks),
    comments:    mergeArrayById(current.comments, incoming.comments),
    manualLinks: mergeManualLinks(current.manualLinks, incoming.manualLinks),
    uploads:     mergeArrayById(current.uploads, incoming.uploads),
  }
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
  const collections = safeRead(STORAGE_KEYS.collections)  ?? []
  const productionTasks = safeRead(STORAGE_KEYS.productionTasks) ?? []
  const workflow    = safeRead(WORKFLOW_STORAGE_KEY) ?? emptyWorkflow()

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
        collections:  Array.isArray(collections)  ? collections.length  : 0,
        productionTasks: Array.isArray(productionTasks) ? productionTasks.length : 0,
        workflowTasks: Array.isArray(workflow?.tasks) ? workflow.tasks.length : 0,
      },
    },
    dishes,
    nomenclature,
    products,
    semifinished,
    categories,
    collections,
    productionTasks,
    workflow,
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

  // Workflow — отдельная секция: хранится объектом { tasks, comments, manualLinks, uploads },
  // а не массивом, поэтому общая merge/replace-логика выше для неё не подходит.
  const incomingWorkflow = backupData.workflow
  if (incomingWorkflow && typeof incomingWorkflow === 'object' && !Array.isArray(incomingWorkflow)) {
    const finalWorkflow = mode === 'replace'
      ? {
          tasks:       Array.isArray(incomingWorkflow.tasks)       ? incomingWorkflow.tasks       : [],
          comments:    Array.isArray(incomingWorkflow.comments)    ? incomingWorkflow.comments    : [],
          manualLinks: Array.isArray(incomingWorkflow.manualLinks) ? incomingWorkflow.manualLinks : [],
          uploads:     Array.isArray(incomingWorkflow.uploads)     ? incomingWorkflow.uploads     : [],
        }
      : mergeWorkflow(safeRead(WORKFLOW_STORAGE_KEY) || emptyWorkflow(), incomingWorkflow)

    const success = safeWrite(WORKFLOW_STORAGE_KEY, finalWorkflow)
    if (success) {
      counts.workflowTasks = (finalWorkflow.tasks || []).length
    } else {
      errors.push('workflow')
    }
  } else {
    // Секция отсутствует в файле (старый бэкап) — не трогаем текущие данные.
    counts.workflowTasks = 0
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
