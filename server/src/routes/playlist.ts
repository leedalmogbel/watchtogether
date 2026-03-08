import { Router } from 'express';
import { db } from '../db/index.js';
import { playlistItems, channels, playbackState } from '../db/schema.js';
import { eq, and, asc } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router({ mergeParams: true });

type SlugParams = { slug: string };

const addItemSchema = z.object({
  title: z.string().min(1).max(255),
  videoUrl: z.string().url(),
  videoSource: z.enum(['youtube', 'self_hosted']).default('youtube'),
  durationSeconds: z.number().int().positive().optional(),
});

const updateItemSchema = z.object({
  title: z.string().min(1).max(255).optional(),
  videoUrl: z.string().url().optional(),
  durationSeconds: z.number().int().positive().optional(),
});

const reorderSchema = z.object({
  itemIds: z.array(z.string().uuid()),
});

async function getChannelBySlug(slug: string) {
  const [channel] = await db.select().from(channels).where(eq(channels.slug, slug)).limit(1);
  return channel;
}

// Get playlist for channel
router.get('/', async (req, res) => {
  try {
    const channel = await getChannelBySlug((req.params as SlugParams).slug);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const items = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));

    res.json({ playlist: items });
  } catch (err) {
    console.error('Get playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Add item to playlist (admin)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = addItemSchema.parse(req.body);
    const channel = await getChannelBySlug((req.params as SlugParams).slug);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // Get next position
    const existing = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));
    const nextPosition = existing.length > 0 ? existing[existing.length - 1].position + 1 : 0;

    const [item] = await db.insert(playlistItems).values({
      channelId: channel.id,
      title: body.title,
      videoUrl: body.videoUrl,
      videoSource: body.videoSource,
      durationSeconds: body.durationSeconds ?? null,
      position: nextPosition,
    }).returning();

    res.status(201).json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Add playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update playlist item (admin)
router.patch('/:itemId', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = updateItemSchema.parse(req.body);

    const [item] = await db.update(playlistItems)
      .set(body)
      .where(eq(playlistItems.id, req.params.itemId as string))
      .returning();

    if (!item) {
      res.status(404).json({ error: 'Playlist item not found' });
      return;
    }

    res.json({ item });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Update playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Delete playlist item (admin)
router.delete('/:itemId', authenticate, requireAdmin, async (req, res) => {
  try {
    const itemId = req.params.itemId as string;
    const channel = await getChannelBySlug((req.params as SlugParams).slug);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    // Clear currentItemId if this item is currently playing
    await db.update(playbackState)
      .set({ currentItemId: null })
      .where(and(
        eq(playbackState.channelId, channel.id),
        eq(playbackState.currentItemId, itemId),
      ));

    const [item] = await db.delete(playlistItems)
      .where(eq(playlistItems.id, itemId))
      .returning();

    if (!item) {
      res.status(404).json({ error: 'Playlist item not found' });
      return;
    }

    res.json({ success: true });
  } catch (err) {
    console.error('Delete playlist item error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Reorder playlist items (admin)
router.post('/reorder', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = reorderSchema.parse(req.body);

    for (let i = 0; i < body.itemIds.length; i++) {
      await db.update(playlistItems)
        .set({ position: i })
        .where(eq(playlistItems.id, body.itemIds[i]));
    }

    const channel = await getChannelBySlug((req.params as SlugParams).slug);
    const items = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel!.id))
      .orderBy(asc(playlistItems.position));

    res.json({ playlist: items });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Reorder playlist error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
