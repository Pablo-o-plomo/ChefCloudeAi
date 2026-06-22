# 🖨️ ЭТАП 5: АНАЛИЗ ПЕЧАТИ

**Дата:** 21 июня 2026  
**Статус:** Audit только (без изменений кода)  

---

## 📍 ГДЕ ПЕЧАТЬ РЕАЛИЗОВАНА

### 1. Печать ТТК (Блюдо) — ReferenceTtk.jsx ✅

**Функция:** `makePrintableHtml(ttk)`
- **Строк кода:** ~150 (lines 157–269)
- **Шаблон:** Фирменный бланк ChefCloud
- **Компоненты:**
  - Kicker: "ChefCloud · стандарт блюда"
  - Фото (если есть)
  - Meta-карточки: выход, сборка, категория, посуда
  - Два блока: описание + состав
  - Способ приготовления, подача, критические точки, комментарии
  - Таблица ингредиентов (name, type, qty)

**Данные:**
- Фото: `ttk.photo.dataUrl` (base64 в localStorage)
- Ингредиенты: `ttk.rows[]`
  - name, type (product/semifinished), qty, unit

**Стили:**
```css
@page { size: A4; margin: 0; }
body { margin: 0; background: #f4efe7; font-family: Inter, Manrope; }
.page { width: 210mm; min-height: 297mm; background: #faf8f5; padding: 16mm; }
.page:before { radial-gradient (два градиента фирменного стиля) }
h1 { font-size: 28px; color: #16332b; font-weight: 900; }
table { border-collapse: collapse; }
```

**Результат:** ✅ РАБОТАЕТ, бланк красивый

---

### 2. Печать Полуфабриката — SemifinishedPage.jsx ✅

**Функции:**
- `makePrintableHtmlSemifinished()` — для active статуса
- `makePrintableHtmlWorksheet()` — для draft/processing

#### 2A. ТТК полуфабриката (active)
**Функция:** `makePrintableHtmlSemifinished()`
- **Строк кода:** ~80
- **Два блока на одной странице:**
  1. "ТТК с фактической проработки"
     - Meta: фактический выход, входной вес, потери, % потерь
     - Таблица: developmentIngredients (фактическая закладка)
  2. "ТТК с перерасчётом на 1 кг выхода"
     - Meta: плановый выход 1000 г
     - Таблица: rows (ингредиенты на 1 кг)

**Стиль:** Копия стиля ТТК блюда (фирменный бланк)

**Результат:** ✅ РАБОТАЕТ, оформление хорошее

#### 2B. Лист проработки (draft/processing)
**Функция:** `makePrintableHtmlWorksheet()`
- **Строк кода:** ~80
- **Структура:**
  - Заголовок: "ChefCloud · лист проработки полуфабриката"
  - Meta: плановый выход, фактический выход
  - Таблица: фактическая закладка ингредиентов (rows)
  - Фирменный бланк

**Результат:** ✅ РАБОТАЕТ

---

### 3. Печать Производства — ProductionPage.jsx ⚠️

**Функция:** `buildProductionPlanHtml(tasks)`
- **Строк кода:** ~140
- **Структура:**
  - Заголовок: "Производственный лист"
  - Дата, смена
  - Список задач (пронумерованные)
  - Каждая задача: название, цех, кол-во, время, приоритет

**Дополнительные функции:**
- `buildTaskHtml(task, idx)` — единая задача
- Поля для заполнения вручную: исходное сырьё, вес, выход, потери, комментарий

**Стиль:**
```css
@page { size: A4 portrait; margin: 12mm; }
body { font-family: Arial, Helvetica, sans-serif; }
.task { border: 1px solid #000; padding: 5mm; margin: 3mm 0; }
.checkbox, .num, .name, .meta { display: inline; }
```

**Результат:** ⚠️ РАБОТАЕТ, но примитивно (не фирменный стиль)

**Проблема:** 
- Стили отличаются от ТТК блюдо/ПФ
- Нет фирменного бланка
- Нет постепенного раскрытия (все поля сразу)

---

## 🔍 АНАЛИЗ ДУБЛИРОВАНИЯ

### Что дублируется:

| Элемент | Где используется | Код |
|---------|---|---|
| **Стили печати A4** | ReferenceTtk, Semifinished, Production | @page, body, margin, page layout |
| **Escapehtml()** | ReferenceTtk, Semifinished, Production | Одна функция, копируется везде |
| **Стиль "фирменный бланк"** | ReferenceTtk, Semifinished | Один и тот же CSS (копия в двух местах) |
| **Таблица ингредиентов** | ReferenceTtk, Semifinished | Разная структура, но похожий HTML |
| **Мета-информация** | ReferenceTtk, Semifinished | Разные поля, но одинаковая разметка |

### Дублирующийся CSS:
```css
// В ReferenceTtk.jsx (строки ~184-213)
@page{size:A4;margin:0}
*{box-sizing:border-box}
body{margin:0;background:#f4efe7;font-family:Inter,Manrope,...}
.page{width:210mm;min-height:297mm;background:#faf8f5;padding:16mm;...}
.page:before{content:"";...radial-gradient...}
...

// В SemifinishedPage.jsx (строки ~338-365)
// ТОТ ЖЕ CSS скопирован полностью!
```

### Дублирующиеся функции:
- `escapeHtml()` есть и в ReferenceTtk, и в SemifinishedPage, и в ProductionPage
- `formatDate()` есть в ReferenceTtk
- `normalizeRow()` есть в ReferenceTtk
- `getTypeBadge()` есть в ReferenceTtk

