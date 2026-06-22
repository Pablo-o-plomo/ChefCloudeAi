import { useEffect, useMemo, useState } from 'react'
import { createPortal } from 'react-dom'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { SearchIcon, CloseIcon } from '../components/icons.jsx'
import { createEmptySemifinished } from '../hooks/useSemifinished.js'

const SEMIFINISHED_CATEGORIES = [
  'Соусы', 'Гарниры', 'Заготовки', 'Маринады',
  'Паста', 'Смеси специй', 'Бульоны', 'Масла',
  'Начинки', 'Кремы', 'Пюре', 'Прочее',
]

const STATUS_LABELS = {
  processing: 'На проработке',
  active: 'Активные',
  archived: 'В архиве',
}

const STATUS_COLORS = {
  processing: '#f59e0b',
  active: '#16a34a',
  archived: '#9ca3af',
}

const TYPE_LABELS = {
  product: 'Товар',
  semifinished: 'П/Ф',
  sauce: 'Соус',
  prep: 'Заготовка',
}

const SECTION = {
  background: '#fff',
  border: '1px solid #ece8df',
  borderRadius: 22,
  padding: 22,
  boxShadow: '0 12px 36px rgba(15,23,42,.06)',
}

const FIELD = { display: 'flex', flexDirection: 'column', gap: 7 }

const INPUT = {
  ...SEL_ST,
  width: '100%',
  boxSizing: 'border-box',
  cursor: 'text',
  borderRadius: 14,
  borderColor: '#e5e1d8',
  background: '#fff',
}

const TEXTAREA = {
  width: '100%',
  boxSizing: 'border-box',
  minHeight: 120,
  border: '1px solid #e5e1d8',
  borderRadius: 16,
  padding: 14,
  fontSize: 14,
  outline: 'none',
  resize: 'vertical',
  fontFamily: 'inherit',
  lineHeight: 1.6,
  background: '#fff',
}

const PRIMARY = {
  ...SEL_ST,
  background: '#16332b',
  borderColor: '#16332b',
  color: '#fff',
  fontWeight: 900,
  padding: '11px 18px',
  borderRadius: 999,
}

const EMPTY_ROW = { name: '', type: 'product', qty: '', unit: '', description: '' }

function formatDate(value) {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('ru-RU')
}

function fileToPayload(file) {
  return new Promise(resolve => {
    if (!file) return resolve(null)
    const reader = new FileReader()
    reader.onload = () => resolve({ name: file.name, type: file.type, size: file.size, dataUrl: reader.result })
    reader.readAsDataURL(file)
  })
}

function downloadBlob(name, content, type) {
  const blob = new Blob([content], { type })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = name
  link.click()
  URL.revokeObjectURL(url)
}

function escapeHtml(value = '') {
  return String(value)
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;')
    .replaceAll("'", '&#039;')
}

function normalizeRow(row = {}) {
  return {
    ...EMPTY_ROW,
    ...row,
    name: row.name || row.title || '',
    type: row.type || 'product',
    qty: row.qty || row.quantity || row.amount || '',
    unit: row.unit || '',
  }
}

function textOrDash(value) {
  return value && String(value).trim() ? value : '—'
}

function formatQty(row) {
  const qty = String(row.qty || '').trim()
  const unit = String(row.unit || '').trim()
  if (!qty && !unit) return '—'
  return [qty, unit].filter(Boolean).join(' ')
}

// ============ ФОРМА РЕДАКТИРОВАНИЯ / СОЗДАНИЯ ============

