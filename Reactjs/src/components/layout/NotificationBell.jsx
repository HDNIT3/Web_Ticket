import { useEffect, useState, useRef } from 'react'
import { getNotifications, readNotification, readAllNotifications } from '../../services/notification.api.js'

export default function NotificationBell({ navigateToPage, dark = false }) {
  const [notifications, setNotifications] = useState([])
  const [unreadCount, setUnreadCount] = useState(0)
  const [isOpen, setIsOpen] = useState(false)
  const [selectedNoti, setSelectedNoti] = useState(null)
  const dropdownRef = useRef(null)

  const fetchNotifications = async () => {
    try {
      const data = await getNotifications({ page: 1, limit: 10 })
      setNotifications(data)
      const unread = data.filter(n => !n.isRead).length
      setUnreadCount(unread)
    } catch (err) {
      console.error('Lỗi lấy thông báo:', err)
    }
  }

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    fetchNotifications()

    const handleNewNoti = () => {
      fetchNotifications()
    }
    window.addEventListener('movie-app:new-notification', handleNewNoti)

    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)

    return () => {
      window.removeEventListener('movie-app:new-notification', handleNewNoti)
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [])

  const handleToggle = () => {
    setIsOpen(!isOpen)
  }

  const handleRead = async (id) => {
    try {
      await readNotification(id)
      fetchNotifications()
    } catch (err) {
      console.error('Lỗi khi đánh dấu đã đọc:', err)
    }
  }

  const handleReadAll = async () => {
    try {
      await readAllNotifications()
      fetchNotifications()
    } catch (err) {
      console.error('Lỗi khi đánh dấu đọc tất cả:', err)
    }
  }

  const handleItemClick = (noti) => {
    handleRead(noti._id)
    setIsOpen(false)

    if (noti.type === 'NEW_MOVIE' && noti.relatedId) {
      navigateToPage(`/movie/${noti.relatedId}`)
    } else if (noti.type === 'NEW_SHOWTIME' && noti.relatedId) {
      navigateToPage(`/booking/${noti.relatedId}`)
    } else {
      setSelectedNoti(noti)
    }
  }

  return (
    <div className="notification-bell-container" ref={dropdownRef} style={{ position: 'relative', display: 'inline-block' }}>
      <button 
        type="button" 
        className="btn btn-bell position-relative" 
        onClick={handleToggle}
        style={{
          background: dark ? 'transparent' : 'transparent',
          border: 'none',
          color: dark ? '#1e293b' : '#fff',
          fontSize: '20px',
          padding: '8px',
          cursor: 'pointer'
        }}
      >
        🔔
        {unreadCount > 0 && (
          <span 
            className="position-absolute top-0 start-100 translate-middle badge rounded-pill bg-danger"
            style={{ 
              fontSize: '10px', 
              padding: '2px 6px',
              backgroundColor: '#dc3545',
              color: '#fff',
              borderRadius: '50%',
              position: 'absolute',
              top: '-2px',
              right: '-2px'
            }}
          >
            {unreadCount}
          </span>
        )}
      </button>

      {isOpen && (
        <div 
          className="notification-dropdown shadow-lg position-absolute end-0 mt-2 rounded-3"
          style={{ 
            width: '340px', 
            zIndex: 1000, 
            overflow: 'hidden', 
            position: 'absolute', 
            right: 0,
            backgroundColor: '#ffffff',
            border: '1px solid #e2e8f0',
            boxShadow: '0 10px 40px rgba(0,0,0,0.12)'
          }}
        >
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '14px 16px', borderBottom: '1px solid #f1f5f9', background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)' }}>
            <h6 style={{ margin: 0, fontSize: '14px', fontWeight: '700', color: '#fff', display: 'flex', alignItems: 'center', gap: '6px' }}>🔔 Thông báo</h6>
            {unreadCount > 0 && (
              <button 
                type="button"
                onClick={handleReadAll}
                style={{ fontSize: '11px', color: 'rgba(255,255,255,0.85)', background: 'rgba(255,255,255,0.2)', border: 'none', cursor: 'pointer', padding: '3px 10px', borderRadius: '20px', fontWeight: '600' }}
              >
                Đọc tất cả
              </button>
            )}
          </div>
          <div style={{ maxHeight: '320px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ fontSize: '13px', padding: '32px 16px', color: '#94a3b8', textAlign: 'center' }}>
                <div style={{ fontSize: '28px', marginBottom: '8px' }}>🔕</div>
                Không có thông báo nào
              </div>
            ) : (
              notifications.map((noti) => (
                <div 
                  key={noti._id} 
                  onClick={() => handleItemClick(noti)}
                  style={{ 
                    cursor: 'pointer', 
                    padding: '12px 16px', 
                    borderBottom: '1px solid #f1f5f9',
                    backgroundColor: !noti.isRead ? '#eff6ff' : '#fff',
                    transition: 'background-color 0.15s',
                    borderLeft: !noti.isRead ? '3px solid #3b82f6' : '3px solid transparent'
                  }}
                  onMouseEnter={e => e.currentTarget.style.backgroundColor = !noti.isRead ? '#dbeafe' : '#f8fafc'}
                  onMouseLeave={e => e.currentTarget.style.backgroundColor = !noti.isRead ? '#eff6ff' : '#fff'}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '11px' }}>
                      {noti.type === 'BOOKING' ? '🎟️' : noti.type === 'REVIEW' ? '⭐' : '📢'}
                    </span>
                    <span style={{ fontWeight: '600', color: '#1e293b', fontSize: '13px' }}>{noti.title}</span>
                    {!noti.isRead && (
                      <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: '#3b82f6', display: 'inline-block', marginLeft: 'auto', flexShrink: 0 }} />
                    )}
                  </div>
                  <div style={{ color: '#64748b', fontSize: '12px', lineHeight: '1.5', marginLeft: '17px' }}>{noti.content}</div>
                  <div style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px', marginLeft: '17px' }}>
                    {new Date(noti.createdAt).toLocaleString('vi-VN')}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}
      {selectedNoti && (
        <div 
          className="modal show d-block" 
          style={{ 
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100vw',
            height: '100vh',
            background: 'rgba(0,0,0,0.7)', 
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setSelectedNoti(null)}
        >
          <div 
            className="modal-dialog modal-dialog-centered"
            style={{ width: '450px', maxWidth: '90%' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div 
              className="modal-content border-0 shadow-lg text-white" 
              style={{ 
                borderRadius: '16px', 
                backgroundColor: '#1e293b',
                border: '1px solid #334155'
              }}
            >
              <div className="modal-header border-bottom border-secondary d-flex justify-content-between align-items-center p-3 pb-2" style={{ display: 'flex', justifyContent: 'space-between', borderBottom: '1px solid #334155' }}>
                <h5 className="modal-title fw-bold m-0" style={{ fontSize: '16px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span>{selectedNoti.type === 'BROADCAST' ? '📢' : '🔔'}</span>
                  <span>{selectedNoti.type === 'BROADCAST' ? 'Thông báo hệ thống' : 'Chi tiết thông báo'}</span>
                </h5>
                <button 
                  type="button" 
                  className="btn-close btn-close-white shadow-none" 
                  onClick={() => setSelectedNoti(null)}
                  style={{ background: 'none', border: 'none', color: '#fff', fontSize: '18px', cursor: 'pointer', padding: 0 }}
                >
                  ✕
                </button>
              </div>
              <div className="modal-body p-3">
                <h4 className="fw-bold mb-2 text-warning" style={{ fontSize: '15px', color: '#fbbf24', marginTop: 0, marginBottom: '8px' }}>
                  {selectedNoti.title}
                </h4>
                <div 
                  className="p-3 rounded-3 text-light" 
                  style={{ 
                    whiteSpace: 'pre-line', 
                    fontSize: '13.5px', 
                    backgroundColor: '#0f172a',
                    border: '1px solid #1e293b',
                    lineHeight: '1.5',
                    maxHeight: '300px',
                    overflowY: 'auto'
                  }}
                >
                  {selectedNoti.content}
                </div>
                <div className="text-muted mt-3 text-end" style={{ fontSize: '11px', color: '#94a3b8', marginTop: '12px' }}>
                  Thời gian: {new Date(selectedNoti.createdAt).toLocaleString('vi-VN')}
                </div>
              </div>
              <div className="modal-footer border-top border-secondary p-2 d-flex justify-content-end" style={{ borderTop: '1px solid #334155', display: 'flex', justifyContent: 'flex-end' }}>
                <button 
                  type="button" 
                  className="btn btn-warning btn-sm fw-bold shadow-none" 
                  onClick={() => setSelectedNoti(null)}
                  style={{ 
                    backgroundColor: '#fbbf24', 
                    border: 'none', 
                    color: '#000', 
                    padding: '6px 16px', 
                    borderRadius: '8px', 
                    fontSize: '13px', 
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