---

## 📋 ТАБЛИЦА ПЕЧАТИ

| Сущность | Функция | Строк | Фирменный бланк | Дублирование | Отпечатано где |
|----------|---------|-------|---|---|---|
| **Блюдо** | makePrintableHtml | ~150 | ✅ ДА | Base | ReferenceTtk |
| **ПФ (active)** | makePrintableHtmlSemifinished | ~80 | ✅ ДА (copy) | CSS copy | SemifinishedPage |
| **ПФ (draft)** | makePrintableHtmlWorksheet | ~80 | ✅ ДА (copy) | CSS copy | SemifinishedPage |
| **Производство** | buildProductionPlanHtml | ~140 | ❌ НЕТ | Своя CSS | ProductionPage |

---

## 🎯 ВОЗМОЖНОСТИ РЕФАКТОРА (БЕЗ ИЗМЕНЕНИЯ ПОВЕДЕНИЯ)

### Вариант 1: Общий utility для шаблонов печати

```javascript
// src/lib/printTemplates.js
export const PRINT_STYLES_BRANDED = `
  @page { size: A4; margin: 0; }
  * { box-sizing: border-box; }
  body { 
    margin: 0;
    background: #f4efe7;
    font-family: Inter, Manrope, Arial, Helvetica, sans-serif;
    color: #1f2937;
  }
  .page {
    width: 210mm;
    min-height: 297mm;
    margin: 0 auto;
    background: #faf8f5;
    padding: 16mm;
    position: relative;
    overflow: hidden;
  }
  /* ... остальные стили ... */
`

// Использование везде:
const html = `<!doctype html>
<html>
<head>
<style>${PRINT_STYLES_BRANDED}</style>
</head>
<body>...</body>
</html>`
```

**Выигрыш:** -200 строк дублированного CSS, единая верстка

### Вариант 2: Общая функция escapeHtml

```javascript
// src/lib/htmlUtils.js
export function escapeHtml(value = '') {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#39;'
  }
  return String(value ?? '').replace(/[&<>"']/g, ch => map[ch])
}

// Импортировать везде вместо копирования
```

**Выигрыш:** -30 строк дублированного кода

### Вариант 3: Общий компонент для таблицы ингредиентов

```javascript
// src/lib/printComponents.js
export function renderIngredientsTable(ingredients) {
  const rows = (ingredients || [])
    .filter(row => row && row.name && row.name.trim())
    .map(row => `
      <tr>
        <td>${escapeHtml(row.name)}</td>
        <td class="muted">${getTypeLabel(row.type)}</td>
        <td class="qty">${formatQty(row.qty, row.unit)}</td>
      </tr>
    `)
    .join('')
  
  return `<table><thead><tr>...</tr></thead><tbody>${rows}</tbody></table>`
}

// Использование в makePrintableHtmlSemifinished, makePrintableHtml, etc.
```

**Выигрыш:** Единая логика фильтрации пустых строк, одинаковое форматирование

---

## 🔴 ПРОБЛЕМЫ ПЕЧАТИ

1. **Производство печатает без фирменного стиля**
   - Несоответствие оформления
   - Выглядит как черновик

2. **Дублирование CSS и функций**
   - Если изменить стиль в одном месте → нужно менять везде
   - Риск расхождения

3. **Фото в base64 занимает место в localStorage**
   - Может переполнить localStorage (5-10 МБ limit)
   - Нет миграции в Supabase Storage

4. **Отсутствие печати производственного плана по-настоящему**
   - Печать есть, но данные не сохраняются
   - Печатает только то, что в памяти

5. **Нет вариантов печати (форматы)**
   - Всегда А4
   - Нет Station Card, A6, миниатюр

---

## 💡 РЕКОМЕНДАЦИИ ДЛЯ РЕФАКТОРА (v1.1)

### Phase 1: Centralizar CSS & utils (низкий риск)
```
✅ Создать src/lib/printStyles.js с PRINT_STYLES_BRANDED
✅ Создать src/lib/htmlUtils.js с escapeHtml, formatDate, etc.
✅ Обновить все три функции печати использовать эти утилиты
✅ Тесты: печать должна выглядеть РОВНО ТАК ЖЕ
```

### Phase 2: Унифицировать Производство (средний риск)
```
❌ Добавить фирменный стиль в buildProductionPlanHtml
❌ ТОЛЬКО если раздел будет полностью завершён
❌ Иначе: оставить как есть
```

### Phase 3: Избавиться от base64 фото (высокий риск)
```
❌ Требует миграции в Supabase Storage
❌ Требует обновления всех загруженных фото
❌ Рискованно для MVP
```

---

## 📊 ИТОГИ

| Аспект | Состояние | Примечание |
|--------|-----------|-----------|
| **Печать ТТК блюда** | ✅ Отлично | Фирменный стиль, полные данные |
| **Печать ПФ** | ✅ Хорошо | Два варианта (факт + норматив) |
| **Печать производства** | ⚠️ Примитивно | Нет стиля, но работает |
| **Дублирование CSS** | ❌ Проблема | -300 строк возможно вычистить |
| **Дублирование функций** | ❌ Проблема | escapeHtml, formatDate везде |
| **Единообразие** | ⚠️ 66% | ТТК и ПФ выглядят одинаково, Производство — отличается |

**Вывод:** Печать работает, но есть место для оптимизации и унификации кода. Для MVP v1.0 достаточно текущего состояния. Рефактор можно отложить на v1.1.

