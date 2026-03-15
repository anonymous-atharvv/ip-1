export function createRoomManager({ roomIdleTtlMs }) {
  const roomUsers = new Map();
  const roomTimers = new Map();

  const ensureRoom = (room) => {
    if (!roomUsers.has(room)) {
      roomUsers.set(room, new Set());
    }
    const timer = roomTimers.get(room);
    if (timer) {
      clearTimeout(timer);
      roomTimers.delete(room);
    }
    return roomUsers.get(room);
  };

  const join = (room, socketId) => {
    const users = ensureRoom(room);
    users.add(socketId);
    return users.size;
  };

  const leave = (room, socketId) => {
    const users = roomUsers.get(room);
    if (!users) return 0;
    users.delete(socketId);
    if (users.size === 0) {
      const timer = setTimeout(() => {
        roomUsers.delete(room);
        roomTimers.delete(room);
      }, roomIdleTtlMs);
      roomTimers.set(room, timer);
    }
    return users.size;
  };

  const count = (room) => roomUsers.get(room)?.size ?? 0;

  return { join, leave, count };
}
