import { useMemo, useState } from 'react'
import { SparkleIcon, ArrowLeftIcon, AlertIcon, CheckCircleIcon, InfoIcon, EyeIcon, WandIcon } from '../components/icons.jsx'

// ─── Стили ────────────────────────────────────────────────────────────────────
const card = (extra={}) => ({
  background:'#fff', border:'1px solid #e8e2d8',
  borderRadius:20, boxShadow:'0 1px 4px rgba(0,0,0,.06)',
  ...extra,
})
const label = { fontSize:11.5, fontWeight:700, color:'#6b6560', letterSpacing:'.03em', marginBottom:6, display:'block' }
const input = {
  width:'100%', boxSizing:'border-box',
  padding:'10px 14px', border:'1.5px solid #e8e2d8',
  borderRadius:12, fontSize:13.5, outline:'none',
  background:'#faf8f4', color:'#1a1a1a', fontFamily:'inherit',
  transition:'border-color .15s',
}
const select = { ...input, cursor:'pointer' }
const btnPrimary = {
  display:'inline-flex', alignItems:'center', gap:8,
  padding:'11px 22px', borderRadius:12, border:'none',
  background:'#16332b', color:'#fff', fontSize:13.5,
  fontWeight:700, cursor:'pointer', letterSpacing:'-.01em',
  boxShadow:'0 2px 8px rgba(22,51,43,.25)', transition:'all .15s',
}
const btnSecondary = {
  display:'inline-flex', alignItems:'center', gap:7,
  padding:'9px 18px', borderRadius:12, border:'1.5px solid #e8e2d8',
  background:'#fff', color:'#1a1a1a', fontSize:13, fontWeight:600,
  cursor:'pointer', transition:'all .15s',
}

