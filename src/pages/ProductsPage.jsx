import { useMemo, useState, useEffect } from 'react'
import { createPortal } from 'react-dom'
import { SEL_ST, SECTION, FIELD, INPUT, TEXTAREA, PRIMARY, TH, TD } from '../shared-styles.js'
import { createEmptyProduct } from '../hooks/useProducts.js'
import { useNutritionSuggest } from '../hooks/useNutritionSuggest.js'
import { NutritionSuggestModal } from '../components/NutritionSuggestModal.jsx'

const PRODUCT_CATEGORIES = [
  'Мясо', 'Птица', 'Рыба', 'Морепродукты',
  'Овощи', 'Фрукты', 'Зелень', 'Грибы',
  'Сыры', 'Молочные продукты',
  'Мука и крупы', 'Макаронные изделия', 'Бобовые',
  'Соусы', 'Специи', 'Масла и жиры',
  'Консервация', 'Заморозка',
  'Хлеб и выпечка', 'Напитки', 'Бар',
  'Упаковка', 'Хозтовары', 'Прочее',
]

const UNITS = [
  'г', 'мл', 'шт', 'л', 'ед', 'порц', 'кг', 'бутыль', 'пакет',
]


function parseCsv(text) {
  const rows = []
  let current = ''
  let row = []
  let quoted = false

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i]
    const next = text[i + 1]

    if (char === '"' && quoted && next === '"') {
      current += '"'
      i += 1
    } else if (char === '"') {
      quoted = !quoted
    } else if (char === ',' && !quoted) {
      row.push(current.trim())
      current = ''
    } else if ((char === '\n' || char === '\r') && !quoted) {
      if (char === '\r' && next === '\n') i += 1
      row.push(current.trim())
      if (row.some(Boolean)) rows.push(row)
      row = []
      current = ''
    } else {
      current += char
    }
  }

  row.push(current.trim())
  if (row.some(Boolean)) rows.push(row)

  if (rows.length < 2) return []
  const headers = rows[0].map(header => header.trim())
  return rows.slice(1).map(values => Object.fromEntries(headers.map((header, index) => [header, values[index] || ''])))
}

async function fileToText(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => resolve(reader.result)
    reader.onerror = reject
    reader.readAsText(file)
  })
}

function parseJsonImport(text) {
  const parsed = JSON.parse(text)
  if (Array.isArray(parsed)) return parsed
  if (Array.isArray(parsed.items)) return parsed.items
  if (Array.isArray(parsed.products)) return parsed.products
  if (Array.isArray(parsed.nomenclature)) return parsed.nomenclature
  return []
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  link.click()
  URL.revokeObjectURL(url)
}

function categorySegments(item) {
  const source = item.categoryPath || item.category || 'Без группы'
  return String(source).split('/').map(part => part.trim()).filter(Boolean)
}

function buildCategoryTree(items) {
  const root = {}

  items.forEach(item => {
    let node = root
    categorySegments(item).forEach(segment => {
      if (!node[segment]) node[segment] = {}
      node = node[segment]
    })
  })

  return root
}

function flattenTree(tree, depth = 0) {
  return Object.entries(tree).flatMap(([name, children]) => [
    { name, depth },
    ...flattenTree(children, depth + 1),
  ])
}

function Field({ label, children }) {
  return <label style={FIELD}><span style={{ fontSize:12, fontWeight:800, color:'#475569' }}>{label}</span>{children}</label>
}

function TextField({ label, value, onChange }) {
  return <Field label={label}><input value={value || ''} onChange={e => onChange(e.target.value)} style={INPUT} /></Field>
}

