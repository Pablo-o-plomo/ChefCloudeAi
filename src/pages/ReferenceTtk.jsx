import { useEffect, useMemo, useRef, useState } from 'react'
import { Tag, SEL_ST } from '../components/ui.jsx'
import { SearchIcon, CloseIcon } from '../components/icons.jsx'
import { createEmptyReferenceTtk, TTK_STATUSES } from '../hooks/useReferenceTtk.js'
import { NOMENCLATURE_TYPE_LABELS } from '../hooks/useNomenclature.js'

const STATUS_LABELS = {
  draft: 'Черновик',
  review: 'На проверке',
  approved: 'Утверждено',
}

const STATUS_COLORS = {
  draft: '#64748b',
  review: '#b45309',
  approved: '#0f766e',
}

const TYPE_LABELS = {
  product: 'Товар',
  semifinished: 'П/Ф',
  sauce: 'Соус',
  prep: 'Заготовка',
  nomenclature: 'Номенклатура',
}

const TYPE_BADGE = {
  product: { label: 'Товар', bg: 'transparent', color: '#6b7280' },
  semifinished: { label: 'П/Ф', bg: 'transparent', color: '#6b7280' },
  sauce: { label: 'Соус', bg: 'transparent', color: '#6b7280' },
  prep: { label: 'Заготовка', bg: 'transparent', color: '#6b7280' },
  nomenclature: { label: 'Номенклатура', bg: 'transparent', color: '#6b7280' },
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
    type: row.type || row.source || (row.semifinished ? 'semifinished' : 'product'),
    qty: row.qty || row.quantity || row.amount || '',
    unit: row.unit || '',
  }
}

