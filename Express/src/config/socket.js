const { Server } = require('socket.io');
const JwtService = require('../services/JwtService');

let io = null;
const userSockets = new Map();
const userRoles = new Map();

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(';').forEach((cookie) => {
    const parts = cookie.split('=');
    list[parts.shift().trim()] = decodeURI(parts.join('='));
  });
  return list;
};

const initSocket = (server, corsOptions) => {
  io = new Server(server, { cors: corsOptions });

  io.on('connection', (socket) => {
    const cookies = parseCookies(socket.handshake.headers.cookie);
    const token = socket.handshake.auth?.token || socket.handshake.query?.token || cookies.accessToken;
    let userId = null;

    if (token) {
      const decoded = JwtService.verifyToken(token);
      if (decoded && decoded.id) {
        userId = decoded.id;
        socket.userId = userId;
        socket.userRole = decoded.role || 'USER';

        if (!userSockets.has(userId)) userSockets.set(userId, new Set());
        userSockets.get(userId).add(socket.id);
        userRoles.set(userId, socket.userRole);

        console.log(`[Socket] User ${userId} (${socket.userRole}) connected: ${socket.id}`);
      } else {
        console.log('[Socket] Token invalid or expired');
      }
    } else {
      console.log(`[Socket] Guest connected: ${socket.id}`);
    }

    socket.on('disconnect', () => {
      if (userId && userSockets.has(userId)) {
        const sockets = userSockets.get(userId);
        sockets.delete(socket.id);
        if (sockets.size === 0) {
          userSockets.delete(userId);
          userRoles.delete(userId);
        }
      }
      console.log(`[Socket] Disconnected: ${socket.id}`);
    });
  });

  return io;
};

const sendToUser = (userId, event, data) => {
  if (io && userId) {
    const userIdStr = userId.toString();
    if (userSockets.has(userIdStr)) {
      userSockets.get(userIdStr).forEach((socketId) => {
        io.to(socketId).emit(event, data);
      });
    }
  }
};

const sendToAll = (event, data) => {
  if (io) io.emit(event, data);
};

const sendToAdmins = (event, data) => {
  if (!io) return;
  userSockets.forEach((socketIds, userId) => {
    const role = userRoles.get(userId);
    if (role === 'ADMIN' || role === 'STAFF') {
      socketIds.forEach((socketId) => io.to(socketId).emit(event, data));
    }
  });
};

module.exports = {
  initSocket,
  sendToUser,
  sendToAll,
  sendToAdmins,
  getIo: () => io
};
