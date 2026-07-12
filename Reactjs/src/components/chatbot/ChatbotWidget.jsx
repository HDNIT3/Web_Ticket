import { useState, useRef, useEffect, useCallback } from 'react'
import './ChatbotWidget.css'
import { sendChatMessage } from '../../services/chatbot.api.js'
import { useAuth } from '../context/auth.context.jsx'
const MAX_HISTORY = 40

const QUICK_ACTIONS = [
  { label: '🎬 Phim đang chiếu', text: 'Cho tôi xem danh sách phim đang chiếu hiện nay' },
  { label: '📅 Lịch chiếu hôm nay', text: 'Lịch chiếu phim hôm nay có gì?' },
  { label: '🎁 Khuyến mãi', text: 'Rạp đang có khuyến mãi gì không?' },
  { label: '🎟️ Cách đặt vé', text: 'Hướng dẫn tôi cách đặt vé xem phim' },
  { label: '⭐ Phim hot', text: 'Phim nào đang hot và được đánh giá cao nhất?' },
]

const WELCOME_MESSAGE = {
  id: 'welcome',
  role: 'assistant',
  content:
    'Xin chào! 👋 Tôi là **CineBot** - trợ lý AI của rạp phim Movie Group 9.\n\nTôi có thể giúp bạn:\n🎬 Tìm phim phù hợp\n📅 Xem lịch chiếu\n🎟️ Hướng dẫn đặt vé\n🎁 Cập nhật khuyến mãi\n\nBạn cần hỗ trợ gì ạ?',
  timestamp: Date.now(),
  actions: [],
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })
}

function renderContent(text) {
  if (!text) return ''
  const escaped = text
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;')
  return escaped
    .replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>')
    .replace(/\[([^\]]+)\]\(([^)]+)\)/g, (match, label, href) => {
      let targetHref = href
      if (href.startsWith('/') && !href.startsWith('/#')) {
        targetHref = `#${href}`
      }
      return `<a href="${targetHref}" class="chatbot-inline-link">${label}</a>`
    })
    .replace(/\n/g, '<br/>')
}