function SemifinishedForm({ initial, nomenclature = [], onAddCategory, onSaveNomenclatureItem, onCancel, onSave, items = [] }) {
  const [form, setForm] = useState(() => initial || createEmptySemifinished())
  const [dirty, setDirty] = useState(false)
  const [creatingRowIndex, setCreatingRowIndex] = useState(null) // Защита от двойного клика

  // Группы для dropdown: из существующих полуфабрикатов + стандартные категории
  const groupsSet = useMemo(() => {
    const set = new Set(SEMIFINISHED_CATEGORIES)
    // Добавить группы из существующих полуфабрикатов
    items
      .map(item => (item.categoryPath || item.category || '').trim())
      .filter(Boolean)
      .forEach(group => set.add(group))
    return set
  }, [items])
  const groupsList = Array.from(groupsSet).sort()

  const nomenclatureByName = useMemo(() => {
    return new Map(
      nomenclature
        .filter(item => item.name || item.title)
        .map(item => [String(item.name || item.title).trim().toLowerCase(), item]),
    )
  }, [nomenclature])

  // Комбинированный поиск: товары + существующие П/Ф
  const allItemsByName = useMemo(() => {
    const map = new Map(nomenclatureByName)
    // Добавить существующие П/Ф в поиск
    items.forEach(item => {
      const key = String(item.name || '').trim().toLowerCase()
      if (key) {
        map.set(key, { ...item, type: 'semifinished', title: item.name })
      }
    })
    return map
  }, [nomenclatureByName, items])

  function update(field, value) {
    setForm(current => ({ ...current, [field]: value }))
    setDirty(true)
  }

  function updateRow(index, field, value) {
    setForm(current => ({
      ...current,
      rows: current.rows.map((row, i) => i === index ? { ...row, [field]: value } : row),
    }))
    setDirty(true)
  }

  function selectNomenclature(index, name) {
    const item = nomenclatureByName.get(name.trim().toLowerCase())
    if (!item) {
      updateRow(index, 'name', name)
      return
    }
    setForm(current => ({
      ...current,
      rows: current.rows.map((row, i) => i === index ? {
        ...row,
        name: item.name || item.title,
        type: item.type || 'product',
        unit: row.unit || item.unit || '',
      } : row),
    }))
    setDirty(true)
  }

  function addRowToNomenclature(row, source, rowIndex) {
    // Защита от пустого названия
    if (!row.name?.trim()) {
      return
    }

    // Защита от двойного клика
    if (creatingRowIndex === rowIndex) {
      return
    }

    const trimmedName = row.name.trim()
    const searchKey = trimmedName.toLowerCase()

    // Проверить: может быть П/Ф уже существует?
    if (source === 'semifinished') {
      // Ищем в существующих П/Ф
      const existing = items.find(item => (item.name || '').trim().toLowerCase() === searchKey)
      if (existing) {
        // П/Ф уже существует, просто выбираем его
        updateRow(rowIndex, 'name', existing.name)
        updateRow(rowIndex, 'type', 'semifinished')
        updateRow(rowIndex, 'unit', existing.unit || 'г')
        setCreatingRowIndex(null)
        return
      }
    }

    // П/Ф не существует, создаём новый
    if (!onSaveNomenclatureItem) {
      return
    }

    setCreatingRowIndex(rowIndex) // Заблокировать двойной клик

    const newItem = {
      name: trimmedName,
      type: row.type || 'product',
      category: '',
      unit: row.unit || 'г',
      description: '',
      source, // 'product' или 'semifinished'
    }

    // Сохраняем товар/П/Ф
    onSaveNomenclatureItem(newItem)

    // После сохранения заполняем текущую строку
    setTimeout(() => {
      updateRow(rowIndex, 'name', trimmedName)
      updateRow(rowIndex, 'type', source === 'semifinished' ? 'semifinished' : 'product')
      updateRow(rowIndex, 'unit', row.unit || 'г')
      setCreatingRowIndex(null) // Разблокировать
    }, 100)
  }

  function saveForm() {
    if (!form.name?.trim()) {
      alert('Введите название полуфабриката')
      return
    }
    const now = new Date().toISOString()
    const cleanForm = {
      ...form,
      source: 'semifinished', // Явно указываем что это полуфабрикат
      rows: (form.rows || []).filter(row => row && row.name && row.name.trim()),
      updatedAt: now,
    }
    if (!onSave) {
      alert('Ошибка: onSave функция не передана в форму')
      return
    }
    try {
      onSave(cleanForm)
      setDirty(false)
    } catch (err) {
      alert(`Ошибка: ${err.message}`)
    }
  }

  function handleCancel() {
    if (dirty) {
      if (!confirm('У вас есть несохранённые изменения. Вы уверены что хотите выйти?')) {
        return
      }
    }
    onCancel()
  }

  return (
    <form onSubmit={e => { e.preventDefault(); saveForm() }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ЗАГОЛОВОК */}
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#faf8f5', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 30, color: '#16332b', letterSpacing: '-.03em' }}>
            {initial?.name ? 'Редактировать полуфабрикат' : 'Новый полуфабрикат'}
          </h1>
          <div style={{ color: '#64748b', fontSize: 14 }}>Полуфабрикат с рецептурой и технологией приготовления</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      {/* ОСНОВНОЕ */}
      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Основное</h2>
        <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr', gap: 12 }}>
          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Название полуфабриката</span>
            <input spellCheck="false" value={form.name || ''} onChange={e => update('name', e.target.value)} style={INPUT} />
          </label>

          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Группа</span>
            <select value={form.categoryPath || ''} onChange={e => update('categoryPath', e.target.value)} style={{ ...SEL_ST, width: '100%' }}>
              <option value="">— Без группы —</option>
              {groupsList.map(group => (
                <option key={group} value={group}>{group}</option>
              ))}
            </select>
          </label>

          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Выход, г</span>
            <input value={form.actualOutput || ''} onChange={e => update('actualOutput', e.target.value)} style={INPUT} />
          </label>

          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Ед. изм.</span>
            <input value={form.unit || ''} onChange={e => update('unit', e.target.value)} style={INPUT} placeholder="г" />
          </label>

          <label style={FIELD}>
            <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Статус</span>
            <select value={form.status || 'processing'} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width: '100%' }}>
              <option value="processing">На проработке</option>
              <option value="active">Активные</option>
              <option value="archived">В архиве</option>
            </select>
          </label>
        </div>
      </section>

      {/* ОПИСАНИЕ */}
      <section style={SECTION}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ marginTop: 0, color: '#16332b', margin: 0 }}>Краткое описание</h2>
          <button
            type="button"
            onClick={() => {
              const ingredients = (form.rows || []).map(r => r.name).filter(Boolean).join(', ')
              if (ingredients) {
                update('description', `Полуфабрикат из: ${ingredients}`)
              }
            }}
            disabled={!(form.rows || []).some(r => r.name)}
            title={(form.rows || []).some(r => r.name) ? "Сгенерировать описание на основе состава" : "Добавьте ингредиенты сначала"}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fef3c7', cursor: (form.rows || []).some(r => r.name) ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, opacity: (form.rows || []).some(r => r.name) ? 1 : 0.5 }}
          >
            🤖 AI
          </button>
        </div>
        <label style={FIELD}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}></span>
          <textarea spellCheck="false" value={form.description || ''} onChange={e => update('description', e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); saveForm() } }} style={{ ...TEXTAREA, minHeight: 80 }} placeholder="Описание полуфабриката" />
        </label>
      </section>

      {/* ИНГРЕДИЕНТЫ */}
      <section style={SECTION}>
        <datalist id="nomenclature-options">
          {nomenclature
            .map(item => (
              <option key={item.id || item.name} value={item.name || item.title}>
                {TYPE_LABELS[item.type] || item.type} · {item.unit || 'г'}
              </option>
            ))}
        </datalist>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <div>
            <h2 style={{ margin: '0 0 4px', color: '#16332b' }}>Ингредиенты</h2>
            <div style={{ color: '#64748b', fontSize: 13 }}>Наименование, тип, количество и единица измерения.</div>
          </div>
          <button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button>
        </div>

        <div style={{ overflowX: 'auto' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Наименование', 'Тип', 'Кол-во', 'Ед.', ''].map(h => (
                  <th key={h} style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280', fontWeight: 700 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {(form.rows || []).map((row, index) => {
                const cleanRow = normalizeRow(row)
                const item = nomenclatureByName.get(cleanRow.name?.trim().toLowerCase())

                return (
                  <tr key={index}>
                    <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', width: '42%' }}>
                      <input
                        list="nomenclature-options"
                        placeholder="Наименование"
                        value={cleanRow.name}
                        onChange={e => selectNomenclature(index, e.target.value)}
                        onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }}
                        style={INPUT}
                      />
                      {cleanRow.name && !allItemsByName.has(cleanRow.name.trim().toLowerCase()) && creatingRowIndex !== index && (
                        <div style={{ display: 'flex', gap: 6, marginTop: 6 }}>
                          <button type="button" onClick={() => addRowToNomenclature(cleanRow, 'product', index)} style={{ ...SEL_ST, fontSize: 10, flex: 1 }}>
                            + Товар
                          </button>
                          <button type="button" onClick={() => addRowToNomenclature(cleanRow, 'semifinished', index)} style={{ ...SEL_ST, fontSize: 10, flex: 1, opacity: creatingRowIndex === index ? 0.5 : 1 }}>
                            + П/Ф
                          </button>
                        </div>
                      )}
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', width: '16%' }}>
                      <select value={cleanRow.type} onChange={e => updateRow(index, 'type', e.target.value)} style={{ ...SEL_ST, width: '100%', color: '#6b7280', fontWeight: 700 }}>
                        <option value="product">Товар</option>
                        <option value="semifinished">П/Ф</option>
                        <option value="sauce">Соус</option>
                        <option value="prep">Заготовка</option>
                      </select>
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', width: '15%' }}>
                      <input placeholder="Кол-во" value={cleanRow.qty} onChange={e => updateRow(index, 'qty', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} style={INPUT} />
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', width: '15%' }}>
                      <input placeholder={item?.unit || 'г'} value={cleanRow.unit} onChange={e => updateRow(index, 'unit', e.target.value)} onKeyDown={e => { if (e.key === 'Enter') e.preventDefault() }} style={INPUT} />
                    </td>
                    <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', width: '7%' }}>
                      <button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      </section>

      {/* СПОСОБ ПРИГОТОВЛЕНИЯ */}
      <section style={SECTION}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
          <h2 style={{ marginTop: 0, color: '#16332b', margin: 0 }}>Способ приготовления</h2>
          <button
            type="button"
            onClick={() => {
              const ingredients = (form.rows || []).map(r => r.name).filter(Boolean).join(', ')
              if (ingredients) {
                update('cookingMethod', `1. Подготовить ингредиенты: ${ingredients}\n2. Выполнить основную обработку\n3. Проверить качество и внешний вид`)
              }
            }}
            disabled={!(form.rows || []).some(r => r.name)}
            title={(form.rows || []).some(r => r.name) ? "Сгенерировать способ приготовления на основе состава" : "Добавьте ингредиенты сначала"}
            style={{ padding: '6px 12px', border: '1px solid #cbd5e1', borderRadius: 8, background: '#fef3c7', cursor: (form.rows || []).some(r => r.name) ? 'pointer' : 'not-allowed', fontSize: 12, fontWeight: 600, opacity: (form.rows || []).some(r => r.name) ? 1 : 0.5 }}
          >
            🤖 AI
          </button>
        </div>
        <label style={FIELD}>
          <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Текст для повара</span>
          <textarea spellCheck="false" value={form.cookingMethod || ''} onChange={e => update('cookingMethod', e.target.value)} onKeyDown={e => { if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); saveForm() } }} style={{ ...TEXTAREA, minHeight: 120 }} placeholder="1. Подготовить ингредиенты согласно рецептуре.\n2. Выполнить основную обработку.\n3. Проверить качество и внешний вид." />
        </label>
      </section>
    </form>
  )
}

