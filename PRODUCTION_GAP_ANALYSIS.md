# 🏭 ЭТАП 3: АНАЛИЗ ПРОИЗВОДСТВА (Gap Analysis)

**Дата:** 21 июня 2026  
**Статус:** Полный анализ текущего состояния  
**Вывод:** Раздел НЕ ГОТОВ к использованию в MVP  

---

## 📋 ЧТО РЕАЛЬНО РАБОТАЕТ

### 1. Печать производственного плана ✅
- `buildProductionPlanHtml()` генерирует HTML
- Форматирует заголовок, дату, список задач
- `window.print()` открывает диалог печати
- Стили для печати (A4, margins)

**Код:**
```javascript
function buildProductionPlanHtml(tasks) {
  const printDate = new Date().toLocaleDateString('ru-RU')
  const total = tasks.length
  const tasksHtml = total === 0
    ? `<div class="empty">На текущую смену производственных задач нет.</div>`
    : tasks.map((task, idx) => buildTaskHtml(task, idx)).join('')
  
  return `<!doctype html>...<body><div class="page">...</div></body></html>`
}
```

**Ограничения:**
- ⚠️ Печатает только то, что в памяти
- ⚠️ Нет сохранения плана перед печатью
- ⚠️ После перезагрузки все задачи теряются

### 2. Интерфейс для ввода задач ✅
- UI с полями: название, станция, кол-во, время, приоритет
- Dropdown со станциями (STATIONS = ['Горячий цех', ...])
- Таблица задач
- Кнопки: Добавить, Удалить, Очистить

**Ограничения:**
- ⚠️ UI есть, но данные НЕ сохраняются
- ⚠️ Нет хука, нет интеграции с основной системой

### 3. Форматирование листа ✅
- HTML шаблон А4
- Пронумерованные задачи
- Места для заполнения вручную:
  - Исходное сырьё / ТТК
  - Исходный вес
  - Получено после проработки (4 позиции)
  - Итоговый выход
  - Потери / отход
  - Комментарий

---

## ❌ ЧТО НЕ РАБОТАЕТ

### 1. Сохранение данных в localStorage ❌
- Функции `readTasks()` и `writeTasks()` существуют
- **НО** они никогда не вызываются из UI!

**Код:**
```javascript
function readTasks() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    return raw ? JSON.parse(raw) : null
  } catch { return null }
}

function writeTasks(tasks) {
  try { localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks)) } catch {}
}

// ⚠️ НИКОГДА НЕ ВЫЗЫВАЕТСЯ!
// Нет: writeTasks(form.tasks) после добавления/редактирования/удаления
```

**Последствие:**
- Пользователь вводит данные в UI
- F5 → все данные теряются
- SEED_TASKS = [] → всегда пусто

### 2. Нет хука ProductionStore ❌
- Есть `useProducts()`, `useSemifinished()`, `useReferenceTtk()`
- **НО нет `useProduction()` или аналога!**
- Нет интеграции в App.jsx
- Нет props `onSave`, `onDelete`

**Как это выглядит в коде:**
```javascript
// ProductionPage.jsx
// ❌ Нет этого:
export function ProductionPage({ tasks, onSave, onDelete }) {
  // ...
}

// ❌ Нет этого в App.jsx:
// const production = useProduction()
// <ProductionPage tasks={production.items} onSave={...} />

// 😞 Вместо этого: чистый компонент без состояния
```

### 3. Нет интеграции с ТТК/ПФ ❌
- Нельзя импортировать блюда как задачи
- Нельзя импортировать рецепты как задачи
- Нельзя создать план на основе меню

**Что было бы:**
```javascript
// ✅ Было бы хорошо:
function importDishesAsTask() {
  const dishes = [...items] // из ReferenceTtk
  const tasks = dishes.map(dish => ({
    id: makeId(),
    name: dish.title,
    qty: "1", // или custom
    station: "Горячий цех", // default
    priority: "medium"
  }))
  // writeTasks(tasks)
}

// ❌ Этого нет в коде!
```

### 4. Нет статусов выполнения ❌
- Структура задачи не включает `status` (pending, completed, etc.)
- Нельзя отметить задачу как выполненную
- Нельзя отслеживать прогресс производства

**Структура сейчас:**
```javascript
{
  id: "t_...",
  name: "Суп томатный",
  station: "Горячий цех",
  qty: "100",
  time: "15 мин",
  priority: "medium"
  // ❌ Нет: status, completedAt, actualTime, notes
}
```

### 5. Нет связи между сменами ❌
- Нет концепции "смены" (завтрак, обед, ужин)
- Нельзя сказать "это задача на обед"
- Нельзя планировать несколько смен

### 6. Нет истории и архива ❌
- Завершённые задачи удаляются (нет архива)
- Нет истории производства
- Нельзя посмотреть, что было произведено вчера

---

## 📦 ОТСУТСТВУЮЩИЕ ФУНКЦИИ (Для полной интеграции)

### Необходимо реализовать:

#### 1. **ProductionStore Hook**
```javascript
// src/hooks/useProduction.js
export function useProductionStore() {
  const [tasks, setTasks] = useState([])
  
  const saveTask = (task) => {
    // Сохранить в localStorage
    // Сохранить в Supabase (если настроен)
  }
  
  const deleteTask = (id) => { /* ... */ }
  
  const importFromDishes = (dishes) => {
    // Импортировать блюда как задачи
  }
  
  return { tasks, saveTask, deleteTask, ... }
}
```

