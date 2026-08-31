import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';

import usersRouter from './routes/users.js';
import scholarshipsRouter from './routes/scholarships.js';
import applicationsRouter from './routes/applications.js';
import adminRouter from './routes/admin.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const server = createServer(app);
const wss = new WebSocketServer({ server });

// Middleware
app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:3000', 'http://localhost:3001'] }));
app.use(express.json());

// Serve uploaded files
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });
app.use('/uploads', express.static(uploadsDir));

// WebSocket setup
const clients = new Map(); // userId -> ws

wss.on('connection', (ws) => {
  console.log('WebSocket client connected');
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message);
      if (data.type === 'auth' && data.payload?.token) {
        // Extract user ID from token
        const userId = data.payload.token.replace('fake-jwt-token-', '');
        clients.set(userId, ws);
        console.log(`WS authenticated: ${userId}`);
      }
    } catch (e) {
      console.error('WS message error', e);
    }
  });

  ws.on('close', () => {
    for (const [userId, client] of clients.entries()) {
      if (client === ws) {
        clients.delete(userId);
        break;
      }
    }
  });
});

export const sendToUser = (userId, event) => {
  const ws = clients.get(userId);
  if (ws && ws.readyState === 1) {
    ws.send(JSON.stringify(event));
  }
};

// Attach sendToUser to requests
app.use((req, res, next) => {
  req.sendToUser = sendToUser;
  next();
});

// API Routes
app.use('/api/users', usersRouter);
app.use('/api/scholarships', scholarshipsRouter);
app.use('/api/applications', applicationsRouter);
app.use('/api/admin', adminRouter);

// Serve frontend static files from parent directory
const frontendPath = path.join(__dirname, '..');
app.use(express.static(frontendPath));

// SPA fallback — serve index.html for non-API routes
app.get('*', (req, res) => {
  if (!req.path.startsWith('/api/')) {
    res.sendFile(path.join(frontendPath, 'index.html'));
  }
});

// Error Handler
app.use((err, req, res, next) => {
  console.error('Server Error:', err.stack);
  res.status(500).json({ error: err.message || 'Internal Server Error' });
});

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`\n  🎓 University of Nottingham Server`);
  console.log(`  ═══════════════════════════════════`);
  console.log(`  🌐 Frontend:  http://localhost:${PORT}`);
  console.log(`  📡 API:       http://localhost:${PORT}/api`);
  console.log(`  🔌 WebSocket: ws://localhost:${PORT}`);
  console.log(`  ═══════════════════════════════════\n`);
});
