import { useMemo, useState } from 'react'

// PrintPage получает items из App.jsx
// Показывает список блюд → пользователь выбирает → кнопка печатает

const STATUS_LABEL = { approved:'Утверждено', review:'На проверке', draft:'Черновик' }
const STATUS_COLOR = { approved:'#16a34a', review:'#d97706', draft:'#6b7280' }

function formatDate(v) {
  if (!v) return '—'
  try { return new Date(v).toLocaleDateString('ru-RU') } catch { return '—' }
}

// Генерирует HTML для печати одной карточки
function buildPrintHtml(dish) {
  const rows = (dish.rows || []).filter(r => r.name)
  const rowsHtml = rows.map(r =>
    `<tr><td>${r.name || ''}</td><td>${r.qty || ''} ${r.unit || ''}</td><td>${r.type==='semifinished'?'П/Ф':r.type==='sauce'?'Соус':r.type==='prep'?'Заготовка':'Товар'}</td></tr>`
  ).join('')
  const photoHtml = dish.photo?.dataUrl
    ? `<img src="${dish.photo.dataUrl}" style="width:100%;height:220px;object-fit:cover;border-radius:8px;margin-bottom:16px" />`
    : ''

  return `<!DOCTYPE html><html lang="ru"><head><meta charset="UTF-8"><title>${dish.title || 'Карточка блюда'}</title>
<style>
  body { font-family: 'Arial', sans-serif; margin: 0; padding: 24px; color: #1a1a1a; max-width: 800px; }
  h1 { font-size: 24px; margin: 0 0 4px; }
  .meta { font-size: 13px; color: #666; margin-bottom: 16px; }
  .section { margin-bottom: 18px; }
  .section h3 { font-size: 13px; text-transform: uppercase; letter-spacing: .06em; color: #888; margin: 0 0 8px; border-bottom: 1px solid #eee; padding-bottom: 6px; }
  .section p { font-size: 14px; line-height: 1.6; margin: 0; white-space: pre-wrap; }
  table { width: 100%; border-collapse: collapse; font-size: 13px; }
  th { background: #f5f5f5; padding: 8px 10px; text-align: left; font-size: 11px; text-transform: uppercase; letter-spacing: .05em; color: #888; }
  td { padding: 8px 10px; border-bottom: 1px solid #f0f0f0; }
  .header { display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 20px; }
  .brand { font-size: 10px; color: #aaa; text-transform: uppercase; letter-spacing: .15em; }
  @media print { body { padding: 0 } }
</style></head><body>
  <div class="brand">ChefCloud · Professional Kitchen Platform</div>
  <div class="header">
    <div>
      <h1>${dish.title || 'Без названия'}</h1>
      <div class="meta">${dish.category ? dish.category + ' · ' : ''}Выход: ${dish.output || '—'} · Время сборки: ${dish.assemblyTime || '—'} · Посуда: ${dish.plate || '—'}</div>
    </div>
  </div>
  ${photoHtml}
  ${dish.dishDescription ? `<div class="section"><h3>Описание</h3><p>${dish.dishDescription}</p></div>` : ''}
  ${rows.length > 0 ? `<div class="section"><h3>Состав (${rows.length} позиций)</h3>
    <table><thead><tr><th>Наименование</th><th>Количество</th><th>Тип</th></tr></thead>
    <tbody>${rowsHtml}</tbody></table></div>` : ''}
  ${dish.technology ? `<div class="section"><h3>Технология приготовления</h3><p>${dish.technology}</p></div>` : ''}
  ${dish.serving ? `<div class="section"><h3>Стандарт подачи</h3><p>${dish.serving}</p></div>` : ''}
  ${dish.qualityPoints ? `<div class="section"><h3>Критические точки качества</h3><p>${dish.qualityPoints}</p></div>` : ''}
  ${dish.chefComment ? `<div class="section"><h3>Комментарий бренд-шефа</h3><p>${dish.chefComment}</p></div>` : ''}
  <div style="margin-top:24px;font-size:11px;color:#aaa;border-top:1px solid #eee;padding-top:10px">
    Обновлено: ${formatDate(dish.updatedAt)} · ChefCloud Kitchen OS
  </div>
</body></html>`
}

