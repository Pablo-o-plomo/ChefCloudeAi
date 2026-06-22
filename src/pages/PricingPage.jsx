import { useState } from 'react'
import { activatePro } from '../hooks/useTrial.js'

function Check() {
  return (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#16a34a" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="20 6 9 17 4 12"/>
    </svg>
  )
}

function Feature({ text, muted }) {
  return (
    <div style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid #f5f2ed', fontSize:13.5, color: muted ? '#a39f98' : '#1a1a1a' }}>
      {muted
        ? <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="#d4cfc8" strokeWidth="2.5" strokeLinecap="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        : <Check />
      }
      {text}
    </div>
  )
}

const TRIAL_FEATURES = [
  'Неограниченное количество блюд',
  'Полуфабрикаты и товары',
  'Производственные планы',
  'Коллекции и организация меню',
  'AI Menu Engineering — подбор прибыльного меню',
  'Печать карточек A4',
  'Резервное копирование',
  'Экспорт/импорт данных',
]

const PRO_FEATURES = [
  'Всё из пробного периода',
  'Неограниченное использование',
  'Приоритетная поддержка',
  'Будущие обновления включены',
  'Печать A6 и QR-карты',
  'Кулинарная книга (PDF)',
  'Аналитика и food cost',
  'Облачная синхронизация',
  'Контроль качества с AI',
  'Мультиресторанность',
]