// ─── Mock AI алгоритм ─────────────────────────────────────────────────────────
// Анализирует только реальные блюда из базы. Не выдумывает новые.
function mockAiAnalyze(dishes, params) {
  if (!dishes || dishes.length === 0) return { recommended:[], notRecommended:[], gaps:[] }

  const concept = (params.concept || '').toLowerCase()
  const cuisine = (params.cuisineType || '').toLowerCase()
  const format = (params.format || '').toLowerCase()

  // Ключевые слова по концепциям
  const conceptKeywords = {
    'средиземноморская': ['лосось','тунец','осьминог','морепродукт','оливк','томат','баклажан','цуккини','феta','руккол'],
    'азиатская': ['ролл','суши','том ям','рамен','мисо','тофу','соевый','имбирь','кунжут','нори','рис'],
    'гастробар': ['тартар','карпаччо','севиче','бурата','крудо','паштет','фуа-гра'],
    'бистро': ['стейк','бургер','паста','пицца','ризотто','суп','салат'],
    'fine dining': ['тартюф','фуа-гра','омар','икра','трюфель','дегустационный'],
    'завтраки': ['яичн','каша','тост','круассан','блин','сырник','гранол'],
    'семейный': ['пюре','котлет','борщ','пельмен','вареник','щи'],
  }

  // Находим подходящие ключевые слова для концепции
  let positiveKw = []
  for (const [key, kws] of Object.entries(conceptKeywords)) {
    if (concept.includes(key) || cuisine.includes(key)) {
      positiveKw = [...positiveKw, ...kws]
    }
  }

  const recommended = []
  const notRecommended = []

  dishes.forEach(dish => {
    const text = [
      dish.title, dish.category, dish.dishDescription,
      dish.technology, dish.serving, dish.chefComment,
      ...(dish.rows||[]).map(r => r.name),
    ].join(' ').toLowerCase()

    // Считаем совпадения
    let matchScore = 0
    let matchReasons = []

    positiveKw.forEach(kw => {
      if (text.includes(kw)) {
        matchScore += 15
        matchReasons.push(kw)
      }
    })

    // Бонус за статус
    if (dish.status === 'approved') matchScore += 20

    // Бонус за полноту карточки
    if (dish.photo) matchScore += 10
    if ((dish.rows||[]).length > 2) matchScore += 5
    if (dish.technology?.length > 50) matchScore += 10

    // Если есть категория и она совпадает
    if (dish.category) matchScore += 5

    const score = Math.min(98, Math.max(30, matchScore + Math.floor(Math.random() * 15)))

    if (positiveKw.length === 0) {
      // Нет данных о концепции — рекомендуем всё с нейтральным скором
      recommended.push({
        ...dish,
        aiScore: score,
        aiReason: `Блюдо${dish.status === 'approved' ? ' утверждено' : ''} и может быть включено в меню. Соответствие концепции оценить точнее можно после подключения AI.`,
        aiWarning: dish.status === 'draft' ? 'Карточка в черновике — рекомендуем утвердить перед включением в меню.' : null,
      })
    } else if (score >= 45) {
      recommended.push({
        ...dish,
        aiScore: score,
        aiReason: matchReasons.length > 0
          ? `Содержит ${matchReasons.slice(0,3).join(', ')} — хорошо вписывается в ${params.concept || 'выбранную концепцию'}.`
          : `Хорошо подходит по формату заведения и структуре карточки.`,
        aiWarning: dish.status === 'draft' ? 'Карточка в черновике — рекомендуем утвердить.' : null,
      })
    } else {
      notRecommended.push({
        ...dish,
        aiScore: score,
        aiReason: `Блюдо может не поддерживать ${params.concept || 'выбранную концепцию'} — стиль подачи или состав требует анализа.`,
      })
    }
  })

  // Сортировка по скору
  recommended.sort((a,b) => b.aiScore - a.aiScore)

  // Анализ пробелов по категориям
  const presentCategories = new Set(recommended.map(d => (d.category||'').toLowerCase()))
  const expectedCategories = {
    'Закуски / Холодные': ['закуск','холодн','тартар','карпач'],
    'Салаты': ['салат'],
    'Супы': ['суп','бульон','крем-суп'],
    'Горячие блюда': ['горяч','основн','главн'],
    'Десерты': ['десерт','торт','мусс','панна'],
    'Напитки': ['напит','лимонад','коктейл'],
  }

  const gaps = []
  for (const [category, kws] of Object.entries(expectedCategories)) {
    const found = [...presentCategories].some(c => kws.some(kw => c.includes(kw)))
    if (!found) {
      gaps.push({ category, suggestion: `В меню не хватает раздела "${category}"` })
    }
  }

  // Дополнительные инсайты
  const approved = recommended.filter(d => d.status === 'approved').length
  if (approved < recommended.length * 0.5) {
    gaps.push({ category: 'Статусы', suggestion: 'Более половины рекомендованных блюд — черновики. Рекомендуем утвердить карточки перед финализацией меню.' })
  }
  if (recommended.length > 30) {
    gaps.push({ category: 'Объём', suggestion: `${recommended.length} блюд — слишком большое меню. Оптимально 18–24 позиции для ресторана средней ценовой категории.` })
  }
  if (!recommended.some(d => d.photo)) {
    gaps.push({ category: 'Фотографии', suggestion: 'Ни одно из рекомендованных блюд не имеет фото. Добавьте фотографии для полноценного печатного меню.' })
  }

  return { recommended, notRecommended, gaps }
}

// ─── Компоненты ───────────────────────────────────────────────────────────────

function ScoreBar({ score }) {
  const color = score >= 80 ? '#16a34a' : score >= 60 ? '#d97706' : '#dc2626'
  return (
    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
      <div style={{ flex:1, height:5, borderRadius:999, background:'#f0ebe2', overflow:'hidden' }}>
        <div style={{ height:'100%', borderRadius:999, background:color, width:`${score}%`, transition:'width .6s' }} />
      </div>
      <span style={{ fontSize:12, fontWeight:800, color, minWidth:32 }}>{score}%</span>
    </div>
  )
}