#### 2. **ProductionPage Props**
```javascript
// Должно быть:
export function ProductionPage({ 
  tasks,           // production tasks
  items,           // dishes
  semifinished,    // for import
  onSave,
  onDelete,
  onImport
}) { /* ... */ }

// В App.jsx:
<ProductionPage 
  tasks={production.items}
  items={items}
  semifinished={semifinished}
  onSave={production.saveTask}
  onDelete={production.deleteTask}
/>
```

#### 3. **Импорт блюд**
```javascript
// Кнопка в ProductionPage:
<button onClick={() => showImportModal()}>
  Импортировать из меню
</button>

// Modal с выбором блюд и станций
// Кнопка: Добавить как задачи
```

#### 4. **Статусы задач**
```javascript
const TASK_STATUSES = {
  pending: 'Ожидание',
  in_progress: 'В процессе',
  completed: 'Завершено',
  cancelled: 'Отменено'
}

// Структура задачи должна быть расширена:
{
  ...
  status: 'pending', // default
  completedAt: null,
  actualTime: null,
  notes: ""
}
```

#### 5. **Смены (Shifts)**
```javascript
const SHIFTS = {
  breakfast: { name: 'Завтрак', start: '06:00', end: '11:00' },
  lunch: { name: 'Обед', start: '11:00', end: '16:00' },
  dinner: { name: 'Ужин', start: '17:00', end: '22:00' }
}

// Задача должна включать shift:
{
  ...
  shift: 'lunch',
  shift_date: ISO
}
```

#### 6. **История задач**
```javascript
// Архив завершённых задач
// Фильтр по дате
// Отчёт: сколько блюд произведено за день/неделю
```

---

## 📊 ТАБЛИЦА: ТЕКУЩЕЕ VS ТРЕБУЕМОЕ

| Функция | Текущее | Требуемое | Статус |
|---------|---------|-----------|--------|
| Сохранение задач в localStorage | ❌ Код есть, не вызывается | ✅ Интегрировано в UI | ❌ ОТСУТСТВУЕТ |
| Импорт ТТК/ПФ | ❌ Нет | ✅ Кнопка + Modal | ❌ ОТСУТСТВУЕТ |
| Статусы задач | ❌ Нет | ✅ pending/completed/cancelled | ❌ ОТСУТСТВУЕТ |
| Смены (shifts) | ❌ Нет | ✅ breakfast/lunch/dinner | ❌ ОТСУТСТВУЕТ |
| История/Архив | ❌ Нет | ✅ Просмотр завершённых | ❌ ОТСУТСТВУЕТ |
| Связь с ТТК | ❌ Нет | ✅ Импорт по названию | ❌ ОТСУТСТВУЕТ |
| Печать плана | ✅ Работает | ✅ Работает | ✅ OK |
| UI для ввода | ✅ Есть | ✅ Есть | ✅ OK |

---

## 🔴 КРИТИЧНЫЕ ПРОБЛЕМЫ

| # | Проблема | Почему критично | Как исправить |
|---|----------|---|---|
| 1 | Данные не сохраняются | F5 → потеря всех данных | Вызвать `writeTasks()` в каждом handler |
| 2 | Нет хука ProductionStore | Не интегрировано в систему | Создать `useProduction.js` по аналогии с Products |
| 3 | Нет импорта ТТК | Пользователь вводит вручную | Добавить importFromDishes() |
| 4 | Нет статусов | Нельзя отследить выполнение | Расширить структуру Task |
| 5 | Нет связи со сменами | Нельзя планировать смены | Добавить поле shift в Task |

---

## 💾 WHAT NEEDS STORAGE

**localStorage key:** `chefcloud_production_tasks`

**Структура для полной функциональности:**
```javascript
{
  tasks: [
    {
      id: "t_...",
      date: "2026-06-21",
      shift: "lunch", // breakfast, lunch, dinner
      
      name: "Суп томатный",
      dishId: "ttk_123", // optional: link to ReferenceTtk
      
      station: "Горячий цех",
      qty: "100",
      unit: "порций",
      plannedTime: "15",
      
      status: "pending", // pending, in_progress, completed, cancelled
      priority: "medium",
      
      completedAt: null,
      actualTime: null,
      
      notes: "",
      createdAt: ISO,
      updatedAt: ISO
    }
  ],
  
  shifts: [ /* optional: custom shifts */ ],
  
  metadata: {
    lastSyncedAt: ISO,
    totalTasksToday: 25,
    completedToday: 12
  }
}
```

---

## 🎯 ВЫВОД

**Производство — это PLACEHOLDER, не полноценный раздел MVP.**

### Что есть:
✅ UI и интерфейс ввода  
✅ Печать производственного плана  

### Чего не хватает:
❌ Сохранение данных в localStorage  
❌ Интеграция в основную систему (нет хука)  
❌ Импорт ТТК/ПФ  
❌ Статусы выполнения  
❌ История/Архив  
❌ Отслеживание смен  

### Рекомендация:
**Для MVP v1.0:**
- Либо убрать раздел из меню (hide из NAV_ITEMS)
- Либо сделать quick fix: добавить `useProduction()` hook + сохранение

**Для MVP v1.1:**
- Полная реализация всех функций выше

### Текущий статус:
- 🔴 **НЕ ГОТОВО к использованию**
- 🟠 **Требует срочной интеграции или удаления**
- 🟢 **Только печать работает (но без данных)**