export default function PricingPage({ trialInfo }) {
  const [activated, setActivated] = useState(false)

  function handleActivatePro() {
    // В реальном MVP здесь будет ссылка на оплату
    // Пока — симуляция для демонстрации архитектуры
    if (window.confirm('Функция оплаты будет подключена в следующем этапе.\n\nАктивировать Pro-режим для демонстрации?')) {
      activatePro()
      setActivated(true)
      setTimeout(() => window.location.reload(), 1000)
    }
  }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:28, maxWidth:900, margin:'0 auto' }} className="cc-fade-in">
      {/* Заголовок */}
      <div style={{ textAlign:'center', padding:'0 24px' }}>
        <div style={{ fontSize:12, fontWeight:700, color:'#b99150', letterSpacing:'.10em', textTransform:'uppercase', marginBottom:10 }}>Тарифы</div>
        <h1 style={{ fontSize:32, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 12px' }}>Простые и прозрачные цены</h1>
        <p style={{ fontSize:14, color:'#a39f98', margin:0, maxWidth:480, marginLeft:'auto', marginRight:'auto', lineHeight:1.7 }}>
          Начните бесплатно. Ваши данные всегда остаются с вами.
        </p>
      </div>

      {/* Карточки тарифов */}
      <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:20 }}>

        {/* Trial */}
        <div style={{ background:'#fff', border:'1px solid #e8e2d8', borderRadius:24, padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,.06)' }}>
          <div style={{ marginBottom:20 }}>
            <div style={{ fontSize:11, fontWeight:700, color:'#a39f98', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>Пробный период</div>
            <div style={{ fontSize:36, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', lineHeight:1 }}>
              Бесплатно
            </div>
            <div style={{ fontSize:13, color:'#a39f98', marginTop:6 }}>7 дней · полный доступ</div>
          </div>

          <div style={{ marginBottom:24 }}>
            {TRIAL_FEATURES.map(f => <Feature key={f} text={f} />)}
          </div>

          <div style={{ padding:'11px', borderRadius:14, border:'1.5px solid #e8e2d8', background:'#faf8f4', textAlign:'center', fontSize:13.5, fontWeight:700, color:'#a39f98' }}>
            {trialInfo?.plan === 'pro' ? 'Вы на Pro плане' : trialInfo?.expired ? 'Пробный период завершён' : `Осталось ${trialInfo?.daysLeft ?? 7} дн.`}
          </div>
        </div>

        {/* Pro */}
        <div style={{
          background:'linear-gradient(135deg, #0f2219 0%, #16332b 100%)',
          borderRadius:24, padding:'28px 32px',
          boxShadow:'0 8px 32px rgba(22,51,43,.25)',
          position:'relative', overflow:'hidden',
        }}>
          {/* Декор */}
          <div style={{ position:'absolute', top:-60, right:-60, width:200, height:200, borderRadius:'50%', background:'radial-gradient(circle, rgba(185,145,80,.2) 0%, transparent 70%)', pointerEvents:'none' }} />

          <div style={{ marginBottom:20, position:'relative', zIndex:1 }}>
            <div style={{ display:'flex', alignItems:'center', gap:8, marginBottom:8 }}>
              <div style={{ fontSize:11, fontWeight:700, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase' }}>Pro</div>
              <div style={{ fontSize:10, fontWeight:700, background:'#b99150', color:'#fff', padding:'2px 8px', borderRadius:999 }}>Рекомендуем</div>
            </div>
            <div style={{ fontSize:36, fontWeight:900, color:'#fff', letterSpacing:'-.04em', lineHeight:1 }}>
              2 900 <span style={{ fontSize:18, fontWeight:600, color:'rgba(255,255,255,.5)' }}>₽/мес</span>
            </div>
            <div style={{ fontSize:13, color:'rgba(255,255,255,.45)', marginTop:6 }}>или 24 900 ₽/год · экономия 40%</div>
          </div>

          <div style={{ marginBottom:24, position:'relative', zIndex:1 }}>
            {PRO_FEATURES.map((f, i) => (
              <div key={f} style={{ display:'flex', alignItems:'center', gap:10, padding:'7px 0', borderBottom:'1px solid rgba(255,255,255,.06)', fontSize:13.5, color: i < 4 ? '#fff' : 'rgba(255,255,255,.65)' }}>
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke={i < 4 ? '#4ade80' : 'rgba(255,255,255,.3)'} strokeWidth="2.5" strokeLinecap="round"><polyline points="20 6 9 17 4 12"/></svg>
                {f}
                {i >= 7 && <span style={{ fontSize:10, color:'rgba(255,255,255,.3)', marginLeft:'auto' }}>скоро</span>}
              </div>
            ))}
          </div>

          <button
            onClick={handleActivatePro}
            style={{
              width:'100%', padding:'13px', borderRadius:14, border:'none',
              background:'linear-gradient(135deg, #b99150, #d4aa6a)',
              color:'#fff', fontWeight:800, fontSize:14, cursor:'pointer',
              boxShadow:'0 4px 14px rgba(185,145,80,.4)',
              position:'relative', zIndex:1,
            }}
          >
            {activated ? '✓ Активировано!' : 'Начать с Pro'}
          </button>
          <div style={{ fontSize:11.5, color:'rgba(255,255,255,.3)', textAlign:'center', marginTop:10, position:'relative', zIndex:1 }}>
            Оплата картой · Отмена в любой момент
          </div>
        </div>
      </div>

      {/* FAQ */}
      <div style={{ background:'#fff', border:'1px solid #e8e2d8', borderRadius:24, padding:'28px 32px', boxShadow:'0 1px 4px rgba(0,0,0,.05)' }}>
        <div style={{ fontWeight:800, fontSize:16, color:'#1a1a1a', marginBottom:20, letterSpacing:'-.02em' }}>Часто задаваемые вопросы</div>
        <div style={{ display:'grid', gridTemplateColumns:'1fr 1fr', gap:'16px 32px' }}>
          {[
            ['Мои данные сохранятся?', 'Да. Все данные хранятся локально в вашем браузере. После завершения пробного периода данные остаются — только ограничивается создание новых записей.'],
            ['Как работает пробный период?', 'Вы получаете полный доступ ко всем функциям на 7 дней без ограничений и без банковской карты.'],
            ['Что будет после Trial?', 'Вы сможете просматривать, печатать и экспортировать данные. Для создания и редактирования нужен Pro.'],
            ['Есть ли скидка для ресторанных сетей?', 'Да, при подключении 3+ заведений — скидка 30%. Напишите нам в Telegram.'],
          ].map(([q, a]) => (
            <div key={q}>
              <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1a1a', marginBottom:5 }}>{q}</div>
              <div style={{ fontSize:13, color:'#6b6560', lineHeight:1.6 }}>{a}</div>
            </div>
          ))}
        </div>
      </div>

      {/* Контакты */}
      <div style={{ textAlign:'center', fontSize:13, color:'#a39f98' }}>
        Есть вопросы? Напишите нам —
        <a href="https://t.me/chefcloud_support" target="_blank" rel="noopener noreferrer" style={{ color:'#16332b', fontWeight:700, marginLeft:6, textDecoration:'none' }}>Telegram</a>
        <span style={{ margin:'0 8px' }}>·</span>
        <a href="mailto:hello@chefcloud.ru" style={{ color:'#16332b', fontWeight:700, textDecoration:'none' }}>hello@chefcloud.ru</a>
      </div>
    </div>
  )
}