export default function ChatbotWidget({ onNavigate }) {
  const { user } = useAuth()
  const [isOpen, setIsOpen] = useState(false)
  const [isClosing, setIsClosing] = useState(false)
  const [messages, setMessages] = useState([WELCOME_MESSAGE])
  const [input, setInput] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [hasUnread, setHasUnread] = useState(false)
  const [isLoaded, setIsLoaded] = useState(false)
  const [isListening, setIsListening] = useState(false)

  const messagesEndRef = useRef(null)
  const inputRef = useRef(null)
  const textareaRef = useRef(null)
  const recognitionRef = useRef(null)

  useEffect(() => {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition
    if (SpeechRecognition) {
      const rec = new SpeechRecognition()
      rec.continuous = false
      rec.lang = 'vi-VN'
      rec.interimResults = false

      rec.onstart = () => {
        setIsListening(true)
      }

      rec.onend = () => {
        setIsListening(false)
      }

      rec.onresult = (e) => {
        const transcript = e.results[0][0].transcript
        if (transcript) {
          setInput(prev => {
            const space = prev && !prev.endsWith(' ') ? ' ' : ''
            return prev + space + transcript
          })
        }
      }

      rec.onerror = (e) => {
        console.error('Speech recognition error:', e.error)
        setIsListening(false)
        if (e.error === 'not-allowed') {
          alert('Vui lòng cấp quyền sử dụng microphone cho trình duyệt để sử dụng tính năng này.')
        }
      }

      recognitionRef.current = rec
    }
  }, [])

  const toggleListening = () => {
    if (!recognitionRef.current) {
      alert('Trình duyệt của bạn không hỗ trợ nhận diện giọng nói.')
      return
    }

    if (isListening) {
      recognitionRef.current.stop()
    } else {
      recognitionRef.current.start()
    }
  }

  const storageKey = user ? `movie_chatbot_history_${user._id || user.id}` : 'movie_chatbot_history_guest'

  useEffect(() => {
    setIsLoaded(false)
    try {
      const stored = localStorage.getItem(storageKey)
      setMessages(stored ? JSON.parse(stored) : [WELCOME_MESSAGE])
    } catch {
      setMessages([WELCOME_MESSAGE])
    }
    setIsLoaded(true)
  }, [storageKey])

  useEffect(() => {
    if (!isLoaded) return
    try {
      const toStore = messages.slice(-MAX_HISTORY)
      localStorage.setItem(storageKey, JSON.stringify(toStore))
    } catch {}
  }, [messages, storageKey, isLoaded])

  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [messages, isOpen, isLoading])

  useEffect(() => {
    if (isOpen) {
      setTimeout(() => textareaRef.current?.focus(), 300)
      setHasUnread(false)
    }
  }, [isOpen])

  const openChat = () => {
    setIsClosing(false)
    setIsOpen(true)
    setHasUnread(false)
  }

  const closeChat = () => {
    setIsClosing(true)
    setTimeout(() => {
      setIsOpen(false)
      setIsClosing(false)
    }, 220)
  }

  const toggleChat = () => {
    if (isOpen) closeChat()
    else openChat()
  }

  const buildApiMessages = useCallback((msgs) => {
    return msgs
      .filter(m => m.id !== 'welcome')
      .slice(-20)
      .map(m => ({ role: m.role, content: m.content }))
  }, [])

  const sendMessage = useCallback(async (text) => {
    const trimmed = text.trim()
    if (!trimmed || isLoading) return

    const userMsg = {
      id: `user-${Date.now()}`,
      role: 'user',
      content: trimmed,
      timestamp: Date.now(),
    }

    setMessages(prev => [...prev, userMsg])
    setInput('')
    setIsLoading(true)

    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto'
    }

    try {
      const updatedMsgs = [...messages, userMsg]
      const apiMessages = buildApiMessages(updatedMsgs)

      const result = await sendChatMessage(apiMessages)

      const botMsg = {
        id: `bot-${Date.now()}`,
        role: 'assistant',
        content: result.message,
        timestamp: Date.now(),
        actions: result.actions || [],
      }

      setMessages(prev => [...prev, botMsg])

      if (!isOpen) {
        setHasUnread(true)
      }
    } catch (err) {
      const errMsg = {
        id: `err-${Date.now()}`,
        role: 'assistant',
        content: '❌ Xin lỗi, tôi đang gặp sự cố kỹ thuật. Vui lòng thử lại sau ít phút.',
        timestamp: Date.now(),
        actions: [],
        isError: true,
      }
      setMessages(prev => [...prev, errMsg])
    } finally {
      setIsLoading(false)
    }
  }, [isLoading, messages, buildApiMessages, isOpen])

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage(input)
    }
  }

  const handleTextareaChange = (e) => {
    setInput(e.target.value)
    e.target.style.height = 'auto'
    e.target.style.height = Math.min(e.target.scrollHeight, 100) + 'px'
  }

  const handleActionChip = (action) => {
    if (action.type === 'navigate' && action.path && onNavigate) {
      onNavigate(action.path)
      closeChat()
    } else if (action.type === 'quick_reply' && action.text) {
      sendMessage(action.text)
    } else if (action.type === 'link' && action.url) {
      window.open(action.url, '_blank')
    }
  }

  const handleQuickAction = (text) => {
    sendMessage(text)
  }

  const clearChat = () => {
    if (!window.confirm('Bạn có muốn xóa lịch sử và bắt đầu cuộc trò chuyện mới không?')) return
    setMessages([WELCOME_MESSAGE])
    localStorage.removeItem(storageKey)
  }

  return (
    <>
      {!isOpen && !isClosing && (
        <button
          id="chatbot-fab-btn"
          className="chatbot-fab"
          onClick={openChat}
          aria-label="Mở chatbot tư vấn phim"
          title="Trợ lý AI - Tư vấn phim & đặt vé"
        >
          <span className="chatbot-fab-icon">🎬</span>
          {hasUnread && <span className="chatbot-fab-badge">1</span>}
        </button>
      )}

      {(isOpen || isClosing) && (
        <div className={`chatbot-panel ${isClosing ? 'is-closing' : ''}`} role="dialog" aria-label="Chatbot tư vấn phim">
          <div className="chatbot-header">
            <div className="chatbot-header-avatar">🤖</div>
            <div className="chatbot-header-info">
              <p className="chatbot-header-name">CineBot AI</p>
              <p className="chatbot-header-status">
                <span className="chatbot-status-dot" />
                Trực tuyến · Tư vấn phim & đặt vé
              </p>
            </div>
            <button
              className="chatbot-clear-btn"
              onClick={clearChat}
              title="Xóa lịch sử chat"
            >
              🗑️
            </button>
            <button
              className="chatbot-header-close"
              onClick={closeChat}
              aria-label="Đóng chat"
            >
              ✕
            </button>
          </div>

          <div className="chatbot-quick-actions" role="navigation" aria-label="Câu hỏi nhanh">
            {QUICK_ACTIONS.map((qa) => (
              <button
                key={qa.label}
                className="chatbot-quick-btn"
                onClick={() => handleQuickAction(qa.text)}
                disabled={isLoading}
              >
                {qa.label}
              </button>
            ))}
          </div>

          <div className="chatbot-messages" role="log" aria-live="polite">
            {messages.map((msg) => (
              <div key={msg.id} className={`chatbot-msg ${msg.role === 'user' ? 'user' : 'bot'}`}>
                {msg.role === 'assistant' && (
                  <div className="chatbot-msg-avatar">🤖</div>
                )}
                <div className="chatbot-msg-content">
                  <div
                    className={`chatbot-msg-bubble ${msg.isError ? 'chatbot-error-msg' : ''}`}
                    dangerouslySetInnerHTML={{ __html: renderContent(msg.content) }}
                  />
                  {msg.actions?.length > 0 && (
                    <div className="chatbot-action-chips">
                      {msg.actions.map((action, idx) => (
                        <button
                          key={idx}
                          className="chatbot-action-chip"
                          onClick={() => handleActionChip(action)}
                        >
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}
                  <span className="chatbot-msg-time">{formatTime(msg.timestamp)}</span>
                </div>
                {msg.role === 'user' && (
                  <div className="chatbot-msg-avatar user-avatar">👤</div>
                )}
              </div>
            ))}

            {isLoading && (
              <div className="chatbot-msg bot chatbot-typing">
                <div className="chatbot-msg-avatar">🤖</div>
                <div className="chatbot-typing-bubble">
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                  <span className="chatbot-typing-dot" />
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          <div className="chatbot-input-area">
            <textarea
              ref={textareaRef}
              className="chatbot-input"
              placeholder="Hỏi về phim, lịch chiếu, đặt vé..."
              value={input}
              onChange={handleTextareaChange}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              rows={1}
              maxLength={500}
              aria-label="Nhập câu hỏi"
            />
            {recognitionRef.current && (
              <button
                type="button"
                className={`chatbot-mic-btn ${isListening ? 'is-listening' : ''}`}
                onClick={toggleListening}
                disabled={isLoading}
                title="Nói để nhập văn bản"
                aria-label="Nói để nhập văn bản"
              >
                {isListening ? '🛑' : '🎤'}
              </button>
            )}
            <button
              id="chatbot-send-btn"
              className="chatbot-send-btn"
              onClick={() => sendMessage(input)}
              disabled={!input.trim() || isLoading}
              aria-label="Gửi tin nhắn"
            >
              {isLoading ? '⏳' : '➤'}
            </button>
          </div>
        </div>
      )}
    </>
  )
}
