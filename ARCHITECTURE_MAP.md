# 🏗️ ChefCloud MVP — КАРТА АРХИТЕКТУРЫ

**Дата:** 21 июня 2026  
**Версия:** MVP v1.0  
**Статус:** Детальный анализ архитектуры для стабилизации  

---

## 📦 СУЩНОСТИ И ИХ ХРАНИЛИЩА

### 1. ТОВАРЫ (Products)

#### Где хранится
- **localStorage:** `klevo_products`
- **Supabase:** Не синхронизируется (только localStorage)

#### Хук
- **Файл:** `src/hooks/useProducts.js`
- **Функции:**
  - `useProductsStore()` → `{ items, saveItem, deleteItem, importItems }`
  - `createEmptyProduct()` → новый товар
  - `normalizeProduct(item)` → нормализация

#### Компоненты (где используется)
- `ProductsPage.jsx` — основной редактор
- `ReferenceTtk.jsx` — выбор ингредиентов (datalist)
- `SemifinishedPage.jsx` — выбор ингредиентов (datalist)

#### Кто на неё ссылается
- **Блюда:** ингредиенты могут быть товарами
- **Полуфабрикаты:** ингредиенты могут быть товарами
- **Комбинированная номенклатура:** `makeCombinedNomenclature()` включает товары

#### Зависимости (что может сломаться)
- ⚠️ **Удаление товара:** Не проверяет использование в блюдах/ПФ
- ✅ Нет статусов (товары просто создают → используют → удаляют)
- ❌ **Нет целостности:** Если удалить товар, ссылки в ингредиентах останутся

#### Структура данных
```javascript
{
  id: "prod_...",
  name: "Томаты",
  category: "Овощи",
  unit: "г",
  type: "product",
  createdAt: ISO,
  updatedAt: ISO
}
```

---

### 2. ПОЛУФАБРИКАТЫ (Semifinished)

#### Где хранится
- **localStorage:** `klevo_semifinished`
- **Supabase:** Не синхронизируется

#### Хук
- **Файл:** `src/hooks/useSemifinished.js`
- **Функции:**
  - `useSemifinishedStore()` → `{ items, saveItem, deleteItem, importItems }`
  - `createEmptySemifinished()` → новый ПФ
  - `normalizeSemifinished(item)` → нормализация

#### Компоненты
- `SemifinishedPage.jsx` — основной редактор
- `ReferenceTtk.jsx` — выбор ингредиентов (datalist)

#### Кто на неё ссылается
- **Блюда:** ингредиенты могут быть ПФ
- **Полуфабрикаты:** рекурсивно, ингредиент может быть другим ПФ
- **Комбинированная номенклатура:** включает ПФ

#### Зависимости
- ⚠️ **Удаление ПФ:** Не проверяет использование в блюдах/других ПФ
- ✅ **Статусы:** draft → active → archived
- ✅ **Флаг:** isRecalculatedFor1kg (промежуточное состояние)
- ❌ **Целостность:** Если удалить ПФ, ссылки в ингредиентах останутся

#### Структура данных
```javascript
{
  id: "pf_...",
  name: "Соус томатный",
  unit: "г",
  category: "",
  categoryPath: "",
  plannedOutput: "1000",
  actualOutput: "",
  composition: "",
  rows: [], // ингредиенты (норматив на 1 кг)
  developmentIngredients: [], // фактическая закладка
  cookingMethod: "",
  description: "",
  status: "draft", // draft, processing, active, archived
  photo: null,
  files: [],
  inputWeight: "",
  lossWeight: "",
  lossPercent: "",
  isRecalculatedFor1kg: false,
  createdAt: ISO,
  updatedAt: ISO
}
```

---

### 3. ЭТАЛОННЫЕ ТТК (ReferenceTtk / Dishes)

#### Где хранится
- **localStorage:** `academy_printable_reference_ttk_v1`
- **Supabase:** `reference_ttk` + `reference-ttk-photos` storage bucket

#### Хук
- **Файл:** `src/hooks/useReferenceTtk.js`
- **Функции:**
  - `useReferenceTtkStore()` → `{ items, saveTtk, deleteTtk, archiveTtk, ... }`
  - `normalizeTtk(ttk)` → нормализация
  - `migrateLegacyToSupabaseIfNeeded()` → миграция

#### Компоненты
- `ReferenceTtk.jsx` — основной редактор (700+ строк!)
- `Dishes.jsx` — обёртка/wrapper
- `DishCard` — карточка блюда

#### Кто на неё ссылается
- **PrintPage:** списки блюд
- **Dashboard:** счётчики, статистика
- **MenuArchitectPage:** AI Menu Engineering
- **Production:** может использовать как план

#### Зависимости
- ✅ **Статусы:** draft, active, archived
- ✅ **Коллекции:** блюда могут быть в коллекциях
- ⚠️ **Ингредиенты:** ссылаются на товары/ПФ, но нет проверки целостности

