// Уникальные заглушки для каждого раздела — не один шаблон на всех.
// Визуал premium-класса, честная информация о том, что будет реализовано.

const WRAPSTYLE = {
  maxWidth: 600,
  margin: '48px auto 0',
  textAlign: 'center',
  padding: '0 24px',
}

function IllustrationBox({ children, gradient }) {
  return (
    <div style={{
      width: 100, height: 100, borderRadius: 28,
      background: gradient || 'linear-gradient(135deg, #eef4f1, #d4e8df)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: 44, margin: '0 auto 24px',
      boxShadow: '0 8px 32px rgba(22,51,43,.10)',
    }}>{children}</div>
  )
}

function Badge({ children }) {
  return (
    <div style={{
      display:'inline-flex', alignItems:'center', gap:6,
      background:'#fffbeb', border:'1px solid #f3d9ad',
      borderRadius:999, padding:'5px 14px', marginBottom:16,
      fontSize:11.5, color:'#92400e', fontWeight:700,
      letterSpacing:'.04em',
    }}>
      🚧 {children}
    </div>
  )
}

const SECTIONS = {
  production: {
    gradient: 'linear-gradient(135deg, #ecf4ee, #c8e0ce)',
    icon: '👨‍🍳',
    badge: 'Следующий этап',
    title: 'Производство',
    subtitle: 'Ежедневный план кухни',
    description: 'Создавайте производственные планы, отмечайте выполнение задач и печатайте листы заготовок для каждой смены.',
    features: ['Производственный план дня', 'Задания для каждой станции', 'Печать производственных листов', 'Журнал выполнения'],
    cta: null,
  },
  print: {
    gradient: 'linear-gradient(135deg, #f0f4ff, #d8e2fc)',
    icon: '🖨️',
    badge: 'В разработке',
    title: 'Модуль печати',
    subtitle: 'Несколько форматов для кухни',
    description: 'Печать в нужном формате для любой ситуации — от обучения новых поваров до карточек на рабочих станциях.',
    features: ['Полная карточка A4 (обучение)', 'Station Card A6 (ламинирование)', 'Мини-карта 10×15 (холодильник)', 'QR-карта с ссылкой'],
    cta: null,
  },
  quality: {
    gradient: 'linear-gradient(135deg, #fef4ec, #fde0c0)',
    icon: '📸',
    badge: 'Требует подключения AI',
    title: 'Контроль качества',
    subtitle: 'AI-анализ подачи блюда',
    description: 'Сфотографируйте готовое блюдо — система сравнит с эталоном и покажет отклонения по подаче, весу и внешнему виду.',
    features: ['Загрузка фото готового блюда', 'AI-сравнение с эталоном', 'Процент соответствия', 'История проверок по смене'],
    cta: null,
  },
  analytics: {
    gradient: 'linear-gradient(135deg, #f0f0fe, #dcdcfc)',
    icon: '📊',
    badge: 'В разработке',
    title: 'Аналитика',
    subtitle: 'Food cost и рентабельность меню',
    description: 'Полная картина экономики вашей кухни: от себестоимости каждого блюда до ABC-анализа всего меню.',
    features: ['Food cost по блюдам и категориям', 'ABC / XYZ анализ меню', 'Маржинальность и потери', 'Популярность и скорость сборки'],
    cta: null,
  },
}

export default function Placeholder({ icon, title, description, etaNote }) {
  // Если есть специфичный раздел — показываем уникальный экран
  const sectionKey = Object.keys(SECTIONS).find(k => SECTIONS[k].title === title)
  const data = sectionKey ? SECTIONS[sectionKey] : null

  if (data) {
    return (
      <div style={WRAPSTYLE} className="cc-fade-in">
        <IllustrationBox gradient={data.gradient}>{data.icon}</IllustrationBox>
        <Badge>{data.badge}</Badge>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#16332b', letterSpacing:'-.03em', margin:'0 0 8px' }}>
          {data.title}
        </h1>
        <p style={{ fontSize:13.5, color:'#6b6560', marginBottom:8, fontWeight:600 }}>{data.subtitle}</p>
        <p style={{ fontSize:13.5, color:'#6b6560', lineHeight:1.7, marginBottom:28, maxWidth:440, margin:'0 auto 28px' }}>
          {data.description}
        </p>
        <div style={{
          display:'grid', gridTemplateColumns:'1fr 1fr', gap:10,
          textAlign:'left', maxWidth:420, margin:'0 auto',
        }}>
          {data.features.map(f => (
            <div key={f} style={{
              display:'flex', alignItems:'center', gap:8,
              background:'#fff', border:'1px solid #e8e2d8',
              borderRadius:12, padding:'10px 14px',
              fontSize:12.5, color:'#374151', fontWeight:600,
              boxShadow:'0 1px 3px rgba(0,0,0,.05)',
            }}>
              <span style={{ color:'#16332b' }}>✓</span> {f}
            </div>
          ))}
        </div>
      </div>
    )
  }

  // Универсальная заглушка (fallback)
  return (
    <div style={WRAPSTYLE} className="cc-fade-in">
      <IllustrationBox>{icon}</IllustrationBox>
      {etaNote && <Badge>{etaNote}</Badge>}
      <h1 style={{ fontSize:26, fontWeight:900, color:'#16332b', letterSpacing:'-.03em', margin:'0 0 12px' }}>{title}</h1>
      <p style={{ fontSize:13.5, color:'#6b6560', lineHeight:1.7, maxWidth:420, margin:'0 auto' }}>{description}</p>
    </div>
  )
}
