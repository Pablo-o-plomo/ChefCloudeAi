import { useState } from 'react'

const DEMO_CHECKS = [
  { id:1, dish:'Ролл Дракон', date:'Сегодня 14:32', score:94, status:'pass', issues:[], img:'🍣' },
  { id:2, dish:'Том Ям', date:'Сегодня 13:15', score:78, status:'warn', issues:['Порция меньше нормы (-20г)','Зелень завяла'], img:'🍲' },
  { id:3, dish:'Тартар лосося', date:'Вчера 19:44', score:97, status:'pass', issues:[], img:'🐟' },
  { id:4, dish:'Поке тунец', date:'Вчера 18:20', score:62, status:'fail', issues:['Неправильная подача','Отсутствует декор','Разные куски'], img:'🍱' },
  { id:5, dish:'Мисо суп', date:'Вчера 17:05', score:89, status:'pass', issues:['Температура на нижней границе'], img:'🥣' },
]

const STATUS_CONFIG = {
  pass: { label:'Соответствует', color:'#16a34a', bg:'#f0fdf4', icon:'✓' },
  warn: { label:'Замечания', color:'#d97706', bg:'#fffbeb', icon:'⚠' },
  fail: { label:'Не соответствует', color:'#dc2626', bg:'#fff5f5', icon:'✕' },
}

function ScoreRing({ score }) {
  const r = 28
  const circ = 2 * Math.PI * r
  const offset = circ - (score / 100) * circ
  const color = score >= 90 ? '#16a34a' : score >= 75 ? '#d97706' : '#dc2626'
  return (
    <svg width="72" height="72" viewBox="0 0 72 72">
      <circle cx="36" cy="36" r={r} fill="none" stroke="#f0ebe2" strokeWidth="6" />
      <circle cx="36" cy="36" r={r} fill="none" stroke={color} strokeWidth="6"
        strokeDasharray={circ} strokeDashoffset={offset}
        strokeLinecap="round" transform="rotate(-90 36 36)"
        style={{ transition:'stroke-dashoffset .8s ease' }} />
      <text x="36" y="36" textAnchor="middle" dominantBaseline="middle" fontSize="14" fontWeight="900" fill={color}>{score}%</text>
    </svg>
  )
}

