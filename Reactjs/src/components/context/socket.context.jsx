import { createContext, useContext, useEffect, useState } from 'react';
import { io } from 'socket.io-client';
import { useAuth } from './auth.context.jsx';

const SocketContext = createContext(null);

export function SocketProvider({ children }) {
  const { isAuthenticated } = useAuth();
  const [socket, setSocket] = useState(null);

  useEffect(() => {
    if (!isAuthenticated) {
      if (socket) {
        socket.disconnect();
        setSocket(null);
      }
      return;
    }

    const socketUrl = import.meta.env.VITE_SOCKET_URL || 'http://localhost:3000';
    const newSocket = io(socketUrl, {
      withCredentials: true,
      transports: ['websocket']
    });

    newSocket.on('connect', () => {
      console.log('[Socket] Connected to server');
    });

    newSocket.on('connect_error', (err) => {
      console.error('[Socket] Connection error:', err);
    });

    // Lắng nghe thông báo realtime
    newSocket.on('notification', (noti) => {
      window.dispatchEvent(
        new CustomEvent('app:toast', {
          detail: { id: Date.now(), type: 'info', message: noti.content },
        })
      );
      window.dispatchEvent(new CustomEvent('movie-app:new-notification', { detail: noti }));
    });

    // Admin realtime notifications (booking/review events)
    newSocket.on('admin:notification', (noti) => {
      window.dispatchEvent(new CustomEvent('admin:new-notification', { detail: noti }));
    });

    setSocket(newSocket);

    return () => {
      newSocket.disconnect();
    };
  }, [isAuthenticated]);

  return (
    <SocketContext.Provider value={socket}>
      {children}
    </SocketContext.Provider>
  );
}

export function useSocket() {
  return useContext(SocketContext);
}
