import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '../../types';

interface ChatProps {
  socket: Socket | null;
}

export default function Chat({ socket }: ChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState('');
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!socket) return;

    const onHistory = (data: { messages: ChatMessage[] }) => {
      setMessages(data.messages);
    };

    const onMessage = (message: ChatMessage) => {
      setMessages(prev => [...prev, message]);
    };

    socket.on('chat:history', onHistory);
    socket.on('chat:message', onMessage);

    return () => {
      socket.off('chat:history', onHistory);
      socket.off('chat:message', onMessage);
    };
  }, [socket]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!socket || !input.trim()) return;

    socket.emit('chat:message', { content: input.trim() });
    setInput('');
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
      <div style={{
        flex: 1,
        overflowY: 'auto',
        padding: 8,
        background: '#1a1a1a',
        color: '#fff',
        fontSize: 14,
      }}>
        {messages.map(msg => (
          <div key={msg.id} style={{ marginBottom: 4 }}>
            <strong style={{ color: '#6c9' }}>{msg.displayName}:</strong>{' '}
            {msg.content}
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} style={{ display: 'flex' }}>
        <input
          type="text"
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          style={{ flex: 1, padding: 8, border: 'none', outline: 'none' }}
        />
        <button type="submit" style={{ padding: '8px 16px' }}>Send</button>
      </form>
    </div>
  );
}
