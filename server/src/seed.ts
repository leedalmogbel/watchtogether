import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { db } from './db/index.js';
import { users, channels, playlistItems, playbackState, chatMessages } from './db/schema.js';

async function seed() {
  console.log('Seeding database...');

  // Clear existing data in reverse FK order
  await db.delete(chatMessages);
  await db.delete(playbackState);
  await db.delete(playlistItems);
  await db.delete(channels);
  await db.delete(users);
  console.log('Cleared existing data');

  // Create admin user
  const passwordHash = await bcrypt.hash('admin123', 10);
  const [admin] = await db.insert(users).values({
    email: 'admin@watchtogether.com',
    passwordHash,
    displayName: 'Admin',
    role: 'admin',
  }).returning();
  console.log('Created admin user:', admin.email);

  // Create a channel
  const [channel] = await db.insert(channels).values({
    name: 'Main Room',
    slug: 'main-room',
    createdBy: admin.id,
  }).returning();
  console.log('Created channel:', channel.slug);

  // Add playlist items (example YouTube videos)
  const videos = [
    { title: 'Big Buck Bunny', videoUrl: 'https://www.youtube.com/watch?v=aqz-KE-bpKQ', position: 0 },
    { title: 'Sintel', videoUrl: 'https://www.youtube.com/watch?v=eRsGyueVLvQ', position: 1 },
    { title: 'Tears of Steel', videoUrl: 'https://www.youtube.com/watch?v=R6MlUcmOul8', position: 2 },
  ];

  for (const video of videos) {
    await db.insert(playlistItems).values({
      channelId: channel.id,
      title: video.title,
      videoUrl: video.videoUrl,
      videoSource: 'youtube',
      position: video.position,
    });
  }
  console.log('Added', videos.length, 'playlist items');

  // Create initial playback state
  await db.insert(playbackState).values({
    channelId: channel.id,
  });
  console.log('Created playback state');

  console.log('\nSeed complete!');
  console.log('Admin login: admin@watchtogether.com / admin123');
  console.log('Channel URL: /channel/main-room');
  process.exit(0);
}

seed().catch(err => {
  console.error('Seed failed:', err);
  process.exit(1);
});
