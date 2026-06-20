import { useMemo, useState } from 'react'
import { Tag } from './components/ui.jsx'
import {
  HomeIcon, MenuIcon, LayersIcon, PackageIcon, FlameIcon,
  PrinterIcon, CheckCircleIcon, BotIcon, BarChartIcon, SettingsIcon,
  BookOpenIcon, SparkleIcon,
} from './components/icons.jsx'
import { createEmptyReferenceTtk, useReferenceTtkStore } from './hooks/useReferenceTtk.js'
import { useTtkCategoriesStore } from './hooks/useTtkCategories.js'
import { useCollectionsStore } from './hooks/useCollections.js'
import { useNomenclatureStore } from './hooks/useNomenclature.js'
import { useProductsStore } from './hooks/useProducts.js'
import { useSemifinishedStore } from './hooks/useSemifinished.js'
import { ReferenceTtkForm, ReferenceTtkList, ReferenceTtkView } from './pages/ReferenceTtk.jsx'
import { NomenclaturePage } from './pages/Nomenclature.jsx'
import { ProductsPage } from './pages/ProductsPage.jsx'
import SemifinishedPage from './pages/SemifinishedPage.jsx'
import Placeholder from './pages/Placeholder.jsx'
import AiAssistantPage from './pages/AiAssistantPage.jsx'
import BackupSection from './components/BackupSection.jsx'
import PremiumDashboard from './pages/Dashboard.premium.jsx'
import AnalyticsPage from './pages/AnalyticsPage.jsx'
import ProductionPage from './pages/ProductionPage.jsx'
import PrintPage from './pages/PrintPage.jsx'
import QualityPage from './pages/QualityPage.jsx'
import MenuArchitectPage from './pages/MenuArchitectPage.jsx'
import PricingPage from './pages/PricingPage.jsx'
import LegalPage from './pages/LegalPage.jsx'
import { useTrialStore } from './hooks/useTrial.js'

// Верхнеуровневая навигация ChefCloud. 'list'/'create'/'view' — экраны раздела "Меню"
// (внутренние имена секций и хранилище данных оставлены прежними, чтобы не трогать
// уже сохранённые блюда пользователей — меняется только то, что видно в интерфейсе).
const NAV_ITEMS = [
  { id: 'home',        label: 'Дашборд',           Icon: HomeIcon },
  { id: 'list',        label: 'Меню',               Icon: MenuIcon },
  { id: 'menu_arch',   label: 'Конструктор меню',   Icon: SparkleIcon },
  { id: 'semifinished',label: 'Полуфабрикаты',      Icon: LayersIcon },
  { id: 'products',    label: 'Склад',              Icon: PackageIcon },
  { id: 'production',  label: 'Производство',       Icon: FlameIcon },
  { id: 'print',       label: 'Печать',             Icon: PrinterIcon },
  { id: 'quality',     label: 'Контроль качества',  Icon: CheckCircleIcon },
  { id: 'ai',          label: 'AI Ассистент',       Icon: BotIcon },
  { id: 'analytics',   label: 'Аналитика',          Icon: BarChartIcon },
  { id: 'settings',    label: 'Настройки',          Icon: SettingsIcon },
  { id: 'pricing',     label: 'Тарифы',             Icon: BarChartIcon },
]

const PLACEHOLDER_SECTIONS = {
  production: {
    icon: '👨🏻‍🍳', title: 'Производство',
    description: 'Ежедневный план кухни: список того, что нужно приготовить сегодня, с отметками о выполнении, историей и печатью производственных листов.',
    etaNote: 'В разработке',
  },
  print: {
    icon: '🖨️', title: 'Печать',
    description: 'Отдельный модуль печати: полная карточка А4, Station Card A6, мини-карта 10×15, производственная карта и QR-карта. Сейчас печать полной карточки доступна прямо из карточки блюда.',
    etaNote: 'Дополнительные форматы — в разработке',
  },
  quality: {
    icon: '📸', title: 'Контроль качества',
    description: 'Фотолента проверок: фото блюда, процент соответствия эталону, замечания, вес, история. AI-анализ фотографии подключим отдельным этапом.',
    etaNote: 'Требует подключения AI — следующий этап',
  },
  analytics: {
    icon: '📊', title: 'Аналитика',
    description: 'Food cost, ABC/XYZ-анализ, маржинальность, продажи, списания, популярность блюд, скорость сборки и ошибки приготовления.',
    etaNote: 'В разработке',
  },
  ai: {
    icon: '🤖', title: 'AI',
    description: 'Интеллектуальный помощник бренд-шефа: создание блюд по food cost, описаний, технологий, производственных карт, поиск блюд с низкой маржинальностью.',
    etaNote: 'Требует подключения нейросетей — следующий этап',
  },
}

