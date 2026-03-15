import { io, Socket } from 'socket.io-client';

export type ChatEvent = {
  id: string;
  from: string;
  content: string;
  room: string;
  createdAt: number;
  selfDestructAt?: number;
  type?: 'system' | 'message';
};

let socket: Socket | null = null;

export function getSocket() {
  if (!socket) {
    socket = io(process.env.NEXT_PUBLIC_SOCKET_URL ?? 'http://localhost:4000', {
      transports: ['websocket'],
      withCredentials: true,
    });
  }
  return socket;
}
