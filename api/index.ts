/**
 * Vercel serverless entrypoint. `@vercel/node` accepts an Express app as a
 * default export directly — its `(req, res)` signature is what Vercel calls
 * per request. No `.listen()` here; the platform owns the socket.
 *
 * `vercel.json` routes every `/api/*` request to this one function, which is
 * the whole Express app from `server/src/app.ts` — the same routers, same
 * database layer, same scoring logic the local dev server uses.
 */
import { app } from '../server/src/app.js';

export default app;
