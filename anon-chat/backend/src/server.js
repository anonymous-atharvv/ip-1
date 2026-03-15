import http from 'http';
import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { Server } from 'socket.io';
import { config } from './config.js';
import { createSocketRateLimiter } from './middleware/rateLimiter.js';
import { createRoomManager } from './services/roomManager.js';
import { registerChatSocket } from './sockets/chatSocket.js';

const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(cors({ origin: config.origin, credentials: true }));
app.use(express.json());

app.get('/health', (_req, res) => {
  res.json({ ok: true, uptime: process.uptime() });
});

const server = http.createServer(app);
const io = new Server(server, {
  cors: { origin: config.origin, credentials: true },
  transports: ['websocket'],
});

const roomManager = createRoomManager({ roomIdleTtlMs: config.roomIdleTtlMs });
const isAllowed = createSocketRateLimiter({
  windowMs: config.rateLimitWindowMs,
  maxEvents: config.rateLimitMaxEvents,
});

registerChatSocket(io, { config, roomManager, isAllowed });

server.listen(config.port, () => {
  console.log(`anon-chat backend running on :${config.port}`);
});