function DishRow({ dish, selected, onSelect }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={() => onSelect(dish.id)}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display:'flex', alignItems:'center', gap:14, padding:'12px 16px',
        borderRadius:14, cursor:'pointer',
        background: selected ? '#eef4f1' : hov ? '#faf8f4' : 'transparent',
        border: selected ? '1.5px solid #16332b' : '1.5px solid transparent',
        transition:'all .15s',
      }}
    >
      {/* Чекбокс */}
      <div style={{
        width:20, height:20, borderRadius:6, border:`2px solid ${selected?'#16332b':'#d4cfc8'}`,
        background: selected ? '#16332b' : 'transparent',
        display:'flex', alignItems:'center', justifyContent:'center', flexShrink:0,
      }}>
        {selected && <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>}
      </div>

      {/* Фото */}
      <div style={{ width:40, height:40, borderRadius:10, background:'#f0ebe2', flexShrink:0, overflow:'hidden' }}>
        {dish.photo?.dataUrl
          ? <img src={dish.photo.dataUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
          : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0b8ae" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
            </div>
        }
      </div>

      <div style={{ flex:1, minWidth:0 }}>
        <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1a1a', overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{dish.title || 'Без названия'}</div>
        <div style={{ fontSize:12, color:'#a39f98', marginTop:2 }}>
          {dish.category || '—'} · Выход {dish.output || '—'} · {(dish.rows||[]).filter(r=>r.name).length} позиций
        </div>
      </div>

      <div style={{ fontSize:11, fontWeight:700, color:STATUS_COLOR[dish.status]||'#6b7280', background:(STATUS_COLOR[dish.status]||'#6b7280')+'18', padding:'2px 8px', borderRadius:999, flexShrink:0 }}>
        {STATUS_LABEL[dish.status]||dish.status}
      </div>
    </div>
  )
}

