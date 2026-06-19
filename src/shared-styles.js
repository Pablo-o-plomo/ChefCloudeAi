// ─── Shared visual tokens — единый источник стилей для всех страниц ──────────
// Только визуал. Никакой логики, никакого API, никакого хранения.
// Импортируйте вместо локальных SECTION/PRIMARY/INPUT/TH/TD констант.

// ── Цвета бренда ─────────────────────────────────────────────────────────────
export const C = {
  brand:    '#16332b',
  brandHov: '#1c4237',
  brandLt:  '#eef4f1',
  gold:     '#b99150',
  goldLt:   '#f7f0e4',
  bg:       '#f6f4f0',
  surface:  '#ffffff',
  border:   '#e8e2d8',
  borderLt: '#f0ebe2',
  text:     '#1a1a1a',
  muted:    '#6b6560',
  xmuted:   '#a39f98',
  success:  '#16a34a',
  warning:  '#d97706',
  danger:   '#dc2626',
}

// ── Карточка-секция ───────────────────────────────────────────────────────────
export const SECTION = {
  background:   C.surface,
  border:       `1px solid ${C.border}`,
  borderRadius: 20,
  padding:      22,
  boxShadow:    '0 1px 4px rgba(0,0,0,.06)',
}

// ── Поле (label-обёртка) ─────────────────────────────────────────────────────
export const FIELD = { display: 'flex', flexDirection: 'column', gap: 6 }

// ── Input ────────────────────────────────────────────────────────────────────
export const INPUT = {
  padding:      '10px 14px',
  border:       `1.5px solid ${C.border}`,
  borderRadius: 12,
  fontSize:     13.5,
  outline:      'none',
  background:   C.surface,
  color:        C.text,
  fontFamily:   'inherit',
  width:        '100%',
  boxSizing:    'border-box',
  cursor:       'text',
  transition:   'border-color .15s',
}

// ── Textarea ──────────────────────────────────────────────────────────────────
export const TEXTAREA = {
  width:        '100%',
  boxSizing:    'border-box',
  minHeight:    90,
  border:       `1.5px solid ${C.border}`,
  borderRadius: 14,
  padding:      14,
  fontSize:     13.5,
  outline:      'none',
  resize:       'vertical',
  fontFamily:   'inherit',
  lineHeight:   1.6,
  background:   C.surface,
  color:        C.text,
  transition:   'border-color .15s',
}

// ── Select (совместимость со старым SEL_ST) ───────────────────────────────────
export const SEL_ST = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          7,
  padding:      '9px 16px',
  borderRadius: 12,
  border:       `1.5px solid ${C.border}`,
  background:   C.surface,
  color:        C.text,
  fontSize:     13,
  fontWeight:   600,
  cursor:       'pointer',
  whiteSpace:   'nowrap',
  boxShadow:    '0 1px 3px rgba(0,0,0,.05)',
  transition:   'all .15s',
  fontFamily:   'inherit',
}

// ── Primary кнопка (тёмно-зелёная) ───────────────────────────────────────────
export const PRIMARY = {
  display:      'inline-flex',
  alignItems:   'center',
  gap:          7,
  padding:      '10px 20px',
  borderRadius: 12,
  border:       'none',
  background:   C.brand,
  color:        '#fff',
  fontSize:     13.5,
  fontWeight:   700,
  cursor:       'pointer',
  whiteSpace:   'nowrap',
  boxShadow:    '0 2px 8px rgba(22,51,43,.25)',
  transition:   'all .15s',
  fontFamily:   'inherit',
  letterSpacing: '-.01em',
}

// ── Danger кнопка ─────────────────────────────────────────────────────────────
export const DANGER = {
  ...SEL_ST,
  color:        C.danger,
  borderColor:  '#fca5a5',
  background:   '#fff5f5',
}

// ── Таблица: заголовок ────────────────────────────────────────────────────────
export const TH = {
  textAlign:    'left',
  padding:      '10px 14px',
  background:   '#faf8f4',
  borderBottom: `1px solid ${C.borderLt}`,
  color:        C.xmuted,
  fontSize:     11,
  fontWeight:   700,
  textTransform:'uppercase',
  letterSpacing: '.06em',
  border:       'none',
}

// ── Таблица: ячейка ───────────────────────────────────────────────────────────
export const TD = {
  padding:      '11px 14px',
  borderBottom: `1px solid #faf8f4`,
  verticalAlign:'middle',
  border:       'none',
  color:        C.text,
  fontSize:     13.5,
}

// ── Label над полем ───────────────────────────────────────────────────────────
export const LABEL_ST = {
  fontSize:   12,
  fontWeight: 700,
  color:      C.muted,
  letterSpacing: '.01em',
}

// ── Тег/бейдж ─────────────────────────────────────────────────────────────────
export const TAG = (color = C.brand, bg) => ({
  display:      'inline-flex',
  alignItems:   'center',
  padding:      '3px 10px',
  borderRadius: 999,
  background:   bg || color + '18',
  color,
  fontSize:     11,
  fontWeight:   700,
  letterSpacing: '.02em',
  whiteSpace:   'nowrap',
})

// ── Поиск-обёртка ─────────────────────────────────────────────────────────────
export const SEARCH_WRAP = {
  position:     'relative',
  display:      'flex',
  alignItems:   'center',
}

export const SEARCH_INPUT = {
  ...INPUT,
  paddingLeft:  38,
  background:   '#faf8f4',
  borderColor:  C.borderLt,
  borderRadius: 14,
}