function DishCard({ dish, onAdd, onExclude, inMenu }) {
  const [expanded, setExpanded] = useState(false)
  const statusColor = { approved:'#16a34a', review:'#d97706', draft:'#6b6560' }
  const statusLabel = { approved:'Утверждено', review:'На проверке', draft:'Черновик' }

  return (
    <div style={{ ...card(), padding:'16px 18px', transition:'box-shadow .18s' }}
      onMouseEnter={e=>e.currentTarget.style.boxShadow='0 4px 16px rgba(0,0,0,.09)'}
      onMouseLeave={e=>e.currentTarget.style.boxShadow='0 1px 4px rgba(0,0,0,.06)'}
    >
      <div style={{ display:'flex', gap:14, alignItems:'flex-start' }}>
        {/* Фото или заглушка */}
        <div style={{ width:52, height:52, borderRadius:12, background:'#f0ebe2', flexShrink:0, overflow:'hidden', display:'flex', alignItems:'center', justifyContent:'center' }}>
          {dish.photo?.dataUrl
            ? <img src={dish.photo.dataUrl} alt={dish.title} style={{ width:'100%', height:'100%', objectFit:'cover' }} />
            : <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#c0b8ae" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
          }
        </div>

        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', gap:8, flexWrap:'wrap' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', letterSpacing:'-.01em' }}>{dish.title || 'Без названия'}</div>
            <div style={{ fontSize:11, fontWeight:700, color:statusColor[dish.status]||'#6b6560', background:(statusColor[dish.status]||'#6b6560')+'18', padding:'2px 8px', borderRadius:999, flexShrink:0 }}>
              {statusLabel[dish.status]||dish.status}
            </div>
          </div>

          {dish.category && <div style={{ fontSize:12, color:'#a39f98', marginTop:2 }}>{dish.category}</div>}

          <div style={{ marginTop:10 }}>
            <ScoreBar score={dish.aiScore || 50} />
          </div>

          {dish.aiReason && (
            <div style={{ fontSize:12.5, color:'#6b6560', marginTop:8, lineHeight:1.6 }}>
              {dish.aiReason}
            </div>
          )}

          {dish.aiWarning && (
            <div style={{ display:'flex', alignItems:'flex-start', gap:6, marginTop:8, padding:'8px 10px', background:'#fffbeb', borderRadius:10, border:'1px solid #fde68a' }}>
              <AlertIcon style={{ color:'#d97706', flexShrink:0, marginTop:1 }} />
              <span style={{ fontSize:12, color:'#92400e' }}>{dish.aiWarning}</span>
            </div>
          )}
        </div>
      </div>

      <div style={{ display:'flex', gap:8, marginTop:14, flexWrap:'wrap' }}>
        {inMenu
          ? <div style={{ fontSize:12.5, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}><CheckCircleIcon style={{color:'#16a34a'}} /> Добавлено в меню</div>
          : <button onClick={() => onAdd(dish)} style={{ ...btnPrimary, padding:'7px 14px', fontSize:12.5 }}>Добавить в меню</button>
        }
        <button onClick={() => onExclude(dish)} style={{ ...btnSecondary, padding:'7px 14px', fontSize:12.5, color:'#dc2626', borderColor:'#fca5a5' }}>Исключить</button>
        <button onClick={() => setExpanded(!expanded)} style={{ ...btnSecondary, padding:'7px 14px', fontSize:12.5 }}>
          <EyeIcon /> {expanded ? 'Свернуть' : 'Детали'}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop:14, paddingTop:14, borderTop:'1px solid #f0ebe2' }}>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:10, fontSize:12.5, color:'#6b6560' }}>
            {dish.output && <div><span style={{ color:'#a39f98' }}>Выход: </span>{dish.output}</div>}
            {dish.assemblyTime && <div><span style={{ color:'#a39f98' }}>Время: </span>{dish.assemblyTime}</div>}
            {dish.plate && <div><span style={{ color:'#a39f98' }}>Посуда: </span>{dish.plate}</div>}
            {(dish.rows||[]).length > 0 && <div><span style={{ color:'#a39f98' }}>Позиций состава: </span>{dish.rows.length}</div>}
          </div>
          {dish.dishDescription && <div style={{ marginTop:8, fontSize:12.5, color:'#6b6560', lineHeight:1.6 }}>{dish.dishDescription}</div>}
        </div>
      )}
    </div>
  )
}

// ─── Шаги ─────────────────────────────────────────────────────────────────────
const STEPS = ['Параметры', 'Анализ AI', 'Результат', 'Итоговое меню']

const CONCEPT_OPTIONS = [
  'Рыбный ресторан', 'Средиземноморская кухня', 'Гастробар',
  'Fine Dining', 'Бистро', 'Семейный ресторан', 'Азиатская кухня',
  'Японская кухня', 'Итальянская кухня', 'Доставка', 'Банкетное меню',
  'Завтраки', 'Летнее меню', 'Авторская кухня',
]
const FORMAT_OPTIONS = ['Casual Dining', 'Fine Dining', 'Bistro', 'Fast Casual', 'Delivery', 'Bar & Grill', 'Café', 'Banquet']
const AUDIENCE_OPTIONS = ['Деловые люди', 'Семьи с детьми', 'Молодёжь 20–30', 'Туристы', 'Премиальный сегмент', 'Широкая аудитория']
const SEASON_OPTIONS = ['Весна', 'Лето', 'Осень', 'Зима', 'Всесезонное']

