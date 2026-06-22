import { useState } from 'react'
import { STORAGE_KEYS, WORKFLOW_STORAGE_KEY } from '../hooks/useBackup.js'

// Полный список ключей localStorage, которые использует ChefCloud — собран по
// CLAUDE.md / каждому хуку хранения. Не меняет ни один из этих ключей и не влияет
// на их формат — только удаляет значения по явному подтверждению пользователя.
const LEGACY_DISHES_KEY  = 'academy_reference_ttk_v1'
const DISHES_MIGRATED_KEY = 'academy_printable_reference_ttk_migrated_v1'
const TRIAL_START_KEY    = 'chefcloud_trial_start'
const TRIAL_PLAN_KEY     = 'chefcloud_trial_plan'

function getAllClearableKeys() {
  return [
    ...Object.values(STORAGE_KEYS),
    WORKFLOW_STORAGE_KEY,
    LEGACY_DISHES_KEY,
    DISHES_MIGRATED_KEY,
    TRIAL_START_KEY,
    TRIAL_PLAN_KEY,
  ]
}

const CARD = {
  background: '#fff',
  border: '1px solid #f3d9ad',
  borderRadius: 20,
  padding: '20px 24px',
  boxShadow: '0 6px 20px rgba(15,23,42,.05)',
}

const BTN_DANGER = {
  padding: '11px 20px',
  borderRadius: 12,
  border: 'none',
  background: '#dc2626',
  color: '#fff',
  fontWeight: 800,
  fontSize: 13.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

const BTN_SEC = {
  padding: '11px 20px',
  borderRadius: 12,
  border: '1.5px solid #e5e1d8',
  background: '#fff',
  color: '#374151',
  fontWeight: 700,
  fontSize: 13.5,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
}

function ConfirmClearDialog({ onConfirm, onCancel }) {
  return (
    <div style={{
      position: 'fixed', inset: 0, zIndex: 1000,
      background: 'rgba(0,0,0,.45)',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 24,
    }}>
      <div style={{ background: '#fff', borderRadius: 20, padding: 28, maxWidth: 460, width: '100%', boxShadow: '0 24px 60px rgba(0,0,0,.2)' }}>
        <div style={{ fontSize: 28, marginBottom: 12 }}>⚠️</div>
        <h2 style={{ margin: '0 0 8px', color: '#991b1b', fontSize: 20 }}>Очистить все данные?</h2>
        <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 16px' }}>
          Будут безвозвратно удалены все блюда, полуфабрикаты, товары, категории, номенклатура,
          коллекции и производственные задачи на этом устройстве. Действие нельзя отменить.
        </p>
        <p style={{ color: '#374151', fontSize: 13.5, lineHeight: 1.6, margin: '0 0 20px', fontWeight: 700 }}>
          Перед очисткой рекомендуем создать резервную копию.
        </p>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
          <button onClick={onConfirm} style={{ ...BTN_DANGER, flex: 1 }}>Да, очистить всё</button>
          <button onClick={onCancel}  style={{ ...BTN_SEC, flex: 1 }}>Отмена</button>
        </div>
      </div>
    </div>
  )
}

export default function ClearDataSection() {
  const [confirming, setConfirming] = useState(false)
  const [done, setDone] = useState(false)

  function handleClearAll() {
    getAllClearableKeys().forEach(key => {
      try { localStorage.removeItem(key) } catch {}
    })
    setConfirming(false)
    setDone(true)
    setTimeout(() => window.location.reload(), 1200)
  }

  return (
    <>
      {confirming && (
        <ConfirmClearDialog
          onConfirm={handleClearAll}
          onCancel={() => setConfirming(false)}
        />
      )}

      <div style={CARD}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 6 }}>
          <span style={{ fontSize: 24 }}>🗑️</span>
          <h2 style={{ margin: 0, fontSize: 18, color: '#991b1b' }}>Очистка данных</h2>
        </div>

        <p style={{ color: '#64748b', fontSize: 13.5, margin: '0 0 16px', lineHeight: 1.6 }}>
          Полностью удалить все данные ChefCloud с этого устройства. Полезно, если нужно начать с чистого листа.
        </p>

        {done ? (
          <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', color: '#166534', borderRadius: 12, padding: '12px 16px', fontSize: 13.5, fontWeight: 600 }}>
            ✅ Данные удалены. Страница обновится через мгновение…
          </div>
        ) : (
          <button onClick={() => setConfirming(true)} style={BTN_DANGER}>Очистить все данные</button>
        )}
      </div>
    </>
  )
}
