import { useState, useEffect, useRef, type FormEvent } from 'react';
import type { Socket } from 'socket.io-client';
import type { ChatMessage } from '@/types';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Send } from 'lucide-react';

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
    <div className="flex h-full flex-col border-t border-border">
      <div className="border-b border-border px-4 py-2">
        <h3 className="text-sm font-semibold text-foreground">Live Chat</h3>
      </div>
      <div className="flex-1 overflow-y-auto p-3 space-y-1">
        {messages.length === 0 && (
          <p className="text-center text-sm text-muted-foreground py-8">No messages yet. Say hello!</p>
        )}
        {messages.map(msg => (
          <div key={msg.id} className="text-sm leading-relaxed">
            <span className="font-semibold text-primary">{msg.displayName}</span>{' '}
            <span className="text-foreground">{msg.content}</span>
          </div>
        ))}
        <div ref={messagesEndRef} />
      </div>
      <form onSubmit={handleSubmit} className="flex gap-2 border-t border-border p-3">
        <Input
          value={input}
          onChange={e => setInput(e.target.value)}
          placeholder="Type a message..."
          maxLength={500}
          className="flex-1"
        />
        <Button type="submit" size="icon" variant="default">
          <Send className="h-4 w-4" />
        </Button>
      </form>
    </div>
  );
}
