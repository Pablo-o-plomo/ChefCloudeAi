import { useState } from 'react'

// Р”РµРјРѕ-РґР°РЅРЅС‹Рµ РґР»СЏ РґР°С€Р±РѕСЂРґР° вЂ” С‚РѕР»СЊРєРѕ РґР»СЏ РѕС‚РѕР±СЂР°Р¶РµРЅРёСЏ, РЅРµ РІР»РёСЏСЋС‚ РЅР° СЂРµР°Р»СЊРЅС‹Рµ РґР°РЅРЅС‹Рµ
const RECENT_DEMO = [
  { title: 'Р РѕР»Р» Р”СЂР°РєРѕРЅ', category: 'Р РѕР»Р»С‹', status: 'approved', output: '280 Рі', time: '3 РјРёРЅ', color: '#0f4c35' },
  { title: 'РўРѕРј РЇРј СЃ РєСЂРµРІРµС‚РєРѕР№', category: 'РЎСѓРїС‹', status: 'approved', output: '350 РјР»', time: '5 РјРёРЅ', color: '#1a3a5c' },
  { title: 'РўР°СЂС‚Р°СЂ РёР· Р»РѕСЃРѕСЃСЏ', category: 'РҐРѕР»РѕРґРЅС‹Рµ', status: 'review', output: '180 Рі', time: '4 РјРёРЅ', color: '#3d1a5c' },
  { title: 'РџРѕРєРµ СЃ С‚СѓРЅС†РѕРј', category: 'Р“РѕСЂСЏС‡РµРµ', status: 'approved', output: '320 Рі', time: '6 РјРёРЅ', color: '#4c2a0f' },
]

const STATUS_LABEL = { approved: 'РЈС‚РІРµСЂР¶РґРµРЅРѕ', review: 'РќР° РїСЂРѕРІРµСЂРєРµ', draft: 'Р§РµСЂРЅРѕРІРёРє' }
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
      }}>рџЌЅпёЏ</div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontWeight: 700, fontSize: 13.5, color: '#1a1a1a', letterSpacing: '-.01em', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{item.title}</div>
        <div style={{ fontSize: 12, color: '#a39f98', marginTop: 2 }}>{item.category} В· {item.output} В· {item.time}</div>
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

