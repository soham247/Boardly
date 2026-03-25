import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { User } from './models/user.model.js';

let io;

/**
 * Initialise Socket.IO and attach it to the given HTTP server.
 * Call this once from index.js after creating the HTTP server.
 */
export function initializeSocket(httpServer) {
  io = new Server(httpServer, {
    cors: {
      origin: [
        process.env.CORS_ORIGIN,
        'http://localhost:5173',
        'http://127.0.0.1:5173',
        'http://localhost:3000',
      ],
      credentials: true,
    },
  });

  // ── Auth middleware ────────────────────────────────────────
  // Authenticate every incoming socket using the accessToken cookie
  io.use(async (socket, next) => {
    try {
      const cookies = socket.handshake.headers.cookie;
      if (!cookies) return next(new Error('Authentication error'));

      // Parse the accessToken from the cookie string
      const tokenCookie = cookies
        .split(';')
        .map((c) => c.trim())
        .find((c) => c.startsWith('accessToken='));

      if (!tokenCookie) return next(new Error('Authentication error'));

      const token = tokenCookie.split('=')[1];
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      const user = await User.findById(decoded._id).select('-password -refreshToken');

      if (!user) return next(new Error('Authentication error'));

      socket.user = user;
      next();
    } catch (_err) {
      next(new Error('Authentication error'));
    }
  });

  // ── Connection handler ─────────────────────────────────────
  io.on('connection', (socket) => {
    const userId = socket.user._id.toString();
    console.log(`Socket connected: ${userId}`);

    // Join a personal room so we can send targeted notifications
    socket.join(`user:${userId}`);

    socket.on('disconnect', () => {
      console.log(`Socket disconnected: ${userId}`);
    });
  });

  return io;
}

/**
 * Get the initialised Socket.IO instance.
 * Use this in controllers / services to emit events.
 */
export function getIO() {
  if (!io) {
    throw new Error('Socket.IO has not been initialised');
  }
  return io;
}