function normalizeTtk(ttk = {}) {
  return {
    ...ttk,
    rows: (ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map(normalizeRow),
    technology: ttk.technology || ttk.cookingMethod || ttk.description || '',
    serving: ttk.serving || ttk.presentation || '',
    dishDescription: ttk.dishDescription || ttk.menuDescription || ttk.descriptionText || '',
    qualityPoints: ttk.qualityPoints || ttk.standard || ttk.qualityStandard || '',
    chefComment: ttk.chefComment || '',
    category: ttk.category || '',
    plate: ttk.plate || ttk.dishware || '',
    status: TTK_STATUSES.includes(ttk.status) ? ttk.status : 'draft',
    archived: Boolean(ttk.archived),
  }
}

function getTypeBadge(type) {
  return TYPE_BADGE[type] || TYPE_BADGE.nomenclature
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

function makePrintableHtml(sourceTtk) {
  const ttk = normalizeTtk(sourceTtk)
  const rows = ttk.rows?.length ? ttk.rows : [EMPTY_ROW]

  const rowsHtml = rows.map(row => {
    const cleanRow = normalizeRow(row)
    const badge = getTypeBadge(cleanRow.type)

    return `
      <tr>
        <td>${escapeHtml(cleanRow.name)}</td>
        <td class="muted">${escapeHtml(badge.label)}</td>
        <td class="qty">${escapeHtml(formatQty(cleanRow))}</td>
      </tr>
    `
  }).join('')

  const photoHtml = ttk.photo?.dataUrl
    ? `<img class="dish-photo" src="${ttk.photo.dataUrl}" alt="${escapeHtml(ttk.title)}">`
    : '<div class="photo-placeholder">Фото блюда</div>'

  return `<!doctype html>
<html lang="ru">
<head>
<meta charset="utf-8">
<title>${escapeHtml(ttk.title || 'Карточка блюда')}</title>
<style>
  @page{size:A4;margin:0}
  *{box-sizing:border-box}
  body{margin:0;background:#f4efe7;font-family:Inter,Manrope,Arial,Helvetica,sans-serif;color:#1f2937}
  .page{width:210mm;min-height:297mm;margin:0 auto;background:#faf8f5;padding:16mm;display:flex;flex-direction:column;gap:6mm;position:relative;overflow:hidden}
  .page:before{content:"";position:absolute;inset:0;background:radial-gradient(circle at 10% 12%,rgba(22,51,43,.06),transparent 25%),radial-gradient(circle at 88% 4%,rgba(185,145,80,.08),transparent 22%);pointer-events:none}
  .content{position:relative;z-index:1;display:flex;flex-direction:column;gap:6mm}
  .kicker{font-size:10px;letter-spacing:.22em;text-transform:uppercase;color:#7a6f62;font-weight:800;text-align:center}
  h1{margin:0;text-align:center;font-size:28px;line-height:1.08;color:#16332b;letter-spacing:-.03em;font-weight:900}
  .photo-wrap{width:100%;height:88mm;overflow:hidden;border-radius:24px;box-shadow:0 16px 42px rgba(31,41,55,.14);background:#eee7dc}
  .dish-photo{width:100%;height:100%;object-fit:cover;display:block}
  .photo-placeholder{height:100%;display:flex;align-items:center;justify-content:center;color:#8b8174;font-size:18px;background:#eee7dc}
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
    <div class="kicker">Клёво · стандарт блюда</div>
    <h1>${escapeHtml(ttk.title || 'Название блюда')}</h1>
    <div class="photo-wrap">${photoHtml}</div>

    <div class="meta">
      <div class="meta-card"><div class="meta-label">Выход</div><div class="meta-value">${escapeHtml(ttk.output || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Сборка</div><div class="meta-value">${escapeHtml(ttk.assemblyTime || ttk.time || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Категория</div><div class="meta-value">${escapeHtml(ttk.category || '—')}</div></div>
      <div class="meta-card"><div class="meta-label">Посуда</div><div class="meta-value">${escapeHtml(ttk.plate || '—')}</div></div>
    </div>

    <div class="grid">
      <section class="block">
        <h2>Описание блюда</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.dishDescription))}</div>
      </section>

      <section class="block">
        <h2>Состав блюда</h2>
        <table>
          <thead><tr><th>Наименование</th><th>Тип</th><th>Кол-во</th></tr></thead>
          <tbody>${rowsHtml}</tbody>
        </table>
      </section>

      <section class="block wide">
        <h2>Способ приготовления</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.technology))}</div>
      </section>

      <section class="block">
        <h2>Стандарт подачи</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.serving))}</div>
      </section>

      <section class="block">
        <h2>Критические точки качества</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.qualityPoints))}</div>
      </section>

      <section class="block wide">
        <h2>Комментарии бренд-шефа</h2>
        <div class="text">${escapeHtml(textOrDash(ttk.chefComment))}</div>
      </section>
    </div>
  </div>
</main>
</body>
</html>`
}

function TtkStatus({ status }) {
  return <Tag color={STATUS_COLORS[status] || '#64748b'}>{STATUS_LABELS[status] || status}</Tag>
}

function Photo({ file, label, large = false }) {
  return (
    <div style={{
      background: '#f3efe7',
      border: '1px dashed #d8d0c3',
      borderRadius: large ? 24 : 18,
      minHeight: large ? 260 : 150,
      height: large ? 320 : '100%',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      overflow: 'hidden',
    }}>
      {file?.dataUrl ? (
        <img src={file.dataUrl} alt={label} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#8b8174', fontSize: 13 }}>{label}</span>
      )}
    </div>
  )
}

// ─── КОЛЛЕКЦИИ: левая панель + компоненты ────────────────────────────────────

// SVG-иконки коллекций
function FolderSvg({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M22 19a2 2 0 01-2 2H4a2 2 0 01-2-2V5a2 2 0 012-2h5l2 3h9a2 2 0 012 2z"/>
    </svg>
  )
}
function StarSvg({ filled=false, size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill={filled ? "currentColor" : "none"} stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>
    </svg>
  )
}
function BookSvg({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M2 3h6a4 4 0 014 4v14a3 3 0 00-3-3H2z"/><path d="M22 3h-6a4 4 0 00-4 4v14a3 3 0 013-3h7z"/>
    </svg>
  )
}
function SparkSvg({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 3l1.5 4.5L18 9l-4.5 1.5L12 15l-1.5-4.5L6 9l4.5-1.5z"/>
      <path d="M19 3l.75 2.25L22 6l-2.25.75L19 9l-.75-2.25L16 6l2.25-.75z"/>
    </svg>
  )
}
function PlusSvg({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
      <line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/>
    </svg>
  )
}
function ArchiveSvg({ size=14 }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="21 8 21 21 3 21 3 8"/><rect x="1" y="3" width="22" height="5"/><line x1="10" y1="12" x2="14" y2="12"/>
    </svg>
  )
}

function CollectionIcon({ icon, color, size=14 }) {
  const style = { color }
  if (icon === 'star')    return <span style={style}><StarSvg size={size} filled /></span>
  if (icon === 'book')    return <span style={style}><BookSvg size={size} /></span>
  if (icon === 'sparkle') return <span style={style}><SparkSvg size={size} /></span>
  if (icon === 'archive') return <span style={style}><ArchiveSvg size={size} /></span>
  return <span style={{ color: color || '#a39f98' }}><FolderSvg size={size} /></span>
}

// Модальное окно создания/редактирования коллекции
const COLLECTION_COLORS = [
  '#16332b','#0f4c35','#1a3a5c','#3d1a5c','#5c1a1a',
  '#b99150','#c2855c','#4c5c1a','#1a4c5c','#6b6560',
]
const COLLECTION_ICONS = [
  { id:'folder', label:'Папка' },
  { id:'star',   label:'Избранное' },
  { id:'book',   label:'Книга' },
  { id:'sparkle',label:'AI' },
]

function CollectionModal({ initial, onSave, onClose }) {
  const [name, setName] = useState(initial?.name || '')
  const [description, setDescription] = useState(initial?.description || '')
  const [color, setColor] = useState(initial?.color || '#16332b')
  const [icon, setIcon] = useState(initial?.icon || 'folder')

  function handleSave() {
    if (!name.trim()) return
    onSave({ name: name.trim(), description, color, icon })
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,.35)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{
        background:'#fff', borderRadius:24, padding:'32px 36px',
        width:'100%', maxWidth:440, boxShadow:'0 24px 60px rgba(0,0,0,.18)',
      }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#1a1a1a', marginBottom:20, letterSpacing:'-.02em' }}>
          {initial ? 'Редактировать коллекцию' : 'Новая коллекция'}
        </div>

        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>
          <div>
            <div style={{ fontSize:11.5, fontWeight:700, color:'#6b6560', marginBottom:6 }}>Название</div>
            <input
              autoFocus
              value={name}
              onChange={e => setName(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSave()}
              placeholder="Летнее меню 2026"
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', border:'1.5px solid #e8e2d8', borderRadius:12, fontSize:14, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#faf8f4' }}
            />
          </div>

          <div>
            <div style={{ fontSize:11.5, fontWeight:700, color:'#6b6560', marginBottom:6 }}>Описание (опционально)</div>
            <input
              value={description}
              onChange={e => setDescription(e.target.value)}
              placeholder="Коллекция для летнего сезона"
              style={{ width:'100%', boxSizing:'border-box', padding:'10px 14px', border:'1.5px solid #e8e2d8', borderRadius:12, fontSize:13.5, outline:'none', fontFamily:'inherit', color:'#1a1a1a', background:'#faf8f4' }}
            />
          </div>

          <div>
            <div style={{ fontSize:11.5, fontWeight:700, color:'#6b6560', marginBottom:8 }}>Цвет</div>
            <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
              {COLLECTION_COLORS.map(c => (
                <button
                  key={c}
                  onClick={() => setColor(c)}
                  style={{ width:28, height:28, borderRadius:8, border:color===c ? `2px solid ${c}` : '2px solid transparent', background:c, cursor:'pointer', boxShadow:color===c ? `0 0 0 3px ${c}40` : 'none', transition:'all .15s', outline:'none' }}
                />
              ))}
            </div>
          </div>

          <div>
            <div style={{ fontSize:11.5, fontWeight:700, color:'#6b6560', marginBottom:8 }}>Иконка</div>
            <div style={{ display:'flex', gap:8 }}>
              {COLLECTION_ICONS.map(ic => (
                <button
                  key={ic.id}
                  onClick={() => setIcon(ic.id)}
                  style={{
                    display:'flex', alignItems:'center', gap:6,
                    padding:'7px 12px', borderRadius:10,
                    border: icon===ic.id ? `1.5px solid ${color}` : '1.5px solid #e8e2d8',
                    background: icon===ic.id ? color+'18' : '#fff',
                    cursor:'pointer', fontSize:12, fontWeight:600,
                    color: icon===ic.id ? color : '#6b6560',
                    transition:'all .15s',
                  }}
                >
                  <CollectionIcon icon={ic.id} color={icon===ic.id ? color : '#a39f98'} size={13} />
                  {ic.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:24, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:12, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:13.5, fontWeight:600, color:'#1a1a1a' }}>Отмена</button>
          <button
            onClick={handleSave}
            disabled={!name.trim()}
            style={{ padding:'10px 20px', borderRadius:12, border:'none', background:color, color:'#fff', cursor:name.trim()?'pointer':'not-allowed', fontSize:13.5, fontWeight:700, opacity:name.trim()?1:.5, transition:'all .15s' }}
          >
            {initial ? 'Сохранить' : 'Создать'}
          </button>
        </div>
      </div>
    </div>
  )
}

// Модальное окно "Добавить в коллекцию" (появляется по кнопке на карточке)
function AddToCollectionModal({ dish, collections, onAdd, onClose }) {
  const [selected, setSelected] = useState(new Set(
    collections.filter(c => c.dishIds.includes(dish.id)).map(c => c.id)
  ))

  function toggle(id) {
    setSelected(prev => {
      const next = new Set(prev)
      next.has(id) ? next.delete(id) : next.add(id)
      return next
    })
  }

  function handleSave() {
    onAdd([...selected], dish.id)
    onClose()
  }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,.30)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => { if (e.target === e.currentTarget) onClose() }}>
      <div style={{ background:'#fff', borderRadius:24, padding:'28px 32px', width:'100%', maxWidth:380, boxShadow:'0 24px 60px rgba(0,0,0,.15)' }}>
        <div style={{ fontSize:16, fontWeight:800, color:'#1a1a1a', marginBottom:4, letterSpacing:'-.02em' }}>Добавить в коллекцию</div>
        <div style={{ fontSize:12.5, color:'#a39f98', marginBottom:18 }}>{dish.title || 'Без названия'}</div>
        <div style={{ display:'flex', flexDirection:'column', gap:4, maxHeight:280, overflowY:'auto' }}>
          {collections.map(c => (
            <button
              key={c.id}
              onClick={() => toggle(c.id)}
              style={{
                display:'flex', alignItems:'center', gap:10, padding:'10px 12px',
                borderRadius:12, border:'none', cursor:'pointer', textAlign:'left',
                background: selected.has(c.id) ? c.color+'12' : 'transparent',
                transition:'background .12s',
              }}
            >
              <div style={{
                width:18, height:18, borderRadius:5,
                border: `1.5px solid ${selected.has(c.id) ? c.color : '#d4cfc8'}`,
                background: selected.has(c.id) ? c.color : 'transparent',
                display:'flex', alignItems:'center', justifyContent:'center',
                flexShrink:0, transition:'all .12s',
              }}>
                {selected.has(c.id) && (
                  <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                )}
              </div>
              <CollectionIcon icon={c.icon} color={c.color} size={13} />
              <span style={{ fontSize:13.5, fontWeight:600, color:'#1a1a1a' }}>{c.name}</span>
              <span style={{ marginLeft:'auto', fontSize:11, color:'#a39f98' }}>{c.dishIds.length}</span>
            </button>
          ))}
        </div>
        <div style={{ display:'flex', gap:10, marginTop:20, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'9px 16px', borderRadius:12, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:13, fontWeight:600, color:'#1a1a1a' }}>Отмена</button>
          <button onClick={handleSave} style={{ padding:'9px 18px', borderRadius:12, border:'none', background:'#16332b', color:'#fff', cursor:'pointer', fontSize:13, fontWeight:700 }}>Сохранить</button>
        </div>
      </div>
    </div>
  )
}

