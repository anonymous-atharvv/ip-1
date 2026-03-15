import dotenv from 'dotenv';

dotenv.config();

export const config = {
  port: Number(process.env.PORT ?? 4000),
  origin: process.env.CORS_ORIGIN ?? 'http://localhost:3000',
  messageCharLimit: Number(process.env.MESSAGE_CHAR_LIMIT ?? 500),
  roomIdleTtlMs: Number(process.env.ROOM_IDLE_TTL_MS ?? 1000 * 60 * 30),
  rateLimitWindowMs: Number(process.env.RATE_LIMIT_WINDOW_MS ?? 10_000),
  rateLimitMaxEvents: Number(process.env.RATE_LIMIT_MAX_EVENTS ?? 12),
};
