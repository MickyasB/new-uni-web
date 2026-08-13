import express from 'express';
import http from 'http';
import { Server } from 'socket.io';
import cors from 'cors';
import dotenv from 'dotenv';
import authRoutes from './routes/auth';
import gameRoutes, { setIoRef } from './routes/game';
import walletRoutes from './routes/wallet';
import adminRoutes from './routes/admin';
import { initDb } from './db';

dotenv.config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: '*',
  },
});

app.use(cors());
app.use(express.json());

// Pass Socket.io reference to game routes
setIoRef(io);

// ─── Register API Routes ──────────────────────────────────────────────────────
app.use('/api/auth', authRoutes);
app.use('/api/game', gameRoutes);
app.use('/api/wallet', walletRoutes);
app.use('/api/admin', adminRoutes);

// Healthcheck
app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: Date.now() });
});

// ─── Socket.io for Real-time Game Sync ────────────────────────────────────────
io.on('connection', (socket) => {
  console.log('[Socket] Client connected:', socket.id);

  socket.on('joinRoom', (roomId) => {
    socket.join(roomId);
    console.log(`[Socket] Client ${socket.id} joined room ${roomId}`);
  });

  socket.on('leaveRoom', (roomId) => {
    socket.leave(roomId);
    console.log(`[Socket] Client ${socket.id} left room ${roomId}`);
  });

  // Player reactions (emoji broadcasts)
  socket.on('reaction', (data: { roomId: string; emoji: string; userId: string }) => {
    io.to(data.roomId).emit('reaction', {
      userId: data.userId,
      emoji: data.emoji,
      timestamp: Date.now(),
    });
  });

  socket.on('disconnect', () => {
    console.log('[Socket] Client disconnected:', socket.id);
  });
});

const PORT = process.env.PORT || 4000;

// Initialize DB schema & start server
initDb().then(() => {
  if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
      console.log(`[Backend] Server listening on port ${PORT}`);
      console.log(`[Backend] API: http://localhost:${PORT}/api`);
      console.log(`[Backend] Health: http://localhost:${PORT}/health`);
    });
  }
});

export default app;
module.exports = app;
