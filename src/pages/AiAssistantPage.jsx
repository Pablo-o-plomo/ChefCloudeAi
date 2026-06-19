import { useEffect, useRef, useState } from 'react'

// ─── Быстрые подсказки ──────────────────────────────────────────────────────
const QUICK_PROMPTS = [
  { icon: '🍱', text: 'Создай блюдо с food cost до 28%' },
  { icon: '🍣', text: 'Создай ролл себестоимостью до 280 ₽' },
  { icon: '📝', text: 'Напиши описание блюда' },
  { icon: '👨‍🍳', text: 'Создай технологию приготовления' },
  { icon: '📋', text: 'Создай производственную карту' },
  { icon: '🔍', text: 'Проверь рецепт на ошибки' },
  { icon: '💡', text: 'Предложи улучшения блюда' },
  { icon: '📉', text: 'Найди блюда с низкой маржой' },
  { icon: '🌿', text: 'Создай сезонное меню' },
  { icon: '⚡', text: 'Оптимизируй время сборки' },
]

// ─── Стили ──────────────────────────────────────────────────────────────────
const COLORS = {
  dark:    '#16332b',
  darkHov: '#1f4438',
  border:  '#ece8df',
  bg:      '#f8f6f2',
  bgCard:  '#fff',
  text:    '#1f2937',
  muted:   '#6b7280',
  gold:    '#b99150',
}

// Анимация набора текста — три точки
function TypingDots() {
  return (
    <div style={{ display: 'flex', gap: 4, padding: '4px 2px', alignItems: 'center' }}>
      {[0, 1, 2].map(i => (
        <div
          key={i}
          style={{
            width: 7, height: 7, borderRadius: '50%',
            background: COLORS.muted,
            animation: `chefDot 1.2s ease-in-out ${i * 0.2}s infinite`,
          }}
        />
      ))}
      <style>{`
        @keyframes chefDot {
          0%, 80%, 100% { opacity: .2; transform: scale(.8); }
          40%            { opacity: 1;  transform: scale(1.1); }
        }
      `}</style>
    </div>
  )
}

// Пузырь сообщения
function Bubble({ msg }) {
  const isUser = msg.role === 'user'
  return (
    <div style={{
      display: 'flex',
      flexDirection: isUser ? 'row-reverse' : 'row',
      gap: 10,
      alignItems: 'flex-end',
      maxWidth: '88%',
      alignSelf: isUser ? 'flex-end' : 'flex-start',
    }}>
      {!isUser && (
        <div style={{
          width: 34, height: 34, borderRadius: 12,
          background: COLORS.dark,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: 16, flexShrink: 0,
        }}>🤖</div>
      )}
      <div style={{
        padding: isUser ? '11px 16px' : '12px 16px',
        borderRadius: isUser ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
        background: isUser ? COLORS.dark : COLORS.bgCard,
        color: isUser ? '#fff' : COLORS.text,
        fontSize: 14,
        lineHeight: 1.6,
        border: isUser ? 'none' : `1px solid ${COLORS.border}`,
        boxShadow: isUser ? 'none' : '0 2px 8px rgba(15,23,42,.06)',
        whiteSpace: 'pre-wrap',
        wordBreak: 'break-word',
      }}>
        {msg.typing ? <TypingDots /> : msg.text}
      </div>
    </div>
  )
}