// Левая панель: коллекции
function CollectionsSidebar({
  collections, activeCollectionId, onSelectCollection,
  showArchived, onToggleArchived,
  archivedCount, allCount, favCount,
  onCreateCollection, onEditCollection,
}) {
  const [hoverId, setHoverId] = useState(null)

  const navItem = (id, label, icon, count, color='#6b6560', isActive) => (
    <button
      key={id}
      onMouseEnter={() => setHoverId(id)}
      onMouseLeave={() => setHoverId(null)}
      onClick={() => onSelectCollection(id)}
      style={{
        width:'100%', display:'flex', alignItems:'center', gap:9,
        padding:'8px 10px', borderRadius:10, border:'none', cursor:'pointer',
        background: isActive ? '#16332b' : hoverId===id ? 'rgba(22,51,43,.05)' : 'transparent',
        color: isActive ? '#fff' : '#374151',
        fontWeight: isActive ? 700 : 500, fontSize:13, textAlign:'left',
        transition:'all .12s',
      }}
    >
      <span style={{ color: isActive ? 'rgba(255,255,255,.8)' : color, flexShrink:0 }}>
        {icon}
      </span>
      <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{label}</span>
      {count > 0 && (
        <span style={{ fontSize:11, fontWeight:700, color: isActive ? 'rgba(255,255,255,.55)' : '#a39f98', background: isActive ? 'rgba(255,255,255,.12)' : '#f0ebe2', padding:'1px 6px', borderRadius:999, flexShrink:0 }}>
          {count}
        </span>
      )}
    </button>
  )

  const userCols = collections.filter(c => !c.system)
  const sysCols  = collections.filter(c => c.system)

  return (
    <div style={{ width:210, flexShrink:0, display:'flex', flexDirection:'column', gap:0 }}>
      {/* Все блюда + избранное */}
      <div style={{ marginBottom:2 }}>
        {navItem('__all__', 'Все блюда', <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"><rect x="3" y="3" width="7" height="7" rx="1"/><rect x="14" y="3" width="7" height="7" rx="1"/><rect x="3" y="14" width="7" height="7" rx="1"/><rect x="14" y="14" width="7" height="7" rx="1"/></svg>, allCount, '#6b6560', !showArchived && activeCollectionId === '__all__')}
      </div>

      {/* Системные коллекции */}
      {sysCols.map(col =>
        navItem(col.id, col.name, <CollectionIcon icon={col.icon} color={!showArchived && activeCollectionId===col.id ? 'rgba(255,255,255,.8)' : col.color} size={13} />, col.dishIds.length, col.color, !showArchived && activeCollectionId===col.id)
      )}

      {/* Разделитель */}
      {userCols.length > 0 && (
        <div style={{ margin:'10px 10px 6px', borderTop:'1px solid #ede9e0' }}>
          <div style={{ fontSize:10.5, fontWeight:700, color:'#a39f98', letterSpacing:'.10em', textTransform:'uppercase', marginTop:8, marginBottom:2, paddingLeft:2 }}>Коллекции</div>
        </div>
      )}

      {/* Пользовательские коллекции */}
      {userCols.map(col => {
        const isActive = !showArchived && activeCollectionId === col.id
        return (
          <div key={col.id} style={{ position:'relative' }}
            onMouseEnter={() => setHoverId(col.id)}
            onMouseLeave={() => setHoverId(null)}
          >
            <button
              onClick={() => onSelectCollection(col.id)}
              style={{
                width:'100%', display:'flex', alignItems:'center', gap:9,
                padding:'8px 10px', paddingRight:30, borderRadius:10, border:'none', cursor:'pointer',
                background: isActive ? '#16332b' : hoverId===col.id ? 'rgba(22,51,43,.05)' : 'transparent',
                color: isActive ? '#fff' : '#374151',
                fontWeight: isActive ? 700 : 500, fontSize:13, textAlign:'left', transition:'all .12s',
              }}
            >
              <span style={{ flexShrink:0 }}>
                <CollectionIcon icon={col.icon} color={isActive ? 'rgba(255,255,255,.8)' : col.color} size={13} />
              </span>
              <span style={{ flex:1, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{col.name}</span>
              {col.dishIds.length > 0 && (
                <span style={{ fontSize:11, fontWeight:700, color: isActive ? 'rgba(255,255,255,.55)' : '#a39f98', background: isActive ? 'rgba(255,255,255,.12)' : '#f0ebe2', padding:'1px 6px', borderRadius:999, flexShrink:0 }}>
                  {col.dishIds.length}
                </span>
              )}
            </button>
            {hoverId===col.id && !isActive && (
              <button
                onClick={e => { e.stopPropagation(); onEditCollection(col) }}
                style={{ position:'absolute', right:6, top:'50%', transform:'translateY(-50%)', background:'none', border:'none', cursor:'pointer', color:'#a39f98', padding:4, borderRadius:6 }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4z"/></svg>
              </button>
            )}
          </div>
        )
      })}

      {/* Создать коллекцию */}
      <button
        onClick={onCreateCollection}
        onMouseEnter={() => setHoverId('__create__')}
        onMouseLeave={() => setHoverId(null)}
        style={{
          display:'flex', alignItems:'center', gap:8, padding:'8px 10px',
          borderRadius:10, border:'none', cursor:'pointer',
          background: hoverId==='__create__' ? 'rgba(22,51,43,.05)' : 'transparent',
          color:'#a39f98', fontSize:13, fontWeight:500, textAlign:'left',
          marginTop:4, transition:'background .12s',
        }}
      >
        <PlusSvg size={13} />
        Создать коллекцию
      </button>

      {/* Разделитель + Архив */}
      <div style={{ margin:'8px 10px 4px', borderTop:'1px solid #ede9e0' }} />
      <button
        onMouseEnter={() => setHoverId('__archive__')}
        onMouseLeave={() => setHoverId(null)}
        onClick={onToggleArchived}
        style={{
          display:'flex', alignItems:'center', gap:9, padding:'8px 10px', borderRadius:10, border:'none', cursor:'pointer',
          background: showArchived ? '#16332b' : hoverId==='__archive__' ? 'rgba(22,51,43,.05)' : 'transparent',
          color: showArchived ? '#fff' : '#6b6560',
          fontWeight: showArchived ? 700 : 500, fontSize:13, textAlign:'left', transition:'all .12s',
        }}
      >
        <span style={{ color: showArchived ? 'rgba(255,255,255,.7)' : '#a39f98' }}><ArchiveSvg size={13} /></span>
        Архив
        {archivedCount > 0 && (
          <span style={{ fontSize:11, fontWeight:700, color: showArchived ? 'rgba(255,255,255,.55)' : '#a39f98', background: showArchived ? 'rgba(255,255,255,.12)' : '#f0ebe2', padding:'1px 6px', borderRadius:999, marginLeft:'auto' }}>
            {archivedCount}
          </span>
        )}
      </button>
    </div>
  )
}

// Onboarding-экран для пустой базы
function EmptyOnboarding({ onCreate, onImport, importRef }) {
  return (
    <div style={{ display:'flex', flexDirection:'column', alignItems:'center', justifyContent:'center', padding:'80px 32px', textAlign:'center', flex:1 }}>
      <div style={{
        width:72, height:72, borderRadius:20, marginBottom:24,
        background:'linear-gradient(135deg,#eef4f1,#dceae3)',
        display:'flex', alignItems:'center', justifyContent:'center',
      }}>
        <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#16332b" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8z"/>
          <polyline points="14 2 14 8 20 8"/>
          <line x1="12" y1="12" x2="12" y2="18"/>
          <line x1="9" y1="15" x2="15" y2="15"/>
        </svg>
      </div>
      <div style={{ fontSize:22, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.03em', marginBottom:10 }}>
        Добро пожаловать в ChefCloud
      </div>
      <div style={{ fontSize:14, color:'#a39f98', lineHeight:1.7, maxWidth:380, marginBottom:32 }}>
        Создайте первое блюдо и начните формировать цифровую базу знаний вашего ресторана.
      </div>
      <div style={{ display:'flex', gap:12, flexWrap:'wrap', justifyContent:'center' }}>
        <button onClick={onCreate} style={{
          padding:'12px 24px', borderRadius:14, border:'none',
          background:'#16332b', color:'#fff', fontSize:14, fontWeight:700,
          cursor:'pointer', boxShadow:'0 2px 8px rgba(22,51,43,.25)',
        }}>Создать блюдо</button>
        <button onClick={() => importRef.current?.click()} style={{
          padding:'12px 24px', borderRadius:14, border:'1.5px solid #e8e2d8',
          background:'#fff', color:'#1a1a1a', fontSize:14, fontWeight:600,
          cursor:'pointer',
        }}>Восстановить из резервной копии</button>
      </div>
    </div>
  )
}

export function ReferenceTtkList({
  items, categories = [],
  onOpen, onEdit, onCreate, onDownload,
  onArchive, onRestore,
  collections = [], onCreateCollection, onUpdateCollection,
  onAddDishToCollections, onRemoveDishFromCollection, onToggleFavorite, isFavorite,
}) {
  const [query, setQuery]         = useState('')
  const [statusFilter, setStatus] = useState('all')
  const [showArchived, setShowArchived] = useState(false)
  const [activeCollectionId, setActive] = useState('__all__')
  const [createModalOpen, setCreateModalOpen] = useState(false)
  const [editingCollection, setEditingCollection] = useState(null)
  const [addToColl, setAddToColl] = useState(null) // dish для AddToCollectionModal
  const importRef = useRef(null)

  const normalizedItems = useMemo(() => items.map(normalizeTtk), [items])

  // Фильтрация по активной коллекции
  const collectionFiltered = useMemo(() => {
    if (showArchived) return normalizedItems.filter(i => i.archived)
    const base = normalizedItems.filter(i => !i.archived)
    if (activeCollectionId === '__all__') return base
    const col = collections.find(c => c.id === activeCollectionId)
    if (!col) return base
    return base.filter(d => col.dishIds.includes(d.id))
  }, [normalizedItems, showArchived, activeCollectionId, collections])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return collectionFiltered
      .filter(i => statusFilter === 'all' || i.status === statusFilter)
      .filter(i => !q || i.title.toLowerCase().includes(q))
  }, [collectionFiltered, query, statusFilter])

  const allCount      = normalizedItems.filter(i => !i.archived).length
  const archivedCount = normalizedItems.filter(i =>  i.archived).length
  const favCol = collections.find(c => c.id === '__favorites__')
  const favCount = favCol?.dishIds.length || 0

  const activeCollectionName = useMemo(() => {
    if (showArchived) return 'Архив'
    if (activeCollectionId === '__all__') return null
    return collections.find(c => c.id === activeCollectionId)?.name || null
  }, [showArchived, activeCollectionId, collections])

  // Показываем onboarding только если база полностью пустая
  if (items.length === 0) {
    return (
      <>
        <EmptyOnboarding onCreate={onCreate} importRef={importRef}
          onImport={() => importRef.current?.click()} />
        <input ref={importRef} type="file" accept=".json,application/json"
          onChange={e => { /* import handled by parent via onImportAll */ }}
          style={{ display:'none' }} />
      </>
    )
  }

  return (
    <>
      {createModalOpen && (
        <CollectionModal
          onSave={({ name, description, color, icon }) => {
            onCreateCollection({ name, description, color, icon })
            setCreateModalOpen(false)
          }}
          onClose={() => setCreateModalOpen(false)}
        />
      )}
      {editingCollection && (
        <CollectionModal
          initial={editingCollection}
          onSave={patch => {
            onUpdateCollection(editingCollection.id, patch)
            setEditingCollection(null)
          }}
          onClose={() => setEditingCollection(null)}
        />
      )}
      {addToColl && (
        <AddToCollectionModal
          dish={addToColl}
          collections={collections}
          onAdd={(collectionIds, dishId) => {
            collections.forEach(col => {
              const wasIn = col.dishIds.includes(dishId)
              const nowIn = collectionIds.includes(col.id)
              if (!wasIn && nowIn && onAddDishToCollections) {
                onAddDishToCollections([col.id], dishId)
              }
              if (wasIn && !nowIn && onRemoveDishFromCollection) {
                onRemoveDishFromCollection(col.id, dishId)
              }
            })
          }}
          onClose={() => setAddToColl(null)}
        />
      )}

      <div style={{ display:'flex', gap:0, height:'100%' }}>
        {/* Левая панель коллекций */}
        <CollectionsSidebar
          collections={collections}
          activeCollectionId={activeCollectionId}
          onSelectCollection={id => { setActive(id); setShowArchived(false) }}
          showArchived={showArchived}
          onToggleArchived={() => setShowArchived(s => !s)}
          archivedCount={archivedCount}
          allCount={allCount}
          favCount={favCount}
          onCreateCollection={() => setCreateModalOpen(true)}
          onEditCollection={col => setEditingCollection(col)}
        />

        {/* Правая часть */}
        <div style={{ flex:1, minWidth:0, paddingLeft:24, display:'flex', flexDirection:'column', gap:16 }}>
          {/* Топ-бар */}
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', gap:12, flexWrap:'wrap' }}>
            <div>
              <h1 style={{ fontSize:22, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.03em', margin:0 }}>
                {activeCollectionName || 'Все блюда'}
              </h1>
              {activeCollectionName && (
                <div style={{ fontSize:12, color:'#a39f98', marginTop:3 }}>
                  {filtered.length} {filtered.length === 1 ? 'блюдо' : 'блюд'}
                </div>
              )}
            </div>
            <div style={{ display:'flex', gap:8, alignItems:'center', flexWrap:'wrap' }}>
              {/* Поиск */}
              <div style={{ position:'relative' }}>
                <span style={{ position:'absolute', left:11, top:'50%', transform:'translateY(-50%)', color:'#a39f98', pointerEvents:'none' }}>
                  <SearchIcon />
                </span>
                <input
                  value={query}
                  onChange={e => setQuery(e.target.value)}
                  placeholder="Поиск…"
                  style={{ paddingLeft:32, paddingRight:query?28:12, padding:'9px 12px 9px 32px', border:'1.5px solid #e8e2d8', borderRadius:12, fontSize:13, outline:'none', background:'#faf8f4', color:'#1a1a1a', width:180, fontFamily:'inherit', transition:'border-color .15s' }}
                />
                {query && (
                  <button onClick={() => setQuery('')} style={{ position:'absolute', right:8, top:'50%', transform:'translateY(-50%)', border:'none', background:'none', cursor:'pointer', color:'#a39f98', padding:2 }}>
                    <CloseIcon />
                  </button>
                )}
              </div>
              {/* Фильтр по статусу */}
              <select
                value={statusFilter}
                onChange={e => setStatus(e.target.value)}
                style={{ padding:'9px 12px', border:'1.5px solid #e8e2d8', borderRadius:12, fontSize:13, outline:'none', background:'#faf8f4', color:'#1a1a1a', fontFamily:'inherit', cursor:'pointer' }}
              >
                <option value="all">Все статусы</option>
                {TTK_STATUSES.map(s => <option key={s} value={s}>{STATUS_LABELS[s]}</option>)}
              </select>
              {/* Создать коллекцию */}
              <button
                onClick={() => setCreateModalOpen(true)}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 14px', borderRadius:12, border:'1.5px solid #e8e2d8', background:'#fff', color:'#1a1a1a', fontSize:13, fontWeight:600, cursor:'pointer' }}
              >
                <PlusSvg size={13} /> Коллекция
              </button>
              {/* Создать блюдо */}
              <button
                onClick={onCreate}
                style={{ display:'flex', alignItems:'center', gap:7, padding:'10px 18px', borderRadius:12, border:'none', background:'#16332b', color:'#fff', fontSize:13.5, fontWeight:700, cursor:'pointer', boxShadow:'0 1px 4px rgba(22,51,43,.25)' }}
              >
                <PlusSvg size={13} /> Новое блюдо
              </button>
            </div>
          </div>

          {/* Карточки */}
          {filtered.length === 0 ? (
            <div style={{ textAlign:'center', padding:'60px 32px', color:'#a39f98' }}>
              <div style={{ fontSize:32, marginBottom:12, opacity:.4 }}>
                <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
              </div>
              <div style={{ fontSize:14, fontWeight:600 }}>
                {showArchived ? 'В архиве пока нет блюд' : 'Блюд не найдено'}
              </div>
              {activeCollectionName && !showArchived && (
                <div style={{ fontSize:13, marginTop:6 }}>
                  Перетащите блюда из «Все блюда» или нажмите «Добавить в коллекцию» на карточке
                </div>
              )}
            </div>
          ) : (
            <div style={{ display:'grid', gridTemplateColumns:'repeat(auto-fill,minmax(270px,1fr))', gap:16 }} className="cc-stagger">
              {filtered.map(item => (
                <DishCard
                  key={item.id}
                  item={item}
                  collections={collections}
                  isFav={isFavorite ? isFavorite(item.id) : false}
                  onOpen={() => onOpen(item)}
                  onEdit={() => onEdit(item)}
                  onArchive={() => onArchive?.(item.id)}
                  onRestore={() => onRestore?.(item.id)}
                  onToggleFav={() => onToggleFavorite?.(item.id)}
                  onAddToCollection={() => setAddToColl(item)}
                  showArchived={showArchived}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

// Карточка блюда — новый дизайн
function DishCard({ item, collections, isFav, onOpen, onEdit, onArchive, onRestore, onToggleFav, onAddToCollection, showArchived }) {
  const [hov, setHov] = useState(false)

  // Коллекции, в которые входит блюдо (исключая системные)
  const dishCols = collections.filter(c => !c.system && c.dishIds.includes(item.id)).slice(0, 3)

  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background:'#fff', border:'1px solid #ede9e0', borderRadius:20, overflow:'hidden',
        boxShadow: hov ? '0 6px 24px rgba(0,0,0,.10)' : '0 1px 4px rgba(0,0,0,.06)',
        transform: hov ? 'translateY(-2px)' : 'none',
        transition:'all .18s ease',
      }}
      className="cc-fade-in"
    >
      {/* Фото */}
      <div style={{ height:160, background:'#f7f4ef', position:'relative', overflow:'hidden' }}>
        {item.photo?.dataUrl
          ? <img src={item.photo.dataUrl} alt={item.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#d4cfc8" strokeWidth="1.3" strokeLinecap="round"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
        }
        {/* Кнопка избранного поверх фото */}
        <button
          onClick={e => { e.stopPropagation(); onToggleFav() }}
          style={{ position:'absolute', top:10, right:10, width:30, height:30, borderRadius:9, border:'none', cursor:'pointer', background:'rgba(255,255,255,.85)', backdropFilter:'blur(6px)', display:'flex', alignItems:'center', justifyContent:'center', color: isFav ? '#b99150' : '#c0b8ae', transition:'all .15s' }}
        >
          <StarSvg size={14} filled={isFav} />
        </button>
        {/* Статус */}
        <div style={{ position:'absolute', bottom:10, left:10 }}>
          <TtkStatus status={item.status} />
        </div>
      </div>

      {/* Контент */}
      <div style={{ padding:'14px 16px 16px' }}>
        <div style={{ fontWeight:700, fontSize:15, color:'#1a1a1a', letterSpacing:'-.02em', marginBottom:4, overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>
          {item.title || 'Без названия'}
        </div>
        <div style={{ fontSize:12, color:'#a39f98', lineHeight:1.6 }}>
          {item.category && <>{item.category} · </>}
          {item.output && <>Выход {item.output}</>}
        </div>

        {/* Коллекции блюда */}
        {dishCols.length > 0 && (
          <div style={{ display:'flex', gap:5, flexWrap:'wrap', marginTop:8 }}>
            {dishCols.map(col => (
              <div key={col.id} style={{ fontSize:11, fontWeight:600, color:col.color, background:col.color+'15', padding:'2px 8px', borderRadius:999 }}>
                {col.name}
              </div>
            ))}
          </div>
        )}

        {/* Действия */}
        <div style={{ display:'flex', gap:6, marginTop:12 }}>
          <button onClick={onOpen} style={{ flex:1, padding:'7px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#1a1a1a', transition:'all .12s' }}>
            Открыть
          </button>
          <button onClick={onEdit} style={{ flex:1, padding:'7px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#1a1a1a', transition:'all .12s' }}>
            Изменить
          </button>
          <button
            onClick={onAddToCollection}
            style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', color:'#a39f98', transition:'all .12s' }}
            title="Добавить в коллекцию"
          >
            <FolderSvg size={13} />
          </button>
          {showArchived
            ? <button onClick={onRestore} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #c8e0d4', background:'#f0fdf4', cursor:'pointer', color:'#16a34a', fontSize:11.5, fontWeight:700 }}>Восстановить</button>
            : <button onClick={onArchive} style={{ padding:'7px 10px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', color:'#a39f98', transition:'all .12s' }} title="В архив">
                <ArchiveSvg size={13} />
              </button>
          }
        </div>
      </div>
    </div>
  )
}

function FileInput({ label, accept, value, onChange }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <input type="file" accept={accept} onChange={async e => onChange(await fileToPayload(e.target.files?.[0]))} style={{ fontSize: 12 }} />
      {value?.name && <span style={{ fontSize: 11, color: '#64748b' }}>Загружено: {value.name}</span>}
    </label>
  )
}

function TextField({ label, value, onChange, placeholder }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <input value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={INPUT} />
    </label>
  )
}

function TextAreaField({ label, value, onChange, placeholder, minHeight }) {
  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>{label}</span>
      <textarea value={value || ''} placeholder={placeholder} onChange={e => onChange(e.target.value)} style={{ ...TEXTAREA, minHeight: minHeight || TEXTAREA.minHeight }} />
    </label>
  )
}

// Поле категории: выбор из существующего справочника + возможность вписать новую категорию прямо тут.
// Новая категория сохраняется в общий справочник через onAddCategory, чтобы была доступна при следующем выборе.
function CategoryField({ value, categories, onChange, onAddCategory }) {
  const [customMode, setCustomMode] = useState(false)
  const isKnown = !value || categories.includes(value)

  if (customMode || !isKnown) {
    return (
      <label style={FIELD}>
        <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Категория</span>
        <div style={{ display: 'flex', gap: 6 }}>
          <input
            value={value || ''}
            placeholder="Новая категория"
            onChange={e => onChange(e.target.value)}
            style={INPUT}
            autoFocus
          />
          {categories.length > 0 && (
            <button
              type="button"
              onClick={() => setCustomMode(false)}
              style={{ ...SEL_ST, whiteSpace: 'nowrap' }}
              title="Выбрать из списка"
            >
              Список
            </button>
          )}
        </div>
      </label>
    )
  }

  return (
    <label style={FIELD}>
      <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Категория</span>
      <select
        value={value || ''}
        onChange={e => {
          if (e.target.value === '__new__') {
            setCustomMode(true)
            onChange('')
          } else {
            onChange(e.target.value)
          }
        }}
        style={{ ...SEL_ST, width: '100%' }}
      >
        <option value="">— Не выбрана —</option>
        {categories.map(cat => <option key={cat} value={cat}>{cat}</option>)}
        <option value="__new__">+ Новая категория…</option>
      </select>
    </label>
  )
}

function inferType(item) {
  if (!item) return 'product'
  if (item.source === 'semifinished') return 'semifinished'
  if (item.source === 'product') return 'product'
  if (item.type) return item.type
  if (item.composition || item.cookingMethod) return 'semifinished'
  return 'product'
}

const AUTOSAVE_KEY = 'academy_reference_ttk_draft_v1'

export function ReferenceTtkForm({ initial, initialTab = 'main', nomenclature = [], categories = [], onAddCategory, onSaveNomenclatureItem, onCancel, onSave }) {
  const [form, setForm] = useState(() => normalizeTtk(initial || createEmptyReferenceTtk()))
  const [dirty, setDirty] = useState(false)
  const [restoredNotice, setRestoredNotice] = useState(false)

  // При первой загрузке формы для НОВОЙ карточки проверяем, нет ли несохранённого автосохранения
  // (например, браузер закрылся до того, как человек нажал "Сохранить"). Для редактирования существующей
  // карточки автосохранение не подменяет данные — это сделано бы было неожиданно для пользователя.
  useEffect(() => {
    if (initial && initial.title) return // редактирование существующей карточки — не трогаем
    try {
      const raw = localStorage.getItem(AUTOSAVE_KEY)
      if (!raw) return
      const draft = JSON.parse(raw)
      if (draft && (draft.title || draft.rows?.some(r => r.name))) {
        setForm(normalizeTtk(draft))
        setRestoredNotice(true)
        setDirty(true)
      }
    } catch {
      // повреждённый автосейв — игнорируем, не мешаем создать новую карточку
    }
  }, [initial])

  // Автосохранение черновика в localStorage при каждом изменении формы (защита от потери данных).
  useEffect(() => {
    const timer = setTimeout(() => {
      try {
        localStorage.setItem(AUTOSAVE_KEY, JSON.stringify(form))
      } catch {
        // переполнение localStorage (например, очень большое фото) — не критично для автосейва
      }
    }, 600)
    return () => clearTimeout(timer)
  }, [form])

  // Предупреждение при попытке закрыть/перезагрузить страницу с несохранёнными изменениями.
  useEffect(() => {
    function handleBeforeUnload(e) {
      if (!dirty) return
      e.preventDefault()
      e.returnValue = ''
    }
    window.addEventListener('beforeunload', handleBeforeUnload)
    return () => window.removeEventListener('beforeunload', handleBeforeUnload)
  }, [dirty])

  const nomenclatureByName = useMemo(() => {
    return new Map(
      nomenclature
        .filter(item => item.name || item.title)
        .map(item => [String(item.name || item.title).trim().toLowerCase(), item]),
    )
  }, [nomenclature])

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
        type: inferType(item),
        unit: row.unit || item.unit || '',
      } : row),
    }))
    setDirty(true)
  }

  function addRowToNomenclature(row) {
    if (!row.name?.trim() || !onSaveNomenclatureItem) return

    onSaveNomenclatureItem({
      name: row.name.trim(),
      type: row.type || 'product',
      category: '',
      unit: row.unit || 'г',
      description: '',
      composition: '',
      cookingMethod: '',
      output: row.qty || '',
    })
  }

  function handleCategoryChange(value) {
    update('category', value)
  }

  function handleCategoryBlur() {
    const value = form.category?.trim()
    if (value && onAddCategory) onAddCategory(value)
  }

  function saveForm() {
    onSave(normalizeTtk(form))
    setDirty(false)
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
    } catch {
      // нечего удалять / нет доступа к localStorage — не критично
    }
  }

  function handleCancel() {
    try {
      localStorage.removeItem(AUTOSAVE_KEY)
    } catch {
      // нечего удалять / нет доступа к localStorage — не критично
    }
    onCancel()
  }

  const [activeTab, setActiveTab] = useState(initialTab)

  const TABS = [
    { id: 'main', label: 'Основное' },
    { id: 'ingredients', label: 'Ингредиенты' },
    { id: 'technology', label: 'Технология' },
    { id: 'ai', label: 'AI' },
  ]

  return (
    <form onSubmit={e => { e.preventDefault(); saveForm() }} style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, background: '#faf8f5', flexWrap: 'wrap' }}>
        <div>
          <h1 style={{ margin: '0 0 8px', fontSize: 30, color: '#16332b', letterSpacing: '-.03em' }}>
            {initial?.title ? 'Редактировать блюдо' : 'Новое блюдо'}
          </h1>
          <div style={{ color: '#64748b', fontSize: 14 }}>Фото, состав, способ приготовления, стандарт подачи и критические точки качества.</div>
          {restoredNotice && (
            <div style={{ marginTop: 8 }}>
              <Tag color="#b45309" bg="#fffbeb">Восстановлен несохранённый черновик — проверьте данные перед сохранением</Tag>
            </div>
          )}
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <button type="button" onClick={handleCancel} style={SEL_ST}>Отмена</button>
          <button type="submit" style={PRIMARY}>Сохранить</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 4, background: '#fff', border: '1px solid #ece8df', borderRadius: 16, padding: 6 }}>
        {TABS.map(tab => (
          <button
            key={tab.id}
            type="button"
            onClick={() => setActiveTab(tab.id)}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 12, border: 'none', cursor: 'pointer',
              background: activeTab === tab.id ? '#16332b' : 'transparent',
              color: activeTab === tab.id ? '#fff' : '#6b7280',
              fontWeight: activeTab === tab.id ? 800 : 600, fontSize: 13.5,
            }}
          >
            {tab.id === 'ai' ? '🤖 AI' : tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'main' && (
        <>
          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Основное</h2>
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr 1fr 1fr 1fr 180px', gap: 12 }}>
              <TextField label="Название блюда" value={form.title} onChange={v => update('title', v)} />
              <TextField label="Выход, г" value={form.output} onChange={v => update('output', v)} placeholder="287 г" />
              <TextField label="Время сборки, мин" value={form.assemblyTime || ''} onChange={v => update('assemblyTime', v)} placeholder="2 мин" />
              <div onBlur={handleCategoryBlur}>
                <CategoryField
                  value={form.category}
                  categories={categories}
                  onChange={handleCategoryChange}
                  onAddCategory={onAddCategory}
                />
              </div>
              <TextField label="Посуда" value={form.plate} onChange={v => update('plate', v)} placeholder="Тарелка 28 см" />
              <label style={FIELD}>
                <span style={{ fontSize: 12, fontWeight: 800, color: '#475569' }}>Статус</span>
                <select value={form.status} onChange={e => update('status', e.target.value)} style={{ ...SEL_ST, width: '100%' }}>
                  {TTK_STATUSES.map(status => (
                    <option key={status} value={status}>{STATUS_LABELS[status]}</option>
                  ))}
                </select>
              </label>
            </div>
          </section>

          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Фото блюда</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'minmax(260px,460px) 1fr', gap: 18, alignItems: 'center' }}>
              <Photo file={form.photo} label="Большое фото подачи блюда" large />
              <FileInput label="Загрузить фото блюда" accept="image/*" value={form.photo} onChange={v => update('photo', v)} />
            </div>
          </section>

          <section style={SECTION}>
            <TextAreaField
              label="Описание блюда"
              value={form.dishDescription}
              onChange={v => update('dishDescription', v)}
              minHeight={90}
              placeholder="Краткое гастрономическое описание для официанта и повара: вкус, текстура, акценты блюда."
            />
          </section>
        </>
      )}

      {activeTab === 'ingredients' && (
        <section style={SECTION}>
          <datalist id="nomenclature-options">
            {nomenclature.map(item => {
              const type = inferType(item)
              const label = TYPE_LABELS[type] || NOMENCLATURE_TYPE_LABELS?.[type] || type
              return (
                <option key={item.id || item.name} value={item.name || item.title}>
                  {label} · {item.unit || 'г'}
                </option>
              )
            })}
          </datalist>

          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, marginBottom: 12 }}>
            <div>
              <h2 style={{ margin: '0 0 4px', color: '#16332b' }}>Ингредиенты</h2>
              <div style={{ color: '#64748b', fontSize: 13 }}>Наименование, тип (товар / П/Ф / соус / заготовка), количество и единица измерения.</div>
            </div>
            <button type="button" onClick={() => update('rows', [...(form.rows || []), { ...EMPTY_ROW }])} style={PRIMARY}>Добавить строку</button>
          </div>

          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Наименование', 'Тип', 'Кол-во', 'Ед.', ''].map(h => (
                    <th key={h} style={{ textAlign: 'left', padding: 10, background: '#f8f6f2', borderBottom: '1px solid #ebe7de', color: '#6b7280' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(form.rows || []).map((row, index) => {
                  const cleanRow = normalizeRow(row)
                  const item = nomenclatureByName.get(cleanRow.name?.trim().toLowerCase())

                  return (
                    <tr key={index}>
                      <td style={{ ...TD, width: '42%' }}>
                        <input
                          list="nomenclature-options"
                          placeholder="Киноа отварная п/ф"
                          value={cleanRow.name}
                          onChange={e => selectNomenclature(index, e.target.value)}
                          style={INPUT}
                        />
                        {cleanRow.name && !nomenclatureByName.has(cleanRow.name.trim().toLowerCase()) && (
                          <button type="button" onClick={() => addRowToNomenclature(cleanRow)} style={{ ...SEL_ST, marginTop: 6, fontSize: 11 }}>
                            Добавить в номенклатуру
                          </button>
                        )}
                      </td>
                      <td style={{ ...TD, width: '16%' }}>
                        <select value={cleanRow.type} onChange={e => updateRow(index, 'type', e.target.value)} style={{ ...SEL_ST, width: '100%', color: '#6b7280', fontWeight: 700 }}>
                          <option value="product">Товар</option>
                          <option value="semifinished">П/Ф</option>
                          <option value="sauce">Соус</option>
                          <option value="prep">Заготовка</option>
                        </select>
                      </td>
                      <td style={{ ...TD, width: '15%' }}>
                        <input
                          placeholder="80"
                          value={cleanRow.qty}
                          onChange={e => updateRow(index, 'qty', e.target.value)}
                          style={INPUT}
                        />
                      </td>
                      <td style={{ ...TD, width: '15%' }}>
                        <input
                          placeholder={item?.unit || 'г'}
                          value={cleanRow.unit}
                          onChange={e => updateRow(index, 'unit', e.target.value)}
                          style={INPUT}
                        />
                      </td>
                      <td style={{ ...TD, width: '7%' }}>
                        <button type="button" onClick={() => update('rows', form.rows.filter((_, i) => i !== index))} style={SEL_ST}>×</button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </section>
      )}

      {activeTab === 'technology' && (
        <>
          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Способ приготовления</h2>
            <TextAreaField
              label="Текст для повара"
              value={form.technology}
              onChange={v => update('technology', v)}
              placeholder="1. Подготовить ингредиенты согласно рецептуре.\n2. Собрать блюдо в нужной последовательности.\n3. Проверить внешний вид, текстуру и температуру подачи."
            />
          </section>

          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Стандарт подачи</h2>
            <TextAreaField
              label="Финальная сервировка"
              value={form.serving}
              onChange={v => update('serving', v)}
              placeholder="Описание расположения ингредиентов, декора, посуды и финального внешнего вида блюда."
            />
          </section>

          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Критические точки качества</h2>
            <TextAreaField
              label="На что обратить внимание при контроле"
              value={form.qualityPoints}
              onChange={v => update('qualityPoints', v)}
              placeholder="• Текстура должна соответствовать стандарту.\n• Зелень свежая, без потемнения.\n• Соус не должен растекаться по борту тарелки.\n• Блюдо подаётся сразу после приготовления."
            />
          </section>

          <section style={SECTION}>
            <h2 style={{ marginTop: 0, color: '#16332b' }}>Комментарии бренд-шефа</h2>
            <TextAreaField
              label="Заметки и пояснения"
              value={form.chefComment}
              onChange={v => update('chefComment', v)}
              minHeight={90}
              placeholder="Дополнительные пояснения, допустимые замены ингредиентов, нюансы исполнения."
            />
          </section>
        </>
      )}

      {activeTab === 'ai' && <AiAssistSection />}
    </form>
  )
}

// AI-вкладка карточки блюда. На этом этапе все кнопки — заглушки: они честно сообщают,
// что функция появится после подключения нейросетей, и ничего не отправляют никуда
// и не подменяют данные пользователя.
const AI_ACTIONS = [
  { id: 'description', label: '🪄 Создать описание' },
  { id: 'technology', label: '🪄 Создать технологию' },
  { id: 'photo', label: '🪄 Создать фото' },
  { id: 'video', label: '🪄 Создать видео' },
  { id: 'station_card', label: '🪄 Создать station card' },
  { id: 'production_card', label: '🪄 Создать производственную карту' },
  { id: 'training', label: '🪄 Создать обучение' },
]

function AiAssistSection() {
  const [notice, setNotice] = useState(null)

  function handleClick(action) {
    setNotice(action.label)
  }

  return (
    <section style={{ ...SECTION, background: 'linear-gradient(135deg,#f7f3ec 0%,#fff 60%)', border: '1px solid #e7dcc4' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
        <span style={{ fontSize: 22 }}>🤖</span>
        <h2 style={{ margin: 0, color: '#16332b' }}>AI</h2>
      </div>
      <p style={{ color: '#7a6f62', fontSize: 13, margin: '4px 0 14px' }}>
        Подключение нейросетей запланировано на один из следующих этапов. Пока кнопки показывают, как это будет выглядеть.
      </p>
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        {AI_ACTIONS.map(action => (
          <button
            key={action.id}
            type="button"
            onClick={() => handleClick(action)}
            style={{ ...SEL_ST, background: '#fff' }}
          >
            {action.label}
          </button>
        ))}
      </div>
      {notice && (
        <div style={{ marginTop: 14 }}>
          <Tag color="#b45309" bg="#fffbeb">«{notice}» — AI-функция будет подключена на следующем этапе</Tag>
        </div>
      )}
    </section>
  )
}

const TD = { padding: 8, borderBottom: '1px solid #f0ede6', verticalAlign: 'top' }

export function ReferenceTtkView({ ttk: rawTtk, onBack, onEdit, onEditAi, onDuplicate, onDelete, onArchive }) {
  const ttk = normalizeTtk(rawTtk)
  const html = useMemo(() => makePrintableHtml(ttk), [ttk])
  const [showHistoryNotice, setShowHistoryNotice] = useState(false)

  if (!ttk) return null

  function downloadJson() {
    downloadBlob(`${ttk.title || 'dish-card'}.json`, JSON.stringify(ttk, null, 2), 'application/json')
  }

  function printTtk() {
    const win = window.open('', '_blank')
    win.document.write(html)
    win.document.close()
    win.focus()
    win.print()
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 18 }}>
      <div style={{ ...SECTION, display: 'flex', justifyContent: 'space-between', gap: 12, alignItems: 'center', background: '#faf8f5', flexWrap: 'wrap' }}>
        <div>
          <button onClick={onBack} style={{ ...SEL_ST, marginBottom: 12 }}>← Меню</button>
          <div><TtkStatus status={ttk.status} /></div>
          <h1 style={{ margin: '10px 0 6px', fontSize: 30, color: '#16332b', letterSpacing: '-.03em' }}>{ttk.title || 'Без названия'}</h1>
          <div style={{ color: '#64748b' }}>
            {ttk.category && <>{ttk.category} · </>}
            Выход: {ttk.output || '—'} · сборка: {ttk.assemblyTime || '—'} · строк: {ttk.rows?.length || 0} · обновлено {formatDate(ttk.updatedAt)}
          </div>
        </div>
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8, alignItems: 'flex-end' }}>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={onEdit} style={PRIMARY}>Редактировать</button>
            <button onClick={printTtk} style={SEL_ST}>🖨️ Печать</button>
            <button onClick={onEditAi || onEdit} style={SEL_ST}>🤖 AI</button>
            <button onClick={() => setShowHistoryNotice(true)} style={SEL_ST}>🕓 История</button>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            <button onClick={downloadJson} style={SEL_ST}>Скачать JSON</button>
            <button onClick={onDuplicate} style={SEL_ST}>Дублировать</button>
            {onArchive && <button onClick={onArchive} style={{ ...SEL_ST, color: '#b45309', borderColor: '#f3d9ad' }}>В архив</button>}
            <button onClick={onDelete} style={{ ...SEL_ST, color: '#dc2626', borderColor: '#fecaca' }}>Удалить</button>
          </div>
          {showHistoryNotice && (
            <Tag color="#7a6f62" bg="#f3efe7">История изменений появится после подключения журнала изменений — следующий этап</Tag>
          )}
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', overflow: 'auto', padding: '16px 0 32px' }}>
        <PrintablePage ttk={ttk} />
      </div>
    </div>
  )
}

