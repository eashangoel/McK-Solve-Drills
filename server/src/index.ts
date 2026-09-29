import { fileURLToPath } from 'node:url';
import path from 'node:path';
import dotenv from 'dotenv';

// `npm run dev --workspace server` runs with server/ as the cwd, so dotenv's
// default cwd-relative lookup misses the .env file at the repo root. Resolve
// it explicitly from this file's own location instead.
dotenv.config({ path: path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../../.env') });

const { appReady } = await import('./app.js');

const PORT = Number(process.env.PORT) || 3001;

const app = await appReady;

app.listen(PORT, () => {
  console.log(`[server] http://localhost:${PORT}`);
});
