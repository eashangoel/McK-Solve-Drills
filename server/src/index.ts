import express from 'express';
import cors from 'cors';
import { loadAllGames, GAMES, hasGameModule } from '@solve/shared';
import './db.js';
import { sessionsRouter } from './routes/sessions.js';
import { statsRouter } from './routes/stats.js';
import { settingsRouter } from './routes/settings.js';

const PORT = Number(process.env.PORT) || 3001;

const app = express();
app.use(cors({ origin: true }));
app.use(express.json({ limit: '4mb' }));

app.get('/api/health', (_req, res) => {
  res.json({
    ok: true,
    implemented: Object.fromEntries(GAMES.map((g) => [g, hasGameModule(g)])),
  });
});

app.use('/api/sessions', sessionsRouter);
app.use('/api/stats', statsRouter);
app.use('/api/settings', settingsRouter);

app.use((err: any, _req: express.Request, res: express.Response, _next: express.NextFunction) => {
  console.error('[server]', err);
  res.status(500).json({ error: err?.message ?? 'internal error' });
});

await loadAllGames();

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
