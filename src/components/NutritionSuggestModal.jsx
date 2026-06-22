/**
 * Компонент модального окна для подсказки КБЖУ
 *
 * Props:
 * - isOpen: boolean
 * - loading: boolean
 * - error: string | null
 * - result: { proteinPer100, fatPer100, carbsPer100, caloriesPer100, comment, confidence, notApplicable }
 * - onAccept: (result) => void
 * - onCancel: () => void
 */

const DS = {
  colors: {
    bg: '#ffffff',
    border: '#e0e0e0',
    primary: '#2563eb',
    success: '#10b981',
    warning: '#f59e0b',
    error: '#ef4444',
    text: '#1f2937',
    textSecondary: '#6b7280',
  },
  radius: '8px',
  shadow: '0 10px 25px rgba(0, 0, 0, 0.1)',
}

export function NutritionSuggestModal({
  isOpen,
  loading,
  error,
  result,
  onAccept,
  onCancel,
}) {
  if (!isOpen) return null

  return (
    <div style={styles.overlay}>
      <div style={styles.modal}>
        <div style={styles.header}>
          <h2 style={styles.title}>💡 Подсказка КБЖУ от AI</h2>
          <button style={styles.closeBtn} onClick={onCancel} disabled={loading}>
            ✕
          </button>
        </div>

        <div style={styles.content}>
          {loading && (
            <div style={styles.loading}>
              <div style={styles.spinner}></div>
              <p style={styles.loadingText}>Анализирую продукт...</p>
            </div>
          )}

          {error && (
            <div style={styles.error}>
              <p style={styles.errorText}>❌ Ошибка: {error}</p>
            </div>
          )}

          {result && !result.notApplicable && (
            <div style={styles.resultContainer}>
              <div style={styles.resultGrid}>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Белки (г)</div>
                  <div style={styles.resultValue}>{result.proteinPer100.toFixed(1)}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Жиры (г)</div>
                  <div style={styles.resultValue}>{result.fatPer100.toFixed(1)}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Углеводы (г)</div>
                  <div style={styles.resultValue}>{result.carbsPer100.toFixed(1)}</div>
                </div>
                <div style={styles.resultItem}>
                  <div style={styles.resultLabel}>Ккал</div>
                  <div style={styles.resultValue}>{result.caloriesPer100.toFixed(0)}</div>
                </div>
              </div>

              {result.comment && (
                <div style={styles.commentSection}>
                  <p style={styles.commentLabel}>Комментарий:</p>
                  <p style={styles.commentText}>{result.comment}</p>
                </div>
              )}

              <div style={styles.confidenceSection}>
                <p style={styles.confidenceLabel}>Уровень уверенности:</p>
                <div style={styles.confidenceBar}>
                  <div
                    style={{
                      ...styles.confidenceFill,
                      width: `${result.confidence * 100}%`,
                    }}
                  ></div>
                </div>
                <p style={styles.confidencePercent}>{Math.round(result.confidence * 100)}%</p>
              </div>
            </div>
          )}

          {result && result.notApplicable && (
            <div style={styles.notApplicable}>
              <p style={styles.notApplicableText}>
                ℹ️ Этот продукт не является пищевым (упаковка, хозтовар, инвентарь).
              </p>
              <p style={styles.notApplicableSubtext}>
                КБЖУ не применяется. Вы можете оставить поля пустыми.
              </p>
            </div>
          )}
        </div>

        <div style={styles.footer}>
          <button style={styles.btnCancel} onClick={onCancel} disabled={loading}>
            Отменить
          </button>
          <button
            style={{
              ...styles.btnAccept,
              opacity: result ? 1 : 0.5,
            }}
            onClick={() => result && onAccept(result)}
            disabled={!result || loading}
          >
            Принять значения
          </button>
        </div>
      </div>
    </div>
  )
}

