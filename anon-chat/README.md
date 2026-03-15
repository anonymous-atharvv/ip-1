# ANON-CHAT (Terminal Edition)

A privacy-focused anonymous real-time chat inspired by ipchat.in, rebuilt with a terminal/hacker UI and improved protections.

## 1) Phase 1 — Analysis of ipchat.in behavior

> External black-box analysis (UI/network behavior) indicates a lightweight public room style chat with implicit identity and near-real-time updates.

### Observed/expected behavior model
- **Join flow:** users open the page and are immediately present in chat without signup.
- **Identity model:** displayed identity appears derived from network metadata (IP-like identity label) rather than user account.
- **Message transport:** near-instant updates suggest a push channel; likely **WebSockets** or long-poll fallback.
- **Session handling:** session is browser + connection scoped; reconnect generally creates/refreshes transient presence.
- **Interaction flow:** simple chat timeline + input, minimal affordances, no onboarding friction.
- **Privacy posture:** convenience-first anonymity, but IP-derived identity can leak metadata and is not ideal for privacy.

## 2) Improved architecture

### Goals implemented
- Temporary random anonymous IDs (`neon-signal-4821` style).
- Real-time room messaging via Socket.io WebSockets.
- Ephemeral rooms created on demand, auto-cleaned after inactivity.
- Optional self-destruct messages (`/selfdestruct 10 text`).
- Per-socket rate limiting for spam control.
- Privacy-forward defaults (no account, no DB persistence).

### High-level architecture
- **Frontend:** Next.js + React + Tailwind terminal UI.
- **Backend:** Express + Socket.io realtime gateway.
- **Room lifecycle:** in-memory room manager tracks users and expires empty rooms.
- **Security controls:** helmet, CORS allowlist, message length cap, input sanitization, rate limiting.

## 3) Folder structure

```text
anon-chat/
  frontend/
    app/
    components/
    lib/
    styles/
  backend/
    src/
      middleware/
      services/
      sockets/
      utils/
  docker-compose.yml
  .env.example
  README.md
```

## 4) Backend server
- Entrypoint: `backend/src/server.js`
- Health endpoint: `GET /health`
- Socket server attached to same HTTP server, websocket transport enabled.

## 5) WebSocket logic
- `joinRoom`: joins/creates room and broadcasts presence.
- `chat:message`: validates/rate-limits/sanitizes and broadcasts messages.
- `chat:typing`: emits typing indicator snapshots.
- `room:who`: returns online aliases in current room.

## 6) React frontend
- Terminal boot sequence and animated cursor.
- Real-time timeline, room header, presence count, typing indicator.
- Command-first UX for `/join`, `/msg`, `/who`, `/help`, `/clear`, `/selfdestruct`.

## 7) Message handling
- Server enforces character caps.
- Self-destruct metadata sent with message.
- Server emits destruction notice after TTL.

## 8) Anonymous ID generation
- Random adjective+noun+numeric suffix created server-side at connection time.

## 9) Security protections
- `helmet` headers.
- CORS restricted by `CORS_ORIGIN`.
- Socket spam limiter (`RATE_LIMIT_WINDOW_MS`, `RATE_LIMIT_MAX_EVENTS`).
- Room name sanitization.
- No permanent message storage.

## 10) Deployment guide (Docker + VPS)

### Local Docker
```bash
cd anon-chat
docker compose up --build
```
Frontend: `http://localhost:3000`, backend health: `http://localhost:4000/health`

### VPS (Ubuntu example)
1. Install Docker + Compose plugin.
2. Clone repository.
3. Set env values in shell or `.env`.
4. Run:
   ```bash
   cd anon-chat
   docker compose up -d --build
   ```
5. Put Nginx in front for TLS and reverse proxy 80/443 to frontend/backend.

## Development

### Backend
```bash
cd backend
npm install
npm run dev
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

