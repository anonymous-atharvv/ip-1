'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { ChatEvent, getSocket } from '../lib/socket';

const BOOT_LINES = [
  'INITIALIZING ANON NETWORK...',
  'LOADING ENCRYPTION MODULE...',
  'ESTABLISHING SECURE CHANNEL...',
  'CONNECTED.',
];

function parseCommand(input: string) {
  const [command, ...args] = input.trim().split(' ');
  return { command: command?.toLowerCase(), args };
}

export default function TerminalChat() {
  const [bootDone, setBootDone] = useState(false);
  const [bootVisibleLines, setBootVisibleLines] = useState<string[]>([]);
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatEvent[]>([]);
  const [room, setRoom] = useState('lobby');
  const [anonId, setAnonId] = useState('pending');
  const [onlineCount, setOnlineCount] = useState(0);
  const [typing, setTyping] = useState<string[]>([]);
  const outputRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let idx = 0;
    const timer = setInterval(() => {
      setBootVisibleLines((prev) => [...prev, BOOT_LINES[idx]]);
      idx += 1;
      if (idx >= BOOT_LINES.length) {
        clearInterval(timer);
        setTimeout(() => setBootDone(true), 400);
      }
    }, 500);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (!bootDone) return;
    const socket = getSocket();

    socket.on('connect', () => {
      socket.emit('joinRoom', { room: 'lobby' });
    });

    socket.on('session', ({ anonId: id, room: joinedRoom, online }: { anonId: string; room: string; online: number }) => {
      setAnonId(id);
      setRoom(joinedRoom);
      setOnlineCount(online);
    });

    socket.on('chat:message', (event: ChatEvent) => {
      setMessages((prev) => [...prev, event]);
    });

    socket.on('chat:presence', ({ online }: { online: number }) => setOnlineCount(online));
    socket.on('chat:typing', ({ users }: { users: string[] }) => setTyping(users));

    return () => {
      socket.off('session');
      socket.off('chat:message');
      socket.off('chat:presence');
      socket.off('chat:typing');
    };
  }, [bootDone]);

  useEffect(() => {
    outputRef.current?.scrollTo({ top: outputRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, typing]);

  const helpText = useMemo(
    () => [
      '/join room-name -> join or create room',
      '/msg @user your message -> direct message alias syntax (server broadcasts tagged text)',
      '/selfdestruct seconds your message -> auto-delete for all clients',
      '/who -> show active users in current room',
      '/clear -> clear local terminal',
      '/help -> command reference',
    ],
    []
  );

  const appendSystem = (content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: crypto.randomUUID(),
        from: 'SYSTEM',
        content,
        room,
        createdAt: Date.now(),
        type: 'system',
      },
    ]);
  };

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim()) return;

    const socket = getSocket();

    if (input.startsWith('/')) {
      const { command, args } = parseCommand(input);
      if (command === '/join') {
        const newRoom = args[0];
        if (!newRoom) {
          appendSystem('Usage: /join room-name');
        } else {
          socket.emit('joinRoom', { room: newRoom });
          appendSystem(`Switching room to ${newRoom}...`);
        }
      } else if (command === '/help') {
        helpText.forEach((line) => appendSystem(line));
      } else if (command === '/who') {
        socket.emit('room:who');
      } else if (command === '/clear') {
        setMessages([]);
      } else if (command === '/selfdestruct') {
        const ttl = Number(args[0]);
        const content = args.slice(1).join(' ');
        if (!ttl || !content) {
          appendSystem('Usage: /selfdestruct <seconds> <message>');
        } else {
          socket.emit('chat:message', { content, selfDestructInMs: ttl * 1000 });
        }
      } else if (command === '/msg') {
        const content = args.join(' ');
        if (!content) {
          appendSystem('Usage: /msg @user message');
        } else {
          socket.emit('chat:message', { content: `(DM) ${content}` });
        }
      } else {
        appendSystem(`Unknown command: ${command}. Type /help.`);
      }
    } else {
      socket.emit('chat:message', { content: input });
    }

    socket.emit('chat:typing', { active: false });
    setInput('');
  };

  if (!bootDone) {
    return (
      <main className="h-screen w-screen bg-terminalBg p-6 text-neon font-mono">
        <div className="max-w-3xl mx-auto border border-neon/50 p-6 h-full">
          {bootVisibleLines.map((line) => (
            <p key={line} className="animate-fadeIn tracking-wide">
              {line}
            </p>
          ))}
          <span className="inline-block ml-1 h-5 w-2 bg-neon animate-blink" />
        </div>
      </main>
    );
  }

  return (
    <main className="h-screen w-screen bg-terminalBg text-neon font-mono p-4">
      <section className="h-full max-w-5xl mx-auto border border-neon/40 p-4 flex flex-col">
        <header className="text-sm pb-3 border-b border-neon/30 flex flex-wrap justify-between gap-2">
          <span>USER: {anonId}</span>
          <span>ROOM: #{room}</span>
          <span>ONLINE: {onlineCount}</span>
        </header>

        <div ref={outputRef} className="flex-1 overflow-y-auto py-3 space-y-2 text-sm">
          {messages.map((msg) => (
            <div key={msg.id} className="animate-fadeIn">
              <span className="text-neonDim">[{new Date(msg.createdAt).toLocaleTimeString()}]</span>{' '}
              <span className={msg.type === 'system' ? 'text-yellow-300' : 'text-neon'}>{msg.from}</span>: {msg.content}
              {msg.selfDestructAt ? <span className="text-red-400"> [self-destruct]</span> : null}
            </div>
          ))}
          {typing.length > 0 ? <div className="text-neonDim">typing: {typing.join(', ')}</div> : null}
        </div>

        <form onSubmit={onSubmit} className="pt-2 border-t border-neon/30 flex items-center gap-2">
          <span>&gt;</span>
          <input
            className="flex-1 bg-transparent outline-none"
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              getSocket().emit('chat:typing', { active: e.target.value.length > 0 });
            }}
            placeholder="Type /help for commands"
          />
          <span className="inline-block h-5 w-2 bg-neon animate-blink" />
        </form>
      </section>
    </main>
  );
}