const styles = {
  overlay: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10000,
  },

  modal: {
    backgroundColor: DS.colors.bg,
    borderRadius: DS.radius,
    boxShadow: DS.shadow,
    maxWidth: '500px',
    width: '90%',
    maxHeight: '90vh',
    overflow: 'auto',
    display: 'flex',
    flexDirection: 'column',
  },

  header: {
    padding: '20px',
    borderBottom: `1px solid ${DS.colors.border}`,
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
  },

  title: {
    margin: 0,
    fontSize: '18px',
    fontWeight: 'bold',
    color: DS.colors.text,
  },

  closeBtn: {
    background: 'none',
    border: 'none',
    fontSize: '24px',
    cursor: 'pointer',
    color: DS.colors.textSecondary,
    padding: 0,
    width: '32px',
    height: '32px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  content: {
    padding: '20px',
    flex: 1,
    minHeight: '200px',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },

  loading: {
    textAlign: 'center',
    width: '100%',
  },

  spinner: {
    width: '40px',
    height: '40px',
    border: `4px solid ${DS.colors.border}`,
    borderTop: `4px solid ${DS.colors.primary}`,
    borderRadius: '50%',
    animation: 'spin 1s linear infinite',
    margin: '0 auto 16px',
  },

  loadingText: {
    color: DS.colors.textSecondary,
    margin: 0,
    fontSize: '14px',
  },

  error: {
    width: '100%',
    padding: '12px',
    backgroundColor: '#fee',
    border: `1px solid ${DS.colors.error}`,
    borderRadius: DS.radius,
  },

  errorText: {
    color: DS.colors.error,
    margin: 0,
    fontSize: '14px',
  },

  resultContainer: {
    width: '100%',
  },

  resultGrid: {
    display: 'grid',
    gridTemplateColumns: '1fr 1fr',
    gap: '12px',
    marginBottom: '16px',
  },

  resultItem: {
    padding: '12px',
    backgroundColor: '#f9fafb',
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius,
    textAlign: 'center',
  },

  resultLabel: {
    fontSize: '12px',
    color: DS.colors.textSecondary,
    marginBottom: '4px',
    fontWeight: '500',
  },

  resultValue: {
    fontSize: '20px',
    fontWeight: 'bold',
    color: DS.colors.primary,
  },

  commentSection: {
    marginBottom: '16px',
    padding: '12px',
    backgroundColor: '#f0f9ff',
    border: `1px solid #bfdbfe`,
    borderRadius: DS.radius,
  },

  commentLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: DS.colors.text,
    margin: '0 0 6px 0',
  },

  commentText: {
    fontSize: '14px',
    color: DS.colors.text,
    margin: 0,
    lineHeight: '1.4',
  },

  confidenceSection: {
    padding: '12px',
    backgroundColor: '#fef3c7',
    border: `1px solid #fcd34d`,
    borderRadius: DS.radius,
  },

  confidenceLabel: {
    fontSize: '12px',
    fontWeight: 'bold',
    color: DS.colors.text,
    margin: '0 0 8px 0',
  },

  confidenceBar: {
    width: '100%',
    height: '8px',
    backgroundColor: '#e5e7eb',
    borderRadius: '4px',
    overflow: 'hidden',
    marginBottom: '4px',
  },

  confidenceFill: {
    height: '100%',
    backgroundColor: DS.colors.warning,
    transition: 'width 0.3s ease',
  },

  confidencePercent: {
    fontSize: '12px',
    color: DS.colors.text,
    margin: 0,
    textAlign: 'right',
  },

  notApplicable: {
    width: '100%',
    padding: '16px',
    backgroundColor: '#f0fdf4',
    border: `1px solid #86efac`,
    borderRadius: DS.radius,
    textAlign: 'center',
  },

  notApplicableText: {
    fontSize: '14px',
    fontWeight: '500',
    color: DS.colors.text,
    margin: '0 0 8px 0',
  },

  notApplicableSubtext: {
    fontSize: '12px',
    color: DS.colors.textSecondary,
    margin: 0,
  },

  footer: {
    padding: '16px 20px',
    borderTop: `1px solid ${DS.colors.border}`,
    display: 'flex',
    gap: '8px',
    justifyContent: 'flex-end',
  },

  btnCancel: {
    padding: '8px 16px',
    backgroundColor: '#f3f4f6',
    border: `1px solid ${DS.colors.border}`,
    borderRadius: DS.radius,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: DS.colors.text,
    transition: 'all 0.2s',
  },

  btnAccept: {
    padding: '8px 16px',
    backgroundColor: DS.colors.primary,
    border: 'none',
    borderRadius: DS.radius,
    fontSize: '14px',
    fontWeight: '500',
    cursor: 'pointer',
    color: 'white',
    transition: 'all 0.2s',
  },
}

// Добавляем CSS для анимации spinner'а
if (typeof window !== 'undefined' && !document.getElementById('nutrition-suggest-styles')) {
  const style = document.createElement('style')
  style.id = 'nutrition-suggest-styles'
  style.textContent = `
    @keyframes spin {
      to { transform: rotate(360deg); }
    }
  `
  document.head.appendChild(style)
}
