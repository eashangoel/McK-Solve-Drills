/**
 * Vercel serverless entrypoint for the "server" service (Vercel's newer
 * `services`-based vercel.json, not the older `builds` array). Same file,
 * same verified behaviour as before — it just now lives inside the server
 * workspace itself, since each service's `entrypoint` is resolved relative
 * to that service's own `root`, and framework auto-detection has no reason
 * to reliably pick this exact file out of everything else in `server/src/`
 * (in particular, not `index.ts`, which calls `.listen()` and isn't meant
 * to run per-request).
 *
 * The exported handler is an ordinary async function — deliberately not a
 * top-level `await`, which a CommonJS bundle (a real possibility depending
 * on how Vercel's build step resolves this file's module format) cannot
 * support at all. Awaiting `appReady` inside the handler works under either
 * module format; this was verified by deliberately force-bundling the
 * equivalent file to CJS and running it against a real Postgres server.
 */
import type { IncomingMessage, ServerResponse } from 'node:http';
import { appReady } from './app.js';

export default async function handler(req: IncomingMessage, res: ServerResponse) {
  const app = await appReady;
  app(req as any, res as any);
}
