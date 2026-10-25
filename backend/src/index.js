import http from 'node:http';
import express from 'express';
import { Server } from 'socket.io';
import { TikTokLive } from './tiktok.js';
import { MockLive } from './mock.js';

const PORT = 3000;

// Usage : npm run dev <streamer>   ou   npm run dev -- --test
// (sans `--`, npm avale --test et le met dans npm_config_test : on gère les deux)
const args = process.argv.slice(2);
const TEST = args.includes('--test') || process.env.npm_config_test === 'true';
const TIKTOK_USERNAME = args.find((a) => !a.startsWith('--'))?.replace(/^@/, '') ?? (TEST ? 'demo_live' : undefined);
if (!TIKTOK_USERNAME) {
  console.error('Usage : npm run dev <nom_du_streamer>   (ou --test pour des événements aléatoires)');
  process.exit(1);
}

const app = express();
const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

const history = []; // derniers événements, pour les nouveaux clients
const MAX_HISTORY = 200;

const live = TEST
  ? new MockLive()
  : new TikTokLive({ username: TIKTOK_USERNAME });

live.on('event', ({ raw, ...evt }) => {
  // `raw` (message complet) est omis du flux pour rester léger
  console.log(`[${evt.type}]`, JSON.stringify(evt.data));
  history.push(evt);
  if (history.length > MAX_HISTORY) history.shift();
  io.emit('tiktok:event', evt);
  io.emit(`tiktok:${evt.type}`, evt);
});

io.on('connection', (socket) => socket.emit('tiktok:history', history));

app.get('/health', (_req, res) => res.json({ ok: true, username: TIKTOK_USERNAME }));
app.get('/events', (_req, res) => res.json(history));

live.connect().catch(() => {}); // la reconnexion automatique prend le relais

server.listen(PORT, () => console.log(`Backend sur http://localhost:${PORT} — ${TEST ? 'MODE TEST (événements aléatoires)' : `live @${TIKTOK_USERNAME}`}`));

process.on('SIGINT', () => { live.stop(); process.exit(0); });
