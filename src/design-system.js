// ─── ChefCloud Design System ─────────────────────────────────────────────────
// Единый источник правды для цветов, типографики, теней и компонентов.
// Только визуал — никакой логики, никакого хранения.

export const DS = {
  // Цветовая палитра
  color: {
    // Фирменные цвета
    brand:       '#16332b',   // основной тёмно-зелёный
    brandHover:  '#1c4237',
    brandLight:  '#eef4f1',
    gold:        '#b99150',
    goldLight:   '#f7f0e4',

    // Нейтральные
    bg:          '#f6f4f0',   // тёплый молочный фон
    surface:     '#ffffff',
    surfaceHover:'#faf8f5',
    border:      '#e8e2d8',
    borderLight: '#f0ebe2',

    // Текст
    text:        '#1a1a1a',
    textMuted:   '#6b6560',
    textXMuted:  '#a39f98',

    // Состояния
    success:     '#16a34a',
    warning:     '#d97706',
    danger:      '#dc2626',
    info:        '#0284c7',
  },

  // Скругления
  radius: {
    sm:   8,
    md:   12,
    lg:   16,
    xl:   20,
    xxl:  24,
    pill: 999,
  },

  // Тени (мягкие, как у Linear/Stripe)
  shadow: {
    xs:  '0 1px 3px rgba(0,0,0,.06), 0 1px 2px rgba(0,0,0,.04)',
    sm:  '0 2px 8px rgba(0,0,0,.07), 0 1px 3px rgba(0,0,0,.05)',
    md:  '0 4px 16px rgba(0,0,0,.08), 0 2px 6px rgba(0,0,0,.05)',
    lg:  '0 8px 32px rgba(0,0,0,.10), 0 4px 12px rgba(0,0,0,.06)',
    xl:  '0 16px 48px rgba(0,0,0,.12), 0 8px 20px rgba(0,0,0,.07)',
    // Специальные
    brand: '0 8px 32px rgba(22,51,43,.18)',
    gold:  '0 4px 16px rgba(185,145,80,.20)',
    inset: 'inset 0 1px 3px rgba(0,0,0,.06)',
  },

  // Анимации
  transition: {
    fast:   'all 0.12s ease',
    normal: 'all 0.20s ease',
    slow:   'all 0.30s ease',
  },

  // Типографика
  font: {
    xs:   11,
    sm:   12,
    base: 13.5,
    md:   15,
    lg:   18,
    xl:   22,
    xxl:  28,
    hero: 36,
  },
}

// ─── Базовые стили кнопок ────────────────────────────────────────────────────

export const BTN = {
  primary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: DS.radius.lg,
    border: 'none',
    background: DS.color.brand,
    color: '#fff',
    fontSize: DS.font.base,
    fontWeight: 700,
    cursor: 'pointer',
    letterSpacing: '-.01em',
    transition: DS.transition.fast,
    whiteSpace: 'nowrap',
    boxShadow: '0 1px 3px rgba(22,51,43,.25)',
  },
  secondary: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: DS.radius.lg,
    border: `1.5px solid ${DS.color.border}`,
    background: DS.color.surface,
    color: DS.color.text,
    fontSize: DS.font.base,
    fontWeight: 600,
    cursor: 'pointer',
    letterSpacing: '-.01em',
    transition: DS.transition.fast,
    whiteSpace: 'nowrap',
    boxShadow: DS.shadow.xs,
  },
  ghost: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: DS.radius.lg,
    border: '1.5px solid transparent',
    background: 'transparent',
    color: DS.color.textMuted,
    fontSize: DS.font.base,
    fontWeight: 600,
    cursor: 'pointer',
    transition: DS.transition.fast,
    whiteSpace: 'nowrap',
  },
  danger: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: 7,
    padding: '9px 18px',
    borderRadius: DS.radius.lg,
    border: `1.5px solid #fca5a5`,
    background: '#fff5f5',
    color: DS.color.danger,
    fontSize: DS.font.base,
    fontWeight: 600,
    cursor: 'pointer',
    transition: DS.transition.fast,
    whiteSpace: 'nowrap',
  },
}

// ─── Карточка (Card) ─────────────────────────────────────────────────────────

export const CARD = {
  background: DS.color.surface,
  border: `1px solid ${DS.color.border}`,
  borderRadius: DS.radius.xxl,
  boxShadow: DS.shadow.sm,
}

export const CARD_HOVER = {
  ...CARD,
  transition: DS.transition.normal,
  cursor: 'pointer',
}

// ─── Input ───────────────────────────────────────────────────────────────────

export const INPUT_ST = {
  width: '100%',
  padding: '10px 14px',
  borderRadius: DS.radius.md,
  border: `1.5px solid ${DS.color.border}`,
  background: DS.color.surface,
  color: DS.color.text,
  fontSize: DS.font.base,
  outline: 'none',
  transition: DS.transition.fast,
  fontFamily: 'inherit',
  boxSizing: 'border-box',
}

export const SELECT_ST = {
  ...INPUT_ST,
  cursor: 'pointer',
  appearance: 'none',
  backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='12' viewBox='0 0 24 24' fill='none' stroke='%236b6560' stroke-width='2'%3E%3Cpath d='M6 9l6 6 6-6'/%3E%3C/svg%3E")`,
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'right 12px center',
  paddingRight: 32,
}

// ─── Совместимость со старым SEL_ST ─────────────────────────────────────────
// Экспортируем как SEL_ST чтобы старый код не сломался.
// Постепенно мигрируем на BTN.secondary.

export const SEL_ST = BTN.secondary
