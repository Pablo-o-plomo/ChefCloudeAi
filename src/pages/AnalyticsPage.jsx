import { useState } from 'react'

// Premium аналитика с демо-графиками — без реальных данных, только визуал.
// При подключении реальных данных — заменить демо-массивы на props.

const FOOD_COST_DATA = [
  { month:'Янв', value:31 }, { month:'Фев', value:29 }, { month:'Мар', value:27 },
  { month:'Апр', value:28 }, { month:'Май', value:26 }, { month:'Июн', value:24 },
]

const ABC_DATA = [
  { label:'A — Топ блюда', pct:72, count:12, color:'#16332b', bg:'#eef4f1' },
  { label:'B — Средние', pct:20, count:18, color:'#d97706', bg:'#fffbeb' },
  { label:'C — Аутсайдеры', pct:8, count:8, color:'#dc2626', bg:'#fff5f5' },
]

const TOP_DISHES = [
  { name:'Ролл Дракон', sales:124, fc:26, margin:74 },
  { name:'Том Ям', sales:98, fc:31, margin:69 },
  { name:'Тартар лосось', sales:87, fc:28, margin:72 },
  { name:'Поке тунец', sales:76, fc:24, margin:76 },
  { name:'Мисо суп', sales:65, fc:18, margin:82 },
]

function MiniBar({ value, max, color }) {
  return (
    <div style={{ flex:1, height:6, borderRadius:999, background:'#f0ebe2', overflow:'hidden' }}>
      <div style={{ height:'100%', borderRadius:999, background:color, width:`${(value/max)*100}%`, transition:'width .8s ease' }} />
    </div>
  )
}