export default function PremiumDashboard({ items, isRemote, semifinished, products, categories, trial, onNavigate }) {
  const today = new Date().toLocaleDateString('ru-RU', { day: 'numeric', month: 'long', year: 'numeric' })
  const lastUpdated = items.length > 0
    ? (() => {
        const sorted = [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt))
        return sorted[0]?.updatedAt ? new Date(sorted[0].updatedAt).toLocaleDateString('ru-RU') : 'вЂ”'
      })()
    : 'вЂ”'

  const approved = items.filter(i => i.status === 'approved').length
  const recentItems = items.length > 0
    ? [...items].sort((a, b) => new Date(b.updatedAt) - new Date(a.updatedAt)).slice(0, 5)
    : RECENT_DEMO

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 28 }} className="cc-fade-in">

      {/* в”Ђв”Ђ Hero в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
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
                РЎРёСЃС‚РµРјР° Р°РєС‚РёРІРЅР°
              </span>
            </div>
            <h1 style={{ margin:'0 0 10px', fontSize:34, fontWeight:900, letterSpacing:'-.05em', lineHeight:1.05 }}>
              Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ<br />
              <span style={{ color:'#b99150' }}>РІ ChefCloud</span>
            </h1>
            <p style={{ margin:0, color:'rgba(255,255,255,.5)', fontSize:13.5, lineHeight:1.7, maxWidth:420 }}>
              {today} В· {items.length > 0 ? `${items.length} Р±Р»СЋРґ РІ Р±Р°Р·Рµ` : 'РќР°С‡РЅРёС‚Рµ СЃ СЃРѕР·РґР°РЅРёСЏ РїРµСЂРІРѕРіРѕ Р±Р»СЋРґР°'}
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
            >рџЌЅпёЏ РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ</button>
            <button
              onClick={() => onNavigate('ai')}
              style={{
                padding:'10px 20px', borderRadius:14,
                background:'linear-gradient(135deg, #b99150, #d4aa6a)',
                border:'none', color:'#fff', fontWeight:700, fontSize:13, cursor:'pointer',
                boxShadow:'0 4px 16px rgba(185,145,80,.4)', transition:'all .18s',
              }}
            >рџ¤– AI РђСЃСЃРёСЃС‚РµРЅС‚</button>
          </div>
        </div>

        {/* KPI СЃС‚РµРєР»Рѕ */}
        <div style={{
          position:'relative', zIndex:1,
          display:'grid', gridTemplateColumns:'repeat(4,1fr)', gap:12, marginTop:32,
        }}>
          {[
            { label:'Р‘Р»СЋРґ РІ РјРµРЅСЋ',      value:items.length,       icon:'в†—', sub:'РєР°СЂС‚РѕС‡РµРє' },
            { label:'РЈС‚РІРµСЂР¶РґРµРЅРѕ',        value:approved,           icon:'', sub:'С„РёРЅР°Р»СЊРЅС‹С…' },
            { label:'РџРѕР»СѓС„Р°Р±СЂРёРєР°С‚РѕРІ',   value:semifinished.length, icon:'в‰Ў', sub:'РїРѕР·РёС†РёР№' },
            { label:'РќР° СЃРєР»Р°РґРµ',        value:products.length,    icon:'', sub:'С‚РѕРІР°СЂРѕРІ' },
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

      {/* в”Ђв”Ђ РћСЃРЅРѕРІРЅР°СЏ СЃРµС‚РєР° в”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђв”Ђ */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 360px', gap:20, alignItems:'start' }}>

        {/* Р›РµРІР°СЏ РєРѕР»РѕРЅРєР° */}
        <div style={{ display:'flex', flexDirection:'column', gap:20 }}>

          {/* РџРѕСЃР»РµРґРЅРёРµ Р±Р»СЋРґР° */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, overflow:'hidden', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ padding:'20px 24px 8px', display:'flex', justifyContent:'space-between', alignItems:'center' }}>
              <div>
                <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', letterSpacing:'-.02em' }}>
                  {items.length > 0 ? 'РџРѕСЃР»РµРґРЅРёРµ Р±Р»СЋРґР°' : 'Р”РµРјРѕ-Р±Р»СЋРґР°'}
                </div>
                <div style={{ fontSize:12, color:'#a39f98', marginTop:2 }}>
                  {items.length > 0 ? `РћР±РЅРѕРІР»РµРЅРѕ ${lastUpdated}` : 'Р”РѕР±Р°РІСЊС‚Рµ РїРµСЂРІС‹Рµ Р±Р»СЋРґР° С‡РµСЂРµР· СЂР°Р·РґРµР» РњРµРЅСЋ'}
                </div>
              </div>
              <button
                onClick={() => onNavigate('list')}
                style={{ fontSize:12.5, fontWeight:700, color:'#16332b', background:'#eef4f1', border:'none', borderRadius:10, padding:'7px 14px', cursor:'pointer' }}
              >Р’СЃРµ Р±Р»СЋРґР° в†’</button>
            </div>
            <div style={{ padding:'8px 8px 12px' }}>
              {recentItems.map((item, i) => <ActivityRow key={item.id || i} item={item} i={i} />)}
            </div>
          </div>

          {/* Р‘С‹СЃС‚СЂС‹Рµ РґРµР№СЃС‚РІРёСЏ */}
          <div>
            <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', letterSpacing:'-.02em', marginBottom:14 }}>Р‘С‹СЃС‚СЂС‹Рµ РґРµР№СЃС‚РІРёСЏ</div>
            <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:12 }}>
              <QuickAction icon="рџЌЅпёЏ" label="РќРѕРІРѕРµ Р±Р»СЋРґРѕ" desc="РЎРѕР·РґР°С‚СЊ РєР°СЂС‚РѕС‡РєСѓ Р±Р»СЋРґР° СЃ С„РѕС‚Рѕ Рё СЃРѕСЃС‚Р°РІРѕРј" onClick={() => onNavigate('create')} accent="#16332b" />
              <QuickAction icon="рџ¤–" label="AI РђСЃСЃРёСЃС‚РµРЅС‚" desc="РЎРіРµРЅРµСЂРёСЂРѕРІР°С‚СЊ РѕРїРёСЃР°РЅРёРµ РёР»Рё С‚РµС…РЅРѕР»РѕРіРёСЋ" onClick={() => onNavigate('ai')} accent="#7c3aed" />
              <QuickAction icon="рџҐЈ" label="Р”РѕР±Р°РІРёС‚СЊ Рџ/Р¤" desc="РќРѕРІС‹Р№ РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚ РІ Р±Р°Р·Сѓ" onClick={() => onNavigate('semifinished')} accent="#0f4c35" />
              <QuickAction icon="рџ’ѕ" label="Р РµР·РµСЂРІРЅР°СЏ РєРѕРїРёСЏ" desc="Р­РєСЃРїРѕСЂС‚РёСЂРѕРІР°С‚СЊ РІСЃРµ РґР°РЅРЅС‹Рµ" onClick={() => onNavigate('settings')} accent="#b99150" />
            </div>
          </div>
        </div>

        {/* РџСЂР°РІР°СЏ РєРѕР»РѕРЅРєР° */}
        <div style={{ display:'flex', flexDirection:'column', gap:16 }}>

          {/* РЎС‚Р°С‚СѓСЃ СЃРёСЃС‚РµРјС‹ */}
          <div style={{ background:'#fff', border:'1px solid #ede9e0', borderRadius:24, padding:'22px 24px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
            <div style={{ fontWeight:800, fontSize:15, color:'#1a1a1a', marginBottom:18, letterSpacing:'-.02em' }}>РЎС‚Р°С‚СѓСЃ СЃРёСЃС‚РµРјС‹</div>
            {[
              { label:'Хранилище данных', status: isRemote ? 'Supabase (облако)' : 'окально (офлайн)', ok: isRemote, icon:'⊙' },
              { label:'Р”Р°РЅРЅС‹Рµ Р±Р»СЋРґ', status:items.length > 0 ? `${items.length} Р·Р°РїРёСЃРµР№` : 'РџСѓСЃС‚Рѕ', ok:items.length > 0, icon:'рџ—‚пёЏ' },
              { label:'Р РµР·РµСЂРІРЅР°СЏ РєРѕРїРёСЏ', status:'РќР°СЃС‚СЂРѕР№С‚Рµ', ok:false, icon:'рџ”’' },
              { label:'AI РђСЃСЃРёСЃС‚РµРЅС‚', status:'РћР¶РёРґР°РµС‚ API', ok:false, icon:'вњ¦' },
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

          {/* РЎС‚Р°С‚РёСЃС‚РёРєР° РјРµРЅСЋ */}
          <div style={{ background:'linear-gradient(135deg,#16332b,#1f4438)', borderRadius:24, padding:'22px 24px', color:'#fff' }}>
            <div style={{ fontWeight:800, fontSize:15, marginBottom:18, opacity:.9 }}>РњРµРЅСЋ</div>
            {[
              { label:'РЈС‚РІРµСЂР¶РґРµРЅРѕ', value:approved, total:items.length, color:'#4ade80' },
              { label:'РќР° РїСЂРѕРІРµСЂРєРµ', value:items.filter(i=>i.status==='review').length, total:items.length, color:'#fbbf24' },
              { label:'Р§РµСЂРЅРѕРІРёРєРё', value:items.filter(i=>i.status==='draft').length, total:items.length, color:'#94a3b8' },
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
            >РћС‚РєСЂС‹С‚СЊ РјРµРЅСЋ в†’</button>
          </div>
        </div>
      </div>

      {/* в”Ђв”Ђ Trial banner в”Ђв”Ђ */}
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
              РџСЂРѕР±РЅС‹Р№ РїРµСЂРёРѕРґ
            </div>
            <div style={{ fontWeight:800, fontSize:17, letterSpacing:'-.02em' }}>
              {trial.daysLeft === 0 ? 'РСЃС‚РµРєР°РµС‚ СЃРµРіРѕРґРЅСЏ' : `РћСЃС‚Р°Р»РѕСЃСЊ ${trial.daysLeft} ${trial.daysLeft === 1 ? 'РґРµРЅСЊ' : trial.daysLeft < 5 ? 'РґРЅСЏ' : 'РґРЅРµР№'}`}
            </div>
            <div style={{ fontSize:12.5, opacity:.6, marginTop:3 }}>
              РџРѕР»РЅС‹Р№ РґРѕСЃС‚СѓРї РєРѕ РІСЃРµРј С„СѓРЅРєС†РёСЏРј В· Р”Р°РЅРЅС‹Рµ СЃРѕС…СЂР°РЅСЏС‚СЃСЏ РїРѕСЃР»Рµ РѕРєРѕРЅС‡Р°РЅРёСЏ
            </div>
          </div>
          <button onClick={() => onNavigate('pricing')} style={{
            padding:'10px 22px', borderRadius:12, border:'none',
            background:'linear-gradient(135deg,#b99150,#d4aa6a)',
            color:'#fff', fontWeight:800, fontSize:13.5, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(185,145,80,.4)', whiteSpace:'nowrap',
          }}>РџРµСЂРµР№С‚Рё РЅР° Pro в†’</button>
        </div>
      )}

      {/* в”Ђв”Ђ Trial expired в”Ђв”Ђ */}
      {trial && trial.expired && trial.plan !== 'pro' && (
        <div style={{
          background:'linear-gradient(135deg,#7f1d1d,#991b1b)',
          borderRadius:20, padding:'20px 24px', color:'#fff',
          display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12,
        }}>
          <div>
            <div style={{ fontWeight:800, fontSize:17 }}>РџСЂРѕР±РЅС‹Р№ РїРµСЂРёРѕРґ Р·Р°РІРµСЂС€С‘РЅ</div>
            <div style={{ fontSize:13, opacity:.7, marginTop:4 }}>
              Р’СЃРµ РґР°РЅРЅС‹Рµ СЃРѕС…СЂР°РЅРµРЅС‹. Р”Р»СЏ СЃРѕР·РґР°РЅРёСЏ Рё СЂРµРґР°РєС‚РёСЂРѕРІР°РЅРёСЏ Р°РєС‚РёРІРёСЂСѓР№С‚Рµ Pro.
            </div>
          </div>
          <button onClick={() => onNavigate('pricing')} style={{
            padding:'10px 22px', borderRadius:12, border:'none',
            background:'linear-gradient(135deg,#b99150,#d4aa6a)',
            color:'#fff', fontWeight:800, fontSize:13.5, cursor:'pointer',
            boxShadow:'0 4px 14px rgba(185,145,80,.4)',
          }}>РђРєС‚РёРІРёСЂРѕРІР°С‚СЊ Pro</button>
        </div>
      )}

      {/* в”Ђв”Ђ Onboarding вЂ” РїРѕРєР°Р·С‹РІР°РµРј С‚РѕР»СЊРєРѕ РєРѕРіРґР° РґР°РЅРЅС‹С… РЅРµС‚ в”Ђв”Ђ */}
      {items.length === 0 && semifinished.length === 0 && (
        <div style={{ background:'#fff', border:'1px solid #e8e2d8', borderRadius:24, padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ fontWeight:800, fontSize:17, color:'#1a1a1a', letterSpacing:'-.03em', marginBottom:6 }}>
            Р”РѕР±СЂРѕ РїРѕР¶Р°Р»РѕРІР°С‚СЊ РІ ChefCloud
          </div>
          <div style={{ fontSize:13.5, color:'#a39f98', marginBottom:20, lineHeight:1.6 }}>
            РќР°С‡РЅРёС‚Рµ СЂР°Р±РѕС‚Сѓ вЂ” СЃРѕР·РґР°Р№С‚Рµ Р±Р°Р·Сѓ Р·РЅР°РЅРёР№ РІР°С€РµРіРѕ СЂРµСЃС‚РѕСЂР°РЅР° Р·Р° РЅРµСЃРєРѕР»СЊРєРѕ С€Р°РіРѕРІ.
          </div>
          <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
            {[
              { n:1, title:'РЎРѕР·РґР°Р№С‚Рµ РїРµСЂРІРѕРµ Р±Р»СЋРґРѕ', desc:'РќР°Р·РІР°РЅРёРµ, С„РѕС‚Рѕ, СЃРѕСЃС‚Р°РІ, С‚РµС…РЅРѕР»РѕРіРёСЏ Рё СЃС‚Р°РЅРґР°СЂС‚ РїРѕРґР°С‡Рё', action:'create', btn:'РЎРѕР·РґР°С‚СЊ Р±Р»СЋРґРѕ' },
              { n:2, title:'Р”РѕР±Р°РІСЊС‚Рµ РїРѕР»СѓС„Р°Р±СЂРёРєР°С‚', desc:'Р‘Р°Р·Р° Р·Р°РіРѕС‚РѕРІРѕРє РґР»СЏ Р±С‹СЃС‚СЂРѕР№ СЃР±РѕСЂРєРё Р±Р»СЋРґ', action:'semifinished', btn:'Р”РѕР±Р°РІРёС‚СЊ Рџ/Р¤' },
              { n:3, title:'РЎРѕР·РґР°Р№С‚Рµ РїСЂРѕРёР·РІРѕРґСЃС‚РІРµРЅРЅС‹Р№ РїР»Р°РЅ', desc:'Р—Р°РґР°РЅРёСЏ РЅР° СЃРјРµРЅСѓ СЃ РѕС‚РјРµС‚РєР°РјРё РІС‹РїРѕР»РЅРµРЅРёСЏ', action:'production', btn:'РћС‚РєСЂС‹С‚СЊ' },
              { n:4, title:'Р Р°СЃРїРµС‡Р°С‚Р°Р№С‚Рµ РўРўРљ', desc:'РљР°СЂС‚РѕС‡РєРё Рђ4 РґР»СЏ РєСѓС…РЅРё Рё РѕР±СѓС‡РµРЅРёСЏ РїРµСЂСЃРѕРЅР°Р»Р°', action:'print', btn:'РћС‚РєСЂС‹С‚СЊ' },
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