// Карточка нового чата в боковой панели
function ChatItem({ chat, active, onClick }) {
  return (
    <button onClick={onClick} style={{
      width: '100%', textAlign: 'left', padding: '10px 14px',
      borderRadius: 10, border: 'none', cursor: 'pointer',
      background: active ? 'rgba(185,145,80,.18)' : 'transparent',
      color: active ? '#fff' : 'rgba(255,255,255,.7)',
      fontSize: 12.5, fontWeight: active ? 700 : 500,
      lineHeight: 1.4, transition: '.15s',
    }}>
      <div style={{ fontSize: 11, color: 'rgba(255,255,255,.4)', marginBottom: 3 }}>
        {new Date(chat.createdAt).toLocaleString('ru-RU', { day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit' })}
      </div>
      <div style={{
        overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
      }}>
        {chat.title || 'Новый чат'}
      </div>
    </button>
  )
}

// ─── Главный компонент ───────────────────────────────────────────────────────
export default function AiAssistantPage() {
  const [chats, setChats]           = useState([])          // история чатов
  const [activeChatId, setActiveChatId] = useState(null)
  const [input, setInput]           = useState('')
  const [isTyping, setIsTyping]     = useState(false)       // анимация ответа
  const messagesEndRef              = useRef(null)
  const inputRef                    = useRef(null)
  const textareaRef                 = useRef(null)

  // Текущий чат
  const activeChat = chats.find(c => c.id === activeChatId) ?? null
  const messages   = activeChat?.messages ?? []

  // Прокрутка вниз при новом сообщении
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, isTyping])

  // Авторесайз textarea
  function handleTextareaInput(e) {
    setInput(e.target.value)
    const el = e.target
    el.style.height = 'auto'
    el.style.height = Math.min(el.scrollHeight, 160) + 'px'
  }

  function createNewChat() {
    setActiveChatId(null)
    setInput('')
    setTimeout(() => textareaRef.current?.focus(), 50)
  }

  function send(text) {
    const value = (text ?? input).trim()
    if (!value || isTyping) return

    const userMsg = { id: Date.now(), role: 'user', text: value }

    // Новый чат или продолжение существующего
    let targetId = activeChatId

    if (!targetId) {
      const newChat = {
        id: `chat_${Date.now()}`,
        title: value.slice(0, 60),
        createdAt: new Date().toISOString(),
        messages: [],
      }
      setChats(prev => [newChat, ...prev])
      targetId = newChat.id
      setActiveChatId(newChat.id)
    }

    // Добавляем сообщение пользователя
    setChats(prev => prev.map(c =>
      c.id === targetId
        ? { ...c, messages: [...c.messages, userMsg] }
        : c
    ))
    setInput('')
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    // Показываем анимацию набора
    setIsTyping(true)

    // Имитируем задержку ответа (1.5–2.5 сек — реалистично)
    const delay = 1500 + Math.random() * 1000
    setTimeout(() => {
      const aiMsg = {
        id: Date.now() + 1,
        role: 'assistant',
        text: getStubResponse(value),
      }
      setChats(prev => prev.map(c =>
        c.id === targetId
          ? { ...c, messages: [...c.messages, aiMsg] }
          : c
      ))
      setIsTyping(false)
    }, delay)
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      send()
    }
  }

  const isEmpty = messages.length === 0 && !activeChatId

  return (
    <div style={{
      display: 'flex', height: 'calc(100vh - 65px)',
      background: COLORS.bg, overflow: 'hidden',
    }}>

      {/* ── Левая панель: история чатов ── */}
      <aside style={{
        width: 240, flexShrink: 0,
        background: '#0f2219',
        display: 'flex', flexDirection: 'column',
        borderRight: '1px solid rgba(255,255,255,.06)',
      }}>
        <div style={{ padding: '16px 12px 10px' }}>
          <button
            onClick={createNewChat}
            style={{
              width: '100%', padding: '10px 14px',
              borderRadius: 12, border: '1px solid rgba(255,255,255,.12)',
              background: 'rgba(255,255,255,.06)', color: '#fff',
              fontSize: 13, fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: 8,
              transition: '.15s',
            }}
          >
            <span style={{ fontSize: 16 }}>✏️</span> Новый чат
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '4px 8px' }}>
          {chats.length === 0 ? (
            <div style={{ color: 'rgba(255,255,255,.3)', fontSize: 12, padding: '12px 8px', textAlign: 'center', lineHeight: 1.6 }}>
              История чатов появится здесь
            </div>
          ) : (
            chats.map(chat => (
              <ChatItem
                key={chat.id}
                chat={chat}
                active={chat.id === activeChatId}
                onClick={() => setActiveChatId(chat.id)}
              />
            ))
          )}
        </div>

        <div style={{ padding: '12px 14px', borderTop: '1px solid rgba(255,255,255,.06)', color: 'rgba(255,255,255,.35)', fontSize: 11, lineHeight: 1.5 }}>
          🤖 ChefCloud AI<br />
          <span style={{ color: 'rgba(255,255,255,.2)' }}>Подключение нейросети — следующий этап</span>
        </div>
      </aside>

      {/* ── Правая область: чат ── */}
      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', minWidth: 0 }}>

        {/* Приветственный экран (пустой чат) */}
        {isEmpty ? (
          <div style={{
            flex: 1, display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center',
            padding: 32, gap: 32,
          }}>
            <div style={{ textAlign: 'center' }}>
              <div style={{
                width: 72, height: 72, borderRadius: 22,
                background: COLORS.dark,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 36, margin: '0 auto 16px',
                boxShadow: '0 12px 36px rgba(22,51,43,.25)',
              }}>🤖</div>
              <h1 style={{ margin: '0 0 8px', fontSize: 26, color: COLORS.dark, letterSpacing: '-.02em', fontWeight: 900 }}>
                Что нужно сделать?
              </h1>
              <p style={{ margin: 0, color: COLORS.muted, fontSize: 14, maxWidth: 420, lineHeight: 1.6 }}>
                AI-помощник бренд-шефа. Создаёт рецептуры, технологии, описания блюд и производственные карты.
              </p>
            </div>

            {/* Быстрые подсказки */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(2, 1fr)',
              gap: 10, width: '100%', maxWidth: 600,
            }}>
              {QUICK_PROMPTS.slice(0, 8).map(p => (
                <button
                  key={p.text}
                  onClick={() => send(p.text)}
                  style={{
                    textAlign: 'left', padding: '12px 16px',
                    borderRadius: 14,
                    border: `1px solid ${COLORS.border}`,
                    background: COLORS.bgCard,
                    cursor: 'pointer', fontSize: 13, color: COLORS.text,
                    display: 'flex', alignItems: 'center', gap: 10,
                    transition: '.15s',
                    boxShadow: '0 2px 8px rgba(15,23,42,.04)',
                  }}
                >
                  <span style={{ fontSize: 20 }}>{p.icon}</span>
                  <span style={{ lineHeight: 1.3 }}>{p.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (

          /* Область сообщений */
          <div style={{
            flex: 1, overflowY: 'auto',
            padding: '24px 0',
            display: 'flex', flexDirection: 'column',
          }}>
            <div style={{
              maxWidth: 720, width: '100%', margin: '0 auto',
              padding: '0 20px',
              display: 'flex', flexDirection: 'column', gap: 16,
            }}>
              {messages.map(msg => <Bubble key={msg.id} msg={msg} />)}
              {isTyping && (
                <div style={{
                  display: 'flex', gap: 10, alignItems: 'flex-end',
                  alignSelf: 'flex-start',
                }}>
                  <div style={{
                    width: 34, height: 34, borderRadius: 12,
                    background: COLORS.dark,
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 16, flexShrink: 0,
                  }}>🤖</div>
                  <div style={{
                    padding: '12px 16px', borderRadius: '18px 18px 18px 4px',
                    background: COLORS.bgCard, border: `1px solid ${COLORS.border}`,
                    boxShadow: '0 2px 8px rgba(15,23,42,.06)',
                  }}>
                    <TypingDots />
                  </div>
                </div>
              )}
              <div ref={messagesEndRef} />
            </div>
          </div>
        )}

        {/* ── Поле ввода ── */}
        <div style={{
          borderTop: `1px solid ${COLORS.border}`,
          background: COLORS.bgCard,
          padding: '16px 20px',
        }}>
          <div style={{ maxWidth: 720, margin: '0 auto' }}>
            <div style={{
              display: 'flex', gap: 10, alignItems: 'flex-end',
              background: COLORS.bg,
              border: `1.5px solid ${COLORS.border}`,
              borderRadius: 18, padding: '10px 14px',
              transition: '.2s',
            }}>
              <textarea
                ref={textareaRef}
                value={input}
                onChange={handleTextareaInput}
                onKeyDown={handleKeyDown}
                placeholder="Спросите что-нибудь... (Enter — отправить, Shift+Enter — новая строка)"
                rows={1}
                style={{
                  flex: 1, border: 'none', background: 'transparent',
                  fontSize: 14, lineHeight: 1.6, outline: 'none',
                  resize: 'none', fontFamily: 'inherit',
                  color: COLORS.text, maxHeight: 160, overflowY: 'auto',
                }}
              />
              <button
                onClick={() => send()}
                disabled={!input.trim() || isTyping}
                style={{
                  width: 38, height: 38, borderRadius: 12, border: 'none',
                  background: input.trim() && !isTyping ? COLORS.dark : '#e5e1d8',
                  color: '#fff', cursor: input.trim() && !isTyping ? 'pointer' : 'default',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 18, flexShrink: 0, transition: '.2s',
                }}
              >
                ↑
              </button>
            </div>

            {/* Подсказки под полем ввода */}
            {isEmpty && (
              <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
                {QUICK_PROMPTS.slice(8).map(p => (
                  <button
                    key={p.text}
                    onClick={() => send(p.text)}
                    style={{
                      padding: '5px 12px', borderRadius: 999,
                      border: `1.5px solid ${COLORS.border}`,
                      background: '#fff', color: COLORS.muted,
                      fontSize: 12, cursor: 'pointer',
                    }}
                  >
                    {p.icon} {p.text}
                  </button>
                ))}
              </div>
            )}

            <div style={{ textAlign: 'center', marginTop: 8, fontSize: 11, color: COLORS.muted }}>
              AI-ответы пока не подключены к нейросети — это демо-режим интерфейса
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

// ─── Демо-ответы для заглушки ────────────────────────────────────────────────
// Разные ответы в зависимости от темы запроса — чтобы было реалистично
function getStubResponse(input) {
  const q = input.toLowerCase()

  if (q.includes('ролл') || q.includes('суши') || q.includes('нигири')) {
    return `Отличный запрос! Вот базовая структура ролла:

🍣 **Ролл Спайси Тунец**
• Выход: 220 г
• Food cost: ~26%

**Состав:**
— Рис суши: 80 г
— Тунец св/мор: 60 г
— Авокадо: 30 г
— Нори: 1 лист
— Спайси соус: 15 г
— Кунжут: 3 г

**Технология:**
1. Приготовить рис по стандарту
2. Нанести рис на нори, не доходя 1.5 см до края
3. Выложить тунец и авокадо
4. Свернуть роллом, нарезать 6 частей
5. Полить спайси соусом, посыпать кунжутом

— — —
⚠️ Это демо-режим. После подключения нейросети AI создаст полную ТТК с расчётом себестоимости.`
  }

  if (q.includes('food cost') || q.includes('себестоимость') || q.includes('маржа')) {
    return `Для оптимального food cost рекомендую следующие принципы:

📊 **Ориентиры по категориям:**
• Салаты и закуски: 20–25%
• Горячие блюда: 25–32%
• Роллы и суши: 24–30%
• Десерты: 18–24%
• Напитки: 10–18%

**Как снизить food cost:**
1. Использовать сезонные продукты
2. Оптимизировать порции (взвешивать)
3. Сократить % отходов через правильную заготовку
4. Ввести блюда с высоким выходом из дешёвого сырья

— — —
⚠️ Это демо-режим. После подключения нейросети AI рассчитает точный food cost по вашим ценам.`
  }

  if (q.includes('технологи') || q.includes('приготовлен') || q.includes('рецепт')) {
    return `Пример технологической карты:

👨‍🍳 **Стандарт приготовления**

**Подготовка (mise en place):**
• Все ингредиенты взвешены и подготовлены заранее
• Посуда прогрета / охлаждена по стандарту

**Процесс:**
1. Подготовить все компоненты согласно рецептуре
2. Соблюдать температурный режим на каждом этапе
3. Контролировать вес готового блюда
4. Оформить согласно фотостандарту

**Критические точки:**
• Температура подачи горячего: +75°C
• Температура подачи холодного: +4–6°C
• Отклонение по весу: ±5 г

— — —
⚠️ Это демо-режим. После подключения нейросети AI напишет технологию под конкретное блюдо.`
  }

  if (q.includes('описание') || q.includes('меню') || q.includes('гастроном')) {
    return `Пример гастрономического описания:

✍️ **Для меню ресторана:**

*«Нежное филе лосося, томлёное при низкой температуре, с бархатистым пюре из печёного батата и соусом мисо-карамель. Украшено хрустящим чипсом из рисовой бумаги и микрозеленью редиса.»*

**Принципы хорошего описания:**
• 1–2 предложения, не больше
• Акцент на текстуру и вкус
• Упоминание авторского элемента
• Без технических терминов для гостя

— — —
⚠️ Это демо-режим. После подключения нейросети AI создаст описание для любого блюда за секунды.`
  }

  if (q.includes('производствен') || q.includes('план') || q.includes('заготовк')) {
    return `Пример производственной карты на день:

🏭 **Производственный план: Заготовки**

| Позиция | Кол-во | Ед. | Ответственный |
|---|---|---|---|
| Рис суши | 5 кг | кг | Горячий цех |
| Соус спайси | 2 кг | кг | Холодный цех |
| Авокадо (нарезка) | 3 кг | кг | Заготовочный |
| Лосось (нарезка) | 4 кг | кг | Холодный цех |

**Порядок запуска:**
1. 09:00 — рис (время приготовления 40 мин)
2. 09:30 — соусы и маринады
3. 10:00 — нарезка рыбы и овощей
4. 10:30 — финальная проверка, взвешивание

— — —
⚠️ Это демо-режим. После подключения нейросети AI сформирует план автоматически из вашей базы блюд.`
  }

  // Универсальный ответ
  return `Понял ваш запрос: «${input}»

Я готов помочь с:
• 🍽️ Созданием новых блюд и рецептур
• 📝 Написанием технологических карт
• 💰 Расчётом food cost и себестоимости
• 📋 Производственными планами
• ✍️ Описаниями блюд для меню
• 🔍 Анализом и улучшением рецептур

— — —
⚠️ Это демо-режим интерфейса. После подключения нейросети (Claude AI / GPT-4) я буду давать полноценные профессиональные ответы специально для вашей кухни.`
}
