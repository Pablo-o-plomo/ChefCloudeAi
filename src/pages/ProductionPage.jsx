import { useState, useEffect, useRef } from 'react'

// ─── localStorage ────────────────────────────────────────────────────────────
const STORAGE_KEY = 'chefcloud_production_tasks'

function readTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}
function writeTasks(tasks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch {}
}

const SEED_TASKS = [
  { id:'t1', name:'Соус Том Ям',       qty:'5 кг',  station:'Горячий цех',   time:'09:00', done:false, priority:'high' },
  { id:'t2', name:'Рис для суши',       qty:'8 кг',  station:'Суши-бар',      time:'09:30', done:false, priority:'high' },
  { id:'t3', name:'Нарезка лосося',     qty:'4 кг',  station:'Холодный цех',  time:'10:00', done:false, priority:'high' },
  { id:'t4', name:'Авокадо (нарезка)', qty:'3 кг',  station:'Заготовочный',  time:'10:30', done:false, priority:'medium' },
]

const PRIORITY_COLOR = { high:'#dc2626', medium:'#d97706', low:'#16a34a' }
const PRIORITY_LABEL = { high:'Срочно',  medium:'Обычный',  low:'Низкий' }
const STATIONS = ['Горячий цех','Холодный цех','Суши-бар','Заготовочный','Кондитерский','Бар']

function makeId() { return 't_' + Date.now() + '_' + Math.random().toString(36).slice(2,6) }

// ─── Форма добавления задачи ─────────────────────────────────────────────────
function AddTaskModal({ onSave, onClose }) {
  const [form, setForm] = useState({ name:'', qty:'', station:STATIONS[0], time:'', priority:'medium' })
  const nameRef = useRef(null)

  useEffect(() => { nameRef.current?.focus() }, [])

  const set = (k, v) => setForm(f => ({ ...f, [k]: v }))
  const valid = form.name.trim().length > 0

  function handleSave() {
    if (!valid) return
    onSave({ ...form, id: makeId(), done: false, name: form.name.trim() })
  }

  const inputSt = {
    width:'100%', boxSizing:'border-box', padding:'9px 13px',
    border:'1.5px solid #e8e2d8', borderRadius:12, fontSize:13.5,
    outline:'none', background:'#faf8f4', color:'#1a1a1a', fontFamily:'inherit',
  }
  const labelSt = { fontSize:11.5, fontWeight:700, color:'#6b6560', marginBottom:5, display:'block' }

  return (
    <div style={{
      position:'fixed', inset:0, zIndex:2000,
      background:'rgba(0,0,0,.35)', backdropFilter:'blur(4px)',
      display:'flex', alignItems:'center', justifyContent:'center', padding:20,
    }} onClick={e => e.target === e.currentTarget && onClose()}>
      <div style={{ background:'#fff', borderRadius:24, padding:'28px 32px', width:'100%', maxWidth:420, boxShadow:'0 24px 60px rgba(0,0,0,.18)' }}>
        <div style={{ fontSize:17, fontWeight:800, color:'#1a1a1a', marginBottom:20 }}>Новая задача</div>

        <div style={{ display:'flex', flexDirection:'column', gap:14 }}>
          <div>
            <span style={labelSt}>Название *</span>
            <input ref={nameRef} value={form.name} onChange={e=>set('name',e.target.value)}
              onKeyDown={e=>e.key==='Enter'&&handleSave()}
              placeholder="Нарезка лосося" style={inputSt} />
          </div>
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
            <div>
              <span style={labelSt}>Количество</span>
              <input value={form.qty} onChange={e=>set('qty',e.target.value)} placeholder="4 кг" style={inputSt} />
            </div>
            <div>
              <span style={labelSt}>Время начала</span>
              <input type="time" value={form.time} onChange={e=>set('time',e.target.value)} style={inputSt} />
            </div>
          </div>
          <div>
            <span style={labelSt}>Станция</span>
            <select value={form.station} onChange={e=>set('station',e.target.value)} style={{ ...inputSt, cursor:'pointer' }}>
              {STATIONS.map(s => <option key={s}>{s}</option>)}
            </select>
          </div>
          <div>
            <span style={labelSt}>Приоритет</span>
            <div style={{ display:'flex', gap:8 }}>
              {Object.entries(PRIORITY_LABEL).map(([v,l]) => (
                <button key={v} onClick={()=>set('priority',v)} type="button" style={{
                  flex:1, padding:'8px', borderRadius:10, border:`1.5px solid ${form.priority===v ? PRIORITY_COLOR[v] : '#e8e2d8'}`,
                  background: form.priority===v ? PRIORITY_COLOR[v]+'18' : '#fff',
                  color: form.priority===v ? PRIORITY_COLOR[v] : '#6b6560',
                  fontSize:12.5, fontWeight:700, cursor:'pointer', transition:'all .15s',
                }}>{l}</button>
              ))}
            </div>
          </div>
        </div>

        <div style={{ display:'flex', gap:10, marginTop:22, justifyContent:'flex-end' }}>
          <button onClick={onClose} style={{ padding:'10px 18px', borderRadius:12, border:'1.5px solid #e8e2d8', background:'#fff', cursor:'pointer', fontSize:13.5, fontWeight:600, color:'#1a1a1a' }}>Отмена</button>
          <button onClick={handleSave} disabled={!valid} style={{
            padding:'10px 20px', borderRadius:12, border:'none',
            background: valid ? '#16332b' : '#d4cfc8', color:'#fff',
            cursor: valid ? 'pointer' : 'not-allowed', fontSize:13.5, fontWeight:700, transition:'all .15s',
          }}>Добавить</button>
        </div>
      </div>
    </div>
  )
}

