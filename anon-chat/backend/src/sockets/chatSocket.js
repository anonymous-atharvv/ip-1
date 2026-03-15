import { createAnonId, createMessageId } from '../utils/id.js';

function sanitizeRoomName(raw = 'lobby') {
  return raw.toLowerCase().replace(/[^a-z0-9-_]/g, '').slice(0, 32) || 'lobby';
}

export function registerChatSocket(io, { config, roomManager, isAllowed }) {
  io.on('connection', (socket) => {
    const state = {
      anonId: createAnonId(),
      room: 'lobby',
      typing: false,
    };

    const joinRoom = (requestedRoom) => {
      const nextRoom = sanitizeRoomName(requestedRoom);
      if (nextRoom === state.room && socket.rooms.has(nextRoom)) return;

      socket.leave(state.room);
      roomManager.leave(state.room, socket.id);

      state.room = nextRoom;
      socket.join(nextRoom);
      const online = roomManager.join(nextRoom, socket.id);

      io.to(nextRoom).emit('chat:presence', { online });
      socket.emit('session', { anonId: state.anonId, room: nextRoom, online });
      io.to(nextRoom).emit('chat:message', {
        id: createMessageId(),
        from: 'SYSTEM',
        content: `${state.anonId} joined #${nextRoom}`,
        room: nextRoom,
        createdAt: Date.now(),
        type: 'system',
      });
    };

    joinRoom('lobby');

    socket.on('joinRoom', ({ room }) => joinRoom(room));

    socket.on('chat:typing', ({ active }) => {
      state.typing = Boolean(active);
      const sockets = io.sockets.adapter.rooms.get(state.room) ?? new Set();
      const users = [...sockets]
        .map((id) => io.sockets.sockets.get(id))
        .filter((s) => s?.data.anonId && s.id !== socket.id)
        .map((s) => s.data.anonId);
      io.to(state.room).emit('chat:typing', { users: active ? [...new Set(users)] : [] });
    });

    socket.on('room:who', () => {
      const sockets = io.sockets.adapter.rooms.get(state.room) ?? new Set();
      const users = [...sockets]
        .map((id) => io.sockets.sockets.get(id))
        .map((s) => s?.data.anonId)
        .filter(Boolean);

      socket.emit('chat:message', {
        id: createMessageId(),
        from: 'SYSTEM',
        content: `Active users (${users.length}): ${users.join(', ')}`,
        room: state.room,
        createdAt: Date.now(),
        type: 'system',
      });
    });

    socket.on('chat:message', ({ content, selfDestructInMs }) => {
      if (!isAllowed(socket.id)) {
        socket.emit('chat:message', {
          id: createMessageId(),
          from: 'SYSTEM',
          content: 'Rate limit reached. Slow down.',
          room: state.room,
          createdAt: Date.now(),
          type: 'system',
        });
        return;
      }

      const safeContent = String(content ?? '').trim().slice(0, config.messageCharLimit);
      if (!safeContent) return;

      const now = Date.now();
      const ttl = Number(selfDestructInMs);
      const selfDestructAt = Number.isFinite(ttl) && ttl > 0 ? now + ttl : undefined;
      const event = {
        id: createMessageId(),
        from: state.anonId,
        content: safeContent,
        room: state.room,
        createdAt: now,
        selfDestructAt,
      };

      io.to(state.room).emit('chat:message', event);

      if (selfDestructAt) {
        setTimeout(() => {
          io.to(state.room).emit('chat:message', {
            id: createMessageId(),
            from: 'SYSTEM',
            content: `Message ${event.id} self-destructed.`,
            room: state.room,
            createdAt: Date.now(),
            type: 'system',
          });
        }, ttl);
      }
    });

    socket.data.anonId = state.anonId;

    socket.on('disconnect', () => {
      const online = roomManager.leave(state.room, socket.id);
      io.to(state.room).emit('chat:presence', { online });
    });
  });
}