export default function PrintPage({ items = [] }) {
  const [selectedIds, setSelectedIds] = useState([])
  const [query, setQuery] = useState('')
  const [format, setFormat] = useState('a4')

  const activeDishes = useMemo(() =>
    (items || []).filter(d => !d.archived), [items])

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase()
    return q ? activeDishes.filter(d => (d.title||'').toLowerCase().includes(q)) : activeDishes
  }, [activeDishes, query])

  function toggleSelect(id) {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(x=>x!==id) : [...prev, id])
  }

  function selectAll() {
    setSelectedIds(filtered.map(d => d.id))
  }

  function clearSelection() { setSelectedIds([]) }

  function printSelected() {
    const toPrint = activeDishes.filter(d => selectedIds.includes(d.id))
    if (toPrint.length === 0) return

    const html = toPrint.length === 1
      ? buildPrintHtml(toPrint[0])
      : `<!DOCTYPE html><html><head><meta charset="UTF-8"><style>
          body{font-family:Arial,sans-serif;margin:0}
          .page{page-break-after:always;padding:24px}
          .page:last-child{page-break-after:auto}
          @media print{.page{padding:0}}
        </style></head><body>
        ${toPrint.map(d => `<div class="page">${buildPrintHtml(d).replace(/<!DOCTYPE.*?<body>/s,'').replace(/<\/body>.*$/s,'')}</div>`).join('')}
        </body></html>`

    const win = window.open('', '_blank')
    if (!win) { alert('Разрешите всплывающие окна для этой страницы'); return }
    win.document.write(html)
    win.document.close()
    win.focus()
    setTimeout(() => win.print(), 400)
  }

  const selectedDishes = activeDishes.filter(d => selectedIds.includes(d.id))

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:20 }} className="cc-fade-in">
      {/* Заголовок */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Печать</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px' }}>Карточки блюд</h1>
          <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>
            {activeDishes.length > 0
              ? `${activeDishes.length} блюд доступно · Выберите для печати`
              : 'Добавьте блюда в разделе Меню'}
          </p>
        </div>
        {selectedIds.length > 0 && (
          <button
            onClick={printSelected}
            style={{ display:'flex', alignItems:'center', gap:8, padding:'11px 22px', borderRadius:14, border:'none', background:'#16332b', color:'#fff', fontWeight:700, fontSize:14, cursor:'pointer', boxShadow:'0 2px 8px rgba(22,51,43,.25)' }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Распечатать ({selectedIds.length})
          </button>
        )}
      </div>

      {activeDishes.length === 0 ? (
        // Пустое состояние
        <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, padding:'64px 32px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ width:64, height:64, borderRadius:18, background:'#f0ebe2', display:'flex', alignItems:'center', justifyContent:'center', margin:'0 auto 20px' }}>
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#a39f98" strokeWidth="1.5" strokeLinecap="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
          </div>
          <div style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', marginBottom:8 }}>Нет блюд для печати</div>
          <div style={{ fontSize:13.5, color:'#a39f98', maxWidth:340, margin:'0 auto' }}>
            Создайте карточки блюд в разделе «Меню» — они появятся здесь для выбора и печати
          </div>
        </div>
      ) : (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 320px', gap:20, alignItems:'start' }}>
          {/* Список блюд */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'14px 16px', borderBottom:'1px solid #f0ebe2', display:'flex', gap:10, alignItems:'center' }}>
              <div style={{ position:'relative', flex:1 }}>
                <span style={{ position:'absolute', left:10, top:'50%', transform:'translateY(-50%)', color:'#a39f98' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                </span>
                <input value={query} onChange={e=>setQuery(e.target.value)} placeholder="Поиск…"
                  style={{ width:'100%', boxSizing:'border-box', paddingLeft:32, padding:'8px 12px 8px 32px', border:'1.5px solid #e8e2d8', borderRadius:10, fontSize:13, outline:'none', background:'#faf8f4', fontFamily:'inherit' }} />
              </div>
              <button onClick={selectAll} style={{ padding:'7px 12px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#1a1a1a', whiteSpace:'nowrap' }}>
                Выбрать все
              </button>
              {selectedIds.length > 0 && (
                <button onClick={clearSelection} style={{ padding:'7px 12px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#a39f98' }}>
                  Сбросить
                </button>
              )}
            </div>
            <div style={{ padding:'8px', maxHeight:'calc(100vh - 360px)', overflowY:'auto' }}>
              {filtered.length === 0 ? (
                <div style={{ padding:'32px', textAlign:'center', color:'#a39f98', fontSize:13 }}>Ничего не найдено</div>
              ) : filtered.map(dish => (
                <DishRow key={dish.id} dish={dish} selected={selectedIds.includes(dish.id)} onSelect={toggleSelect} />
              ))}
            </div>
          </div>

          {/* Правая панель — выбранные + формат */}
          <div style={{ display:'flex', flexDirection:'column', gap:14, position:'sticky', top:80 }}>
            <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:20, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontWeight:800, fontSize:14, color:'#1a1a1a', marginBottom:12 }}>Формат</div>
              {[
                { id:'a4', label:'Полная карточка A4', desc:'Фото, состав, технология, подача' },
                { id:'a6', label:'Station Card A6', desc:'Компактная, для ламинирования', soon:true },
              ].map(f => (
                <div key={f.id}
                  onClick={() => !f.soon && setFormat(f.id)}
                  style={{
                    padding:'10px 12px', borderRadius:12, marginBottom:8,
                    border:`1.5px solid ${format===f.id&&!f.soon ? '#16332b' : '#e8e2d8'}`,
                    background: format===f.id&&!f.soon ? '#eef4f1' : '#faf8f4',
                    cursor: f.soon ? 'default' : 'pointer', opacity: f.soon ? .55 : 1,
                  }}
                >
                  <div style={{ fontWeight:700, fontSize:13, color:'#1a1a1a', display:'flex', justifyContent:'space-between' }}>
                    {f.label}
                    {f.soon && <span style={{ fontSize:10, color:'#a39f98', fontWeight:600 }}>Скоро</span>}
                  </div>
                  <div style={{ fontSize:11.5, color:'#a39f98', marginTop:2 }}>{f.desc}</div>
                </div>
              ))}
            </div>

            {selectedIds.length > 0 ? (
              <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:20, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
                <div style={{ fontWeight:800, fontSize:14, color:'#1a1a1a', marginBottom:10 }}>
                  Выбрано: {selectedIds.length}
                </div>
                <div style={{ display:'flex', flexDirection:'column', gap:6, marginBottom:14 }}>
                  {selectedDishes.slice(0,4).map(d => (
                    <div key={d.id} style={{ fontSize:12.5, color:'#374151', display:'flex', alignItems:'center', gap:6 }}>
                      <div style={{ width:6, height:6, borderRadius:'50%', background:'#16332b', flexShrink:0 }} />
                      <span style={{ overflow:'hidden', textOverflow:'ellipsis', whiteSpace:'nowrap' }}>{d.title}</span>
                    </div>
                  ))}
                  {selectedIds.length > 4 && <div style={{ fontSize:12, color:'#a39f98' }}>+{selectedIds.length-4} ещё</div>}
                </div>
                <button onClick={printSelected} style={{
                  width:'100%', padding:'11px', borderRadius:14, border:'none',
                  background:'#16332b', color:'#fff', fontWeight:700, fontSize:13.5,
                  cursor:'pointer', boxShadow:'0 2px 8px rgba(22,51,43,.2)',
                }}>
                  Распечатать {selectedIds.length > 1 ? `${selectedIds.length} карточки` : 'карточку'}
                </button>
              </div>
            ) : (
              <div style={{ background:'#faf8f4', border:'1px solid #e8e2d8', borderRadius:20, padding:'20px', textAlign:'center', color:'#a39f98', fontSize:13 }}>
                Выберите блюда слева для печати
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