#### Структура данных
```javascript
{
  id: "ttk_...",
  title: "Суп томатный",
  category: "Первые блюда",
  output: "250",
  time: "15 мин",
  status: "draft", // draft, active, archived
  
  rows: [ // ингредиенты
    { name: "Томаты", type: "product", qty: 150, unit: "г", comment: "" },
    { name: "Сливки", type: "semifinished", qty: 50, unit: "мл" }
  ],
  
  photo: { dataUrl: "data:image/..." }, // base64 в localStorage
  dishDescription: "...",
  technology: "...",
  serving: "...",
  qualityPoints: "...",
  chefComment: "...",
  
  createdAt: ISO,
  updatedAt: ISO
}
```

---

### 4. ПРОИЗВОДСТВО (Production Tasks)

#### Где хранится
- **localStorage:** `chefcloud_production_tasks`
- **Supabase:** Нет синхронизации

#### Хук
- **Файл:** `src/pages/ProductionPage.jsx` (локально)
- **Функции:**
  - `readTasks()` / `writeTasks()` (простые функции, не хук!)

#### Компоненты
- `ProductionPage.jsx` — (почти не реализовано)

#### Кто на неё ссылается
- Практически никто

#### Зависимости
- ❌ **Нет CRUD:** SEED_TASKS пуст, нет UI для добавления/редактирования
- ❌ **Нет связи с ТТК:** Не импортирует блюда как задачи
- ❌ **Нет статусов:** Нет completed/pending
- ❌ **Данные не сохраняются:** Нет интеграции с основной системой

#### Структура данных
```javascript
{
  id: "t_...",
  name: "Суп томатный",
  station: "Горячий цех",
  qty: "100",
  time: "15 мин",
  priority: "medium", // high, medium, low
  // Всё остальное — пустые поля для заполнения вручную
}
```

---

### 5. КОЛЛЕКЦИИ (Collections)

#### Где хранится
- **localStorage:** `chefcloud_collections_v1`
- **Supabase:** Нет синхронизации

#### Хук
- **Файл:** `src/hooks/useCollections.js`
- **Функции:**
  - `useCollectionsStore()` → полный CRUD коллекций

#### Компоненты
- `ReferenceTtk.jsx` → `CollectionsSidebar` + модали

#### Кто на неё ссылается
- **Блюда:** коллекции содержат массив dishIds

#### Зависимости
- ✅ **Системные коллекции:** Favorites, Cookbook создаются автоматически
- ⚠️ **Вложенные коллекции:** Не поддерживаются (flat structure)
- ❌ **Оглаживание:** Если удалить блюдо, dishId остаётся в коллекции

#### Структура данных
```javascript
{
  id: "__favorites__" | "col_...",
  name: "Мои рецепты",
  description: "...",
  color: "#16332b",
  icon: "folder",
  system: false, // true для встроенных
  dishIds: ["ttk_1", "ttk_2"],
  createdAt: ISO
}
```

---

### 6. КАТЕГОРИИ ТТК

#### Где хранится
- **localStorage:** `klevo_ttk_categories_v1`
- **Supabase:** Нет синхронизации

#### Хук
- **Файл:** `src/hooks/useTtkCategories.js`

#### Компоненты
- `ReferenceTtk.jsx` → dropdown категорий

#### Структура
- Плоский список категорий (без иерархии)

#### Проблема
- Hardcoded список, сложно расширять

---

### 7. НОМЕНКЛАТУРА (Nomenclature)

#### Где хранится
- **localStorage:** `klevo_nomenclature`
- **Supabase:** Нет синхронизации

#### Хук
- **Файл:** `src/hooks/useNomenclature.js`

#### Компоненты
- `Nomenclature.jsx` — страница

#### Назначение
- Единый справочник товаров + ПФ
- Создание вручную

#### Зависимости
- Комбинирует товары и ПФ из других хранилищ
- `makeCombinedNomenclature()` собирает на лету

---

## 🔗 КАРТА ЗАВИСИМОСТЕЙ

```
┌─────────────────────────────────────────┐
│        ReferenceTtk (Блюда/ТТК)        │
│  - Ингредиенты → Товары/ПФ             │
│  - Коллекции → Collections              │
│  - Фото → base64 в localStorage         │
└────────────────────┬────────────────────┘
                     │
          ┌──────────┼──────────┐
          │          │          │
          ▼          ▼          ▼
    ┌─────────┐  ┌────────┐  ┌──────────────┐
    │ Товары  │  │  П/Ф   │  │ Коллекции    │
    └────┬────┘  └───┬────┘  └──────────────┘
         │           │
         └─────┬─────┘
               │
        ┌──────▼──────────┐
        │  Номенклатура   │
        │  (Combined)     │
        └─────────────────┘

❌ ПРОБЛЕМА: Нет проверки целостности при удалении!
   - Удаль товар → ссылки в блюдах/ПФ остаются (мёртвые)
   - Удаль ПФ → ссылки в блюдах остаются (мёртвые)
```

---

## 📊 МАТРИЦА ИСПОЛЬЗОВАНИЯ

