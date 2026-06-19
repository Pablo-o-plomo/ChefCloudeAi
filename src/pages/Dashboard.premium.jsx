import { useState } from 'react'

// Демо-данные для дашборда — только для отображения, не влияют на реальные данные
const RECENT_DEMO = [
  { title: 'Ролл Дракон', category: 'Роллы', status: 'approved', output: '280 г', time: '3 мин', color: '#0f4c35' },
  { title: 'Том Ям с креветкой', category: 'Супы', status: 'approved', output: '350 мл', time: '5 мин', color: '#1a3a5c' },
  { title: 'Тартар из лосося', category: 'Холодные', status: 'review', output: '180 г', time: '4 мин', color: '#3d1a5c' },
  { title: 'Поке с тунцом', category: 'Горячее', status: 'approved', output: '320 г', time: '6 мин', color: '#4c2a0f' },
]

const STATUS_LABEL = { approved: 'Утверждено', review: 'На проверке', draft: 'Черновик' }
const STATUS_COLOR = { approved: '#16a34a', review: '#d97706', draft: '#6b7280' }
const STATUS_BG    = { approved: '#f0fdf4', review: '#fffbeb', draft: '#f9fafb' }

function KpiCard({ icon, label, value, sub, accent, onClick }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        background: '#fff',
        border: '1px solid #ede9e0',
        borderRadius: 20,
        padding: '22px 24px',
        cursor: onClick ? 'pointer' : 'default',
        transition: 'all .18s ease',
        boxShadow: hov ? '0 8px 28px rgba(0,0,0,.10)' : '0 1px 4px rgba(0,0,0,.06)',
        transform: hov && onClick ? 'translateY(-2px)' : 'none',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      <div style={{
        position: 'absolute', top: 0, right: 0,
        width: 80, height: 80, borderRadius: '0 20px 0 80px',
        background: accent + '12',
        pointerEvents: 'none',
      }} />
      <div style={{
        width: 40, height: 40, borderRadius: 12,
        background: accent + '18',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 20, marginBottom: 14,
      }}>{icon}</div>
      <div style={{ fontSize: 28, fontWeight: 900, color: '#1a1a1a', letterSpacing: '-.04em', lineHeight: 1 }}>{value}</div>
      <div style={{ fontSize: 12.5, fontWeight: 700, color: '#6b6560', marginTop: 6, letterSpacing: '-.01em' }}>{label}</div>
      {sub && <div style={{ fontSize: 11, color: '#a39f98', marginTop: 4 }}>{sub}</div>}
    </div>
  )
}

function ActivityRow({ item, i }) {
  const [hov, setHov] = useState(false)
  return (
    <div
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        display: 'flex', alignItems: 'center', gap: 14,
        padding: '12px 16px',
        borderRadius: 14,
        background: hov ? '#faf8f4' : 'transparent',
        transition: 'background .15s',
        cursor: 'default',
        animationDelay: `${i * 0.06}s`,
      }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 12, flexShrink: 0,
        background: `linear-gradient(135deg, ${item.color}22, ${item.color}44)`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18,
      }}>🍽️</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a1a', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: '#a39f98', marginTop: 2 }}>{item.category} · {item.output} · {item.time}</div>
      </div>
      <div style={{
        fontSize: 11, fontWeight: 700,
        color: STATUS_COLOR[item.status],
        background: STATUS_BG[item.status],
        padding: '3px 10px', borderRadius: 999, flexShrink: 0,
      }}>{STATUS_LABEL[item.status]}</div>
    </div>
  )
}

function QuickAction({ icon, label, desc, onClick, accent = '#16332b' }) {
  const [hov, setHov] = useState(false)
  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHov(true)}
      onMouseLeave={() => setHov(false)}
      style={{
        textAlign: 'left', border: '1px solid #ede9e0',
        borderRadius: 18, padding: '18px 20px',
        background: hov ? '#faf8f4' : '#fff',
        cursor: 'pointer',
        transition: 'all .18s ease',
        boxShadow: hov ? '0 6px 20px rgba(0,0,0,.09)' : '0 1px 4px rgba(0,0,0,.05)',
        transform: hov ? 'translateY(-1px)' : 'none',
      }}
    >
      <div style={{
        width: 36, height: 36, borderRadius: 10,
        background: accent + '15',
        display: 'flex', alignItems: 'center', justifyContent: 'center',
        fontSize: 18, marginBottom: 12,
      }}>{icon}</div>
      <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a1a', marginBottom: 4, letterSpacing: '-.01em' }}>{label}</div>
      <div style={{ fontSize: 12, color: '#a39f98', lineHeight: 1.5 }}>{desc}</div>
    </button>
  )
}