// ============ ПРОСМОТР ПОЛУФАБРИКАТА ============

function SemifinishedView({ semi, onBack, onEdit, onDelete, onArchive, onDuplicate }) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  if (!semi) return null

  const totalInput = (semi.rows || []).reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0)
  const actualOutput = parseFloat(semi.actualOutput) || 0
  const losses = totalInput - actualOutput
  const lossesPercent = totalInput > 0 ? (losses / totalInput * 100).toFixed(1) : 0

  function printTtk() {
    const html = makePrintableSemifinished(semi)
    const win = window.open('', '_blank')
    if (win) {
      win.document.write(html)
      win.document.close()
      win.focus()
      setTimeout(() => win.print(), 400)
    }
  }

  function handleDuplicate() {
    const duplicate = {
      ...semi,
      id: Date.now().toString(),
      name: `${semi.name} (копия)`,
      status: 'processing'
    }
    onDuplicate(duplicate)
  }

  function downloadJson() {
    downloadBlob(`${semi.name || 'semifinished'}.json`, JSON.stringify(semi, null, 2), 'application/json')
  }

  return (
    <div onKeyDown={e => { if (e.key === 'Enter') e.stopPropagation() }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      {/* ЗАГОЛОВОК И КНОПКИ */}
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'flex-start', background: '#faf8f5', flexWrap: 'wrap' }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom: 12 }}>← Полуфабрикаты</button>
          <div><Tag color={STATUS_COLORS[semi.status] || '#64748b'}>{STATUS_LABELS[semi.status] || semi.status}</Tag></div>
          <h1 style={{ margin: '10px 0 6px', fontSize: 30, color: '#16332b', letterSpacing: '-.03em' }}>{semi.name || 'Без названия'}</h1>
          <div style={{ color: '#64748b', fontSize: 13 }}>
            {semi.categoryPath && <>{semi.categoryPath} · </>}
            Выход: {semi.actualOutput || '—'} г · строк: {semi.rows?.length || 0} · обновлено {formatDate(semi.updatedAt)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={onEdit} style={PRIMARY}>Редактировать</button>
            <button onClick={handleDuplicate} style={SEL_ST}>Дублировать</button>
            <button onClick={printTtk} style={SEL_ST}>🖨️ Печать</button>
            <button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button>
            {semi.status !== 'archived' && <button onClick={onArchive} style={{ ...SEL_ST, color: '#b45309', borderColor: '#f3d9ad' }}>В архив</button>}
            <button onClick={() => setConfirmDelete(true)} style={{ ...SEL_ST, color: '#dc2626', borderColor: '#fecaca' }}>Удалить</button>
          </div>
        </div>
      </div>

      {/* ОСНОВНАЯ ИНФОРМАЦИЯ */}
      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Основное</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
          {[
            ['Название', semi.name || '—'],
            ['Группа', semi.categoryPath || '—'],
            ['Выход, г', semi.actualOutput || '—'],
            ['Ед. изм.', semi.unit || 'г'],
            ['Статус', STATUS_LABELS[semi.status] || semi.status],
            ['Дата создания', formatDate(semi.createdAt)],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 14, fontWeight: 700, color: '#0f172a' }}>{value}</div>
            </div>
          ))}
        </div>
      </section>

      {/* ВЫХОД И ПОТЕРИ */}
      <section style={SECTION}>
        <h2 style={{ marginTop: 0, color: '#16332b' }}>Выход и потери</h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12 }}>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', marginBottom: 4 }}>Фактический выход, г</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16332b' }}>{actualOutput || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', marginBottom: 4 }}>Входной вес, г</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#16332b' }}>{totalInput.toFixed(0) || '—'}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', marginBottom: 4 }}>Потери, г</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: losses > 0 ? '#dc2626' : '#a39f98' }}>{losses.toFixed(0)}</div>
          </div>
          <div>
            <div style={{ fontSize: 11, fontWeight: 700, color: '#6b6560', marginBottom: 4 }}>% потерь</div>
            <div style={{ fontSize: 16, fontWeight: 700, color: '#dc2626' }}>{lossesPercent}%</div>
          </div>
        </div>
      </section>

      {/* ИНГРЕДИЕНТЫ */}
      {semi.rows && semi.rows.length > 0 && (
        <section style={SECTION}>
          <h2 style={{ marginTop: 0, color: '#16332b' }}>Ингредиенты</h2>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
            <thead>
              <tr>
                <th style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280', fontWeight: 700 }}>Наименование</th>
                <th style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280', fontWeight: 700 }}>Тип</th>
                <th style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280', fontWeight: 700 }}>Кол-во</th>
              </tr>
            </thead>
            <tbody>
              {semi.rows.map((row, i) => (
                <tr key={i}>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', fontWeight: 800 }}>{row.name}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', color: '#6b7280', fontWeight: 600 }}>{TYPE_LABELS[row.type] || row.type}</td>
                  <td style={{ padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top', fontWeight: 900 }}>{formatQty(row)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      )}

      {/* СПОСОБ ПРИГОТОВЛЕНИЯ */}
      {semi.cookingMethod && (
        <section style={SECTION}>
          <h2 style={{ marginTop: 0, color: '#16332b' }}>Способ приготовления</h2>
          <div style={{ fontSize: 12.6, lineHeight: 1.55, color: '#374151', whiteSpace: 'pre-wrap' }}>{semi.cookingMethod}</div>
        </section>
      )}

      {/* CONFIRMATION DIALOG - Portal to body */}
      {confirmDelete && createPortal(
        <div style={{
          position: 'fixed',
          inset: 0,
          background: 'rgba(0, 0, 0, .45)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            position: 'relative',
            width: 420,
            maxWidth: '90vw',
            background: '#fff',
            borderRadius: 16,
            padding: 28,
            boxShadow: '0 20px 60px rgba(0,0,0,.15)'
          }}>
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Удалить полуфабрикат?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b6560', lineHeight: 1.5 }}>Это действие нельзя отменить.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDelete(false)} style={SEL_ST}>Отмена</button>
              <button onClick={() => { onDelete(); setConfirmDelete(false) }} style={{ ...PRIMARY, background: '#dc2626' }}>Удалить</button>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  )
}

// ============ ПЕЧАТЬ ============

function makePrintableSemifinished(semi) {
  const rows = semi.rows || []
  const actualOutput = parseFloat(semi.actualOutput) || 0
  const totalInput = rows.reduce((sum, row) => sum + (parseFloat(row.qty) || 0), 0)
  const losses = totalInput - actualOutput
  const lossesPercent = totalInput > 0 ? (losses / totalInput * 100).toFixed(1) : 0

  const rowsHtml = rows.map(row => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td class="muted">${escapeHtml(TYPE_LABELS[row.type] || row.type)}</td>
      <td class="qty">${escapeHtml(formatQty(row))}</td>
    </tr>
  `).join('')

  const normalizedRows = actualOutput > 0
    ? rows.map(row => ({
        ...row,
        qtyNormalized: (parseFloat(row.qty) || 0) * 1000 / actualOutput
      }))
    : rows

  const normalizedHtml = normalizedRows.map(row => `
    <tr>
      <td>${escapeHtml(row.name)}</td>
      <td class="muted">${escapeHtml(TYPE_LABELS[row.type] || row.type)}</td>
      <td class="qty">${row.qtyNormalized ? row.qtyNormalized.toFixed(1) : '—'}</td>
    </tr>
  `).join('')

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${escapeHtml(semi.name || 'Полуфабрикат')}</title>
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;background:#f4efe7;font-family:Inter,Manrope,Arial,Helvetica,sans-serif;color:#1f2937}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#faf8f5;padding:16mm;display:flex;flex-direction:column;gap:6mm;position:relative;overflow:hidden}
  .page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 10% 12%,rgba(22,51,43,.06),transparent 25%),radial-gradient(circle at 88% 4%,rgba(185,145,80,.08),transparent 22%);pointer-events:none}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;gap:6mm}
  .kicker{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#7a6f62;font-weight:800;text-align:center}
  h1{margin:0;text-align:center;font-size:28px;line-height:1.08;color:#16332b;letter-spacing:-.03em;font-weight:900}
  .meta{display:grid;grid-template-columns:repeat(4,1fr);gap:10px}
  .meta-card{background:#fff;border:1px solid #ece8df;border-radius:16px;padding:10px 12px;box-shadow:0 4px 14px rgba(31,41,55,.04)}
  .meta-label{font-size:10px;text-transform:uppercase;letter-spacing:.12em;color:#8b8174;font-weight:800;margin-bottom:4px}
  .meta-value{font-size:14px;color:#1f2937;font-weight:900}
  .grid{display:grid;grid-template-columns:.95fr 1.05fr;gap:11px;align-items:start}
  .block{background:#fff;border:1px solid #ece8df;border-radius:20px;padding:14px;box-shadow:0 8px 24px rgba(31,41,55,.045)}
  h2{margin:0 0 10px;font-size:16px;color:#16332b;letter-spacing:-.01em}
  .text{font-size:12.6px;line-height:1.55;color:#374151;white-space:pre-wrap}
  table{width:100%;border-collapse:collapse;table-layout:fixed;font-size:12.2px;line-height:1.3}
  th{padding:8px;background:#f8f6f2;border-bottom:1px solid #ebe7de;text-align:left;font-size:10px;text-transform:uppercase;letter-spacing:.08em;color:#8b8174}
  td{padding:8px;border-bottom:1px solid #f0ede6;vertical-align:middle;word-break:break-word;color:#1f2937}
  th:nth-child(1),td:nth-child(1){width:52%;font-weight:800}
  th:nth-child(2),td:nth-child(2){width:20%;text-align:center}
  th:nth-child(3),td:nth-child(3){width:28%;text-align:center}
  .muted{color:#6b7280;font-weight:600}
  .qty{font-weight:900}
  .wide{grid-column:1 / -1}
  @media print{body{background:#fff}.page{margin:0;width:210mm;min-height:297mm;box-shadow:none}}
</style>
</head>
<body>
<main class="page">
  <div class="content">
    <div class="kicker">ChefCloud · ТТК полуфабриката</div>
    <h1>${escapeHtml(semi.name || 'Полуфабрикат')}</h1>

    <div class="meta">
      <div class="meta-card"><div class="meta-label">Фактический выход</div><div class="meta-value">${actualOutput || '—'} г</div></div>
      <div class="meta-card"><div class="meta-label">Входной вес</div><div class="meta-value">${totalInput.toFixed(0)} г</div></div>
      <div class="meta-card"><div class="meta-label">Потери</div><div class="meta-value">${losses.toFixed(0)} г</div></div>
      <div class="meta-card"><div class="meta-label">% потерь</div><div class="meta-value">${lossesPercent}%</div></div>
    </div>

    ${rows.length > 0 ? `
      <section class="block">
        <h2>Фактическая закладка ингредиентов</h2>
        <table>
          <thead><tr><th>Наименование</th><th>Тип</th><th>Кол-во</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>
    ` : ''}

    ${actualOutput > 0 && rows.length > 0 ? `
      <section class="block">
        <h2>Нормализация на 1000 г выхода</h2>
        <table>
          <thead><tr><th>Наименование</th><th>Тип</th><th>Кол-во на 1000 г</th></tr></thead>
          <tbody>${normalizedHtml}</tbody>
        </table>
      </section>
    ` : ''}

    ${semi.cookingMethod ? `
      <section class="block wide">
        <h2>Способ приготовления</h2>
        <div class="text">${escapeHtml(semi.cookingMethod)}</div>
      </section>
    ` : ''}
  </div>
</main>
</body>
</html>`
}

// ============ ДИАЛОГ ПОДТВЕРЖДЕНИЯ ============

function ConfirmDialog({ title, message, onConfirm, onCancel }) {
  return createPortal(
    <div style={{
      position: 'fixed',
      inset: 0,
      background: 'rgba(0,0,0,.45)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 9999,
    }}>
      <div style={{
        background: '#fff',
        borderRadius: 16,
        padding: '24px 28px',
        maxWidth: 400,
        boxShadow: '0 20px 60px rgba(0,0,0,.2)',
      }}>
        <h3 style={{ margin: '0 0 12px', fontSize: 16, fontWeight: 700, color: '#0f172a' }}>
          {title}
        </h3>
        <p style={{ margin: '0 0 24px', fontSize: 14, color: '#64748b' }}>
          {message}
        </p>
        <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
          <button
            onClick={onCancel}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: '1px solid #e2e8f0',
              background: '#fff',
              color: '#475569',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Отмена
          </button>
          <button
            onClick={onConfirm}
            style={{
              padding: '8px 16px',
              borderRadius: 8,
              border: 'none',
              background: '#dc2626',
              color: '#fff',
              fontWeight: 600,
              cursor: 'pointer',
              fontSize: 14,
            }}
          >
            Удалить
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}

// ============ ГЛАВНЫЙ КОМПОНЕНТ ============

export default function SemifinishedPage({ items = [], products = [], onSave, onDelete, onImport, onSaveProduct, onSaveSemifinishedItem }) {
  const [query, setQuery] = useState('')
  const [selectedGroup, setSelectedGroup] = useState('all')
  const [selectedStatus, setSelectedStatus] = useState('active')
  const [view, setView] = useState('list') // 'list' | 'view' | 'edit'
  const [selectedSemi, setSelectedSemi] = useState(null)
  const [message, setMessage] = useState('')
  const [selectedIds, setSelectedIds] = useState(new Set())
  const [confirmDialog, setConfirmDialog] = useState(null)

  // Вычисляем группы: стандартные категории + созданные пользователем
  const groups = useMemo(() => {
    const set = new Set(SEMIFINISHED_CATEGORIES)
    // Добавить группы из существующих полуфабрикатов
    items
      .map(item => (item.categoryPath || item.category || '').trim())
      .filter(Boolean)
      .forEach(group => set.add(group))

    const uniqueGroupNames = [...set].sort()
    return uniqueGroupNames.map(name => ({ name, depth: 0 }))
  }, [items])

  // Фильтруем список
  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      const haystack = [item.name, item.categoryPath, item.category, item.cookingMethod, item.description].join(' ').toLowerCase()
      const groupMatch = selectedGroup === 'all' || (item.categoryPath || item.category) === selectedGroup
      const statusMatch = selectedStatus === 'all' || item.status === selectedStatus
      return groupMatch && statusMatch && (!needle || haystack.includes(needle))
    })
  }, [items, query, selectedGroup, selectedStatus])

  const toggleSelect = (id, e) => {
    e.stopPropagation()
    setSelectedIds(prev => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  const handleSelectAll = () => {
    setSelectedIds(new Set(filtered.map(s => s.id)))
  }

  const handleCancelSelection = () => {
    setSelectedIds(new Set())
  }

  const handleDeleteSelected = () => {
    setConfirmDialog({
      title: 'Удалить полуфабрикаты?',
      message: `Вы уверены? Это действие удалит ${selectedIds.size} полуфабрикат(ов) и не может быть отменено.`,
      onConfirm: () => {
        Array.from(selectedIds).forEach(id => onDelete(id))
        setSelectedIds(new Set())
        setMessage('Полуфабрикаты удалены')
        setConfirmDialog(null)
      },
      onCancel: () => setConfirmDialog(null),
    })
  }

  const handlePrintSelected = () => {
    const selected = filtered.filter(s => selectedIds.has(s.id))
    if (selected.length === 0) return

    // Генерируем HTML для печати
    const html = makePrintableHtml(selected)
    const blob = new Blob([html], { type: 'text/html' })
    const url = URL.createObjectURL(blob)
    const win = window.open(url, 'print')
    if (win) {
      win.onload = () => {
        win.print()
        URL.revokeObjectURL(url)
      }
    }
    setMessage(`Печать ${selected.length} полуфабрикат(ов)`)
  }

  function handleSaveNomenclatureItem(item) {
    // Роутим в нужную функцию в зависимости от source
    if (item.source === 'semifinished') {
      onSaveSemifinishedItem(item) // Сохраняем как полуфабрикат
    } else {
      onSaveProduct(item) // Сохраняем как товар
    }
  }

  function handleSave(form) {
    if (!onSave) {
      alert('Ошибка: onSave не определена')
      return
    }
    try {
      onSave(form)
      setMessage('Полуфабрикат сохранён')
      setSelectedSemi(form)
      setView('view')
    } catch (err) {
      alert(`Ошибка при сохранении: ${err.message}`)
    }
  }

  function handleDelete(id) {
    onDelete(id)
    setMessage('Полуфабрикат удалён')
    setView('list')
    setSelectedSemi(null)
  }

  function handleArchive(id) {
    const item = items.find(i => i.id === id)
    if (item) {
      onSave({ ...item, status: 'archived' })
      setMessage('Полуфабрикат отправлен в архив')
      setView('list')
      setSelectedSemi(null)
    }
  }

  if (view === 'view' && selectedSemi) {
    return <SemifinishedView
      semi={selectedSemi}
      onBack={() => { setView('list'); setSelectedSemi(null) }}
      onEdit={() => setView('edit')}
      onDelete={() => handleDelete(selectedSemi.id)}
      onArchive={() => handleArchive(selectedSemi.id)}
      onDuplicate={(duplicate) => { onSave(duplicate); setMessage('Полуфабрикат дублирован') }}
    />
  }

  if (view === 'edit') {
    return <SemifinishedForm
      initial={selectedSemi}
      nomenclature={products}
      items={items}
      onSaveNomenclatureItem={handleSaveNomenclatureItem}
      onCancel={() => { setView(selectedSemi ? 'view' : 'list'); if (!selectedSemi) setSelectedSemi(null) }}
      onSave={handleSave}
    />
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
      <section style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12 }}>
        <div>
          <h1 style={{ margin: '0 0 6px', fontSize: 28, color: '#0f172a' }}>🥣 Полуфабрикаты</h1>
          <div style={{ color: '#64748b', fontSize: 14 }}>Справочник заготовок, соусов, баз и полуготовых компонентов</div>
        </div>
        <button type="button" onClick={() => { setSelectedSemi(null); setView('edit') }} style={PRIMARY}>+ Новый полуфабрикат</button>
      </section>

      {message && <div style={{ ...SECTION, padding: 12, color: '#16a34a', fontWeight: 600 }}>{message}</div>}

      <section style={{ ...SECTION, display: 'grid', gridTemplateColumns: '260px 1fr', gap: 14 }}>
        <aside style={{ borderRight: '1px solid #e5e7eb', paddingRight: 14 }}>
          {/* Фильтр по статусам */}
          <div style={{ marginBottom: 20 }}>
            {['processing', 'active', 'archived'].map(status => (
              <button
                key={status}
                type="button"
                onClick={() => setSelectedStatus(status)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontWeight: selectedStatus === status ? 700 : 500,
                  background: selectedStatus === status ? '#eef2ff' : 'transparent',
                  color: selectedStatus === status ? '#4338ca' : '#475569',
                  marginBottom: 2,
                }}
              >
                {`${['🟠', '🟢', '⚫'][['processing', 'active', 'archived'].indexOf(status)]} ${STATUS_LABELS[status]} (${items.filter(i => i.status === status).length})`}
              </button>
            ))}
          </div>

          {/* Фильтр по группам */}
          <div>
            <div style={{ fontSize: 11, fontWeight: 900, color: '#6b7280', textTransform: 'uppercase', marginBottom: 8, borderBottom: '1px solid #e5e7eb', paddingBottom: 8 }}>Группы</div>
            <button
              type="button"
              onClick={() => setSelectedGroup('all')}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                border: 'none',
                borderRadius: 8,
                padding: '8px 10px',
                cursor: 'pointer',
                fontWeight: selectedGroup === 'all' ? 700 : 500,
                background: selectedGroup === 'all' ? '#eef2ff' : 'transparent',
                color: selectedGroup === 'all' ? '#4338ca' : '#475569',
                marginBottom: 2,
              }}
            >
              Все группы
            </button>
            {groups.map(group => (
              <button
                key={group.name}
                type="button"
                onClick={() => setSelectedGroup(group.name)}
                style={{
                  display: 'block',
                  width: '100%',
                  textAlign: 'left',
                  border: 'none',
                  borderRadius: 8,
                  padding: '8px 10px',
                  cursor: 'pointer',
                  fontWeight: selectedGroup === group.name ? 700 : 500,
                  background: selectedGroup === group.name ? '#eef2ff' : 'transparent',
                  color: selectedGroup === group.name ? '#4338ca' : '#475569',
                  marginBottom: 2,
                }}
              >
                {group.name} ({items.filter(i => (i.categoryPath || i.category) === group.name).length})
              </button>
            ))}
          </div>
        </aside>

        <div>
          <div style={{ position: 'relative', marginBottom: 12 }}>
            <span style={{ position: 'absolute', left: 11, top: '50%', transform: 'translateY(-50%)', color: '#a39f98', pointerEvents: 'none' }}>
              🔍
            </span>
            <input
              value={query}
              onChange={e => setQuery(e.target.value)}
              placeholder="Поиск полуфабриката…"
              style={{ paddingLeft: 32, paddingRight: query ? 28 : 12, padding: '9px 12px 9px 32px', border: '1.5px solid #e8e2d8', borderRadius: 12, fontSize: 13, outline: 'none', background: '#faf8f4', color: '#1a1a1a', width: '100%', fontFamily: 'inherit', transition: 'border-color .15s' }}
            />
            {query && (
              <button onClick={() => setQuery('')} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'none', cursor: 'pointer', color: '#a39f98', padding: 2 }}>
                ✕
              </button>
            )}
          </div>

          {selectedIds.size > 0 && (
            <div style={{ background: '#f0fdf4', border: '1px solid #dcfce7', borderRadius: 12, padding: 12, marginBottom: 16, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ color: '#166534', fontWeight: 500 }}>
                Выбрано: {selectedIds.size} из {filtered.length}
              </span>
              <div style={{ display: 'flex', gap: 8 }}>
                <button onClick={handleSelectAll} style={{ ...SEL_ST, background: '#0891b2', color: '#fff', fontSize: 13 }}>
                  ☑️ Выделить всё
                </button>
                <button onClick={handleCancelSelection} style={{ ...SEL_ST, background: '#6b7280', color: '#fff', fontSize: 13 }}>
                  ☐ Отмена
                </button>
                <button onClick={handlePrintSelected} style={{ ...SEL_ST, background: '#059669', color: '#fff', fontSize: 13 }}>
                  🖨️ Печать ({selectedIds.size})
                </button>
                <button onClick={handleDeleteSelected} style={{ ...SEL_ST, background: '#dc2626', color: '#fff', fontSize: 13 }}>
                  🗑️ Удалить ({selectedIds.size})
                </button>
              </div>
            </div>
          )}

          {filtered.length === 0 ? (
            <div style={{ textAlign: 'center', color: '#94a3b8', padding: 34 }}>
              Полуфабрикаты не найдены
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(270px, 1fr))', gap: 16 }}>
              {filtered.map(semi => {
                const isSelected = selectedIds.has(semi.id)
                return (
                <div
                  key={semi.id}
                  onClick={() => { setSelectedSemi(semi); setView('view') }}
                  style={{
                    border: isSelected ? '2px solid #059669' : '1px solid #ede9e0',
                    borderRadius: 20,
                    padding: '14px 16px 16px',
                    background: isSelected ? '#f0fdf4' : '#fff',
                    boxShadow: isSelected ? '0 0 0 3px rgba(5,150,105,.1)' : '0 1px 4px rgba(0,0,0,.06)',
                    cursor: 'pointer',
                    transition: 'all .18s ease',
                  }}
                  onMouseEnter={e => { e.currentTarget.style.boxShadow = '0 6px 24px rgba(0,0,0,.10)'; e.currentTarget.style.transform = 'translateY(-2px)' }}
                  onMouseLeave={e => { e.currentTarget.style.boxShadow = isSelected ? '0 0 0 3px rgba(5,150,105,.1)' : '0 1px 4px rgba(0,0,0,.06)'; e.currentTarget.style.transform = 'none' }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12, gap: 8 }}>
                    <input
                      type="checkbox"
                      checked={isSelected}
                      onChange={e => toggleSelect(semi.id, e)}
                      onClick={e => e.stopPropagation()}
                      style={{ width: 18, height: 18, marginTop: 2, cursor: 'pointer' }}
                    />
                    <div style={{ fontWeight: 700, fontSize: 15, color: '#0f172a', flex: 1 }}>{semi.name || 'Без названия'}</div>
                  </div>
                  <div style={{ fontSize: 12, color: '#a39f98', lineHeight: 1.6, marginBottom: 12 }}>
                    {semi.categoryPath && <>{semi.categoryPath} · </>}
                    Выход {semi.actualOutput || '—'} г
                  </div>
                  <div style={{ padding: '8px', background: '#f8f6f2', borderRadius: 8, fontSize: 12, color: '#6b6560', marginBottom: 12 }}>
                    <strong>{semi.rows?.length || 0}</strong> ингредиент{(semi.rows?.length || 0) % 10 === 1 ? '' : (semi.rows?.length || 0) % 10 < 5 ? 'а' : 'ов'}
                  </div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: STATUS_COLORS[semi.status] || '#64748b' }}>
                    {STATUS_LABELS[semi.status] || semi.status}
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>
      </section>

      {confirmDialog && (
        <ConfirmDialog
          title={confirmDialog.title}
          message={confirmDialog.message}
          onConfirm={confirmDialog.onConfirm}
          onCancel={confirmDialog.onCancel}
        />
      )}
    </div>
  )
}
