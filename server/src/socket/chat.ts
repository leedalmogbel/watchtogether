import { Socket } from 'socket.io';
import { db } from '../db/index.js';
import { chatMessages, users, channels } from '../db/schema.js';
import { eq, desc } from 'drizzle-orm';
import { io } from './index.js';

export function setupChat(socket: Socket, channelSlug: string) {
  const userId = socket.data.user.userId;

  // Send chat history on join (last 50 messages)
  sendChatHistory(socket, channelSlug);

  // Handle incoming messages
  socket.on('chat:message', async (data: { content: string }) => {
    if (!data.content || data.content.trim().length === 0) return;
    if (data.content.length > 500) return;

    try {
      const [channel] = await db.select().from(channels).where(eq(channels.slug, channelSlug)).limit(1);
      if (!channel) return;

      // Persist message
      const [message] = await db.insert(chatMessages).values({
        channelId: channel.id,
        userId,
        content: data.content.trim(),
      }).returning();

      // Get user display name
      const [user] = await db.select({
        displayName: users.displayName,
      }).from(users).where(eq(users.id, userId)).limit(1);

      // Broadcast to room
      io.to(channelSlug).emit('chat:message', {
        id: message.id,
        userId: message.userId,
        displayName: user?.displayName || 'Unknown',
        content: message.content,
        createdAt: message.createdAt,
      });
    } catch (err) {
      console.error('Chat message error:', err);
    }
  });
}

async function sendChatHistory(socket: Socket, channelSlug: string) {
  try {
    const [channel] = await db.select().from(channels).where(eq(channels.slug, channelSlug)).limit(1);
    if (!channel) return;

    const messages = await db.select({
      id: chatMessages.id,
      userId: chatMessages.userId,
      displayName: users.displayName,
      content: chatMessages.content,
      createdAt: chatMessages.createdAt,
    })
    .from(chatMessages)
    .innerJoin(users, eq(chatMessages.userId, users.id))
    .where(eq(chatMessages.channelId, channel.id))
    .orderBy(desc(chatMessages.createdAt))
    .limit(50);

    socket.emit('chat:history', { messages: messages.reverse() });
  } catch (err) {
    console.error('Chat history error:', err);
  }
}