export default function PremiumDashboard({ items, semifinished, products, categories, trial, onNavigate }) {
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const lastUpdated = items.length > 0
    ? (() => {
        const sorted = [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        return sorted[0]?.updatedAt ? new Date(sorted[0].updatedAt).toLocaleDateString('ru-RU') : '—'
      })()
    : '—'

  const approved = items.filter(i => i.status === 'approved').length
  const recentItems = items.length > 0
    ? [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
    : RECENT_DEMO

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="cc-fade-in">

      {/* ── Hero ─────────────────────────────────────────────────── */}
      <div style={{
        background: 'linear-gradient(135deg, #0f2219 0%, #16332b 50%, #102820 100%)',
        borderRadius: 28,
        padding: '40px 44px 36px',
        color: '#fff',
        position: 'relative',
        overflow: 'hidden',
      }}>
        {/* Decorative blobs */}
        <div style={{ position:'absolute', top:-100, right:-60, width:320, height:320, borderRadius:'50%', background:'radial-gradient(circle, rgba(185,145,80,.22) 0%, transparent 65%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', bottom:-120, left:-40, width:280, height:280, borderRadius:'50%', background:'radial-gradient(circle, rgba(22,51,43,.9) 0%, transparent 70%)', pointerEvents:'none' }} />
        <div style={{ position:'absolute', top:'30%', right:'25%', width:180, height:180, borderRadius:'50%', background:'radial-gradient(circle, rgba(185,145,80,.08) 0%, transparent 70%)', pointerEvents:'none' }} />

        <div style={{ position:'relative', zIndex:1, display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:24 }}>
          <div>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:16 }}>
              <div style={{ width:8, height:8, borderRadius:'50%', background:'#4ade80', boxShadow:'0 0 8px #4ade80' }} />
              <span style={{ fontSize:11.5, color:'rgba(255,255,255,.5)', fontWeight:600, letterSpacing:'.06em', textTransform:'uppercase' }}>
                Система активна
              </span>
            </div>
            <h1 style={{ margin:'0 0 10px', fontSize:34, fontWeight:900, letterSpacing:'-.05em', lineHeight:1.05 }}>
              Добро пожаловать<br />
              <span style={{ color:'#b99150' }}>в ChefCloud</span>
            </h1>
            <p style={{ margin:0, color:'rgba(255,255,255,.5)', fontSize:13.5, lineHeight:1.7, maxWidth:420 }}>
              {today} · {items.length > 0 ? `${items.length} блюд в базе` : 'Начните с создания первого блюда'}
            </p>
          </div>
          <div style={{ display:'flex', gap:10 }}>
            <button
              onClick={() => onNavigate('list')}
              style={{
                padding:'10px 20px', borderRadius:14,
                background:'rgba(255,255,255,.10)', border:'1px solid rgba(255,255,255,.15)',
                color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                backdropFilter:'blur(8px)', transition:'all .18s',
              }}
            >🍽️ Открыть меню</button>
            <button
              onClick={() => onNavigate('ai')}
              style={{
                padding:'10px 20px', borderRadius:14,
                background:'linear-gradient(135deg, #b99150, #d4aa6a)',
                border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(185,145,80,.4)', transition:'all .18s',
              }}
            >🤖 AI Ассистент</button>
          </div>
        </div>

        {/* KPI стекло */}
        <div style={{
          position:'relative', zIndex:1,
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:32,
        }}>
          {[
            { label:'Блюд в меню',      value:items.length,       icon:'↗', sub:'карточек' },
            { label:'Утверждено',        value:approved,           icon:'', sub:'финальных' },
            { label:'Полуфабрикатов',   value:semifinished.length, icon:'≡', sub:'позиций' },
            { label:'На складе',        value:products.length,    icon:'', sub:'товаров' },
          ].map(s => (
            <div key={s.label} style={{
              background:'rgba(255,255,255,.07)',
              backdropFilter:'blur(12px)',
              WebkitBackdropFilter:'blur(12px)',
              border:'1px solid rgba(255,255,255,.12)',
              borderRadius:18, padding:'16px 18px',
              transition:'background .18s',
            }}>
              <div style={{ fontSize:26, fontWeight:900, color:'#fff', letterSpacing:'-.04em', lineHeight:1 }}>{s.value}</div>
              <div style={{ fontSize:11.5, color:'rgba(255,255,255,.45)', marginTop:5, fontWeight:600 }}>{s.label}</div>
            </div>
          ))}
        </div>
      </div>

      {/* ── Основная сетка ────────────────────────────────────────── */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

        {/* Левая колонка */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* Последние блюда */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ padding:'20px 24px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', letterSpacing:'-.02em' }}>
                  {items.length > 0 ? 'Последние блюда' : 'Демо-блюда'}
                </div>
                <div style={{ fontSize:12, color:'#a39f98', marginTop:2 }}>
                  {items.length > 0 ? `Обновлено ${lastUpdated}` : 'Добавьте первые блюда через раздел Меню'}
                </div>
              </div>
              <button
                onClick={() => onNavigate('list')}
                style={{ fontSize:12.5, fontWeight:700, color:'#16332b', background:'#eef4f1', border:'none', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}
              >Все блюда →</button>
            </div>
            <div style={{ padding:'8px 8px 12px' }}>
              {recentItems.map((item, i) => <ActivityRow key={item.id || i} item={item} i={i} />)}
            </div>
          </div>

          {/* Быстрые действия */}
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', letterSpacing:'-.02em', marginBottom:14 }}>Быстрые действия</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <QuickAction icon="🍽️" label="Новое блюдо" desc="Создать карточку блюда с фото и составом" onClick={() => onNavigate('create')} accent="#16332b" />
              <QuickAction icon="🤖" label="AI Ассистент" desc="Сгенерировать описание или технологию" onClick={() => onNavigate('ai')} accent="#7c3aed" />
              <QuickAction icon="🥣" label="Добавить П/Ф" desc="Новый полуфабрикат в базу" onClick={() => onNavigate('semifinished')} accent="#0f4c35" />
              <QuickAction icon="💾" label="Резервная копия" desc="Экспортировать все данные" onClick={() => onNavigate('settings')} accent="#b99150" />
            </div>
          </div>
        </div>

        {/* Правая колонка */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* Статус системы */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:18, letterSpacing:'-.02em' }}>Статус системы</div>
            {[
              { label:'Локальное хранение', status:'Активно', ok:true, icon:'⊙' },
              { label:'Данные блюд', status:items.length > 0 ? `${items.length} записей` : 'Пусто', ok:items.length > 0, icon:'🗂️' },
              { label:'Резервная копия', status:'Настройте', ok:false, icon:'🔒' },
              { label:'AI Ассистент', status:'Ожидает API', ok:false, icon:'✦' },
            ].map(row => (
              <div key={row.label} style={{ display:'flex', alignItems:'center', gap:12, marginBottom:14 }}>
                <div style={{ width:32, height:32, borderRadius:10, background:row.ok ? '#f0fdf4' : '#f9fafb', display:'flex', alignItems:'center', justifyContent:'center', fontSize:15, flexShrink:0 }}>{row.icon}</div>
                <div style={{ flex:1 }}>
                  <div style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{row.label}</div>
                  <div style={{ fontSize:11.5, color:row.ok ? '#16a34a' : '#a39f98', fontWeight:600 }}>{row.status}</div>
                </div>
                <div style={{ width:8, height:8, borderRadius:'50%', background:row.ok ? '#4ade80' : '#d1d5db', flexShrink:0 }} />
              </div>
            ))}
          </div>

          {/* Статистика меню */}
          <div style={{ background:'linear-gradient(135deg,#16332b,#1f4438)', borderRadius:24, padding:'22px 24px', color:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:18, opacity:.9 }}>Меню</div>
            {[
              { label:'Утверждено', value:approved, total:items.length, color:'#4ade80' },
              { label:'На проверке', value:items.filter(i=>i.status==='review').length, total:items.length, color:'#fbbf24' },
              { label:'Черновики', value:items.filter(i=>i.status==='draft').length, total:items.length, color:'#94a3b8' },
            ].map(row => (
              <div key={row.label} style={{ marginBottom:14 }}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:6 }}>
                  <span style={{ fontSize:12.5, color:'rgba(255,255,255,.6)', fontWeight:600 }}>{row.label}</span>
                  <span style={{ fontSize:12.5, color:'rgba(255,255,255,.9)', fontWeight:800 }}>{row.value}</span>
                </div>
                <div style={{ height:5, borderRadius:999, background:'rgba(255,255,255,.1)', overflow:'hidden' }}>
                  <div style={{
                    height:'100%', borderRadius:999,
                    background:row.color,
                    width: items.length > 0 ? `${(row.value/items.length)*100}%` : '0%',
                    transition:'width .6s ease',
                  }} />
                </div>
              </div>
            ))}
            <button
              onClick={() => onNavigate('list')}
              style={{ width:'100%', marginTop:8, padding:'10px', borderRadius:12, border:'1px solid rgba(255,255,255,.15)', background:'rgba(255,255,255,.08)', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}
            >Открыть меню →</button>
          </div>
        </div>
      </div>

      {/* ── Trial banner ── */}
      {trial && !trial.expired && trial.plan !== 'pro' && (
        <div style={{
          background: trial.daysLeft <= 2
            ? 'linear-gradient(135deg,#7f1d1d,#991b1b)'
            : 'linear-gradient(135deg,#1a3a5c,#1e4976)',
          borderRadius:20, padding:'18px 24px', color:'#fff',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
        }}>
          <div>
            <div style={{ fontSize:11, fontWeight:700, letterSpacing:'.08em', textTransform:'uppercase', opacity:.6, marginBottom:4 }}>
              Пробный период
            </div>
            <div style={{ fontWeight:800, fontSize:17, letterSpacing:'-.02em' }}>
              {trial.daysLeft === 0 ? 'Истекает сегодня' : `Осталось ${trial.daysLeft} ${trial.daysLeft === 1 ? 'день' : trial.daysLeft < 5 ? 'дня' : 'дней'}`}
            </div>
            <div style={{ fontSize:12.5, opacity:.6, marginTop:3 }}>
              Полный доступ ко всем функциям · Данные сохранятся после окончания
            </div>
          </div>
          <button onClick={() => onNavigate('pricing')} style={{
            padding:'10px 22px', borderRadius:12, border:'none',
            background:'linear-gradient(135deg,#b99150,#d4aa6a)',
            color:'#fff', fontWeight:800, fontSize:13.5, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(185,145,80,.4)', whiteSpace:'nowrap',
          }}>Перейти на Pro →</button>
        </div>
      )}

      {/* ── Trial expired ── */}
      {trial && trial.expired && trial.plan !== 'pro' && (
        <div style={{
          background:'linear-gradient(135deg,#7f1d1d,#991b1b)',
          borderRadius:20, padding:'20px 24px', color:'#fff',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
        }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>Пробный период завершён</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:4 }}>
              Все данные сохранены. Для создания и редактирования активируйте Pro.
            </div>
          </div>
          <button onClick={() => onNavigate('pricing')} style={{
            padding:'10px 22px', borderRadius:12, border:'none',
            background:'linear-gradient(135deg,#b99150,#d4aa6a)',
            color:'#fff', fontWeight:800, fontSize:13.5, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(185,145,80,.4)',
          }}>Активировать Pro</button>
        </div>
      )}

      {/* ── Onboarding — показываем только когда данных нет ── */}
      {items.length === 0 && semifinished.length === 0 && (
        <div style={{ background:'#fff', border:'1px solid #e8e2d8', borderRadius:24, padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontWeight:800, fontSize:17, color:'#1a1a1a', letterSpacing:'-.03em', marginBottom:6 }}>
            Добро пожаловать в ChefCloud
          </div>
          <div style={{ fontSize:13.5, color:'#a39f98', marginBottom:20, lineHeight:1.6 }}>
            Начните работу — создайте базу знаний вашего ресторана за несколько шагов.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { n:1, title:'Создайте первое блюдо', desc:'Название, фото, состав, технология и стандарт подачи', action:'create', btn:'Создать блюдо' },
              { n:2, title:'Добавьте полуфабрикат', desc:'База заготовок для быстрой сборки блюд', action:'semifinished', btn:'Добавить П/Ф' },
              { n:3, title:'Создайте производственный план', desc:'Задания на смену с отметками выполнения', action:'production', btn:'Открыть' },
              { n:4, title:'Распечатайте ТТК', desc:'Карточки А4 для кухни и обучения персонала', action:'print', btn:'Открыть' },
            ].map(step => (
              <div key={step.n} style={{ display:'flex', alignItems:'center', gap:16, padding:'14px 16px', borderRadius:16, background:'#faf8f4', border:'1px solid #f0ebe2' }}>
                <div style={{
                  width:32, height:32, borderRadius:10, flexShrink:0,
                  background:'#16332b', color:'#fff',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  fontWeight:900, fontSize:14,
                }}>{step.n}</div>
                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a' }}>{step.title}</div>
                  <div style={{ fontSize:12.5, color:'#a39f98', marginTop:2 }}>{step.desc}</div>
                </div>
                <button
                  onClick={() => onNavigate(step.action)}
                  style={{ padding:'8px 16px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:12.5, fontWeight:700, color:'#16332b', whiteSpace:'nowrap', flexShrink:0 }}
                >{step.btn}</button>
              </div>
            ))}
          </div>
        </div>
      )}

    </div>
  )
}