| Сущность | Где создаётся | Где используется | Удаление безопасно? |
|----------|---|---|---|
| **Товар** | ProductsPage | Блюда, ПФ, Номенклатура | ❌ НЕТ |
| **ПФ** | SemifinishedPage | Блюда, ПФ, Номенклатура | ❌ НЕТ |
| **Блюдо** | ReferenceTtk | Коллекции, Производство, печать | ⚠️ Частично |
| **Коллекция** | ReferenceTtk | Блюда (dishIds) | ✅ ДА |
| **Задача производства** | ProductionPage | Печать | ❌ Не работает |

---

## 🔑 ВСЕ localStorage КЛЮЧИ

| Ключ | Где используется | Версия | Миграция |
|------|---|---|---|
| `academy_printable_reference_ttk_v1` | ReferenceTtk | v1 | Есть legacy migration |
| `klevo_products` | Products | v1 | — |
| `klevo_semifinished` | Semifinished | v1 | — |
| `klevo_nomenclature` | Nomenclature | v1 | — |
| `klevo_ttk_categories_v1` | ReferenceTtk | v1 | — |
| `chefcloud_collections_v1` | Collections | v1 | — |
| `chefcloud_production_tasks` | Production | v1 | — |
| `ttk_network_workflow_v1` | Workflow (сложная) | v1 | — |
| `chefcloud_trial_start` | Trial (внутренние) | v1 | — |
| `chefcloud_trial_plan` | Trial (внутренние) | v1 | — |

**ВАЖНО:** Ни один из этих ключей нельзя менять без миграции данных!

---

## ⚠️ ТОЧКИ РИСКА И ПРОБЛЕМЫ

### КРИТИЧНЫЕ
1. **Отсутствие проверки целостности при удалении**
   - Товар используется в 10 блюдах → можно удалить → мёртвые ссылки
   - ПФ используется в 5 блюдах → можно удалить → мёртвые ссылки

2. **Recursive зависимости в ПФ**
   - ПФ1 может содержать ПФ2
   - ПФ2 может содержать ПФ1 → циклическая зависимость?
   - Нет проверки на циклы

3. **Photo хранится как base64 в localStorage**
   - localStorage имеет лимит 5-10 МБ
   - Можно случайно переполнить

### ВЫСОКИЕ
4. **Производство не работает (SEED_TASKS = [])**
   - Раздел не интегрирован с основной системой
   - Нет импорта блюд как задач

5. **Коллекции остаются "сиротами"**
   - Если удалить блюдо, его id остаётся в коллекции
   - Коллекция содержит несуществующее блюдо

6. **Отсутствие вложенных категорий**
   - Товары/ПФ имеют `categoryPath`, но это просто строка
   - Нет UI для создания иерархии

### СРЕДНИЕ
7. **Нет версионирования данных**
   - Не видна история изменений
   - Нельзя откатить случайные изменения

8. **Дублирующаяся логика**
   - Функции печати повторяются в разных файлах
   - Нормализация функций разная для ТТК и ПФ

9. **Photo загружается как base64**
   - Нет механизма загрузки в Supabase Storage
   - Данные не мигрируют автоматически

---

## 🔄 FLOW: СОХРАНЕНИЕ → ЗАГРУЗКА

```
USER ACTION (Создать/Изменить/Удалить)
    ↓
onSave(item)
    ↓
hook.saveItem(item)
    ↓
Normalize → Validate → Add timestamp
    ↓
localStorage.setItem(key, JSON.stringify(array))
    ↓
[Если Supabase настроен]
    ├─→ fetchRemoteItems() (background)
    └─→ Reconcile с remote
    
RELOAD PAGE
    ↓
hook.useEffect(() => setItems(readFromStorage()))
    ↓
JSON.parse(localStorage.getItem(key))
    ↓
Normalize each item
    ↓
Render

⚠️ PROBLEM: Если JSON невалидный или ключ неправильный → данные потеряны!
```

---

## 📋 SUMMARY АРХИТЕКТУРЫ

| Аспект | Состояние | Примечание |
|--------|-----------|-----------|
| **Хранилище** | localStorage-first ✅ | Supabase опциональный |
| **Структура** | Flat arrays по типам ✅ | Нет transactions |
| **Целостность** | ❌ Не проверяется | Главная проблема MVP |
| **Миграция** | ✅ Есть для ТТК | Другие сущности — нет |
| **Версионирование** | ❌ Отсутствует | Нет rollback |
| **Валидация** | ⚠️ Minimal | Только normalize |
| **Транзакции** | ❌ Отсутствуют | Все операции sync |

---

## 🎯 ВЫВОДЫ ДЛЯ MVP СТАБИЛИЗАЦИИ

**ДОЛЖНЫ БЫТЬ ИСПРАВЛЕНЫ ПЕРЕД РЕЛИЗОМ:**
1. ✅ Проверка целостности при удалении (блокировка + сообщение)
2. ✅ Защита от циклических зависимостей в ПФ
3. ✅ Очистка orphan данных в коллекциях
4. ✅ Создание товара/ПФ изнутри формы (inline creation)
5. ✅ Единая логика печати (refactor, но БЕЗ изменения поведения)

**МОГУТ ПОДОЖДАТЬ v1.1:**
- Версионирование данных
- Историй изменений
- Миграция фото в Supabase Storage
- Вложенные категории
- Полная интеграция Производства