function downloadJson(item) {
  const blob = new Blob([JSON.stringify(item, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = `${item.title || 'reference-ttk'}.json`
  link.click()
  URL.revokeObjectURL(url)
}

function toTtkOption(item, source) {
  return {
    ...item,
    source,
    title: item.title || item.name || item['Наименование'] || 'Без названия',
    name: item.name || item.title || item['Наименование'] || 'Без названия',
    unit: item.unit || item['Ед. изм.'] || item['Ед изм'] || 'г',
    composition: item.composition || item['Состав'] || '',
    cookingMethod: item.cookingMethod || item['Способ приготовления'] || item['Технология'] || '',
  }
}

function makeCombinedNomenclature(nomenclature, products, semifinished) {
  const map = new Map()

  ;[
    ...nomenclature.map(item => toTtkOption(item, 'nomenclature')),
    ...products.map(item => toTtkOption(item, 'product')),
    ...semifinished.map(item => toTtkOption(item, 'semifinished')),
  ].forEach(item => {
    const key = `${item.source}_${String(item.name || item.title).trim().toLowerCase()}`
    if (!map.has(key)) map.set(key, item)
  })

  return Array.from(map.values())
}

function Settings({ onOpenNomenclature, nomenclatureCount, onNavigate }) {
  const card = {
    background:'#fff', border:'1px solid #e8e2d8',
    borderRadius:20, padding:'24px 28px',
    boxShadow:'0 1px 4px rgba(0,0,0,.06)',
    maxWidth:720,
  }
  const sectionTitle = { fontSize:15, fontWeight:800, color:'#1a1a1a', letterSpacing:'-.02em', margin:'0 0 4px' }
  const sectionDesc  = { fontSize:13, color:'#a39f98', margin:'0 0 18px', lineHeight:1.6 }

  return (
    <div style={{ display:'flex', flexDirection:'column', gap:16, maxWidth:720 }} className="cc-fade-in">
      <div>
        <h1 style={{ fontSize:26, fontWeight:900, color:'#1a1a1a', letterSpacing:'-.04em', margin:'0 0 6px' }}>Настройки</h1>
        <p style={{ fontSize:13.5, color:'#a39f98', margin:0 }}>Управление данными, резервными копиями и интеграциями</p>
      </div>

      <div style={card}>
        <p style={sectionTitle}>🔧 Статус системы</p>
        <p style={sectionDesc}>Текущее состояние хранилища и сервисов</p>
        <div style={{ display:'flex', flexDirection:'column', gap:10 }}>
          {[
            { icon:'', label:'Хранение данных', value:'localStorage браузера', status:'Активно', ok:true },
            { icon:'', label:'Backend / сервер', value:'Не подключён', status:'Не используется', ok:false },
            { icon:'', label:'AI нейросеть', value:'API ключ не настроен', status:'Заглушка', ok:false },
            { icon:'', label:'Синхронизация', value:'Не настроена', status:'Локально', ok:null },
          ].map(row => (
            <div key={row.label} style={{
              display:'flex', alignItems:'center', gap:14,
              padding:'12px 16px', borderRadius:14,
              background:'#faf8f4', border:'1px solid #f0ebe2',
            }}>
              
              <div style={{ flex:1 }}>
                <div style={{ fontWeight:700, fontSize:13.5, color:'#1a1a1a' }}>{row.label}</div>
                <div style={{ fontSize:12, color:'#a39f98' }}>{row.value}</div>
              </div>
              <div style={{
                fontSize:11.5, fontWeight:700,
                color: row.ok === true ? '#16a34a' : row.ok === false ? '#a39f98' : '#d97706',
                background: row.ok === true ? '#f0fdf4' : row.ok === false ? '#f9fafb' : '#fffbeb',
                padding:'3px 10px', borderRadius:999,
              }}>{row.status}</div>
              <div style={{ width:8, height:8, borderRadius:'50%', background: row.ok === true ? '#4ade80' : '#d1d5db', flexShrink:0 }} />
            </div>
          ))}
        </div>
      </div>

      <div style={card}>
        <p style={sectionTitle}>💾 Резервное копирование</p>
        <p style={sectionDesc}>Экспорт и импорт всех данных одним файлом — блюда, П/Ф, склад, категории и номенклатура</p>
        <BackupSection />
      </div>

      <div style={card}>
        <p style={sectionTitle}>📋 Номенклатура</p>
        <p style={sectionDesc}>Общий справочник продуктов для автоподстановки в состав блюд. Сейчас: {nomenclatureCount} позиций.</p>
        <button onClick={onOpenNomenclature} style={{
          padding:'10px 20px', borderRadius:12,
          border:'1.5px solid #e8e2d8', background:'#fff',
          cursor:'pointer', fontSize:13.5, fontWeight:700,
          color:'#16332b', boxShadow:'0 1px 3px rgba(0,0,0,.05)',
        }}>Открыть номенклатуру →</button>
      </div>

      <div style={{ ...card }}>
        <p style={sectionTitle}>Информация</p>
        <div style={{ display:'flex', gap:8, flexWrap:'wrap' }}>
          {[
            ['about','О сервисе'],['pricing','Тарифы'],
            ['privacy','Конфиденциальность'],['terms','Соглашение'],['contacts','Контакты'],
          ].map(([id, label]) => (
            <button key={id} onClick={() => onNavigate && onNavigate(id)}
              style={{ padding:'7px 14px', borderRadius:10, border:'1.5px solid #e8e2d8', background:'#faf8f4', cursor:'pointer', fontSize:12.5, fontWeight:600, color:'#374151' }}>
              {label}
            </button>
          ))}
        </div>
      </div>

      <div style={{ ...card, background:'linear-gradient(135deg,#16332b,#1f4438)', color:'#fff' }}>
        <div style={{ display:'flex', justifyContent:'space-between', alignItems:'center', flexWrap:'wrap', gap:12 }}>
          <div>
            <div style={{ fontSize:11, fontWeight:800, color:'#b99150', letterSpacing:'.08em', textTransform:'uppercase', marginBottom:8 }}>ChefCloud</div>
            <div style={{ fontSize:18, fontWeight:900, marginBottom:8, letterSpacing:'-.03em' }}>Professional Kitchen Platform</div>
            <div style={{ fontSize:12.5, color:'rgba(255,255,255,.5)', lineHeight:1.7 }}>
              React 18 + Vite 5 · localStorage · Без backend<br />
              Следующий этап: облачное хранение и мультиресторанность
            </div>
          </div>
          <div style={{ textAlign:'center', background:'rgba(255,255,255,.08)', borderRadius:14, padding:'14px 20px' }}>
            <div style={{ fontSize:11, color:'rgba(255,255,255,.4)', marginBottom:4 }}>Версия</div>
            <div style={{ fontSize:18, fontWeight:900 }}>2.0</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function App() {
  const [section, setSection] = useState('list')
  const [selectedId, setSelectedId] = useState(null)
  const [editing, setEditing] = useState(null)
  const [initialTab, setInitialTab] = useState('main')

  const trial = useTrialStore()

  const {
    items, saveTtk, deleteTtk, duplicateTtk,
    archiveTtk, restoreTtk, exportAll, importAll,
    source, isRemote,
  } = useReferenceTtkStore()

  const { categories, addCategory } = useTtkCategoriesStore()

  const {
    collections,
    createCollection,
    updateCollection,
    addDishToCollections,
    removeDishFromCollection,
    toggleFavorite,
    isFavorite,
    createCollectionFromDishes,
  } = useCollectionsStore()

  const {
    items: nomenclature,
    saveItem: saveNomenclatureItem,
    deleteItem: deleteNomenclatureItem,
    importItems: importNomenclatureItems,
  } = useNomenclatureStore()

  const {
    items: products,
    saveItem: saveProduct,
    deleteItem: deleteProduct,
    importItems: importProducts,
  } = useProductsStore()

  const {
    items: semifinished,
    saveItem: saveSemifinished,
    deleteItem: deleteSemifinished,
    importItems: importSemifinished,
  } = useSemifinishedStore()

  const combinedNomenclature = useMemo(
    () => makeCombinedNomenclature(nomenclature, products, semifinished),
    [nomenclature, products, semifinished],
  )

  const selected = useMemo(() => items.find(item => item.id === selectedId), [items, selectedId])
  const pageTitle = NAV_ITEMS.find(item => item.id === section)?.label
    || (section === 'nomenclature' ? 'Номенклатура' : 'Блюда')

  function openItem(item) {
    setSelectedId(item.id)
    setEditing(null)
    setSection('view')
  }

  function editItem(item, options) {
    setEditing(item)
    setInitialTab(options?.tab || 'main')
    setSection('create')
  }

  function createItem() {
    setEditing(createEmptyReferenceTtk())
    setInitialTab('main')
    setSection('create')
  }

  function handleSave(form) {
    const saved = saveTtk(form)
    setSelectedId(saved.id)
    setEditing(null)
    setSection('view')
  }

  function handleDuplicate() {
    const copy = duplicateTtk(selected?.id)
    if (copy) openItem(copy)
  }

  function handleDelete() {
    if (!selected) return
    deleteTtk(selected.id)
    setSelectedId(null)
    setSection('list')
  }

  function handleArchive(id) {
    archiveTtk(id)
    if (selectedId === id) {
      setSelectedId(null)
      setSection('list')
    }
  }

  function handleRestore(id) {
    restoreTtk(id)
  }

  function handleExportAll() {
    const data = exportAll()
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.download = `reference-ttk-export-${new Date().toISOString().slice(0, 10)}.json`
    link.click()
    URL.revokeObjectURL(url)
  }

  function handleImportAll(file) {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        const parsed = JSON.parse(reader.result)
        const list = Array.isArray(parsed) ? parsed : [parsed]
        const count = importAll(list)
        window.alert(`Импортировано карточек: ${count}`)
      } catch {
        window.alert('Не удалось прочитать файл. Убедитесь, что это JSON-экспорт из этого же раздела.')
      }
    }
    reader.readAsText(file)
  }

  return (
    <div style={{ display:'flex', minHeight:'100vh', background:'var(--bg)' }}>

      {/* ═══ SIDEBAR ══════════════════════════════════════════════════════ */}
      <aside style={{
        width: 240,
        background: 'linear-gradient(180deg, #12291f 0%, #16332b 60%, #122a22 100%)',
        color: '#fff',
        display: 'flex',
        flexDirection: 'column',
        flexShrink: 0,
        position: 'sticky',
        top: 0,
        height: '100vh',
        overflowY: 'auto',
      }}>

        {/* Logo */}
        <div style={{ padding: '22px 18px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 4 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 10,
              background: 'linear-gradient(135deg, #b99150, #d4aa6a)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(185,145,80,.4)',
            }}>
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 2a5 5 0 00-5 5c0 2.5 1.5 4 3 5H9a3 3 0 00-3 3v2h12v-2a3 3 0 00-3-3h-1c1.5-1 3-2.5 3-5a5 5 0 00-5-5z"/>
              </svg>
            </div>
            <div>
              <div style={{ fontSize: 15, fontWeight: 800, letterSpacing: '-.03em', color: '#fff' }}>ChefCloud</div>
              <div style={{ fontSize: 10, color: 'rgba(255,255,255,.35)', letterSpacing: '.08em', textTransform: 'uppercase' }}>Kitchen OS</div>
            </div>
          </div>
        </div>

        {/* Divider */}
        <div style={{ height: 1, background: 'rgba(255,255,255,.06)', margin: '0 14px 10px' }} />

        {/* Navigation */}
        <nav style={{ flex: 1, padding: '2px 8px' }}>
          <div className="cc-section-label">Основное</div>
          {NAV_ITEMS.slice(0, 6).map((item, i) => {
            const active = section === item.id || (item.id === 'list' && (section === 'view' || section === 'create'))
            return (
              <button
                key={item.id}
                className={`cc-nav-item${active ? ' active' : ''}`}
                onClick={() => setSection(item.id === 'list' ? 'list' : item.id)}
                style={{ animationDelay: `${i * 0.04}s` }}
              >
                <span className="cc-nav-dot" />
                <span style={{ display:'flex', alignItems:'center', opacity: active ? 1 : .6 }}><item.Icon /></span>
                <span>{item.label}</span>
                {item.id === 'list' && items.length > 0 && (
                  <span style={{
                    marginLeft: 'auto', fontSize: 11, fontWeight: 700,
                    background: active ? 'rgba(255,255,255,.15)' : 'rgba(255,255,255,.08)',
                    color: active ? '#fff' : 'rgba(255,255,255,.4)',
                    padding: '2px 7px', borderRadius: 999,
                  }}>{items.length}</span>
                )}
              </button>
            )
          })}

          <div className="cc-section-label" style={{ marginTop: 8 }}>Инструменты</div>
          {NAV_ITEMS.slice(6).map((item, i) => {
            const active = section === item.id
            return (
              <button
                key={item.id}
                className={`cc-nav-item${active ? ' active' : ''}`}
                onClick={() => setSection(item.id)}
                style={{ animationDelay: `${(i + 5) * 0.04}s` }}
              >
                <span className="cc-nav-dot" />
                <span style={{ display:'flex', alignItems:'center', opacity: active ? 1 : .6 }}><item.Icon /></span>
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        {/* Feedback button */}
        <a
          href="https://t.me/chefcloud_support"
          target="_blank"
          rel="noopener noreferrer"
          style={{
            display:'flex', alignItems:'center', gap:8,
            margin:'4px 8px', padding:'9px 12px',
            borderRadius:10, textDecoration:'none',
            background:'rgba(255,255,255,.04)',
            color:'rgba(255,255,255,.5)', fontSize:12, fontWeight:600,
            transition:'background .12s',
          }}
          onMouseEnter={e => e.currentTarget.style.background='rgba(255,255,255,.08)'}
          onMouseLeave={e => e.currentTarget.style.background='rgba(255,255,255,.04)'}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>
          Обратная связь
        </a>

        {/* Trial status */}
        {trial && trial.plan !== 'pro' && (
          <button
            onClick={() => setSection('pricing')}
            style={{
              display:'flex', alignItems:'center', justifyContent:'space-between',
              margin:'4px 8px', padding:'9px 12px',
              borderRadius:10, border:'none', cursor:'pointer',
              background: trial.expired ? 'rgba(220,38,38,.15)' : trial.daysLeft <= 2 ? 'rgba(220,38,38,.12)' : 'rgba(185,145,80,.12)',
              color: trial.expired ? '#fca5a5' : trial.daysLeft <= 2 ? '#fca5a5' : '#d4aa6a',
              fontSize:12, fontWeight:700, width:'calc(100% - 16px)',
              transition:'background .12s',
            }}
          >
            <span>{trial.expired ? 'Trial истёк' : `Trial · ${trial.daysLeft} дн.`}</span>
            <span style={{ opacity:.7 }}>→ Pro</span>
          </button>
        )}

        {/* Bottom status */}
        <div style={{
          margin: '8px',
          padding: '12px 14px',
          borderRadius: 12,
          background: 'rgba(255,255,255,.04)',
          border: '1px solid rgba(255,255,255,.06)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 8 }}>
            <div style={{ width: 7, height: 7, borderRadius: '50%', background: '#4ade80' }} />
            <span style={{ fontSize: 11, color: 'rgba(255,255,255,.5)', fontWeight: 600 }}>Локальное хранение</span>
          </div>
          {[
            { label: 'Блюд', value: items.length },
            { label: 'П/Ф', value: semifinished.length },
            { label: 'Склад', value: products.length },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
              <span style={{ fontSize: 11, color: 'rgba(255,255,255,.35)' }}>{row.label}</span>
              <span style={{ fontSize: 11, fontWeight: 700, color: 'rgba(255,255,255,.55)' }}>{row.value}</span>
            </div>
          ))}
        </div>
      </aside>

      <main style={{ flex:1, minWidth:0, display:'flex', flexDirection:'column' }}>
        <header style={{
          position: 'sticky', top: 0, zIndex: 50,
          background: 'rgba(246,244,240,.85)',
          backdropFilter: 'blur(16px)',
          WebkitBackdropFilter: 'blur(16px)',
          borderBottom: '1px solid var(--border-light)',
          padding: '0 28px',
          height: 56,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          gap: 12,
        }}>
          <div style={{ fontSize: 14, fontWeight: 700, color: 'var(--text)', letterSpacing: '-.02em' }}>
            {section === 'view' ? selected?.title || 'Карточка блюда' : pageTitle}
          </div>
          <div style={{ display:'flex', alignItems:'center', gap:8 }}>
            <div style={{
              fontSize: 11, fontWeight: 600,
              color: 'var(--text-xmuted)',
              background: 'rgba(22,51,43,.06)',
              padding: '4px 10px', borderRadius: 999,
              letterSpacing: '.01em',
            }}>Professional Kitchen Platform</div>
          </div>
        </header>

        {section === 'ai' ? (
          <AiAssistantPage />
        ) : (
        <div className="cc-fade-in" style={{ padding:'28px 28px 40px', flex:1 }}>
          {section === 'home' && (
            <PremiumDashboard
              items={items}
              isRemote={isRemote}
              semifinished={semifinished}
              products={products}
              categories={categories}
              trial={trial}
              onNavigate={s => {
                if (s === 'create') createItem()
                else setSection(s)
              }}
            />
          )}

          {section === 'list' && (
            <ReferenceTtkList
              items={items}
              categories={categories}
              onOpen={openItem}
              onEdit={editItem}
              onCreate={createItem}
              onDownload={downloadJson}
              onArchive={handleArchive}
              onRestore={handleRestore}
              collections={collections}
              onCreateCollection={createCollection}
              onUpdateCollection={updateCollection}
              onAddDishToCollections={addDishToCollections}
              onRemoveDishFromCollection={removeDishFromCollection}
              onToggleFavorite={toggleFavorite}
              isFavorite={isFavorite}
            />
          )}

          {section === 'create' && (
            <ReferenceTtkForm
              initial={editing}
              initialTab={initialTab}
              nomenclature={combinedNomenclature}
              categories={categories}
              onAddCategory={addCategory}
              onSaveNomenclatureItem={saveNomenclatureItem}
              onCancel={() => setSection('list')}
              onSave={handleSave}
            />
          )}

          {section === 'view' && selected && (
            <ReferenceTtkView
              ttk={selected}
              onBack={() => setSection('list')}
              onEdit={() => editItem(selected)}
              onEditAi={() => editItem(selected, { tab: 'ai' })}
              onDuplicate={handleDuplicate}
              onDelete={handleDelete}
              onArchive={() => handleArchive(selected.id)}
            />
          )}

          {section === 'nomenclature' && (
            <NomenclaturePage
              items={nomenclature}
              onSave={saveNomenclatureItem}
              onDelete={deleteNomenclatureItem}
              onImport={importNomenclatureItems}
            />
          )}

          {section === 'products' && (
            <ProductsPage
              items={products}
              onSave={saveProduct}
              onDelete={deleteProduct}
              onImport={importProducts}
            />
          )}

          {section === 'semifinished' && (
            <SemifinishedPage
              items={semifinished}
              products={products}
              onSave={saveSemifinished}
              onDelete={deleteSemifinished}
              onImport={importSemifinished}
            />
          )}

          {section === 'production' && <ProductionPage />}
          {section === 'menu_arch' && <MenuArchitectPage items={items} collections={collections} onCreateCollectionFromDishes={createCollectionFromDishes} onNavigate={setSection} />}
          {section === 'print'      && <PrintPage items={items} />}
          {section === 'quality'    && <QualityPage />}
          {section === 'analytics'  && <AnalyticsPage />}

          {section === 'pricing' && (
            <PricingPage trialInfo={trial} />
          )}

          {['about','privacy','terms','contacts'].includes(section) && (
            <LegalPage page={section} />
          )}

          {section === 'settings' && (
            <Settings
              onOpenNomenclature={() => setSection('nomenclature')}
              nomenclatureCount={nomenclature.length}
              onNavigate={setSection}
            />
          )}
        </div>
        )}
      </main>
    </div>
  )
}