import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { createServer } from 'http';
import { setupSocket } from './socket/index.js';
import authRoutes from './routes/auth.js';
import channelRoutes from './routes/channels.js';
import playlistRoutes from './routes/playlist.js';

const app = express();
const httpServer = createServer(app);
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: process.env.CLIENT_URL || 'http://localhost:5173' }));
app.use(express.json());

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok' });
});

app.use('/api/auth', authRoutes);
app.use('/api/channels', channelRoutes);
app.use('/api/channels/:slug/playlist', playlistRoutes);

setupSocket(httpServer);

httpServer.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});
