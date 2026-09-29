/**
 * Vercel serverless entrypoint. The exported handler is an ordinary async
 * function — deliberately not a top-level `await`, which a CommonJS bundle
 * (a real possibility depending on how `@vercel/node` resolves this file's
 * module format) cannot support at all. Awaiting `appReady` inside the
 * handler works under either module format.
 *
 * `vercel.json` routes every `/api/*` request to this one function, which
 * runs the whole Express app from `server/src/app.ts` — the same routers,
 * same database layer, same scoring logic the local dev server uses.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { appReady } from '../server/src/app.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appReady;
  app(req as any, res as any);
}
