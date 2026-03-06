import { Router } from 'express';
import { db } from '../db/index.js';
import { channels, playlistItems, playbackState } from '../db/schema.js';
import { eq, asc } from 'drizzle-orm';
import { authenticate, requireAdmin } from '../middleware/auth.js';
import { z } from 'zod';

const router = Router();

const createChannelSchema = z.object({
  name: z.string().min(1).max(255),
  slug: z.string().min(1).max(255).regex(/^[a-z0-9-]+$/).optional(),
});

const updateChannelSchema = z.object({
  name: z.string().min(1).max(255).optional(),
  isActive: z.boolean().optional(),
});

function slugify(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
}

// List active channels
router.get('/', async (_req, res) => {
  try {
    const result = await db.select().from(channels).where(eq(channels.isActive, true));
    res.json({ channels: result });
  } catch (err) {
    console.error('List channels error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Get channel by slug (with playlist and playback state)
router.get('/:slug', async (req, res) => {
  try {
    const slug = req.params.slug as string;
    const [channel] = await db.select().from(channels).where(eq(channels.slug, slug)).limit(1);
    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    const playlist = await db.select().from(playlistItems)
      .where(eq(playlistItems.channelId, channel.id))
      .orderBy(asc(playlistItems.position));

    const [state] = await db.select().from(playbackState)
      .where(eq(playbackState.channelId, channel.id))
      .limit(1);

    res.json({ channel, playlist, playbackState: state || null });
  } catch (err) {
    console.error('Get channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Create channel (admin only)
router.post('/', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = createChannelSchema.parse(req.body);
    const slug = body.slug || slugify(body.name);

    const existing = await db.select().from(channels).where(eq(channels.slug, slug)).limit(1);
    if (existing.length > 0) {
      res.status(409).json({ error: 'Channel slug already exists' });
      return;
    }

    const [channel] = await db.insert(channels).values({
      name: body.name,
      slug,
      createdBy: req.user!.userId,
    }).returning();

    // Create initial playback state
    await db.insert(playbackState).values({
      channelId: channel.id,
    });

    res.status(201).json({ channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Create channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

// Update channel (admin only)
router.patch('/:slug', authenticate, requireAdmin, async (req, res) => {
  try {
    const body = updateChannelSchema.parse(req.body);

    const slug = req.params.slug as string;
    const [channel] = await db.update(channels)
      .set({ ...body, updatedAt: new Date() })
      .where(eq(channels.slug, slug))
      .returning();

    if (!channel) {
      res.status(404).json({ error: 'Channel not found' });
      return;
    }

    res.json({ channel });
  } catch (err) {
    if (err instanceof z.ZodError) {
      res.status(400).json({ error: err.errors });
      return;
    }
    console.error('Update channel error:', err);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;