function CheckCard({ check }) {
  const [expanded, setExpanded] = useState(false)
  const cfg = STATUS_CONFIG[check.status]
  return (
    <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:18, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)', transition:'all .18s' }}>
      <div
        style={{ display:'flex', alignItems:'center', gap:14, padding:'16px 18px', cursor:'pointer' }}
        onClick={() => setExpanded(!expanded)}
      >
        <div style={{ width:44, height:44, borderRadius:12, background:'#f0ebe2', display:'flex', alignItems:'center', justifyContent:'center', fontSize:22, flexShrink:0 }}>{check.img}</div>
        <div style={{ flex:1, minWidth:0 }}>
          <div style={{ fontWeight:700, fontSize:14, color:'#1a1a1a', marginBottom:3 }}>{check.dish}</div>
          <div style={{ fontSize:12, color:'#a39f98' }}>{check.date}</div>
        </div>
        <ScoreRing score={check.score} />
        <div style={{ fontSize:12, fontWeight:700, color:cfg.color, background:cfg.bg, padding:'4px 10px', borderRadius:999, flexShrink:0 }}>
          {cfg.icon} {cfg.label}
        </div>
        <div style={{ color:'#a39f98', fontSize:16, transition:'transform .2s', transform: expanded ? 'rotate(180deg)' : 'none' }}>▾</div>
      </div>
      {expanded && check.issues.length > 0 && (
        <div style={{ padding:'0 18px 16px 18px', borderTop:'1px solid #f5f2ed' }}>
          <div style={{ fontSize:12, fontWeight:700, color:'#a39f98', marginBottom:8, marginTop:12, textTransform:'uppercase', letterSpacing:'.06em' }}>Замечания</div>
          {check.issues.map(issue => (
            <div key={issue} style={{ display:'flex', alignItems:'center', gap:8, marginBottom:6, fontSize:13, color:'#374151' }}>
              <div style={{ width:6, height:6, borderRadius:'50%', background:'#d97706', flexShrink:0 }} /> {issue}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function QualityPage() {
  const avg = Math.round(DEMO_CHECKS.reduce((s,c) => s+c.score, 0) / DEMO_CHECKS.length)
  const passed = DEMO_CHECKS.filter(c => c.status==='pass').length

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="cc-fade-in">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', flexWrap:'wrap', gap:16 }}>
        <div>
          <div style={{ fontSize:12, fontWeight:700, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:6 }}>Контроль качества</div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px' }}>Фотолента проверок</h1>
          <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>Демо-режим · AI-анализ будет подключён на следующем этапе</p>
        </div>
        <div style={{ display:'flex', gap:10 }}>
          <div style={{ padding:'9px 18px', borderRadius:14, border:'1px solid #ede9e0', background:'#fff', fontSize:13, fontWeight:600, color:'#a39f98' }}>
            🤖 AI-анализ: не подключён
          </div>
          <button
            onClick={() => document.getElementById('qc-upload-trigger')?.click()}
            style={{ display:'flex', alignItems:'center', gap:7, padding:'9px 18px', borderRadius:14, border:'none', background:'#16332b', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M23 19a2 2 0 01-2 2H3a2 2 0 01-2-2V8a2 2 0 012-2h4l2-3h6l2 3h4a2 2 0 012 2z"/><circle cx="12" cy="13" r="4"/></svg>
            Новая проверка
          </button>
        </div>
      </div>

      {/* Статистика */}
      <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
        {[
          { icon:'📊', label:'Средний балл', value:`${avg}%`, color:'#16332b', bg:'#eef4f1' },
          { icon:'✅', label:'Прошли проверку', value:passed, color:'#16a34a', bg:'#f0fdf4' },
          { icon:'⚠️', label:'С замечаниями', value:DEMO_CHECKS.filter(c=>c.status==='warn').length, color:'#d97706', bg:'#fffbeb' },
          { icon:'❌', label:'Не соответствует', value:DEMO_CHECKS.filter(c=>c.status==='fail').length, color:'#dc2626', bg:'#fff5f5' },
        ].map(s => (
          <div key={s.label} style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:18, padding:'18px 20px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ width:34, height:34, borderRadius:10, background:s.bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:16, marginBottom:12 }}>{s.icon}</div>
            <div style={{ fontSize:24, fontWeight:900, color:s.color, letterSpacing:'-.04em', lineHeight:1 }}>{s.value}</div>
            <div style={{ fontSize:12, fontWeight:700, color:'#6b6560', marginTop:6 }}>{s.label}</div>
          </div>
        ))}
      </div>

      {/* Загрузка фото */}
      <div style={{ background:'#fff', border:'2px dashed #d0c9be', borderRadius:22, padding:'36px', textAlign:'center', cursor:'pointer', transition:'all .18s' }}
        onMouseEnter={e => { e.currentTarget.style.borderColor='#16332b'; e.currentTarget.style.background='#faf8f4' }}
        onMouseLeave={e => { e.currentTarget.style.borderColor='#d0c9be'; e.currentTarget.style.background='#fff' }}
      >
        <div style={{ fontSize:40, marginBottom:12 }}>📸</div>
        <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', marginBottom:6 }}>Сфотографировать блюдо</div>
        <div style={{ fontSize:13.5, color:'#a39f98', lineHeight:1.6, maxWidth:340, margin:'0 auto 16px' }}>
          Загрузите фото готового блюда — AI сравнит его с эталоном и покажет отклонения
        </div>
        <label id="qc-upload-trigger" style={{ display:'inline-flex', alignItems:'center', gap:8, padding:'10px 20px', borderRadius:14, border:'none', background:'#16332b', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer' }}>
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round"><path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" y1="3" x2="12" y2="15"/></svg>
          Выбрать файл
          <input type="file" accept="image/*" style={{ display:'none' }} onChange={e => {
            const file = e.target.files?.[0]
            if (file) alert('Файл выбран: ' + file.name + '\n\nAI-анализ будет доступен после подключения нейросети.')
            e.target.value = ''
          }} />
        </label>
      </div>

      {/* История */}
      <div>
        <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', marginBottom:14 }}>История проверок</div>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {DEMO_CHECKS.map(check => <CheckCard key={check.id} check={check} />)}
        </div>
      </div>
    </div>
  )
}