function ProductForm({ initial, onSave, onCancel }) {
  const [form, setForm] = useState(() => initial || createEmptyProduct())
  const [showSuggestModal, setShowSuggestModal] = useState(false)
  const { loading, error, result, suggest, reset } = useNutritionSuggest()

  // Обновить форму когда изменяется initial (когда пользователь кликает на другой товар)
  useEffect(() => {
    if (initial) {
      setForm(initial)
    }
  }, [initial?.id])

  function update(field, value) {
    setForm(current => {
      const updated = { ...current, [field]: value }
      // Если поле "Наименование" изменилось и содержит "пф", автоматически устанавливаем как полуфабрикат
      if (field === 'name' && detectSemifinished(value)) {
        updated.source = 'semifinished'
      }
      return updated
    })
  }

  // Определить является ли товар полуфабрикатом по названию
  function detectSemifinished(name) {
    const normalizedName = (name || '').toLowerCase()
    // Проверяем наличие сокращений п/ф, п\ф, пф
    return /п[/\\]?ф|п\.ф\./.test(normalizedName)
  }

  function handleSuggestNutrition() {
    setShowSuggestModal(true)
    suggest(form.name, form.category, form.type, form.unit)
  }

  function handleSuggestCancel() {
    setShowSuggestModal(false)
    reset()
  }

  function handleSuggestAccept(suggestion) {
    setForm(current => ({
      ...current,
      proteinPer100: suggestion.proteinPer100,
      fatPer100: suggestion.fatPer100,
      carbsPer100: suggestion.carbsPer100,
      caloriesPer100: suggestion.caloriesPer100,
    }))
    setShowSuggestModal(false)
    reset()
  }

  return (
    <form onSubmit={e => {
      e.preventDefault()
      onSave(form)
    }} style={{ ...SECTION, display:'flex', flexDirection:'column', gap:10 }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h2 style={{ margin:'0 0 2px' }}>{initial ? 'Редактировать товар' : 'Добавить товар'}</h2>
          <div style={{ color:'#64748b', fontSize:13 }}>Товар — это сырьё: рыба, овощи, соусы поставщика, специи, упаковка.</div>
        </div>
        <div style={{ display:'flex', gap:8 }}>
          <button type="button" onClick={onCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      {/* БЛОК 1: ОСНОВНОЕ */}
      <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:8 }}>
        <div style={{ fontSize:12, fontWeight:900, color:'#475569', marginBottom:8 }}>ОСНОВНОЕ</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
          <TextField label="Наименование *" value={form.name} onChange={v => update('name', v)} />
          <Field label="Категория *">
            <select value={form.category || ''} onChange={e => update('category', e.target.value)} style={INPUT}>
              <option value="">Выберите категорию</option>
              {PRODUCT_CATEGORIES.map(cat => <option key={cat} value={cat}>{cat}</option>)}
            </select>
          </Field>
        </div>
      </div>

      {/* БЛОК 2: ПАРАМЕТРЫ */}
      <div style={{ borderTop:'1px solid #e5e7eb', paddingTop:8 }}>
        <div style={{ fontSize:12, fontWeight:900, color:'#475569', marginBottom:8 }}>ПАРАМЕТРЫ</div>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fit,minmax(200px,1fr))', gap:8 }}>
          <Field label="Сохранить как">
            <select value={form.source || 'product'} onChange={e => update('source', e.target.value)} style={INPUT}>
              <option value="product">Товар</option>
              <option value="semifinished">Полуфабрикат</option>
            </select>
          </Field>
          <Field label="Ед. изм.">
            <select value={form.unit || 'г'} onChange={e => update('unit', e.target.value)} style={INPUT}>
              {UNITS.map(u => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <Field label="Комментарий">
          <textarea spellCheck="false" value={form.comment || ''} onChange={e => update('comment', e.target.value)} style={TEXTAREA} placeholder="Дополнительная информация" />
        </Field>
      </div>

    </form>
  )
}

export function ProductsPage({ items, onSave, onDelete, onImport }) {
  const [query, setQuery] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('all')
  const [selectedProduct, setSelectedProduct] = useState(null)
  const [isDrawerOpen, setIsDrawerOpen] = useState(false)
  const [isCreating, setIsCreating] = useState(false)
  const [activeTab, setActiveTab] = useState('main')
  const [message, setMessage] = useState('')
  const [activeMenuId, setActiveMenuId] = useState(null)
  const [confirmDeleteId, setConfirmDeleteId] = useState(null)

  const tree = useMemo(() => buildCategoryTree(items), [items])
  const groups = useMemo(() => flattenTree(tree), [tree])

  // Подсчёт товаров по категориям
  const categoryCounts = useMemo(() => {
    const counts = { all: items.length }
    items.forEach(item => {
      const cat = item.category || 'Без группы'
      counts[cat] = (counts[cat] || 0) + 1
    })
    return counts
  }, [items])

  const filtered = useMemo(() => {
    const needle = query.trim().toLowerCase()
    return items.filter(item => {
      const haystack = [item.name, item.category, item.categoryPath, item.unit, item.comment].join(' ').toLowerCase()
      // Используем category как основной фильтр, categoryPath как резервный
      const itemCategory = item.category || item.categoryPath || 'Без группы'
      const matchesCategory = selectedCategory === 'all' || itemCategory === selectedCategory
      return matchesCategory && (!needle || haystack.includes(needle))
    })
  }, [items, query, selectedCategory])

  function startCreate() {
    setSelectedProduct(createEmptyProduct())
    setIsDrawerOpen(true)
    setIsCreating(true)
    setActiveTab('main')
  }

  function openProduct(product) {
    setSelectedProduct(product)
    setIsDrawerOpen(true)
    setIsCreating(false)
    setActiveTab('main')
    setActiveMenuId(null)
  }

  function closeDrawer() {
    setIsDrawerOpen(false)
    setTimeout(() => {
      setSelectedProduct(null)
    }, 300)
  }

  function handleSave(form) {
    const oldCategory = selectedProduct?.category
    const newCategory = form.category

    onSave(form)

    // Если категория товара изменилась, переключить на "Все товары"
    if (oldCategory !== newCategory) {
      setSelectedCategory('all')
    }

    closeDrawer()
    setMessage('Товар сохранён')
  }

  function toggleMenu(e, productId) {
    e.stopPropagation()
    setActiveMenuId(activeMenuId === productId ? null : productId)
  }

  function handleDeleteClick(e, productId) {
    e.stopPropagation()
    setConfirmDeleteId(productId)
    setActiveMenuId(null)
  }

  function confirmDelete() {
    if (confirmDeleteId) {
      onDelete(confirmDeleteId)
      setConfirmDeleteId(null)
      if (selectedProduct?.id === confirmDeleteId) {
        closeDrawer()
      }
    }
  }

  function handleDuplicate(e, product) {
    e.stopPropagation()
    const newProduct = { ...product, id: Math.random().toString(36).substr(2, 9) }
    onSave(newProduct)
    setActiveMenuId(null)
    setMessage('Товар скопирован')
  }

  async function handleImport(file) {
    if (!file) return

    try {
      const text = await fileToText(file)
      const rows = file.name.toLowerCase().endsWith('.json') ? parseJsonImport(text) : parseCsv(text)
      const count = onImport(rows)
      setMessage(`Импортировано товаров: ${count}`)
    } catch {
      setMessage('Не удалось импортировать файл. Проверьте формат и попробуйте снова.')
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, paddingRight: isDrawerOpen ? 480 : 0, transition: 'padding-right 0.3s ease' }}>
      {/* ШАПКА */}
      <section style={{ ...SECTION, display:'flex', justifyContent:'space-between', alignItems:'center', gap:12 }}>
        <div>
          <h1 style={{ margin:'0 0 6px', fontSize:28, color:'#0f172a' }}>📦 Товары <span style={{ fontSize:16, fontWeight:400, color:'#94a3b8' }}>{items.length}</span></h1>
          <div style={{ color:'#64748b', fontSize:14 }}>Справочник ингредиентов и продуктов</div>
        </div>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          <label style={SEL_ST}>Импорт<input type="file" accept=".json,.csv" onChange={e => handleImport(e.target.files?.[0])} style={{ display:'none' }} /></label>
          <button type="button" onClick={() => downloadJson(`Products-${new Date().toISOString().slice(0, 10)}.json`, items)} style={SEL_ST}>Экспорт</button>
          <button type="button" onClick={startCreate} style={PRIMARY}>+ Добавить товар</button>
        </div>
      </section>

      {/* ПОИСК */}
      <section style={{ ...SECTION }}>
        <input value={query} onChange={e => setQuery(e.target.value)} placeholder="Поиск по названию..." style={{ ...INPUT, width:'100%' }} />
      </section>

      {/* ОСНОВНАЯ РАБОЧАЯ ЗОНА: ТРИ КОЛОНКИ */}
      <div style={{ display:'flex', gap:16, flex:1, minHeight:'500px' }}>
        {/* ЛЕВАЯ КОЛОНКА: КАТЕГОРИИ */}
        <section style={{ ...SECTION, width:240, flexShrink:0, display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
          <div style={{ padding:'16px 20px', borderBottom:'1px solid #e5e7eb', fontSize:12, fontWeight:900, color:'#64748b', background:'#faf9f7' }}>Категории</div>
          <div style={{ flex:1, overflowY:'auto' }}>
            <button type="button" onClick={() => setSelectedCategory('all')} style={{ ...GROUP_BTN, background:selectedCategory === 'all' ? 'rgba(34,197,94,.1)' : 'transparent', color:selectedCategory === 'all' ? '#16a34a' : '#475569', display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', paddingLeft:16, paddingRight:16 }}>
              <span>Все товары</span>
              <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>{categoryCounts.all}</span>
            </button>
            {PRODUCT_CATEGORIES.map(cat => (
              <button key={cat} type="button" onClick={() => setSelectedCategory(cat)} style={{ ...GROUP_BTN, background:selectedCategory === cat ? 'rgba(34,197,94,.1)' : 'transparent', color:selectedCategory === cat ? '#16a34a' : '#475569', display:'flex', justifyContent:'space-between', alignItems:'center', width:'100%', paddingLeft:16, paddingRight:16 }}>
                <span>{cat}</span>
                <span style={{ fontSize:11, fontWeight:700, color:'#94a3b8' }}>{categoryCounts[cat] || 0}</span>
              </button>
            ))}
          </div>
        </section>

        {/* ЦЕНТР: ТАБЛИЦА ТОВАРОВ */}
        <section style={{ ...SECTION, flex:1, display:'flex', flexDirection:'column', padding:0, overflow:'hidden' }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', padding:'16px 20px', borderBottom:'1px solid #e5e7eb', background:'#faf9f7' }}>
            <h2 style={{ margin:0, fontSize:14, fontWeight:700, color:'#0f172a' }}>Товары ({filtered.length})</h2>
          </div>

          {message && <div style={{ padding:'12px 20px', color:'#166534', background:'#f0fdf4', fontSize:12, borderBottom:'1px solid #e5e7eb' }}>{message}</div>}

          <div style={{ flex:1, overflowY:'auto' }}>
            {filtered.length === 0 ? (
              <div style={{ textAlign:'center', color:'#94a3b8', padding:40 }}>Товары отсутствуют</div>
            ) : (
              <div style={{ overflowX:'auto' }}>
                <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
                  <thead>
                    <tr>{['НАЗВАНИЕ', 'ЕД.', ''].map(h => <th key={h} style={TH}>{h}</th>)}</tr>
                  </thead>
                  <tbody>
                    {filtered.map(item => (
                      <tr key={item.id} onClick={() => openProduct(item)} style={{ cursor:'pointer', background:selectedProduct?.id === item.id ? '#eef2ff' : 'transparent', transition:'background 0.15s' }}>
                        <td style={{ ...TD, fontWeight:700, color:'#0f172a' }}>{item.name}</td>
                        <td style={TD}>{item.unit || '—'}</td>
                        <td style={{ ...TD, textAlign:'center', position:'relative' }}>
                          <button onClick={(e) => toggleMenu(e, item.id)} style={{ background:'none', border:'none', cursor:'pointer', fontSize:16, padding:'4px 8px' }}>⋯</button>
                          {activeMenuId === item.id && (
                            <div style={{
                              position:'absolute', top:'100%', right:0, background:'#fff', border:'1px solid #e8e2d8', borderRadius:8,
                              boxShadow:'0 4px 12px rgba(0,0,0,.1)', zIndex:1000, minWidth:160
                            }}>
                              <button type="button" onClick={(e) => { e.stopPropagation(); openProduct(item); setActiveMenuId(null) }}
                                style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#1a1a1a', borderBottom:'1px solid #f0ebe2' }}>
                                ✏️ Редактировать
                              </button>
                              <button type="button" onClick={(e) => handleDuplicate(e, item)}
                                style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#1a1a1a', borderBottom:'1px solid #f0ebe2' }}>
                                📋 Дублировать
                              </button>
                              <button type="button" onClick={(e) => handleDeleteClick(e, item.id)}
                                style={{ display:'block', width:'100%', padding:'10px 14px', textAlign:'left', border:'none', background:'none', cursor:'pointer', fontSize:13, color:'#dc2626' }}>
                                🗑️ Удалить
                              </button>
                            </div>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </section>
      </div>

      {/* RIGHT DRAWER */}
      {isDrawerOpen && selectedProduct && (
        <div style={{
          position:'fixed', top:0, right:0, height:'100vh', width:480,
          background:'#fff',
          boxShadow:'-2px 0 8px rgba(0,0,0,.1)',
          zIndex:100,
          display:'flex', flexDirection:'column',
          animation:'slideIn 0.3s ease'
        }}>
          {/* Drawer Header */}
          <div style={{ padding:'14px 16px', borderBottom:'1px solid #e5e7eb', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
            <div>
              <h3 style={{ margin:'0 0 2px', fontSize:16, fontWeight:700 }}>{isCreating ? 'Новый товар' : selectedProduct.name}</h3>
              <div style={{ fontSize:12, color:'#64748b' }}>{isCreating ? 'Создание товара' : 'Редактирование товара'}</div>
            </div>
            <button onClick={closeDrawer} style={{ background:'none', border:'none', cursor:'pointer', fontSize:20 }}>✕</button>
          </div>

          {/* Drawer Content */}
          <div style={{ flex:1, overflowY:'auto', padding:'12px 16px' }}>
            <ProductForm initial={selectedProduct} onSave={handleSave} onCancel={closeDrawer} />
          </div>

        </div>
      )}

      {/* CONFIRMATION DIALOG - Portal to body */}
      {confirmDeleteId && createPortal(
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
            <h3 style={{ margin: '0 0 12px', fontSize: 18, fontWeight: 700, color: '#1a1a1a' }}>Удалить товар?</h3>
            <p style={{ margin: '0 0 20px', fontSize: 14, color: '#6b6560', lineHeight: 1.5 }}>Это действие нельзя отменить. Товар будет удалён безвозвратно.</p>
            <div style={{ display: 'flex', gap: 12, justifyContent: 'flex-end' }}>
              <button onClick={() => setConfirmDeleteId(null)} style={{ ...SEL_ST }}>Отмена</button>
              <button onClick={confirmDelete} style={{ ...PRIMARY, background: '#dc2626' }}>Удалить</button>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* CSS для анимации drawer */}
      <style>{`
        @keyframes slideIn {
          from { transform: translateX(480px); opacity: 0; }
          to { transform: translateX(0); opacity: 1; }
        }
      `}</style>
    </div>
  )
}

const GROUP_BTN = {
  display:'block',
  width:'100%',
  textAlign:'left',
  border:'none',
  borderRadius:8,
  padding:'8px 10px',
  cursor:'pointer',
  fontWeight:700,
  marginBottom:2,
}