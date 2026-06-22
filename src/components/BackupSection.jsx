import { useRef, useState } from 'react'
import {
  collectBackup,
  downloadBackupFile,
  readBackupFile,
  restoreBackup,
} from '../hooks/useBackup.js'

// Форматирует байты в человекочитаемый размер
function formatSize(bytes) {
  if (bytes < 1024)        return `${bytes} Б`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`
}

function formatCounts(counts) {
  return [
    counts.dishes        != null ? `${counts.dishes} блюд`          : null,
    counts.semifinished  != null ? `${counts.semifinished} П/Ф`      : null,
    counts.products      != null ? `${counts.products} товаров`      : null,
    counts.categories    != null ? `${counts.categories} категорий`  : null,
    counts.nomenclature  != null ? `${counts.nomenclature} позиций номенклатуры` : null,
  ].filter(Boolean).join(' · ')
}

const CARD = {
  background: '#fff',
  border: '1px solid #ece8df',
  borderRadius: 20,
  padding: '20px 24px',
  boxShadow: '0 6px 20px rgba(15,23,42,.05)',
}

const BTN_PRIMARY = {
  padding: '11px 20px',
  borderRadius: 12,
  border: 'none',
  background: '#16332b',
  color: '#fff',
  fontWeight: 800,
  fontSize: 13.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const BTN_SEC = {
  padding: '11px 20px',
  borderRadius: 12,
  border: '1.5px solid #e5e1d8',
  background: '#fff',
  color: '#374151',
  fontWeight: 700,
  fontSize: 13.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const BTN_DANGER = {
  ...BTN_SEC,
  color: '#b45309',
  borderColor: '#f3d9ad',
  background: '#fffbeb',
}

function StatusBanner({ status }) {
  if (!status) return null

  const styles = {
    ok:      { background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534' },
    error:   { background: '#fef2f2', border: '1px solid #fecaca', color: '#991b1b' },
    warning: { background: '#fffbeb', border: '1px solid #fde68a', color: '#92400e' },
    info:    { background: '#f0f9ff', border: '1px solid #bae6fd', color: '#075985' },
  }

  return (
    <div style={{
      ...styles[status.type],
      borderRadius: 12,
      padding: '12px 16px',
      fontSize: 13.5,
      lineHeight: 1.55,
      fontWeight: 600,
    }}>
      {status.type === 'ok'      && '✅ '}
      {status.type === 'error'   && '❌ '}
      {status.type === 'warning' && '⚠️ '}
      {status.type === 'info'    && 'ℹ️ '}
      {status.message}
    </div>
  )
}

// Диалог подтверждения перед восстановлением — критически важен, потому что
// восстановление перезапишет текущие данные данными из файла.
function ConfirmRestoreDialog({ backupInfo, onConfirmMerge, onConfirmReplace, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 500, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', color: '#16332b', fontSize: 20 }}>Восстановление данных</h2>

        <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 12px' }}>
          Файл создан: <strong>{backupInfo.createdAtHuman || backupInfo.createdAt}</strong>
        </p>
        <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px' }}>
          Содержит: <strong>{formatCounts(backupInfo.counts)}</strong>
        </p>

        <div style={{ background: '#fef2f2', border: '1px solid #fecaca', borderRadius: 12, padding: '12px 14px', marginBottom: 20 }}>
          <p style={{ margin: 0, color: '#991b1b', fontSize: 13, fontWeight: 700, lineHeight: 1.5 }}>
            Выберите режим восстановления:<br />
            <span style={{ fontWeight: 600 }}>
              • <strong>Объединить</strong> — данные из файла добавятся к текущим. Ничего из текущей базы не удалится. Рекомендуется.<br />
              • <strong>Полная замена</strong> — текущие данные будут ПОЛНОСТЬЮ заменены данными из файла. Используйте только если файл содержит полную актуальную базу.
            </span>
          </p>
        </div>

        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onConfirmMerge}   style={{ ...BTN_PRIMARY, flex: 1 }}>Объединить (безопасно)</button>
          <button onClick={onConfirmReplace} style={{ ...BTN_DANGER, flex: 1 }}>Полная замена</button>
          <button onClick={onCancel}         style={{ ...BTN_SEC, flex: 1 }}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default function BackupSection({ onDataRestored }) {
  const [status, setStatus] = useState(null)
  const [pendingRestore, setPendingRestore] = useState(null) // данные файла, ожидающие подтверждения
  const importRef     = useRef(null)
  const restoreRef    = useRef(null)

  // Единый формат имени файла бэкапа: ChefCloud-Backup-YYYY-MM-DD.json.
  // Параметр prefix больше не используется в имени файла (раньше различал
  // "экспорт"/"бэкап" через подчёркивание и добавлял время) — оставлен в сигнатуре,
  // чтобы не трогать вызовы buildFilename(...) ниже.
  function buildFilename() {
    const datePart = new Date().toISOString().slice(0, 10)
    return `ChefCloud-Backup-${datePart}.json`
  }

  // Кнопка 1 — «Экспорт всей базы»
  function handleExportAll() {
    try {
      const backup = collectBackup()
      const json   = JSON.stringify(backup, null, 2)
      const sizeMB = (new Blob([json]).size / (1024*1024)).toFixed(2)
      downloadBackupFile(buildFilename('export'), backup)
      setStatus({
        type: 'ok',
        message: `Экспорт завершён. Файл скачан на ваш компьютер. Размер: ${sizeMB} МБ. Содержит: ${formatCounts(backup._backup.counts)}.`,
      })
    } catch (err) {
      setStatus({ type: 'error', message: `Ошибка при экспорте: ${err.message}` })
    }
  }

  // Кнопка 2 — «Импорт всей базы» (слияние с текущими данными без подтверждения)
  function handleImportClick() {
    setStatus(null)
    importRef.current?.click()
  }

  async function handleImportFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const data = await readBackupFile(file)

      // Проверяем, что файл — это ChefCloud backup
      if (!data._backup || data._backup.app !== 'ChefCloud') {
        setStatus({
          type: 'error',
          message: 'Это не файл резервной копии ChefCloud. Выберите файл, созданный через «Экспорт данных» или «Создать резервную копию».',
        })
        return
      }

      // Импорт через UI «Импорт» — сразу сливает, без диалога (быстрый путь)
      const result = restoreBackup(data, 'merge')
      if (result.ok) {
        setStatus({
          type: 'ok',
          message: `Импорт завершён (режим: объединение). Итого в базе: ${formatCounts(result.counts)}. Страница обновится через 2 секунды.`,
        })
        setTimeout(() => window.location.reload(), 2000)
      } else {
        setStatus({ type: 'error', message: result.error })
      }
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  // Кнопка 3 — «Создать резервную копию» (то же, что экспорт, но с пометкой backup в имени)
  function handleCreateBackup() {
    try {
      const backup = collectBackup()
      const json   = JSON.stringify(backup, null, 2)
      const size   = formatSize(new Blob([json]).size)
      downloadBackupFile(buildFilename('backup'), backup)
      setStatus({
        type: 'ok',
        message: `Резервная копия создана и скачана. Размер: ${size}. Содержит: ${formatCounts(backup._backup.counts)}. Сохраните файл в надёжном месте (облако, внешний диск).`,
      })
    } catch (err) {
      setStatus({ type: 'error', message: `Ошибка при создании резервной копии: ${err.message}` })
    }
  }

  // Кнопка 4 — «Восстановить из резервной копии» (с диалогом подтверждения режима)
  function handleRestoreClick() {
    setStatus(null)
    restoreRef.current?.click()
  }

  async function handleRestoreFile(e) {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return

    try {
      const data = await readBackupFile(file)

      if (!data._backup || data._backup.app !== 'ChefCloud') {
        setStatus({
          type: 'error',
          message: 'Это не файл резервной копии ChefCloud. Выберите файл, созданный через «Создать резервную копию» или «Экспорт данных».',
        })
        return
      }

      // Показываем диалог — пусть пользователь выберет режим осознанно
      setPendingRestore(data)
    } catch (err) {
      setStatus({ type: 'error', message: err.message })
    }
  }

  function executeRestore(mode) {
    const data = pendingRestore
    setPendingRestore(null)
    if (!data) return

    const result = restoreBackup(data, mode)
    if (result.ok) {
      const modeLabel = mode === 'merge' ? 'объединение' : 'полная замена'
      setStatus({
        type: 'ok',
        message: `Восстановление завершено (режим: ${modeLabel}). Итого в базе: ${formatCounts(result.counts)}. Страница обновится через 2 секунды.`,
      })
      setTimeout(() => {
        if (onDataRestored) onDataRestored()
        else window.location.reload()
      }, 2000)
    } else {
      setStatus({ type: 'error', message: result.error })
    }
  }

  return (
    <>
      {pendingRestore && (
        <ConfirmRestoreDialog
          backupInfo={pendingRestore._backup}
          onConfirmMerge={()   => executeRestore('merge')}
          onConfirmReplace={()  => executeRestore('replace')}
          onCancel={() => {
            setPendingRestore(null)
            setStatus({ type: 'info', message: 'Восстановление отменено. Данные не изменены.' })
          }}
        />
      )}

      {/* Резервная копия — создать копию всех данных / восстановить из файла.
          Обработчики (handleCreateBackup/handleRestoreClick/...) не менялись —
          поменялось только расположение и подписи карточек. */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>💾</span>
          <h2 style={{ margin: 0, fontSize: 18, color: '#16332b' }}>Резервная копия</h2>
        </div>

        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px', lineHeight: 1.6 }}>
          Полная копия всех данных: блюда (с фотографиями), полуфабрикаты, товары, категории и номенклатура — в одном файле.
          Храните файл резервной копии на внешнем диске или в облаке.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <ActionCard
            emoji="💾"
            title="Создать резервную копию"
            desc="Скачать полный бэкап с меткой времени. Сохраните в надёжном месте."
            onClick={handleCreateBackup}
            btnLabel="Создать копию"
            btnStyle={BTN_PRIMARY}
          />
          <ActionCard
            emoji="♻️"
            title="Восстановить из файла"
            desc="Загрузить файл резервной копии. Перед восстановлением будет запрошено подтверждение режима (слияние или полная замена)."
            onClick={handleRestoreClick}
            btnLabel="Восстановить"
            btnStyle={BTN_DANGER}
          />
        </div>
      </div>

      {/* Импорт и экспорт — то же самое слияние всех данных, но без метки времени
          в имени файла. Обработчики (handleExportAll/handleImportClick/...) те же,
          что и раньше, только переименованы подписи и убрано слово "JSON". */}
      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🔁</span>
          <h2 style={{ margin: 0, fontSize: 18, color: '#16332b' }}>Импорт и экспорт</h2>
        </div>

        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 20px', lineHeight: 1.6 }}>
          Перенос данных одним файлом — например, на другой компьютер или другому сотруднику.
        </p>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 16 }}>
          <ActionCard
            emoji="📤"
            title="Экспорт данных"
            desc="Скачать все данные в один файл. Фото сохраняются внутри файла."
            onClick={handleExportAll}
            btnLabel="Экспорт"
            btnStyle={BTN_SEC}
          />
          <ActionCard
            emoji="📥"
            title="Импорт данных"
            desc="Загрузить данные из файла. Режим: слияние — текущие данные не удаляются."
            onClick={handleImportClick}
            btnLabel="Импорт"
            btnStyle={BTN_SEC}
          />
        </div>

        <StatusBanner status={status} />

        {/* Скрытые file input'ы */}
        <input ref={importRef}  type="file" accept=".json" onChange={handleImportFile}  style={{ display:'none' }} />
        <input ref={restoreRef} type="file" accept=".json" onChange={handleRestoreFile} style={{ display:'none' }} />
      </div>
    </>
  )
}

function ActionCard({ emoji, title, desc, onClick, btnLabel, btnStyle }) {
  return (
    <div style={{
      border: '1px solid #ece8df',
      borderRadius: 16,
      padding: '16px 18px',
      display: 'flex',
      flexDirection: 'column',
      gap: 8,
      background: '#faf8f5',
    }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        <span style={{ fontSize: 20 }}>{emoji}</span>
        <span style={{ fontWeight: 800, fontSize: 14, color: '#16332b' }}>{title}</span>
      </div>
      <p style={{ margin: 0, color: '#64748b', fontSize: 12.5, lineHeight: 1.55, flex: 1 }}>{desc}</p>
      <button onClick={onClick} style={{ ...btnStyle, alignSelf: 'flex-start', marginTop: 4 }}>{btnLabel}</button>
    </div>
  )
}