function KpiCard({ label, value, unit, sub, trend, color = '#16332b', bg = '#eef4f1', icon }) {
  return (
    <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:20, padding:'20px 22px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'flex-start', marginBottom:12 }}>
        <div style={{ width:36, height:36, borderRadius:10, background:bg, display:'flex', alignItems:'center', justifyContent:'center', fontSize:18 }}>{icon}</div>
        {trend && (
          <div style={{ fontSize:11.5, fontWeight:700, color: trend > 0 ? '#16a34a' : '#dc2626', background: trend > 0 ? '#f0fdf4' : '#fff5f5', padding:'3px 8px', borderRadius:999 }}>
            {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
          </div>
        )}
      </div>
      <div style={{ fontSize:28, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', lineHeight:1 }}>
        {value}<span style={{ fontSize:14, fontWeight:600, color:'#a39f98', marginLeft:4 }}>{unit}</span>
      </div>
      <div style={{ fontSize:12.5, fontWeight:700, color:'#6b6560', marginTop:6 }}>{label}</div>
      {sub && <div style={{ fontSize:11.5, color:'#a39f98', marginTop:3 }}>{sub}</div>}
    </div>
  )
}

function LineChart({ data }) {
  const max = Math.max(...data.map(d => d.value)) + 5
  const min = Math.min(...data.map(d => d.value)) - 5
  const w = 480, h = 120, pad = 20
  const pts = data.map((d, i) => ({
    x: pad + (i / (data.length - 1)) * (w - pad * 2),
    y: h - pad - ((d.value - min) / (max - min)) * (h - pad * 2),
  }))
  const path = pts.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ')
  const area = `${path} L ${pts[pts.length-1].x} ${h-pad} L ${pts[0].x} ${h-pad} Z`

  return (
    <svg viewBox={`0 0 ${w} ${h}`} style={{ width:'100%', height:120 }}>
      <defs>
        <linearGradient id="lineGrad" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor="#16332b" stopOpacity=".15" />
          <stop offset="100%" stopColor="#16332b" stopOpacity="0" />
        </linearGradient>
      </defs>
      <path d={area} fill="url(#lineGrad)" />
      <path d={path} fill="none" stroke="#16332b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
      {pts.map((p, i) => (
        <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#16332b" strokeWidth="2.5" />
      ))}
      {data.map((d, i) => (
        <text key={i} x={pts[i].x} y={h-2} textAnchor="middle" fontSize="10" fill="#a39f98">{d.month}</text>
      ))}
    </svg>
  )
}

export default function AnalyticsPage() {
  const [tab, setTab] = useState('overview')
  const TABS = [
    { id:'overview', label:'Обзор' },
    { id:'abc', label:'ABC анализ' },
    { id:'dishes', label:'Топ блюд' },
  ]

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:24 }} className="cc-fade-in">

      {/* Header */}
      <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
        <div>
          <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px' }}>Аналитика</h1>
          <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>Демо-данные · При подключении iiko данные станут реальными</p>
        </div>
        <div style={{ display:'flex', gap:6, background:'#fff', border:'1px solid #ede9e0', borderRadius:14, padding:4, boxShadow:'0 1px 3px rgba(0,0,0,.05)' }}>
          {TABS.map(t => (
            <button key={t.id} onClick={() => setTab(t.id)} style={{
              padding:'7px 16px', borderRadius:10, border:'none', cursor:'pointer', fontSize:13, fontWeight:tab===t.id ? 700 : 500,
              background: tab===t.id ? '#16332b' : 'transparent', color: tab===t.id ? '#fff' : '#6b6560', transition:'all .15s',
            }}>{t.label}</button>
          ))}
        </div>
      </div>

      {tab === 'overview' && (
        <>
          {/* KPI */}
          <div style={{ display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:14 }}>
            <KpiCard icon="💰" label="Средний food cost" value="26" unit="%" trend={-3} sub="Цель: до 28%" color="#16a34a" bg="#f0fdf4" />
            <KpiCard icon="📈" label="Маржинальность" value="74" unit="%" trend={2} sub="По всему меню" color="#7c3aed" bg="#f5f3ff" />
            <KpiCard icon="🍽️" label="Блюд в базе" value="62" unit="шт" sub="38 активных" color="#16332b" bg="#eef4f1" />
            <KpiCard icon="⏱️" label="Среднее время сборки" value="4.2" unit="мин" trend={-8} sub="Оптимизировано" color="#d97706" bg="#fffbeb" />
          </div>

          {/* Графики */}
          <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:16 }}>
            <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:22, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:4 }}>Food Cost по месяцам</div>
              <div style={{ fontSize:12, color:'#a39f98', marginBottom:16 }}>Динамика в %</div>
              <LineChart data={FOOD_COST_DATA} />
              <div style={{ display:'flex', justifyContent:'space-between', marginTop:8 }}>
                <span style={{ fontSize:12, color:'#a39f98' }}>Тренд: снижение</span>
                <span style={{ fontSize:12, fontWeight:700, color:'#16a34a' }}>↓ 7% за полгода</span>
              </div>
            </div>

            <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:22, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:4 }}>ABC Анализ меню</div>
              <div style={{ fontSize:12, color:'#a39f98', marginBottom:20 }}>По выручке и популярности</div>
              {ABC_DATA.map(row => (
                <div key={row.label} style={{ marginBottom:16 }}>
                  <div style={{ display:'flex', justifyContent:'space-between', marginBottom:7 }}>
                    <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                      <div style={{ width:8, height:8, borderRadius:'50%', background:row.color }} />
                      <span style={{ fontSize:13, fontWeight:700, color:'#1a1a1a' }}>{row.label}</span>
                    </div>
                    <span style={{ fontSize:12.5, fontWeight:800, color:row.color }}>{row.count} блюд</span>
                  </div>
                  <div style={{ height:8, borderRadius:999, background:'#f0ebe2', overflow:'hidden' }}>
                    <div style={{ height:'100%', borderRadius:999, background:row.color, width:`${row.pct}%` }} />
                  </div>
                  <div style={{ fontSize:11, color:'#a39f98', marginTop:4 }}>{row.pct}% выручки</div>
                </div>
              ))}
            </div>
          </div>

          {/* Топ блюд превью */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:22, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
            <div style={{ padding:'20px 24px 12px', display:'flex', justifyContent:'space-between' }}>
              <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a' }}>Топ блюд</div>
              <button onClick={() => setTab('dishes')} style={{ fontSize:12.5, fontWeight:700, color:'#16332b', background:'#eef4f1', border:'none', borderRadius:10, padding:'6px 12px', cursor:'pointer' }}>Все →</button>
            </div>
            <table style={{ width:'100%', borderCollapse:'collapse', fontSize:13 }}>
              <thead>
                <tr style={{ background:'#faf8f4' }}>
                  {['Блюдо','Продажи','Food cost','Маржа'].map(h => (
                    <th key={h} style={{ padding:'10px 16px', textAlign:'left', fontSize:11, fontWeight:700, color:'#a39f98', textTransform:'uppercase', letterSpacing:'.06em', borderBottom:'1px solid #ede9e0' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {TOP_DISHES.map((d, i) => (
                  <tr key={d.name} style={{ borderBottom:'1px solid #f5f2ed' }}>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:10 }}>
                        <div style={{ width:28, height:28, borderRadius:8, background:`hsl(${i*40+120},30%,92%)`, display:'flex', alignItems:'center', justifyContent:'center', fontSize:14 }}>🍽️</div>
                        <span style={{ fontWeight:700, color:'#1a1a1a' }}>{d.name}</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px', fontWeight:700, color:'#1a1a1a' }}>{d.sales}</td>
                    <td style={{ padding:'12px 16px' }}>
                      <div style={{ display:'flex', alignItems:'center', gap:8 }}>
                        <MiniBar value={d.fc} max={40} color={d.fc < 28 ? '#4ade80' : '#fbbf24'} />
                        <span style={{ fontSize:12, fontWeight:700, color: d.fc < 28 ? '#16a34a' : '#d97706', minWidth:32 }}>{d.fc}%</span>
                      </div>
                    </td>
                    <td style={{ padding:'12px 16px' }}>
                      <span style={{ fontSize:12, fontWeight:700, color:'#16a34a', background:'#f0fdf4', padding:'3px 8px', borderRadius:999 }}>{d.margin}%</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab !== 'overview' && (
        <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, padding:'40px', textAlign:'center', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
          <div style={{ fontSize:48, marginBottom:16 }}>{tab === 'abc' ? '📊' : '🍽️'}</div>
          <div style={{ fontSize:20, fontWeight:800, color:'#1a1a1a', marginBottom:8 }}>
            {tab === 'abc' ? 'Детальный ABC анализ' : 'Рейтинг блюд'}
          </div>
          <div style={{ fontSize:13.5, color:'#a39f98', maxWidth:400, margin:'0 auto' }}>
            Подключите интеграцию с iiko или WebOffice для получения реальных данных о продажах
          </div>
        </div>
      )}
    </div>
  )
}