// ─── Главная страница ─────────────────────────────────────────────────────────
const today = new Date().toLocaleDateString('ru-RU', { weekday:'long', day:'numeric', month:'long' })

export default function ProductionPage() {
  const [tasks, setTasks] = useState(() => readTasks() ?? SEED_TASKS)
  const [filter, setFilter]   = useState('all')
  const [showForm, setShowForm] = useState(false)

  // Сохраняем при каждом изменении
  useEffect(() => { writeTasks(tasks) }, [tasks])

  const done  = tasks.filter(t => t.done).length
  const total = tasks.length
  const pct   = total > 0 ? Math.round((done / total) * 100) : 0

  const filtered = filter === 'all'     ? tasks
    : filter === 'done'    ? tasks.filter(t =>  t.done)
    : tasks.filter(t => !t.done)

  function toggle(id) {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, done: !t.done } : t))
  }

  function addTask(task) {
    setTasks(prev => [...prev, task])
    setShowForm(false)
  }

  function deleteTask(id) {
    setTasks(prev => prev.filter(t => t.id !== id))
  }

  function printPlan() { window.print() }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="cc-fade-in">
      {showForm && <AddTaskModal onSave={addTask} onClose={()=>setShowForm(false)} />}

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Производство</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px', textTransform:'capitalize' }}>{today}</h1>
          <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>{total} задач · {done} выполнено</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <button
            onClick={printPlan}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:14, border:'1px solid #ede9e0', background:'#fff', color:'#1a1a1a', fontWeight:700, fontSize:13, cursor:'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 6 2 18 2 18 9"/><path d="M6 18H4a2 2 0 01-2-2v-5a2 2 0 012-2h16a2 2 0 012 2v5a2 2 0 01-2 2h-2"/><rect x="6" y="14" width="12" height="8"/></svg>
            Распечатать план
          </button>
          <button
            onClick={() => setShowForm(true)}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:14, border:'none', background:'#16332b', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}
          >
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
            Добавить задачу
          </button>
        </div>
      </div>

      {/* Прогресс */}
      <div style={{ background:'linear-gradient(135deg,#16332b,#1a4234)', borderRadius:24, padding:'24px 28px', color:'#fff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', marginBottom:16, flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.5)', fontWeight:600, marginBottom:4 }}>Готовность смены</div>
            <div style={{ fontSize:34, fontWeight:900, letterSpacing:'-.04em' }}>{pct}%</div>
          </div>
          <div style={{ display:'flex', gap:20 }}>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900 }}>{done}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)' }}>Готово</div>
            </div>
            <div style={{ textAlign:'center' }}>
              <div style={{ fontSize:24, fontWeight:900 }}>{total - done}</div>
              <div style={{ fontSize:11, color:'rgba(255,255,255,.45)' }}>Осталось</div>
            </div>
          </div>
        </div>
        <div style={{ height:8, borderRadius:999, background:'rgba(255,255,255,.12)', overflow:'hidden' }}>
          <div style={{ height:'100%', borderRadius:999, background:'linear-gradient(90deg,#4ade80,#22c55e)', width:`${pct}%`, transition:'width .8s ease' }} />
        </div>
      </div>

      {/* Фильтры + список */}
      <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ padding:'16px 20px', borderBottom:'1px solid #f0ebe2', display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:10 }}>
          <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a' }}>Задания на смену</div>
          <div style={{ display:'flex', gap:4, background:'#faf8f4', borderRadius:12, padding:4 }}>
            {[['all','Все'],['pending','Не выполнено'],['done','Выполнено']].map(([v,l]) => (
              <button key={v} onClick={() => setFilter(v)} style={{
                padding:'6px 14px', borderRadius:9, border:'none', cursor:'pointer',
                fontSize:12.5, fontWeight: filter===v ? 700 : 500,
                background: filter===v ? '#16332b' : 'transparent',
                color: filter===v ? '#fff' : '#6b6560', transition:'all .15s',
              }}>{l}</button>
            ))}
          </div>
        </div>

        {total === 0 ? (
          <div style={{ padding:'48px', textAlign:'center', color:'#a39f98' }}>
            <div style={{ fontSize:32, marginBottom:12, opacity:.4 }}>
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M9 11l3 3L22 4"/><path d="M21 12v7a2 2 0 01-2 2H5a2 2 0 01-2-2V5a2 2 0 012-2h11"/></svg>
            </div>
            <div style={{ fontSize:15, fontWeight:700, marginBottom:6 }}>Задач пока нет</div>
            <div style={{ fontSize:13 }}>Нажмите «Добавить задачу» чтобы начать планирование смены</div>
          </div>
        ) : (
          <div style={{ padding:'8px 0' }}>
            {filtered.map(task => (
              <div key={task.id}
                style={{ display:'flex', alignItems:'center', gap:14, padding:'14px 20px', borderBottom:'1px solid #faf8f4', transition:'background .12s' }}
                onMouseEnter={e => e.currentTarget.style.background='#faf8f4'}
                onMouseLeave={e => e.currentTarget.style.background='transparent'}
              >
                <button onClick={() => toggle(task.id)} style={{
                  width:24, height:24, borderRadius:8, border:`2px solid ${task.done ? '#16a34a' : '#d0c9be'}`,
                  background: task.done ? '#16a34a' : 'transparent',
                  display:'flex', alignItems:'center', justifyContent:'center',
                  cursor:'pointer', flexShrink:0, transition:'all .15s', color:'#fff', fontSize:13, fontWeight:900,
                }}>{task.done ? '✓' : ''}</button>

                <div style={{ flex:1, minWidth:0 }}>
                  <div style={{ fontWeight:700, fontSize:14, color: task.done ? '#a39f98' : '#1a1a1a', textDecoration: task.done ? 'line-through' : 'none' }}>{task.name}</div>
                  <div style={{ fontSize:12, color:'#a39f98', marginTop:3 }}>
                    {[task.station, task.qty, task.time].filter(Boolean).join(' · ')}
                  </div>
                </div>

                <div style={{ fontSize:11, fontWeight:700, color:PRIORITY_COLOR[task.priority], background:PRIORITY_COLOR[task.priority]+'15', padding:'3px 9px', borderRadius:999, flexShrink:0 }}>
                  {PRIORITY_LABEL[task.priority]}
                </div>

                <button onClick={() => deleteTask(task.id)} style={{ background:'none', border:'none', cursor:'pointer', color:'#d0c9be', padding:4, borderRadius:6, flexShrink:0 }}
                  title="Удалить задачу"
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