// ─── Главный компонент ────────────────────────────────────────────────────────
export default function MenuArchitectPage({ items = [], collections = [], onCreateCollectionFromDishes, onNavigate }) {
  const [step, setStep] = useState(0)
  const [params, setParams] = useState({
    menuName: '',
    concept: '',
    cuisineType: '',
    format: '',
    avgCheck: '',
    city: '',
    audience: '',
    season: '',
    sectionCount: '6',
    dishCount: '24',
    foodCostLimit: '30',
    mustInclude: '',
    mustExclude: '',
  })
  const [result, setResult] = useState(null)
  const [menuItems, setMenuItems] = useState([])
  const [excluded, setExcluded] = useState([])
  const [analyzing, setAnalyzing] = useState(false)
  const [selectedCollections, setSelectedCollections] = useState([])
  const [savedCollection, setSavedCollection] = useState(null)

  const set = (k,v) => setParams(p => ({...p, [k]:v}))

  function runAnalysis() {
    setAnalyzing(true)
    setTimeout(() => {
      const sourceItems = selectedCollections.length > 0
        ? items.filter(d => selectedCollections.some(colId => {
            const col = collections.find(c => c.id === colId)
            return col?.dishIds.includes(d.id)
          }))
        : items
      const r = mockAiAnalyze(sourceItems, params)
      setResult(r)
      setAnalyzing(false)
      setStep(2)
    }, 1800)
  }

  function addToMenu(dish) {
    if (!menuItems.find(d => d.id === dish.id)) {
      setMenuItems(prev => [...prev, dish])
    }
  }

  function excludeDish(dish) {
    setExcluded(prev => [...prev, dish.id])
    setMenuItems(prev => prev.filter(d => d.id !== dish.id))
  }

  const filteredRecommended = useMemo(
    () => (result?.recommended || []).filter(d => !excluded.includes(d.id)),
    [result, excluded]
  )
  const filteredNotRec = useMemo(
    () => (result?.notRecommended || []).filter(d => !excluded.includes(d.id)),
    [result, excluded]
  )

  // Группировка итогового меню по категориям
  const menuByCategory = useMemo(() => {
    const groups = {}
    menuItems.forEach(dish => {
      const cat = dish.category || 'Прочее'
      if (!groups[cat]) groups[cat] = []
      groups[cat].push(dish)
    })
    return groups
  }, [menuItems])

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24, maxWidth:1100 }} className="cc-fade-in">

      {/* ── Заголовок ── */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:12 }}>
        <div>
          <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6 }}>
            <SparkleIcon style={{ color:'#b99150' }} />
            <span style={{ fontSize:11.5, fontWeight:700, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase' }}>AI Menu Architect</span>
          </div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px' }}>Конструктор меню</h1>
          <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>
            {items.length > 0
              ? `Анализирует ${items.length} блюд из вашей базы. Не добавляет блюда, которых нет в системе.`
              : 'Добавьте блюда в раздел Меню, чтобы AI мог их проанализировать.'
            }
          </p>
        </div>
        {step > 0 && step < 3 && (
          <button onClick={() => { setStep(0); setResult(null); setMenuItems([]); setExcluded([]) }} style={btnSecondary}>
            <ArrowLeftIcon /> Начать заново
          </button>
        )}
      </div>

      {/* ── Прогресс-шаги ── */}
      <div style={{ display:'flex', gap:0, alignItems:'center' }}>
        {STEPS.map((s, i) => (
          <div key={s} style={{ display:'flex', alignItems:'center', flex: i < STEPS.length-1 ? 1 : 0 }}>
            <div style={{ display:'flex', flexDirection:'column', alignItems:'center', gap:4 }}>
              <div style={{
                width:28, height:28, borderRadius:'50%',
                background: i < step ? '#16332b' : i === step ? '#16332b' : '#f0ebe2',
                color: i <= step ? '#fff' : '#a39f98',
                display:'flex', alignItems:'center', justifyContent:'center',
                fontSize:12, fontWeight:800, transition:'all .3s',
                boxShadow: i === step ? '0 0 0 4px rgba(22,51,43,.12)' : 'none',
              }}>
                {i < step ? <CheckCircleIcon style={{width:14,height:14}} /> : i+1}
              </div>
              <div style={{ fontSize:11, fontWeight: i===step ? 700 : 500, color: i===step ? '#1a1a1a' : '#a39f98', whiteSpace:'nowrap' }}>{s}</div>
            </div>
            {i < STEPS.length-1 && (
              <div style={{ flex:1, height:1.5, background: i < step ? '#16332b' : '#e8e2d8', margin:'0 6px', marginBottom:18, transition:'background .3s' }} />
            )}
          </div>
        ))}
      </div>

      {/* ── Шаг 0: Параметры ── */}
      {step === 0 && (
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
          <div style={{ ...card(), padding:'24px 28px', gridColumn:'1/-1' }}>
            <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', marginBottom:4 }}>Описание меню</div>
            <div style={{ fontSize:13, color:'#a39f98', marginBottom:20 }}>AI использует эти параметры для анализа вашей базы блюд</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr 1fr', gap:16 }}>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Название меню</span>
                <input value={params.menuName} onChange={e=>set('menuName',e.target.value)} placeholder="Летнее меню 2025" style={input} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Концепция заведения</span>
                <select value={params.concept} onChange={e=>set('concept',e.target.value)} style={select}>
                  <option value="">— Выбрать —</option>
                  {CONCEPT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Тип кухни</span>
                <input value={params.cuisineType} onChange={e=>set('cuisineType',e.target.value)} placeholder="Японская, средиземноморская..." style={input} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Формат заведения</span>
                <select value={params.format} onChange={e=>set('format',e.target.value)} style={select}>
                  <option value="">— Выбрать —</option>
                  {FORMAT_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Целевая аудитория</span>
                <select value={params.audience} onChange={e=>set('audience',e.target.value)} style={select}>
                  <option value="">— Выбрать —</option>
                  {AUDIENCE_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Сезон</span>
                <select value={params.season} onChange={e=>set('season',e.target.value)} style={select}>
                  <option value="">— Выбрать —</option>
                  {SEASON_OPTIONS.map(o => <option key={o}>{o}</option>)}
                </select>
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Средний чек (₽)</span>
                <input value={params.avgCheck} onChange={e=>set('avgCheck',e.target.value)} placeholder="1500–2500" style={input} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Кол-во блюд в меню</span>
                <input type="number" value={params.dishCount} onChange={e=>set('dishCount',e.target.value)} min="6" max="60" style={input} />
              </label>
              <label style={{ display:'flex', flexDirection:'column', gap:6 }}>
                <span style={label}>Лимит food cost (%)</span>
                <input type="number" value={params.foodCostLimit} onChange={e=>set('foodCostLimit',e.target.value)} min="15" max="50" style={input} />
              </label>
            </div>
          </div>

          <div style={{ ...card(), padding:'24px 28px' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:14 }}>Обязательно включить</div>
            <textarea
              value={params.mustInclude}
              onChange={e=>set('mustInclude',e.target.value)}
              placeholder="Фирменные блюда, хиты продаж, сезонные позиции..."
              rows={4}
              style={{ ...input, resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          <div style={{ ...card(), padding:'24px 28px' }}>
            <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:14 }}>Исключить из меню</div>
            <textarea
              value={params.mustExclude}
              onChange={e=>set('mustExclude',e.target.value)}
              placeholder="Сложные блюда с низкой маржой, устаревшие позиции..."
              rows={4}
              style={{ ...input, resize:'vertical', lineHeight:1.6 }}
            />
          </div>

          {collections.filter(c => !c.system).length > 0 && (
            <div style={{ ...card(), padding:'24px 28px', gridColumn:'1/-1' }}>
              <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:6 }}>Анализировать коллекции</div>
              <div style={{ fontSize:12.5, color:'#a39f98', marginBottom:14 }}>Оставьте пустым — AI проанализирует всю базу. Или выберите конкретные коллекции.</div>
              <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
                {collections.filter(c => !c.system).map(col => (
                  <button
                    key={col.id}
                    onClick={() => setSelectedCollections(prev =>
                      prev.includes(col.id) ? prev.filter(id => id !== col.id) : [...prev, col.id]
                    )}
                    style={{
                      display:'flex', alignItems:'center', gap:7, padding:'8px 14px', borderRadius:10, cursor:'pointer', fontSize:13, fontWeight:600,
                      border: selectedCollections.includes(col.id) ? `1.5px solid ${col.color}` : '1.5px solid #e8e2d8',
                      background: selectedCollections.includes(col.id) ? col.color+'18' : '#fff',
                      color: selectedCollections.includes(col.id) ? col.color : '#6b6560',
                      transition:'all .15s',
                    }}
                  >
                    <div style={{ width:8, height:8, borderRadius:'50%', background:col.color }} />
                    {col.name}
                    <span style={{ fontSize:11, opacity:.6 }}>({col.dishIds.length})</span>
                  </button>
                ))}
              </div>
              {selectedCollections.length > 0 && (
                <div style={{ fontSize:12, color:'#a39f98', marginTop:10 }}>
                  Выбрано коллекций: {selectedCollections.length} · блюд для анализа: {[...new Set(selectedCollections.flatMap(id => collections.find(c=>c.id===id)?.dishIds||[]))].length}
                </div>
              )}
            </div>
          )}

          <div style={{ gridColumn:'1/-1', display:'flex', justifyContent:'flex-end', gap:10 }}>
            {items.length === 0 && (
              <div style={{ display:'flex', alignItems:'center', gap:8, padding:'10px 16px', background:'#fffbeb', border:'1px solid #fde68a', borderRadius:12, fontSize:13, color:'#92400e' }}>
                <AlertIcon style={{color:'#d97706'}} />
                Добавьте блюда в раздел "Меню" — AI анализирует только существующую базу
              </div>
            )}
            <button
              onClick={() => { setStep(1); setTimeout(runAnalysis, 100) }}
              disabled={items.length === 0}
              style={{ ...btnPrimary, opacity: items.length===0 ? .5 : 1, cursor: items.length===0 ? 'not-allowed' : 'pointer' }}
            >
              <SparkleIcon /> Запустить AI анализ
            </button>
          </div>
        </div>
      )}

      {/* ── Шаг 1: Анализ ── */}
      {step === 1 && (
        <div style={{ ...card(), padding:'64px', textAlign:'center' }}>
          <div style={{ marginBottom:24 }}>
            <div style={{
              width:64, height:64, borderRadius:20, background:'#eef4f1',
              display:'flex', alignItems:'center', justifyContent:'center',
              margin:'0 auto 20px',
              animation: analyzing ? 'ccSpin 1.5s linear infinite' : 'none',
            }}>
              <SparkleIcon style={{ width:28, height:28, color:'#16332b' }} />
            </div>
            <style>{`@keyframes ccSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }`}</style>
            <div style={{ fontSize:18, fontWeight:800, color:'#1a1a1a', marginBottom:8 }}>
              {analyzing ? 'Анализирую базу блюд…' : 'Готово'}
            </div>
            <div style={{ fontSize:13.5, color:'#a39f98', maxWidth:420, margin:'0 auto', lineHeight:1.7 }}>
              {analyzing
                ? `Проверяю ${items.length} блюд на соответствие концепции "${params.concept || 'вашего заведения'}"…`
                : 'Анализ завершён'
              }
            </div>
          </div>
          {analyzing && (
            <div style={{ maxWidth:320, margin:'0 auto' }}>
              {['Анализ категорий…','Оценка концепции…','Проверка состава…','Формирование рекомендаций…'].map((s,i) => (
                <div key={s} style={{ display:'flex', alignItems:'center', gap:10, marginBottom:10, padding:'10px 14px', background:'#faf8f4', borderRadius:12, fontSize:13, color:'#6b6560' }}>
                  <div style={{ width:8, height:8, borderRadius:'50%', background:'#16332b', animation:`ccPulse .8s ${i*.2}s ease infinite alternate` }} />
                  <style>{`@keyframes ccPulse { from{opacity:.3} to{opacity:1} }`}</style>
                  {s}
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Шаг 2: Результат ── */}
      {step === 2 && result && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Сводка */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            {[
              { label:'Проанализировано', v:items.length, color:'#1a1a1a', bg:'#faf8f4' },
              { label:'Рекомендовано', v:filteredRecommended.length, color:'#16a34a', bg:'#f0fdf4' },
              { label:'Не рекомендуется', v:filteredNotRec.length, color:'#dc2626', bg:'#fff5f5' },
              { label:'Пробелов найдено', v:result.gaps.length, color:'#d97706', bg:'#fffbeb' },
            ].map(s => (
              <div key={s.label} style={{ ...card(), padding:'18px 20px' }}>
                <div style={{ fontSize:26, fontWeight:900, color:s.color, letterSpacing:'-.04em' }}>{s.v}</div>
                <div style={{ fontSize:12, fontWeight:700, color:'#6b6560', marginTop:5 }}>{s.label}</div>
              </div>
            ))}
          </div>

          {/* Пробелы */}
          {result.gaps.length > 0 && (
            <div style={{ ...card(), padding:'20px 24px' }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <InfoIcon style={{color:'#d97706'}} /> Что стоит улучшить
              </div>
              <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                {result.gaps.map((g,i) => (
                  <div key={i} style={{ display:'flex', alignItems:'flex-start', gap:10, padding:'10px 14px', background:'#fffbeb', borderRadius:12 }}>
                    <div style={{ width:6, height:6, borderRadius:'50%', background:'#d97706', marginTop:5, flexShrink:0 }} />
                    <span style={{ fontSize:13, color:'#78350f', lineHeight:1.6 }}>{g.suggestion}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Рекомендованные */}
          <div>
            <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
              <CheckCircleIcon style={{color:'#16a34a'}} />
              Рекомендованные блюда
              <span style={{ fontSize:12, fontWeight:600, color:'#a39f98' }}>({filteredRecommended.length})</span>
            </div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
              {filteredRecommended.map(dish => (
                <DishCard
                  key={dish.id} dish={dish}
                  onAdd={addToMenu} onExclude={excludeDish}
                  inMenu={menuItems.some(d => d.id === dish.id)}
                />
              ))}
            </div>
          </div>

          {/* Не рекомендованные */}
          {filteredNotRec.length > 0 && (
            <div>
              <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:14, display:'flex', alignItems:'center', gap:8 }}>
                <AlertIcon style={{color:'#dc2626'}} />
                Не рекомендуется включать
                <span style={{ fontSize:12, fontWeight:600, color:'#a39f98' }}>({filteredNotRec.length})</span>
              </div>
              <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:14 }}>
                {filteredNotRec.map(dish => (
                  <DishCard key={dish.id} dish={dish} onAdd={addToMenu} onExclude={excludeDish} inMenu={false} />
                ))}
              </div>
            </div>
          )}

          <div style={{ display:'flex', justifyContent:'flex-end', gap:10 }}>
            {menuItems.length > 0 && onCreateCollectionFromDishes && !savedCollection && (
              <button
                onClick={() => {
                  const col = onCreateCollectionFromDishes({
                    name: params.menuName || `Меню ${new Date().toLocaleDateString('ru-RU')}`,
                    description: params.concept,
                    color: '#16332b',
                    dishIds: menuItems.map(d => d.id),
                  })
                  setSavedCollection(col)
                }}
                style={{ ...btnSecondary }}
              >Сохранить как коллекцию</button>
            )}
            {savedCollection && (
              <div style={{ fontSize:13, color:'#16a34a', fontWeight:700, display:'flex', alignItems:'center', gap:6 }}>
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                Коллекция "{savedCollection.name}" создана
              </div>
            )}
            <button onClick={() => setStep(3)} style={{ ...btnPrimary }} disabled={menuItems.length === 0}>
              <WandIcon /> Перейти к итоговому меню ({menuItems.length} блюд)
            </button>
          </div>
        </div>
      )}

      {/* ── Шаг 3: Итоговое меню ── */}
      {step === 3 && (
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>
          <div style={{ ...card(), padding:'24px 28px' }}>
            <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:20 }}>
              <div>
                <div style={{ fontWeight:900, fontSize:18, color:'#1a1a1a', letterSpacing:'-.03em' }}>
                  {params.menuName || 'Итоговое меню'}
                </div>
                <div style={{ fontSize:13, color:'#a39f98', marginTop:3 }}>
                  {params.concept && `${params.concept} · `}{menuItems.length} позиций
                </div>
              </div>
              <div style={{ display:'flex', gap:8 }}>
                <div style={{ ...btnSecondary, fontSize:12.5, opacity:.5, cursor:'default', display:'inline-flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" y1="15" x2="12" y2="3"/></svg>
                  PDF — скоро
                </div>
                <button onClick={() => window.print()} style={{ ...btnSecondary, fontSize:12.5, display:'inline-flex', alignItems:'center', gap:6 }}>
                  <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
                  Печать
                </button>
              </div>
            </div>

            {Object.keys(menuByCategory).length === 0
              ? <div style={{ textAlign:'center', padding:'40px', color:'#a39f98', fontSize:13.5 }}>Добавьте блюда на предыдущем шаге</div>
              : Object.entries(menuByCategory).map(([cat, dishes]) => (
                <div key={cat} style={{ marginBottom:24 }}>
                  <div style={{ fontSize:11.5, fontWeight:800, color:'#a39f98', letterSpacing:'.10em', textTransform:'uppercase', marginBottom:12, paddingBottom:8, borderBottom:'1px solid #f0ebe2' }}>
                    {cat}
                  </div>
                  <div style={{ display:'flex', flexDirection:'column', gap:8 }}>
                    {dishes.map(dish => (
                      <div key={dish.id} style={{ display:'flex', alignItems:'center', gap:14, padding:'10px 14px', borderRadius:12, background:'#faf8f4' }}>
                        <div style={{ width:36, height:36, borderRadius:10, background:'#f0ebe2', flexShrink:0, overflow:'hidden' }}>
                          {dish.photo?.dataUrl
                            ? <img src={dish.photo.dataUrl} alt="" style={{ width:'100%', height:'100%', objectFit:'cover' }} />
                            : <div style={{ width:'100%', height:'100%', display:'flex', alignItems:'center', justifyContent:'center' }}>
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#c0b8ae" strokeWidth="1.5"><rect x="3" y="3" width="18" height="18" rx="2"/><circle cx="8.5" cy="8.5" r="1.5"/><polyline points="21 15 16 10 5 21"/></svg>
                              </div>
                          }
                        </div>
                        <div style={{ flex:1 }}>
                          <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1a1a' }}>{dish.title}</div>
                          {dish.output && <div style={{ fontSize:12, color:'#a39f98' }}>Выход: {dish.output}</div>}
                        </div>
                        <button
                          onClick={() => excludeDish(dish)}
                          style={{ background:'none', border:'none', cursor:'pointer', color:'#a39f98', padding:4 }}
                        >
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              ))
            }
          </div>

          {/* Шаблоны оформления */}
          <div style={{ ...card(), padding:'24px 28px' }}>
            <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:6, display:'flex', alignItems:'center', gap:8 }}>
              <WandIcon style={{color:'#b99150'}} /> Дизайн меню
            </div>
            <div style={{ fontSize:13, color:'#a39f98', marginBottom:18 }}>Выберите стилистику печатного меню</div>
            <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:14 }}>
              {[
                { name:'Minimal Premium', desc:'Чистый белый, минимальные линии, акцент на типографику', bg:'#fafafa', accent:'#1a1a1a' },
                { name:'Mediterranean', desc:'Тёплые тона, оливковый и терракота, средиземноморский дух', bg:'#f7f2ea', accent:'#8b4513' },
                { name:'Fine Dining', desc:'Тёмный фон, золотые акценты, элегантный шрифт с засечками', bg:'#1a1a1a', accent:'#d4aa6a' },
              ].map(tmpl => (
                <div key={tmpl.name}
                  style={{ ...card(), padding:'20px', background:tmpl.bg, cursor:'pointer', border:`1.5px solid ${tmpl.accent}22` }}
                  onMouseEnter={e=>e.currentTarget.style.borderColor=tmpl.accent}
                  onMouseLeave={e=>e.currentTarget.style.borderColor=`${tmpl.accent}22`}
                >
                  <div style={{ fontWeight:800, fontSize:14, color:tmpl.accent, marginBottom:6 }}>{tmpl.name}</div>
                  <div style={{ fontSize:12, color:tmpl.accent, opacity:.6, lineHeight:1.6 }}>{tmpl.desc}</div>
                  <div style={{ marginTop:14, display:'flex', flexDirection:'column', gap:4 }}>
                    {['Закуски','Салаты','Горячее'].map(s => (
                      <div key={s} style={{ height:3, borderRadius:999, background:tmpl.accent, opacity:.2 }} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <button onClick={() => { setStep(0); setResult(null); setMenuItems([]); setExcluded([]) }} style={{ ...btnSecondary, alignSelf:'flex-start' }}>
            <ArrowLeftIcon /> Создать новое меню
          </button>
        </div>
      )}
    </div>
  )
}
