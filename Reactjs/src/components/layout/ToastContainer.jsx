import { useEffect, useState, useCallback } from 'react'

const TOAST_DURATION = 3000
const MAX_TOASTS = 5

const TOAST_CONFIG = {
  success: {
    icon: '✓',
    bgGradient: 'linear-gradient(135deg, #059669, #10b981)',
    accentColor: '#34d399',
    label: 'Thành công',
  },
  error: {
    icon: '✕',
    bgGradient: 'linear-gradient(135deg, #dc2626, #ef4444)',
    accentColor: '#f87171',
    label: 'Lỗi',
  },
  warning: {
    icon: '⚠',
    bgGradient: 'linear-gradient(135deg, #d97706, #f59e0b)',
    accentColor: '#fcd34d',
    label: 'Cảnh báo',
  },
  info: {
    icon: 'ℹ',
    bgGradient: 'linear-gradient(135deg, #2563eb, #3b82f6)',
    accentColor: '#93c5fd',
    label: 'Thông báo',
  },
}

function ToastItem({ toast, onRemove }) {
  const [visible, setVisible] = useState(false)
  const [exiting, setExiting] = useState(false)
  const [progress, setProgress] = useState(100)

  const config = TOAST_CONFIG[toast.type] ?? TOAST_CONFIG.info

  const startExit = useCallback(() => {
    setExiting(true)
    setTimeout(() => onRemove(toast.id), 320)
  }, [toast.id, onRemove])

  useEffect(() => {
    // Slide in
    const enterTimer = requestAnimationFrame(() => {
      requestAnimationFrame(() => setVisible(true))
    })

    // Progress bar
    const startTime = Date.now()
    const progressInterval = setInterval(() => {
      const elapsed = Date.now() - startTime
      const remaining = Math.max(0, 100 - (elapsed / TOAST_DURATION) * 100)
      setProgress(remaining)
      if (remaining <= 0) clearInterval(progressInterval)
    }, 30)

    // Auto exit
    const exitTimer = setTimeout(startExit, TOAST_DURATION)

    return () => {
      cancelAnimationFrame(enterTimer)
      clearInterval(progressInterval)
      clearTimeout(exitTimer)
    }
  }, [startExit])

  return (
    <div
      style={{
        transform: visible && !exiting ? 'translateX(0) scale(1)' : 'translateX(110%) scale(0.92)',
        opacity: visible && !exiting ? 1 : 0,
        transition: exiting
          ? 'transform 0.32s cubic-bezier(0.4,0,1,1), opacity 0.32s ease'
          : 'transform 0.38s cubic-bezier(0.175, 0.885, 0.32, 1.275), opacity 0.3s ease',
        marginBottom: 10,
        pointerEvents: 'auto',
        willChange: 'transform, opacity',
      }}
    >
      <div
        style={{
          width: 340,
          maxWidth: 'calc(100vw - 32px)',
          borderRadius: 18,
          overflow: 'hidden',
          background: 'rgba(15, 23, 42, 0.96)',
          backdropFilter: 'blur(24px)',
          WebkitBackdropFilter: 'blur(24px)',
          border: '1px solid rgba(255,255,255,0.10)',
          boxShadow: '0 20px 60px rgba(0,0,0,0.45), 0 4px 16px rgba(0,0,0,0.3)',
        }}
      >
        {/* Body */}
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: 12, padding: '14px 16px 12px' }}>
          {/* Icon badge */}
          <div
            style={{
              flexShrink: 0,
              width: 36,
              height: 36,
              borderRadius: 10,
              background: config.bgGradient,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 16,
              fontWeight: 700,
              color: '#fff',
              boxShadow: `0 6px 20px rgba(0,0,0,0.25)`,
            }}
          >
            {config.icon}
          </div>

          {/* Text */}
          <div style={{ flex: 1, minWidth: 0, paddingTop: 2 }}>
            <div
              style={{
                fontSize: '0.7rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: config.accentColor,
                marginBottom: 3,
              }}
            >
              {config.label}
            </div>
            <div
              style={{
                fontSize: '0.88rem',
                color: 'rgba(226,232,240,0.92)',
                lineHeight: 1.45,
                wordBreak: 'break-word',
              }}
            >
              {toast.message}
            </div>
          </div>

          {/* Close */}
          <button
            onClick={() => startExit()}
            style={{
              flexShrink: 0,
              width: 24,
              height: 24,
              borderRadius: 6,
              border: 'none',
              background: 'rgba(255,255,255,0.07)',
              color: 'rgba(255,255,255,0.5)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: 13,
              lineHeight: 1,
              padding: 0,
              marginTop: 2,
              transition: 'background 0.15s, color 0.15s',
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.14)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.9)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = 'rgba(255,255,255,0.07)'
              e.currentTarget.style.color = 'rgba(255,255,255,0.5)'
            }}
          >
            ✕
          </button>
        </div>

        {/* Progress bar */}
        <div
          style={{
            height: 3,
            background: 'rgba(255,255,255,0.06)',
          }}
        >
          <div
            style={{
              height: '100%',
              width: `${progress}%`,
              background: config.bgGradient,
              borderRadius: 999,
              transition: 'width 0.03s linear',
            }}
          />
        </div>
      </div>
    </div>
  )
}

export default function ToastContainer() {
  const [toasts, setToasts] = useState([])

  useEffect(() => {
    const handler = (e) => {
      const { id, type, message } = e.detail
      setToasts((prev) => {
        const next = [...prev, { id, type, message }]
        return next.length > MAX_TOASTS ? next.slice(next.length - MAX_TOASTS) : next
      })
    }

    window.addEventListener('app:toast', handler)
    return () => window.removeEventListener('app:toast', handler)
  }, [])

  const removeToast = useCallback((id) => {
    setToasts((prev) => prev.filter((t) => t.id !== id))
  }, [])

  if (toasts.length === 0) return null

  return (
    <div
      style={{
        position: 'fixed',
        top: 20,
        right: 20,
        zIndex: 9999,
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-end',
        pointerEvents: 'none',
      }}
      aria-live="polite"
      aria-atomic="false"
    >
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onRemove={removeToast} />
      ))}
    </div>
  )
}