function PrintablePage({ ttk: rawTtk }) {
  const ttk = normalizeTtk(rawTtk)

  return (
    <article style={PRINT_PAGE}>
      <div style={PRINT_BG_1} />
      <div style={PRINT_BG_2} />

      <div style={{ position: 'relative', zIndex: 1, display: 'flex', flexDirection: 'column', gap: '6mm' }}>
        <div style={{ textAlign: 'center', fontSize: 10, letterSpacing: '.22em', textTransform: 'uppercase', color: '#7a6f62', fontWeight: 800 }}>
          Клёво · стандарт блюда
        </div>

        <h1 style={PRINT_TITLE}>{ttk.title || 'Название блюда'}</h1>

        <div style={PRINT_PHOTO_WRAP}>
          {ttk.photo?.dataUrl ? (
            <img src={ttk.photo.dataUrl} alt={ttk.title} style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
          ) : (
            <div style={{ height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#8b8174', background: '#eee7dc', fontSize: 18 }}>
              Фото блюда
            </div>
          )}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 10 }}>
          <MetaCard label="Выход" value={ttk.output || '—'} />
          <MetaCard label="Сборка" value={ttk.assemblyTime || '—'} />
          <MetaCard label="Категория" value={ttk.category || '—'} />
          <MetaCard label="Посуда" value={ttk.plate || '—'} />
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '.95fr 1.05fr', gap: 11, alignItems: 'start' }}>
          <PrintBlock title="Описание блюда">
            <div style={PRINT_TEXT}>{textOrDash(ttk.dishDescription)}</div>
          </PrintBlock>

          <PrintBlock title="Состав блюда">
            <table style={{ width: '100%', borderCollapse: 'collapse', tableLayout: 'fixed', fontSize: 12.2, lineHeight: 1.3 }}>
              <thead>
                <tr>
                  <th style={{ ...PRINT_TH, width: '52%' }}>Наименование</th>
                  <th style={{ ...PRINT_TH, width: '20%', textAlign: 'center' }}>Тип</th>
                  <th style={{ ...PRINT_TH, width: '28%', textAlign: 'center' }}>Кол-во</th>
                </tr>
              </thead>
              <tbody>
                {(ttk.rows?.length ? ttk.rows : [EMPTY_ROW]).map((row, index) => {
                  const cleanRow = normalizeRow(row)
                  const badge = getTypeBadge(cleanRow.type)

                  return (
                    <tr key={index}>
                      <td style={{ ...PRINT_TD, fontWeight: 800 }}>{cleanRow.name}</td>
                      <td style={{ ...PRINT_TD, textAlign: 'center', color: '#6b7280', fontWeight: 600 }}>{badge.label}</td>
                      <td style={{ ...PRINT_TD, textAlign: 'center', fontWeight: 900 }}>{formatQty(cleanRow)}</td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </PrintBlock>

          <div style={{ gridColumn: '1 / -1' }}>
            <PrintBlock title="Способ приготовления">
              <div style={PRINT_TEXT}>{textOrDash(ttk.technology)}</div>
            </PrintBlock>
          </div>

          <PrintBlock title="Стандарт подачи">
            <div style={PRINT_TEXT}>{textOrDash(ttk.serving)}</div>
          </PrintBlock>

          <PrintBlock title="Критические точки качества">
            <div style={PRINT_TEXT}>{textOrDash(ttk.qualityPoints)}</div>
          </PrintBlock>

          <div style={{ gridColumn: '1 / -1' }}>
            <PrintBlock title="Комментарии бренд-шефа">
              <div style={PRINT_TEXT}>{textOrDash(ttk.chefComment)}</div>
            </PrintBlock>
          </div>
        </div>
      </div>
    </article>
  )
}

function MetaCard({ label, value }) {
  return (
    <div style={META_BOX}>
      <div style={{ fontSize: 10, textTransform: 'uppercase', letterSpacing: '.12em', color: '#8b8174', fontWeight: 800, marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, color: '#1f2937', fontWeight: 900 }}>{value}</div>
    </div>
  )
}

function PrintBlock({ title, children }) {
  return (
    <section style={PRINT_BLOCK}>
      <h2 style={PRINT_H2}>{title}</h2>
      {children}
    </section>
  )
}

const PRINT_PAGE = {
  width: '210mm',
  minHeight: '297mm',
  background: '#faf8f5',
  boxShadow: '0 24px 70px rgba(15,23,42,.16)',
  padding: '16mm',
  display: 'flex',
  flexDirection: 'column',
  gap: '6mm',
  position: 'relative',
  overflow: 'hidden',
  fontFamily: 'Inter, Manrope, Arial, sans-serif',
}

const PRINT_BG_1 = {
  position: 'absolute',
  width: 260,
  height: 260,
  borderRadius: 999,
  background: 'rgba(22,51,43,.055)',
  top: -80,
  left: -80,
}

const PRINT_BG_2 = {
  position: 'absolute',
  width: 280,
  height: 280,
  borderRadius: 999,
  background: 'rgba(185,145,80,.08)',
  top: -100,
  right: -120,
}

const PRINT_TITLE = {
  margin: 0,
  textAlign: 'center',
  fontSize: 28,
  lineHeight: 1.08,
  color: '#16332b',
  letterSpacing: '-.03em',
  fontWeight: 900,
}

const PRINT_PHOTO_WRAP = {
  width: '100%',
  height: '88mm',
  border: 'none',
  borderRadius: 24,
  overflow: 'hidden',
  boxShadow: '0 16px 42px rgba(31,41,55,.14)',
  background: '#eee7dc',
}

const META_BOX = {
  background: '#ffffff',
  border: '1px solid #ece8df',
  borderRadius: 16,
  padding: '10px 12px',
  boxShadow: '0 4px 14px rgba(31,41,55,.04)',
  minWidth: 0,
}

const PRINT_BLOCK = {
  background: '#fff',
  border: '1px solid #ece8df',
  borderRadius: 20,
  padding: 14,
  boxShadow: '0 8px 24px rgba(31,41,55,.045)',
}

const PRINT_H2 = {
  margin: '0 0 10px',
  fontSize: 16,
  fontWeight: 800,
  color: '#16332b',
  letterSpacing: '-.01em',
  textTransform: 'none',
}

const PRINT_TH = {
  padding: 8,
  background: '#f8f6f2',
  borderBottom: '1px solid #ebe7de',
  border: 'none',
  textAlign: 'left',
  fontSize: 10,
  color: '#8b8174',
  fontWeight: 800,
  textTransform: 'uppercase',
  letterSpacing: '.08em',
}

const PRINT_TD = {
  padding: 8,
  borderBottom: '1px solid #f0ede6',
  borderLeft: 'none',
  borderRight: 'none',
  borderTop: 'none',
  verticalAlign: 'middle',
  wordBreak: 'break-word',
  fontSize: 12.2,
  color: '#1f2937',
}

const PRINT_TEXT = {
  fontSize: 12.6,
  lineHeight: 1.55,
  color: '#374151',
  whiteSpace: 'pre-wrap',
}
