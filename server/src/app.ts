import express from 'express';
import cors from 'cors';
import { loadAllGames, GAMES, hasGameModule } from '@solve/shared';
import { dbReady } from './db.js';
import { sessionsRouter } from './routes/sessions.js';
import { statsRouter } from './routes/stats.js';
import { settingsRouter } from './routes/settings.js';

/**
 * Builds the Express app. Used both by the local dev server (`index.ts`,
 * which adds `.listen()`) and by the Vercel serverless function (`api/index.ts`,
 * which hands the app directly to the platform for each request). Kept as a
 * separate module from `index.ts` so neither entrypoint has to know about
 * the other.
 *
 * Migrations and game-module registration complete before `appReady`
 * resolves, so nothing that awaits it can hit an unready database — on
 * Vercel that cost is paid once per cold start, the same way `index.ts`
 * used to block on it before calling `.listen()`.
 *
 * Exported as a Promise rather than awaited at module top level on purpose:
 * a bundler that emits this as CommonJS (as `@vercel/node`'s build step may,
 * depending on how it resolves this file's module type) cannot support
 * top-level await at all, and would fail to build. A plain exported Promise
 * works under either module format.
 */
async function buildApp() {
  await dbReady;
  await loadAllGames();

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

  return app;
}

export const appReady = buildApp();
